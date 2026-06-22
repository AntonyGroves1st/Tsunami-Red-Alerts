import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  Zap,
  Shield,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  CircleDot,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Haptics } from '@/utils/haptics';
import {
  ArbitragePair,
  ArbitrageOpportunity,
  fetchArbitragePairs,
  findOpportunities,
  formatPrice,
} from '@/services/arbitrageService';

type FilterType = 'all' | 'profitable' | 'low-risk' | 'cross-exchange' | 'futures';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'profitable', label: 'Profitable' },
  { key: 'low-risk', label: 'Low Risk' },
  { key: 'cross-exchange', label: 'Cross-Ex' },
  { key: 'futures', label: 'Futures' },
];

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { color: Colors.green, bg: Colors.green + '15', label: 'LOW RISK', icon: Shield },
    medium: { color: Colors.amber, bg: Colors.amber + '15', label: 'MEDIUM', icon: AlertTriangle },
    high: { color: Colors.red, bg: Colors.red + '15', label: 'HIGH', icon: AlertTriangle },
  }[level];
  const Icon = config.icon;

  return (
    <View style={[s.riskBadge, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
      <Icon size={8} color={config.color} />
      <Text style={[s.riskBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: 'spot' | 'futures' | 'cross-exchange' }) {
  const config = {
    spot: { color: Colors.cyan, label: 'SPOT' },
    futures: { color: Colors.purple, label: 'FUTURES' },
    'cross-exchange': { color: Colors.orange, label: 'CROSS-EX' },
  }[type];

  return (
    <View style={[s.typeBadge, { backgroundColor: config.color + '12', borderColor: config.color + '25' }]}>
      <Text style={[s.typeBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function PlatformTag({ logo, name, color }: { logo: string; name: string; color: string }) {
  return (
    <View style={[s.platformTag, { borderColor: color + '30' }]}>
      <View style={[s.platformTagLogo, { backgroundColor: color + '18' }]}>
        <Text style={[s.platformTagLogoText, { color }]}>{logo}</Text>
      </View>
      <Text style={s.platformTagName} numberOfLines={1}>{name}</Text>
    </View>
  );
}

function OpportunityCard({ opp, index }: { opp: ArbitrageOpportunity; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const isProfitable = opp.netProfitPercent > 0;
  const profitColor = isProfitable ? Colors.green : Colors.red;

  return (
    <Animated.View
      style={[
        s.oppCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderColor: isProfitable ? Colors.green + '15' : Colors.border,
        },
      ]}
    >
      <View style={s.oppHeader}>
        <View style={s.oppSymbolRow}>
          <View style={s.oppSymbolBadge}>
            <Text style={s.oppSymbolText}>{opp.symbol}</Text>
          </View>
          <View>
            <Text style={s.oppSymbolName}>{opp.symbolName}</Text>
            <Text style={s.oppTimestamp}>
              {new Date(opp.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
        <View style={s.oppProfitCol}>
          <Text style={[s.oppProfitPercent, { color: profitColor }]}>
            {opp.netProfitPercent >= 0 ? '+' : ''}{opp.netProfitPercent.toFixed(3)}%
          </Text>
          <Text style={[s.oppProfitLabel, { color: profitColor + '80' }]}>net profit</Text>
        </View>
      </View>

      <View style={s.oppFlow}>
        <View style={s.oppFlowSide}>
          <Text style={s.oppFlowLabel}>BUY</Text>
          <PlatformTag
            logo={opp.buyPlatform.logo}
            name={opp.buyPlatform.platform}
            color={opp.buyPlatform.color}
          />
          <Text style={s.oppFlowPrice}>
            ${formatPrice(opp.buyPlatform.askPrice, opp.symbol)}
          </Text>
          <Text style={s.oppFlowFee}>Fee: {opp.buyPlatform.fees}%</Text>
        </View>

        <View style={s.oppFlowArrow}>
          <View style={[s.oppFlowArrowCircle, { backgroundColor: profitColor + '15' }]}>
            <ArrowRight size={14} color={profitColor} />
          </View>
          <Text style={[s.oppSpreadText, { color: profitColor }]}>
            {opp.spreadPercent >= 0 ? '+' : ''}{opp.spreadPercent.toFixed(3)}%
          </Text>
        </View>

        <View style={[s.oppFlowSide, { alignItems: 'flex-end' as const }]}>
          <Text style={s.oppFlowLabel}>SELL</Text>
          <PlatformTag
            logo={opp.sellPlatform.logo}
            name={opp.sellPlatform.platform}
            color={opp.sellPlatform.color}
          />
          <Text style={s.oppFlowPrice}>
            ${formatPrice(opp.sellPlatform.bidPrice, opp.symbol)}
          </Text>
          <Text style={s.oppFlowFee}>Fee: {opp.sellPlatform.fees}%</Text>
        </View>
      </View>

      <View style={s.oppFooter}>
        <RiskBadge level={opp.riskLevel} />
        <TypeBadge type={opp.type} />
        <View style={s.oppEstProfit}>
          <Text style={s.oppEstLabel}>Est. P/L:</Text>
          <Text style={[s.oppEstValue, { color: profitColor }]}>
            ${opp.estimatedProfit >= 0 ? '+' : ''}{opp.estimatedProfit.toFixed(2)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function PairSummaryCard({ pair }: { pair: ArbitragePair }) {
  const hasOpportunity = pair.maxSpreadPercent > 0;

  return (
    <View style={[s.pairCard, hasOpportunity && { borderColor: Colors.green + '20' }]}>
      <View style={s.pairHeader}>
        <View style={s.pairSymbolBadge}>
          <Text style={s.pairSymbolText}>{pair.symbol}</Text>
        </View>
        <Text style={s.pairName}>{pair.symbolName}</Text>
        <View style={[
          s.pairSpreadBadge,
          { backgroundColor: hasOpportunity ? Colors.green + '12' : Colors.bg3 },
        ]}>
          <Text style={[
            s.pairSpreadText,
            { color: hasOpportunity ? Colors.green : Colors.text2 },
          ]}>
            {pair.maxSpreadPercent >= 0 ? '+' : ''}{pair.maxSpreadPercent.toFixed(3)}%
          </Text>
        </View>
      </View>

      <View style={s.pairPlatforms}>
        {pair.platforms.map((p) => (
          <View key={p.platformId} style={s.pairPlatformRow}>
            <View style={[s.pairPlatformDot, { backgroundColor: p.color }]} />
            <Text style={s.pairPlatformName} numberOfLines={1}>{p.platform}</Text>
            <Text style={s.pairPlatformBid}>
              B: ${formatPrice(p.bidPrice, pair.symbol)}
            </Text>
            <Text style={s.pairPlatformAsk}>
              A: ${formatPrice(p.askPrice, pair.symbol)}
            </Text>
          </View>
        ))}
      </View>

      {pair.bestBuy && pair.bestSell && (
        <View style={s.pairBestRoute}>
          <Zap size={9} color={Colors.amber} />
          <Text style={s.pairBestText}>
            Buy <Text style={{ color: pair.bestBuy.color, fontWeight: '700' as const }}>{pair.bestBuy.platform}</Text>
            {' → Sell '}
            <Text style={{ color: pair.bestSell.color, fontWeight: '700' as const }}>{pair.bestSell.platform}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ArbitrageScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [pairs, setPairs] = useState<ArbitragePair[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'opportunities' | 'pairs'>('opportunities');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadData = useCallback(async () => {
    try {
      console.log('[Arbitrage] Loading data...');
      const fetchedPairs = await fetchArbitragePairs();
      setPairs(fetchedPairs);
      const opps = findOpportunities(fetchedPairs);
      setOpportunities(opps);
      setLastUpdate(Date.now());
      console.log('[Arbitrage] Loaded', fetchedPairs.length, 'pairs,', opps.length, 'opportunities');
    } catch (err: any) {
      console.log('[Arbitrage] Error:', err?.message ?? err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        loadData();
      }, 15000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, loadData]);

  useEffect(() => {
    if (autoRefresh) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [autoRefresh, pulseAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impact('light');
    loadData();
  }, [loadData]);

  const filteredOpps = opportunities.filter((opp) => {
    switch (activeFilter) {
      case 'profitable': return opp.netProfitPercent > 0;
      case 'low-risk': return opp.riskLevel === 'low';
      case 'cross-exchange': return opp.type === 'cross-exchange';
      case 'futures': return opp.type === 'futures';
      default: return true;
    }
  });

  const profitableCount = opportunities.filter(o => o.netProfitPercent > 0).length;
  const totalPairs = pairs.length;
  const avgSpread = pairs.length > 0
    ? pairs.reduce((sum, p) => sum + Math.abs(p.maxSpreadPercent), 0) / pairs.length
    : 0;

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
          <Text style={s.loadingText}>Scanning platforms...</Text>
          <Text style={s.loadingSubtext}>Fetching live prices across exchanges</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => goBack()}>
          <ChevronLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            Arbi<Text style={s.headerAccent}>trage</Text>
          </Text>
          <View style={s.liveIndicator}>
            <Animated.View style={[s.liveDot, { opacity: pulseAnim }]} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>
        <Pressable
          style={s.refreshBtn}
          onPress={handleRefresh}
        >
          <RefreshCw size={16} color={Colors.cyan} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.amber}
          />
        }
      >
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{totalPairs}</Text>
            <Text style={s.statLabel}>Pairs</Text>
          </View>
          <View style={[s.statCard, { borderColor: Colors.green + '20' }]}>
            <Text style={[s.statValue, { color: Colors.green }]}>{profitableCount}</Text>
            <Text style={s.statLabel}>Profitable</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: Colors.cyan }]}>{avgSpread.toFixed(3)}%</Text>
            <Text style={s.statLabel}>Avg Spread</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: Colors.text2 }]}>
              {lastUpdate > 0 ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s` : '--'}
            </Text>
            <Text style={s.statLabel}>Updated</Text>
          </View>
        </View>

        <View style={s.viewToggle}>
          <Pressable
            style={[s.viewToggleBtn, viewMode === 'opportunities' && s.viewToggleBtnActive]}
            onPress={() => {
              setViewMode('opportunities');
              Haptics.selection();
            }}
          >
            <Zap size={12} color={viewMode === 'opportunities' ? Colors.amber : Colors.text2} />
            <Text style={[s.viewToggleText, viewMode === 'opportunities' && s.viewToggleTextActive]}>
              Opportunities
            </Text>
          </Pressable>
          <Pressable
            style={[s.viewToggleBtn, viewMode === 'pairs' && s.viewToggleBtnActive]}
            onPress={() => {
              setViewMode('pairs');
              Haptics.selection();
            }}
          >
            <Eye size={12} color={viewMode === 'pairs' ? Colors.amber : Colors.text2} />
            <Text style={[s.viewToggleText, viewMode === 'pairs' && s.viewToggleTextActive]}>
              Price Matrix
            </Text>
          </Pressable>
        </View>

        {viewMode === 'opportunities' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
              contentContainerStyle={s.filterRow}
            >
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  style={[s.filterChip, activeFilter === f.key && s.filterChipActive]}
                  onPress={() => {
                    setActiveFilter(f.key);
                    Haptics.selection();
                  }}
                >
                  <Text style={[s.filterChipText, activeFilter === f.key && s.filterChipTextActive]}>
                    {f.label}
                  </Text>
                  {f.key === 'profitable' && (
                    <View style={s.filterChipCount}>
                      <Text style={s.filterChipCountText}>{profitableCount}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            {filteredOpps.length === 0 ? (
              <View style={s.emptyState}>
                <ArrowLeftRight size={32} color={Colors.text3} />
                <Text style={s.emptyTitle}>No opportunities match filter</Text>
                <Text style={s.emptySubtext}>Try changing filters or wait for new data</Text>
              </View>
            ) : (
              filteredOpps.map((opp, idx) => (
                <OpportunityCard key={opp.id} opp={opp} index={idx} />
              ))
            )}
          </>
        )}

        {viewMode === 'pairs' && (
          <>
            {pairs.map((pair) => (
              <PairSummaryCard key={pair.symbol} pair={pair} />
            ))}
          </>
        )}

        <View style={s.disclaimerCard}>
          <AlertTriangle size={12} color={Colors.amber} />
          <Text style={s.disclaimerText}>
            Arbitrage opportunities are calculated from live market data with real-time cross-platform 
            spreads. Actual execution may differ due to latency, slippage, and fees. 
            Always verify with real order books before trading.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.text2,
  },
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
  headerAccent: {
    color: Colors.amber,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.green + '12',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.green + '25',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.green,
    letterSpacing: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cyan + '20',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.amber,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '600' as const,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.amber + '15',
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  viewToggleTextActive: {
    color: Colors.amber,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.amber + '15',
    borderColor: Colors.amber + '30',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  filterChipTextActive: {
    color: Colors.amber,
  },
  filterChipCount: {
    backgroundColor: Colors.green + '20',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  filterChipCountText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.green,
  },
  oppCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  oppSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oppSymbolBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.amber + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oppSymbolText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  oppSymbolName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  oppTimestamp: {
    fontSize: 9,
    color: Colors.text3,
    marginTop: 2,
  },
  oppProfitCol: {
    alignItems: 'flex-end',
  },
  oppProfitPercent: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  oppProfitLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginTop: 1,
  },
  oppFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg0,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  oppFlowSide: {
    flex: 1,
    gap: 4,
  },
  oppFlowLabel: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.text3,
    letterSpacing: 1.5,
  },
  oppFlowPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  oppFlowFee: {
    fontSize: 9,
    color: Colors.text3,
  },
  oppFlowArrow: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  oppFlowArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oppSpreadText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  oppFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  oppEstProfit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  oppEstLabel: {
    fontSize: 9,
    color: Colors.text3,
  },
  oppEstValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg1,
  },
  platformTagLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformTagLogoText: {
    fontSize: 8,
    fontWeight: '800' as const,
  },
  platformTagName: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: 80,
  },
  pairCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pairSymbolBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.amber + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairSymbolText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.amber,
  },
  pairName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pairSpreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pairSpreadText: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pairPlatforms: {
    gap: 6,
  },
  pairPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: Colors.bg0,
    borderRadius: 6,
  },
  pairPlatformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pairPlatformName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pairPlatformBid: {
    fontSize: 10,
    color: Colors.green,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600' as const,
  },
  pairPlatformAsk: {
    fontSize: 10,
    color: Colors.red,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600' as const,
    minWidth: 80,
    textAlign: 'right' as const,
  },
  pairBestRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pairBestText: {
    fontSize: 10,
    color: Colors.text2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  emptySubtext: {
    fontSize: 11,
    color: Colors.text3,
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.amber + '06',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.amber + '12',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: Colors.text2,
    lineHeight: 15,
  },
});
