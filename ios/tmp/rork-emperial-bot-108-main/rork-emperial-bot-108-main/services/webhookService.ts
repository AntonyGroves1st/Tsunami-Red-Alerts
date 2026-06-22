import { AlertEvent, AlertRule, WebhookConfig, buildWebhookPayload } from './alertEngine';
import { validateWebhookUrl, addToDeadLetter } from './payloadValidator';
import { canRequest, recordSuccess as cbSuccess, recordFailure as cbFailure } from './circuitBreaker';
import { BrokerType } from './brokerHealthService';

const WEBHOOK_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const MAX_PAYLOAD_SIZE = 65536;
const CB_NAME = 'webhook';

interface WebhookStats {
  totalSent: number;
  totalFailed: number;
  totalRetried: number;
  lastSentAt: number | null;
  lastErrorAt: number | null;
  lastError: string | null;
}

const webhookStats: WebhookStats = {
  totalSent: 0,
  totalFailed: 0,
  totalRetried: 0,
  lastSentAt: null,
  lastErrorAt: null,
  lastError: null,
};

export function getWebhookStats(): WebhookStats {
  return { ...webhookStats };
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
  retries?: number;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = WEBHOOK_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isRetryableError(err: any): boolean {
  if (err?.name === 'AbortError') return true;
  const msg = (err?.message ?? '').toLowerCase();
  return msg.includes('network') || msg.includes('timeout') || msg.includes('econnreset') || msg.includes('econnrefused') || msg.includes('fetch failed');
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES,
): Promise<{ response: Response | null; error: string | null; retries: number }> {
  let lastError: string | null = null;
  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutMs = WEBHOOK_TIMEOUT + (attempt * 2000);
      const res = await fetchWithTimeout(url, options, timeoutMs);

      if (res.ok || !RETRYABLE_STATUS_CODES.includes(res.status)) {
        return { response: res, error: null, retries: attempt };
      }

      lastError = `HTTP ${res.status}`;
      console.log(`[Webhook] Attempt ${attempt + 1}/${maxRetries + 1} got ${res.status}, ${attempt < maxRetries ? 'retrying...' : 'giving up'}`);

      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        if (attempt < maxRetries) await delay(Math.min(waitMs, 10000));
      } else if (attempt < maxRetries) {
        await delay(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      }
      retries = attempt + 1;
    } catch (err: any) {
      const errMsg = err?.name === 'AbortError' ? 'Timeout' : (err?.message ?? 'Unknown error');
      lastError = errMsg;
      retries = attempt + 1;
      console.log(`[Webhook] Attempt ${attempt + 1}/${maxRetries + 1} error: ${errMsg}`);

      if (!isRetryableError(err) || attempt >= maxRetries) {
        return { response: null, error: errMsg, retries: attempt };
      }

      await delay(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
    }
  }

  return { response: null, error: lastError ?? 'All retries exhausted', retries };
}

function detectBrokerFromUrl(url: string): BrokerType | null {
  const lower = url.toLowerCase();
  if (lower.includes('tradingview') || lower.includes('tv-webhook')) return 'tradingview';
  if (lower.includes('ninjatrader') || lower.includes('nt-webhook')) return 'ninjatrader';
  if (lower.includes('rithmic') || lower.includes('rithmic-webhook')) return 'rithmic';
  if (lower.includes('binance') || lower.includes('binance-webhook')) return 'binance';
  return null;
}

