export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t?: number;
}

export interface IndicatorResults {
  emaShort: number[];
  emaLong: number[];
  emaCrossLong: boolean[];
  emaCrossShort: boolean[];
  emaRaw: number[];
  emaStepped: number[];
  steppedCrossUp: boolean[];
  steppedCrossDown: boolean[];
  marketPressure: number[];
  signalStrength: number[];
  combShort: number[];
  combLong: number[];
  combBuy: boolean[];
  combSell: boolean[];
  atrVals: number[];
  combTP1: number[];
  combTP2: number[];
  combTP3: number[];
  combSL: number[];
  fibHigh: number[];
  fibLow: number[];
  fib236: number[];
  fib382: number[];
  fib500: number[];
  fib618: number[];
  fib786: number[];
  rmpSmoothed: number[];
  rmpBuy: boolean[];
  rmpSell: boolean[];
  advShort: number[];
  advLong: number[];
  advSma: number[];
  cloudBull: boolean[];
  goldenCross: boolean[];
  deathCross: boolean[];
  mpsSmoothed: number[];
  composite: number[];
  ema200: number[];
  ema21: number[];
  macdLine: number[];
  macdSignal: number[];
  macdHist: number[];
}

export interface SignalBadge {
  text: string;
  type: 'long' | 'short' | 'neutral' | 'fire';
}

function ema(arr: number[], len: number): number[] {
  const k = 2 / (len + 1);
  const out = new Array<number>(arr.length).fill(NaN);
  let e = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (!isNaN(arr[i])) {
      e = isNaN(e) ? arr[i] : arr[i] * k + e * (1 - k);
      out[i] = e;
    }
  }
  return out;
}

function sma(arr: number[], len: number): number[] {
  return arr.map((_, i) => {
    if (i < len - 1) return NaN;
    let sum = 0;
    for (let j = i - len + 1; j <= i; j++) sum += arr[j];
    return sum / len;
  });
}

function atr(candles: Candle[], len: number): number[] {
  const tr = candles.map((c, i) =>
    i === 0
      ? c.h - c.l
      : Math.max(c.h - c.l, Math.abs(c.h - candles[i - 1].c), Math.abs(c.l - candles[i - 1].c))
  );
  return sma(tr, len);
}

function crossover(a: number[], b: number[]): boolean[] {
  return a.map((_, i) => (i > 0 ? a[i] > b[i] && a[i - 1] <= b[i - 1] : false));
}

function crossunder(a: number[], b: number[]): boolean[] {
  return a.map((_, i) => (i > 0 ? a[i] < b[i] && a[i - 1] >= b[i - 1] : false));
}

function rollingMax(arr: number[], n: number): number[] {
  return arr.map((_, i) => {
    if (i < n - 1) return NaN;
    let max = -Infinity;
    for (let j = i - n + 1; j <= i; j++) max = Math.max(max, arr[j]);
    return max;
  });
}

function rollingMin(arr: number[], n: number): number[] {
  return arr.map((_, i) => {
    if (i < n - 1) return NaN;
    let min = Infinity;
    for (let j = i - n + 1; j <= i; j++) min = Math.min(min, arr[j]);
    return min;
  });
}

export interface IndicatorParams {
  ema_cross?: { shortPeriod?: number; longPeriod?: number; stopPct?: number; takePct?: number };
  stepped_ema?: { period?: number };
  mp_v1?: { shortPeriod?: number; longPeriod?: number };
  combined?: { shortPeriod?: number; longPeriod?: number; atrPeriod?: number; tp1Mult?: number; tp2Mult?: number; tp3Mult?: number; slMult?: number };
  refined_mp?: { smoothPeriod?: number };
  cloud?: { shortPeriod?: number; longPeriod?: number; smaPeriod?: number };
  fib?: { lookback?: number; level1?: number; level2?: number; level3?: number; level4?: number; level5?: number };
  mps?: { smaPeriod?: number };
}

