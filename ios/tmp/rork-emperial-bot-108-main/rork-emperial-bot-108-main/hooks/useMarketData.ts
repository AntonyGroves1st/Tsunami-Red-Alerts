import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { SPECS, TIMEFRAMES } from '@/constants/instruments';
import { INDICATORS } from '@/constants/indicators';
import {
  Candle,
  IndicatorResults,
  IndicatorParams,
  SignalBadge,
  computeIndicators,
  genCandles,
  getSignalBadges,
  getCompositeDescription,
} from '@/utils/calculations';
import { IndicatorSettingsValues, getDefaultSettings } from '@/constants/indicatorSettings';
import {
  hasLiveData as hasBinanceLiveData,
  hasBinanceData,
  fetchKlines,
  getLiveSymbols,
  getApiHealth,
  ApiHealthStatus,
  resetApiState,
  fetch24hTicker,
  fetchRecentTrades,
  connectWebSocket,
  TickerData,
  RecentTrade,
} from '@/services/binanceApi';
import {
  hasFuturesData,
  fetchFuturesKlines,
  fetchFuturesPrice,
  clearPriceCache,
} from '@/services/futuresApi';
import {
  hasOptionsData,
  fetchOptionsKlines,
  fetchOptionsPrice,
  clearOptionsCache,
  OptionsPriceData,
} from '@/services/optionsApi';

export interface MarketState {
  instrument: string;
  timeframe: string;
  price: number;
  dayOpen: number;
  candles: Candle[];
  indicators: IndicatorResults | null;
  badges: SignalBadge[];
  compositeScore: number;
  compositeDesc: string;
  indicatorToggles: Record<string, boolean>;
  indicatorSettings: IndicatorSettingsValues;
  isLive: boolean;
  dataSource: 'live' | 'sim';
  liveMode: boolean;
  setLiveMode: (on: boolean) => void;
  canUseLive: boolean;
  liveRefreshRate: number;
  setLiveRefreshRate: (rate: number) => void;
  lastUpdated: number | null;
  liveSymbols: string[];
  apiHealth: ApiHealthStatus;
  connectionError: string | null;
  retryConnection: () => void;
  isConnecting: boolean;
  tickerData: TickerData | null;
  recentTrades: RecentTrade[];
  wsConnected: boolean;
}

