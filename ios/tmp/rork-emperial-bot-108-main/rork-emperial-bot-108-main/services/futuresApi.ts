import { Platform } from 'react-native';
import { Candle } from '@/utils/calculations';
import { canRequest, recordSuccess as cbSuccess, recordFailure as cbFailure } from './circuitBreaker';
import { enqueue } from './requestQueue';

const YAHOO_MAP: Record<string, string> = {
  SPX: '%5EGSPC', NDX: '%5EIXIC', DJI: '%5EDJI', RUT: '%5ERUT',
  VIX: '%5EVIX', FTSE: '%5EFTSE', DAX: '%5EGDAXI', N225: '%5EN225',
  HSI: '%5EHSI', STOXX: '%5ESTOXX50E', FCHI: '%5EFCHI',
  GSPC: '%5EGSPC', NYA: '%5ENYA', SOX: '%5ESOX',
  ES: 'ES=F', MES: 'ES=F', NQ: 'NQ=F', MNQ: 'NQ=F',
  RTY: 'RTY=F', M2K: 'RTY=F', YM: 'YM=F', MYM: 'YM=F',
  EMD: 'EMD=F', NKDI: '%5EN225',
  GC: 'GC=F', MGC: 'GC=F', SI: 'SI=F', SIL: 'SI=F',
  HG: 'HG=F', MHG: 'HG=F', PL: 'PL=F', PA: 'PA=F',
  CL: 'CL=F', MCL: 'CL=F', QM: 'CL=F', NG: 'NG=F', QG: 'NG=F',
  HO: 'HO=F', RB: 'RB=F',
  ZN: 'ZN=F', ZB: 'ZB=F', ZT: 'ZT=F', ZF: 'ZF=F',
  '6E': 'EURUSD=X', '6B': 'GBPUSD=X', '6J': 'JPY=X',
  '6C': 'CADUSD=X', '6A': 'AUDUSD=X', '6S': 'CHFUSD=X',
  '6N': 'NZDUSD=X', '6M': 'MXNUSD=X', DX: 'DX-Y.NYB',
  ZC: 'ZC=F', ZW: 'ZW=F', ZS: 'ZS=F', ZM: 'ZM=F', ZL: 'ZL=F',
  ZO: 'ZO=F', ZR: 'ZR=F', KE: 'KE=F',
  MZC: 'ZC=F', MZW: 'ZW=F', MZS: 'ZS=F',
  CC: 'CC=F', CT: 'CT=F', KC: 'KC=F', SB: 'SB=F', OJ: 'OJ=F',
  LE: 'LE=F', HE: 'HE=F', GF: 'GF=F',
  LBR: 'LBS=F',
  GE: 'GE=F', FF: 'ZQ=F', SR3: 'SR3=F',
};

const YAHOO_INTERVAL_MAP: Record<string, { interval: string; range: string }> = {
  '1s':  { interval: '1m',  range: '1d' },
  '3s':  { interval: '1m',  range: '1d' },
  '5s':  { interval: '1m',  range: '1d' },
  '15s': { interval: '1m',  range: '1d' },
  '30s': { interval: '1m',  range: '1d' },
  '45s': { interval: '1m',  range: '1d' },
  '1m':  { interval: '1m',  range: '1d' },
  '2m':  { interval: '2m',  range: '5d' },
  '3m':  { interval: '5m',  range: '5d' },
  '5m':  { interval: '5m',  range: '5d' },
  '10m': { interval: '15m', range: '5d' },
  '15m': { interval: '15m', range: '1mo' },
  '30m': { interval: '30m', range: '1mo' },
  '45m': { interval: '60m', range: '1mo' },
  '1h':  { interval: '60m', range: '3mo' },
  '2h':  { interval: '60m', range: '3mo' },
  '4h':  { interval: '60m', range: '6mo' },
  '1d':  { interval: '1d',  range: '1y' },
  '1w':  { interval: '1wk', range: '5y' },
  '1mo': { interval: '1mo', range: 'max' },
  '1y':  { interval: '1mo', range: 'max' },
};

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
];

const YAHOO_BASES = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];
const REQUEST_TIMEOUT = 15000;
const CB_NAME = 'yahoo-finance';
const STALE_THRESHOLD_MS = 180000;

