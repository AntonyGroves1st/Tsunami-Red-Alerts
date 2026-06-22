import { Platform } from 'react-native';
import { Candle } from '@/utils/calculations';
import { canRequest, recordSuccess as cbSuccess, recordFailure as cbFailure } from './circuitBreaker';
import { enqueue } from './requestQueue';

const BINANCE_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  MBT: 'BTCUSDT',
  ETH: 'ETHUSDT',
  MET: 'ETHUSDT',
  GC: 'PAXGUSDT',
  MGC: 'PAXGUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  XRP: 'XRPUSDT',
  DOGE: 'DOGEUSDT',
  ADA: 'ADAUSDT',
  AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT',
  LINK: 'LINKUSDT',
  MATIC: 'MATICUSDT',
  ATOM: 'ATOMUSDT',
  UNI: 'UNIUSDT',
  LTC: 'LTCUSDT',
};

export function getLiveSymbols(): string[] {
  return Object.keys(BINANCE_MAP);
}

const INTERVAL_MAP: Record<string, string> = {
  '1s': '1s',
  '5s': '1m',
  '15s': '1m',
  '30s': '1m',
  '45s': '1m',
  '1m': '1m',
  '2m': '3m',
  '3m': '3m',
  '5m': '5m',
  '10m': '15m',
  '15m': '15m',
  '30m': '30m',
  '45m': '1h',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
  '1mo': '1M',
  '1y': '1M',
};

export function getBinanceSymbol(instrument: string): string | null {
  return BINANCE_MAP[instrument] ?? null;
}

export function hasLiveData(instrument: string): boolean {
  return instrument in BINANCE_MAP;
}

export function hasBinanceData(instrument: string): boolean {
  return instrument in BINANCE_MAP;
}

const REST_ENDPOINTS = [
  'https://data-api.binance.vision/api/v3',
  'https://api1.binance.com/api/v3',
  'https://api3.binance.com/api/v3',
  'https://api4.binance.com/api/v3',
  'https://api.binance.com/api/v3',
  'https://api.binance.us/api/v3',
];

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest=',
];

const WS_ENDPOINTS = [
  'wss://stream.binance.com:9443/ws',
  'wss://stream.binance.com:443/ws',
  'wss://stream.binance.us:9443/ws',
];

const REQUEST_TIMEOUT_MS = 12000;
const STALE_DATA_THRESHOLD_MS = 120000;
const WS_HEARTBEAT_INTERVAL_MS = 45000;
const WS_HEARTBEAT_TIMEOUT_MS = 20000;
const CB_NAME_REST = 'binance-rest';
const CB_NAME_WS = 'binance-ws';
const MAX_CONCURRENT_ENDPOINT_TRIES = 3;

let lastWorkingEndpoint = '';
let lastWorkingProxyIdx = -1;
let consecutiveFailures = 0;

export interface ApiHealthStatus {
  isHealthy: boolean;
  consecutiveFailures: number;
  lastError: string | null;
  lastSuccessTime: number | null;
}

export interface TickerData {
  price: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  bidPrice: number;
  askPrice: number;
}

export interface RecentTrade {
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
}

let healthStatus: ApiHealthStatus = {
  isHealthy: true,
  consecutiveFailures: 0,
  lastError: null,
  lastSuccessTime: null,
};

export interface StaleDataWarning {
  type: 'klines' | 'ticker' | 'trades' | 'websocket';
  instrument: string;
  lastUpdateMs: number;
  thresholdMs: number;
}

const lastDataTimestamps: Record<string, number> = {};
const staleWarnings: StaleDataWarning[] = [];

export function getApiHealth(): ApiHealthStatus {
  return { ...healthStatus };
}

export function getStaleWarnings(): StaleDataWarning[] {
  return [...staleWarnings];
}

function trackDataFreshness(key: string, instrument: string, type: StaleDataWarning['type']): void {
  lastDataTimestamps[key] = Date.now();
  const idx = staleWarnings.findIndex(w => w.type === type && w.instrument === instrument);
  if (idx >= 0) staleWarnings.splice(idx, 1);
}

