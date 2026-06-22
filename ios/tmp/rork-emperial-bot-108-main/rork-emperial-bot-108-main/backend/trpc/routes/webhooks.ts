import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export interface ServerWebhookConfig {
  id: string;
  name: string;
  url: string;
  method: "POST" | "GET";
  headers: Record<string, string>;
  enabled: boolean;
  lastUsed: string | null;
  successCount: number;
  failCount: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  url: string;
  method: string;
  payload: string;
  statusCode: number | null;
  success: boolean;
  error: string | null;
  responseTimeMs: number;
  timestamp: string;
}

const webhookConfigs: ServerWebhookConfig[] = [];
const webhookDeliveries: WebhookDelivery[] = [];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const webhooksRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        url: z.string().url(),
        method: z.enum(["POST", "GET"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const config: ServerWebhookConfig = {
        id: generateId(),
        name: input.name,
        url: input.url,
        method: input.method ?? "POST",
        headers: (input.headers ?? {}) as Record<string, string>,
        enabled: true,
        lastUsed: null,
        successCount: 0,
        failCount: 0,
        createdAt: new Date().toISOString(),
      };

      webhookConfigs.unshift(config);
      console.log("[Webhooks] Created:", config.id, config.name);
      return config;
    }),

  list: publicProcedure.query(() => {
    return { webhooks: webhookConfigs, total: webhookConfigs.length };
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        method: z.enum(["POST", "GET"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      const config = webhookConfigs.find((w) => w.id === input.id);
      if (!config) {
        throw new Error("Webhook config not found");
      }
      if (input.name !== undefined) config.name = input.name;
      if (input.url !== undefined) config.url = input.url;
      if (input.method !== undefined) config.method = input.method;
      if (input.headers !== undefined) config.headers = input.headers as Record<string, string>;
      if (input.enabled !== undefined) config.enabled = input.enabled;

      console.log("[Webhooks] Updated:", config.id);
      return config;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const idx = webhookConfigs.findIndex((w) => w.id === input.id);
      if (idx === -1) {
        throw new Error("Webhook config not found");
      }
      const [removed] = webhookConfigs.splice(idx, 1);
      console.log("[Webhooks] Deleted:", removed.id);
      return { success: true, id: removed.id };
    }),

  send: publicProcedure
    .input(
      z.object({
        webhookId: z.string().optional(),
        url: z.string().url().optional(),
        method: z.enum(["POST", "GET"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        payload: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      let targetUrl = input.url;
      let targetMethod = input.method ?? "POST";
      let targetHeaders: Record<string, string> = (input.headers ?? {}) as Record<string, string>;

      if (input.webhookId) {
        const config = webhookConfigs.find((w) => w.id === input.webhookId);
        if (config) {
          targetUrl = targetUrl ?? config.url;
          targetMethod = config.method;
          targetHeaders = { ...config.headers, ...targetHeaders };
        }
      }

      if (!targetUrl) {
        throw new Error("No webhook URL provided");
      }

      const start = Date.now();
      let statusCode: number | null = null;
      let success = false;
      let error: string | null = null;

      try {
        const fetchOptions: RequestInit = {
          method: targetMethod,
          headers: {
            "Content-Type": "application/json",
            ...targetHeaders,
          },
        };

        if (targetMethod === "POST") {
          fetchOptions.body = input.payload;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(targetUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        statusCode = res.status;
        success = res.ok;
        console.log("[Webhooks] Sent to", targetUrl, "status:", statusCode);
      } catch (err: any) {
        error = err?.name === "AbortError" ? "Timeout" : (err?.message ?? "Unknown error");
        console.log("[Webhooks] Send error:", error);
      }

      const responseTimeMs = Date.now() - start;

      const delivery: WebhookDelivery = {
        id: generateId(),
        webhookId: input.webhookId ?? "",
        url: targetUrl,
        method: targetMethod,
        payload: input.payload,
        statusCode,
        success,
        error,
        responseTimeMs,
        timestamp: new Date().toISOString(),
      };

      webhookDeliveries.unshift(delivery);
      if (webhookDeliveries.length > 500) {
        webhookDeliveries.splice(500);
      }

      if (input.webhookId) {
        const config = webhookConfigs.find((w) => w.id === input.webhookId);
        if (config) {
          config.lastUsed = delivery.timestamp;
          if (success) config.successCount++;
          else config.failCount++;
        }
      }

      return delivery;
    }),

  test: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        method: z.enum(["POST", "GET"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const testPayload = JSON.stringify({
        test: true,
        message: "FuturesBot webhook test",
        timestamp: new Date().toISOString(),
        instrument: "BTC",
        price: 69420.0,
        condition: "Test Signal",
      });

      const start = Date.now();
      let statusCode: number | null = null;
      let success = false;
      let error: string | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const method = input.method ?? "POST";
        const res = await fetch(
          method === "GET"
            ? `${input.url}${input.url.includes("?") ? "&" : "?"}test=true`
            : input.url,
          {
            method,
            headers: { "Content-Type": "application/json" },
            body: method === "POST" ? testPayload : undefined,
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);
        statusCode = res.status;
        success = res.ok;
      } catch (err: any) {
        error = err?.name === "AbortError" ? "Timeout" : (err?.message ?? "Unknown error");
      }

      return {
        success,
        statusCode,
        error,
        responseTimeMs: Date.now() - start,
      };
    }),

  deliveries: publicProcedure
    .input(
      z.object({
        webhookId: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...webhookDeliveries];
      if (input?.webhookId) {
        filtered = filtered.filter((d) => d.webhookId === input.webhookId);
      }
      const limit = input?.limit ?? 50;
      return {
        deliveries: filtered.slice(0, limit),
        total: filtered.length,
      };
    }),
});
