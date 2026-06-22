import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Switch,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import {
  Zap,
  AlertTriangle,
  ChevronLeft,
  Activity,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Power,
  History,
  Flame,
  Brain,
  Timer,
  ArrowLeftRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Haptics } from '@/utils/haptics';
import {
  ArbitrageOpportunity,
  fetchArbitragePairs,
  findOpportunities,
  formatPrice,
} from '@/services/arbitrageService';

type BotTab = 'dashboard' | 'ai' | 'config' | 'history';

interface DemoTrade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  status: 'open' | 'closed' | 'stopped';
  openTime: number;
  closeTime: number | null;
  confidence: number;
  buyPlatform: string;
  sellPlatform: string;
  executionSpeedMs: number;
}

interface DemoStats {
  totalTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentBalance: number;
  startingBalance: number;
  totalReturn: number;
  profitFactor: number;
  maxDrawdown: number;
}

interface DemoAccount {
  name: string;
  startingBalance: number;
  currentBalance: number;
  openPositions: DemoTrade[];
  closedPositions: DemoTrade[];
}

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'BNB'];
const MOCK_PRICES: Record<string, number> = { BTC: 67500, ETH: 3580, SOL: 145, XRP: 0.62, DOGE: 0.082, ADA: 0.45, AVAX: 35.5, DOT: 7.2, LINK: 14.8, BNB: 580 };
const PLATFORMS = ['Binance Spot', 'Binance Futures', 'R Pro Trader'];

function createDemoAccount(name: string): DemoAccount {
  return { name, startingBalance: 100000, currentBalance: 100000, openPositions: [], closedPositions: [] };
}

function generateDemoTrade(): DemoTrade {
  const sym = CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)];
  const price = MOCK_PRICES[sym] ?? 100;
  const dir: 'LONG' | 'SHORT' = Math.random() > 0.45 ? 'LONG' : 'SHORT';
  const qty = Math.max(0.001, Math.round((500 / price) * 1000) / 1000);
  const buyPlat = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  let sellPlat = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  while (sellPlat === buyPlat) {
    sellPlat = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  }
  return {
    id: 'dt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    symbol: sym,
    direction: dir,
    entryPrice: price * (1 + (Math.random() * 0.004 - 0.002)),
    currentPrice: price,
    exitPrice: null,
    quantity: qty,
    pnl: 0,
    pnlPercent: 0,
    status: 'open',
    openTime: Date.now(),
    closeTime: null,
    confidence: 0.6 + Math.random() * 0.35,
    buyPlatform: buyPlat,
    sellPlatform: sellPlat,
    executionSpeedMs: 100 + Math.floor(Math.random() * 400),
  };
}

function updateDemoPositions(account: DemoAccount): DemoAccount {
  const nowOpen: DemoTrade[] = [];
  const nowClosed: DemoTrade[] = [...account.closedPositions];
  let bal = account.startingBalance + account.closedPositions.reduce((s, t) => s + t.pnl, 0);

  for (const t of account.openPositions) {
    const noise = t.entryPrice * (Math.random() * 0.01 - 0.005);
    const cur = t.entryPrice + noise;
    const dir = t.direction === 'LONG' ? 1 : -1;
    const pnl = (cur - t.entryPrice) * dir * t.quantity;
    const age = Date.now() - t.openTime;
    const pnlPct = t.entryPrice * t.quantity > 0 ? (pnl / (t.entryPrice * t.quantity)) * 100 : 0;

    if (age > 15000 || Math.abs(pnl) > t.entryPrice * t.quantity * 0.03) {
      nowClosed.push({
        ...t,
        currentPrice: cur,
        exitPrice: cur,
        pnl,
        pnlPercent: pnlPct,
        status: pnl > 0 ? 'closed' : 'stopped',
        closeTime: Date.now(),
      });
      bal += pnl;
    } else {
      nowOpen.push({ ...t, currentPrice: cur, pnl, pnlPercent: pnlPct });
    }
  }

  return { ...account, currentBalance: bal, openPositions: nowOpen, closedPositions: nowClosed.slice(-50) };
}

