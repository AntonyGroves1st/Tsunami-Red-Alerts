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
  BarChart3,
  Brain,
  Settings,
  History,
  Power,
  ChevronLeft,
  Radio,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Layers,
  Activity,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAlerts } from '@/hooks/useAlerts';
import { useMarketData } from '@/hooks/useMarketData';
import { Haptics } from '@/utils/haptics';
import { connectWebSocket } from '@/services/binanceApi';
import {
  BotTrade,
  getMockTrades,
  calculatePerformance,
  updateTradeWithPrice,
  BotPerformance,
} from '@/services/tradingBotService';

type BotTab = 'dashboard' | 'ai' | 'config' | 'history';

interface RegimeData {
  shiftScore: number;
  volCompress: number;
  liqBuild: number;
  shiftProb: number;
  currentRegime: 'CHOP' | 'TRENDING' | 'RANGING' | 'BREAKOUT';
  targetRegime: 'CHOP' | 'TRENDING' | 'RANGING' | 'BREAKOUT';
  transitionProgress: number;
}

interface ConfidenceDecay {
  baseScore: number;
  freshness: number;
  regimeAlign: number;
  volQuality: number;
  finalConfidence: number;
  ageTicks: number;
}

interface LiquidityTrap {
  detected: boolean;
  trapScore: number;
  type: string;
  wickRatio: number;
  deltaDivergence: number;
  reasons: string[];
}

interface IndicatorPriority {
  name: string;
  weight: number;
  change: number;
  active: boolean;
  color: string;
}

interface MarketRegime {
  type: 'TRENDING' | 'RANGING' | 'BREAKOUT' | 'CHOP';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  description: string;
  adx: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
  volatility: number;
  confidence: number;
}

interface MicroIndicator {
  name: string;
  active: boolean;
}

interface KillSwitch {
  label: string;
  armed: boolean;
}

function generateRegimeData(): RegimeData {
  const regimes: RegimeData['currentRegime'][] = ['CHOP', 'TRENDING', 'RANGING', 'BREAKOUT'];
  return {
    shiftScore: Math.floor(Math.random() * 5),
    volCompress: +(Math.random() * 0.8 + 0.1).toFixed(2),
    liqBuild: +(Math.random() * 1.5 + 0.5).toFixed(2),
    shiftProb: Math.floor(Math.random() * 40 + 10),
    currentRegime: regimes[Math.floor(Math.random() * regimes.length)],
    targetRegime: regimes[Math.floor(Math.random() * regimes.length)],
    transitionProgress: Math.random() * 0.8 + 0.1,
  };
}

function generateConfidenceDecay(): ConfidenceDecay {
  const base = Math.floor(Math.random() * 25 + 70);
  const fresh = +(Math.random() * 0.5 + 0.4).toFixed(2);
  const regime = +(Math.random() * 0.5 + 0.5).toFixed(2);
  const vol = +(Math.random() * 0.3 + 0.7).toFixed(2);
  return {
    baseScore: base,
    freshness: fresh,
    regimeAlign: regime,
    volQuality: vol,
    finalConfidence: Math.round(base * fresh * regime * vol),
    ageTicks: Math.floor(Math.random() * 15 + 1),
  };
}

function generateLiquidityTrap(): LiquidityTrap {
  const detected = Math.random() > 0.3;
  const types = ['DELTA DIVERGENCE', 'VOLUME SPIKE', 'ORDER IMBALANCE', 'STOP HUNT'];
  const wick = Math.floor(Math.random() * 40 + 60);
  const delta = Math.floor(Math.random() * 50 + 20);
  return {
    detected,
    trapScore: Math.floor(Math.random() * 60 + 30),
    type: types[Math.floor(Math.random() * types.length)],
    wickRatio: wick,
    deltaDivergence: delta,
    reasons: [
      `Large wick ratio: ${wick}% (stop hunt signal)`,
      `Delta divergence: ${delta}% (price vs momentum conflict)`,
    ],
  };
}

function generateIndicatorPriorities(): IndicatorPriority[] {
  return [
    { name: 'STRUCTURE', weight: 29, change: -6, active: true, color: Colors.cyan },
    { name: 'MOMENTUM', weight: 26, change: -4, active: true, color: Colors.green },
    { name: 'LIQUIDITY', weight: 26, change: 6, active: true, color: '#0d9488' },
    { name: 'VOLATILITY', weight: 19, change: 4, active: true, color: Colors.amber },
  ];
}

