import { Platform } from 'react-native';
import { Candle } from '@/utils/calculations';
import { canRequest, recordSuccess as cbSuccess, recordFailure as cbFailure } from './circuitBreaker';
import { enqueue } from './requestQueue';

const OPTIONS_UNDERLYING_MAP: Record<string, string> = {
  SPY_C: 'SPY',
  SPY_P: 'SPY',
  QQQ_C: 'QQQ',
  QQQ_P: 'QQQ',
  IWM_C: 'IWM',
  IWM_P: 'IWM',
  AAPL_C: 'AAPL',
  AAPL_P: 'AAPL',
  TSLA_C: 'TSLA',
  TSLA_P: 'TSLA',
  NVDA_C: 'NVDA',
  NVDA_P: 'NVDA',
  AMZN_C: 'AMZN',
  AMZN_P: 'AMZN',
  META_C: 'META',
  META_P: 'META',
  MSFT_C: 'MSFT',
  MSFT_P: 'MSFT',
  GOOG_C: 'GOOG',
  GOOG_P: 'GOOG',
  VIX_C: '^VIX',
  VIX_P: '^VIX',
  GLD_C: 'GLD',
  GLD_P: 'GLD',
  TLT_C: 'TLT',
  TLT_P: 'TLT',
  XLE_C: 'XLE',
  XLE_P: 'XLE',
};

const OPTIONS_TYPE_MAP: Record<string, 'call' | 'put'> = {
  SPY_C: 'call', SPY_P: 'put',
  QQQ_C: 'call', QQQ_P: 'put',
  IWM_C: 'call', IWM_P: 'put',
  AAPL_C: 'call', AAPL_P: 'put',
  TSLA_C: 'call', TSLA_P: 'put',
  NVDA_C: 'call', NVDA_P: 'put',
  AMZN_C: 'call', AMZN_P: 'put',
  META_C: 'call', META_P: 'put',
  MSFT_C: 'call', MSFT_P: 'put',
  GOOG_C: 'call', GOOG_P: 'put',
  VIX_C: 'call', VIX_P: 'put',
  GLD_C: 'call', GLD_P: 'put',
  TLT_C: 'call', TLT_P: 'put',
  XLE_C: 'call', XLE_P: 'put',
};

const YAHOO_BASES = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
];

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

const REQUEST_TIMEOUT = 15000;
const CB_NAME = 'options-yahoo';

let lastWorkingProxyIdx = -1;
let lastWorkingBaseIdx = 0;

export interface OptionsPriceData {
  underlyingPrice: number;
  optionPrice: number;
  change: number;
  changePercent: number;
  underlyingChange: number;
  underlyingChangePercent: number;
  impliedVol: number;
  delta: number;
  theta: number;
  gamma: number;
  timestamp: number;
}