let lastWorkingProxyIdx = -1;

interface PriceCache {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_TTL = 10000;

export function getYahooSymbol(instrument: string): string | null {
  return YAHOO_MAP[instrument] ?? null;
}

export function hasFuturesData(instrument: string): boolean {
  return instrument in YAHOO_MAP;
}

export function getAllFuturesSymbols(): string[] {
  return Object.keys(YAHOO_MAP);
}

function getBackendBaseUrl(): string | null {
  try {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    return url ?? null;
  } catch {
    return null;
  }
}

async function fetchViaBackendProxy(
  yahooSymbol: string,
  range: string,
  interval: string,
): Promise<{ meta: any; timestamps: number[]; quote: any } | null> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    console.log('[FuturesAPI] No backend URL configured, skipping proxy');
    return null;
  }

  try {
    const params = new URLSearchParams({
      batch: '1',
      input: JSON.stringify({
        '0': {
          json: { symbol: yahooSymbol, range, interval },
        },
      }),
    });

    const url = `${baseUrl}/api/trpc/marketProxy.yahooChart?${params.toString()}`;
    console.log('[FuturesAPI] Fetching via backend proxy for', yahooSymbol);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log('[FuturesAPI] Backend proxy returned', res.status);
      return null;
    }

    const responseData = await res.json();
    const result = Array.isArray(responseData) ? responseData[0] : responseData;
    const trpcResult = result?.result?.data?.json ?? result?.result?.data;

    if (!trpcResult?.success || !trpcResult?.data) {
      console.log('[FuturesAPI] Backend proxy returned unsuccessful result');
      return null;
    }

    console.log('[FuturesAPI] Backend proxy SUCCESS for', yahooSymbol);
    return trpcResult.data;
  } catch (err: any) {
    console.log('[FuturesAPI] Backend proxy error:', err?.message ?? 'error');
    return null;
  }
}

async function fetchViaBackendPriceProxy(yahooSymbol: string): Promise<{
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
} | null> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) return null;

  try {
    const params = new URLSearchParams({
      batch: '1',
      input: JSON.stringify({
        '0': { json: { symbol: yahooSymbol } },
      }),
    });

    const url = `${baseUrl}/api/trpc/marketProxy.yahooPrice?${params.toString()}`;
    console.log('[FuturesAPI] Price via backend proxy for', yahooSymbol);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const responseData = await res.json();
    const result = Array.isArray(responseData) ? responseData[0] : responseData;
    const trpcResult = result?.result?.data?.json ?? result?.result?.data;

    if (!trpcResult?.success || !trpcResult?.data) return null;

    console.log('[FuturesAPI] Backend price proxy SUCCESS for', yahooSymbol);
    return trpcResult.data;
  } catch (err: any) {
    console.log('[FuturesAPI] Backend price proxy error:', err?.message ?? 'error');
    return null;
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
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

let lastWorkingBaseIdx = 0;

async function yahooFetchDirect(path: string): Promise<any> {
  if (!canRequest(CB_NAME, { failureThreshold: 10, resetTimeoutMs: 15000 })) {
    console.log('[FuturesAPI] Circuit breaker OPEN, skipping request');
    return null;
  }

  if (Platform.OS !== 'web') {
    for (let b = 0; b < YAHOO_BASES.length; b++) {
      const tryBase = YAHOO_BASES[(lastWorkingBaseIdx + b) % YAHOO_BASES.length];
      const tryUrl = `${tryBase}/${path}`;
      try {
        console.log('[FuturesAPI] Direct fetch:', tryUrl.substring(0, 80));
        const res = await fetchWithTimeout(tryUrl);
        if (res.ok) {
          const data = await res.json();
          console.log('[FuturesAPI] Direct SUCCESS via base', (lastWorkingBaseIdx + b) % YAHOO_BASES.length);
          lastWorkingBaseIdx = (lastWorkingBaseIdx + b) % YAHOO_BASES.length;
          cbSuccess(CB_NAME);
          return data;
        }
        console.log('[FuturesAPI] Direct returned:', res.status);
      } catch (err: any) {
        console.log('[FuturesAPI] Direct failed:', err?.message ?? 'error');
      }
    }
  }

  if (lastWorkingProxyIdx >= 0) {
    const baseUrl = YAHOO_BASES[lastWorkingBaseIdx % YAHOO_BASES.length];
    const fullUrl = `${baseUrl}/${path}`;
    try {
      const proxiedUrl = buildProxiedUrl(lastWorkingProxyIdx, fullUrl);
      console.log('[FuturesAPI] Trying cached proxy', lastWorkingProxyIdx);
      const res = await fetchWithTimeout(proxiedUrl);
      if (res.ok) {
        const data = await res.json();
        console.log('[FuturesAPI] Cached proxy SUCCESS');
        cbSuccess(CB_NAME);
        return data;
      }
    } catch (err: any) {
      console.log('[FuturesAPI] Cached proxy failed:', err?.message ?? 'error');
    }
    lastWorkingProxyIdx = -1;
  }

  const racePromises: Promise<{ data: any; proxyIdx: number } | null>[] = [];

  for (const base of YAHOO_BASES) {
    const url = `${base}/${path}`;
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxiedUrl = buildProxiedUrl(i, url);
      racePromises.push(
        fetchWithTimeout(proxiedUrl)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              return { data, proxyIdx: i };
            }
            return null;
          })
          .catch(() => null)
      );
    }

    racePromises.push(
      fetchWithTimeout(url)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return { data, proxyIdx: -1 };
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
        lastWorkingProxyIdx = result.value.proxyIdx;
        console.log('[FuturesAPI] SUCCESS via', result.value.proxyIdx >= 0 ? `proxy ${result.value.proxyIdx}` : 'direct');
        cbSuccess(CB_NAME);
        return result.value.data;
      }
    }
  } catch (err: any) {
    console.log('[FuturesAPI] Race failed:', err?.message ?? 'error');
  }

  console.log('[FuturesAPI] All endpoints exhausted');
  cbFailure(CB_NAME, 'All endpoints exhausted');
  return null;
}