export function computeIndicators(candles: Candle[], params?: IndicatorParams): IndicatorResults {
  const closes = candles.map((c) => c.c);
  const opens = candles.map((c) => c.o);
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);

  const emaCrossP = params?.ema_cross ?? {};
  const emaShort = ema(closes, emaCrossP.shortPeriod ?? 5);
  const emaLong = ema(closes, emaCrossP.longPeriod ?? 32);
  const emaCrossLong = crossover(emaShort, emaLong);
  const emaCrossShort = crossunder(emaShort, emaLong);

  const steppedP = params?.stepped_ema ?? {};
  const emaRaw = ema(closes, steppedP.period ?? 14);
  const emaStepped = emaRaw.map((_, i) => (i > 0 ? emaRaw[i - 1] : NaN));
  const steppedCrossUp = closes.map(
    (c, i) => i > 0 && c > emaStepped[i] && closes[i - 1] <= emaStepped[i - 1]
  );
  const steppedCrossDown = closes.map(
    (c, i) => i > 0 && c < emaStepped[i] && closes[i - 1] >= emaStepped[i - 1]
  );

  const mpP = params?.mp_v1 ?? {};
  const mpEmaShort = ema(closes, mpP.shortPeriod ?? 14);
  const mpEmaLong = ema(closes, mpP.longPeriod ?? 28);
  const marketPressure = mpEmaShort.map((v, i) => v - mpEmaLong[i]);
  const signalStrength = marketPressure.map((v) => Math.max(0, v));

  const combP = params?.combined ?? {};
  const combShort = ema(closes, combP.shortPeriod ?? 9);
  const combLong = ema(closes, combP.longPeriod ?? 21);
  const combBuy = crossover(combShort, combLong);
  const combSell = crossunder(combShort, combLong);
  const atrVals = atr(candles, combP.atrPeriod ?? 14);
  const combTP1 = closes.map((c, i) => c + atrVals[i] * (combP.tp1Mult ?? 2.0));
  const combTP2 = closes.map((c, i) => c + atrVals[i] * (combP.tp2Mult ?? 3.0));
  const combTP3 = closes.map((c, i) => c + atrVals[i] * (combP.tp3Mult ?? 4.0));
  const combSL = closes.map((c, i) => c - atrVals[i] * (combP.slMult ?? 1.5));

  const fibP = params?.fib ?? {};
  const fibLookback = fibP.lookback ?? 100;
  const fibHigh = rollingMax(highs, fibLookback);
  const fibLow = rollingMin(lows, fibLookback);
  const fibRange = fibHigh.map((h, i) => h - fibLow[i]);
  const fib236 = fibHigh.map((h, i) => h - fibRange[i] * (fibP.level1 ?? 0.236));
  const fib382 = fibHigh.map((h, i) => h - fibRange[i] * (fibP.level2 ?? 0.382));
  const fib500 = fibHigh.map((h, i) => h - fibRange[i] * (fibP.level3 ?? 0.5));
  const fib618 = fibHigh.map((h, i) => h - fibRange[i] * (fibP.level4 ?? 0.618));
  const fib786 = fibHigh.map((h, i) => h - fibRange[i] * (fibP.level5 ?? 0.786));

  const rmpP = params?.refined_mp ?? {};
  const rawPressure = closes.map((c, i) => c - opens[i]);
  const rmpSmoothed = ema(rawPressure, rmpP.smoothPeriod ?? 10);
  const rmpBuy = rmpSmoothed.map((v, i) => i > 0 && v > 0 && rmpSmoothed[i - 1] <= 0);
  const rmpSell = rmpSmoothed.map((v, i) => i > 0 && v < 0 && rmpSmoothed[i - 1] >= 0);

  const cloudP = params?.cloud ?? {};
  const advShort = ema(closes, cloudP.shortPeriod ?? 9);
  const advLong = ema(closes, cloudP.longPeriod ?? 21);
  const advSma = sma(closes, cloudP.smaPeriod ?? 50);
  const cloudBull = advShort.map((v, i) => v > advLong[i]);
  const goldenCross = crossover(advShort, advLong);
  const deathCross = crossunder(advShort, advLong);

  const mpsP = params?.mps ?? {};
  const mpsSmoothed = sma(rawPressure, mpsP.smaPeriod ?? 5);

  const ema200 = ema(closes, 200);
  const ema21 = ema(closes, 21);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const macdSignal = ema(macdLine.map(v => isNaN(v) ? 0 : v), 9);
  const macdHist = macdLine.map((v, i) => v - macdSignal[i]);

  const composite = closes.map((_, i) => {
    let s = 0;
    if (emaCrossLong[i]) s += 2;
    if (emaCrossShort[i]) s -= 2;
    if (steppedCrossUp[i]) s += 1;
    if (steppedCrossDown[i]) s -= 1;
    s += marketPressure[i] > 0 ? 1 : -1;
    if (combBuy[i]) s += 2;
    if (combSell[i]) s -= 2;
    s += rmpSmoothed[i] > 0 ? 1 : -1;
    if (goldenCross[i]) s += 1;
    if (deathCross[i]) s -= 1;
    s += mpsSmoothed[i] > 0 ? 0.5 : -0.5;
    return s;
  });

  return {
    emaShort, emaLong, emaCrossLong, emaCrossShort,
    emaRaw, emaStepped, steppedCrossUp, steppedCrossDown,
    marketPressure, signalStrength,
    combShort, combLong, combBuy, combSell, atrVals, combTP1, combTP2, combTP3, combSL,
    fibHigh, fibLow, fib236, fib382, fib500, fib618, fib786,
    rmpSmoothed, rmpBuy, rmpSell,
    advShort, advLong, advSma, cloudBull, goldenCross, deathCross,
    mpsSmoothed,
    composite,
    ema200,
    ema21,
    macdLine,
    macdSignal,
    macdHist,
  };
}

