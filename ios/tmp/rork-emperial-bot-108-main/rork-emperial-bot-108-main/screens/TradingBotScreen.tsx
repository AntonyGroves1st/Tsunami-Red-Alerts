import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Switch,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import {
  Bot,
  DollarSign,
  Zap,
  Shield,
  ChevronLeft,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  RefreshCw,
  Power,
  Brain,
  Timer,
  Eye,
  CircleDot,
  Gauge,
} from 'lucide-react-native';
import { Colors, getAssetColor } from '@/constants/colors';
import { Haptics } from '@/utils/haptics';
import {
  BotTrade,
  getMockTrades,
  calculatePerformance,
  updateTradeWithPrice,
  BotPerformance,
  SIGNAL_SOURCE_LABELS,
  SignalSource,
} from '@/services/tradingBotService';

type BotTab = 'dashboard' | 'trades' | 'engine';

function PulsingCore({ active, size = 56 }: { active: boolean; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
            Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      scale.setValue(1);
      glow.setValue(0.2);
    }
  }, [active, scale, glow]);

  const color = active ? Colors.cyan : Colors.text3;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color + '30',
          transform: [{ scale }],
          opacity: glow,
        }}
      />
      <View style={{
        width: size * 0.55,
        height: size * 0.55,
        borderRadius: size * 0.275,
        backgroundColor: color + '20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: color + '40',
      }}>
        <Brain size={size * 0.28} color={color} />
      </View>
    </View>
  );
}