export const [MarketDataProvider, useMarketData] = createContextHook(() => {
  const [instrument, setInstrumentState] = useState<string>('BTC');
  const [timeframe, setTimeframeState] = useState<string>('1s');
  const [price, setPrice] = useState<number>(SPECS['BTC'].base);
  const [dayOpen, setDayOpen] = useState<number>(SPECS['BTC'].base);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<IndicatorResults | null>(null);
  const [badges, setBadges] = useState<SignalBadge[]>([]);
  const [compositeScore, setCompositeScore] = useState<number>(0);
  const [compositeDesc, setCompositeDesc] = useState<string>('Calculating...');
  const [indicatorToggles, setIndicatorToggles] = useState<Record<string, boolean>>(() => {
    const toggles: Record<string, boolean> = {};
    INDICATORS.forEach((ind) => {
      toggles[ind.id] = ind.on;
    });
    return toggles;
  });
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettingsValues>(getDefaultSettings);

  const [dataSource, setDataSource] = useState<'live' | 'sim'>('sim');
  const [liveMode, setLiveMode] = useState<boolean>(true);
  const [liveRefreshRate, setLiveRefreshRate] = useState<number>(1);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
    isHealthy: true,
    consecutiveFailures: 0,
    lastError: null,
    lastSuccessTime: null,
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<number>(0);
  const candlesRef = useRef<Candle[]>([]);
  const priceRef = useRef<number>(SPECS['BTC'].base);
  const isRealDataRef = useRef<boolean>(false);
  const healthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef<number>(0);
  const wsCleanupRef = useRef<(() => void) | null>(null);
  const tickerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveModeRef = useRef<boolean>(true);
  const instrumentRef = useRef<string>('BTC');
  const timeframeRef = useRef<string>('1s');
  const settingsRef = useRef<IndicatorSettingsValues>(getDefaultSettings());
  const isFetchingRef = useRef<boolean>(false);
  const buildVersionRef = useRef<number>(0);

  liveModeRef.current = liveMode;
  instrumentRef.current = instrument;
  timeframeRef.current = timeframe;
  settingsRef.current = indicatorSettings;

  const settingsToParams = useCallback((s: IndicatorSettingsValues): IndicatorParams => {
    return {
      ema_cross: s.ema_cross,
      stepped_ema: s.stepped_ema,
      mp_v1: s.mp_v1,
      combined: s.combined,
      refined_mp: s.refined_mp,
      cloud: s.cloud,
      fib: s.fib,
      mps: s.mps,
    };
  }, []);

  const applyCandles = useCallback((newCandles: Candle[], settings: IndicatorSettingsValues) => {
    if (!newCandles || newCandles.length === 0) {
      console.log('[Market] applyCandles called with empty data, skipping');
      return;
    }

    candlesRef.current = newCandles;
    setCandles([...newCandles]);
    const lastPrice = newCandles[newCandles.length - 1].c;
    priceRef.current = lastPrice;
    setPrice(lastPrice);
    setLastUpdated(Date.now());

    try {
      const p = settingsToParams(settings);
      const ind = computeIndicators(newCandles, p);
      setIndicators(ind);
      const n = newCandles.length - 1;
      setBadges(getSignalBadges(ind, n));
      const score = ind.composite[n];
      setCompositeScore(score);
      setCompositeDesc(getCompositeDescription(score));
    } catch (err) {
      console.log('[Market] Error computing indicators:', err);
    }
  }, [settingsToParams]);

  const startWebSocket = useCallback((sym: string) => {
    if (wsCleanupRef.current) {
      wsCleanupRef.current();
      wsCleanupRef.current = null;
    }

    if (!hasBinanceLiveData(sym)) {
      setWsConnected(false);
      return;
    }

    console.log('[Market] Starting WebSocket for', sym);

    const cleanup = connectWebSocket(
      sym,
      (data) => {
        priceRef.current = data.price;
        setPrice(data.price);
        setLastUpdated(Date.now());

        setTickerData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            price: data.price,
            bidPrice: data.bidPrice,
            askPrice: data.askPrice,
          };
        });
      },
      (error) => {
        console.log('[Market] WS error:', error);
        setWsConnected(false);
      },
      () => {
        console.log('[Market] WS connected');
        setWsConnected(true);
      },
    );

    wsCleanupRef.current = cleanup;
  }, []);

  const fetchLiveData = useCallback(async (sym: string, tf: string, settings: IndicatorSettingsValues, version: number) => {
    if (isFetchingRef.current) {
      console.log('[Market] Already fetching, skipping duplicate request');
      return;
    }

    const isBinance = hasBinanceLiveData(sym);
    const isFutures = hasFuturesData(sym);
    const isOptions = hasOptionsData(sym);

    if (!isBinance && !isFutures && !isOptions) return;
    if (!liveModeRef.current) return;

    isFetchingRef.current = true;
    setIsConnecting(true);

    try {
      if (isBinance) {
        console.log('[Market] Fetching Binance live data for', sym, tf);

        const realCandles = await fetchKlines(sym, tf).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );

        await new Promise((r) => setTimeout(r, 500));

        const ticker = await fetch24hTicker(sym).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );

        await new Promise((r) => setTimeout(r, 300));

        const trades = await fetchRecentTrades(sym, 20).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );

        if (version !== buildVersionRef.current) {
          console.log('[Market] Build version changed, discarding stale data');
          return;
        }

        const klines = realCandles.status === 'fulfilled' ? realCandles.value : null;
        const tickerResult = ticker.status === 'fulfilled' ? (ticker as any).value : null;
        const tradesResult = trades.status === 'fulfilled' ? (trades as any).value : null;

        if (klines && klines.length > 0) {
          console.log('[Market] Got', klines.length, 'Binance candles for', sym);
          isRealDataRef.current = true;
          setDataSource('live');
          setDayOpen(klines[0].o);
          setConnectionError(null);
          retryCountRef.current = 0;
          applyCandles(klines, settings);

          if (tickerResult) setTickerData(tickerResult);
          if (tradesResult) setRecentTrades(tradesResult);

          startWebSocket(sym);
        } else {
          console.log('[Market] No Binance data returned, staying on sim');
          if (tickerResult) {
            setTickerData(tickerResult);
            setPrice(tickerResult.price);
            priceRef.current = tickerResult.price;
          }
          setConnectionError('Unable to fetch candle data. Price updates may still work.');
        }
      } else if (isFutures) {
        console.log('[Market] Fetching futures data for', sym, tf);

        const realCandles = await fetchFuturesKlines(sym, tf).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );
        await new Promise((r) => setTimeout(r, 500));
        const priceData = await fetchFuturesPrice(sym).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );

        if (version !== buildVersionRef.current) {
          console.log('[Market] Build version changed, discarding stale data');
          return;
        }

        const klines = realCandles.status === 'fulfilled' ? realCandles.value : null;
        const priceResult = priceData.status === 'fulfilled' ? (priceData as any).value : null;

        if (klines && klines.length > 0) {
          console.log('[Market] Got', klines.length, 'futures candles for', sym);
          isRealDataRef.current = true;
          setDataSource('live');
          setDayOpen(klines[0].o);
          setConnectionError(null);
          retryCountRef.current = 0;
          applyCandles(klines, settings);

          if (priceResult) {
            setTickerData({
              price: priceResult.price,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: priceResult.change,
              priceChangePercent24h: priceResult.changePercent,
              bidPrice: priceResult.price,
              askPrice: priceResult.price,
            });
          }
        } else {
          console.log('[Market] No futures data returned, staying on sim');
          if (priceResult) {
            setPrice(priceResult.price);
            priceRef.current = priceResult.price;
            setTickerData({
              price: priceResult.price,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: priceResult.change,
              priceChangePercent24h: priceResult.changePercent,
              bidPrice: priceResult.price,
              askPrice: priceResult.price,
            });
          }
          setConnectionError('Market may be closed or data unavailable.');
        }
      } else if (isOptions) {
        console.log('[Market] Fetching options data for', sym, tf);

        const realCandles = await fetchOptionsKlines(sym, tf).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );
        await new Promise((r) => setTimeout(r, 500));
        const priceData = await fetchOptionsPrice(sym).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        );

        if (version !== buildVersionRef.current) {
          console.log('[Market] Build version changed, discarding stale data');
          return;
        }

        const klines = realCandles.status === 'fulfilled' ? realCandles.value : null;
        const optResult = priceData.status === 'fulfilled' ? (priceData as any).value : null;

        if (klines && klines.length > 0) {
          console.log('[Market] Got', klines.length, 'options candles for', sym);
          isRealDataRef.current = true;
          setDataSource('live');
          setDayOpen(klines[0].o);
          setConnectionError(null);
          retryCountRef.current = 0;
          applyCandles(klines, settings);

          if (optResult) {
            setTickerData({
              price: optResult.optionPrice,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: optResult.change,
              priceChangePercent24h: optResult.changePercent,
              bidPrice: optResult.optionPrice * 0.99,
              askPrice: optResult.optionPrice * 1.01,
            });
          }
        } else {
          console.log('[Market] No options data returned, staying on sim');
          if (optResult) {
            setPrice(optResult.optionPrice);
            priceRef.current = optResult.optionPrice;
            setTickerData({
              price: optResult.optionPrice,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: optResult.change,
              priceChangePercent24h: optResult.changePercent,
              bidPrice: optResult.optionPrice * 0.99,
              askPrice: optResult.optionPrice * 1.01,
            });
          }
          setConnectionError('Options data may be delayed or market closed.');
        }
      }
    } catch (err: any) {
      console.log('[Market] Live data fetch failed:', err?.message ?? err);
      if (version === buildVersionRef.current) {
        setConnectionError(err?.message ?? 'Connection failed');
      }
    } finally {
      isFetchingRef.current = false;
      if (version === buildVersionRef.current) {
        setIsConnecting(false);
      }
    }
  }, [applyCandles, startWebSocket]);

  const rebuildCandles = useCallback((sym: string, tf: string, settings: IndicatorSettingsValues) => {
    const spec = SPECS[sym];
    if (!spec) {
      console.log('[Market] Unknown instrument:', sym);
      return;
    }

    const version = ++buildVersionRef.current;
    console.log('[Market] Rebuilding candles for', sym, tf, 'v' + version);

    if (wsCleanupRef.current) {
      wsCleanupRef.current();
      wsCleanupRef.current = null;
    }

    isRealDataRef.current = false;
    isFetchingRef.current = false;
    setDataSource('sim');
    setConnectionError(null);
    setTickerData(null);
    setRecentTrades([]);
    setWsConnected(false);
    setIsConnecting(false);

    const tfConfig = TIMEFRAMES.find((t) => t.key === tf) ?? TIMEFRAMES[5];
    const newCandles = genCandles(spec.base, tfConfig.count, spec.vol * tfConfig.volMult);
    candlesRef.current = newCandles;
    priceRef.current = spec.base;
    setCandles([...newCandles]);
    setPrice(spec.base);
    setDayOpen(spec.base);

    try {
      const p = settingsToParams(settings);
      const ind = computeIndicators(newCandles, p);
      setIndicators(ind);
      const n = newCandles.length - 1;
      setBadges(getSignalBadges(ind, n));
      const score = ind.composite[n];
      setCompositeScore(score);
      setCompositeDesc(getCompositeDescription(score));
    } catch (err) {
      console.log('[Market] Error computing initial indicators:', err);
    }

    if (liveModeRef.current && (hasBinanceLiveData(sym) || hasFuturesData(sym) || hasOptionsData(sym))) {
      setTimeout(() => {
        if (version === buildVersionRef.current) {
          fetchLiveData(sym, tf, settings, version);
        }
      }, 1500);
    }
  }, [settingsToParams, fetchLiveData]);

  const retryConnection = useCallback(() => {
    console.log('[Market] Manual retry triggered');
    retryCountRef.current = 0;
    setConnectionError(null);
    isFetchingRef.current = false;
    resetApiState();
    clearPriceCache();
    clearOptionsCache();
    rebuildCandles(instrumentRef.current, timeframeRef.current, settingsRef.current);
  }, [rebuildCandles]);

  useEffect(() => {
    rebuildCandles(instrument, timeframe, indicatorSettings);
  }, [instrument, timeframe, liveMode]);

  useEffect(() => {
    if (healthPollRef.current) {
      clearInterval(healthPollRef.current);
    }

    healthPollRef.current = setInterval(() => {
      const health = getApiHealth();
      setApiHealth(health);

      if (!health.isHealthy && isRealDataRef.current) {
        console.log('[Market] API health degraded, failures:', health.consecutiveFailures);
      }
    }, 30000);

    return () => {
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, []);

  useEffect(() => {
    if (tickerPollRef.current) {
      clearInterval(tickerPollRef.current);
    }

    if (isRealDataRef.current && liveMode && hasBinanceLiveData(instrument)) {
      let tickerCycle = 0;
      tickerPollRef.current = setInterval(() => {
        if (!isRealDataRef.current || !liveModeRef.current) return;
        tickerCycle++;

        if (tickerCycle % 2 === 0) {
          fetch24hTicker(instrumentRef.current).then((ticker) => {
            if (ticker) setTickerData(ticker);
          }).catch(() => {});
        } else {
          fetchRecentTrades(instrumentRef.current, 20).then((trades) => {
            if (trades) setRecentTrades(trades);
          }).catch(() => {});
        }
      }, 8000);
    } else if (isRealDataRef.current && liveMode && hasFuturesData(instrument)) {
      tickerPollRef.current = setInterval(() => {
        if (!isRealDataRef.current || !liveModeRef.current) return;

        fetchFuturesPrice(instrumentRef.current).then((priceData: any) => {
          if (priceData) {
            setPrice(priceData.price);
            priceRef.current = priceData.price;
            setTickerData({
              price: priceData.price,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: priceData.change,
              priceChangePercent24h: priceData.changePercent,
              bidPrice: priceData.price,
              askPrice: priceData.price,
            });
            setLastUpdated(Date.now());
          }
        }).catch((err) => {
          console.log('[Market] Futures ticker poll error:', err);
        });
      }, 25000);
    } else if (isRealDataRef.current && liveMode && hasOptionsData(instrument)) {
      tickerPollRef.current = setInterval(() => {
        if (!isRealDataRef.current || !liveModeRef.current) return;

        fetchOptionsPrice(instrumentRef.current).then((optData: any) => {
          if (optData) {
            setPrice(optData.optionPrice);
            priceRef.current = optData.optionPrice;
            setTickerData({
              price: optData.optionPrice,
              high24h: 0,
              low24h: 0,
              volume24h: 0,
              priceChange24h: optData.change,
              priceChangePercent24h: optData.changePercent,
              bidPrice: optData.optionPrice * 0.99,
              askPrice: optData.optionPrice * 1.01,
            });
            setLastUpdated(Date.now());
          }
        }).catch((err) => {
          console.log('[Market] Options ticker poll error:', err);
        });
      }, 25000);
    }

    return () => {
      if (tickerPollRef.current) clearInterval(tickerPollRef.current);
    };
  }, [instrument, liveMode, dataSource]);

  useEffect(() => {
    if (simRef.current) {
      clearInterval(simRef.current);
    }

    const currentInstrument = instrument;
    const currentTimeframe = timeframe;

    simRef.current = setInterval(() => {
      tickRef.current++;

      if (tickRef.current <= 2) return;

      if (isRealDataRef.current && liveModeRef.current) {
        const refreshRate = liveRefreshRate;
        if (refreshRate > 1 && tickRef.current % refreshRate !== 0) return;

        const backoffMultiplier = Math.min(Math.pow(2, retryCountRef.current), 16);
        const effectiveInterval = Math.max(refreshRate, 3) * backoffMultiplier;

        if (retryCountRef.current > 0 && tickRef.current % effectiveInterval !== 0) {
          return;
        }

        if (isFetchingRef.current) return;

        const sym = instrumentRef.current;
        const tf = timeframeRef.current;

        const fetchFn = hasBinanceLiveData(sym)
          ? fetchKlines(sym, tf)
          : hasOptionsData(sym)
            ? fetchOptionsKlines(sym, tf)
            : fetchFuturesKlines(sym, tf);

        fetchFn.then((realCandles) => {
          if (realCandles && realCandles.length > 0) {
            retryCountRef.current = 0;
            setConnectionError(null);
            applyCandles(realCandles, settingsRef.current);
          } else {
            retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
            console.log('[Market] Live refresh returned empty, retry count:', retryCountRef.current);
          }
        }).catch((err) => {
          retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
          console.log('[Market] Live refresh error:', err?.message ?? err);
        });
        return;
      }

      const spec = SPECS[currentInstrument];
      if (!spec || candlesRef.current.length === 0) return;

      const currentCandles = candlesRef.current;
      const last = currentCandles[currentCandles.length - 1];
      const move = (Math.random() - 0.495) * last.c * spec.vol;
      const newC = Math.round((last.c + move) / spec.tick) * spec.tick;

      last.c = newC;
      last.h = Math.max(last.h, newC);
      last.l = Math.min(last.l, newC);
      priceRef.current = newC;

      if (tickRef.current % 60 === 0) {
        currentCandles.push({ o: newC, h: newC, l: newC, c: newC, v: 0 });
        const tfConfig = TIMEFRAMES.find((t) => t.key === currentTimeframe) ?? TIMEFRAMES[5];
        const maxLen = tfConfig.count + 50;
        if (currentCandles.length > maxLen) currentCandles.shift();
      }

      setPrice(newC);

      const newCandlesCopy = [...currentCandles];
      candlesRef.current = currentCandles;
      setCandles(newCandlesCopy);

      if (tickRef.current % 3 === 0) {
        try {
          const ind = computeIndicators(currentCandles, settingsToParams(settingsRef.current));
          setIndicators(ind);
          const n = currentCandles.length - 1;
          setBadges(getSignalBadges(ind, n));
          const score = ind.composite[n];
          setCompositeScore(score);
          setCompositeDesc(getCompositeDescription(score));
        } catch (err) {
          console.log('[Market] Sim indicator compute error:', err);
        }
      }
    }, 1000);

    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [instrument, timeframe, settingsToParams, applyCandles, liveRefreshRate]);

  useEffect(() => {
    return () => {
      if (wsCleanupRef.current) {
        wsCleanupRef.current();
        wsCleanupRef.current = null;
      }
      if (simRef.current) clearInterval(simRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
      if (tickerPollRef.current) clearInterval(tickerPollRef.current);
    };
  }, []);

  const canUseLive = useMemo(() => hasBinanceLiveData(instrument) || hasFuturesData(instrument) || hasOptionsData(instrument), [instrument]);
  const liveSymbols = useMemo(() => getLiveSymbols(), []);

  const setInstrument = useCallback((sym: string) => {
    tickRef.current = 0;
    retryCountRef.current = 0;
    isFetchingRef.current = false;
    setConnectionError(null);
    setInstrumentState(sym);
  }, []);

  const setTimeframe = useCallback((tf: string) => {
    tickRef.current = 0;
    retryCountRef.current = 0;
    setTimeframeState(tf);
  }, []);

  const toggleIndicator = useCallback((id: string) => {
    setIndicatorToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const updateIndicatorSetting = useCallback((indicatorId: string, key: string, value: number) => {
    setIndicatorSettings((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [key]: value,
      },
    }));
  }, []);

  const resetIndicatorSettings = useCallback((indicatorId: string) => {
    const defaults = getDefaultSettings();
    setIndicatorSettings((prev) => ({
      ...prev,
      [indicatorId]: defaults[indicatorId],
    }));
  }, []);

  const spec = useMemo(() => SPECS[instrument], [instrument]);

  const priceChange = useMemo(() => {
    if (tickerData && dataSource === 'live') {
      return {
        change: tickerData.priceChange24h,
        percent: tickerData.priceChangePercent24h,
      };
    }
    const chg = price - dayOpen;
    const pct = dayOpen !== 0 ? (chg / dayOpen) * 100 : 0;
    return { change: chg, percent: pct };
  }, [price, dayOpen, tickerData, dataSource]);

  const oscillatorData = useMemo(() => {
    if (!indicators || candles.length === 0) {
      return { mp: 0, rmp: 0, mps: 0 };
    }
    const n = candles.length - 1;
    return {
      mp: indicators.marketPressure[n] ?? 0,
      rmp: indicators.rmpSmoothed[n] ?? 0,
      mps: indicators.mpsSmoothed[n] ?? 0,
    };
  }, [indicators, candles]);

  return {
    instrument,
    timeframe,
    price,
    dayOpen,
    candles,
    indicators,
    badges,
    compositeScore,
    compositeDesc,
    indicatorToggles,
    indicatorSettings,
    spec,
    priceChange,
    oscillatorData,
    setInstrument,
    setTimeframe,
    toggleIndicator,
    updateIndicatorSetting,
    resetIndicatorSettings,
    isLive: true,
    dataSource,
    liveMode,
    setLiveMode,
    canUseLive,
    liveRefreshRate,
    setLiveRefreshRate,
    lastUpdated,
    liveSymbols,
    apiHealth,
    connectionError,
    retryConnection,
    isConnecting,
    tickerData,
    recentTrades,
    wsConnected,
  };
});
