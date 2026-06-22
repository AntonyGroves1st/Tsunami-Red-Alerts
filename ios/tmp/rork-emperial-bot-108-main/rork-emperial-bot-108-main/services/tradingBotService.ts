import { fetchTickerPrice, fetch24hTicker, getBinanceSymbol, getApiHealth } from './binanceApi';
import { isNetworkOnline } from './brokerHealthService';
import { canRequest } from './circuitBreaker';

export type SignalDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'pending' | 'open' | 'closed' | 'cancelled' | 'stopped';
export type SignalSource = 'ema_cross' | 'golden_cross' | 'death_cross' | 'atr_signal' | 'rmp_signal' | 'pressure_flip' | 'cloud_flip' | 'composite' | 'manual';

export interface TradingSignal {
  id: string;
  instrument: string;
  direction: SignalDirection;
  source: SignalSource;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  executed: boolean;
}

export interface BotTrade {
  id: string;
  signalId: string;
  instrument: string;
  direction: SignalDirection;
  entryPrice: number;
  currentPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercent: number;
  status: TradeStatus;
  openTime: number;
  closeTime: number | null;
  source: SignalSource;
  fees: number;
}

export interface BotPerformance {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface TradingBotConfig {
  enabled: boolean;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  maxPositionSize: number;
  maxConcurrentTrades: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStop: boolean;
  trailingStopPercent: number;
  autoCloseEOD: boolean;
  allowedInstruments: string[];
  signalSources: SignalSource[];
  minConfidence: number;
  cooldownSeconds: number;
}

export const DEFAULT_BOT_CONFIG: TradingBotConfig = {
  enabled: true,
  riskLevel: 'moderate',
  maxPositionSize: 5000,
  maxConcurrentTrades: 3,
  stopLossPercent: 2.0,
  takeProfitPercent: 4.0,
  trailingStop: false,
  trailingStopPercent: 1.5,
  autoCloseEOD: true,
  allowedInstruments: ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK'],
  signalSources: ['ema_cross', 'golden_cross', 'atr_signal', 'rmp_signal', 'pressure_flip', 'composite'],
  minConfidence: 60,
  cooldownSeconds: 60,
};

export const SIGNAL_SOURCE_LABELS: Record<SignalSource, string> = {
  ema_cross: 'EMA Cross',
  golden_cross: 'Golden Cross',
  death_cross: 'Death Cross',
  atr_signal: 'ATR Signal',
  rmp_signal: 'RMP Signal',
  pressure_flip: 'Pressure Flip',
  cloud_flip: 'Cloud Flip',
  composite: 'Composite',
  manual: 'Manual',
};

function generateSignalId(): string {
  return 'sig_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateTradeId(): string {
  return 'trd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function simulateSignalConfidence(source: SignalSource, instrument: string): number {
  const seed = (instrument.charCodeAt(0) * 31 + Date.now() % 10000) % 100;
  const baseConf: Record<SignalSource, number> = {
    ema_cross: 65,
    golden_cross: 78,
    death_cross: 75,
    atr_signal: 60,
    rmp_signal: 70,
    pressure_flip: 68,
    cloud_flip: 72,
    composite: 82,
    manual: 90,
  };
  const base = baseConf[source] ?? 65;
  return Math.min(99, Math.max(40, base + (seed % 20) - 10));
}

const MAX_PRICE_AGE_MS = 60000;
const MAX_SIGNAL_BATCH = 50;
const MIN_PRICE_SANITY: Record<string, { min: number; max: number }> = {
  BTC: { min: 1000, max: 1000000 },
  ETH: { min: 50, max: 100000 },
  BNB: { min: 1, max: 10000 },
  SOL: { min: 0.1, max: 10000 },
  XRP: { min: 0.001, max: 100 },
  DOGE: { min: 0.0001, max: 10 },
  ADA: { min: 0.001, max: 100 },
  AVAX: { min: 0.1, max: 5000 },
  DOT: { min: 0.1, max: 5000 },
  LINK: { min: 0.1, max: 5000 },
  MATIC: { min: 0.001, max: 100 },
  ATOM: { min: 0.1, max: 5000 },
  UNI: { min: 0.1, max: 5000 },
  LTC: { min: 1, max: 10000 },
};

function isPriceSane(instrument: string, price: number): boolean {
  const bounds = MIN_PRICE_SANITY[instrument];
  if (!bounds) return price > 0 && isFinite(price);
  if (price < bounds.min || price > bounds.max) {
    console.log(`[TradingBot] SAFETY: ${instrument} price ${price} outside sane range [${bounds.min}-${bounds.max}]`);
    return false;
  }
  return true;
}

export async function generateSignals(
  instruments: string[],
  sources: SignalSource[],
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];