interface PriceCache {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

const underlyingPriceCache = new Map<string, PriceCache>();
const optionsPriceCache = new Map<string, OptionsPriceData>();
const CACHE_TTL = 12000;

export function hasOptionsData(instrument: string): boolean {
  return instrument in OPTIONS_UNDERLYING_MAP;
}

export function getOptionsUnderlying(instrument: string): string | null {
  return OPTIONS_UNDERLYING_MAP[instrument] ?? null;
}

export function getOptionType(instrument: string): 'call' | 'put' | null {
  return OPTIONS_TYPE_MAP[instrument] ?? null;
}

export function getAllOptionsSymbols(): string[] {
  return Object.keys(OPTIONS_UNDERLYING_MAP);
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
  if (!baseUrl) return null;

  try {
    const params = new URLSearchParams({
      batch: '1',
      input: JSON.stringify({
        '0': { json: { symbol: yahooSymbol, range, interval } },
      }),
    });

    const url = `${baseUrl}/api/trpc/marketProxy.yahooChart?${params.toString()}`;
    console.log('[OptionsAPI] Fetching via backend proxy for', yahooSymbol);

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

    console.log('[OptionsAPI] Backend proxy SUCCESS for', yahooSymbol);
    return trpcResult.data;
  } catch (err: any) {
    console.log('[OptionsAPI] Backend proxy error:', err?.message ?? 'error');
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
    return trpcResult.data;
  } catch (err: any) {
    console.log('[OptionsAPI] Backend price proxy error:', err?.message ?? 'error');
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

async function yahooOptionsFetchDirect(path: string): Promise<any> {
  if (!canRequest(CB_NAME, { failureThreshold: 10, resetTimeoutMs: 15000 })) {
    console.log('[OptionsAPI] Circuit breaker OPEN, skipping request');
    return null;
  }

  if (Platform.OS !== 'web') {
    for (let b = 0; b < YAHOO_BASES.length; b++) {
      const tryBase = YAHOO_BASES[(lastWorkingBaseIdx + b) % YAHOO_BASES.length];
      const tryUrl = `${tryBase}/${path}`;
      try {
        console.log('[OptionsAPI] Direct fetch:', tryUrl.substring(0, 80));
        const res = await fetchWithTimeout(tryUrl);
        if (res.ok) {
          const data = await res.json();
          lastWorkingBaseIdx = (lastWorkingBaseIdx + b) % YAHOO_BASES.length;
          cbSuccess(CB_NAME);
          return data;
        }
      } catch (err: any) {
        console.log('[OptionsAPI] Direct failed:', err?.message ?? 'error');
      }
    }
  }

  if (lastWorkingProxyIdx >= 0) {
    const baseUrl = YAHOO_BASES[lastWorkingBaseIdx % YAHOO_BASES.length];
    const fullUrl = `${baseUrl}/${path}`;
    try {
      const proxiedUrl = buildProxiedUrl(lastWorkingProxyIdx, fullUrl);
      const res = await fetchWithTimeout(proxiedUrl);
      if (res.ok) {
        const data = await res.json();
        cbSuccess(CB_NAME);
        return data;
      }
    } catch (err: any) {
      console.log('[OptionsAPI] Cached proxy failed:', err?.message ?? 'error');
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
        cbSuccess(CB_NAME);
        return result.value.data;
      }
    }
  } catch (err: any) {
    console.log('[OptionsAPI] Race failed:', err?.message ?? 'error');
  }

  cbFailure(CB_NAME, 'All endpoints exhausted');
  return null;
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function blackScholesPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put',
): number {
  if (T <= 0) T = 0.001;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  if (type === 'call') {
    return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  } else {
    return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
  }
}

function computeGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put',
): { delta: number; gamma: number; theta: number } {
  if (T <= 0) T = 0.001;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const sqrtT = Math.sqrt(T);
  const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
  const d2 = d1 - sigma * sqrtT;

  let delta: number;
  let theta: number;
  const gamma = nd1 / (S * sigma * sqrtT);

  if (type === 'call') {
    delta = normalCDF(d1);
    theta = (-S * nd1 * sigma / (2 * sqrtT) - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365;
  } else {
    delta = normalCDF(d1) - 1;
    theta = (-S * nd1 * sigma / (2 * sqrtT) + r * K * Math.exp(-r * T) * normalCDF(-d2)) / 365;
  }

  return { delta, gamma, theta };
}

function getStrikePrice(instrument: string, underlyingPrice: number): number {
  const type = OPTIONS_TYPE_MAP[instrument];
  if (type === 'call') {
    return Math.round(underlyingPrice * 1.02);
  } else {
    return Math.round(underlyingPrice * 0.98);
  }
}

function getImpliedVol(instrument: string): number {
  const underlying = OPTIONS_UNDERLYING_MAP[instrument];
  const volMap: Record<string, number> = {
    'SPY': 0.16, 'QQQ': 0.20, 'IWM': 0.22,
    'AAPL': 0.25, 'TSLA': 0.55, 'NVDA': 0.45,
    'AMZN': 0.30, 'META': 0.35, 'MSFT': 0.22,
    'GOOG': 0.25, '^VIX': 0.80, 'GLD': 0.15,
    'TLT': 0.18, 'XLE': 0.25,
  };
  return volMap[underlying ?? ''] ?? 0.25;
}

async function fetchUnderlyingPrice(underlying: string): Promise<PriceCache | null> {
  const cached = underlyingPriceCache.get(underlying);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }

  const proxyResult = await fetchViaBackendPriceProxy(underlying);
  if (proxyResult && isFinite(proxyResult.price) && proxyResult.price > 0) {
    const result: PriceCache = {
      price: proxyResult.price,
      change: proxyResult.change,
      changePercent: proxyResult.changePercent,
      timestamp: Date.now(),
    };
    underlyingPriceCache.set(underlying, result);
    return result;
  }

  const urlPath = `${underlying}?range=2d&interval=1d&includePrePost=false`;
  const data = await yahooOptionsFetchDirect(urlPath);

  if (!data?.chart?.result?.[0]) return cached ?? null;

  const meta = data.chart.result[0].meta;
  const price = meta?.regularMarketPrice;
  const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;

  if (!price || !isFinite(price) || price <= 0) return cached ?? null;

  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  const result: PriceCache = { price, change, changePercent, timestamp: Date.now() };
  underlyingPriceCache.set(underlying, result);
  return result;
}

export async function fetchOptionsPrice(instrument: string): Promise<OptionsPriceData | null> {
  const underlying = OPTIONS_UNDERLYING_MAP[instrument];
  const optType = OPTIONS_TYPE_MAP[instrument];
  if (!underlying || !optType) return null;

  const cached = optionsPriceCache.get(instrument);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }

