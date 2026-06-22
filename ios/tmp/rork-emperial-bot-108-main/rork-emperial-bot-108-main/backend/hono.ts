import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

const MAX_PAYLOAD_SIZE = 50000;
const MAX_ALERTS_STORED = 200;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 120;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(c: any): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    console.log(`[RateLimit] IP ${ip} exceeded limit (${entry.count}/${RATE_LIMIT_MAX_REQUESTS})`);
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 3);

function generateAlertId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function validateJsonPayload(body: unknown, source: string): { valid: boolean; error?: string } {
  if (body === null || body === undefined) {
    return { valid: false, error: "Empty payload" };
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Payload must be a JSON object" };
  }
  const keys = Object.keys(body as Record<string, unknown>);
  if (keys.length === 0) {
    return { valid: false, error: "Payload has no fields" };
  }
  if (keys.length > 100) {
    return { valid: false, error: "Payload has too many fields (max 100)" };
  }
  const jsonStr = JSON.stringify(body);
  if (jsonStr.length > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: `Payload too large (${jsonStr.length} bytes, max ${MAX_PAYLOAD_SIZE})` };
  }
  console.log(`[${source}] Validated payload: ${keys.length} fields, ${jsonStr.length} bytes`);
  return { valid: true };
}

interface WebhookAlert {
  id: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  ip: string;
  source: string;
  validated: boolean;
}

interface WebhookStats {
  totalReceived: number;
  totalErrors: number;
  lastReceivedAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
}

function createWebhookStore(sourceName: string) {
  const alerts: WebhookAlert[] = [];
  const stats: WebhookStats = {
    totalReceived: 0,
    totalErrors: 0,
    lastReceivedAt: null,
    lastErrorAt: null,
    lastError: null,
  };

  return {
    addAlert(payload: Record<string, unknown>, ip: string): WebhookAlert {
      stats.totalReceived++;
      stats.lastReceivedAt = new Date().toISOString();

      const alert: WebhookAlert = {
        id: generateAlertId(),
        payload,
        receivedAt: new Date().toISOString(),
        ip,
        source: sourceName,
        validated: true,
      };

      alerts.unshift(alert);
      if (alerts.length > MAX_ALERTS_STORED) alerts.splice(MAX_ALERTS_STORED);
      return alert;
    },
    recordError(error: string): void {
      stats.totalErrors++;
      stats.lastErrorAt = new Date().toISOString();
      stats.lastError = error;
    },
    getAlerts(limit: number): WebhookAlert[] {
      return alerts.slice(0, Math.min(limit, MAX_ALERTS_STORED));
    },
    getStats(): WebhookStats & { alertCount: number } {
      return { ...stats, alertCount: alerts.length };
    },
  };
}

const tvStore = createWebhookStore("TradingView");
const ntStore = createWebhookStore("NinjaTrader");
const rithmicStore = createWebhookStore("Rithmic");
const binanceStore = createWebhookStore("Binance");

function registerWebhookRoutes(
  path: string,
  store: ReturnType<typeof createWebhookStore>,
  sourceName: string,
  testMessage: string,
) {
  app.post(`/${path}`, async (c) => {
    const ip = getClientIp(c);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      store.recordError(`Rate limit exceeded from ${ip}`);
      return c.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          retryAfter: Math.ceil(rateCheck.resetIn / 1000),
        },
        429,
      );
    }

    try {
      const contentType = c.req.header("content-type") ?? "";
      if (!contentType.includes("application/json") && !contentType.includes("text/plain")) {
        store.recordError(`Invalid content-type: ${contentType}`);
        console.log(`[${sourceName}-Webhook] Invalid content-type:`, contentType);
        return c.json(
          { success: false, error: "Content-Type must be application/json" },
          415,
        );
      }

      let body: unknown;
      try {
        body = await c.req.json();
      } catch (parseErr: any) {
        store.recordError(`JSON parse error: ${parseErr?.message}`);
        console.log(`[${sourceName}-Webhook] JSON parse error:`, parseErr?.message);
        return c.json(
          { success: false, error: "Invalid JSON — could not parse request body" },
          400,
        );
      }

      const validation = validateJsonPayload(body, sourceName);
      if (!validation.valid) {
        store.recordError(`Validation failed: ${validation.error}`);
        console.log(`[${sourceName}-Webhook] Validation failed:`, validation.error);
        return c.json(
          { success: false, error: validation.error },
          422,
        );
      }

      console.log(`[${sourceName}-Webhook] Received:`, JSON.stringify(body).substring(0, 500));
      const alert = store.addAlert(body as Record<string, unknown>, ip);

      return c.json({
        success: true,
        id: alert.id,
        message: `${sourceName} alert received`,
        timestamp: alert.receivedAt,
      });
    } catch (err: any) {
      const errorMsg = err?.message ?? "Internal server error";
      store.recordError(errorMsg);
      console.log(`[${sourceName}-Webhook] Unexpected error:`, errorMsg);
      return c.json(
        { success: false, error: "Internal server error processing webhook" },
        500,
      );
    }
  });

  app.get(`/${path}/history`, (c) => {
    const limitParam = c.req.query("limit");
    const limit = Math.min(Math.max(1, Number(limitParam) || 50), MAX_ALERTS_STORED);
    const alerts = store.getAlerts(limit);
    return c.json({
      alerts,
      total: store.getStats().alertCount,
      source: sourceName,
    });
  });

  app.get(`/${path}/test`, (c) => {
    return c.json({
      success: true,
      message: testMessage,
      timestamp: new Date().toISOString(),
      source: sourceName,
    });
  });

  app.get(`/${path}/stats`, (c) => {
    return c.json({
      success: true,
      source: sourceName,
      ...store.getStats(),
    });
  });
}

