import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, getAssetColor } from '@/constants/colors';
import { SPECS, CATEGORIES } from '@/constants/instruments';
import { useMarketData } from '@/hooks/useMarketData';
import { Search, Check, Wifi, TrendingUp, TrendingDown, Globe, BarChart3, ArrowUpDown, PhoneCall, ShieldMinus, Activity } from 'lucide-react-native';
import { hasLiveData, fetch24hTicker } from '@/services/binanceApi';
import { hasFuturesData, fetchFuturesPricesBatch, getCachedPrice } from '@/services/futuresApi';
import { hasOptionsData, fetchOptionsPricesBatch, getCachedOptionsPrice, OptionsPriceData } from '@/services/optionsApi';
import { fetchAllIndices, getCachedIndex, isIndexSymbol as isIndexSymbolApi, hasIndexLiveData, getLiveIndicesCount } from '@/services/indicesApi';
import { Haptics } from '@/utils/haptics';
import { Platform } from 'react-native';

type MarketSegment = 'all' | 'indices' | 'futures' | 'options' | 'crypto';

const INDEX_SYMBOLS = ['SPX','NDX','DJI','RUT','VIX','FTSE','DAX','N225','HSI','STOXX','FCHI','GSPC','NYA','SOX'];

function isIndexSymbol(sym: string): boolean {
  return INDEX_SYMBOLS.includes(sym) || isIndexSymbolApi(sym);
}

const SEGMENTS: { key: MarketSegment; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Globe size={12} color={Colors.text2} /> },
  { key: 'indices', label: 'Indices', icon: <Activity size={12} color={Colors.cyan} /> },
  { key: 'futures', label: 'Futures', icon: <ArrowUpDown size={12} color={Colors.blue} /> },
  { key: 'options', label: 'Options', icon: <BarChart3 size={12} color={Colors.orange} /> },
  { key: 'crypto', label: 'Crypto', icon: <Wifi size={12} color={Colors.lavender} /> },
];

interface LivePrice {
  price: number;
  change: number;
  changePercent: number;
}

interface OptionsGreeks {
  delta?: number;
  theta?: number;
  gamma?: number;
  iv?: number;
  underlyingPrice?: number;
}