  return enqueue('yahoo', async () => {
    try {
      const underlyingData = await fetchUnderlyingPrice(underlying);

      if (!underlyingData || !isFinite(underlyingData.price) || underlyingData.price <= 0) {
        console.log('[OptionsAPI] Could not get underlying price for', instrument);
        return cached ?? null;
      }

      const underlyingPrice = underlyingData.price;
      const prevClose = underlyingPrice - underlyingData.change;

      const strike = getStrikePrice(instrument, underlyingPrice);
      const iv = getImpliedVol(instrument);
      const T = 30 / 365;
      const r = 0.05;

      const optionPrice = blackScholesPrice(underlyingPrice, strike, T, r, iv, optType);
      const greeks = computeGreeks(underlyingPrice, strike, T, r, iv, optType);

      const prevOptionPrice = blackScholesPrice(prevClose, strike, T + 1 / 365, r, iv, optType);
      const optionChange = optionPrice - prevOptionPrice;
      const optionChangePercent = prevOptionPrice > 0 ? (optionChange / prevOptionPrice) * 100 : 0;

      const result: OptionsPriceData = {
        underlyingPrice,
        optionPrice: Math.max(optionPrice, 0.01),
        change: optionChange,
        changePercent: optionChangePercent,
        underlyingChange: underlyingData.change,
        underlyingChangePercent: underlyingData.changePercent,
        impliedVol: iv,
        delta: greeks.delta,
        theta: greeks.theta,
        gamma: greeks.gamma,
        timestamp: Date.now(),
      };

      optionsPriceCache.set(instrument, result);
      console.log('[OptionsAPI] Price for', instrument, ':', result.optionPrice.toFixed(2), 'underlying:', underlyingPrice.toFixed(2));
      return result;
    } catch (err: any) {
      console.log('[OptionsAPI] Price fetch error for', instrument, ':', err?.message ?? err);
      cbFailure(CB_NAME, err?.message ?? 'price fetch error');
      return cached ?? null;
    }
  }, { priority: 6 });
}

export async function fetchOptionsPricesBatch(instruments: string[]): Promise<Map<string, OptionsPriceData>> {
  const results = new Map<string, OptionsPriceData>();
  const toFetch: string[] = [];

  for (const inst of instruments) {
    const cached = optionsPriceCache.get(inst);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(inst, cached);
    } else if (OPTIONS_UNDERLYING_MAP[inst]) {
      toFetch.push(inst);
    }
  }

  const underlyingGroups = new Map<string, string[]>();
  for (const inst of toFetch) {
    const underlying = OPTIONS_UNDERLYING_MAP[inst];
    if (!underlying) continue;
    const existing = underlyingGroups.get(underlying) ?? [];
    existing.push(inst);
    underlyingGroups.set(underlying, existing);
  }

  const BATCH_SIZE = 4;
  const underlyingList = Array.from(underlyingGroups.entries());

  for (let i = 0; i < underlyingList.length; i += BATCH_SIZE) {
    const batch = underlyingList.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ([, instruments]) => {
      for (const inst of instruments) {
        const result = await fetchOptionsPrice(inst);
        if (result) {
          results.set(inst, result);
        }
      }
    });
    await Promise.allSettled(promises);

    if (i + BATCH_SIZE < underlyingList.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}

