import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import { Clock, ChevronDown, ChevronUp, Zap, Wifi, WifiOff, RefreshCw, Radio, ShieldCheck, ShieldAlert, Activity, Timer, TrendingUp, TrendingDown, ChevronRight, BarChart3, LineChart, Crosshair } from 'lucide-react-native';
import { Image } from 'react-native';

import { Colors, getAssetColor } from '@/constants/colors';
import { useMarketData } from '@/hooks/useMarketData';
import { useSubscription } from '@/hooks/useSubscription';
import { useTimeSync } from '@/hooks/useTimeSync';
import { SPECS } from '@/constants/instruments';
import { formatPrice, formatIndicatorValue } from '@/utils/calculations';
import { Haptics } from '@/utils/haptics';
import { Platform } from 'react-native';




function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.liveDot, { opacity }]} />
  );
}

function SignalBadge({ text, type }: { text: string; type: string }) {
  const bgColor =
    type === 'long' ? Colors.greenDim :
    type === 'short' ? Colors.redDim :
    type === 'fire' ? 'rgba(245,158,11,0.15)' :
    'rgba(255,255,255,0.04)';
  const textColor =
    type === 'long' ? Colors.green :
    type === 'short' ? Colors.red :
    type === 'fire' ? Colors.amber :
    Colors.text2;
  const borderColor =
    type === 'long' ? 'rgba(16,185,129,0.3)' :
    type === 'short' ? 'rgba(239,68,68,0.3)' :
    type === 'fire' ? 'rgba(245,158,11,0.4)' :
    Colors.border2;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

function OscillatorBar({ label, value, color }: { label: string; value: number; color: string }) {
  const barWidth = useRef(new Animated.Value(0)).current;
  const absVal = Math.min(Math.abs(value) * 100, 100);
  const isBull = value >= 0;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: absVal,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [absVal, barWidth]);

  return (
    <View style={styles.oscRow}>
      <View style={styles.oscLabelRow}>
        <View style={[styles.oscDot, { backgroundColor: color }]} />
        <Text style={styles.oscLabel} numberOfLines={1}>{label}</Text>
        <Text style={[styles.oscValue, { color: isBull ? Colors.green : Colors.red }]}>
          {value >= 0 ? '+' : ''}{formatIndicatorValue(value, 4)}
        </Text>
      </View>
      <View style={styles.oscTrack}>
        <View style={styles.oscCenter} />
        <Animated.View
          style={[
            styles.oscFill,
            {
              backgroundColor: isBull ? Colors.green : Colors.red,
              width: barWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '50%'],
              }),
              left: isBull ? '50%' : undefined,
              right: isBull ? undefined : '50%',
            },
          ]}
        />
      </View>
    </View>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
  return vol.toFixed(1);
}

function formatTradeTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const isSmall = screenWidth < 360;
  const isLarge = screenWidth >= 414;
  const {
    instrument,
    timeframe,
    price,
    priceChange,
    badges,
    compositeScore,
    compositeDesc,
    oscillatorData,
    indicators,
    candles,
    spec,
    liveMode,
    setLiveMode,
    canUseLive,
    dataSource,
    liveRefreshRate,
    setLiveRefreshRate,
    lastUpdated,
    apiHealth,
    connectionError,
    retryConnection,
    isConnecting,
    tickerData,
    recentTrades,
    wsConnected,
    setInstrument,
  } = useMarketData();

  const {
    syncedTime,
    offset,
    isSynced,
    lastSyncAt,
    syncSource,
    syncError,
    drift,
    resync,
  } = useTimeSync();


  const scoreAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    const pct = Math.min(Math.abs(compositeScore) / 8 * 100, 100);
    Animated.timing(scoreAnim, {
      toValue: pct,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [compositeScore, scoreAnim]);

  const { tier } = useSubscription();
  const assetColor = getAssetColor(instrument);
  const isBull = priceChange.change >= 0;

  const onTimeframePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impact('light');
    }
    navigate('timeframe-picker');
  }, [navigate]);

  const n = candles.length - 1;
  const ticksPerPoint = spec ? 1 / spec.tick : 0;
  const tenPtVal = spec ? (10 / spec.tick) * spec.tickVal : 0;

  const hPad = isSmall ? 12 : 16;
  const priceFontSize = isSmall ? 24 : isLarge ? 34 : 30;
  const symbolFontSize = isSmall ? 22 : isLarge ? 30 : 26;
  const scoreFontSize = isSmall ? 22 : isLarge ? 30 : 26;

  const isLiveConnected = canUseLive && liveMode && dataSource === 'live';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={[styles.appIcon, { width: isSmall ? 26 : 30, height: isSmall ? 26 : 30 }]}
          />
          <Text style={[styles.logo, { fontSize: isSmall ? 17 : 20 }]}>
            Emperial<Text style={styles.logoAccent}>Bot</Text>
          </Text>
          {tier === 'free' && (
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                navigate('paywall');
              }}
              style={styles.upgradeBtn}
            >
              <Zap size={9} color={Colors.bg0} />
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.headerRight, isLiveConnected ? styles.liveActive : null]}
          onPress={() => {
            if (canUseLive) {
              Haptics.impact('light');
              setLiveMode(!liveMode);
            }
          }}
        >
          {isLiveConnected ? (
            <>
              <PulsingDot />
              <Text style={styles.liveTextActive}>LIVE</Text>
              {wsConnected && <Activity size={10} color={Colors.green} />}
            </>
          ) : (
            <>
              <View style={styles.simDot} />
              <Text style={styles.liveText}>{canUseLive ? 'STANDBY' : 'OFFLINE'}</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.priceCard, { padding: isSmall ? 12 : 16 }]}>
          <View style={styles.priceTop}>
            <View style={styles.instrumentInfo}>
              <Text style={[styles.symbol, { color: assetColor, fontSize: symbolFontSize }]}>{instrument}</Text>
              <Text style={[styles.name, { fontSize: isSmall ? 11 : 13 }]}>{spec?.name ?? ''}</Text>
              <Text style={styles.exchange}>{spec?.exch ?? ''}</Text>
            </View>
            <Pressable onPress={onTimeframePress} style={styles.tfButton}>
              <Clock size={isSmall ? 10 : 12} color={Colors.text2} />
              <Text style={styles.tfText}>{timeframe.toUpperCase()}</Text>
              <ChevronDown size={isSmall ? 10 : 12} color={Colors.text2} />
            </Pressable>
          </View>

          <View style={styles.priceRow}>
            <Text
              style={[styles.priceValue, { color: assetColor, fontSize: priceFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatPrice(price)}
            </Text>
            <View style={[styles.changeBox, { backgroundColor: isBull ? Colors.greenDim : Colors.redDim }]}>
              <Text style={[styles.changeText, { color: isBull ? Colors.green : Colors.red, fontSize: isSmall ? 10 : 12 }]}>
                {isBull ? '+' : ''}{priceChange.change.toFixed(2)} ({isBull ? '+' : ''}{priceChange.percent.toFixed(2)}%)
              </Text>
            </View>
          </View>

          {isLiveConnected && tickerData && (
            <View style={styles.highLowRow}>
              <View style={styles.highLowItem}>
                <TrendingUp size={10} color={Colors.green} />
                <Text style={styles.highLowLabel}>24H HIGH</Text>
                <Text style={[styles.highLowValue, { color: Colors.green }]}>
                  ${tickerData.high24h.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.highLowDivider} />
              <View style={styles.highLowItem}>
                <TrendingDown size={10} color={Colors.red} />
                <Text style={styles.highLowLabel}>24H LOW</Text>
                <Text style={[styles.highLowValue, { color: Colors.red }]}>
                  ${tickerData.low24h.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}

        </View>

        <View style={styles.apiConnectedCard}>
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              resync();
            }}
            style={({ pressed }) => [styles.clockStrip, pressed && { opacity: 0.7 }]}
          >
            <Timer size={9} color={Colors.cyan} />
            <Text style={styles.clockStripTime}>
              {syncedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
            <View style={styles.clockStripDivider} />
            <Text style={styles.clockStripDate}>
              {syncedTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <View style={{ flex: 1 }} />
            <View style={[styles.clockStripSyncDot, { backgroundColor: isSynced ? Colors.green : Colors.red }]} />
            <Text style={[styles.clockStripSync, { color: isSynced ? Colors.green : Colors.red }]}>
              {isSynced ? 'SYNCED' : 'UNSYNC'}
            </Text>
            <Text style={styles.clockStripOffset}>{offset > 0 ? '+' : ''}{offset}ms</Text>
            <RefreshCw size={8} color={Colors.cyan} />
          </Pressable>

          <View style={styles.dataSourceDivider} />
          <View style={styles.dataSourceApiRow}>
            <View style={styles.dataSourceHeader}>
              <Radio size={12} color={dataSource === 'live' ? Colors.green : Colors.text2} />
              <Text style={styles.dataSourceTitle}>DATA SOURCE</Text>
            </View>
            <View style={styles.apiConnectedTop}>
              {apiHealth.isHealthy && isLiveConnected ? (
                <>
                  <ShieldCheck size={11} color={Colors.green} />
                  <Text style={styles.healthyText}>API Connected</Text>
                  {apiHealth.lastSuccessTime && (
                    <Text style={styles.healthyTime}>
                      {Math.round((Date.now() - apiHealth.lastSuccessTime) / 1000)}s ago
                    </Text>
                  )}
                </>
              ) : (connectionError || !apiHealth.isHealthy) && canUseLive && liveMode ? (
                <>
                  <ShieldAlert size={11} color={Colors.red} />
                  <Text style={[styles.healthyText, { color: Colors.red }]}>Connection Issue</Text>
                </>
              ) : (
                <>
                  <Radio size={11} color={Colors.text2} />
                  <Text style={[styles.healthyText, { color: Colors.text2 }]}>API Status</Text>
                </>
              )}
            </View>
          </View>

          {(connectionError || !apiHealth.isHealthy) && canUseLive && liveMode && (
            <View style={styles.healthErrorRow}>
              <Text style={styles.healthMessage}>
                {connectionError ?? `API degraded (${apiHealth.consecutiveFailures} failures)`}
              </Text>
              <View style={styles.healthActions}>
                <Pressable
                  onPress={() => {
                    Haptics.impact('medium');
                    retryConnection();
                  }}
                  style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
                >
                  <RefreshCw size={11} color={Colors.bg0} />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impact('light');
                    setLiveMode(false);
                  }}
                  style={({ pressed }) => [styles.fallbackBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.fallbackBtnText}>Use Cached</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.dataSourceDivider} />
          <View style={[styles.dataSourceRow, { gap: isSmall ? 6 : 8 }]}>
            <Pressable
              onPress={() => {
                Haptics.impact('medium');
                setLiveMode(false);
              }}
              style={[styles.dsOption, !liveMode && styles.dsOptionActive, { paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 8 : 10 }]}
            >
              <WifiOff size={isSmall ? 12 : 14} color={!liveMode ? Colors.amber : Colors.text2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dsOptionLabel, !liveMode && styles.dsOptionLabelActive]} numberOfLines={1}>Cached</Text>
                <Text style={styles.dsOptionDesc} numberOfLines={1}>Local data</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!canUseLive) return;
                Haptics.impact('medium');
                setLiveMode(true);
              }}
              style={[styles.dsOption, liveMode && canUseLive && styles.dsOptionActiveLive, !canUseLive && styles.dsOptionDisabled, { paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 8 : 10 }]}
            >
              <Wifi size={isSmall ? 12 : 14} color={liveMode && canUseLive ? Colors.green : !canUseLive ? Colors.text3 : Colors.text2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dsOptionLabel, liveMode && canUseLive && styles.dsOptionLabelLive, !canUseLive && { color: Colors.text3 }]} numberOfLines={1}>Live (Binance)</Text>
                <Text style={[styles.dsOptionDesc, !canUseLive && { color: Colors.text3 }]} numberOfLines={1}>
                  {!canUseLive ? 'Not available' : isConnecting ? 'Connecting...' : dataSource === 'live' ? (wsConnected ? 'Connected ✓' : 'Connected') : 'Real-time market'}
                </Text>
              </View>
            </Pressable>
          </View>
          {!canUseLive && (
            <Text style={styles.noLiveHint}>Switch to BTC, ETH, Gold, BNB or SOL for live Binance data</Text>
          )}

          <View style={styles.dataSourceDivider} />
          <View style={styles.externalSourcesHeader}>
            <Text style={styles.externalSourcesLabel}>EXTERNAL SOURCES</Text>
          </View>
          <View style={[styles.externalSourcesRow, { gap: isSmall ? 4 : 6 }]}>
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                navigate('tradingview-setup');
              }}
              style={({ pressed }) => [styles.extSourceChip, pressed && { opacity: 0.7 }]}
            >
              <BarChart3 size={12} color={Colors.cyan} />
              <Text style={styles.extSourceText}>TradingView</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                navigate('rithmic-setup');
              }}
              style={({ pressed }) => [styles.extSourceChip, pressed && { opacity: 0.7 }]}
            >
              <LineChart size={12} color={Colors.purple} />
              <Text style={styles.extSourceText}>R Pro Trader</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                navigate('ninjatrader-setup');
              }}
              style={({ pressed }) => [styles.extSourceChip, pressed && { opacity: 0.7 }]}
            >
              <Crosshair size={12} color={Colors.amber} />
              <Text style={styles.extSourceText}>NinjaTrader</Text>
            </Pressable>
          </View>

        </View>




        <View style={styles.signalSection}>
          <View style={styles.sectionHeader}>
            <Zap size={14} color={Colors.amber} />
            <Text style={styles.sectionTitle}>SIGNAL BADGES</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.badgeScroll, { marginHorizontal: -hPad, paddingHorizontal: hPad }]}>
            <View style={styles.badgeRow}>
              {badges.map((b, i) => (
                <SignalBadge key={`${b.text}-${i}`} text={b.text} type={b.type} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.scoreCard, { padding: isSmall ? 12 : 16 }]}>
          <Text style={styles.scoreLabel}>CONFLUENCE SCORE</Text>
          <View style={styles.scoreTrack}>
            <Animated.View
              style={[
                styles.scoreFill,
                {
                  backgroundColor: compositeScore > 0 ? Colors.green : Colors.red,
                  width: scoreAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.scoreRow}>
            <Text
              style={[
                styles.scoreNum,
                {
                  fontSize: scoreFontSize,
                  color:
                    compositeScore > 2 ? Colors.green :
                    compositeScore < -2 ? Colors.red :
                    Colors.text2,
                },
              ]}
            >
              {compositeScore > 0 ? '+' : ''}{compositeScore.toFixed(1)}
            </Text>
            <Text style={styles.scoreDesc}>{compositeDesc}</Text>
          </View>
        </View>

        <View style={styles.oscSection}>
          <Text style={styles.sectionTitle}>OSCILLATORS</Text>
          <View style={[styles.oscCard, { padding: isSmall ? 10 : 14 }]}>
            <OscillatorBar label="Market Pressure" value={oscillatorData.mp} color={Colors.purple} />
            <OscillatorBar label="Refined (EMA)" value={oscillatorData.rmp} color={Colors.pink} />
            <OscillatorBar label="Simple (SMA)" value={oscillatorData.mps} color={Colors.cyan} />
          </View>
        </View>

        {indicators && n >= 0 && (
          <View style={styles.quickStats}>
            <Text style={styles.quickStatsTitle}>QUICK STATS</Text>
            <View style={styles.statsGrid}>
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  navigate('indicator-detail', { type: 'ema200' });
                }}
                style={({ pressed }) => [styles.statCard, { minWidth: (screenWidth - hPad * 2 - 8) / 2 - 1, padding: isSmall ? 10 : 12, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabel}>EMA 200</Text>
                  <ChevronRight size={10} color={Colors.text3} />
                </View>
                <Text style={[styles.statValue, { color: (indicators.ema200[n] ?? 0) < price ? Colors.green : Colors.red }]}>
                  {formatIndicatorValue(indicators.ema200[n])}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  navigate('indicator-detail', { type: 'ema21' });
                }}
                style={({ pressed }) => [styles.statCard, { minWidth: (screenWidth - hPad * 2 - 8) / 2 - 1, padding: isSmall ? 10 : 12, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabel}>EMA 21</Text>
                  <ChevronRight size={10} color={Colors.text3} />
                </View>
                <Text style={[styles.statValue, { color: (indicators.ema21[n] ?? 0) < price ? Colors.green : Colors.red }]}>
                  {formatIndicatorValue(indicators.ema21[n])}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  navigate('indicator-detail', { type: 'macd' });
                }}
                style={({ pressed }) => [styles.statCard, { minWidth: (screenWidth - hPad * 2 - 8) / 2 - 1, padding: isSmall ? 10 : 12, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabel}>MACD</Text>
                  <ChevronRight size={10} color={Colors.text3} />
                </View>
                <Text style={[styles.statValue, { color: (indicators.macdHist[n] ?? 0) >= 0 ? Colors.green : Colors.red }]}>
                  {formatIndicatorValue(indicators.macdHist[n], 4)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  navigate('indicator-detail', { type: 'cloud' });
                }}
                style={({ pressed }) => [styles.statCard, { minWidth: (screenWidth - hPad * 2 - 8) / 2 - 1, padding: isSmall ? 10 : 12, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabel}>Cloud</Text>
                  <ChevronRight size={10} color={Colors.text3} />
                </View>
                <Text style={[styles.statValue, { color: indicators.cloudBull[n] ? Colors.green : Colors.red }]}>
                  {indicators.cloudBull[n] ? 'BULL' : 'BEAR'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 8,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.amber,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  upgradeBtnText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  appIcon: {
    borderRadius: 7,
  },
  logo: {
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: Colors.amber,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.green,
  },
  liveActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  liveTextActive: {
    fontSize: 10,
    color: Colors.green,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  liveText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
  },
  simDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.text2,
  },
  dataSourceCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  dataSourceApiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dataSourceTitle: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  dataSourceRow: {
    flexDirection: 'row',
  },
  dsOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg2,
  },
  dsOptionActive: {
    borderColor: Colors.amber + '50',
    backgroundColor: 'rgba(245,158,11,0.06)',
  },
  dsOptionActiveLive: {
    borderColor: 'rgba(16,185,129,0.4)',
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  dsOptionDisabled: {
    opacity: 0.45,
  },
  dsOptionLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  dsOptionLabelActive: {
    color: Colors.amber,
  },
  dsOptionLabelLive: {
    color: Colors.green,
  },
  dsOptionDesc: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 1,
  },
  wsStatusRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  wsStatusText: {
    fontSize: 10,
    color: Colors.green,
    fontStyle: 'italic' as const,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  refreshLabel: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  refreshChips: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 1,
  },
  refreshChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshChipActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.35)',
  },
  refreshChipText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  refreshChipTextActive: {
    color: Colors.green,
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 'auto' as const,
  },
  noLiveHint: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  priceCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  priceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instrumentInfo: {
    flex: 1,
    marginRight: 8,
  },
  symbol: {
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  name: {
    color: '#FFFFFF',
    marginTop: 2,
  },
  exchange: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.bg2,
    flexShrink: 0,
  },
  tfText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  priceValue: {
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  changeBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  changeText: {
    fontWeight: '600' as const,
  },
  contractStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 10,
  },
  contractItem: {
    flex: 1,
    alignItems: 'center',
  },
  contractLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  contractValue: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  contractDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  highLowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 10,
  },
  highLowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  highLowLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  highLowValue: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  highLowDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  tradesCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  tradesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradesToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradesCount: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  tradesTitle: {
    fontSize: 10,
    color: '#D4A017',
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  tradesHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tradesHeaderText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tradePrice: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tradeQty: {
    flex: 1,
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  tradeTime: {
    flex: 1,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'right' as const,
  },
  signalSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  badgeScroll: {},
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  scoreCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  scoreNum: {
    fontWeight: '800' as const,
  },
  scoreDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  oscSection: {
    marginBottom: 12,
  },
  oscCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  oscRow: {
    gap: 6,
  },
  oscLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oscDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  oscLabel: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '500' as const,
    flex: 1,
  },
  oscValue: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  oscTrack: {
    height: 4,
    backgroundColor: Colors.bg3,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  oscCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border2,
  },
  oscFill: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: 2,
  },
  quickStats: {
    marginBottom: 12,
  },
  quickStatsTitle: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  healthCard: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 12,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  healthTitle: {
    fontSize: 10,
    color: Colors.red,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  healthMessage: {
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  healthActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  fallbackBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.bg2,
  },
  fallbackBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  apiConnectedCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 8,
  },
  dataSourceDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  healthErrorRow: {
    gap: 8,
  },
  apiConnectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apiRefreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,185,129,0.12)',
    flexWrap: 'wrap',
  },
  healthyText: {
    fontSize: 10,
    color: Colors.green,
    fontWeight: '600' as const,
  },
  healthyTime: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 'auto' as const,
  },
  clockStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bg2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clockStripTime: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
    fontVariant: ['tabular-nums'] as any,
  },
  clockStripDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.border2,
  },
  clockStripDate: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  clockStripSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  clockStripSync: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  clockStripOffset: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  externalSourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  externalSourcesLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    letterSpacing: 0.8,
  },
  externalSourcesRow: {
    flexDirection: 'row',
  },
  extSourceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg2,
  },
  extSourceText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