function calculateDemoStats(account: DemoAccount): DemoStats {
  const closed = account.closedPositions;
  const wins = closed.filter(t => t.pnl > 0);
  const losses = closed.filter(t => t.pnl <= 0);
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const grossW = wins.reduce((s, t) => s + t.pnl, 0);
  const grossL = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  let maxDD = 0, peak = 0, running = 0;
  for (const t of closed) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    totalTrades: closed.length + account.openPositions.length,
    openTrades: account.openPositions.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    currentBalance: account.currentBalance,
    startingBalance: account.startingBalance,
    totalReturn: ((account.currentBalance - account.startingBalance) / account.startingBalance) * 100,
    profitFactor: grossL > 0 ? grossW / grossL : grossW > 0 ? Infinity : 0,
    maxDrawdown: maxDD,
  };
}

function PulsingCore({ active, size = 56 }: { active: boolean; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
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

  const color = active ? Colors.green : Colors.text3;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color + '40',
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
        <ArrowLeftRight size={size * 0.28} color={color} />
      </View>
    </View>
  );
}

function DemoTradeRow({ trade, index }: { trade: DemoTrade; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const isOpen = trade.status === 'open';
  const isWin = trade.pnl > 0;
  const borderColor = trade.status === 'stopped' ? Colors.red
    : isWin ? Colors.green
    : isOpen ? Colors.cyan
    : Colors.red;
  const confColor = trade.confidence >= 0.75 ? Colors.green : trade.confidence >= 0.65 ? Colors.amber : Colors.red;

  return (
    <Animated.View style={[s.tradeRow, { opacity: fadeAnim, borderLeftColor: borderColor }]}>
      <View style={s.tradeRowHeader}>
        <View style={s.tradeRowLeft}>
          <View style={[s.tradeSymbolBadge, { backgroundColor: borderColor + '12' }]}>
            <Text style={[s.tradeSymbolText, { color: borderColor }]}>{trade.symbol}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.tradeRouteRow}>
              <Text style={s.tradeRoutePlatform}>{trade.buyPlatform.split(' ')[0]}</Text>
              <ArrowRight size={8} color={Colors.text3} />
              <Text style={s.tradeRoutePlatform}>{trade.sellPlatform.split(' ')[0]}</Text>
              <View style={[s.confBadgeSmall, { backgroundColor: confColor + '12' }]}>
                <Text style={[s.confBadgeSmallText, { color: confColor }]}>{Math.round(trade.confidence * 100)}%</Text>
              </View>
              {isOpen && (
                <View style={s.liveBadge}>
                  <View style={s.liveBadgeDot} />
                  <Text style={s.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={s.tradeTimestamp}>
              {new Date(trade.openTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {' · '}{trade.executionSpeedMs}ms
            </Text>
          </View>
        </View>
        <View style={s.tradeRowRight}>
          <Text style={[s.tradeProfitText, { color: isWin ? Colors.green : Colors.red }]}>
            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
          </Text>
          <Text style={[s.tradeProfitPercent, { color: (isWin ? Colors.green : Colors.red) + '80' }]}>
            {isWin ? '+' : ''}{trade.pnlPercent.toFixed(3)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ArbitrageBotScreen() {
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();

  const [activeTab, setActiveTab] = useState<BotTab>('dashboard');
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [autoTradeOn, setAutoTradeOn] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [scanCount, setScanCount] = useState<number>(0);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number>(0.76);
  const [executionSpeedMs, setExecutionSpeedMs] = useState<number>(165);

  const [demoAccount, setDemoAccount] = useState<DemoAccount>(() => createDemoAccount('Arbitrage Bot'));
  const [demoStats, setDemoStats] = useState<DemoStats>(() => calculateDemoStats(demoAccount));

  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tradeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!botEnabled) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
      return;
    }

    const scan = async () => {
      try {
        console.log('[ArbitrageBot] Scanning...');
        const pairs = await fetchArbitragePairs();
        const opps = findOpportunities(pairs);
        setOpportunities(opps.filter(o => o.netProfitPercent >= 0.05).slice(0, 10));
        setScanCount(prev => prev + 1);
        setAiConfidence(0.55 + Math.random() * 0.4);
        setExecutionSpeedMs(100 + Math.floor(Math.random() * 300));
      } catch (err: any) {
        console.log('[ArbitrageBot] Scan error:', err?.message);
      }
    };

    scan();
    scanTimerRef.current = setInterval(scan, 30000);

    const tradeTick = () => {
      try {
        setDemoAccount(prev => {
          let updated = updateDemoPositions(prev);
          if (autoTradeOn && Math.random() > 0.45 && updated.openPositions.length < 4) {
            const newTrade = generateDemoTrade();
            updated = { ...updated, openPositions: [...updated.openPositions, newTrade] };
            console.log(`[ArbitrageBot] Trade: ${newTrade.direction} ${newTrade.symbol}`);
          }
          const newStats = calculateDemoStats(updated);
          setDemoStats(newStats);
          return updated;
        });
      } catch (e) {
        console.log('[ArbitrageBot] Trade tick error:', e);
      }
    };

    tradeTick();
    tradeTimerRef.current = setInterval(tradeTick, 2500);

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
    };
  }, [botEnabled, autoTradeOn]);

  const toggleBot = useCallback(() => {
    setBotEnabled(p => !p);
    Haptics.notification(!botEnabled ? 'success' : 'warning');
  }, [botEnabled]);

  const resetDemoAccount = useCallback(() => {
    const newAccount = createDemoAccount('Arbitrage Bot');
    setDemoAccount(newAccount);
    setDemoStats(calculateDemoStats(newAccount));
    Haptics.notification('success');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impact('light');
    try {
      const pairs = await fetchArbitragePairs();
      const opps = findOpportunities(pairs);
      setOpportunities(opps.filter(o => o.netProfitPercent >= 0.05).slice(0, 10));
    } catch (err: any) {
      console.log('[ArbitrageBot] Refresh error:', err?.message);
    }
    setDemoAccount(prev => {
      const updated = updateDemoPositions(prev);
      setDemoStats(calculateDemoStats(updated));
      return updated;
    });
    setRefreshing(false);
  }, []);

  const statusColor = botEnabled ? Colors.green : Colors.text3;
  const statusLabel = botEnabled ? 'SCANNING' : 'OFFLINE';
  const returnColor = demoStats.totalReturn >= 0 ? Colors.green : Colors.red;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={goBack} testID="arb-back">
          <ChevronLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Emperial<Text style={s.headerAccent}>Arb</Text></Text>
          <View style={[s.statusIndicator, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Pressable
          style={[s.powerBtn, botEnabled && { borderColor: Colors.green + '40', backgroundColor: Colors.green + '08' }]}
          onPress={toggleBot}
          testID="arb-power"
        >
          <Power size={18} color={botEnabled ? Colors.green : Colors.text2} />
        </Pressable>
      </View>

      <View style={s.tabBar}>
        {([
          { key: 'dashboard' as BotTab, label: 'Dashboard', icon: BarChart3 },
          { key: 'ai' as BotTab, label: 'AI Brain', icon: Brain },
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
            <View style={s.demoBanner}>
              <View style={s.demoBannerTop}>
                <View style={s.demoBadge}>
                  <View style={[s.demoDot, { backgroundColor: botEnabled ? Colors.green : Colors.text3 }]} />
                  <Text style={s.demoBadgeText}>DEMO ACCOUNT</Text>
                </View>
                <Text style={s.demoPlayMoney}>PLAY MONEY</Text>
              </View>
              <View style={s.demoBannerMain}>
                <View style={{ flex: 1 }}>
                  <Text style={s.demoBalLabel}>Balance</Text>
                  <Text style={s.demoBalValue}>${demoStats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
                <View style={s.demoReturnWrap}>
                  <Text style={[s.demoReturnValue, { color: returnColor }]}>
                    {demoStats.totalReturn >= 0 ? '+' : ''}{demoStats.totalReturn.toFixed(2)}%
                  </Text>
                  <Text style={s.demoReturnLabel}>Return</Text>
                </View>
              </View>
              <View style={s.demoBannerStats}>
                {[
                  { v: `$${demoAccount.startingBalance.toLocaleString()}`, l: 'Starting', c: Colors.text },
                  { v: `${demoStats.totalPnl >= 0 ? '+' : ''}$${demoStats.totalPnl.toFixed(2)}`, l: 'P&L', c: demoStats.totalPnl >= 0 ? Colors.green : Colors.red },
                  { v: `${demoStats.totalTrades}`, l: 'Trades', c: Colors.text },
                  { v: `${demoStats.openTrades}`, l: 'Open', c: Colors.cyan },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.demoStatDivider} />}
                    <View style={s.demoStat}>
                      <Text style={[s.demoStatValue, { color: item.c }]}>{item.v}</Text>
                      <Text style={s.demoStatLabel}>{item.l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={s.coreCard}>
              <View style={s.coreRow}>
                <PulsingCore active={botEnabled} size={56} />
                <View style={s.coreInfo}>
                  <Text style={s.coreTitle}>AI Arbitrage Engine</Text>
                  <Text style={s.coreDesc}>
                    {botEnabled ? `Demo mode · ${CRYPTO_SYMBOLS.length} pairs · Auto-trade ${autoTradeOn ? 'ON' : 'OFF'}` : 'Engine offline'}
                  </Text>
                  {botEnabled && (
                    <View style={s.coreMeta}>
                      <View style={s.coreMetaItem}>
                        <RefreshCw size={9} color={Colors.cyan} />
                        <Text style={[s.coreMetaText, { color: Colors.cyan }]}>{scanCount} scans</Text>
                      </View>
                      <View style={s.coreMetaItem}>
                        <Timer size={9} color={Colors.amber} />
                        <Text style={[s.coreMetaText, { color: Colors.amber }]}>{executionSpeedMs}ms</Text>
                      </View>
                      <View style={s.coreMetaItem}>
                        <Zap size={9} color={Colors.green} />
                        <Text style={[s.coreMetaText, { color: Colors.green }]}>{opportunities.length} opps</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.autoTradeRow}>
                <Text style={s.autoTradeLabel}>Auto-Trade</Text>
                <Switch
                  value={autoTradeOn}
                  onValueChange={(v) => { setAutoTradeOn(v); Haptics.impact('medium'); }}
                  trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                  thumbColor={autoTradeOn ? Colors.green : Colors.text2}
                />
              </View>
            </View>

            <View style={s.pnlCard}>
              <View style={s.pnlTop}>
                <Text style={s.pnlLabel}>DEMO P&L</Text>
                <Text style={[s.pnlValue, { color: demoStats.totalPnl >= 0 ? Colors.green : Colors.red }]}>
                  ${demoStats.totalPnl >= 0 ? '+' : ''}{demoStats.totalPnl.toFixed(2)}
                </Text>
              </View>
              <View style={s.pnlBar}>
                <View style={[s.pnlBarFill, {
                  width: `${Math.min(100, Math.max(5, demoStats.winRate))}%` as any,
                  backgroundColor: demoStats.winRate >= 60 ? Colors.green : demoStats.winRate >= 40 ? Colors.amber : Colors.red,
                }]} />
              </View>
              <View style={s.pnlBottom}>
                <Text style={s.pnlBottomText}>{demoStats.wins}W / {demoStats.losses}L</Text>
                <Text style={s.pnlBottomText}>{demoStats.winRate.toFixed(1)}% win rate</Text>
              </View>
            </View>

            {opportunities.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Flame size={13} color={Colors.amber} />
                  <Text style={s.sectionTitle}>AI-FILTERED OPPORTUNITIES</Text>
                  <View style={s.countBadge}><Text style={s.countBadgeText}>{opportunities.length}</Text></View>
                </View>
                {opportunities.slice(0, 5).map((opp) => {
                  const isProfitable = opp.netProfitPercent > 0;
                  return (
                    <View key={opp.id} style={[s.oppRow, { borderLeftColor: isProfitable ? Colors.green : Colors.amber }]}>
                      <View style={s.oppRowTop}>
                        <View style={s.oppRowSymbol}>
                          <Text style={s.oppRowSymbolText}>{opp.symbol}</Text>
                        </View>
                        <View style={s.oppRouteRow}>
                          <Text style={s.oppRoutePlatform}>{opp.buyPlatform.platform.split(' ')[0]}</Text>
                          <ArrowRight size={8} color={isProfitable ? Colors.green : Colors.amber} />
                          <Text style={s.oppRoutePlatform}>{opp.sellPlatform.platform.split(' ')[0]}</Text>
                        </View>
                        <Text style={[s.oppProfit, { color: isProfitable ? Colors.green : Colors.amber }]}>
                          {opp.netProfitPercent >= 0 ? '+' : ''}{opp.netProfitPercent.toFixed(3)}%
                        </Text>
                      </View>
                      <View style={s.oppRowBottom}>
                        <Text style={s.oppDetailText}>
                          Buy ${formatPrice(opp.buyPlatform.askPrice, opp.symbol)} → Sell ${formatPrice(opp.sellPlatform.bidPrice, opp.symbol)}
                        </Text>
                        <View style={[s.oppRiskBadge, { backgroundColor: (opp.riskLevel === 'low' ? Colors.green : opp.riskLevel === 'medium' ? Colors.amber : Colors.red) + '12' }]}>
                          <Text style={[s.oppRiskText, { color: opp.riskLevel === 'low' ? Colors.green : opp.riskLevel === 'medium' ? Colors.amber : Colors.red }]}>
                            {opp.riskLevel.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {demoAccount.openPositions.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Activity size={13} color={Colors.green} />
                  <Text style={s.sectionTitle}>OPEN POSITIONS</Text>
                  <View style={s.countBadge}><Text style={s.countBadgeText}>{demoAccount.openPositions.length}</Text></View>
                </View>
                {demoAccount.openPositions.map((trade, idx) => (
                  <DemoTradeRow key={trade.id} trade={trade} index={idx} />
                ))}
              </View>
            )}

            <Pressable style={s.resetDemoBtn} onPress={resetDemoAccount}>
              <RefreshCw size={12} color={Colors.amber} />
              <Text style={s.resetDemoBtnText}>RESET DEMO ACCOUNT</Text>
            </Pressable>

            <View style={s.disclaimerCard}>
              <AlertTriangle size={12} color={Colors.amber} />
              <Text style={s.disclaimerText}>
                DEMO MODE — Using play money ($100,000). No real funds at risk. AI-assisted arbitrage signals.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <View style={s.aiSection}>
              <Text style={s.aiSectionTitle}>AI CONFIDENCE</Text>
              <View style={s.aiConfPanel}>
                <View style={s.confRing}>
                  <View style={[s.confRingOuter, { borderColor: (aiConfidence >= 0.75 ? Colors.green : aiConfidence >= 0.65 ? Colors.amber : Colors.red) + '25' }]}>
                    <View style={[s.confRingInner, { borderColor: (aiConfidence >= 0.75 ? Colors.green : aiConfidence >= 0.65 ? Colors.amber : Colors.red) + '50' }]}>
                      <Text style={[s.confRingValue, { color: aiConfidence >= 0.75 ? Colors.green : aiConfidence >= 0.65 ? Colors.amber : Colors.red }]}>
                        {Math.round(aiConfidence * 100)}
                      </Text>
                      <Text style={[s.confRingLabel, { color: (aiConfidence >= 0.75 ? Colors.green : aiConfidence >= 0.65 ? Colors.amber : Colors.red) + 'AA' }]}>%</Text>
                    </View>
                  </View>
                </View>
                <View style={s.aiConfInfo}>
                  <Text style={s.aiConfInfoLabel}>Opportunity Quality Score</Text>
                  <Text style={s.aiConfInfoDesc}>
                    AI filters opportunities by spread stability, execution speed, liquidity depth, and success rate.
                  </Text>
                  <View style={s.confThresholds}>
                    <View style={s.confThresholdRow}><View style={[s.confThresholdDot, { backgroundColor: Colors.red }]} /><Text style={s.confThresholdText}>{'<'}65% = Skip</Text></View>
                    <View style={s.confThresholdRow}><View style={[s.confThresholdDot, { backgroundColor: Colors.amber }]} /><Text style={s.confThresholdText}>65-75% = Alert only</Text></View>
                    <View style={s.confThresholdRow}><View style={[s.confThresholdDot, { backgroundColor: Colors.green }]} /><Text style={s.confThresholdText}>{'>'}75% = Auto-execute</Text></View>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.aiSection}>
              <Text style={s.aiSectionTitle}>AI ENGINE LAYERS</Text>
              <View style={s.layerCard}>
                {[
                  { name: 'EV Trade Filter', desc: 'Block negative EV trades', color: Colors.cyan },
                  { name: 'Sweep Detection', desc: 'Detect stop hunts & fakes', color: Colors.purple },
                  { name: 'Anti-Whipsaw Filter', desc: 'Compression + spread guard', color: Colors.amber },
                  { name: 'Position Sizing', desc: 'Risk-adjusted sizing', color: Colors.cyan },
                  { name: 'Frequency Governor', desc: 'Max 5 trades/day', color: Colors.green },
                  { name: 'Regime Gate', desc: 'Min confidence per regime', color: Colors.red },
                ].map((layer, i) => (
                  <View key={i} style={[s.layerRow, { backgroundColor: layer.color + '04' }]}>
                    <View style={[s.layerDot, { backgroundColor: layer.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.layerName, { color: layer.color }]}>{layer.name}</Text>
                      <Text style={s.layerDesc}>{layer.desc}</Text>
                    </View>
                    <Text style={[s.layerStatus, { color: Colors.green }]}>Active</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.aiSection}>
              <Text style={s.aiSectionTitle}>ENGINE STATS</Text>
              <View style={s.statsPanel}>
                {[
                  { label: 'Scans', value: `${scanCount}`, color: Colors.text },
                  { label: 'Trades', value: `${demoStats.totalTrades}`, color: Colors.cyan },
                  { label: 'Win Rate', value: `${demoStats.winRate.toFixed(1)}%`, color: Colors.green },
                  { label: 'Avg Speed', value: `${executionSpeedMs}ms`, color: Colors.amber },
                ].map((row, i) => (
                  <View key={i} style={s.statRow}>
                    <Text style={s.statLabel}>{row.label}</Text>
                    <Text style={[s.statValue, { color: row.color }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <View style={s.historySummary}>
              <View style={[s.historyStat, { borderColor: Colors.green + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.green }]}>{demoStats.wins}</Text>
                <Text style={s.historyStatLabel}>Wins</Text>
              </View>
              <View style={[s.historyStat, { borderColor: Colors.red + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.red }]}>{demoStats.losses}</Text>
                <Text style={s.historyStatLabel}>Losses</Text>
              </View>
              <View style={[s.historyStat, { borderColor: Colors.amber + '20' }]}>
                <Text style={[s.historyStatValue, { color: Colors.amber }]}>{demoStats.totalTrades}</Text>
                <Text style={s.historyStatLabel}>Total</Text>
              </View>
            </View>

            <View style={s.historyPerf}>
              {[
                { label: 'Balance', value: `$${demoStats.currentBalance.toFixed(2)}`, color: Colors.cyan },
                { label: 'Net P&L', value: `$${demoStats.totalPnl.toFixed(2)}`, color: demoStats.totalPnl >= 0 ? Colors.green : Colors.red },
                { label: 'Win Rate', value: `${demoStats.winRate.toFixed(1)}%`, color: Colors.green },
                { label: 'Max Drawdown', value: `-$${demoStats.maxDrawdown.toFixed(2)}`, color: Colors.red },
                { label: 'Profit Factor', value: demoStats.profitFactor === Infinity ? '∞' : demoStats.profitFactor.toFixed(2), color: Colors.green },
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <View style={s.historyPerfDivider} />}
                  <View style={s.historyPerfRow}>
                    <Text style={s.historyPerfLabel}>{item.label}</Text>
                    <Text style={[s.historyPerfValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <History size={13} color={Colors.text2} />
                <Text style={s.sectionTitle}>ALL DEMO TRADES</Text>
              </View>
              {[...demoAccount.openPositions, ...demoAccount.closedPositions].map((trade, idx) => (
                <DemoTradeRow key={trade.id} trade={trade} index={idx} />
              ))}
            </View>

            <Pressable style={s.resetDemoBtn} onPress={resetDemoAccount}>
              <RefreshCw size={12} color={Colors.amber} />
              <Text style={s.resetDemoBtnText}>RESET DEMO ACCOUNT</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.bg1, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.white, letterSpacing: 0.5 },
  headerAccent: { color: Colors.green },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 8, fontWeight: '800' as const, letterSpacing: 1 },
  powerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  tabBar: { flexDirection: 'row', marginHorizontal: 12, marginTop: 10, backgroundColor: Colors.bg1, borderRadius: 8, padding: 3, borderWidth: 1, borderColor: Colors.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 4 },
  tabBtnActive: { backgroundColor: Colors.bg3 },
  tabBtnText: { fontSize: 10, color: Colors.text2, fontWeight: '600' as const },
  tabBtnTextActive: { color: Colors.amber },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 },

  demoBanner: { backgroundColor: Colors.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.green + '25', marginBottom: 12 },
  demoBannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.green + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  demoDot: { width: 6, height: 6, borderRadius: 3 },
  demoBadgeText: { fontSize: 9, fontWeight: '800' as const, color: Colors.green, letterSpacing: 1 },
  demoPlayMoney: { fontSize: 8, fontWeight: '700' as const, color: Colors.amber, letterSpacing: 1, backgroundColor: Colors.amber + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  demoBannerMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  demoBalLabel: { fontSize: 9, color: Colors.text3, marginBottom: 2 },
  demoBalValue: { fontSize: 24, fontWeight: '900' as const, color: Colors.white, letterSpacing: -0.5 },
  demoReturnWrap: { alignItems: 'flex-end' as const },
  demoReturnValue: { fontSize: 16, fontWeight: '800' as const },
  demoReturnLabel: { fontSize: 9, color: Colors.text3, marginTop: 1 },
  demoBannerStats: { flexDirection: 'row', alignItems: 'center' },
  demoStatDivider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 8 },
  demoStat: { flex: 1, alignItems: 'center' as const },
  demoStatValue: { fontSize: 13, fontWeight: '700' as const },
  demoStatLabel: { fontSize: 9, color: Colors.text3, marginTop: 1 },

  coreCard: { backgroundColor: Colors.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  coreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coreInfo: { flex: 1 },
  coreTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.white, marginBottom: 2 },
  coreDesc: { fontSize: 11, color: Colors.text2, lineHeight: 16 },
  coreMeta: { flexDirection: 'row', gap: 10, marginTop: 6 },
  coreMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coreMetaText: { fontSize: 10, fontWeight: '600' as const },
  autoTradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  autoTradeLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.text2 },

  pnlCard: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  pnlTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pnlLabel: { fontSize: 10, color: Colors.text2, fontWeight: '700' as const, letterSpacing: 1 },
  pnlValue: { fontSize: 26, fontWeight: '800' as const },
  pnlBar: { height: 6, backgroundColor: Colors.bg3, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 8 },
  pnlBarFill: { height: 6, borderRadius: 3 },
  pnlBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  pnlBottomText: { fontSize: 10, color: Colors.text2, fontWeight: '600' as const },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 10, color: Colors.text2, fontWeight: '700' as const, letterSpacing: 1 },
  countBadge: { backgroundColor: Colors.amber + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  countBadgeText: { fontSize: 9, color: Colors.amber, fontWeight: '700' as const },

  oppRow: { backgroundColor: Colors.bg1, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  oppRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oppRowSymbol: { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.amber + '10', alignItems: 'center', justifyContent: 'center' },
  oppRowSymbolText: { fontSize: 10, fontWeight: '800' as const, color: Colors.amber },
  oppRouteRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  oppRoutePlatform: { fontSize: 10, color: Colors.text, fontWeight: '600' as const },
  oppProfit: { fontSize: 14, fontWeight: '800' as const },
  oppRowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  oppDetailText: { fontSize: 9, color: Colors.text2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  oppRiskBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  oppRiskText: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 0.5 },

  tradeRow: { backgroundColor: Colors.bg1, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  tradeRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tradeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  tradeSymbolBadge: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tradeSymbolText: { fontSize: 10, fontWeight: '800' as const },
  tradeRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  tradeRoutePlatform: { fontSize: 9, color: Colors.text, fontWeight: '600' as const },
  confBadgeSmall: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginLeft: 2 },
  confBadgeSmallText: { fontSize: 7, fontWeight: '700' as const },
  tradeTimestamp: { fontSize: 8, color: Colors.text3, marginTop: 2 },
  tradeRowRight: { alignItems: 'flex-end' as const },
  tradeProfitText: { fontSize: 14, fontWeight: '800' as const },
  tradeProfitPercent: { fontSize: 9, fontWeight: '600' as const, marginTop: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.green + '12', marginLeft: 2 },
  liveBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.green },
  liveBadgeText: { fontSize: 7, color: Colors.green, fontWeight: '800' as const, letterSpacing: 0.5 },

  resetDemoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.amber + '10', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.amber + '20' },
  resetDemoBtnText: { fontSize: 10, fontWeight: '700' as const, color: Colors.amber, letterSpacing: 0.5 },

  disclaimerCard: { flexDirection: 'row', gap: 8, backgroundColor: Colors.amber + '06', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.amber + '12' },
  disclaimerText: { flex: 1, fontSize: 9, color: Colors.text2, lineHeight: 14 },

  aiSection: { marginBottom: 16 },
  aiSectionTitle: { fontSize: 10, color: Colors.text2, fontWeight: '700' as const, letterSpacing: 1, marginBottom: 8 },
  aiConfPanel: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  confRing: { alignItems: 'center', justifyContent: 'center' },
  confRingOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  confRingInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  confRingValue: { fontSize: 20, fontWeight: '900' as const },
  confRingLabel: { fontSize: 8, fontWeight: '700' as const, marginTop: -2 },
  aiConfInfo: { flex: 1 },
  aiConfInfoLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  aiConfInfoDesc: { fontSize: 10, color: Colors.text2, lineHeight: 15, marginBottom: 8 },
  confThresholds: { gap: 4 },
  confThresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confThresholdDot: { width: 8, height: 8, borderRadius: 4 },
  confThresholdText: { fontSize: 10, color: Colors.text, fontWeight: '600' as const },

  layerCard: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 8 },
  layerDot: { width: 8, height: 8, borderRadius: 4 },
  layerName: { fontSize: 11, fontWeight: '600' as const },
  layerDesc: { fontSize: 8, color: Colors.text3, marginTop: 1 },
  layerStatus: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 0.5 },

  statsPanel: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel: { fontSize: 10, color: Colors.text2, fontWeight: '600' as const },
  statValue: { fontSize: 14, fontWeight: '800' as const },

  historySummary: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  historyStat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: Colors.bg1, borderWidth: 1 },
  historyStatValue: { fontSize: 22, fontWeight: '800' as const },
  historyStatLabel: { fontSize: 9, color: Colors.text2, fontWeight: '600' as const, letterSpacing: 0.5, marginTop: 2 },
  historyPerf: { backgroundColor: Colors.bg1, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  historyPerfRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  historyPerfLabel: { fontSize: 12, color: Colors.text2, fontWeight: '600' as const },
  historyPerfValue: { fontSize: 14, fontWeight: '700' as const },
  historyPerfDivider: { height: 1, backgroundColor: Colors.border },
});