export async function fetchFuturesPrice(instrument: string): Promise<PriceCache | null> {
  const yahooSym = YAHOO_MAP[instrument];
  if (!yahooSym) return null;

  const cached = priceCache.get(instrument);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }

  const staleCached = priceCache.get(instrument);

  return enqueue('yahoo', async () => {
    try {
      const proxyResult = await fetchViaBackendPriceProxy(yahooSym);
      if (proxyResult && isFinite(proxyResult.price) && proxyResult.price > 0) {
        const result: PriceCache = {
          price: proxyResult.price,
          change: proxyResult.change,
          changePercent: proxyResult.changePercent,
          timestamp: Date.now(),
        };
        priceCache.set(instrument, result);
        console.log('[FuturesAPI] Price for', instrument, ':', result.price.toFixed(2), '(backend proxy)');
        return result;
      }

      const urlPath = `${yahooSym}?range=2d&interval=1d&includePrePost=false`;
      const data = await yahooFetchDirect(urlPath);

      if (!data?.chart?.result?.[0]) {
        console.log('[FuturesAPI] No chart result for', instrument);
        return staleCached ?? null;
      }

      const meta = data.chart.result[0].meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;

      if (!price || !isFinite(price) || price <= 0) {
        console.log('[FuturesAPI] Invalid price for', instrument);
        return staleCached ?? null;
      }

      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      const result: PriceCache = {
        price,
        change,
        changePercent,
        timestamp: Date.now(),
      };

      priceCache.set(instrument, result);
      console.log('[FuturesAPI] Price for', instrument, ':', price.toFixed(2), '(direct)');
      return result;
    } catch (err: any) {
      console.log('[FuturesAPI] Price fetch error for', instrument, ':', err?.message ?? err);
      cbFailure(CB_NAME, err?.message ?? 'price fetch error');
      return staleCached ?? null;
    }
  }, { priority: 6 });
}

export async function fetchFuturesPricesBatch(instruments: string[]): Promise<Map<string, PriceCache>> {
  const results = new Map<string, PriceCache>();
  const toFetch: string[] = [];

  for (const inst of instruments) {
    const cached = priceCache.get(inst);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(inst, cached);
    } else if (YAHOO_MAP[inst]) {
      toFetch.push(inst);
    }
  }

  const BATCH_SIZE = 4;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (inst) => {
      const result = await fetchFuturesPrice(inst);
      if (result) {
        results.set(inst, result);
      }
    });
    await Promise.allSettled(promises);

    if (i + BATCH_SIZE < toFetch.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}

