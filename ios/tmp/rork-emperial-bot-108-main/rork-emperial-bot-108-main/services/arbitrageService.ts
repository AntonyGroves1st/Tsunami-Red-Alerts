import { fetch24hTicker, fetchTickerPrice, getBinanceSymbol } from './binanceApi';

export interface PlatformPrice {
  platform: string;
  platformId: string;
  price: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  lastUpdate: number;
  color: string;
  logo: string;
  fees: number;
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  symbolName: string;
  buyPlatform: PlatformPrice;
  sellPlatform: PlatformPrice;
  spread: number;
  spreadPercent: number;
  netProfitPercent: number;
  estimatedProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  type: 'spot' | 'futures' | 'cross-exchange';
  timestamp: number;
}

export interface ArbitragePair {
  symbol: string;
  symbolName: string;
  platforms: PlatformPrice[];
  bestBuy: PlatformPrice | null;
  bestSell: PlatformPrice | null;
  maxSpreadPercent: number;
}

const PLATFORM_CONFIG: Record<string, { name: string; color: string; logo: string; fees: number }> = {
  binance_spot: { name: 'Binance Spot', color: '#F0B90B', logo: 'BN', fees: 0.10 },
  binance_futures: { name: 'Binance Futures', color: '#F0B90B', logo: 'BF', fees: 0.04 },
  tradingview: { name: 'TradingView', color: '#2962FF', logo: 'TV', fees: 0 },
  ninjatrader: { name: 'NinjaTrader CME', color: '#FF6D00', logo: 'NT', fees: 0.62 },
  rprotrader: { name: 'R Pro Trader', color: '#00C853', logo: 'RP', fees: 0.50 },
};

const ARBITRAGE_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin', platforms: ['binance_spot', 'binance_futures', 'ninjatrader', 'rprotrader'] },
  { symbol: 'ETH', name: 'Ethereum', platforms: ['binance_spot', 'binance_futures', 'ninjatrader', 'rprotrader'] },
  { symbol: 'BNB', name: 'Binance Coin', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'SOL', name: 'Solana', platforms: ['binance_spot', 'binance_futures', 'rprotrader'] },
  { symbol: 'XRP', name: 'XRP', platforms: ['binance_spot', 'binance_futures', 'rprotrader'] },
  { symbol: 'DOGE', name: 'Dogecoin', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'ADA', name: 'Cardano', platforms: ['binance_spot', 'binance_futures', 'rprotrader'] },
  { symbol: 'AVAX', name: 'Avalanche', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'DOT', name: 'Polkadot', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'LINK', name: 'Chainlink', platforms: ['binance_spot', 'binance_futures', 'rprotrader'] },
  { symbol: 'MATIC', name: 'Polygon', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'ATOM', name: 'Cosmos', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'UNI', name: 'Uniswap', platforms: ['binance_spot', 'binance_futures'] },
  { symbol: 'LTC', name: 'Litecoin', platforms: ['binance_spot', 'binance_futures', 'rprotrader'] },
  { symbol: 'GC', name: 'Gold', platforms: ['binance_spot', 'ninjatrader', 'rprotrader'] },
];

function simulatePlatformPrice(
  basePrice: number,
  platformId: string,
  symbol: string,
): { price: number; bid: number; ask: number; volume: number } {
  const seed = (symbol.charCodeAt(0) * 31 + platformId.charCodeAt(0) * 17) % 1000;
  const now = Date.now();
  const timeFactor = Math.sin(now / 30000 + seed) * 0.001;
  const platformOffset = (seed / 1000 - 0.5) * 0.004;

  let spreadBps = 5;
  if (platformId === 'binance_futures') spreadBps = 2;
  if (platformId === 'ninjatrader') spreadBps = 12;
  if (platformId === 'rprotrader') spreadBps = 8;

  const price = basePrice * (1 + platformOffset + timeFactor);
  const halfSpread = price * (spreadBps / 10000);

  const volumeBase = symbol === 'BTC' ? 28000 : symbol === 'ETH' ? 180000 : 50000;
  const volumeMult = platformId.includes('binance') ? 1.8 : 0.6;

  return {
    price,
    bid: price - halfSpread,
    ask: price + halfSpread,
    volume: volumeBase * volumeMult * (0.8 + (seed % 40) / 100),
  };
}

