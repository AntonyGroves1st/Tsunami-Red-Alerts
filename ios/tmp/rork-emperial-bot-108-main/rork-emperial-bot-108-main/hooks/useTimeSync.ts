import { useState, useEffect, useRef, useCallback } from 'react';

interface TimeSyncState {
  syncedTime: Date;
  offset: number;
  isSynced: boolean;
  lastSyncAt: number | null;
  syncSource: string;
  syncError: string | null;
  drift: number;
  resync: () => void;
}

const SYNC_INTERVAL = 180_000;
const TICK_INTERVAL = 1_000;
const INITIAL_DELAY = 12_000;
const SYNC_SOURCE_LABEL = 'USNO Atomic Ref (via WorldTimeAPI)';
const FETCH_TIMEOUT = 8_000;

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isValidMs(ms: number): boolean {
  return typeof ms === 'number' && !isNaN(ms) && isFinite(ms) && ms > 1_000_000_000_000;
}

async function fetchWorldTime(): Promise<{ unixMs: number; fetchedAt: number }> {
  const before = Date.now();
  const res = await fetchWithTimeout(
    'https://worldtimeapi.org/api/timezone/America/New_York',
    FETCH_TIMEOUT
  );
  const after = Date.now();
  const rtt = after - before;

  if (!res.ok) throw new Error(`WorldTimeAPI returned ${res.status}`);

  const data = await res.json();
  console.log('[TimeSync] WorldTimeAPI response:', JSON.stringify(data).slice(0, 200));

  const unixEpoch: number = data.unixtime;
  if (!unixEpoch || typeof unixEpoch !== 'number') {
    throw new Error('WorldTimeAPI: missing unixtime field');
  }

  const serverMs = unixEpoch * 1000 + rtt / 2;
  if (!isValidMs(serverMs)) throw new Error('WorldTimeAPI: computed invalid timestamp');

  return { unixMs: serverMs, fetchedAt: after };
}

async function fetchTimeFromBackup(): Promise<{ unixMs: number; fetchedAt: number }> {
  const before = Date.now();
  const res = await fetchWithTimeout(
    'https://timeapi.io/api/time/current/zone?timeZone=America/New_York',
    FETCH_TIMEOUT
  );
  const after = Date.now();
  const rtt = after - before;

  if (!res.ok) throw new Error(`TimeAPI returned ${res.status}`);

  const data = await res.json();
  console.log('[TimeSync] TimeAPI response:', JSON.stringify(data).slice(0, 200));

  let serverMs = NaN;

  if (data.dateTime && typeof data.dateTime === 'string') {
    serverMs = new Date(data.dateTime).getTime();
  }

  if (!isValidMs(serverMs) && data.date && data.time) {
    const isoStr = `${data.date}T${data.time}`;
    serverMs = new Date(isoStr).getTime();
  }

  if (!isValidMs(serverMs) && typeof data.seconds === 'number') {
    serverMs = data.seconds * 1000;
  }

  if (!isValidMs(serverMs)) throw new Error('TimeAPI: could not parse valid timestamp');

  serverMs += rtt / 2;
  return { unixMs: serverMs, fetchedAt: after };
}

async function fetchTimeFromWorldClock(): Promise<{ unixMs: number; fetchedAt: number }> {
  const before = Date.now();
  const res = await fetchWithTimeout(
    'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',
    FETCH_TIMEOUT
  );
  const after = Date.now();
  const rtt = after - before;

  if (!res.ok) throw new Error(`WorldClock returned ${res.status}`);

  const data = await res.json();
  console.log('[TimeSync] WorldClock response:', JSON.stringify(data).slice(0, 200));

  let serverMs = NaN;

  if (data.dateTime && typeof data.dateTime === 'string') {
    serverMs = new Date(data.dateTime).getTime();
  }

  if (!isValidMs(serverMs) && data.year && data.month && data.day) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const isoStr = `${data.year}-${pad(data.month)}-${pad(data.day)}T${pad(data.hour ?? 0)}:${pad(data.minute ?? 0)}:${pad(data.seconds ?? 0)}Z`;
    serverMs = new Date(isoStr).getTime();
  }

  if (!isValidMs(serverMs)) throw new Error('WorldClock: could not parse valid timestamp');

  serverMs += rtt / 2;
  return { unixMs: serverMs, fetchedAt: after };
}

export function useTimeSync(): TimeSyncState {
  const [syncedTime, setSyncedTime] = useState<Date>(new Date());
  const [offset, setOffset] = useState<number>(0);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [drift, setDrift] = useState<number>(0);

  const offsetRef = useRef<number>(0);
  const previousOffsetRef = useRef<number>(0);
  const isSyncedRef = useRef<boolean>(false);

  const doSync = useCallback(async () => {
    const sources = [fetchWorldTime, fetchTimeFromBackup, fetchTimeFromWorldClock];
    let lastError: string = 'All sync sources failed';

    for (const source of sources) {
      try {
        console.log(`[TimeSync] Trying source: ${source.name}...`);
        const result = await source();

        if (!isValidMs(result.unixMs)) {
          console.warn(`[TimeSync] ${source.name} returned invalid ms: ${result.unixMs}`);
          continue;
        }

        const localNow = result.fetchedAt;
        const newOffset = result.unixMs - localNow;

        if (!isFinite(newOffset)) {
          console.warn(`[TimeSync] ${source.name} produced non-finite offset: ${newOffset}`);
          continue;
        }

        previousOffsetRef.current = offsetRef.current;
        offsetRef.current = newOffset;

        const currentDrift = isSyncedRef.current
          ? Math.abs(newOffset - previousOffsetRef.current)
          : 0;

        setOffset(Math.round(newOffset));
        setDrift(Math.round(currentDrift));
        setIsSynced(true);
        isSyncedRef.current = true;
        setLastSyncAt(Date.now());
        setSyncError(null);

        console.log(`[TimeSync] Synced via ${source.name}. Offset: ${Math.round(newOffset)}ms, Drift: ${Math.round(currentDrift)}ms`);
        return;
      } catch (err: any) {
        console.warn(`[TimeSync] ${source.name} failed:`, err.message);
        lastError = err.message ?? 'Unknown error';
      }
    }

    console.error('[TimeSync] All sources failed. Using local clock.');
    setSyncError(lastError);
    offsetRef.current = 0;
    setOffset(0);
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      doSync();
    }, INITIAL_DELAY);
    const interval = setInterval(doSync, SYNC_INTERVAL);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [doSync]);

  useEffect(() => {
    const tick = setInterval(() => {
      const nowMs = Date.now() + offsetRef.current;
      const corrected = new Date(nowMs);
      if (!isNaN(corrected.getTime())) {
        setSyncedTime(corrected);
      } else {
        setSyncedTime(new Date());
      }
    }, TICK_INTERVAL);
    return () => clearInterval(tick);
  }, []);

  return {
    syncedTime,
    offset,
    isSynced,
    lastSyncAt,
    syncSource: SYNC_SOURCE_LABEL,
    syncError,
    drift,
    resync: doSync,
  };
}