export async function fetchOptionsKlines(
  instrument: string,
  timeframe: string,
  limit: number = 200,
): Promise<Candle[] | null> {
  const underlying = OPTIONS_UNDERLYING_MAP[instrument];
  const optType = OPTIONS_TYPE_MAP[instrument];
  const tfConfig = YAHOO_INTERVAL_MAP[timeframe];
  if (!underlying || !optType || !tfConfig) {
    console.log('[OptionsAPI] No mapping for', instrument, timeframe);
    return null;
  }

  return enqueue('yahoo', async () => {
    try {
      let timestamps: number[] | null = null;
      let quote: any = null;
      let currentPrice = 0;

      const proxyData = await fetchViaBackendProxy(underlying, tfConfig.range, tfConfig.interval);
      if (proxyData && proxyData.timestamps && proxyData.timestamps.length > 0) {
        timestamps = proxyData.timestamps;
        quote = proxyData.quote;
        currentPrice = proxyData.meta?.regularMarketPrice ?? 0;
        console.log('[OptionsAPI] Got underlying data via backend proxy for', instrument);
      }

      if (!timestamps || !quote) {
        const urlPath = `${underlying}?range=${tfConfig.range}&interval=${tfConfig.interval}&includePrePost=false`;
        const data = await yahooOptionsFetchDirect(urlPath);

        if (!data?.chart?.result?.[0]) {
          console.log('[OptionsAPI] No chart data for', instrument);
          return null;
        }

        const result = data.chart.result[0];
        timestamps = result.timestamp;
        quote = result.indicators?.quote?.[0];
        currentPrice = result.meta?.regularMarketPrice ?? 0;
      }

      if (!timestamps || !quote || !quote.close) {
        console.log('[OptionsAPI] Missing quote data for', instrument);
        return null;
      }

      const strike = getStrikePrice(instrument, currentPrice || 100);
      const iv = getImpliedVol(instrument);
      const r = 0.05;
      const totalBars = timestamps.length;

      const candles: Candle[] = [];
      for (let i = 0; i < totalBars; i++) {
        const uO = quote.open?.[i];
        const uH = quote.high?.[i];
        const uL = quote.low?.[i];
        const uC = quote.close?.[i];
        const v = quote.volume?.[i] ?? 0;

        if (uO == null || uH == null || uL == null || uC == null ||
            !isFinite(uO) || !isFinite(uH) || !isFinite(uL) || !isFinite(uC)) {
          continue;
        }

        const T = Math.max((totalBars - i) / totalBars * 0.15 + 0.01, 0.001);

        const oO = Math.max(blackScholesPrice(uO, strike, T, r, iv, optType), 0.01);
        const oH = Math.max(blackScholesPrice(optType === 'call' ? uH : uL, strike, T, r, iv, optType), 0.01);
        const oL = Math.max(blackScholesPrice(optType === 'call' ? uL : uH, strike, T, r, iv, optType), 0.01);
        const oC = Math.max(blackScholesPrice(uC, strike, T, r, iv, optType), 0.01);

        candles.push({
          o: oO,
          h: Math.max(oO, oH, oL, oC),
          l: Math.min(oO, oH, oL, oC),
          c: oC,
          v: v * 0.1,
          t: timestamps[i] * 1000,
        });
      }

      if (candles.length === 0) {
        console.log('[OptionsAPI] No valid candles for', instrument);
        return null;
      }

      const trimmed = candles.slice(-limit);
      console.log('[OptionsAPI] Got', trimmed.length, 'option candles for', instrument, timeframe);
      return trimmed;
    } catch (err: any) {
      console.log('[OptionsAPI] Klines error for', instrument, ':', err?.message ?? err);
      cbFailure(CB_NAME, err?.message ?? 'klines error');
      return null;
    }
  }, { priority: 5 });
}

export function getCachedOptionsPrice(instrument: string): OptionsPriceData | null {
  const cached = optionsPriceCache.get(instrument);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 6) {
    return cached;
  }
  return null;
}

export function clearOptionsCache(): void {
  optionsPriceCache.clear();
  underlyingPriceCache.clear();
  lastWorkingProxyIdx = -1;
  lastWorkingBaseIdx = 0;
  console.log('[OptionsAPI] Cache cleared');
}
