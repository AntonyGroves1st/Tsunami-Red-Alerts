import { Platform } from 'react-native';
import { getState as getCBState, reset as resetCB, getAllStatuses as getCBStatuses } from './circuitBreaker';
import { getAllQueueStats } from './requestQueue';
import { getDeadLetterQueue } from './payloadValidator';

export type BrokerType = 'tradingview' | 'ninjatrader' | 'rithmic' | 'binance';

export type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'degraded' | 'disconnected' | 'error';

export interface HealthCheckResult {
  broker: BrokerType;
  status: ConnectionStatus;
  latencyMs: number;
  message: string;
  timestamp: number;
  errorCode?: number;
  retryable: boolean;
}

export interface BrokerHealth {
  broker: BrokerType;
  status: ConnectionStatus;
  lastCheck: number | null;
  lastSuccess: number | null;
  consecutiveFailures: number;
  avgLatencyMs: number;
  history: HealthCheckResult[];
}

const HEALTH_HISTORY_MAX = 20;
const FETCH_TIMEOUT_MS = 12000;
const DEGRADED_LATENCY_THRESHOLD = 3000;
const MAX_CONSECUTIVE_FAILURES_BEFORE_ERROR = 3;
const AUTO_RECOVERY_INTERVAL_MS = 60000;
const NETWORK_CHECK_URL = 'https://dns.google/resolve?name=google.com&type=A';

let networkOnline = true;
let lastNetworkCheck = 0;
let autoRecoveryTimer: ReturnType<typeof setInterval> | null = null;

const healthState: Record<BrokerType, BrokerHealth> = {
  tradingview: createDefaultHealth('tradingview'),
  ninjatrader: createDefaultHealth('ninjatrader'),
  rithmic: createDefaultHealth('rithmic'),
  binance: createDefaultHealth('binance'),
};

function createDefaultHealth(broker: BrokerType): BrokerHealth {
  return {
    broker,
    status: 'unknown',
    lastCheck: null,
    lastSuccess: null,
    consecutiveFailures: 0,
    avgLatencyMs: 0,
    history: [],
  };
}

function getWebhookTestUrl(broker: BrokerType): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return '';

  const paths: Record<BrokerType, string> = {
    tradingview: '/api/tv-webhook/test',
    ninjatrader: '/api/nt-webhook/test',
    rithmic: '/api/rithmic-webhook/test',
    binance: '/api/binance-webhook/test',
  };

  return `${base}${paths[broker]}`;
}

function getWebhookStatsUrl(broker: BrokerType): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return '';

  const paths: Record<BrokerType, string> = {
    tradingview: '/api/tv-webhook/stats',
    ninjatrader: '/api/nt-webhook/stats',
    rithmic: '/api/rithmic-webhook/stats',
    binance: '/api/binance-webhook/stats',
  };

  return `${base}${paths[broker]}`;
}

