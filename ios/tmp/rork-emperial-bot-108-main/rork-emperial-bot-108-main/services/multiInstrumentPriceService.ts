import {
  hasLiveData as hasBinanceLiveData,
  fetchTickerPrice,
  fetch24hTicker,
} from './binanceApi';
import {
  hasFuturesData,
  fetchFuturesPrice,
  fetchFuturesPricesBatch,
} from './futuresApi';
import {
  hasOptionsData,
  fetchOptionsPrice,
  fetchOptionsPricesBatch,
} from './optionsApi';

export interface InstrumentPrice {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: 'binance' | 'futures' | 'options' | 'sim';
}

const priceStore = new Map<string, InstrumentPrice>();
const PRICE_STALE_MS = 30000;

export function getCachedPrice(instrument: string): InstrumentPrice | null {
  const cached = priceStore.get(instrument);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > PRICE_STALE_MS * 3) return null;
  return cached;
}

export function getAllCachedPrices(): Map<string, InstrumentPrice> {
  return new Map(priceStore);
}

export async function fetchPriceForInstrument(instrument: string): Promise<InstrumentPrice | null> {
  const cached = priceStore.get(instrument);
  if (cached && Date.now() - cached.timestamp < PRICE_STALE_MS) {
    return cached;
  }

  try {
    if (hasBinanceLiveData(instrument)) {
      const ticker = await fetch24hTicker(instrument);
      if (ticker && ticker.price > 0) {
        const result: InstrumentPrice = {
          price: ticker.price,
          change: ticker.priceChange24h,
          changePercent: ticker.priceChangePercent24h,
          timestamp: Date.now(),
          source: 'binance',
        };
        priceStore.set(instrument, result);
        return result;
      }

      const tickerPrice = await fetchTickerPrice(instrument);
      if (tickerPrice && tickerPrice > 0) {
        const result: InstrumentPrice = {
          price: tickerPrice,
          change: 0,
          changePercent: 0,
          timestamp: Date.now(),
          source: 'binance',
        };
        priceStore.set(instrument, result);
        return result;
      }
    }

    if (hasFuturesData(instrument)) {
      const futuresPrice = await fetchFuturesPrice(instrument);
      if (futuresPrice && futuresPrice.price > 0) {
        const result: InstrumentPrice = {
          price: futuresPrice.price,
          change: futuresPrice.change,
          changePercent: futuresPrice.changePercent,
          timestamp: Date.now(),
          source: 'futures',
        };
        priceStore.set(instrument, result);
        return result;
      }
    }

    if (hasOptionsData(instrument)) {
      const optPrice = await fetchOptionsPrice(instrument);
      if (optPrice && optPrice.optionPrice > 0) {
        const result: InstrumentPrice = {
          price: optPrice.optionPrice,
          change: optPrice.change,
          changePercent: optPrice.changePercent,
          timestamp: Date.now(),
          source: 'options',
        };
        priceStore.set(instrument, result);
        return result;
      }
    }
  } catch (err: any) {
    console.log('[MultiPrice] Error fetching price for', instrument, ':', err?.message ?? err);
  }

  return cached ?? null;
}

export async function fetchPricesForInstruments(instruments: string[]): Promise<Map<string, InstrumentPrice>> {
  const results = new Map<string, InstrumentPrice>();
  const toFetch: string[] = [];

  for (const inst of instruments) {
    const cached = priceStore.get(inst);
    if (cached && Date.now() - cached.timestamp < PRICE_STALE_MS) {
      results.set(inst, cached);
    } else {
      toFetch.push(inst);
    }
  }

  if (toFetch.length === 0) return results;

  const binanceInstruments = toFetch.filter(hasBinanceLiveData);
  const futuresInstruments = toFetch.filter(i => !hasBinanceLiveData(i) && hasFuturesData(i));
  const optionsInstruments = toFetch.filter(i => !hasBinanceLiveData(i) && !hasFuturesData(i) && hasOptionsData(i));

  const fetchBinanceBatch = async () => {
    const BATCH = 3;
    for (let i = 0; i < binanceInstruments.length; i += BATCH) {
      const batch = binanceInstruments.slice(i, i + BATCH);
      const promises = batch.map(async (inst) => {
        const result = await fetchPriceForInstrument(inst);
        if (result) results.set(inst, result);
      });
      await Promise.allSettled(promises);
      if (i + BATCH < binanceInstruments.length) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };

  const fetchFuturesBatch = async () => {
    if (futuresInstruments.length === 0) return;
    try {
      const batchResults = await fetchFuturesPricesBatch(futuresInstruments);
      for (const [inst, priceData] of batchResults) {
        const result: InstrumentPrice = {
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          timestamp: Date.now(),
          source: 'futures',
        };
        priceStore.set(inst, result);
        results.set(inst, result);
      }
    } catch (err: any) {
      console.log('[MultiPrice] Futures batch error:', err?.message ?? err);
    }
  };

  const fetchOptionsBatch = async () => {
    if (optionsInstruments.length === 0) return;
    try {
      const batchResults = await fetchOptionsPricesBatch(optionsInstruments);
      for (const [inst, priceData] of batchResults) {
        const result: InstrumentPrice = {
          price: priceData.optionPrice,
          change: priceData.change,
          changePercent: priceData.changePercent,
          timestamp: Date.now(),
          source: 'options',
        };
        priceStore.set(inst, result);
        results.set(inst, result);
      }
    } catch (err: any) {
      console.log('[MultiPrice] Options batch error:', err?.message ?? err);
    }
  };

  await Promise.allSettled([fetchBinanceBatch(), fetchFuturesBatch(), fetchOptionsBatch()]);

  console.log('[MultiPrice] Fetched prices for', results.size, '/', instruments.length, 'instruments');
  return results;
}

export function getDataSourceForInstrument(instrument: string): 'binance' | 'futures' | 'options' | 'none' {
  if (hasBinanceLiveData(instrument)) return 'binance';
  if (hasFuturesData(instrument)) return 'futures';
  if (hasOptionsData(instrument)) return 'options';
  return 'none';
}

export function hasAnyLiveData(instrument: string): boolean {
  return hasBinanceLiveData(instrument) || hasFuturesData(instrument) || hasOptionsData(instrument);
}