export async function fetchArbitragePairs(): Promise<ArbitragePair[]> {
  const pairs: ArbitragePair[] = [];

  for (const config of ARBITRAGE_SYMBOLS) {
    const binanceSymbol = getBinanceSymbol(config.symbol);
    let basePrice: number | null = null;

    if (binanceSymbol) {
      const ticker = await fetch24hTicker(config.symbol);
      if (ticker) {
        basePrice = ticker.price;
      } else {
        basePrice = await fetchTickerPrice(config.symbol);
      }
    }

    if (!basePrice) {
      console.log(`[Arbitrage] No base price for ${config.symbol}, skipping`);
      continue;
    }

    const platforms: PlatformPrice[] = [];

    for (const platId of config.platforms) {
      const platConfig = PLATFORM_CONFIG[platId];
      if (!platConfig) continue;

      const sim = simulatePlatformPrice(basePrice, platId, config.symbol);

      platforms.push({
        platform: platConfig.name,
        platformId: platId,
        price: sim.price,
        bidPrice: sim.bid,
        askPrice: sim.ask,
        volume24h: sim.volume,
        lastUpdate: Date.now(),
        color: platConfig.color,
        logo: platConfig.logo,
        fees: platConfig.fees,
      });
    }

    if (platforms.length < 2) continue;

    let bestBuy: PlatformPrice | null = null;
    let bestSell: PlatformPrice | null = null;

    for (const p of platforms) {
      if (!bestBuy || p.askPrice < bestBuy.askPrice) bestBuy = p;
      if (!bestSell || p.bidPrice > bestSell.bidPrice) bestSell = p;
    }

    const maxSpread = bestBuy && bestSell
      ? ((bestSell.bidPrice - bestBuy.askPrice) / bestBuy.askPrice) * 100
      : 0;

    pairs.push({
      symbol: config.symbol,
      symbolName: config.name,
      platforms,
      bestBuy,
      bestSell,
      maxSpreadPercent: maxSpread,
    });
  }

  console.log(`[Arbitrage] Fetched ${pairs.length} pairs`);
  return pairs;
}

export function findOpportunities(pairs: ArbitragePair[]): ArbitrageOpportunity[] {
  const opps: ArbitrageOpportunity[] = [];

  for (const pair of pairs) {
    for (let i = 0; i < pair.platforms.length; i++) {
      for (let j = 0; j < pair.platforms.length; j++) {
        if (i === j) continue;

        const buyPlat = pair.platforms[i];
        const sellPlat = pair.platforms[j];

        const spread = sellPlat.bidPrice - buyPlat.askPrice;
        const spreadPercent = (spread / buyPlat.askPrice) * 100;
        const totalFees = buyPlat.fees + sellPlat.fees;
        const netProfit = spreadPercent - (totalFees / 100);

        if (spreadPercent > -0.5) {
          const tradeSize = pair.symbol === 'BTC' ? 1 : pair.symbol === 'ETH' ? 10 : 100;
          const estimatedProfit = spread * tradeSize;

          let riskLevel: 'low' | 'medium' | 'high' = 'high';
          if (netProfit > 0.1) riskLevel = 'low';
          else if (netProfit > 0) riskLevel = 'medium';

          let type: 'spot' | 'futures' | 'cross-exchange' = 'cross-exchange';
          if (buyPlat.platformId.includes('binance') && sellPlat.platformId.includes('binance')) {
            type = buyPlat.platformId.includes('futures') || sellPlat.platformId.includes('futures')
              ? 'futures' : 'spot';
          }

          opps.push({
            id: `${pair.symbol}_${buyPlat.platformId}_${sellPlat.platformId}`,
            symbol: pair.symbol,
            symbolName: pair.symbolName,
            buyPlatform: buyPlat,
            sellPlatform: sellPlat,
            spread,
            spreadPercent,
            netProfitPercent: netProfit,
            estimatedProfit,
            riskLevel,
            type,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  opps.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
  console.log(`[Arbitrage] Found ${opps.length} opportunities`);
  return opps;
}

export function formatPrice(price: number, symbol: string): string {
  if (symbol === 'BTC' || symbol === 'MBT') return price.toFixed(2);
  if (symbol === 'ETH' || symbol === 'MET') return price.toFixed(2);
  if (symbol === 'GC' || symbol === 'MGC') return price.toFixed(2);
  if (['SOL', 'AVAX', 'DOT', 'LINK', 'ATOM', 'UNI', 'LTC'].includes(symbol)) return price.toFixed(2);
  if (['XRP', 'DOGE', 'ADA', 'MATIC'].includes(symbol)) return price.toFixed(4);
  if (price > 1000) return price.toFixed(2);
  if (price > 1) return price.toFixed(4);
  return price.toFixed(6);
}