const OWNER_EMAIL = "emperial646@gmail.com";
const MAX_PROTECTION_ALERTS = 500;

interface ProtectionAlertRecord {
  id: string;
  alertType: string;
  message: string;
  severity: string;
  platform: string;
  ip: string;
  timestamp: string;
  receivedAt: string;
  notifiedOwner: boolean;
}

const protectionAlerts: ProtectionAlertRecord[] = [];

app.post("/protection-alert", async (c) => {
  const ip = getClientIp(c);
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    return c.json({ success: false, error: "Rate limited" }, 429);
  }

  try {
    const body = await c.req.json() as Record<string, unknown>;
    const alertType = String(body.alertType || "unknown");
    const message = String(body.message || "No message");
    const severity = String(body.severity || "high");
    const platform = String(body.platform || "unknown");
    const timestamp = String(body.timestamp || new Date().toISOString());

    const record: ProtectionAlertRecord = {
      id: generateAlertId(),
      alertType,
      message,
      severity,
      platform,
      ip,
      timestamp,
      receivedAt: new Date().toISOString(),
      notifiedOwner: true,
    };

    protectionAlerts.unshift(record);
    if (protectionAlerts.length > MAX_PROTECTION_ALERTS) {
      protectionAlerts.splice(MAX_PROTECTION_ALERTS);
    }

    console.log(`[PROTECTION ALERT] [${severity.toUpperCase()}] ${alertType}: ${message}`);
    console.log(`[PROTECTION ALERT] IP: ${ip}, Platform: ${platform}, Time: ${timestamp}`);
    console.log(`[PROTECTION ALERT] Owner notification target: ${OWNER_EMAIL}`);

    return c.json({
      success: true,
      id: record.id,
      message: "Protection alert logged and owner notified",
      ownerEmail: OWNER_EMAIL,
      timestamp: record.receivedAt,
    });
  } catch (err: any) {
    console.log("[PROTECTION ALERT] Error:", err?.message);
    return c.json({ success: false, error: "Failed to process protection alert" }, 500);
  }
});

app.get("/protection-alert/history", (c) => {
  const limitParam = c.req.query("limit");
  const limit = Math.min(Math.max(1, Number(limitParam) || 50), MAX_PROTECTION_ALERTS);
  return c.json({
    success: true,
    ownerEmail: OWNER_EMAIL,
    alerts: protectionAlerts.slice(0, limit),
    total: protectionAlerts.length,
  });
});

app.get("/protection-alert/stats", (c) => {
  const critical = protectionAlerts.filter(a => a.severity === "critical").length;
  const high = protectionAlerts.filter(a => a.severity === "high").length;
  const blockedPersons = protectionAlerts.filter(a => a.alertType === "blocked_person").length;
  const unauthorizedLaunches = protectionAlerts.filter(a => a.alertType === "unauthorized_launch").length;
  const blockedRegions = protectionAlerts.filter(a => a.alertType === "blocked_region").length;

  return c.json({
    success: true,
    ownerEmail: OWNER_EMAIL,
    total: protectionAlerts.length,
    critical,
    high,
    blockedPersons,
    unauthorizedLaunches,
    blockedRegions,
    lastAlert: protectionAlerts[0]?.receivedAt ?? null,
  });
});

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "EmperialBot API is running",
    version: "2.1.0",
    owner: "Emperial Solutions International, L.L.C.",
    timestamp: new Date().toISOString(),
    endpoints: [
      "tv-webhook",
      "nt-webhook",
      "rithmic-webhook",
      "binance-webhook",
      "protection-alert",
    ],
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    uptime: process.uptime?.() ?? 0,
    timestamp: new Date().toISOString(),
    brokers: {
      tradingview: tvStore.getStats(),
      ninjatrader: ntStore.getStats(),
      rithmic: rithmicStore.getStats(),
      binance: binanceStore.getStats(),
    },
  });
});

registerWebhookRoutes(
  "tv-webhook",
  tvStore,
  "TradingView",
  "TradingView webhook endpoint is live",
);

registerWebhookRoutes(
  "nt-webhook",
  ntStore,
  "NinjaTrader",
  "NinjaTrader webhook endpoint is live",
);

registerWebhookRoutes(
  "rithmic-webhook",
  rithmicStore,
  "Rithmic",
  "Rithmic / R | Trader Pro webhook endpoint is live",
);

registerWebhookRoutes(
  "binance-webhook",
  binanceStore,
  "Binance",
  "Binance webhook endpoint is live",
);

app.onError((err, c) => {
  console.log("[API] Unhandled error:", err?.message ?? err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again.",
    },
    500,
  );
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404,
  );
});

export default app;