function generateMarketRegime(): MarketRegime {
  const types: MarketRegime['type'][] = ['TRENDING', 'RANGING', 'BREAKOUT', 'CHOP'];
  const strengths: MarketRegime['strength'][] = ['WEAK', 'MODERATE', 'STRONG'];
  const dirs: MarketRegime['direction'][] = ['UP', 'DOWN', 'FLAT'];
  const t = types[Math.floor(Math.random() * types.length)];
  return {
    type: t,
    strength: strengths[Math.floor(Math.random() * strengths.length)],
    description: t === 'TRENDING' ? 'Bearish trend' : t === 'RANGING' ? 'Sideways range' : t === 'BREAKOUT' ? 'Catch spike' : 'NO TRADE',
    adx: +(Math.random() * 30 + 15).toFixed(1),
    direction: dirs[Math.floor(Math.random() * dirs.length)],
    volatility: Math.floor(Math.random() * 40 + 60),
    confidence: Math.floor(Math.random() * 40 + 50),
  };
}

const MICRO_INDICATORS: MicroIndicator[] = [
  { name: 'VWAP (Micro)', active: true },
  { name: 'EMA 9 / EMA 21', active: true },
  { name: 'Price Velocity', active: true },
  { name: 'Bid/Ask Imbalance', active: true },
  { name: 'Aggressive Buy Ratio', active: true },
  { name: 'Liquidity Pull Detection', active: true },
  { name: 'ATR(14) on 5s', active: true },
  { name: 'Spread Volatility', active: true },
];

const KILL_SWITCHES: KillSwitch[] = [
  { label: '3 consecutive losses → pause pair', armed: true },
  { label: '5 daily losses → system halt', armed: true },
  { label: 'Latency > 500ms → skip trade', armed: true },
  { label: 'Spread reversal detection → abort', armed: true },
];

function ConfidenceRing({ value, size = 72 }: { value: number; size?: number }) {
  const color = value >= 75 ? Colors.green : value >= 65 ? Colors.amber : Colors.red;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color + '25',
        opacity: pulseAnim,
      }} />
      <View style={{
        width: size * 0.78,
        height: size * 0.78,
        borderRadius: (size * 0.78) / 2,
        borderWidth: 2,
        borderColor: color + '50',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color + '08',
      }}>
        <Text style={{ fontSize: size * 0.28, fontWeight: '900' as const, color }}>{value}</Text>
        <Text style={{ fontSize: size * 0.11, fontWeight: '700' as const, color: color + 'AA', marginTop: -2 }}>%</Text>
      </View>
    </View>
  );
}

function ConfidenceHistoryBars() {
  const bars = useMemo(() => {
    return Array.from({ length: 16 }, () => {
      const v = Math.random();
      return {
        height: Math.max(15, v * 60),
        color: v >= 0.7 ? Colors.green : v >= 0.45 ? Colors.amber : Colors.red,
      };
    });
  }, []);

  return (
    <View style={confHistStyles.container}>
      <View style={confHistStyles.barsRow}>
        {bars.map((bar, i) => (
          <View key={i} style={[confHistStyles.bar, { height: bar.height, backgroundColor: bar.color }]} />
        ))}
      </View>
      <View style={confHistStyles.labels}>
        <Text style={confHistStyles.labelText}>Older</Text>
        <Text style={confHistStyles.labelText}>Latest</Text>
      </View>
    </View>
  );
}

const confHistStyles = StyleSheet.create({
  container: { marginTop: 4 },
  barsRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    height: 65,
    gap: 3,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 8,
  },
  labels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 9,
    color: Colors.text3,
  },
});

function MetricBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={metricBoxStyles.box}>
      <Text style={metricBoxStyles.label}>{label}</Text>
      <Text style={[metricBoxStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const metricBoxStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
  },
  label: {
    fontSize: 9,
    color: Colors.text3,
    fontWeight: '600' as const,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  value: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
});