function checkStaleness(key: string, instrument: string, type: StaleDataWarning['type']): void {
  const last = lastDataTimestamps[key];
  if (last && Date.now() - last > STALE_DATA_THRESHOLD_MS) {
    const exists = staleWarnings.some(w => w.type === type && w.instrument === instrument);
    if (!exists) {
      staleWarnings.push({ type, instrument, lastUpdateMs: last, thresholdMs: STALE_DATA_THRESHOLD_MS });
      console.log(`[BinanceAPI] STALE DATA WARNING: ${type} for ${instrument} last updated ${Math.round((Date.now() - last) / 1000)}s ago`);
    }
  }
}

function markSuccess() {
  consecutiveFailures = 0;
  healthStatus = {
    isHealthy: true,
    consecutiveFailures: 0,
    lastError: null,
    lastSuccessTime: Date.now(),
  };
  cbSuccess(CB_NAME_REST);
}

function markFailure(error: string) {
  consecutiveFailures++;
  healthStatus = {
    isHealthy: consecutiveFailures < 3,
    consecutiveFailures,
    lastError: error,
    lastSuccessTime: healthStatus.lastSuccessTime,
  };
  cbFailure(CB_NAME_REST, error);
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildProxiedUrl(proxyIdx: number, targetUrl: string): string {
  const proxy = CORS_PROXIES[proxyIdx];
  if (!proxy) return targetUrl;
  return `${proxy}${encodeURIComponent(targetUrl)}`;
}

async function binanceFetch(path: string): Promise<any> {
  if (!canRequest(CB_NAME_REST, { failureThreshold: 20, resetTimeoutMs: 10000 })) {
    console.log('[BinanceAPI] Circuit breaker OPEN, skipping request:', path.substring(0, 50));
    return null;
  }

  if (lastWorkingEndpoint) {
    try {
      let url: string;
      if (lastWorkingProxyIdx >= 0 && Platform.OS === 'web') {
        url = buildProxiedUrl(lastWorkingProxyIdx, lastWorkingEndpoint + path);
      } else {
        url = `${lastWorkingEndpoint}${path}`;
      }
      console.log('[BinanceAPI] Trying cached endpoint:', url.substring(0, 80));
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        console.log('[BinanceAPI] SUCCESS (cached endpoint)');
        markSuccess();
        return data;
      }
      console.log('[BinanceAPI] Cached endpoint returned status:', res.status);
    } catch (err: any) {
      console.log('[BinanceAPI] Cached endpoint failed:', err?.message ?? 'error');
    }
    lastWorkingEndpoint = '';
    lastWorkingProxyIdx = -1;
  }

  const shuffledEndpoints = [...REST_ENDPOINTS].sort(() => Math.random() - 0.5);
  const endpointsToTry = shuffledEndpoints.slice(0, MAX_CONCURRENT_ENDPOINT_TRIES);

  if (Platform.OS !== 'web') {
    for (const endpoint of endpointsToTry) {
      const directUrl = `${endpoint}${path}`;
      try {
        console.log('[BinanceAPI] Trying direct:', directUrl.substring(0, 70));
        const res = await fetchWithTimeout(directUrl);
        if (res.ok) {
          const data = await res.json();
          lastWorkingEndpoint = endpoint;
          lastWorkingProxyIdx = -1;
          console.log('[BinanceAPI] SUCCESS direct:', endpoint);
          markSuccess();
          return data;
        }
        if (res.status === 429 || res.status === 418 || res.status === 451) {
          console.log(`[BinanceAPI] Blocked/rate-limited (${res.status}), trying next`);
          continue;
        }
      } catch (err: any) {
        console.log('[BinanceAPI] Direct failed:', err?.name === 'AbortError' ? 'Timeout' : (err?.message ?? 'error'));
      }
    }
  } else {
    const racePromises: Promise<{ data: any; endpoint: string; proxyIdx: number } | null>[] = [];

    for (const endpoint of endpointsToTry) {
      const directUrl = `${endpoint}${path}`;
      racePromises.push(
        fetchWithTimeout(directUrl)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              return { data, endpoint, proxyIdx: -1 };
            }
            return null;
          })
          .catch(() => null)
      );
    }

    for (let proxyIdx = 0; proxyIdx < CORS_PROXIES.length; proxyIdx++) {
      const endpoint = REST_ENDPOINTS[0];
      const target = `${endpoint}${path}`;
      const proxiedUrl = buildProxiedUrl(proxyIdx, target);
      racePromises.push(
        fetchWithTimeout(proxiedUrl)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              return { data, endpoint, proxyIdx };
            }
            return null;
          })
          .catch(() => null)
      );
    }

    try {
      const results = await Promise.allSettled(racePromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          lastWorkingEndpoint = result.value.endpoint;
          lastWorkingProxyIdx = result.value.proxyIdx;
          console.log('[BinanceAPI] SUCCESS via', result.value.proxyIdx >= 0 ? `proxy ${result.value.proxyIdx}` : 'direct', ':', result.value.endpoint);
          markSuccess();
          return result.value.data;
        }
      }
    } catch (err: any) {
      console.log('[BinanceAPI] Race failed:', err?.message ?? 'error');
    }
  }

  markFailure('All endpoints failed');
  console.log('[BinanceAPI] All endpoints exhausted');
  return null;
}

