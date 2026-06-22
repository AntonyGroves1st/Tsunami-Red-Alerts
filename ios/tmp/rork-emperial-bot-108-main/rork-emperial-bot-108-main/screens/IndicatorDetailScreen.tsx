import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { TrendingUp, TrendingDown, Activity, BarChart3, Cloud, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatIndicatorValue } from '@/utils/calculations';

type IndicatorType = 'ema200' | 'ema21' | 'macd' | 'cloud';

interface HistoryPoint {
  index: number;
  value: number;
}

function AnimatedBar({ value, maxVal, color, delay }: { value: number; maxVal: number; color: string; delay: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = maxVal > 0 ? Math.min(Math.abs(value) / maxVal, 1) * 100 : 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct, delay, widthAnim]);

  return (
    <View style={detailStyles.barTrack}>
      <Animated.View
        style={[
          detailStyles.barFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

function MetricRow({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={detailStyles.metricRow}>
      <View style={detailStyles.metricLeft}>
        <View style={[detailStyles.metricDot, { backgroundColor: color }]} />
        <Text style={detailStyles.metricLabel}>{label}</Text>
      </View>
      <View style={detailStyles.metricRight}>
        <Text style={[detailStyles.metricValue, { color }]}>{value}</Text>
        {sub ? <Text style={detailStyles.metricSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export default function IndicatorDetailScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = (params.type ?? 'ema200') as IndicatorType;
  const { width: screenWidth } = useWindowDimensions();
  const indicatorType = (type as IndicatorType) || 'ema200';

  const {
    price,
    indicators,
    candles,
    instrument,
  } = useMarketData();

  const n = candles.length - 1;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const config = useMemo(() => {
    switch (indicatorType) {
      case 'ema200':
        return {
          title: 'EMA 200',
          subtitle: '200-Period Exponential Moving Average',
          icon: TrendingUp,
          color: Colors.cyan,
          description: 'The 200 EMA is a widely-used long-term trend indicator. When price is above, the trend is bullish; below signals bearish. It acts as dynamic support/resistance.',
        };
      case 'ema21':
        return {
          title: 'EMA 21',
          subtitle: '21-Period Exponential Moving Average',
          icon: Activity,
          color: Colors.pink,
          description: 'The 21 EMA tracks short-term momentum. Traders use it for pullback entries and to gauge immediate trend direction. Crossovers with longer EMAs generate signals.',
        };
      case 'macd':
        return {
          title: 'MACD',
          subtitle: 'Moving Average Convergence Divergence',
          icon: BarChart3,
          color: Colors.purple,
          description: 'MACD measures the relationship between two EMAs (12 & 26). The histogram shows momentum strength. Positive histogram = bullish momentum, negative = bearish.',
        };
      case 'cloud':
        return {
          title: 'Cloud Analysis',
          subtitle: 'Trend Cloud (EMA 9/21 + SMA 50)',
          icon: Cloud,
          color: Colors.amber,
          description: 'The cloud combines short EMA (9), long EMA (21), and SMA (50) to define trend zones. Bullish cloud = short above long; bearish = short below long.',
        };
      default:
        return {
          title: 'Indicator',
          subtitle: '',
          icon: Activity,
          color: Colors.text,
          description: '',
        };
    }
  }, [indicatorType]);

  const details = useMemo(() => {
    if (!indicators || n < 0) return null;

    switch (indicatorType) {
      case 'ema200': {
        const emaVal = indicators.ema200[n] ?? 0;
        const diff = price - emaVal;
        const pctFromEma = emaVal > 0 ? (diff / emaVal) * 100 : 0;
        const isAbove = price > emaVal;
        const prev5 = indicators.ema200.slice(Math.max(0, n - 5), n + 1);
        const slope = prev5.length > 1 ? prev5[prev5.length - 1] - prev5[0] : 0;
        const ema21Val = indicators.ema21[n] ?? 0;
        const ema21Above200 = ema21Val > emaVal;

        return {
          currentValue: formatIndicatorValue(emaVal),
          signal: isAbove ? 'BULLISH' : 'BEARISH',
          signalColor: isAbove ? Colors.green : Colors.red,
          metrics: [
            { label: 'Current Price', value: formatPrice(price), color: Colors.white },
            { label: 'EMA 200 Value', value: formatIndicatorValue(emaVal), color: config.color },
            { label: 'Distance', value: `${diff >= 0 ? '+' : ''}${formatIndicatorValue(diff)}`, color: isAbove ? Colors.green : Colors.red, sub: `${pctFromEma >= 0 ? '+' : ''}${pctFromEma.toFixed(2)}%` },
            { label: 'EMA Slope (5-bar)', value: slope >= 0 ? 'Rising' : 'Falling', color: slope >= 0 ? Colors.green : Colors.red },
            { label: 'EMA 21 vs 200', value: ema21Above200 ? 'Above (Bullish)' : 'Below (Bearish)', color: ema21Above200 ? Colors.green : Colors.red },
          ],
          interpretation: isAbove
            ? `${instrument} is trading ${pctFromEma.toFixed(2)}% above the 200 EMA, indicating a bullish long-term trend. The EMA slope is ${slope >= 0 ? 'rising' : 'falling'}, suggesting ${slope >= 0 ? 'strengthening' : 'weakening'} momentum.`
            : `${instrument} is trading ${Math.abs(pctFromEma).toFixed(2)}% below the 200 EMA, indicating a bearish long-term trend. Consider waiting for price to reclaim this level before entering longs.`,
        };
      }
      case 'ema21': {
        const emaVal = indicators.ema21[n] ?? 0;
        const diff = price - emaVal;
        const pctFromEma = emaVal > 0 ? (diff / emaVal) * 100 : 0;
        const isAbove = price > emaVal;
        const ema200Val = indicators.ema200[n] ?? 0;
        const crossAbove200 = emaVal > ema200Val;
        const prev5 = indicators.ema21.slice(Math.max(0, n - 5), n + 1);
        const slope = prev5.length > 1 ? prev5[prev5.length - 1] - prev5[0] : 0;
        const touchCount = candles.slice(Math.max(0, n - 20), n + 1).filter((c, i) => {
          const idx = Math.max(0, n - 20) + i;
          const ema = indicators.ema21[idx] ?? 0;
          return Math.abs(c.l - ema) / ema < 0.002 || Math.abs(c.h - ema) / ema < 0.002;
        }).length;

        return {
          currentValue: formatIndicatorValue(emaVal),
          signal: isAbove ? 'BULLISH' : 'BEARISH',
          signalColor: isAbove ? Colors.green : Colors.red,
          metrics: [
            { label: 'Current Price', value: formatPrice(price), color: Colors.white },
            { label: 'EMA 21 Value', value: formatIndicatorValue(emaVal), color: config.color },
            { label: 'Distance', value: `${diff >= 0 ? '+' : ''}${formatIndicatorValue(diff)}`, color: isAbove ? Colors.green : Colors.red, sub: `${pctFromEma >= 0 ? '+' : ''}${pctFromEma.toFixed(2)}%` },
            { label: 'EMA Slope (5-bar)', value: slope >= 0 ? 'Rising' : 'Falling', color: slope >= 0 ? Colors.green : Colors.red },
            { label: 'vs EMA 200', value: crossAbove200 ? 'Above (Golden)' : 'Below (Death)', color: crossAbove200 ? Colors.green : Colors.red },
            { label: 'S/R Touches (20-bar)', value: `${touchCount}`, color: Colors.text },
          ],
          interpretation: isAbove
            ? `Price is holding above the 21 EMA, confirming short-term bullish momentum. ${crossAbove200 ? 'The 21 EMA is also above the 200 EMA (golden alignment).' : 'However, 21 EMA is still below 200 EMA — mixed signals.'}`
            : `Price has broken below the 21 EMA, signaling short-term weakness. ${!crossAbove200 ? 'Both short and long-term EMAs confirm bearish structure.' : 'The 21 EMA remains above 200 EMA — potential pullback opportunity.'}`,
        };
      }
      case 'macd': {
        const macdVal = indicators.macdLine[n] ?? 0;
        const signalVal = indicators.macdSignal[n] ?? 0;
        const histVal = indicators.macdHist[n] ?? 0;
        const prevHist = n > 0 ? (indicators.macdHist[n - 1] ?? 0) : 0;
        const histGrowing = Math.abs(histVal) > Math.abs(prevHist);
        const isBullCross = macdVal > signalVal;
        const histPositive = histVal >= 0;

        const last10Hist: HistoryPoint[] = indicators.macdHist
          .slice(Math.max(0, n - 9), n + 1)
          .map((v, i) => ({ index: i, value: v }));
        const maxHist = Math.max(...last10Hist.map(h => Math.abs(h.value)), 0.0001);

        return {
          currentValue: formatIndicatorValue(histVal, 4),
          signal: histPositive ? 'BULLISH' : 'BEARISH',
          signalColor: histPositive ? Colors.green : Colors.red,
          metrics: [
            { label: 'MACD Line', value: formatIndicatorValue(macdVal, 4), color: Colors.cyan },
            { label: 'Signal Line', value: formatIndicatorValue(signalVal, 4), color: Colors.amber },
            { label: 'Histogram', value: formatIndicatorValue(histVal, 4), color: histPositive ? Colors.green : Colors.red },
            { label: 'Crossover', value: isBullCross ? 'Bullish (MACD > Signal)' : 'Bearish (MACD < Signal)', color: isBullCross ? Colors.green : Colors.red },
            { label: 'Momentum', value: histGrowing ? 'Increasing' : 'Decreasing', color: histGrowing ? Colors.green : Colors.red },
          ],
          histogram: last10Hist,
          maxHist,
          interpretation: histPositive
            ? `MACD histogram is positive at ${formatIndicatorValue(histVal, 4)}, indicating bullish momentum. ${histGrowing ? 'Momentum is increasing — trend strengthening.' : 'Momentum is fading — watch for reversal.'} ${isBullCross ? 'MACD line is above signal, confirming buy bias.' : ''}`
            : `MACD histogram is negative at ${formatIndicatorValue(histVal, 4)}, indicating bearish momentum. ${histGrowing ? 'Selling pressure is increasing.' : 'Bearish momentum is weakening — possible reversal ahead.'} ${!isBullCross ? 'MACD line is below signal, confirming sell bias.' : ''}`,
        };
      }
      case 'cloud': {
        const isBull = indicators.cloudBull[n] ?? false;
        const shortEma = indicators.advShort[n] ?? 0;
        const longEma = indicators.advLong[n] ?? 0;
        const sma50 = indicators.advSma[n] ?? 0;
        const cloudSpread = shortEma - longEma;
        const priceVsSma = price - sma50;
        const isGolden = indicators.goldenCross[n] ?? false;
        const isDeath = indicators.deathCross[n] ?? false;

        return {
          currentValue: isBull ? 'BULL' : 'BEAR',
          signal: isBull ? 'BULLISH' : 'BEARISH',
          signalColor: isBull ? Colors.green : Colors.red,
          metrics: [
            { label: 'Cloud Status', value: isBull ? 'Bullish Cloud' : 'Bearish Cloud', color: isBull ? Colors.green : Colors.red },
            { label: 'EMA 9 (Short)', value: formatIndicatorValue(shortEma), color: Colors.cyan },
            { label: 'EMA 21 (Long)', value: formatIndicatorValue(longEma), color: Colors.pink },
            { label: 'SMA 50', value: formatIndicatorValue(sma50), color: Colors.amber },
            { label: 'Cloud Spread', value: `${cloudSpread >= 0 ? '+' : ''}${formatIndicatorValue(cloudSpread)}`, color: cloudSpread >= 0 ? Colors.green : Colors.red },
            { label: 'Price vs SMA 50', value: `${priceVsSma >= 0 ? '+' : ''}${formatIndicatorValue(priceVsSma)}`, color: priceVsSma >= 0 ? Colors.green : Colors.red },
            ...(isGolden ? [{ label: 'Signal', value: 'Golden Cross!', color: Colors.amber }] : []),
            ...(isDeath ? [{ label: 'Signal', value: 'Death Cross!', color: Colors.red }] : []),
          ],
          interpretation: isBull
            ? `Cloud analysis is bullish — EMA 9 is above EMA 21 with a spread of ${formatIndicatorValue(Math.abs(cloudSpread))}. ${priceVsSma >= 0 ? 'Price is also above SMA 50, confirming the uptrend.' : 'However, price is below SMA 50 — momentum may be limited.'} ${isGolden ? 'A Golden Cross just occurred — strong buy signal!' : ''}`
            : `Cloud analysis is bearish — EMA 9 is below EMA 21 with a spread of ${formatIndicatorValue(Math.abs(cloudSpread))}. ${priceVsSma < 0 ? 'Price is also below SMA 50, confirming the downtrend.' : 'Price remains above SMA 50 — the downtrend may be shallow.'} ${isDeath ? 'A Death Cross just occurred — strong sell signal!' : ''}`,
        };
      }
      default:
        return null;
    }
  }, [indicatorType, indicators, n, price, instrument, config.color]);

  const IconComponent = config.icon;

  return (
    <View style={detailStyles.container}>
      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={detailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={detailStyles.heroCard}>
            <View style={[detailStyles.heroIconWrap, { backgroundColor: config.color + '18' }]}>
              <IconComponent size={28} color={config.color} />
            </View>
            <Text style={[detailStyles.heroTitle, { color: config.color }]}>{config.title}</Text>
            <Text style={detailStyles.heroSubtitle}>{config.subtitle}</Text>
            <View style={detailStyles.heroValueRow}>
              <Text style={detailStyles.heroValue}>{details?.currentValue ?? '—'}</Text>
              {details && (
                <View style={[detailStyles.signalPill, { backgroundColor: details.signalColor + '18', borderColor: details.signalColor + '40' }]}>
                  {details.signal === 'BULLISH' ? (
                    <ArrowUpRight size={12} color={details.signalColor} />
                  ) : (
                    <ArrowDownRight size={12} color={details.signalColor} />
                  )}
                  <Text style={[detailStyles.signalText, { color: details.signalColor }]}>{details.signal}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={detailStyles.descCard}>
            <Text style={detailStyles.descTitle}>ABOUT THIS INDICATOR</Text>
            <Text style={detailStyles.descText}>{config.description}</Text>
          </View>

          {details && (
            <>
              <View style={detailStyles.metricsCard}>
                <Text style={detailStyles.metricsTitle}>KEY METRICS</Text>
                {details.metrics.map((m, i) => (
                  <MetricRow key={i} label={m.label} value={m.value} color={m.color} sub={'sub' in m ? (m as any).sub : undefined} />
                ))}
              </View>

              {indicatorType === 'macd' && 'histogram' in details && details.histogram && (
                <View style={detailStyles.histCard}>
                  <Text style={detailStyles.metricsTitle}>HISTOGRAM (LAST 10 BARS)</Text>
                  <View style={detailStyles.histBars}>
                    {(details.histogram as HistoryPoint[]).map((h, i) => (
                      <View key={i} style={detailStyles.histBarCol}>
                        <AnimatedBar
                          value={h.value}
                          maxVal={(details as any).maxHist}
                          color={h.value >= 0 ? Colors.green : Colors.red}
                          delay={i * 40}
                        />
                        <Text style={[detailStyles.histBarLabel, { color: h.value >= 0 ? Colors.green : Colors.red }]}>
                          {h.value >= 0 ? '+' : ''}{h.value.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={detailStyles.interpCard}>
                <Text style={detailStyles.interpTitle}>ANALYSIS</Text>
                <Text style={detailStyles.interpText}>{details.interpretation}</Text>
              </View>
            </>
          )}

          {!details && (
            <View style={detailStyles.noDataCard}>
              <Text style={detailStyles.noDataText}>No indicator data available. Ensure market data is loaded.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  signalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  descCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  descTitle: {
    fontSize: 9,
    color: Colors.text3,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  metricsCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 9,
    color: Colors.text3,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: '500' as const,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  metricSub: {
    fontSize: 10,
    color: Colors.text3,
    marginTop: 2,
  },
  histCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  histBars: {
    gap: 8,
  },
  histBarCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.bg3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  histBarLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    width: 48,
    textAlign: 'right' as const,
  },
  interpCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  interpTitle: {
    fontSize: 9,
    color: Colors.amber,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  interpText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  noDataCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    color: Colors.text2,
    textAlign: 'center',
  },
});
