import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, getAssetColor } from '@/constants/colors';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice } from '@/utils/calculations';
import { INDICATORS } from '@/constants/indicators';
import { TIMEFRAMES } from '@/constants/instruments';
import TradingChart from '@/components/TradingChart';
import { Haptics } from '@/utils/haptics';
import { Wifi, WifiOff, ChevronUp, ChevronDown, Activity, Target, BarChart3, Settings2, X, ArrowLeft } from 'lucide-react-native';
import TradingLevelsPanel, { TradingLevelsData, DEFAULT_LEVELS } from '@/components/TradingLevels';
import BotConfigPanel from '@/components/BotConfigPanel';
import { TradingBotConfig, DEFAULT_BOT_CONFIG } from '@/services/tradingBotService';

const QUICK_TFS = ['1s', '5s', '15s', '30s', '45s', '1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1mo', '1y'];

interface DropdownState {
  levels: boolean;
  indicators: boolean;
  bot: boolean;
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={[styles.pulsingDot, { backgroundColor: color, opacity }]} />;
}

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const {
    instrument,
    timeframe,
    price,
    priceChange,
    candles,
    indicators,
    indicatorToggles,
    toggleIndicator,
    setTimeframe,
    spec,
    dataSource,
    liveMode,
    canUseLive,
    recentTrades,
    wsConnected,
  } = useMarketData();

  const [tradesExpanded, setTradesExpanded] = useState<boolean>(false);
  const [tradingLevels, setTradingLevels] = useState<TradingLevelsData>(DEFAULT_LEVELS);
  const [botConfig, setBotConfig] = useState<TradingBotConfig>(DEFAULT_BOT_CONFIG);
  const [dropdowns, setDropdowns] = useState<DropdownState>({
    levels: false,
    indicators: false,
    bot: false,
  });

  const assetColor = getAssetColor(instrument);
  const isBull = priceChange.change >= 0;
  const isLiveConnected = canUseLive && liveMode && dataSource === 'live';

  const [activePanel, setActivePanel] = useState<keyof DropdownState | null>(null);
  const panelSlide = useRef(new Animated.Value(0)).current;

  const openPanel = useCallback((section: keyof DropdownState) => {
    Haptics.impact('light');
    setActivePanel(section);
    Animated.timing(panelSlide, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [panelSlide]);

  const closePanel = useCallback(() => {
    Animated.timing(panelSlide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActivePanel(null);
    });
  }, [panelSlide]);

  const activeIndicatorCount = useMemo(() => {
    return INDICATORS.filter((ind) => indicatorToggles[ind.id] !== false).length;
  }, [indicatorToggles]);

  const activeLevelCount = useMemo(() => {
    return [
      tradingLevels.stopLoss.enabled,
      tradingLevels.trailingStop.enabled,
      tradingLevels.tp1.enabled,
      tradingLevels.tp2.enabled,
      tradingLevels.tp3.enabled,
    ].filter(Boolean).length;
  }, [tradingLevels]);

  const [chartAreaHeight, setChartAreaHeight] = useState<number>(0);

  const onChartAreaLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - chartAreaHeight) > 2) {
      setChartAreaHeight(h);
    }
  }, [chartAreaHeight]);

  const { mainChartH, oscChartH } = useMemo(() => {
    const zoomBarH = 26;
    const ohlcBarH = 22;
    const sepH = 1;
    const avail = chartAreaHeight - zoomBarH - ohlcBarH - sepH;
    if (avail <= 0) {
      return { mainChartH: 120, oscChartH: 40 };
    }
    return {
      mainChartH: Math.max(80, Math.floor(avail * 0.72)),
      oscChartH: Math.max(30, Math.floor(avail * 0.28)),
    };
  }, [chartAreaHeight]);

  const handleTf = useCallback(
    (tf: string) => {
      Haptics.impact('light');
      setTimeframe(tf);
    },
    [setTimeframe],
  );

  const handleToggle = useCallback(
    (id: string) => {
      Haptics.impact('light');
      toggleIndicator(id);
    },
    [toggleIndicator],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 6 : 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.symbol, { color: assetColor, fontSize: isSmall ? 14 : 16 }]}>{instrument}</Text>
          <Text style={[styles.name, { maxWidth: isSmall ? 70 : 100 }]} numberOfLines={1}>
            {spec?.name ?? ''}
          </Text>
        </View>
        <View style={styles.headerCenter}>
          <Text
            style={[styles.price, { color: assetColor, fontSize: isSmall ? 13 : 16 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatPrice(price)}
          </Text>
          <View
            style={[
              styles.changeBadge,
              { backgroundColor: isBull ? Colors.greenDim : Colors.redDim },
            ]}
          >
            <Text
              style={[styles.changeText, { color: isBull ? Colors.green : Colors.red, fontSize: isSmall ? 8 : 9 }]}
              numberOfLines={1}
            >
              {isBull ? '+' : ''}
              {priceChange.change.toFixed(2)} ({isBull ? '+' : ''}
              {priceChange.percent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.sourceBadge,
            {
              backgroundColor:
                dataSource === 'live' ? Colors.greenDim : Colors.amberDim,
            },
          ]}
        >
          {dataSource === 'live' ? (
            <PulsingDot color={Colors.green} />
          ) : (
            <PulsingDot color={Colors.amber} />
          )}
          {dataSource === 'live' ? (
            <Wifi size={isSmall ? 8 : 9} color={Colors.green} />
          ) : (
            <WifiOff size={isSmall ? 8 : 9} color={Colors.amber} />
          )}
          <Text
            style={[
              styles.sourceText,
              { color: dataSource === 'live' ? Colors.green : Colors.amber },
            ]}
          >
            {dataSource === 'live' ? 'LIVE' : 'SIM'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tfRow}
        contentContainerStyle={styles.tfContent}
      >
        {QUICK_TFS.map((tf) => {
          const isActive = timeframe === tf;
          const label = TIMEFRAMES.find((t) => t.key === tf)?.label ?? tf;
          return (
            <Pressable
              key={tf}
              onPress={() => handleTf(tf)}
              style={({ pressed }) => [
                styles.tfPill,
                isActive && styles.tfPillActive,
                pressed && { opacity: 0.7 },
                { paddingHorizontal: isSmall ? 8 : 12 },
              ]}
            >
              <Text style={[styles.tfText, isActive && styles.tfTextActive, { fontSize: isSmall ? 10 : 11 }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.chartArea} onLayout={onChartAreaLayout}>
        {chartAreaHeight > 0 && (
          <TradingChart
            candles={candles}
            indicators={indicators}
            indicatorToggles={indicatorToggles}
            width={width}
            mainHeight={mainChartH}
            oscHeight={oscChartH}
            tradingLevels={tradingLevels}
          />
        )}
      </View>

      <View style={styles.dropdownBar}>
        <Pressable
          onPress={() => openPanel('levels')}
          style={[styles.dropdownTab, activePanel === 'levels' && styles.dropdownTabActive]}
        >
          <Target size={14} color={activePanel === 'levels' ? Colors.amber : Colors.text2} />
          <Text style={[styles.dropdownTabText, activePanel === 'levels' && styles.dropdownTabTextActive]}>
            Levels
          </Text>
          {activeLevelCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeLevelCount}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.dropdownDivider} />

        <Pressable
          onPress={() => openPanel('indicators')}
          style={[styles.dropdownTab, activePanel === 'indicators' && styles.dropdownTabActive]}
        >
          <BarChart3 size={14} color={activePanel === 'indicators' ? '#38bdf8' : Colors.text2} />
          <Text style={[styles.dropdownTabText, activePanel === 'indicators' && { color: '#38bdf8' }]}>
            Indicators
          </Text>
          <View style={[styles.countBadge, { backgroundColor: '#38bdf8' + '20', borderColor: '#38bdf8' + '40' }]}>
            <Text style={[styles.countBadgeText, { color: '#38bdf8' }]}>{activeIndicatorCount}</Text>
          </View>
        </Pressable>

        <View style={styles.dropdownDivider} />

        <Pressable
          onPress={() => openPanel('bot')}
          style={[styles.dropdownTab, activePanel === 'bot' && styles.dropdownTabActive]}
        >
          <Settings2 size={14} color={activePanel === 'bot' ? '#a78bfa' : Colors.text2} />
          <Text style={[styles.dropdownTabText, activePanel === 'bot' && { color: '#a78bfa' }]}>
            Bot
          </Text>
        </Pressable>
      </View>

      {activePanel !== null && (
        <Animated.View
          style={[
            styles.fullPanel,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              opacity: panelSlide,
              transform: [{
                translateY: panelSlide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.fullPanelHeader}>
            <Pressable onPress={closePanel} style={styles.fullPanelBack} hitSlop={12}>
              <ArrowLeft size={20} color={Colors.text} />
            </Pressable>
            <Text style={[
              styles.fullPanelTitle,
              {
                color: activePanel === 'levels' ? Colors.amber
                  : activePanel === 'indicators' ? '#38bdf8'
                  : '#a78bfa',
              },
            ]}>
              {activePanel === 'levels' ? 'Trading Levels' : activePanel === 'indicators' ? 'Indicators' : 'Bot Config'}
            </Text>
            <Pressable onPress={closePanel} style={styles.fullPanelCloseBtn} hitSlop={12}>
              <X size={18} color={Colors.text2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.fullPanelScroll}
            contentContainerStyle={styles.fullPanelContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activePanel === 'levels' && (
              <TradingLevelsPanel
                levels={tradingLevels}
                onLevelsChange={setTradingLevels}
                currentPrice={price}
                alwaysExpanded
              />
            )}
            {activePanel === 'indicators' && (
              <View style={styles.indicatorGrid}>
                {INDICATORS.map((ind) => {
                  const isOn = indicatorToggles[ind.id] !== false;
                  return (
                    <Pressable
                      key={ind.id}
                      onPress={() => handleToggle(ind.id)}
                      style={({ pressed }) => [
                        styles.indicatorCard,
                        {
                          borderColor: isOn ? ind.color + '50' : Colors.border,
                          backgroundColor: isOn ? ind.color + '08' : Colors.bg2,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.indicatorCardTop}>
                        <View
                          style={[
                            styles.indicatorDot,
                            { backgroundColor: isOn ? ind.color : Colors.text3 },
                          ]}
                        />
                        <View
                          style={[
                            styles.indicatorStatus,
                            { backgroundColor: isOn ? ind.color + '20' : Colors.bg0 },
                          ]}
                        >
                          <Text style={[
                            styles.indicatorStatusText,
                            { color: isOn ? ind.color : Colors.text3 },
                          ]}>
                            {isOn ? 'ON' : 'OFF'}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.indicatorLabel,
                          { color: isOn ? Colors.text : Colors.text3 },
                        ]}
                        numberOfLines={1}
                      >
                        {ind.id === 'ema_cross'
                          ? 'EMA Cross'
                          : ind.id === 'stepped_ema'
                            ? 'Stepped EMA'
                            : ind.id === 'mp_v1'
                              ? 'Market Press.'
                              : ind.id === 'combined'
                                ? 'ATR Strategy'
                                : ind.id === 'refined_mp'
                                  ? 'Refined MP'
                                  : ind.id === 'cloud'
                                    ? 'MA Cloud'
                                    : ind.id === 'fib'
                                      ? 'Fibonacci'
                                      : 'Pressure SMA'}
                      </Text>
                      <Text style={[styles.indicatorSub, { color: isOn ? ind.color + '90' : Colors.text3 }]} numberOfLines={1}>
                        {ind.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {activePanel === 'bot' && (
              <BotConfigPanel
                config={botConfig}
                onConfigChange={setBotConfig}
                alwaysExpanded
              />
            )}
          </ScrollView>
        </Animated.View>
      )}

      {isLiveConnected && recentTrades.length > 0 && (
        <View style={styles.tradesCard}>
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              setTradesExpanded(!tradesExpanded);
            }}
            style={styles.tradesToggle}
          >
            <View style={styles.tradesToggleLeft}>
              <Activity size={12} color={Colors.amber} />
              <Text style={styles.tradesTitle}>RECENT TRADES</Text>
            </View>
            <View style={styles.tradesToggleRight}>
              <Text style={styles.tradesCount}>{recentTrades.slice(-10).length} trades</Text>
              {tradesExpanded ? (
                <ChevronUp size={14} color={Colors.text2} />
              ) : (
                <ChevronDown size={14} color={Colors.text2} />
              )}
            </View>
          </Pressable>
          {tradesExpanded && (
            <View>
              <View style={styles.tradesHeader}>
                <Text style={[styles.tradesHeaderText, { flex: 1 }]}>Price (USDT)</Text>
                <Text style={[styles.tradesHeaderText, { flex: 1, textAlign: 'center' as const }]}>Amount</Text>
                <Text style={[styles.tradesHeaderText, { flex: 1, textAlign: 'right' as const }]}>Time</Text>
              </View>
              {recentTrades.slice(-10).reverse().map((trade, idx) => (
                <View key={`${trade.time}-${idx}`} style={styles.tradeRow}>
                  <Text style={[styles.tradePrice, { color: trade.isBuyerMaker ? Colors.red : Colors.green }]}>
                    ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.tradeQty}>{trade.qty.toFixed(4)}</Text>
                  <Text style={styles.tradeTime}>{formatTradeTime(trade.time)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  function formatTradeTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg1,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  headerLeft: {
    flexShrink: 1,
    minWidth: 60,
  },
  headerCenter: {
    alignItems: 'flex-end',
    marginHorizontal: 6,
    flexShrink: 1,
  },
  symbol: {
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 10,
    color: Colors.text2,
    marginTop: 1,
  },
  price: {
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  changeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  changeText: {
    fontWeight: '600' as const,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  tfRow: {
    maxHeight: 34,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  tfContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tfPill: {
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tfPillActive: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  tfText: {
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  tfTextActive: {
    color: Colors.amber,
  },
  chartArea: {
    flex: 1,
  },
  dropdownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg1,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 0,
    zIndex: 15,
    ...(Platform.OS === 'android' ? { elevation: 5 } : {}),
  },
  dropdownTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownTabActive: {
    backgroundColor: Colors.bg0,
  },
  dropdownTabText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.2,
  },
  dropdownTabTextActive: {
    color: Colors.amber,
  },
  countBadge: {
    backgroundColor: Colors.amber + '20',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.amber + '40',
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.amber,
  },
  dropdownDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  fullPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg0,
    zIndex: 100,
  },
  fullPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fullPanelBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPanelTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  fullPanelCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPanelScroll: {
    flex: 1,
  },
  fullPanelContent: {
    paddingBottom: 40,
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  indicatorCard: {
    width: '47%' as unknown as number,
    flexGrow: 1,
    flexBasis: '47%' as unknown as number,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  indicatorCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  indicatorStatusText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  indicatorSub: {
    fontSize: 9,
    marginTop: 2,
  },
  tradesCard: {
    backgroundColor: Colors.bg1,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tradesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradesToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradesToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradesCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
  },
  tradesTitle: {
    fontSize: 12,
    color: '#D4A017',
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  tradesHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 2,
    marginTop: 8,
  },
  tradesHeaderText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tradePrice: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tradeQty: {
    flex: 1,
    fontSize: 13,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  tradeTime: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right' as const,
  },
});