  if (!isNetworkOnline()) {
    console.log('[TradingBot] Network offline, skipping signal generation');
    return signals;
  }

  const apiHealth = getApiHealth();
  if (!apiHealth.isHealthy && apiHealth.consecutiveFailures >= 5) {
    console.log('[TradingBot] API unhealthy, skipping signal generation');
    return signals;
  }

  if (!canRequest('binance-rest')) {
    console.log('[TradingBot] Binance circuit breaker open, skipping');
    return signals;
  }

  for (const instrument of instruments) {
    const binSymbol = getBinanceSymbol(instrument);
    if (!binSymbol) continue;

    let basePrice: number | null = null;
    try {
      const ticker = await fetch24hTicker(instrument);
      if (ticker) {
        basePrice = ticker.price;
      } else {
        basePrice = await fetchTickerPrice(instrument);
      }
    } catch (err: any) {
      console.log(`[TradingBot] Error fetching price for ${instrument}:`, err?.message);
      continue;
    }

    if (!basePrice) {
      console.log(`[TradingBot] No price for ${instrument}, skipping`);
      continue;
    }

    if (!isPriceSane(instrument, basePrice)) {
      console.log(`[TradingBot] SAFETY: Rejecting insane price for ${instrument}: ${basePrice}`);
      continue;
    }

    const now = Date.now();
    const timeSeed = Math.sin(now / 45000 + instrument.charCodeAt(0)) * 0.5 + 0.5;

    for (const source of sources) {
      const shouldGenerate = timeSeed > 0.55 || (source === 'composite' && timeSeed > 0.4);
      if (!shouldGenerate) continue;

      const confidence = simulateSignalConfidence(source, instrument);
      const direction: SignalDirection = timeSeed > 0.55 ? 'LONG' : 'SHORT';

      const slPercent = direction === 'LONG' ? -0.02 : 0.02;
      const tpPercent = direction === 'LONG' ? 0.04 : -0.04;

      signals.push({
        id: generateSignalId(),
        instrument,
        direction,
        source,
        confidence,
        entryPrice: basePrice,
        stopLoss: basePrice * (1 + slPercent),
        takeProfit: basePrice * (1 + tpPercent),
        timestamp: now,
        executed: false,
      });
    }
  }

  signals.sort((a, b) => b.confidence - a.confidence);
  const capped = signals.slice(0, MAX_SIGNAL_BATCH);
  if (signals.length > MAX_SIGNAL_BATCH) {
    console.log(`[TradingBot] Capped signals from ${signals.length} to ${MAX_SIGNAL_BATCH}`);
  }
  console.log(`[TradingBot] Generated ${capped.length} signals`);
  return capped;
}

export async function fetchLivePrices(instruments: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  if (!isNetworkOnline()) {
    console.log('[TradingBot] Network offline, returning empty prices');
    return prices;
  }

  for (const instrument of instruments) {
    try {
      const ticker = await fetch24hTicker(instrument);
      if (ticker && isPriceSane(instrument, ticker.price)) {
        prices[instrument] = ticker.price;
      } else {
        const price = await fetchTickerPrice(instrument);
        if (price && isPriceSane(instrument, price)) {
          prices[instrument] = price;
        }
      }
    } catch (err: any) {
      console.log(`[TradingBot] Price fetch error for ${instrument}:`, err?.message);
    }
  }

  return prices;
}

export function simulateTradeExecution(
  signal: TradingSignal,
  config: TradingBotConfig,
): BotTrade | null {
  if (!isPriceSane(signal.instrument, signal.entryPrice)) {
    console.log(`[TradingBot] SAFETY: Rejecting trade with insane entry price: ${signal.instrument} ${signal.entryPrice}`);
    return null;
  }

  if (signal.confidence < config.minConfidence) {
    console.log(`[TradingBot] SAFETY: Signal confidence ${signal.confidence}% below minimum ${config.minConfidence}%`);
    return null;
  }

  if (!config.allowedInstruments.includes(signal.instrument)) {
    console.log(`[TradingBot] SAFETY: ${signal.instrument} not in allowed instruments`);
    return null;
  }

  const signalAge = Date.now() - signal.timestamp;
  if (signalAge > MAX_PRICE_AGE_MS) {
    console.log(`[TradingBot] SAFETY: Signal is ${Math.round(signalAge / 1000)}s old, too stale`);
    return null;
  }

  const positionValue = Math.min(config.maxPositionSize, 1000);
  const quantity = positionValue / signal.entryPrice;

  const slDistance = signal.entryPrice * (config.stopLossPercent / 100);
  const tpDistance = signal.entryPrice * (config.takeProfitPercent / 100);

  const stopLoss = signal.direction === 'LONG'
    ? signal.entryPrice - slDistance
    : signal.entryPrice + slDistance;

  const takeProfit = signal.direction === 'LONG'
    ? signal.entryPrice + tpDistance
    : signal.entryPrice - tpDistance;

  const feeRate = 0.001;
  const fees = signal.entryPrice * quantity * feeRate;

  return {
    id: generateTradeId(),
    signalId: signal.id,
    instrument: signal.instrument,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    currentPrice: signal.entryPrice,
    exitPrice: null,
    quantity,
    stopLoss,
    takeProfit,
    pnl: -fees,
    pnlPercent: 0,
    status: 'open',
    openTime: Date.now(),
    closeTime: null,
    source: signal.source,
    fees,
  };
}