export async function fetchFuturesKlines(
  instrument: string,
  timeframe: string,
  limit: number = 200,
): Promise<Candle[] | null> {
  const yahooSym = YAHOO_MAP[instrument];
  const tfConfig = YAHOO_INTERVAL_MAP[timeframe];
  if (!yahooSym || !tfConfig) {
    console.log('[FuturesAPI] No mapping for', instrument, timeframe);
    return null;
  }

  return enqueue('yahoo', async () => {
    try {
      const proxyData = await fetchViaBackendProxy(yahooSym, tfConfig.range, tfConfig.interval);
      if (proxyData && proxyData.timestamps && proxyData.timestamps.length > 0) {
        const candles = parseChartDataToCandles(proxyData, instrument, limit);
        if (candles && candles.length > 0) {
          console.log('[FuturesAPI] Got', candles.length, 'candles for', instrument, timeframe, '(backend proxy)');

          if (proxyData.meta?.regularMarketPrice) {
            const price = proxyData.meta.regularMarketPrice;
            const prevClose = proxyData.meta.chartPreviousClose ?? proxyData.meta.previousClose ?? price;
            const change = price - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
            priceCache.set(instrument, { price, change, changePercent, timestamp: Date.now() });
          }

          return candles;
        }
      }

      const urlPath = `${yahooSym}?range=${tfConfig.range}&interval=${tfConfig.interval}&includePrePost=false`;
      const data = await yahooFetchDirect(urlPath);

      if (!data?.chart?.result?.[0]) {
        console.log('[FuturesAPI] No chart data for', instrument);
        return null;
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];

      if (!timestamps || !quote || !quote.close) {
        console.log('[FuturesAPI] Missing quote data for', instrument);
        return null;
      }

      const candles: Candle[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const o = quote.open?.[i];
        const h = quote.high?.[i];
        const l = quote.low?.[i];
        const c = quote.close?.[i];
        const v = quote.volume?.[i] ?? 0;

        if (o != null && h != null && l != null && c != null &&
            isFinite(o) && isFinite(h) && isFinite(l) && isFinite(c) &&
            h >= l) {
          candles.push({ o, h, l, c, v, t: timestamps[i] * 1000 });
        }
      }

      if (candles.length === 0) {
        console.log('[FuturesAPI] No valid candles for', instrument);
        return null;
      }

      const meta = result.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        priceCache.set(instrument, { price, change, changePercent, timestamp: Date.now() });
      }

      const trimmed = candles.slice(-limit);
      console.log('[FuturesAPI] Got', trimmed.length, 'candles for', instrument, timeframe, '(direct)');
      return trimmed;
    } catch (err: any) {
      console.log('[FuturesAPI] Klines error for', instrument, ':', err?.message ?? err);
      cbFailure(CB_NAME, err?.message ?? 'klines error');
      return null;
    }
  }, { priority: 5 });
}

function parseChartDataToCandles(
  chartData: { meta: any; timestamps: number[]; quote: any },
  instrument: string,
  limit: number,
): Candle[] | null {
  const { timestamps, quote } = chartData;

  if (!timestamps || !quote || !quote.close) {
    console.log('[FuturesAPI] parseChartData: Missing data for', instrument);
    return null;
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;

    if (o != null && h != null && l != null && c != null &&
        isFinite(o) && isFinite(h) && isFinite(l) && isFinite(c) &&
        h >= l) {
      candles.push({ o, h, l, c, v, t: timestamps[i] * 1000 });
    }
  }

  if (candles.length === 0) return null;
  return candles.slice(-limit);
}

export function getCachedPrice(instrument: string): PriceCache | null {
  const cached = priceCache.get(instrument);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 6) {
    return cached;
  }
  return null;
}

export function clearPriceCache(): void {
  priceCache.clear();
  lastWorkingProxyIdx = -1;
  console.log('[FuturesAPI] Cache cleared');
}