export async function sendWebhook(
  rule: AlertRule,
  event: AlertEvent,
  webhookConfig?: WebhookConfig,
): Promise<WebhookResult> {
  const url = rule.webhookUrl || webhookConfig?.url;
  if (!url) {
    console.log('[Webhook] No URL configured for rule:', rule.name);
    return { success: false, error: 'No webhook URL', responseTime: 0, retries: 0 };
  }

  const urlValidation = validateWebhookUrl(url);
  if (!urlValidation.valid) {
    const errorMsg = urlValidation.errors.join('; ');
    console.log('[Webhook] URL validation failed:', errorMsg);
    return { success: false, error: errorMsg, responseTime: 0, retries: 0 };
  }

  if (!canRequest(CB_NAME, { failureThreshold: 10, resetTimeoutMs: 15000 })) {
    console.log('[Webhook] Circuit breaker OPEN, queuing to dead letter');
    addToDeadLetter(detectBrokerFromUrl(url) ?? 'tradingview', '', 'Circuit breaker open');
    return { success: false, error: 'Too many failures — webhook temporarily paused', responseTime: 0, retries: 0 };
  }

  const start = Date.now();
  let payload: string;
  try {
    payload = buildWebhookPayload(rule, event, rule.webhookPayload);
  } catch (err: any) {
    console.log('[Webhook] Payload build error:', err?.message);
    return { success: false, error: 'Failed to build webhook payload', responseTime: 0, retries: 0 };
  }

  if (payload.length > MAX_PAYLOAD_SIZE) {
    console.log('[Webhook] Payload too large:', payload.length, 'bytes');
    return { success: false, error: `Payload too large (${payload.length} bytes, max ${MAX_PAYLOAD_SIZE})`, responseTime: 0, retries: 0 };
  }

  try {
    JSON.parse(payload);
  } catch {
    console.log('[Webhook] Payload is not valid JSON');
    return { success: false, error: 'Webhook payload is not valid JSON', responseTime: 0, retries: 0 };
  }

  const method = webhookConfig?.method ?? 'POST';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'EmperialBot/2.0',
    ...(webhookConfig?.headers ?? {}),
  };

  try {
    console.log('[Webhook] Sending to', url.substring(0, 60), 'method:', method);

    if (method === 'GET') {
      const separator = url.includes('?') ? '&' : '?';
      const encodedPayload = encodeURIComponent(payload);
      const fullUrl = `${url}${separator}payload=${encodedPayload}`;

      const { response, error, retries } = await fetchWithRetry(fullUrl, { method: 'GET', headers });
      const responseTime = Date.now() - start;

      if (!response) {
        return { success: false, error: error ?? 'Request failed', responseTime, retries };
      }

      console.log('[Webhook] GET response:', response.status, 'in', responseTime, 'ms', retries > 0 ? `(${retries} retries)` : '');
      return { success: response.ok, statusCode: response.status, responseTime, retries };
    }

    const { response, error, retries } = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: payload,
    });

    const responseTime = Date.now() - start;

    if (!response) {
      return { success: false, error: error ?? 'Request failed', responseTime, retries };
    }

    console.log('[Webhook] POST response:', response.status, 'in', responseTime, 'ms', retries > 0 ? `(${retries} retries)` : '');

    if (response.ok) {
      webhookStats.totalSent++;
      webhookStats.lastSentAt = Date.now();
      if (retries > 0) webhookStats.totalRetried += retries;
      cbSuccess(CB_NAME);
    } else {
      webhookStats.totalFailed++;
      webhookStats.lastErrorAt = Date.now();
      webhookStats.lastError = `HTTP ${response.status}`;
      cbFailure(CB_NAME, `HTTP ${response.status}`);
      const broker = detectBrokerFromUrl(url);
      addToDeadLetter(broker ?? 'tradingview', payload, `HTTP ${response.status}`, retries);
    }

    return { success: response.ok, statusCode: response.status, responseTime, retries };
  } catch (err: any) {
    const responseTime = Date.now() - start;
    const errorMsg = err?.name === 'AbortError' ? 'Timeout' : (err?.message ?? 'Unknown error');
    console.log('[Webhook] Unhandled error:', errorMsg);
    webhookStats.totalFailed++;
    webhookStats.lastErrorAt = Date.now();
    webhookStats.lastError = errorMsg;
    cbFailure(CB_NAME, errorMsg);
    const broker = detectBrokerFromUrl(url);
    addToDeadLetter(broker ?? 'tradingview', payload, errorMsg, 0);
    return { success: false, error: errorMsg, responseTime, retries: 0 };
  }
}