const pendingRequests = new Map<string, Promise<any>>();

function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
}

export async function fetchKlines(
  instrument: string,
  timeframe: string,
  limit: number = 200,
): Promise<Candle[] | null> {
  const symbol = BINANCE_MAP[instrument];
  const interval = INTERVAL_MAP[timeframe];
  if (!symbol || !interval) return null;

  checkStaleness(`klines:${instrument}`, instrument, 'klines');

  return dedup(`klines:${symbol}:${interval}:${limit}`, async () => {
    return enqueue('binance', async () => {
      try {
        const data = await binanceFetch(
          `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        );
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('[BinanceAPI] Invalid or empty klines response');
          return null;
        }

        const candles = data.map((k: any[]) => ({
          o: parseFloat(k[1]),
          h: parseFloat(k[2]),
          l: parseFloat(k[3]),
          c: parseFloat(k[4]),
          v: parseFloat(k[5]),
          t: k[0] as number,
        }));

        const valid = candles.filter(
          (c: Candle) =>
            isFinite(c.o) && isFinite(c.h) && isFinite(c.l) && isFinite(c.c) && c.h >= c.l && c.o > 0 && c.h > 0 && c.l > 0 && c.c > 0,
        );

        if (valid.length < candles.length) {
          console.log(`[BinanceAPI] Filtered ${candles.length - valid.length} invalid candles`);
        }

        for (let i = 1; i < valid.length; i++) {
          if (valid[i].t <= valid[i - 1].t) {
            console.log('[BinanceAPI] Warning: non-monotonic timestamps in candles');
            break;
          }
        }

        if (valid.length > 0) {
          trackDataFreshness(`klines:${instrument}`, instrument, 'klines');
        }

        return valid.length > 0 ? valid : null;
      } catch (err: any) {
        console.log('[BinanceAPI] Klines error:', err?.message ?? err);
        markFailure(err?.message ?? 'Unknown error');
        return null;
      }
    }, { priority: 5 });
  });
}

export async function fetchTickerPrice(instrument: string): Promise<number | null> {
  const symbol = BINANCE_MAP[instrument];
  if (!symbol) return null;

  checkStaleness(`ticker:${instrument}`, instrument, 'ticker');

  return dedup(`ticker:${symbol}`, async () => {
    return enqueue('binance', async () => {
      try {
        const data = await binanceFetch(`/ticker/price?symbol=${symbol}`);
        if (!data) return null;
        const price = parseFloat(data.price);
        if (!isFinite(price) || price <= 0) return null;
        trackDataFreshness(`ticker:${instrument}`, instrument, 'ticker');
        return price;
      } catch (err: any) {
        console.log('[BinanceAPI] Ticker error:', err?.message ?? err);
        return null;
      }
    }, { priority: 8 });
  });
}

export async function fetch24hTicker(instrument: string): Promise<TickerData | null> {
  const symbol = BINANCE_MAP[instrument];
  if (!symbol) return null;

  return dedup(`ticker24h:${symbol}`, async () => {
    return enqueue('binance', async () => {
      try {
        const data = await binanceFetch(`/ticker/24hr?symbol=${symbol}`);
        if (!data) return null;

        const tickerData: TickerData = {
          price: parseFloat(data.lastPrice),
          high24h: parseFloat(data.highPrice),
          low24h: parseFloat(data.lowPrice),
          volume24h: parseFloat(data.volume),
          priceChange24h: parseFloat(data.priceChange),
          priceChangePercent24h: parseFloat(data.priceChangePercent),
          bidPrice: parseFloat(data.bidPrice),
          askPrice: parseFloat(data.askPrice),
        };

        const allFieldsValid = [tickerData.price, tickerData.high24h, tickerData.low24h, tickerData.volume24h, tickerData.bidPrice, tickerData.askPrice]
          .every(v => isFinite(v));

        if (!allFieldsValid || tickerData.price <= 0) {
          console.log('[BinanceAPI] Invalid 24h ticker data — one or more fields NaN');
          return null;
        }

        if (tickerData.high24h < tickerData.low24h) {
          console.log('[BinanceAPI] Warning: high24h < low24h, data integrity issue');
        }

        if (tickerData.bidPrice > tickerData.askPrice) {
          console.log('[BinanceAPI] Warning: bid > ask, crossed spread detected');
        }

        trackDataFreshness(`ticker:${instrument}`, instrument, 'ticker');
        console.log('[BinanceAPI] 24h ticker loaded for', symbol, 'price:', tickerData.price);
        return tickerData;
      } catch (err: any) {
        console.log('[BinanceAPI] 24h ticker error:', err?.message ?? err);
        return null;
      }
    }, { priority: 7 });
  });
}

export async function fetchRecentTrades(instrument: string, limit: number = 20): Promise<RecentTrade[] | null> {
  const symbol = BINANCE_MAP[instrument];
  if (!symbol) return null;

  return dedup(`trades:${symbol}:${limit}`, async () => {
    return enqueue('binance', async () => {
      try {
        const data = await binanceFetch(`/trades?symbol=${symbol}&limit=${limit}`);
        if (!data || !Array.isArray(data)) {
          console.log('[BinanceAPI] Invalid trades response');
          return null;
        }

        const trades: RecentTrade[] = data.map((t: any) => ({
          price: parseFloat(t.price),
          qty: parseFloat(t.qty),
          time: typeof t.time === 'number' ? t.time : Date.now(),
          isBuyerMaker: Boolean(t.isBuyerMaker),
        })).filter((t: RecentTrade) => isFinite(t.price) && isFinite(t.qty) && t.price > 0 && t.qty > 0);

        if (trades.length > 0) {
          trackDataFreshness(`trades:${instrument}`, instrument, 'trades');
        }

        console.log('[BinanceAPI] Got', trades.length, 'recent trades for', symbol);
        return trades;
      } catch (err: any) {
        console.log('[BinanceAPI] Trades error:', err?.message ?? err);
        return null;
      }
    }, { priority: 3 });
  });
}

export type WebSocketCallback = (data: {
  price: number;
  bidPrice: number;
  askPrice: number;
  symbol: string;
}) => void;

let activeWs: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wsHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
let wsLastMessageTime = 0;
let wsEndpointIdx = 0;
let wsReconnectCount = 0;
const WS_MAX_RECONNECTS = 20;

export function connectWebSocket(
  instrument: string,
  onMessage: WebSocketCallback,
  onError?: (error: string) => void,
  onConnected?: () => void,
): () => void {
  const symbol = BINANCE_MAP[instrument];
  if (!symbol) {
    console.log('[BinanceWS] No symbol mapping for', instrument);
    return () => {};
  }

  const streamName = symbol.toLowerCase();
  let stopped = false;

  function tryConnect() {
    if (stopped) return;

    if (activeWs) {
      try { activeWs.close(); } catch (_e) { /* ignore */ }
      activeWs = null;
    }

    const endpoint = WS_ENDPOINTS[wsEndpointIdx % WS_ENDPOINTS.length];
    const wsUrl = `${endpoint}/${streamName}@ticker`;

    console.log('[BinanceWS] Connecting to', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      activeWs = ws;

      ws.onopen = () => {
        console.log('[BinanceWS] Connected to', streamName);
        wsEndpointIdx = wsEndpointIdx % WS_ENDPOINTS.length;
        wsReconnectCount = 0;
        wsLastMessageTime = Date.now();
        markSuccess();
        cbSuccess(CB_NAME_WS);
        onConnected?.();

        if (wsHeartbeatTimer) clearInterval(wsHeartbeatTimer);
        wsHeartbeatTimer = setInterval(() => {
          if (stopped) return;
          const silentMs = Date.now() - wsLastMessageTime;
          if (silentMs > WS_HEARTBEAT_TIMEOUT_MS) {
            console.log(`[BinanceWS] No data for ${Math.round(silentMs / 1000)}s, reconnecting...`);
            checkStaleness(`ws:${instrument}`, instrument, 'websocket');
            try { ws.close(4000, 'heartbeat timeout'); } catch (_e) { /* ignore */ }
          }
        }, WS_HEARTBEAT_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        wsLastMessageTime = Date.now();
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.c && msg.b && msg.a) {
            const price = parseFloat(msg.c);
            const bidPrice = parseFloat(msg.b);
            const askPrice = parseFloat(msg.a);

            if (!isFinite(price) || !isFinite(bidPrice) || !isFinite(askPrice) || price <= 0) {
              console.log('[BinanceWS] Received invalid price data, skipping');
              return;
            }

            trackDataFreshness(`ws:${instrument}`, instrument, 'websocket');
            onMessage({
              price,
              bidPrice,
              askPrice,
              symbol: msg.s ?? symbol,
            });
          }
        } catch (err) {
          console.log('[BinanceWS] Parse error:', err);
        }
      };

      ws.onerror = (event: any) => {
        console.log('[BinanceWS] Error on', endpoint, event?.message ?? '');
        onError?.('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('[BinanceWS] Closed:', event.code, event.reason);
        activeWs = null;
        if (wsHeartbeatTimer) { clearInterval(wsHeartbeatTimer); wsHeartbeatTimer = null; }

        if (!stopped && event.code !== 1000) {
          wsReconnectCount++;
          if (wsReconnectCount > WS_MAX_RECONNECTS) {
            console.log(`[BinanceWS] Max reconnects (${WS_MAX_RECONNECTS}) reached, stopping`);
            cbFailure(CB_NAME_WS, 'Max reconnects exceeded');
            onError?.('WebSocket max reconnects exceeded — please restart manually');
            return;
          }
          wsEndpointIdx++;
          const delay = Math.min(2000 * Math.pow(1.5, Math.min(wsReconnectCount, 8)), 30000);
          console.log(`[BinanceWS] Reconnect ${wsReconnectCount}/${WS_MAX_RECONNECTS} in ${Math.round(delay)}ms`);
          wsReconnectTimer = setTimeout(tryConnect, delay);
        }
      };
    } catch (err: any) {
      console.log('[BinanceWS] Create error:', err?.message);
      if (!stopped) {
        wsEndpointIdx++;
        wsReconnectTimer = setTimeout(tryConnect, 3000);
      }
    }
  }

  tryConnect();

  return () => {
    console.log('[BinanceWS] Cleanup');
    stopped = true;
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = null;
    }
    if (wsHeartbeatTimer) {
      clearInterval(wsHeartbeatTimer);
      wsHeartbeatTimer = null;
    }
    if (activeWs) {
      try { activeWs.close(1000); } catch (_e) { /* ignore */ }
      activeWs = null;
    }
  };
}

export function resetApiState() {
  lastWorkingEndpoint = '';
  lastWorkingProxyIdx = -1;
  consecutiveFailures = 0;
  wsEndpointIdx = 0;
  wsReconnectCount = 0;
  wsLastMessageTime = 0;
  healthStatus = {
    isHealthy: true,
    consecutiveFailures: 0,
    lastError: null,
    lastSuccessTime: null,
  };
  pendingRequests.clear();
  staleWarnings.length = 0;

  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (wsHeartbeatTimer) {
    clearInterval(wsHeartbeatTimer);
    wsHeartbeatTimer = null;
  }
  if (activeWs) {
    try { activeWs.close(1000); } catch (_e) { /* ignore */ }
    activeWs = null;
  }

  console.log('[BinanceAPI] State reset');
}