export function getSignalBadges(ind: IndicatorResults, n: number): SignalBadge[] {
  const badges: SignalBadge[] = [];

  if (ind.emaCrossLong[n]) badges.push({ text: 'EMA Cross LONG', type: 'long' });
  if (ind.emaCrossShort[n]) badges.push({ text: 'EMA Cross SHORT', type: 'short' });
  if (ind.steppedCrossUp[n]) badges.push({ text: 'Stepped EMA \u2191', type: 'long' });
  if (ind.steppedCrossDown[n]) badges.push({ text: 'Stepped EMA \u2193', type: 'short' });
  badges.push(
    ind.marketPressure[n] > 0
      ? { text: 'Pressure +', type: 'long' }
      : { text: 'Pressure \u2212', type: 'short' }
  );
  if (ind.combBuy[n]) badges.push({ text: 'ATR BUY', type: 'fire' });
  if (ind.combSell[n]) badges.push({ text: 'ATR SELL', type: 'fire' });
  if (ind.rmpBuy[n]) badges.push({ text: 'RMP Buy', type: 'long' });
  if (ind.rmpSell[n]) badges.push({ text: 'RMP Sell', type: 'short' });
  badges.push(
    ind.cloudBull[n]
      ? { text: 'Cloud BULL', type: 'long' }
      : { text: 'Cloud BEAR', type: 'short' }
  );
  if (ind.goldenCross[n]) badges.push({ text: 'Golden Cross \u2726', type: 'fire' });
  if (ind.deathCross[n]) badges.push({ text: 'Death Cross \u2726', type: 'fire' });
  badges.push(
    ind.mpsSmoothed[n] > 0
      ? { text: 'Pressure SMA+', type: 'long' }
      : { text: 'Pressure SMA\u2212', type: 'short' }
  );

  if (!badges.length) badges.push({ text: 'WATCHING', type: 'neutral' });
  return badges;
}

export function getCompositeDescription(score: number): string {
  if (score >= 4) return 'Strong bullish confluence \u25b2\u25b2';
  if (score >= 2) return 'Moderate bullish bias \u25b2';
  if (score <= -4) return 'Strong bearish confluence \u25bc\u25bc';
  if (score <= -2) return 'Moderate bearish bias \u25bc';
  return 'Mixed / No clear edge';
}

export function seededRand(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function genCandles(basePrice: number, count: number = 120, volatility: number = 0.0003): Candle[] {
  const r = seededRand((basePrice * 1000) | 0);
  let p = basePrice * 0.97;
  const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const o = p;
    const bias = Math.sin(i / 20) * 0.0002;
    const move = (r() - 0.5 + bias) * p * volatility;
    const c = o + move;
    const h = Math.max(o, c) + r() * p * volatility * 0.5;
    const l = Math.min(o, c) - r() * p * volatility * 0.5;
    out.push({ o, h, l, c, v: Math.floor(500 + r() * 5000) });
    p = c;
  }
  out[out.length - 1].c = basePrice;
  return out;
}

export function formatPrice(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatIndicatorValue(v: number, dp: number = 2): string {
  if (isNaN(v)) return '\u2014';
  return v.toFixed(dp);
}