export async function testWebhook(url: string, method: 'POST' | 'GET' = 'POST'): Promise<WebhookResult> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return { success: false, error: 'Invalid URL', responseTime: 0 };
  }

  const testPayload = JSON.stringify({
    test: true,
    message: 'EmperialBot webhook test',
    timestamp: new Date().toISOString(),
    instrument: 'BTC',
    price: 69420.00,
    condition: 'Test Signal',
  });

  const start = Date.now();

  try {
    console.log('[Webhook] Testing URL:', url.substring(0, 60));

    if (method === 'GET') {
      const separator = url.includes('?') ? '&' : '?';
      const { response, error, retries } = await fetchWithRetry(
        `${url}${separator}test=true`,
        { method: 'GET' },
        1,
      );
      if (!response) return { success: false, error: error ?? 'Request failed', responseTime: Date.now() - start, retries };
      return { success: response.ok, statusCode: response.status, responseTime: Date.now() - start, retries };
    }

    const { response, error, retries } = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'EmperialBot/2.0' },
        body: testPayload,
      },
      1,
    );

    if (!response) return { success: false, error: error ?? 'Request failed', responseTime: Date.now() - start, retries };
    return { success: response.ok, statusCode: response.status, responseTime: Date.now() - start, retries };
  } catch (err: any) {
    return {
      success: false,
      error: err?.name === 'AbortError' ? 'Timeout' : (err?.message ?? 'Unknown error'),
      responseTime: Date.now() - start,
    };
  }
}

export function buildTradingViewWebhookPayload(
  rule: AlertRule,
  event: AlertEvent,
): string {
  const side = ['price_above', 'ema_cross_long', 'golden_cross', 'atr_buy', 'rmp_buy', 'pressure_flip_bull', 'cloud_flip_bull', 'composite_above'].includes(rule.condition) ? 'buy' : 'sell';

  return JSON.stringify({
    ticker: rule.instrument,
    action: side,
    price: event.price,
    timestamp: new Date(event.timestamp).toISOString(),
    strategy: rule.name,
    message: event.message,
  });
}

export function buildNinjaTraderPayload(
  rule: AlertRule,
  event: AlertEvent,
): string {
  const action = ['price_above', 'ema_cross_long', 'golden_cross', 'atr_buy', 'rmp_buy', 'pressure_flip_bull', 'cloud_flip_bull', 'composite_above'].includes(rule.condition) ? 'BUY' : 'SELL';

  return JSON.stringify({
    instrument: rule.instrument,
    action,
    orderType: 'MARKET',
    quantity: 1,
    price: event.price,
    timestamp: new Date(event.timestamp).toISOString(),
    source: 'FuturesBot',
    signal: rule.name,
  });
}

export const WEBHOOK_TEMPLATES: { id: string; name: string; description: string; template: string }[] = [
  {
    id: 'default',
    name: 'Default JSON',
    description: 'Standard alert payload with all fields',
    template: '{"alert":"{{alert_name}}","instrument":"{{instrument}}","price":{{price}},"condition":"{{condition}}","message":"{{message}}","composite":{{composite}},"timestamp":"{{timestamp}}"}',
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    description: 'Compatible with TradingView webhook format',
    template: '{"ticker":"{{instrument}}","action":"buy","price":{{price}},"strategy":"{{alert_name}}","message":"{{message}}","timestamp":"{{timestamp}}"}',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Discord webhook embed format',
    template: '{"content":"**{{alert_name}}**\\n{{instrument}} — {{condition}}\\nPrice: ${{price}}\\n{{message}}"}',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slack incoming webhook format',
    template: '{"text":"*{{alert_name}}*\\n{{instrument}} — {{condition}} at ${{price}}\\n{{message}}"}',
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Telegram sendMessage format (use with bot API)',
    template: '{"chat_id":"YOUR_CHAT_ID","text":"{{alert_name}}\\n{{instrument}} {{condition}}\\nPrice: ${{price}}\\n{{message}}","parse_mode":"Markdown"}',
  },
  {
    id: 'ninjatrader',
    name: 'NinjaTrader',
    description: 'NinjaTrader order format',
    template: '{"instrument":"{{instrument}}","action":"BUY","orderType":"MARKET","quantity":1,"price":{{price}},"source":"FuturesBot","signal":"{{alert_name}}"}',
  },
  {
    id: 'rprotrader',
    name: 'R-Pro Trader',
    description: 'R-Pro Trader webhook signal format',
    template: '{"symbol":"{{instrument}}","side":"BUY","type":"MARKET","quantity":1,"price":{{price}},"stopLoss":0,"takeProfit":0,"trailingStop":false,"strategy":"{{alert_name}}","condition":"{{condition}}","message":"{{message}}","timestamp":"{{timestamp}}","source":"FuturesBot"}',
  },
];