function TradeRow({ trade, index }: { trade: BotTrade; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const isOpen = trade.status === 'open';
  const isWin = trade.pnl > 0;
  const borderColor = trade.status === 'stopped' ? Colors.red
    : isWin ? Colors.green
    : isOpen ? Colors.cyan
    : Colors.red;

  return (
    <Animated.View style={[styles.tradeRow, { opacity: fadeAnim, borderLeftColor: borderColor }]}>
      <View style={styles.tradeRowTop}>
        <View style={styles.tradeRowLeft}>
          <View style={[styles.tradeSymbol, { backgroundColor: getAssetColor(trade.instrument) + '15' }]}>
            <Text style={[styles.tradeSymbolText, { color: getAssetColor(trade.instrument) }]}>{trade.instrument}</Text>
          </View>
          <View style={[styles.dirBadge, { backgroundColor: (trade.direction === 'LONG' ? Colors.green : Colors.red) + '12' }]}>
            {trade.direction === 'LONG' ? <ArrowUpRight size={9} color={Colors.green} /> : <ArrowDownRight size={9} color={Colors.red} />}
            <Text style={[styles.dirBadgeText, { color: trade.direction === 'LONG' ? Colors.green : Colors.red }]}>{trade.direction}</Text>
          </View>
          {isOpen && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <View style={styles.tradeRowRight}>
          <Text style={[styles.tradePnl, { color: isWin ? Colors.green : Colors.red }]}>
            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
          </Text>
          <Text style={[styles.tradePnlPct, { color: (isWin ? Colors.green : Colors.red) + '80' }]}>
            {SIGNAL_SOURCE_LABELS[trade.source]}
          </Text>
        </View>
      </View>
      <View style={styles.tradeRowBottom}>
        <Text style={styles.tradeDetail}>
          Entry ${trade.entryPrice < 1 ? trade.entryPrice.toFixed(6) : trade.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.tradeSignalTag}>
          <Zap size={8} color={Colors.cyan} />
          <Text style={styles.tradeSignalText}>{SIGNAL_SOURCE_LABELS[trade.source]}</Text>
        </View>
        <Text style={styles.tradeTime}>
          {new Date(trade.openTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <View style={[styles.metricCard, { borderColor: color + '20' }]}>
      <View style={styles.metricCardHeader}>
        {icon}
        <Text style={styles.metricCardLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricCardValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function TradingBotScreen() {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();

  const [activeTab, setActiveTab] = useState<BotTab>('dashboard');
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [autoTradeOn, setAutoTradeOn] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [trades, setTrades] = useState<BotTrade[]>(() => getMockTrades());
  const [perf, setPerf] = useState<BotPerformance>(() => calculatePerformance(getMockTrades()));
  const [scanCount, setScanCount] = useState<number>(0);
  const [execSpeed, setExecSpeed] = useState<number>(142);

  const tradeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openTrades = useMemo(() => trades.filter(t => t.status === 'open'), [trades]);

  useEffect(() => {
    if (!botEnabled) {
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
      return;
    }

    const tick = () => {
      try {
        setScanCount(p => p + 1);
        setExecSpeed(80 + Math.floor(Math.random() * 250));

        setTrades(prev => {
          const updated = prev.map(t => {
            if (t.status !== 'open') return t;
            const noise = t.entryPrice * (Math.random() * 0.02 - 0.01);
            return updateTradeWithPrice(t, t.currentPrice + noise);
          });
          setPerf(calculatePerformance(updated));
          return updated;
        });
      } catch (e) {
        console.log('[TradingBot] Tick error:', e);
      }
    };

    tick();
    tradeTimerRef.current = setInterval(tick, 3000);

    return () => {
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
    };
  }, [botEnabled]);

  const toggleBot = useCallback(() => {
    setBotEnabled(p => !p);
    Haptics.notification(!botEnabled ? 'success' : 'warning');
  }, [botEnabled]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impact('light');
    setTrades(prev => {
      const updated = prev.map(t => {
        if (t.status !== 'open') return t;
        const noise = t.entryPrice * (Math.random() * 0.02 - 0.01);
        return updateTradeWithPrice(t, t.currentPrice + noise);
      });
      setPerf(calculatePerformance(updated));
      return updated;
    });
    await new Promise(r => setTimeout(r, 400));
    setRefreshing(false);
  }, []);

  const resetTrades = useCallback(() => {
    const fresh = getMockTrades();
    setTrades(fresh);
    setPerf(calculatePerformance(fresh));
    Haptics.notification('success');
  }, []);

  const statusColor = botEnabled ? Colors.cyan : Colors.text3;
  const statusLabel = botEnabled ? 'ACTIVE' : 'OFFLINE';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} testID="back-button">
          <ChevronLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AMEE<Text style={styles.headerAccent}>Engine</Text></Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.powerBtn, botEnabled && { borderColor: Colors.cyan + '40', backgroundColor: Colors.cyan + '08' }]}
          onPress={toggleBot}
          testID="power-button"
        >
          <Power size={18} color={botEnabled ? Colors.cyan : Colors.text2} />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {([
          { key: 'dashboard' as BotTab, label: 'Dashboard', icon: BarChart3 },
          { key: 'trades' as BotTab, label: 'Trades', icon: Activity },
          { key: 'engine' as BotTab, label: 'AI Engine', icon: Brain },
        ]).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => { setActiveTab(tab.key); Haptics.selection(); }}
          >
            <tab.icon size={12} color={activeTab === tab.key ? Colors.cyan : Colors.text2} />
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.cyan} />}
      >
        {activeTab === 'dashboard' && (
          <>
            <View style={styles.coreCard}>
              <View style={styles.coreRow}>
                <PulsingCore active={botEnabled} size={56} />
                <View style={styles.coreInfo}>
                  <Text style={styles.coreTitle}>AI Micro-Execution Engine</Text>
                  <Text style={styles.coreDesc}>
                    {botEnabled ? `Demo mode · Auto-trade ${autoTradeOn ? 'ON' : 'OFF'}` : 'Engine offline'}
                  </Text>
                  {botEnabled && (
                    <View style={styles.coreMeta}>
                      <View style={styles.coreMetaItem}>
                        <RefreshCw size={9} color={Colors.cyan} />
                        <Text style={[styles.coreMetaText, { color: Colors.cyan }]}>{scanCount} ticks</Text>
                      </View>
                      <View style={styles.coreMetaItem}>
                        <Timer size={9} color={Colors.amber} />
                        <Text style={[styles.coreMetaText, { color: Colors.amber }]}>{execSpeed}ms</Text>
                      </View>
                      <View style={styles.coreMetaItem}>
                        <Eye size={9} color={Colors.green} />
                        <Text style={[styles.coreMetaText, { color: Colors.green }]}>{openTrades.length} open</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.autoTradeRow}>
                <Text style={styles.autoTradeLabel}>Auto-Trade</Text>
                <Switch
                  value={autoTradeOn}
                  onValueChange={(v) => { setAutoTradeOn(v); Haptics.impact('medium'); }}
                  trackColor={{ false: Colors.bg3, true: Colors.cyan + '40' }}
                  thumbColor={autoTradeOn ? Colors.cyan : Colors.text2}
                />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard label="Total P&L" value={`$${perf.totalPnl >= 0 ? '+' : ''}${perf.totalPnl.toFixed(2)}`} color={perf.totalPnl >= 0 ? Colors.green : Colors.red} icon={<DollarSign size={13} color={perf.totalPnl >= 0 ? Colors.green : Colors.red} />} />
              <MetricCard label="Win Rate" value={`${perf.winRate.toFixed(1)}%`} color={Colors.amber} icon={<Target size={13} color={Colors.amber} />} />
              <MetricCard label="Profit Factor" value={perf.profitFactor === Infinity ? '∞' : perf.profitFactor.toFixed(2)} color={Colors.cyan} icon={<BarChart3 size={13} color={Colors.cyan} />} />
              <MetricCard label="Sharpe Ratio" value={perf.sharpeRatio.toFixed(2)} color={Colors.purple} icon={<Gauge size={13} color={Colors.purple} />} />
            </View>

            <View style={styles.pnlCard}>
              <View style={styles.pnlTop}>
                <Text style={styles.pnlLabel}>PERFORMANCE</Text>
                <Text style={[styles.pnlValue, { color: perf.winRate >= 50 ? Colors.green : Colors.red }]}>
                  {perf.winCount}W / {perf.lossCount}L
                </Text>
              </View>
              <View style={styles.pnlBar}>
                <View style={[styles.pnlBarFill, {
                  width: `${Math.min(100, Math.max(5, perf.winRate))}%` as any,
                  backgroundColor: perf.winRate >= 60 ? Colors.green : perf.winRate >= 40 ? Colors.amber : Colors.red,
                }]} />
              </View>
              <View style={styles.pnlBottom}>
                <Text style={styles.pnlBottomText}>{perf.winRate.toFixed(1)}% win rate</Text>
                <Text style={styles.pnlBottomText}>Max DD: ${perf.maxDrawdown.toFixed(2)}</Text>
              </View>
            </View>

            {openTrades.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CircleDot size={13} color={Colors.green} />
                  <Text style={styles.sectionTitle}>OPEN POSITIONS</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{openTrades.length}</Text>
                  </View>
                </View>
                {openTrades.map((trade, i) => (
                  <TradeRow key={trade.id} trade={trade} index={i} />
                ))}
              </View>
            )}

            <Pressable style={styles.resetBtn} onPress={resetTrades}>
              <RefreshCw size={13} color={Colors.text2} />
              <Text style={styles.resetBtnText}>Reset Trades</Text>
            </Pressable>
          </>
        )}

        {activeTab === 'trades' && (
          <>
            <View style={styles.tradeSummary}>
              <View style={[styles.tradeSummaryItem, { backgroundColor: Colors.green + '08', borderColor: Colors.green + '20' }]}>
                <Text style={[styles.tradeSummaryValue, { color: Colors.green }]}>{perf.winCount}</Text>
                <Text style={styles.tradeSummaryLabel}>Wins</Text>
              </View>
              <View style={[styles.tradeSummaryItem, { backgroundColor: Colors.red + '08', borderColor: Colors.red + '20' }]}>
                <Text style={[styles.tradeSummaryValue, { color: Colors.red }]}>{perf.lossCount}</Text>
                <Text style={styles.tradeSummaryLabel}>Losses</Text>
              </View>
              <View style={[styles.tradeSummaryItem, { backgroundColor: Colors.cyan + '08', borderColor: Colors.cyan + '20' }]}>
                <Text style={[styles.tradeSummaryValue, { color: Colors.cyan }]}>{openTrades.length}</Text>
                <Text style={styles.tradeSummaryLabel}>Open</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Activity size={13} color={Colors.amber} />
                <Text style={styles.sectionTitle}>TRADE HISTORY</Text>
              </View>
              {trades.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bot size={36} color={Colors.text3} />
                  <Text style={styles.emptyTitle}>Scanning Markets...</Text>
                  <Text style={styles.emptySubtitle}>AI engine is analyzing conditions. Trades will appear when signals are detected.</Text>
                </View>
              ) : (
                trades.slice(0, 30).map((trade, i) => (
                  <TradeRow key={trade.id} trade={trade} index={i} />
                ))
              )}
            </View>
          </>
        )}

        {activeTab === 'engine' && (
          <>
            <View style={styles.engineCard}>
              <View style={styles.engineCardHeader}>
                <Brain size={14} color={Colors.cyan} />
                <Text style={styles.engineCardTitle}>SIGNAL SOURCES</Text>
              </View>
              {([
                { source: 'ema_cross' as SignalSource, color: Colors.cyan },
                { source: 'golden_cross' as SignalSource, color: Colors.green },
                { source: 'atr_signal' as SignalSource, color: Colors.amber },
                { source: 'rmp_signal' as SignalSource, color: Colors.purple },
                { source: 'pressure_flip' as SignalSource, color: Colors.orange },
                { source: 'composite' as SignalSource, color: Colors.cyan },
              ]).map((item) => (
                <View key={item.source} style={styles.sourceRow}>
                  <View style={[styles.sourceDot, { backgroundColor: item.color }]} />
                  <Text style={styles.sourceLabel}>{SIGNAL_SOURCE_LABELS[item.source]}</Text>
                  <View style={[styles.sourceStatus, { backgroundColor: Colors.green + '15' }]}>
                    <Text style={[styles.sourceStatusText, { color: Colors.green }]}>ACTIVE</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.engineCard}>
              <View style={styles.engineCardHeader}>
                <Shield size={14} color={Colors.green} />
                <Text style={styles.engineCardTitle}>RISK MANAGEMENT</Text>
              </View>
              {[
                { label: 'Stop Loss', value: '2.0%', color: Colors.red },
                { label: 'Take Profit', value: '4.0%', color: Colors.green },
                { label: 'Max Position', value: '$5,000', color: Colors.cyan },
                { label: 'Max Concurrent', value: '3 trades', color: Colors.amber },
                { label: 'Min Confidence', value: '60%', color: Colors.purple },
              ].map((item, i) => (
                <View key={i} style={styles.riskRow}>
                  <Text style={styles.riskLabel}>{item.label}</Text>
                  <Text style={[styles.riskValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.engineCard}>
              <View style={styles.engineCardHeader}>
                <Gauge size={14} color={Colors.amber} />
                <Text style={styles.engineCardTitle}>ENGINE STATS</Text>
              </View>
              {[
                { label: 'Total Scans', value: `${scanCount}`, color: Colors.text },
                { label: 'Avg Speed', value: `${execSpeed}ms`, color: Colors.cyan },
                { label: 'Total Trades', value: `${perf.totalTrades}`, color: Colors.amber },
                { label: 'Best Trade', value: `$${perf.bestTrade.toFixed(2)}`, color: Colors.green },
                { label: 'Worst Trade', value: `$${perf.worstTrade.toFixed(2)}`, color: Colors.red },
              ].map((item, i) => (
                <View key={i} style={styles.riskRow}>
                  <Text style={styles.riskLabel}>{item.label}</Text>
                  <Text style={[styles.riskValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  header: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg1, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: Colors.border },
  headerCenter: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800' as const, color: Colors.white, letterSpacing: -0.3 },
  headerAccent: { color: Colors.cyan },
  statusPill: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 0.5 },
  powerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg1, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: Colors.border },

  tabBar: { flexDirection: 'row' as const, paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  tabBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 5, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.bg1, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.cyan + '10', borderColor: Colors.cyan + '30' },
  tabBtnText: { fontSize: 11, fontWeight: '600' as const, color: Colors.text2 },
  tabBtnTextActive: { color: Colors.cyan },

  coreCard: { backgroundColor: Colors.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  coreRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  coreInfo: { flex: 1 },
  coreTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.white, marginBottom: 2 },
  coreDesc: { fontSize: 11, color: Colors.text2, lineHeight: 16 },
  coreMeta: { flexDirection: 'row' as const, gap: 10, marginTop: 6 },
  coreMetaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3 },
  coreMetaText: { fontSize: 10, fontWeight: '600' as const },
  autoTradeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  autoTradeLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.text2 },

  metricsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 12 },
  metricCard: { width: '48%' as any, flexGrow: 1, flexBasis: '46%' as any, backgroundColor: Colors.bg1, borderRadius: 10, padding: 12, borderWidth: 1 },
  metricCardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, marginBottom: 6 },
  metricCardLabel: { fontSize: 10, fontWeight: '600' as const, color: Colors.text2 },
  metricCardValue: { fontSize: 18, fontWeight: '800' as const },

  pnlCard: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  pnlTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  pnlLabel: { fontSize: 10, color: Colors.text2, fontWeight: '700' as const, letterSpacing: 1 },
  pnlValue: { fontSize: 14, fontWeight: '700' as const },
  pnlBar: { height: 6, backgroundColor: Colors.bg3, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 6 },
  pnlBarFill: { height: 6, borderRadius: 3 },
  pnlBottom: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  pnlBottomText: { fontSize: 10, color: Colors.text2, fontWeight: '600' as const },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 10, color: Colors.text2, fontWeight: '700' as const, letterSpacing: 1 },
  countBadge: { backgroundColor: Colors.cyan + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  countBadgeText: { fontSize: 9, color: Colors.cyan, fontWeight: '700' as const },

  tradeRow: { backgroundColor: Colors.bg1, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  tradeRowTop: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  tradeRowLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  tradeSymbol: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tradeSymbolText: { fontSize: 11, fontWeight: '800' as const },
  dirBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  dirBadgeText: { fontSize: 9, fontWeight: '700' as const },
  liveBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.green + '12' },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.green },
  liveText: { fontSize: 7, color: Colors.green, fontWeight: '800' as const, letterSpacing: 0.5 },
  tradeRowRight: { alignItems: 'flex-end' as const },
  tradePnl: { fontSize: 14, fontWeight: '800' as const },
  tradePnlPct: { fontSize: 9, fontWeight: '600' as const, marginTop: 1 },
  tradeRowBottom: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  tradeDetail: { fontSize: 10, color: Colors.text2 },
  tradeSignalTag: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.cyan + '10' },
  tradeSignalText: { fontSize: 8, color: Colors.cyan, fontWeight: '600' as const },
  tradeTime: { fontSize: 9, color: Colors.text3 },

  tradeSummary: { flexDirection: 'row' as const, gap: 8, marginBottom: 12 },
  tradeSummaryItem: { flex: 1, alignItems: 'center' as const, paddingVertical: 14, borderRadius: 10, borderWidth: 1 },
  tradeSummaryValue: { fontSize: 22, fontWeight: '800' as const },
  tradeSummaryLabel: { fontSize: 9, color: Colors.text2, fontWeight: '600' as const, letterSpacing: 0.5, marginTop: 2 },

  emptyState: { alignItems: 'center' as const, paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 12, color: Colors.text2, textAlign: 'center' as const, lineHeight: 18, paddingHorizontal: 20 },

  resetBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, backgroundColor: Colors.bg1, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  resetBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.text2 },

  engineCard: { backgroundColor: Colors.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  engineCardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 12 },
  engineCardTitle: { fontSize: 10, fontWeight: '700' as const, color: Colors.text2, letterSpacing: 1 },

  sourceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sourceDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  sourceLabel: { flex: 1, fontSize: 12, fontWeight: '600' as const, color: Colors.text },
  sourceStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sourceStatusText: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 0.5 },

  riskRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  riskLabel: { fontSize: 12, color: Colors.text2, fontWeight: '600' as const },
  riskValue: { fontSize: 14, fontWeight: '700' as const },
});
