import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useMarketData } from '@/hooks/useMarketData';
import { formatIndicatorValue } from '@/utils/calculations';
import { INDICATOR_SETTINGS } from '@/constants/indicatorSettings';
import ScalableChart from '@/components/ScalableChart';
import { Eye, EyeOff, Settings, RotateCcw, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

interface IndicatorRow {
  label: string;
  value: string;
  color: 'bull' | 'bear' | 'neutral' | '';
}

interface ChartLineData {
  data: number[];
  color: string;
  label: string;
  dashed?: boolean;
}

function ParamStepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
  isSmall,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  isSmall: boolean;
}) {
  const dec = useCallback(() => {
    const next = Math.max(min, parseFloat((value - step).toFixed(4)));
    Haptics.impact('light');
    onChange(next);
  }, [value, min, step, onChange]);

  const inc = useCallback(() => {
    const next = Math.min(max, parseFloat((value + step).toFixed(4)));
    Haptics.impact('light');
    onChange(next);
  }, [value, max, step, onChange]);

  const displayVal = step < 1 ? value.toFixed(step < 0.1 ? 3 : 1) : value.toString();

  return (
    <View style={styles.paramRow}>
      <Text style={[styles.paramLabel, { fontSize: isSmall ? 10 : 11 }]} numberOfLines={1}>{label}</Text>
      <View style={styles.paramControls}>
        <Pressable
          onPress={dec}
          style={({ pressed }) => [styles.paramBtn, { width: isSmall ? 24 : 26, height: isSmall ? 24 : 26 }, pressed && styles.paramBtnPressed]}
          hitSlop={4}
        >
          <Minus size={isSmall ? 10 : 12} color={Colors.text} />
        </Pressable>
        <View style={[styles.paramValueBox, { minWidth: isSmall ? 38 : 48 }]}>
          <Text style={[styles.paramValue, { fontSize: isSmall ? 10 : 11 }]}>{displayVal}</Text>
        </View>
        <Pressable
          onPress={inc}
          style={({ pressed }) => [styles.paramBtn, { width: isSmall ? 24 : 26, height: isSmall ? 24 : 26 }, pressed && styles.paramBtnPressed]}
          hitSlop={4}
        >
          <Plus size={isSmall ? 10 : 12} color={Colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function IndicatorCard({
  id,
  name,
  color,
  rows,
  isOn,
  onToggle,
  chartLines,
  candles,
  chartWidth,
  isSmall,
}: {
  id: string;
  name: string;
  color: string;
  rows: IndicatorRow[];
  isOn: boolean;
  onToggle: () => void;
  chartLines: ChartLineData[];
  candles: { o: number; h: number; l: number; c: number }[];
  chartWidth: number;
  isSmall: boolean;
}) {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);
  const { indicatorSettings, updateIndicatorSetting, resetIndicatorSettings } = useMarketData();

  const settingsDef = useMemo(
    () => INDICATOR_SETTINGS.find((s) => s.id === id),
    [id]
  );

  const toggleSettings = useCallback(() => {
    Haptics.impact('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSettings((p) => !p);
  }, []);

  const toggleChart = useCallback(() => {
    Haptics.impact('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowChart((p) => !p);
  }, []);

  const handleReset = useCallback(() => {
    Haptics.impact('medium');
    resetIndicatorSettings(id);
  }, [id, resetIndicatorSettings]);

  const currentSettings = indicatorSettings[id] ?? {};
  const chartH = isSmall ? 110 : 140;

  const glowBg = `${color}08`;
  const glowBorder = `${color}25`;
  const glowAccent = `${color}15`;

  return (
    <View style={[styles.card, { borderLeftColor: isOn ? color : Colors.border, borderLeftWidth: 3, opacity: isOn ? 1 : 0.4, padding: isSmall ? 10 : 14 }]}>
      {isOn && (
        <View style={[styles.cardGlowOverlay, { backgroundColor: glowBg }]} />
      )}
      <View style={styles.cardHeader}>
        <View style={styles.swatchContainer}>
          {isOn && <View style={[styles.swatchGlow, { backgroundColor: `${color}30` }]} />}
          <View style={[styles.swatch, { backgroundColor: color }]} />
        </View>
        <Text style={[styles.cardTitle, { color: isOn ? color : Colors.text3, fontSize: isSmall ? 11 : 12 }]} numberOfLines={1}>{name}</Text>
        <View style={styles.cardActions}>
          {isOn && (
            <>
              <Pressable onPress={toggleChart} hitSlop={6} style={styles.actionBtn}>
                {showChart ? (
                  <ChevronUp size={13} color={Colors.text2} />
                ) : (
                  <ChevronDown size={13} color={Colors.text2} />
                )}
              </Pressable>
              <Pressable onPress={toggleSettings} hitSlop={6} style={styles.actionBtn}>
                <Settings size={13} color={showSettings ? Colors.amber : Colors.text2} />
              </Pressable>
            </>
          )}
          <Pressable
            onPress={() => {
              Haptics.impact('light');
              onToggle();
            }}
            hitSlop={8}
            style={styles.actionBtn}
          >
            {isOn ? (
              <Eye size={14} color={Colors.text2} />
            ) : (
              <EyeOff size={14} color={Colors.text3} />
            )}
          </Pressable>
        </View>
      </View>

      {isOn && showChart && (
        <View style={[styles.chartContainer, { borderColor: glowBorder }]}>
          <ScalableChart
            candles={candles}
            lines={chartLines}
            width={chartWidth}
            height={chartH}
            showCandles={true}
          />
          <Text style={styles.chartHint}>Pinch to zoom · Drag to pan</Text>
        </View>
      )}

      {isOn && showSettings && settingsDef && (
        <View style={[styles.settingsPanel, { padding: isSmall ? 8 : 10, borderColor: glowBorder }]}>
          <View style={styles.settingsHeader}>
            <View style={styles.settingsTitleRow}>
              <View style={[styles.settingsDot, { backgroundColor: color }]} />
              <Text style={[styles.settingsTitle, { color: `${color}CC` }]}>PARAMETERS</Text>
            </View>
            <Pressable onPress={handleReset} hitSlop={8} style={styles.resetBtn}>
              <RotateCcw size={11} color={Colors.amber} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
          {settingsDef.params.map((p) => (
            <ParamStepper
              key={p.key}
              label={p.label}
              value={currentSettings[p.key] ?? p.defaultValue}
              min={p.min}
              max={p.max}
              step={p.step}
              onChange={(v) => updateIndicatorSetting(id, p.key, v)}
              isSmall={isSmall}
            />
          ))}
        </View>
      )}

      {isOn && rows.map((row, i) => (
        <View key={i} style={styles.kvRow}>
          <Text style={[styles.kvLabel, { fontSize: isSmall ? 10 : 11 }]} numberOfLines={1}>{row.label}</Text>
          <View style={styles.kvValueContainer}>
            {(row.color === 'bull' || row.color === 'bear') && (
              <View style={[
                styles.kvGlowDot,
                { backgroundColor: row.color === 'bull' ? Colors.glowGreen : Colors.glowRed },
              ]} />
            )}
            <Text
              style={[
                styles.kvValue,
                { fontSize: isSmall ? 10 : 11 },
                row.color === 'bull' && { color: Colors.green },
                row.color === 'bear' && { color: Colors.red },
                row.color === 'neutral' && { color: Colors.amber },
              ]}
              numberOfLines={1}
            >
              {row.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function IndicatorsScreen() {
  const insets = useSafeAreaInsets();
  const { indicators, candles, indicatorToggles, toggleIndicator, indicatorSettings } = useMarketData();
  const { width: screenWidth } = useWindowDimensions();
  const isSmall = screenWidth < 360;
  const hPad = isSmall ? 12 : 16;
  const borderLeftWidth = 3;
  const cardPad = isSmall ? 10 : 14;

  const chartWidth = screenWidth - hPad * 2 - borderLeftWidth - cardPad * 2;

  const n = candles.length - 1;
  const ind = indicators;

  const fmt = useCallback((v: number, dp: number = 2) => formatIndicatorValue(v, dp), []);

  const getSettingVal = useCallback(
    (indId: string, key: string, fallback: number) => {
      return indicatorSettings[indId]?.[key] ?? fallback;
    },
    [indicatorSettings]
  );

  const sections = useMemo(() => {
    if (!ind || n < 0) return [];

    const shortP = getSettingVal('ema_cross', 'shortPeriod', 5);
    const longP = getSettingVal('ema_cross', 'longPeriod', 32);
    const stopPct = getSettingVal('ema_cross', 'stopPct', 5.5);
    const takePct = getSettingVal('ema_cross', 'takePct', 11);

    const steppedP = getSettingVal('stepped_ema', 'period', 14);

    const mpShort = getSettingVal('mp_v1', 'shortPeriod', 14);
    const mpLong = getSettingVal('mp_v1', 'longPeriod', 28);

    const combShort = getSettingVal('combined', 'shortPeriod', 9);
    const combLong = getSettingVal('combined', 'longPeriod', 21);
    const combAtr = getSettingVal('combined', 'atrPeriod', 14);
    const tp1M = getSettingVal('combined', 'tp1Mult', 2);
    const tp2M = getSettingVal('combined', 'tp2Mult', 3);
    const tp3M = getSettingVal('combined', 'tp3Mult', 4);
    const slM = getSettingVal('combined', 'slMult', 1.5);

    const rmpSmooth = getSettingVal('refined_mp', 'smoothPeriod', 10);

    const cloudShort = getSettingVal('cloud', 'shortPeriod', 9);
    const cloudLong = getSettingVal('cloud', 'longPeriod', 21);
    const cloudSma = getSettingVal('cloud', 'smaPeriod', 50);

    const fibLook = getSettingVal('fib', 'lookback', 100);

    const mpsP = getSettingVal('mps', 'smaPeriod', 5);

    return [
      {
        id: 'ema_cross',
        name: `1. EMA Crossover (${shortP}/${longP})`,
        color: '#38bdf8',
        rows: [
          { label: `EMA ${shortP}`, value: fmt(ind.emaShort[n]), color: (ind.emaShort[n] ?? 0) > (ind.emaLong[n] ?? 0) ? 'bull' as const : 'bear' as const },
          { label: `EMA ${longP}`, value: fmt(ind.emaLong[n]), color: '' as const },
          { label: 'Cross Long', value: ind.emaCrossLong[n] ? 'YES' : '\u2014', color: ind.emaCrossLong[n] ? 'bull' as const : '' as const },
          { label: 'Cross Short', value: ind.emaCrossShort[n] ? 'YES' : '\u2014', color: ind.emaCrossShort[n] ? 'bear' as const : '' as const },
          { label: 'Stop %', value: `${stopPct}%`, color: 'neutral' as const },
          { label: 'Take %', value: `${takePct}%`, color: 'neutral' as const },
        ],
        chartLines: [
          { data: ind.emaShort, color: '#38bdf8', label: `EMA ${shortP}` },
          { data: ind.emaLong, color: '#94a3b8', label: `EMA ${longP}`, dashed: true },
        ],
      },
      {
        id: 'stepped_ema',
        name: `2. Stepped EMA (${steppedP})`,
        color: '#f59e0b',
        rows: [
          { label: 'EMA Raw', value: fmt(ind.emaRaw[n]), color: '' as const },
          { label: 'EMA Stepped', value: fmt(ind.emaStepped[n]), color: '' as const },
          { label: 'Cross Up', value: ind.steppedCrossUp[n] ? 'YES' : '\u2014', color: ind.steppedCrossUp[n] ? 'bull' as const : '' as const },
          { label: 'Cross Down', value: ind.steppedCrossDown[n] ? 'YES' : '\u2014', color: ind.steppedCrossDown[n] ? 'bear' as const : '' as const },
        ],
        chartLines: [
          { data: ind.emaRaw, color: '#f59e0b', label: 'EMA Raw' },
          { data: ind.emaStepped, color: '#fbbf24', label: 'Stepped', dashed: true },
        ],
      },
      {
        id: 'mp_v1',
        name: `3. Market Pressure (${mpShort}/${mpLong})`,
        color: '#a78bfa',
        rows: [
          { label: 'Pressure', value: fmt(ind.marketPressure[n], 3), color: ind.marketPressure[n] > 0 ? 'bull' as const : 'bear' as const },
          { label: 'Sig Strength', value: fmt(Math.max(0, ind.marketPressure[n]), 3), color: ind.marketPressure[n] > 0 ? 'bull' as const : 'neutral' as const },
        ],
        chartLines: [
          { data: ind.marketPressure, color: '#a78bfa', label: 'Pressure' },
        ],
      },
      {
        id: 'combined',
        name: `4. ATR Strategy (${combShort}/${combLong})`,
        color: '#fb923c',
        rows: [
          { label: 'MA Short', value: fmt(ind.combShort[n]), color: (ind.combShort[n] ?? 0) > (ind.combLong[n] ?? 0) ? 'bull' as const : 'bear' as const },
          { label: 'MA Long', value: fmt(ind.combLong[n]), color: '' as const },
          { label: `ATR(${combAtr})`, value: fmt(ind.atrVals[n]), color: 'neutral' as const },
          { label: 'Buy Signal', value: ind.combBuy[n] ? 'YES' : '\u2014', color: ind.combBuy[n] ? 'bull' as const : '' as const },
          { label: `TP1 (${tp1M}\u00d7ATR)`, value: fmt(ind.combTP1[n]), color: 'bull' as const },
          { label: `TP2 (${tp2M}\u00d7ATR)`, value: fmt(ind.combTP2[n]), color: 'bull' as const },
          { label: `TP3 (${tp3M}\u00d7ATR)`, value: fmt(ind.combTP3[n]), color: 'bull' as const },
          { label: `SL (${slM}\u00d7ATR)`, value: fmt(ind.combSL[n]), color: 'bear' as const },
        ],
        chartLines: [
          { data: ind.combShort, color: '#fb923c', label: 'MA Short' },
          { data: ind.combLong, color: '#fdba74', label: 'MA Long', dashed: true },
        ],
      },
      {
        id: 'refined_mp',
        name: `5. Refined Pressure (EMA ${rmpSmooth})`,
        color: '#f472b6',
        rows: [
          { label: 'Smoothed', value: fmt(ind.rmpSmoothed[n], 4), color: ind.rmpSmoothed[n] > 0 ? 'bull' as const : 'bear' as const },
          { label: 'Buy Cross', value: ind.rmpBuy[n] ? 'YES' : '\u2014', color: ind.rmpBuy[n] ? 'bull' as const : '' as const },
          { label: 'Sell Cross', value: ind.rmpSell[n] ? 'YES' : '\u2014', color: ind.rmpSell[n] ? 'bear' as const : '' as const },
        ],
        chartLines: [
          { data: ind.rmpSmoothed, color: '#f472b6', label: 'Smoothed' },
        ],
      },
      {
        id: 'cloud',
        name: `6. Cloud + Pivots (${cloudShort}/${cloudLong})`,
        color: '#4ade80',
        rows: [
          { label: `EMA ${cloudShort}`, value: fmt(ind.advShort[n]), color: ind.cloudBull[n] ? 'bull' as const : 'bear' as const },
          { label: `EMA ${cloudLong}`, value: fmt(ind.advLong[n]), color: '' as const },
          { label: `SMA ${cloudSma}`, value: fmt(ind.advSma[n]), color: '' as const },
          { label: 'Cloud', value: ind.cloudBull[n] ? 'BULLISH' : 'BEARISH', color: ind.cloudBull[n] ? 'bull' as const : 'bear' as const },
          { label: 'Golden Cross', value: ind.goldenCross[n] ? 'YES' : '\u2014', color: ind.goldenCross[n] ? 'bull' as const : '' as const },
          { label: 'Death Cross', value: ind.deathCross[n] ? 'YES' : '\u2014', color: ind.deathCross[n] ? 'bear' as const : '' as const },
        ],
        chartLines: [
          { data: ind.advShort, color: '#4ade80', label: `EMA ${cloudShort}` },
          { data: ind.advLong, color: '#86efac', label: `EMA ${cloudLong}`, dashed: true },
          { data: ind.advSma, color: '#fde68a', label: `SMA ${cloudSma}`, dashed: true },
        ],
      },
      {
        id: 'fib',
        name: `7. Fibonacci (${fibLook}-bar)`,
        color: '#fde68a',
        rows: [
          { label: 'Range High', value: fmt(ind.fibHigh[n]), color: '' as const },
          { label: 'Range Low', value: fmt(ind.fibLow[n]), color: '' as const },
          { label: '0.236', value: fmt(ind.fib236[n]), color: candles[n].c > ind.fib236[n] ? 'bull' as const : 'bear' as const },
          { label: '0.382', value: fmt(ind.fib382[n]), color: candles[n].c > ind.fib382[n] ? 'bull' as const : 'bear' as const },
          { label: '0.500', value: fmt(ind.fib500[n]), color: candles[n].c > ind.fib500[n] ? 'bull' as const : 'bear' as const },
          { label: '0.618', value: fmt(ind.fib618[n]), color: candles[n].c > ind.fib618[n] ? 'bull' as const : 'bear' as const },
          { label: '0.786', value: fmt(ind.fib786[n]), color: candles[n].c > ind.fib786[n] ? 'bull' as const : 'bear' as const },
        ],
        chartLines: [
          { data: ind.fib236, color: '#fde68a', label: '0.236', dashed: true },
          { data: ind.fib382, color: '#fbbf24', label: '0.382', dashed: true },
          { data: ind.fib500, color: '#f59e0b', label: '0.500' },
          { data: ind.fib618, color: '#d97706', label: '0.618', dashed: true },
          { data: ind.fib786, color: '#b45309', label: '0.786', dashed: true },
        ],
      },
      {
        id: 'mps',
        name: `8. Pressure Simple (SMA ${mpsP})`,
        color: '#67e8f9',
        rows: [
          { label: 'SMA Pressure', value: fmt(ind.mpsSmoothed[n], 4), color: ind.mpsSmoothed[n] > 0 ? 'bull' as const : 'bear' as const },
          { label: 'Zone', value: ind.mpsSmoothed[n] > 0 ? 'BULLISH BG' : 'BEARISH BG', color: ind.mpsSmoothed[n] > 0 ? 'bull' as const : 'bear' as const },
        ],
        chartLines: [
          { data: ind.mpsSmoothed, color: '#67e8f9', label: 'SMA Pressure' },
        ],
      },
    ];
  }, [ind, n, candles, fmt, getSettingVal, indicatorSettings]);

  if (!ind || n < 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: hPad }]}>
          <Text style={[styles.headerTitle, { fontSize: isSmall ? 16 : 18 }]}>Indicator Readings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating indicators...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={[styles.headerTitle, { fontSize: isSmall ? 16 : 18 }]}>Indicator Readings</Text>
        <Text style={styles.headerSubtitle}>8 indicators · tap gear for settings · tap arrow for chart</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s) => (
          <IndicatorCard
            key={s.id}
            id={s.id}
            name={s.name}
            color={s.color}
            rows={s.rows}
            isOn={indicatorToggles[s.id] ?? true}
            onToggle={() => toggleIndicator(s.id)}
            chartLines={s.chartLines}
            candles={candles}
            chartWidth={chartWidth}
            isSmall={isSmall}
          />
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
    paddingVertical: 14,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.amber + '18',
  },
  headerTitle: {
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text3,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text2,
    fontSize: 13,
  },
  card: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  swatchContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  swatchGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  cardTitle: {
    fontWeight: '700' as const,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  actionBtn: {
    padding: 2,
  },
  chartContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  chartHint: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  settingsPanel: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  settingsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  settingsTitle: {
    fontSize: 11,
    color: Colors.text3,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  resetText: {
    fontSize: 11,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  paramLabel: {
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
    marginRight: 8,
  },
  paramControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  paramBtn: {
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  paramBtnPressed: {
    backgroundColor: Colors.border2,
    borderColor: Colors.amber + '40',
  },
  paramValueBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.bg0,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paramValue: {
    color: Colors.amber,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'],
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(19,32,48,0.6)',
  },
  kvLabel: {
    color: Colors.text2,
    flex: 1,
    marginRight: 8,
  },
  kvValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  kvGlowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  kvValue: {
    fontWeight: '600' as const,
    color: Colors.text,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
});
