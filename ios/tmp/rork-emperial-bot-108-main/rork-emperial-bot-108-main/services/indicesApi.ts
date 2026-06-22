import { fetchFuturesPrice, getCachedPrice } from './futuresApi';
import { SPECS } from '@/constants/instruments';

export interface IndexData {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  isLive: boolean;
}

const INDEX_SYMBOLS = [
  'SPX', 'NDX', 'DJI', 'RUT', 'VIX',
  'FTSE', 'DAX', 'N225', 'HSI', 'STOXX',
  'FCHI', 'GSPC', 'NYA', 'SOX',
] as const;

export type IndexSymbol = (typeof INDEX_SYMBOLS)[number];

const indexCache = new Map<string, IndexData>();
const liveStatusMap = new Map<string, boolean>();

export function getIndexSymbols(): readonly string[] {
  return INDEX_SYMBOLS;
}

export function isIndexSymbol(sym: string): boolean {
  return (INDEX_SYMBOLS as readonly string[]).includes(sym);
}

export function hasIndexLiveData(sym: string): boolean {
  return liveStatusMap.get(sym) === true;
}

export function getCachedIndex(sym: string): IndexData | null {
  return indexCache.get(sym) ?? null;
}

export function getAllCachedIndices(): IndexData[] {
  return INDEX_SYMBOLS
    .map((sym) => indexCache.get(sym))
    .filter((d): d is IndexData => d != null);
}

export function getLiveIndicesCount(): number {
  let count = 0;
  for (const sym of INDEX_SYMBOLS) {
    if (liveStatusMap.get(sym) === true) count++;
  }
  return count;
}

export async function fetchIndexPrice(sym: string): Promise<IndexData | null> {
  if (!isIndexSymbol(sym)) return null;

  const spec = SPECS[sym];
  if (!spec) return null;

  try {
    const result = await fetchFuturesPrice(sym);
    if (result && isFinite(result.price) && result.price > 0) {
      const data: IndexData = {
        symbol: sym,
        name: spec.name,
        exchange: spec.exch,
        price: result.price,
        change: result.change,
        changePercent: result.changePercent,
        timestamp: Date.now(),
        isLive: true,
      };
      indexCache.set(sym, data);
      liveStatusMap.set(sym, true);
      console.log('[IndicesAPI] LIVE', sym, ':', result.price.toFixed(2), `(${result.changePercent >= 0 ? '+' : ''}${result.changePercent.toFixed(2)}%)`);
      return data;
    }

    const cached = getCachedPrice(sym);
    if (cached) {
      const data: IndexData = {
        symbol: sym,
        name: spec.name,
        exchange: spec.exch,
        price: cached.price,
        change: cached.change,
        changePercent: cached.changePercent,
        timestamp: cached.timestamp,
        isLive: Date.now() - cached.timestamp < 120000,
      };
      indexCache.set(sym, data);
      liveStatusMap.set(sym, data.isLive);
      return data;
    }

    liveStatusMap.set(sym, false);
    return indexCache.get(sym) ?? null;
  } catch (err) {
    console.log('[IndicesAPI] Error fetching', sym, ':', err);
    liveStatusMap.set(sym, false);
    return indexCache.get(sym) ?? null;
  }
}

export async function fetchAllIndices(): Promise<Map<string, IndexData>> {
  const results = new Map<string, IndexData>();
  const BATCH = 2;

  for (let i = 0; i < INDEX_SYMBOLS.length; i += BATCH) {
    const batch = INDEX_SYMBOLS.slice(i, i + BATCH);
    const promises = batch.map(async (sym) => {
      try {
        const data = await fetchIndexPrice(sym);
        if (data) {
          results.set(sym, data);
        }
      } catch (err) {
        console.log('[IndicesAPI] Batch fetch error for', sym, ':', err);
      }
    });
    await Promise.allSettled(promises);

    if (i + BATCH < INDEX_SYMBOLS.length) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  const liveCount = Array.from(results.values()).filter((d) => d.isLive).length;
  console.log('[IndicesAPI] Fetched', results.size, 'of', INDEX_SYMBOLS.length, 'indices (' + liveCount + ' live)');
  return results;
}

const MAJOR_INDICES: IndexSymbol[] = ['SPX', 'NDX', 'DJI', 'RUT', 'VIX', 'FTSE', 'DAX'];

export function getMajorIndices(): IndexData[] {
  return MAJOR_INDICES
    .map((sym) => {
      const cached = indexCache.get(sym);
      if (cached) return cached;
      const spec = SPECS[sym];
      if (!spec) return null;
      return {
        symbol: sym,
        name: spec.name,
        exchange: spec.exch,
        price: spec.base,
        change: 0,
        changePercent: 0,
        timestamp: 0,
        isLive: false,
      } as IndexData;
    })
    .filter((d): d is IndexData => d != null);
}