const InstrumentItem = React.memo(function InstrumentItem({
  sym,
  isSelected,
  onPress,
  isSmall,
  livePrice,
  optionsGreeks,
}: {
  sym: string;
  isSelected: boolean;
  onPress: () => void;
  isSmall: boolean;
  livePrice: LivePrice | null;
  optionsGreeks?: OptionsGreeks | null;
}) {
  const spec = SPECS[sym];
  if (!spec) return null;
  const color = getAssetColor(sym);

  const isBinanceLive = hasLiveData(sym);
  const isFuturesLive = hasFuturesData(sym);
  const isOptionsLive = hasOptionsData(sym);
  const hasLive = isBinanceLive || isFuturesLive || isOptionsLive;

  const displayPrice = livePrice?.price ?? spec.base;
  const change = livePrice?.changePercent ?? 0;
  const isPositive = change >= 0;

  const formatPrice = (p: number): string => {
    if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 100) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const isIndexLive = isIndexSymbol(sym) && hasIndexLiveData(sym);

  const getBadgeInfo = (): { icon: React.ReactNode; label: string; style: any; textStyle: any } => {
    if (isBinanceLive) {
      return {
        icon: <Wifi size={9} color={Colors.green} />,
        label: 'LIVE',
        style: styles.liveBadge,
        textStyle: styles.liveBadgeText,
      };
    }
    if (isOptionsLive) {
      return {
        icon: <BarChart3 size={9} color={Colors.orange} />,
        label: 'OPT',
        style: [styles.liveBadge, styles.optionsBadge],
        textStyle: [styles.liveBadgeText, styles.optionsBadgeText],
      };
    }
    if (isIndexSymbol(sym)) {
      if (isIndexLive) {
        return {
          icon: <Wifi size={9} color={Colors.green} />,
          label: 'LIVE',
          style: styles.liveBadge,
          textStyle: styles.liveBadgeText,
        };
      }
      return {
        icon: <Activity size={9} color={Colors.cyan} />,
        label: 'IDX',
        style: [styles.liveBadge, styles.indexBadge],
        textStyle: [styles.liveBadgeText, styles.indexBadgeText],
      };
    }
    return {
      icon: <Globe size={9} color={Colors.blue} />,
      label: 'MKT',
      style: [styles.liveBadge, styles.futuresBadge],
      textStyle: [styles.liveBadgeText, styles.futuresBadgeText],
    };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.instItem,
        isSelected && styles.instItemSelected,
        pressed && { opacity: 0.7 },
        { paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 8 : 10 },
      ]}
      testID={`market-item-${sym}`}
    >
      <View style={styles.instLeft}>
        <View style={[styles.instDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.instSymbol, { color: isSelected ? color : Colors.white, fontSize: isSmall ? 12 : 14 }]}>{sym}</Text>
          <Text style={[styles.instName, { fontSize: isSmall ? 10 : 11 }]} numberOfLines={1}>{spec.name}</Text>
          {isOptionsLive && optionsGreeks && optionsGreeks.underlyingPrice != null && (
            <Text style={styles.underlyingText} numberOfLines={1}>
              Underlying: ${optionsGreeks.underlyingPrice.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.instRight}>
        {hasLive && (
          <View style={badgeInfo.style}>
            {badgeInfo.icon}
            <Text style={badgeInfo.textStyle}>{badgeInfo.label}</Text>
          </View>
        )}
        <View style={styles.instMeta}>
          <Text style={styles.instExch}>{spec.exch}</Text>
          <Text style={[styles.instPrice, { fontSize: isSmall ? 10 : 11 }]}>
            ${formatPrice(displayPrice)}
          </Text>
          {livePrice && change !== 0 && (
            <View style={styles.changeRow}>
              {isPositive ? (
                <TrendingUp size={8} color={Colors.green} />
              ) : (
                <TrendingDown size={8} color={Colors.red} />
              )}
              <Text style={[styles.changeText, { color: isPositive ? Colors.green : Colors.red }]}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </Text>
            </View>
          )}
          {isOptionsLive && optionsGreeks && (
            <View style={styles.greeksRow}>
              <Text style={styles.greekText}>Δ{(optionsGreeks.delta ?? 0).toFixed(2)}</Text>
              <Text style={styles.greekDivider}>·</Text>
              <Text style={styles.greekText}>IV {((optionsGreeks.iv ?? 0) * 100).toFixed(0)}%</Text>
            </View>
          )}
        </View>
        {isSelected && <Check size={isSmall ? 14 : 16} color={Colors.amber} />}
      </View>
    </Pressable>
  );
});