export default function BotDashboard() {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();

  const {
    engineRunning,
    activeRuleCount,
    stats,
  } = useAlerts();

  useMarketData();

  const [activeTab, setActiveTab] = useState<BotTab>('dashboard');
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [_livePrice, setLivePrice] = useState<number>(0);

  const [regimeData, setRegimeData] = useState<RegimeData>(() => generateRegimeData());
  const [confidenceDecay, setConfidenceDecay] = useState<ConfidenceDecay>(() => generateConfidenceDecay());
  const [liquidityTrap, setLiquidityTrap] = useState<LiquidityTrap>(() => generateLiquidityTrap());
  const [indicatorPriorities] = useState<IndicatorPriority[]>(() => generateIndicatorPriorities());
  const [marketRegime, setMarketRegime] = useState<MarketRegime>(() => generateMarketRegime());
  const [signalQuality, setSignalQuality] = useState<number>(76);

  const initialPriceRef = useRef<number>(0);

  const [trades, setTrades] = useState<BotTrade[]>(() => getMockTrades());
  const [perf, setPerf] = useState<BotPerformance>(() => calculatePerformance(getMockTrades()));
  const tradeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tradingConfig, setTradingConfig] = useState({
    riskLevel: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    maxPositionSize: 5000,
    maxConcurrent: 3,
    stopLossPercent: 2.0,
    takeProfitPercent: 4.0,
    trailingStop: false,
    autoClose: true,
    minConfidence: 65,
    cooldownSeconds: 30,
  });

  useEffect(() => {
    console.log('[BotScreen] Connecting Binance WebSocket for BTCUSDT...');
    const cleanup = connectWebSocket(
      'BTC',
      (data) => {
        setLivePrice(data.price);
        if (initialPriceRef.current === 0) initialPriceRef.current = data.price;
      },
      (err) => {
        console.log('[BotScreen] WS error:', err);
        setWsConnected(false);
      },
      () => {
        console.log('[BotScreen] WS connected');
        setWsConnected(true);
      },
    );
    return cleanup;
  }, []);

  useEffect(() => {
    if (!botEnabled) {
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
      return;
    }
    const tick = () => {
      setTrades(prev => {
        const updated = prev.map(t => {
          if (t.status !== 'open') return t;
          const noise = t.entryPrice * (Math.random() * 0.02 - 0.01);
          return updateTradeWithPrice(t, t.currentPrice + noise);
        });
        setPerf(calculatePerformance(updated));
        return updated;
      });
      setRegimeData(generateRegimeData());
      setConfidenceDecay(generateConfidenceDecay());
      setLiquidityTrap(generateLiquidityTrap());
      setMarketRegime(generateMarketRegime());
      setSignalQuality(Math.floor(Math.random() * 30 + 60));
    };
    tick();
    tradeTimerRef.current = setInterval(tick, 5000);
    return () => { if (tradeTimerRef.current) clearInterval(tradeTimerRef.current); };
  }, [botEnabled]);

  const toggleBot = useCallback(() => {
    setBotEnabled(p => !p);
    Haptics.notification(!botEnabled ? 'success' : 'warning');
  }, [botEnabled]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impact('light');
    setRegimeData(generateRegimeData());
    setConfidenceDecay(generateConfidenceDecay());
    setLiquidityTrap(generateLiquidityTrap());
    setMarketRegime(generateMarketRegime());
    setSignalQuality(Math.floor(Math.random() * 30 + 60));
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const statusColor = botEnabled ? Colors.green : Colors.text3;
  const statusLabel = botEnabled ? 'SCANNING' : 'OFFLINE';
  const finalConfColor = confidenceDecay.finalConfidence >= 65 ? Colors.green : confidenceDecay.finalConfidence >= 45 ? Colors.amber : Colors.red;

  const openTrades = useMemo(() => trades.filter(t => t.status === 'open'), [trades]);

  const formatTime = useCallback((ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const regimeColorMap: Record<string, string> = {
    TRENDING: Colors.amber,
    RANGING: Colors.cyan,
    BREAKOUT: Colors.green,
    CHOP: Colors.text3,
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={goBack} testID="bot-back">
          <ChevronLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>AMEE<Text style={s.headerAccent}>Engine</Text></Text>
          <View style={[s.statusIndicator, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Pressable
          style={[s.powerBtn, botEnabled && { borderColor: Colors.green + '40', backgroundColor: Colors.green + '08' }]}
          onPress={toggleBot}
          testID="bot-power"
        >
          <Power size={18} color={botEnabled ? Colors.green : Colors.text2} />
        </Pressable>
      </View>

      <View style={s.tabBar}>
        {([
          { key: 'dashboard' as BotTab, label: 'Dashboard', icon: BarChart3 },
          { key: 'ai' as BotTab, label: 'AI Brain', icon: Brain },
          { key: 'config' as BotTab, label: 'Config', icon: Settings },
          { key: 'history' as BotTab, label: 'History', icon: History },
        ]).map((tab) => (
          <Pressable
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            onPress={() => { setActiveTab(tab.key); Haptics.selection(); }}
          >
            <tab.icon size={11} color={activeTab === tab.key ? Colors.amber : Colors.text2} />
            <Text style={[s.tabBtnText, activeTab === tab.key && s.tabBtnTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.amber} />}
      >
        {activeTab === 'dashboard' && (
          <>
            <View style={s.panel}>
              <View style={s.panelHeader}>
                <View style={s.panelHeaderLeft}>
                  <Radio size={14} color={Colors.cyan} />
                  <Text style={s.panelTitle}>REGIME TRANSITION PREDICTOR</Text>
                </View>
                <View style={[s.badge, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '30' }]}>
                  <Text style={[s.badgeText, { color: Colors.purple }]}>TRANSITION</Text>
                </View>
              </View>
              <View style={s.metricsRow}>
                <MetricBox label="Shift Score" value={`${regimeData.shiftScore}`} />
                <MetricBox label="Vol Compress" value={`${regimeData.volCompress}`} />
                <MetricBox label="Liq Build" value={`${regimeData.liqBuild}x`} valueColor={Colors.cyan} />
                <MetricBox label="Shift Prob" value={`${regimeData.shiftProb}%`} valueColor={Colors.green} />
              </View>
              <View style={s.regimeTransitionRow}>
                <Text style={[s.regimeLabel, { color: regimeColorMap[regimeData.currentRegime] ?? Colors.text3 }]}>
                  {regimeData.currentRegime}
                </Text>
                <Text style={s.regimeArrow}>→</Text>
                <Text style={[s.regimeLabel, { color: regimeColorMap[regimeData.targetRegime] ?? Colors.amber, fontWeight: '800' as const }]}>
                  {regimeData.targetRegime}
                </Text>
                <View style={s.regimeBarContainer}>
                  <View style={[s.regimeBarFill, { width: `${Math.round(regimeData.transitionProgress * 100)}%` as any, backgroundColor: regimeColorMap[regimeData.targetRegime] ?? Colors.amber }]} />
                </View>
              </View>
            </View>

            <View style={s.panel}>
              <View style={s.panelHeader}>
                <View style={s.panelHeaderLeft}>
                  <Activity size={14} color={Colors.cyan} />
                  <Text style={s.panelTitle}>CONFIDENCE DECAY ENGINE v2</Text>
                </View>
              </View>
              <View style={s.metricsRow}>
                <MetricBox label="Base Score" value={`${confidenceDecay.baseScore}%`} />
                <MetricBox label="Freshness" value={`×${confidenceDecay.freshness}`} valueColor={Colors.cyan} />
                <MetricBox label="Regime Align" value={`×${confidenceDecay.regimeAlign}`} valueColor={Colors.amber} />
                <MetricBox label="Vol Quality" value={`×${confidenceDecay.volQuality}`} valueColor={Colors.green} />
              </View>
              <View style={s.finalConfRow}>
                <Text style={s.finalConfLabel}>Final Confidence</Text>
                <Text style={[s.finalConfValue, { color: finalConfColor }]}>{confidenceDecay.finalConfidence}%</Text>
                <Text style={s.ageText}>Age: {confidenceDecay.ageTicks} ticks</Text>
              </View>
            </View>

            {liquidityTrap.detected && (
              <View style={[s.panel, { borderColor: Colors.red + '25' }]}>
                <View style={s.panelHeader}>
                  <View style={s.panelHeaderLeft}>
                    <ShieldAlert size={14} color={Colors.red} />
                    <Text style={[s.panelTitle, { color: Colors.red }]}>LIQUIDITY TRAP DETECTED</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '30' }]}>
                    <Text style={[s.badgeText, { color: Colors.amber }]}>CAUTION</Text>
                  </View>
                </View>
                <View style={s.metricsRow}>
                  <MetricBox label="Trap Score" value={`${liquidityTrap.trapScore}`} valueColor={Colors.red} />
                  <MetricBox label="Type" value={liquidityTrap.type.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('\n')} valueColor={Colors.purple} />
                  <MetricBox label="Wick Ratio" value={`${liquidityTrap.wickRatio}%`} />
                  <MetricBox label="Delta Div" value={`${liquidityTrap.deltaDivergence}%`} valueColor={Colors.amber} />
                </View>
                <View style={s.trapReasons}>
                  {liquidityTrap.reasons.map((r, i) => (
                    <View key={i} style={s.trapReasonRow}>
                      <Text style={s.trapBullet}>•</Text>
                      <Text style={s.trapReasonText}>{r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={s.panel}>
              <View style={s.panelHeader}>
                <View style={s.panelHeaderLeft}>
                  <Layers size={14} color={Colors.cyan} />
                  <Text style={s.panelTitle}>INDICATOR PRIORITIZATION</Text>
                </View>
                <View style={[s.badge, { backgroundColor: Colors.cyan + '12', borderColor: Colors.cyan + '25' }]}>
                  <Text style={[s.badgeText, { color: Colors.cyan }]}>DYNAMIC</Text>
                </View>
              </View>
              {indicatorPriorities.map((ind, i) => (
                <View key={i} style={s.indicatorRow}>
                  <View style={[s.indicatorNameBadge, { backgroundColor: ind.color + '15' }]}>
                    <Text style={[s.indicatorNameText, { color: ind.color }]}>{ind.name}</Text>
                  </View>
                  <View style={s.indicatorBarContainer}>
                    <View style={[s.indicatorBarFill, { width: `${ind.weight * 2.5}%` as any, backgroundColor: ind.color }]} />
                  </View>
                  <Text style={s.indicatorWeight}>{ind.weight}%</Text>
                  <Text style={[s.indicatorChange, { color: ind.change >= 0 ? Colors.green : Colors.red }]}>
                    {ind.change >= 0 ? '+' : ''}{ind.change}
                  </Text>
                  <Text style={[s.indicatorStatus, { color: ind.active ? Colors.green : Colors.red }]}>
                    {ind.active ? 'ON' : 'OFF'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={s.bottomStats}>
              <View style={s.bottomStatItem}>
                <BarChart3 size={14} color={Colors.amber} />
                <Text style={s.bottomStatValue}>{perf.totalTrades}</Text>
                <Text style={s.bottomStatLabel}>Total Trades</Text>
              </View>
              <View style={s.bottomStatDivider} />
              <View style={s.bottomStatItem}>
                <Target size={14} color={Colors.green} />
                <Text style={[s.bottomStatValue, { color: Colors.green }]}>{perf.winRate.toFixed(1)}%</Text>
                <Text style={s.bottomStatLabel}>Win Rate</Text>
              </View>
              <View style={s.bottomStatDivider} />
              <View style={s.bottomStatItem}>
                <Clock size={14} color={Colors.cyan} />
                <Text style={[s.bottomStatValue, { color: Colors.cyan }]}>0.0s</Text>
                <Text style={s.bottomStatLabel}>Avg Holding</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>AI CONFIDENCE ENGINE</Text>
              <View style={s.aiConfPanel}>
                <ConfidenceRing value={signalQuality} size={72} />
                <View style={s.aiConfInfo}>
                  <Text style={s.aiConfTitle}>Signal Quality Score</Text>
                  <Text style={s.aiConfDesc}>
                    The AI scores each signal based on trend direction, strength, volatility, RSI divergence, volume confirmation, time of day, and recent outcomes.
                  </Text>
                  <View style={s.confThresholds}>
                    <View style={s.confRow}><View style={[s.confDot, { backgroundColor: Colors.red }]} /><Text style={s.confRowText}>{'<'}65% → Discard</Text></View>
                    <View style={s.confRow}><View style={[s.confDot, { backgroundColor: Colors.amber }]} /><Text style={s.confRowText}>65-75% → Signal Only</Text></View>
                    <View style={s.confRow}><View style={[s.confDot, { backgroundColor: Colors.green }]} /><Text style={s.confRowText}>{'>'}75% → Auto-Trade</Text></View>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>MARKET REGIME CLASSIFICATION</Text>
              <View style={s.regimeClassCard}>
                <View style={s.regimeClassHeader}>
                  <TrendingUp size={14} color={regimeColorMap[marketRegime.type] ?? Colors.amber} />
                  <Text style={[s.regimeClassType, { color: regimeColorMap[marketRegime.type] ?? Colors.amber }]}>{marketRegime.type}</Text>
                  <View style={[s.regimeStrengthBadge, { backgroundColor: (regimeColorMap[marketRegime.type] ?? Colors.amber) + '15' }]}>
                    <Text style={[s.regimeStrengthText, { color: regimeColorMap[marketRegime.type] ?? Colors.amber }]}>{marketRegime.strength}</Text>
                  </View>
                </View>
                <Text style={s.regimeClassDesc}>{marketRegime.description} (ADX: {marketRegime.adx})</Text>
              </View>

              <View style={s.regimeMetricsRow}>
                <View style={s.regimeMetricItem}>
                  <Text style={s.regimeMetricLabel}>Direction</Text>
                  <Text style={[s.regimeMetricValue, { color: marketRegime.direction === 'UP' ? Colors.green : marketRegime.direction === 'DOWN' ? Colors.red : Colors.text2 }]}>
                    {marketRegime.direction}
                  </Text>
                </View>
                <View style={s.regimeMetricItem}>
                  <Text style={s.regimeMetricLabel}>Volatility</Text>
                  <Text style={[s.regimeMetricValue, { color: Colors.amber }]}>{marketRegime.volatility}%</Text>
                </View>
                <View style={s.regimeMetricItem}>
                  <Text style={s.regimeMetricLabel}>Confidence</Text>
                  <Text style={[s.regimeMetricValue, { color: Colors.green }]}>{marketRegime.confidence}%</Text>
                </View>
              </View>

              <View style={s.regimeCardsGrid}>
                {(['TRENDING', 'RANGING', 'BREAKOUT', 'CHOP'] as const).map((r) => {
                  const isActive = marketRegime.type === r;
                  const rColor = regimeColorMap[r] ?? Colors.text3;
                  const rDesc = r === 'TRENDING' ? 'Follow trend' : r === 'RANGING' ? 'Fade extremes' : r === 'BREAKOUT' ? 'Catch spike' : 'NO TRADE';
                  return (
                    <View key={r} style={[s.regimeCard, isActive && { backgroundColor: rColor + '12', borderColor: rColor + '30' }]}>
                      <View style={[s.regimeCardDot, { backgroundColor: isActive ? rColor : Colors.text3 }]} />
                      <Text style={[s.regimeCardName, isActive && { color: rColor }]}>{r}</Text>
                      <Text style={s.regimeCardDesc}>{rDesc}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>1s MICRO-INDICATORS</Text>
              {MICRO_INDICATORS.map((ind, i) => (
                <View key={i} style={s.microRow}>
                  <View style={[s.microDot, { backgroundColor: ind.active ? Colors.green : Colors.red }]} />
                  <Text style={s.microName}>{ind.name}</Text>
                  <Text style={[s.microStatus, { color: ind.active ? Colors.green : Colors.red }]}>
                    {ind.active ? 'ACTIVE' : 'OFF'}
                  </Text>
                </View>
              ))}
              <View style={s.microWarning}>
                <AlertTriangle size={12} color={Colors.amber} />
                <Text style={s.microWarningText}>
                  RSI, MACD, BB are too laggy at 1s — only used for regime classification, not signals.
                </Text>
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>CONFIDENCE HISTORY</Text>
              <ConfidenceHistoryBars />
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>KILL SWITCHES</Text>
              {KILL_SWITCHES.map((ks, i) => (
                <View key={i} style={s.killRow}>
                  <View style={[s.killDot, { backgroundColor: ks.armed ? Colors.green : Colors.red }]} />
                  <Text style={s.killLabel}>{ks.label}</Text>
                  <Text style={[s.killStatus, { color: ks.armed ? Colors.red : Colors.text3 }]}>
                    {ks.armed ? 'ARMED' : 'OFF'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'config' && (
          <>
            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>RISK PROFILE</Text>
              <View style={s.riskRow}>
                {(['conservative', 'moderate', 'aggressive'] as const).map((level) => {
                  const isActive = tradingConfig.riskLevel === level;
                  const lc = level === 'conservative' ? Colors.green : level === 'moderate' ? Colors.amber : Colors.red;
                  return (
                    <Pressable
                      key={level}
                      style={[s.riskBtn, isActive && { backgroundColor: lc + '15', borderColor: lc + '40' }]}
                      onPress={() => {
                        Haptics.selection();
                        setTradingConfig(prev => ({ ...prev, riskLevel: level }));
                      }}
                    >
                      <Shield size={13} color={isActive ? lc : Colors.text3} />
                      <Text style={[s.riskBtnText, isActive && { color: lc }]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>PARAMETERS</Text>
              <View style={s.configCard}>
                {[
                  { label: 'Max Position Size', value: `$${tradingConfig.maxPositionSize.toLocaleString()}`, color: Colors.cyan },
                  { label: 'Max Concurrent', value: `${tradingConfig.maxConcurrent}`, color: Colors.purple },
                  { label: 'Stop Loss', value: `${tradingConfig.stopLossPercent}%`, color: Colors.red },
                  { label: 'Take Profit', value: `${tradingConfig.takeProfitPercent}%`, color: Colors.green },
                  { label: 'Min Confidence', value: `${tradingConfig.minConfidence}%`, color: Colors.amber },
                  { label: 'Cooldown', value: `${tradingConfig.cooldownSeconds}s`, color: Colors.cyan },
                ].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    {idx > 0 && <View style={s.configDivider} />}
                    <View style={s.configRow}>
                      <Text style={s.configLabel}>{item.label}</Text>
                      <Text style={[s.configValue, { color: item.color }]}>{item.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>FEATURES</Text>
              <View style={s.configCard}>
                <View style={s.configRow}>
                  <Text style={s.configLabel}>Trailing Stop</Text>
                  <Switch
                    value={tradingConfig.trailingStop}
                    onValueChange={(v) => setTradingConfig(prev => ({ ...prev, trailingStop: v }))}
                    trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                    thumbColor={tradingConfig.trailingStop ? Colors.green : Colors.text2}
                  />
                </View>
                <View style={s.configDivider} />
                <View style={s.configRow}>
                  <Text style={s.configLabel}>Auto-Close EOD</Text>
                  <Switch
                    value={tradingConfig.autoClose}
                    onValueChange={(v) => setTradingConfig(prev => ({ ...prev, autoClose: v }))}
                    trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                    thumbColor={tradingConfig.autoClose ? Colors.green : Colors.text2}
                  />
                </View>
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>BOT HEALTH</Text>
              <View style={s.configCard}>
                {[
                  { label: 'Alert Engine', value: engineRunning ? 'Running' : 'Stopped', color: engineRunning ? Colors.green : Colors.red },
                  { label: 'Active Rules', value: `${activeRuleCount}`, color: activeRuleCount > 0 ? Colors.green : Colors.amber },
                  { label: 'WebSocket', value: wsConnected ? 'Connected' : 'Offline', color: wsConnected ? Colors.green : Colors.red },
                  { label: 'Webhooks Sent', value: `${stats.webhooksSent}`, color: Colors.cyan },
                ].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    {idx > 0 && <View style={s.configDivider} />}
                    <View style={s.configRow}>
                      <View style={s.configRowLeft}>
                        <View style={[s.configDotSmall, { backgroundColor: item.color }]} />
                        <Text style={s.configLabel}>{item.label}</Text>
                      </View>
                      <Text style={[s.configValue, { color: item.color }]}>{item.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <View style={s.historySummary}>
              <View style={[s.historyStat, { borderColor: Colors.green + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.green }]}>{perf.winCount}</Text>
                <Text style={s.historyStatLabel}>Wins</Text>
              </View>
              <View style={[s.historyStat, { borderColor: Colors.red + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.red }]}>{perf.lossCount}</Text>
                <Text style={s.historyStatLabel}>Losses</Text>
              </View>
              <View style={[s.historyStat, { borderColor: Colors.cyan + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.cyan }]}>{openTrades.length}</Text>
                <Text style={s.historyStatLabel}>Open</Text>
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>PERFORMANCE</Text>
              <View style={s.configCard}>
                {[
                  { label: 'Total P&L', value: `$${perf.totalPnl >= 0 ? '+' : ''}${perf.totalPnl.toFixed(2)}`, color: perf.totalPnl >= 0 ? Colors.green : Colors.red },
                  { label: 'Win Rate', value: `${perf.winRate.toFixed(1)}%`, color: Colors.green },
                  { label: 'Profit Factor', value: perf.profitFactor === Infinity ? '∞' : perf.profitFactor.toFixed(2), color: Colors.cyan },
                  { label: 'Max Drawdown', value: `-$${perf.maxDrawdown.toFixed(2)}`, color: Colors.red },
                  { label: 'Best Trade', value: `+$${perf.bestTrade.toFixed(2)}`, color: Colors.green },
                  { label: 'Worst Trade', value: `-$${Math.abs(perf.worstTrade).toFixed(2)}`, color: Colors.red },
                ].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    {idx > 0 && <View style={s.configDivider} />}
                    <View style={s.configRow}>
                      <Text style={s.configLabel}>{item.label}</Text>
                      <Text style={[s.configValue, { color: item.color }]}>{item.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={s.panel}>
              <Text style={s.aiSectionLabel}>TRADE HISTORY</Text>
              {trades.length === 0 ? (
                <View style={s.emptyState}>
                  <Activity size={36} color={Colors.text3} />
                  <Text style={s.emptyTitle}>No Trades Yet</Text>
                  <Text style={s.emptySubtitle}>Trades will appear here as the engine executes signals.</Text>
                </View>
              ) : (
                trades.slice(0, 20).map((trade) => {
                  const isOpen = trade.status === 'open';
                  const isWin = trade.pnl > 0;
                  const borderColor = isOpen ? Colors.cyan : isWin ? Colors.green : Colors.red;
                  return (
                    <View key={trade.id} style={[s.tradeRow, { borderLeftColor: borderColor }]}>
                      <View style={s.tradeRowTop}>
                        <View style={s.tradeRowLeft}>
                          <View style={[s.tradeSymBadge, { backgroundColor: borderColor + '12' }]}>
                            <Text style={[s.tradeSymText, { color: borderColor }]}>{trade.instrument}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={s.tradeInfoRow}>
                              <Text style={s.tradeDir}>{trade.direction}</Text>
                              <View style={[s.tradeConfBadge, { backgroundColor: (trade.pnl >= 0 ? Colors.green : Colors.red) + '12' }]}>
                                <Text style={[s.tradeConfText, { color: trade.pnl >= 0 ? Colors.green : Colors.red }]}>
                                  {((trade.pnlPercent || 0) >= 0 ? '+' : '')}{(trade.pnlPercent || 0).toFixed(2)}%
                                </Text>
                              </View>
                              {isOpen && (
                                <View style={s.liveBadge}>
                                  <View style={s.liveDot} />
                                  <Text style={s.liveText}>LIVE</Text>
                                </View>
                              )}
                            </View>
                            <Text style={s.tradeTimeText}>
                              {formatDate(trade.openTime)} {formatTime(trade.openTime)}
                              {trade.closeTime ? ` → ${formatTime(trade.closeTime)}` : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={s.tradeRowRight}>
                          <Text style={[s.tradePnlText, { color: isWin ? Colors.green : Colors.red }]}>
                            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerAccent: { color: Colors.green },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 8, fontWeight: '800' as const, letterSpacing: 1 },
  powerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  tabBtnActive: { backgroundColor: Colors.bg3 },
  tabBtnText: { fontSize: 10, color: Colors.text2, fontWeight: '600' as const },
  tabBtnTextActive: { color: Colors.amber },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 },

  panel: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },

  regimeTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regimeLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  regimeArrow: {
    fontSize: 12,
    color: Colors.text3,
  },
  regimeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bg3,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginLeft: 8,
  },
  regimeBarFill: {
    height: 8,
    borderRadius: 4,
  },

  finalConfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finalConfLabel: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  finalConfValue: {
    fontSize: 28,
    fontWeight: '900' as const,
  },
  ageText: {
    fontSize: 11,
    color: Colors.text3,
  },

  trapReasons: {
    marginTop: 10,
    gap: 4,
  },
  trapReasonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  trapBullet: {
    fontSize: 12,
    color: Colors.amber,
    lineHeight: 18,
  },
  trapReasonText: {
    fontSize: 11,
    color: Colors.amber,
    flex: 1,
    lineHeight: 18,
  },

  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  indicatorNameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    width: 90,
  },
  indicatorNameText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  indicatorBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bg3,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  indicatorBarFill: {
    height: 6,
    borderRadius: 3,
  },
  indicatorWeight: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    width: 32,
    textAlign: 'right' as const,
  },
  indicatorChange: {
    fontSize: 10,
    fontWeight: '600' as const,
    width: 22,
    textAlign: 'right' as const,
  },
  indicatorStatus: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    width: 24,
    textAlign: 'right' as const,
  },

  bottomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  bottomStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bottomStatValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  bottomStatLabel: {
    fontSize: 9,
    color: Colors.text3,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  bottomStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  aiSectionLabel: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  aiConfPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    padding: 14,
  },
  aiConfInfo: { flex: 1 },
  aiConfTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  aiConfDesc: {
    fontSize: 10,
    color: Colors.text2,
    lineHeight: 15,
    marginBottom: 8,
  },
  confThresholds: { gap: 4 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confRowText: { fontSize: 10, color: Colors.text, fontWeight: '600' as const },

  regimeClassCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  regimeClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  regimeClassType: {
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  regimeStrengthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  regimeStrengthText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  regimeClassDesc: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 2,
  },

  regimeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  regimeMetricItem: {
    alignItems: 'center',
    gap: 2,
  },
  regimeMetricLabel: {
    fontSize: 10,
    color: Colors.text3,
    fontWeight: '600' as const,
  },
  regimeMetricValue: {
    fontSize: 18,
    fontWeight: '800' as const,
  },

  regimeCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regimeCard: {
    width: '47%' as any,
    flexGrow: 1,
    flexBasis: '45%' as any,
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regimeCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  regimeCardName: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.text2,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  regimeCardDesc: {
    fontSize: 10,
    color: Colors.text3,
  },

  microRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  microDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 10,
  },
  microName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  microStatus: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  microWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: Colors.amber + '08',
    borderRadius: 8,
    padding: 10,
  },
  microWarningText: {
    flex: 1,
    fontSize: 10,
    color: Colors.text2,
    lineHeight: 15,
  },

  killRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  killDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 10,
  },
  killLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  killStatus: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },

  riskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  riskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  riskBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text2,
  },

  configCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    padding: 14,
  },
  configDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  configRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  configLabel: {
    fontSize: 13,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },

  historySummary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  historyStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
  },
  historyStatValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  historyStatLabel: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  tradeRow: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  tradeRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tradeSymBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeSymText: {
    fontSize: 9,
    fontWeight: '800' as const,
  },
  tradeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  tradeDir: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  tradeConfBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tradeConfText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.green + '12',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  liveText: {
    fontSize: 7,
    color: Colors.green,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  tradeTimeText: {
    fontSize: 9,
    color: Colors.text3,
    marginTop: 2,
  },
  tradeRowRight: {
    alignItems: 'flex-end' as const,
  },
  tradePnlText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text3,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 19,
  },
});
