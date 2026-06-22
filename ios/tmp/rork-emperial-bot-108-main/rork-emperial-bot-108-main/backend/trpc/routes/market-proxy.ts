import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../create-context";

const YAHOO_BASES = [
  "https://query1.finance.yahoo.com/v8/finance/chart",
  "https://query2.finance.yahoo.com/v8/finance/chart",
];

const REQUEST_TIMEOUT = 12000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

let lastWorkingBaseIdx = 0;

async function yahooServerFetch(path: string): Promise<any> {
  for (let b = 0; b < YAHOO_BASES.length; b++) {
    const baseIdx = (lastWorkingBaseIdx + b) % YAHOO_BASES.length;
    const url = `${YAHOO_BASES[baseIdx]}/${path}`;
    try {
      console.log("[MarketProxy] Fetching:", url.substring(0, 100));
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT);
      if (res.ok) {
        const data = await res.json();
        lastWorkingBaseIdx = baseIdx;
        console.log("[MarketProxy] SUCCESS from base", baseIdx);
        return data;
      }
      console.log("[MarketProxy] Base", baseIdx, "returned", res.status);
    } catch (err: any) {
      console.log("[MarketProxy] Base", baseIdx, "failed:", err?.message ?? "error");
    }
  }
  console.log("[MarketProxy] All Yahoo bases exhausted");
  return null;
}

export const marketProxyRouter = createTRPCRouter({
  yahooChart: publicProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(30),
        range: z.string().min(1).max(10),
        interval: z.string().min(1).max(10),
      })
    )
    .query(async ({ input }) => {
      const { symbol, range, interval } = input;
      console.log("[MarketProxy] yahooChart request:", symbol, range, interval);

      const urlPath = `${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false`;
      const data = await yahooServerFetch(urlPath);

      if (!data?.chart?.result?.[0]) {
        console.log("[MarketProxy] No chart result for", symbol);
        return { success: false as const, error: "No data available", data: null };
      }

      const result = data.chart.result[0];
      const meta = result.meta ?? {};
      const timestamps = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0] ?? {};

      return {
        success: true as const,
        error: null,
        data: {
          meta: {
            regularMarketPrice: meta.regularMarketPrice ?? null,
            chartPreviousClose: meta.chartPreviousClose ?? null,
            previousClose: meta.previousClose ?? null,
            currency: meta.currency ?? null,
            exchangeName: meta.exchangeName ?? null,
            instrumentType: meta.instrumentType ?? null,
          },
          timestamps,
          quote: {
            open: quote.open ?? [],
            high: quote.high ?? [],
            low: quote.low ?? [],
            close: quote.close ?? [],
            volume: quote.volume ?? [],
          },
        },
      };
    }),

  yahooPrice: publicProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(30),
      })
    )
    .query(async ({ input }) => {
      const { symbol } = input;
      console.log("[MarketProxy] yahooPrice request:", symbol);

      const urlPath = `${encodeURIComponent(symbol)}?range=2d&interval=1d&includePrePost=false`;
      const data = await yahooServerFetch(urlPath);

      if (!data?.chart?.result?.[0]) {
        return { success: false as const, error: "No data", data: null };
      }

      const meta = data.chart.result[0].meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;

      if (!price || !isFinite(price) || price <= 0) {
        return { success: false as const, error: "Invalid price", data: null };
      }

      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        success: true as const,
        error: null,
        data: {
          price,
          prevClose,
          change,
          changePercent,
          currency: meta?.currency ?? null,
          exchangeName: meta?.exchangeName ?? null,
        },
      };
    }),
});