async function fetchWithTimeout(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkBrokerHealth(broker: BrokerType): Promise<HealthCheckResult> {
  const url = getWebhookTestUrl(broker);
  const state = healthState[broker];

  if (!url) {
    const result: HealthCheckResult = {
      broker,
      status: 'error',
      latencyMs: 0,
      message: 'API URL not configured',
      timestamp: Date.now(),
      retryable: false,
    };
    updateHealthState(broker, result);
    return result;
  }

  state.status = 'checking';
  const start = Date.now();

  try {
    console.log(`[BrokerHealth] Checking ${broker}...`);
    const res = await fetchWithTimeout(url);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      let message = 'Endpoint is live';
      try {
        const data = await res.json();
        message = data?.message ?? message;
      } catch {
        console.log(`[BrokerHealth] ${broker} response not JSON, but OK`);
      }

      const status: ConnectionStatus = latencyMs > DEGRADED_LATENCY_THRESHOLD ? 'degraded' : 'connected';
      const result: HealthCheckResult = {
        broker,
        status,
        latencyMs,
        message: status === 'degraded' ? `Connected but slow (${latencyMs}ms)` : message,
        timestamp: Date.now(),
        retryable: false,
      };

      console.log(`[BrokerHealth] ${broker}: ${status} in ${latencyMs}ms`);
      updateHealthState(broker, result);
      return result;
    }

    const result: HealthCheckResult = {
      broker,
      status: res.status === 429 ? 'degraded' : 'error',
      latencyMs,
      message: getHttpErrorMessage(res.status),
      timestamp: Date.now(),
      errorCode: res.status,
      retryable: [429, 500, 502, 503, 504].includes(res.status),
    };

    console.log(`[BrokerHealth] ${broker}: HTTP ${res.status} in ${latencyMs}ms`);
    updateHealthState(broker, result);
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = err?.name === 'AbortError';
    const errorMsg = isTimeout ? 'Connection timed out' : (err?.message ?? 'Network error');

    const result: HealthCheckResult = {
      broker,
      status: 'disconnected',
      latencyMs,
      message: isTimeout ? `Timed out after ${FETCH_TIMEOUT_MS / 1000}s` : `Network error: ${errorMsg}`,
      timestamp: Date.now(),
      retryable: true,
    };

    console.log(`[BrokerHealth] ${broker}: ${result.status} - ${errorMsg}`);
    updateHealthState(broker, result);
    return result;
  }
}

function updateHealthState(broker: BrokerType, result: HealthCheckResult): void {
  const state = healthState[broker];
  state.lastCheck = result.timestamp;
  state.status = result.status;

  state.history.unshift(result);
  if (state.history.length > HEALTH_HISTORY_MAX) {
    state.history.splice(HEALTH_HISTORY_MAX);
  }

  if (result.status === 'connected' || result.status === 'degraded') {
    state.lastSuccess = result.timestamp;
    state.consecutiveFailures = 0;
  } else {
    state.consecutiveFailures++;
    if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES_BEFORE_ERROR) {
      state.status = 'error';
    }
  }

  const recentSuccesses = state.history.filter(
    h => h.status === 'connected' || h.status === 'degraded'
  );
  if (recentSuccesses.length > 0) {
    state.avgLatencyMs = Math.round(
      recentSuccesses.reduce((sum, h) => sum + h.latencyMs, 0) / recentSuccesses.length
    );
  }
}

export async function checkAllBrokers(): Promise<Record<BrokerType, HealthCheckResult>> {
  const brokers: BrokerType[] = ['tradingview', 'ninjatrader', 'rithmic', 'binance'];
  const results: Record<string, HealthCheckResult> = {};

  const promises = brokers.map(async (broker) => {
    results[broker] = await checkBrokerHealth(broker);
  });

  await Promise.allSettled(promises);
  return results as Record<BrokerType, HealthCheckResult>;
}

export function getBrokerHealth(broker: BrokerType): BrokerHealth {
  return { ...healthState[broker] };
}

export function getAllBrokerHealth(): Record<BrokerType, BrokerHealth> {
  return {
    tradingview: { ...healthState.tradingview },
    ninjatrader: { ...healthState.ninjatrader },
    rithmic: { ...healthState.rithmic },
    binance: { ...healthState.binance },
  };
}

export async function fetchBrokerStats(broker: BrokerType): Promise<{
  totalReceived: number;
  totalErrors: number;
  lastReceivedAt: string | null;
} | null> {
  const url = getWebhookStatsUrl(broker);
  if (!url) return null;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (res.ok) {
      const data = await res.json();
      return {
        totalReceived: data.totalReceived ?? 0,
        totalErrors: data.totalErrors ?? 0,
        lastReceivedAt: data.lastReceivedAt ?? null,
      };
    }
    return null;
  } catch (err: any) {
    console.log(`[BrokerHealth] Stats fetch error for ${broker}:`, err?.message);
    return null;
  }
}

function getHttpErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad request \u2014 check payload format',
    401: 'Unauthorized \u2014 check API credentials',
    403: 'Forbidden \u2014 check API permissions',
    404: 'Endpoint not found \u2014 check URL',
    408: 'Request timeout \u2014 server took too long',
    415: 'Unsupported content type \u2014 ensure JSON',
    422: 'Invalid payload \u2014 check data format',
    429: 'Rate limited \u2014 too many requests',
    500: 'Server error \u2014 try again later',
    502: 'Bad gateway \u2014 server may be restarting',
    503: 'Service unavailable \u2014 server may be down',
    504: 'Gateway timeout \u2014 server overloaded',
  };
  return messages[status] ?? `HTTP ${status} error`;
}

export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(NETWORK_CHECK_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    networkOnline = res.ok;
    lastNetworkCheck = Date.now();
    console.log(`[BrokerHealth] Network check: ${networkOnline ? 'ONLINE' : 'OFFLINE'}`);
    return networkOnline;
  } catch (err: any) {
    networkOnline = false;
    lastNetworkCheck = Date.now();
    console.log('[BrokerHealth] Network check: OFFLINE -', err?.message ?? 'error');
    return false;
  }
}

export function isNetworkOnline(): boolean {
  return networkOnline;
}

export function getLastNetworkCheck(): number {
  return lastNetworkCheck;
}

export async function autoRecoverBroker(broker: BrokerType): Promise<HealthCheckResult> {
  const state = healthState[broker];

  if (state.status === 'error' || state.status === 'disconnected') {
    console.log(`[BrokerHealth] Auto-recovery attempt for ${broker}...`);

    const online = await checkNetworkConnectivity();
    if (!online) {
      console.log(`[BrokerHealth] Network offline, skipping recovery for ${broker}`);
      return {
        broker,
        status: 'disconnected',
        latencyMs: 0,
        message: 'Network offline — waiting for connectivity',
        timestamp: Date.now(),
        retryable: true,
      };
    }

    const cbState = getCBState(`${broker}-rest`);
    if (cbState === 'open') {
      resetCB(`${broker}-rest`);
      console.log(`[BrokerHealth] Reset circuit breaker for ${broker}-rest`);
    }

    return checkBrokerHealth(broker);
  }

  return checkBrokerHealth(broker);
}

export function startAutoRecovery(): void {
  if (autoRecoveryTimer) return;

  autoRecoveryTimer = setInterval(async () => {
    const brokers: BrokerType[] = ['tradingview', 'ninjatrader', 'rithmic', 'binance'];
    for (const broker of brokers) {
      const state = healthState[broker];
      if (state.status === 'error' || state.status === 'disconnected') {
        console.log(`[BrokerHealth] Auto-recovery triggered for ${broker}`);
        await autoRecoverBroker(broker);
      }
    }
  }, AUTO_RECOVERY_INTERVAL_MS);

  console.log('[BrokerHealth] Auto-recovery started');
}

export function stopAutoRecovery(): void {
  if (autoRecoveryTimer) {
    clearInterval(autoRecoveryTimer);
    autoRecoveryTimer = null;
    console.log('[BrokerHealth] Auto-recovery stopped');
  }
}

export interface SystemDiagnostics {
  networkOnline: boolean;
  lastNetworkCheck: number;
  brokerHealth: Record<BrokerType, BrokerHealth>;
  circuitBreakers: ReturnType<typeof getCBStatuses>;
  requestQueues: ReturnType<typeof getAllQueueStats>;
  deadLetterCount: number;
  timestamp: number;
}

export function getSystemDiagnostics(): SystemDiagnostics {
  return {
    networkOnline,
    lastNetworkCheck,
    brokerHealth: getAllBrokerHealth(),
    circuitBreakers: getCBStatuses(),
    requestQueues: getAllQueueStats(),
    deadLetterCount: getDeadLetterQueue().length,
    timestamp: Date.now(),
  };
}

export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return '#00C853';
    case 'degraded': return '#FFB300';
    case 'checking': return '#2196F3';
    case 'disconnected': return '#FF5252';
    case 'error': return '#FF1744';
    default: return '#9E9E9E';
  }
}

export function getStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return 'Connected';
    case 'degraded': return 'Slow';
    case 'checking': return 'Checking...';
    case 'disconnected': return 'Disconnected';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
}