export function updateTradeWithPrice(trade: BotTrade, currentPrice: number): BotTrade {
  if (trade.status !== 'open') return trade;

  if (!isFinite(currentPrice) || currentPrice <= 0) {
    console.log(`[TradingBot] SAFETY: Invalid price ${currentPrice} for trade ${trade.id}, keeping current`);
    return trade;
  }

  if (!isPriceSane(trade.instrument, currentPrice)) {
    console.log(`[TradingBot] SAFETY: Insane price update ${currentPrice} for ${trade.instrument}, ignoring`);
    return trade;
  }

  const pctChange = Math.abs((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
  if (pctChange > 50) {
    console.log(`[TradingBot] SAFETY: Price moved ${pctChange.toFixed(1)}% from entry, suspicious flash crash/spike`);
    return trade;
  }

  const direction = trade.direction === 'LONG' ? 1 : -1;
  const priceDiff = (currentPrice - trade.entryPrice) * direction;
  const pnl = priceDiff * trade.quantity - trade.fees;
  const pnlPercent = (priceDiff / trade.entryPrice) * 100;

  let status: TradeStatus = 'open';
  let exitPrice: number | null = null;
  let closeTime: number | null = null;

  if (trade.direction === 'LONG') {
    if (currentPrice <= trade.stopLoss) {
      status = 'stopped';
      exitPrice = trade.stopLoss;
      closeTime = Date.now();
    } else if (currentPrice >= trade.takeProfit) {
      status = 'closed';
      exitPrice = trade.takeProfit;
      closeTime = Date.now();
    }
  } else {
    if (currentPrice >= trade.stopLoss) {
      status = 'stopped';
      exitPrice = trade.stopLoss;
      closeTime = Date.now();
    } else if (currentPrice <= trade.takeProfit) {
      status = 'closed';
      exitPrice = trade.takeProfit;
      closeTime = Date.now();
    }
  }

  return {
    ...trade,
    currentPrice,
    pnl: exitPrice
      ? ((exitPrice - trade.entryPrice) * direction * trade.quantity) - trade.fees
      : pnl,
    pnlPercent,
    status,
    exitPrice,
    closeTime,
  };
}

export function calculatePerformance(trades: BotTrade[]): BotPerformance {
  const closed = trades.filter(t => t.status === 'closed' || t.status === 'stopped');
  const open = trades.filter(t => t.status === 'open');
  const wins = closed.filter(t => t.pnl > 0);
  const losses = closed.filter(t => t.pnl <= 0);

  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const best = closed.length > 0 ? Math.max(...closed.map(t => t.pnl)) : 0;
  const worst = closed.length > 0 ? Math.min(...closed.map(t => t.pnl)) : 0;

  const grossWins = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  let maxDrawdown = 0;
  let peak = 0;
  let runningPnl = 0;
  for (const t of closed) {
    runningPnl += t.pnl;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsWins = 0;
  let maxConsLosses = 0;
  for (const t of closed) {
    if (t.pnl > 0) {
      consecutiveWins++;
      consecutiveLosses = 0;
    } else {
      consecutiveLosses++;
      consecutiveWins = 0;
    }
    maxConsWins = Math.max(maxConsWins, consecutiveWins);
    maxConsLosses = Math.max(maxConsLosses, consecutiveLosses);
  }

  const pnls = closed.map(t => t.pnl);
  const mean = pnls.length > 0 ? pnls.reduce((s, v) => s + v, 0) / pnls.length : 0;
  const variance = pnls.length > 1
    ? pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / (pnls.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

  return {
    totalTrades: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    avgWin,
    avgLoss,
    bestTrade: best,
    worstTrade: worst,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    consecutiveWins: maxConsWins,
    consecutiveLosses: maxConsLosses,
  };
}

const MOCK_TRADES: BotTrade[] = [
  { id: 'trd_m1', signalId: 'sig_m1', instrument: 'BTC', direction: 'LONG', entryPrice: 67250, currentPrice: 68100, exitPrice: 68100, quantity: 0.074, stopLoss: 65905, takeProfit: 69940, pnl: 56.93, pnlPercent: 1.26, status: 'closed', openTime: Date.now() - 7200000, closeTime: Date.now() - 3600000, source: 'ema_cross', fees: 4.98 },
  { id: 'trd_m2', signalId: 'sig_m2', instrument: 'ETH', direction: 'SHORT', entryPrice: 3580, currentPrice: 3520, exitPrice: 3520, quantity: 1.396, stopLoss: 3651.6, takeProfit: 3436.8, pnl: 75.60, pnlPercent: 1.68, status: 'closed', openTime: Date.now() - 14400000, closeTime: Date.now() - 10800000, source: 'pressure_flip', fees: 5.0 },
  { id: 'trd_m3', signalId: 'sig_m3', instrument: 'SOL', direction: 'LONG', entryPrice: 144.80, currentPrice: 146.20, exitPrice: null, quantity: 34.53, stopLoss: 141.90, takeProfit: 150.59, pnl: 43.60, pnlPercent: 0.97, status: 'open', openTime: Date.now() - 1800000, closeTime: null, source: 'composite', fees: 5.0 },
  { id: 'trd_m4', signalId: 'sig_m4', instrument: 'BTC', direction: 'LONG', entryPrice: 68500, currentPrice: 68350, exitPrice: null, quantity: 0.073, stopLoss: 67130, takeProfit: 71240, pnl: -15.95, pnlPercent: -0.22, status: 'open', openTime: Date.now() - 900000, closeTime: null, source: 'rmp_signal', fees: 5.0 },
  { id: 'trd_m5', signalId: 'sig_m5', instrument: 'XRP', direction: 'LONG', entryPrice: 0.618, currentPrice: 0.632, exitPrice: 0.632, quantity: 8090, stopLoss: 0.606, takeProfit: 0.643, pnl: 108.26, pnlPercent: 2.27, status: 'closed', openTime: Date.now() - 86400000, closeTime: Date.now() - 82800000, source: 'golden_cross', fees: 5.0 },
  { id: 'trd_m6', signalId: 'sig_m6', instrument: 'DOGE', direction: 'SHORT', entryPrice: 0.0821, currentPrice: 0.0835, exitPrice: 0.0835, quantity: 60901, stopLoss: 0.0837, takeProfit: 0.0788, pnl: -90.46, pnlPercent: -1.71, status: 'stopped', openTime: Date.now() - 172800000, closeTime: Date.now() - 169200000, source: 'atr_signal', fees: 5.0 },
  { id: 'trd_m7', signalId: 'sig_m7', instrument: 'ADA', direction: 'LONG', entryPrice: 0.448, currentPrice: 0.462, exitPrice: 0.462, quantity: 11160, stopLoss: 0.439, takeProfit: 0.466, pnl: 151.24, pnlPercent: 3.13, status: 'closed', openTime: Date.now() - 259200000, closeTime: Date.now() - 252000000, source: 'cloud_flip', fees: 5.0 },
  { id: 'trd_m8', signalId: 'sig_m8', instrument: 'LINK', direction: 'LONG', entryPrice: 14.72, currentPrice: 14.95, exitPrice: 14.95, quantity: 339.67, stopLoss: 14.43, takeProfit: 15.31, pnl: 73.12, pnlPercent: 1.56, status: 'closed', openTime: Date.now() - 345600000, closeTime: Date.now() - 338400000, source: 'ema_cross', fees: 5.0 },
  { id: 'trd_m9', signalId: 'sig_m9', instrument: 'AVAX', direction: 'SHORT', entryPrice: 35.40, currentPrice: 35.72, exitPrice: 35.72, quantity: 141.24, stopLoss: 36.11, takeProfit: 33.98, pnl: -50.20, pnlPercent: -0.90, status: 'stopped', openTime: Date.now() - 432000000, closeTime: Date.now() - 428400000, source: 'pressure_flip', fees: 5.0 },
  { id: 'trd_m10', signalId: 'sig_m10', instrument: 'DOT', direction: 'LONG', entryPrice: 7.18, currentPrice: 7.42, exitPrice: 7.42, quantity: 696.38, stopLoss: 7.04, takeProfit: 7.47, pnl: 162.13, pnlPercent: 3.34, status: 'closed', openTime: Date.now() - 518400000, closeTime: Date.now() - 511200000, source: 'composite', fees: 5.0 },
];

export function getMockTrades(): BotTrade[] {
  return [...MOCK_TRADES];
}

export function getMockSignals(): TradingSignal[] {
  return MOCK_TRADES.filter(t => t.status === 'open').map(t => ({
    id: t.signalId,
    instrument: t.instrument,
    direction: t.direction,
    source: t.source,
    confidence: 65 + Math.floor(Math.random() * 25),
    entryPrice: t.entryPrice,
    stopLoss: t.stopLoss,
    takeProfit: t.takeProfit,
    timestamp: t.openTime,
    executed: true,
  }));
}