function SegmentBar({
  active,
  onSelect,
  counts,
}: {
  active: MarketSegment;
  onSelect: (seg: MarketSegment) => void;
  counts: Record<MarketSegment, number>;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const segmentIndex = SEGMENTS.findIndex((s) => s.key === active);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: segmentIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [segmentIndex, slideAnim]);

  return (
    <View style={styles.segmentContainer}>
      {SEGMENTS.map((seg, idx) => {
        const isActive = active === seg.key;
        return (
          <Pressable
            key={seg.key}
            onPress={() => {
              Haptics.impact('light');
              onSelect(seg.key);
            }}
            style={[
              styles.segmentBtn,
              isActive && styles.segmentBtnActive,
            ]}
            testID={`segment-${seg.key}`}
          >
            {seg.icon}
            <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
              {seg.label}
            </Text>
            <View style={[styles.segmentCount, isActive && styles.segmentCountActive]}>
              <Text style={[styles.segmentCountText, isActive && styles.segmentCountTextActive]}>
                {counts[seg.key]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const { instrument, setInstrument } = useMarketData();
  const [search, setSearch] = useState<string>('');
  const [segment, setSegment] = useState<MarketSegment>('all');
  const { width: screenWidth } = useWindowDimensions();
  const isSmall = screenWidth < 360;
  const hPad = isSmall ? 12 : 16;

  const [livePrices, setLivePrices] = useState<Map<string, LivePrice>>(new Map());
  const [optionsData, setOptionsData] = useState<Map<string, OptionsPriceData>>(new Map());
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(true);
  const initialLoadDoneRef = useRef<boolean>(false);
  const fetchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const segmentCounts = useMemo(() => {
    let allCount = 0;
    let indicesCount = 0;
    let futuresCount = 0;
    let optionsCount = 0;
    let cryptoCount = 0;

    for (const cat of CATEGORIES) {
      for (const sym of cat.symbols) {
        allCount++;
        if (isIndexSymbol(sym)) {
          indicesCount++;
        } else if (hasOptionsData(sym)) {
          optionsCount++;
        } else if (hasLiveData(sym)) {
          cryptoCount++;
        } else if (hasFuturesData(sym)) {
          futuresCount++;
        } else {
          futuresCount++;
        }
      }
    }

    return {
      all: allCount,
      indices: indicesCount,
      futures: futuresCount,
      options: optionsCount,
      crypto: cryptoCount,
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    return CATEGORIES.map((cat) => ({
      ...cat,
      symbols: cat.symbols.filter((sym) => {
        if (segment === 'indices' && !isIndexSymbol(sym)) return false;
        if (segment === 'options' && !hasOptionsData(sym)) return false;
        if (segment === 'crypto' && !hasLiveData(sym)) return false;
        if (segment === 'futures') {
          if (hasOptionsData(sym) || hasLiveData(sym) || isIndexSymbol(sym)) return false;
        }

        if (q) {
          const spec = SPECS[sym];
          return (
            sym.toLowerCase().includes(q) ||
            spec?.name.toLowerCase().includes(q) ||
            spec?.exch.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    })).filter((cat) => cat.symbols.length > 0);
  }, [search, segment]);

  const allFuturesSymbols = useMemo(() => {
    const syms: string[] = [];
    for (const cat of CATEGORIES) {
      for (const sym of cat.symbols) {
        if (hasFuturesData(sym) && !hasLiveData(sym) && !hasOptionsData(sym)) {
          syms.push(sym);
        }
      }
    }
    return syms;
  }, []);

  const allOptionsSymbols = useMemo(() => {
    const syms: string[] = [];
    for (const cat of CATEGORIES) {
      for (const sym of cat.symbols) {
        if (hasOptionsData(sym)) {
          syms.push(sym);
        }
      }
    }
    return syms;
  }, []);

  const allBinanceSymbols = useMemo(() => {
    const syms: string[] = [];
    for (const cat of CATEGORIES) {
      for (const sym of cat.symbols) {
        if (hasLiveData(sym)) {
          syms.push(sym);
        }
      }
    }
    return syms;
  }, []);

  const allIndexSymbols = useMemo(() => {
    const syms: string[] = [];
    for (const cat of CATEGORIES) {
      for (const sym of cat.symbols) {
        if (isIndexSymbol(sym)) {
          syms.push(sym);
        }
      }
    }
    return syms;
  }, []);

  const fetchBinancePrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    console.log('[Markets] Fetching Binance prices for', symbols.length, 'instruments');

    const unique = [...new Set(symbols)];
    const BATCH = 2;
    for (let i = 0; i < unique.length; i += BATCH) {
      if (!isMountedRef.current) return;
      const batch = unique.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((sym) => fetch24hTicker(sym).then((ticker) => ({ sym, ticker })))
      );

      if (!isMountedRef.current) return;

      const updates: Array<{ sym: string; price: number; change: number; changePercent: number }> = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.ticker) {
          const { sym, ticker } = result.value;
          if (isFinite(ticker.price) && ticker.price > 0) {
            updates.push({
              sym,
              price: ticker.price,
              change: ticker.priceChange24h,
              changePercent: ticker.priceChangePercent24h,
            });
          }
        }
      }

      if (updates.length > 0) {
        setLivePrices((prev) => {
          const next = new Map(prev);
          for (const u of updates) {
            next.set(u.sym, { price: u.price, change: u.change, changePercent: u.changePercent });
          }
          return next;
        });
        console.log('[Markets] Updated', updates.length, 'Binance prices');
      }

      if (i + BATCH < unique.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }, []);

  const fetchFuturesPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    console.log('[Markets] Fetching futures prices for', symbols.length, 'instruments');

    try {
      const results = await fetchFuturesPricesBatch(symbols);
      if (!isMountedRef.current) return;

      setLivePrices((prev) => {
        const next = new Map(prev);
        results.forEach((data, sym) => {
          next.set(sym, {
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
          });
        });
        return next;
      });
      console.log('[Markets] Updated', results.size, 'futures prices');
    } catch (err) {
      console.log('[Markets] Futures price fetch error:', err);
    }
  }, []);

  const fetchIndicesPrices = useCallback(async () => {
    console.log('[Markets] Fetching indices prices');
    try {
      const results = await fetchAllIndices();
      if (!isMountedRef.current) return;

      setLivePrices((prev) => {
        const next = new Map(prev);
        results.forEach((data, sym) => {
          next.set(sym, {
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
          });
        });
        return next;
      });
      console.log('[Markets] Updated', results.size, 'indices prices');
    } catch (err) {
      console.log('[Markets] Indices price fetch error:', err);
    }
  }, []);

  const fetchOptionsPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    console.log('[Markets] Fetching options prices for', symbols.length, 'instruments');

    try {
      const results = await fetchOptionsPricesBatch(symbols);
      if (!isMountedRef.current) return;

      setOptionsData((prev) => {
        const next = new Map(prev);
        results.forEach((data, sym) => {
          next.set(sym, data);
        });
        return next;
      });

      setLivePrices((prev) => {
        const next = new Map(prev);
        results.forEach((data, sym) => {
          next.set(sym, {
            price: data.optionPrice,
            change: data.change,
            changePercent: data.changePercent,
          });
        });
        return next;
      });
      console.log('[Markets] Updated', results.size, 'options prices');
    } catch (err) {
      console.log('[Markets] Options price fetch error:', err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    for (const sym of allFuturesSymbols) {
      const cached = getCachedPrice(sym);
      if (cached) {
        setLivePrices((prev) => {
          const next = new Map(prev);
          next.set(sym, { price: cached.price, change: cached.change, changePercent: cached.changePercent });
          return next;
        });
      }
    }

    for (const sym of allIndexSymbols) {
      const cached = getCachedIndex(sym);
      if (cached) {
        setLivePrices((prev) => {
          const next = new Map(prev);
          next.set(sym, { price: cached.price, change: cached.change, changePercent: cached.changePercent });
          return next;
        });
      }
    }

    for (const sym of allOptionsSymbols) {
      const cached = getCachedOptionsPrice(sym);
      if (cached) {
        setOptionsData((prev) => {
          const next = new Map(prev);
          next.set(sym, cached);
          return next;
        });
        setLivePrices((prev) => {
          const next = new Map(prev);
          next.set(sym, { price: cached.optionPrice, change: cached.change, changePercent: cached.changePercent });
          return next;
        });
      }
    }

    const staggerDelay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const loadAll = async () => {
      if (!initialLoadDoneRef.current) {
        setIsLoadingPrices(true);
      }
      try {
        console.log('[Markets] Staggered load: Binance prices...');
        await fetchBinancePrices(allBinanceSymbols);
        if (!isMountedRef.current) return;
        await staggerDelay(1000);

        console.log('[Markets] Staggered load: Futures prices...');
        await fetchFuturesPrices(allFuturesSymbols);
        if (!isMountedRef.current) return;
        await staggerDelay(1000);

        console.log('[Markets] Staggered load: Options prices...');
        await fetchOptionsPrices(allOptionsSymbols);
        if (!isMountedRef.current) return;
        await staggerDelay(1000);

        console.log('[Markets] Staggered load: Indices prices...');
        await fetchIndicesPrices();
      } catch (err) {
        console.log('[Markets] Staggered load error:', err);
      }
      if (isMountedRef.current) {
        setIsLoadingPrices(false);
        initialLoadDoneRef.current = true;
        console.log('[Markets] Staggered initial load complete');
      }
    };

    const startTimer = setTimeout(loadAll, 2500);

    if (fetchTimerRef.current) {
      clearInterval(fetchTimerRef.current);
    }
    let refreshCycle = 0;
    fetchTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;
      refreshCycle++;
      const group = refreshCycle % 4;
      try {
        if (group === 0) {
          console.log('[Markets] Refresh cycle: Binance');
          await fetchBinancePrices(allBinanceSymbols);
        } else if (group === 1) {
          console.log('[Markets] Refresh cycle: Futures');
          await fetchFuturesPrices(allFuturesSymbols);
        } else if (group === 2) {
          console.log('[Markets] Refresh cycle: Options');
          await fetchOptionsPrices(allOptionsSymbols);
        } else {
          console.log('[Markets] Refresh cycle: Indices');
          await fetchIndicesPrices();
        }
      } catch (err) {
        console.log('[Markets] Staggered refresh error:', err);
      }
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(startTimer);
      if (fetchTimerRef.current) {
        clearInterval(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
    };
  }, [allFuturesSymbols, allBinanceSymbols, allOptionsSymbols, allIndexSymbols, fetchBinancePrices, fetchFuturesPrices, fetchOptionsPrices, fetchIndicesPrices]);

  const handleSelect = useCallback(
    (sym: string) => {
      Haptics.impact('medium');
      setInstrument(sym);
    },
    [setInstrument]
  );

  const getLivePrice = useCallback((sym: string): LivePrice | null => {
    return livePrices.get(sym) ?? null;
  }, [livePrices]);

  const getOptionsGreeks = useCallback((sym: string): OptionsGreeks | null => {
    const data = optionsData.get(sym);
    if (!data) return null;
    return {
      delta: data.delta,
      theta: data.theta,
      gamma: data.gamma,
      iv: data.impliedVol,
      underlyingPrice: data.underlyingPrice,
    };
  }, [optionsData]);

  const totalLive = useMemo(() => {
    const binanceCount = Object.keys(SPECS).filter(hasLiveData).length;
    const futuresCount = Object.keys(SPECS).filter((s) => hasFuturesData(s) && !hasLiveData(s) && !hasOptionsData(s) && !isIndexSymbol(s)).length;
    const optionsCount = Object.keys(SPECS).filter((s) => hasOptionsData(s)).length;
    const indicesCount = allIndexSymbols.length;
    return binanceCount + futuresCount + optionsCount + indicesCount;
  }, [allIndexSymbols]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { fontSize: isSmall ? 16 : 18 }]}>Markets</Text>
          {isLoadingPrices && (
            <ActivityIndicator size="small" color={Colors.amber} />
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {Object.keys(SPECS).length} instruments · {totalLive} with live data
        </Text>
      </View>

      <View style={{ paddingHorizontal: hPad }}>
        <SegmentBar active={segment} onSelect={setSegment} counts={segmentCounts} />
      </View>

      <View style={[styles.searchContainer, { marginHorizontal: hPad, paddingHorizontal: isSmall ? 10 : 12 }]}>
        <Search size={isSmall ? 14 : 16} color={Colors.text2} />
        <TextInput
          style={[styles.searchInput, { fontSize: isSmall ? 13 : 14 }]}
          placeholder="Search instruments..."
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          testID="market-search-input"
        />
      </View>

      {segment === 'options' && (
        <View style={[styles.optionsSummaryBar, { marginHorizontal: hPad }]}>
          <View style={styles.optSumItem}>
            <PhoneCall size={10} color={Colors.green} />
            <Text style={styles.optSumLabel}>Calls</Text>
            <Text style={styles.optSumValue}>
              {allOptionsSymbols.filter((s) => s.endsWith('_C')).length}
            </Text>
          </View>
          <View style={styles.optSumDivider} />
          <View style={styles.optSumItem}>
            <ShieldMinus size={10} color={Colors.red} />
            <Text style={styles.optSumLabel}>Puts</Text>
            <Text style={styles.optSumValue}>
              {allOptionsSymbols.filter((s) => s.endsWith('_P')).length}
            </Text>
          </View>
          <View style={styles.optSumDivider} />
          <View style={styles.optSumItem}>
            <BarChart3 size={10} color={Colors.orange} />
            <Text style={styles.optSumLabel}>Underlyings</Text>
            <Text style={styles.optSumValue}>
              {new Set(allOptionsSymbols.map((s) => s.replace(/_[CP]$/, ''))).size}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No instruments found</Text>
            <Text style={styles.emptySubText}>
              {search ? 'Try a different search term' : 'No instruments in this category'}
            </Text>
          </View>
        )}
        {filteredCategories.map((cat) => (
          <View key={cat.label} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryLine} />
              <Text style={styles.categoryLabel}>{cat.label.toUpperCase()}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{cat.symbols.length}</Text>
              </View>
              <View style={styles.categoryLine} />
            </View>
            {cat.symbols.map((sym) => (
              <InstrumentItem
                key={sym}
                sym={sym}
                isSelected={instrument === sym}
                onPress={() => handleSelect(sym)}
                isSmall={isSmall}
                livePrice={getLivePrice(sym)}
                optionsGreeks={hasOptionsData(sym) ? getOptionsGreeks(sym) : null}
              />
            ))}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    paddingVertical: 12,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: Colors.amber + '50',
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  segmentLabelActive: {
    color: Colors.amber,
  },
  segmentCount: {
    backgroundColor: Colors.bg3,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  segmentCountActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  segmentCountText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text3,
  },
  segmentCountTextActive: {
    color: Colors.amber,
  },
  optionsSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optSumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optSumLabel: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  optSumValue: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700' as const,
  },
  optSumDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.text3,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  categoryLabel: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  categoryBadge: {
    backgroundColor: Colors.bg3,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '700' as const,
  },
  instItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instItemSelected: {
    borderColor: Colors.amber + '40',
    backgroundColor: Colors.bg2,
  },
  instLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  instDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  instSymbol: {
    fontWeight: '700' as const,
  },
  instName: {
    color: Colors.text2,
    marginTop: 1,
    fontSize: 11,
  },
  instRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    marginLeft: 6,
  },
  instMeta: {
    alignItems: 'flex-end',
  },
  instExch: {
    fontSize: 11,
    color: Colors.text3,
    letterSpacing: 0.5,
  },
  instPrice: {
    color: Colors.text2,
    fontWeight: '500' as const,
    marginTop: 1,
    fontSize: 12,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  liveBadgeText: {
    fontSize: 11,
    color: Colors.green,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  futuresBadge: {
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderColor: 'rgba(56,189,248,0.25)',
  },
  futuresBadgeText: {
    color: Colors.blue,
  },
  optionsBadge: {
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderColor: 'rgba(251,146,60,0.25)',
  },
  optionsBadgeText: {
    color: Colors.orange,
  },
  indexBadge: {
    backgroundColor: 'rgba(103,232,249,0.1)',
    borderColor: 'rgba(103,232,249,0.25)',
  },
  indexBadgeText: {
    color: Colors.cyan,
  },
  underlyingText: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 1,
  },
  greeksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  greekText: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '600' as const,
  },
  greekDivider: {
    fontSize: 11,
    color: Colors.text3,
  },
});
