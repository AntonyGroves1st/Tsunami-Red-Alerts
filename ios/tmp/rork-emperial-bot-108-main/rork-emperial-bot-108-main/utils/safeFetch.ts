const DEFAULT_TIMEOUT_MS = 15000;

export interface SafeFetchResult<T = any> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number | null;
  latencyMs: number;
}

export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<SafeFetchResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options ?? {};
  const start = Date.now();

  if (!url || url.includes('your-api-url')) {
    return {
      ok: false,
      data: null,
      error: 'API endpoint not configured. Please check your setup.',
      status: null,
      latencyMs: 0,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      let data: T | null = null;
      try {
        data = await res.json();
      } catch {
        console.log('[safeFetch] Response not JSON, status:', res.status);
      }
      return { ok: true, data, error: null, status: res.status, latencyMs };
    }

    let errorMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) errorMsg = errBody.error;
      else if (errBody?.message) errorMsg = errBody.message;
    } catch {
      // ignore
    }

    if (res.status === 429) errorMsg = 'Rate limited — wait a moment and try again';
    else if (res.status === 404) errorMsg = 'Endpoint not found — it may not be deployed yet';
    else if (res.status >= 500) errorMsg = `Server error (${res.status}) — try again shortly`;

    return { ok: false, data: null, error: errorMsg, status: res.status, latencyMs };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (err?.name === 'AbortError') {
      return {
        ok: false,
        data: null,
        error: `Request timed out after ${Math.round(timeoutMs / 1000)}s — check your network`,
        status: null,
        latencyMs,
      };
    }

    const msg = err?.message ?? 'Unknown error';
    let friendlyMsg = msg;
    if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
      friendlyMsg = 'Network error — check your internet connection';
    } else if (msg.includes('ECONNREFUSED')) {
      friendlyMsg = 'Connection refused — server may be down';
    }

    return { ok: false, data: null, error: friendlyMsg, status: null, latencyMs };
  }
}

export async function safeFetchWithRetry<T = any>(
  url: string,
  options?: RequestInit & { timeoutMs?: number; maxRetries?: number },
): Promise<SafeFetchResult<T>> {
  const { maxRetries = 2, ...rest } = options ?? {};

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await safeFetch<T>(url, rest);

    if (result.ok) return result;

    const isRetryable = result.status === null || (result.status !== null && [429, 500, 502, 503, 504].includes(result.status));
    if (!isRetryable || attempt >= maxRetries) return result;

    const delayMs = 1000 * Math.pow(2, attempt);
    console.log(`[safeFetch] Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`);
    await new Promise(r => setTimeout(r, delayMs));
  }

  return { ok: false, data: null, error: 'All retries failed', status: null, latencyMs: 0 };
}
