import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { Haptics } from '@/utils/haptics';
import {
  ShieldAlert,
  TrendingDown,
  Target,
  ChevronDown,
  ChevronUp,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export interface TradingLevel {
  enabled: boolean;
  price: number;
}

export interface TradingLevelsData {
  entry: number;
  stopLoss: TradingLevel;
  trailingStop: TradingLevel;
  tp1: TradingLevel;
  tp2: TradingLevel;
  tp3: TradingLevel;
}

export const DEFAULT_LEVELS: TradingLevelsData = {
  entry: 0,
  stopLoss: { enabled: false, price: 0 },
  trailingStop: { enabled: false, price: 0 },
  tp1: { enabled: false, price: 0 },
  tp2: { enabled: false, price: 0 },
  tp3: { enabled: false, price: 0 },
};

interface Props {
  levels: TradingLevelsData;
  onLevelsChange: (levels: TradingLevelsData) => void;
  currentPrice: number;
  alwaysExpanded?: boolean;
}

const SL_COLOR = '#ef4444';
const TS_COLOR = '#f97316';
const TP1_COLOR = '#22c55e';
const TP2_COLOR = '#14b8a6';
const TP3_COLOR = '#06b6d4';
const ENTRY_COLOR = '#eab308';

function TradingLevelsPanel({ levels, onLevelsChange, currentPrice, alwaysExpanded = false }: Props) {
  const [expanded, setExpanded] = useState<boolean>(alwaysExpanded);

  const haptic = useCallback(() => {
    Haptics.impact('light');
  }, []);

  const toggleExpand = useCallback(() => {
    haptic();
    setExpanded((p) => !p);
  }, [haptic]);

  const setEntry = useCallback(() => {
    haptic();
    const newLevels = { ...levels, entry: currentPrice };
    if (!levels.stopLoss.enabled && levels.stopLoss.price === 0) {
      newLevels.stopLoss = { enabled: true, price: Math.round(currentPrice * 0.98 * 100) / 100 };
    }
    if (!levels.tp1.enabled && levels.tp1.price === 0) {
      newLevels.tp1 = { enabled: true, price: Math.round(currentPrice * 1.02 * 100) / 100 };
    }
    if (!levels.tp2.enabled && levels.tp2.price === 0) {
      newLevels.tp2 = { enabled: true, price: Math.round(currentPrice * 1.04 * 100) / 100 };
    }
    if (!levels.tp3.enabled && levels.tp3.price === 0) {
      newLevels.tp3 = { enabled: true, price: Math.round(currentPrice * 1.06 * 100) / 100 };
    }
    if (!levels.trailingStop.enabled && levels.trailingStop.price === 0) {
      newLevels.trailingStop = { enabled: false, price: Math.round(currentPrice * 0.015 * 100) / 100 };
    }
    onLevelsChange(newLevels);
  }, [haptic, levels, currentPrice, onLevelsChange]);

  const toggleLevel = useCallback(
    (key: 'stopLoss' | 'trailingStop' | 'tp1' | 'tp2' | 'tp3') => {
      haptic();
      onLevelsChange({
        ...levels,
        [key]: { ...levels[key], enabled: !levels[key].enabled },
      });
    },
    [haptic, levels, onLevelsChange],
  );

  const updatePrice = useCallback(
    (key: 'stopLoss' | 'trailingStop' | 'tp1' | 'tp2' | 'tp3', val: string) => {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onLevelsChange({
          ...levels,
          [key]: { ...levels[key], price: num },
        });
      }
    },
    [levels, onLevelsChange],
  );

  const clearAll = useCallback(() => {
    haptic();
    onLevelsChange(DEFAULT_LEVELS);
  }, [haptic, onLevelsChange]);

  const anyActive = levels.stopLoss.enabled || levels.trailingStop.enabled ||
    levels.tp1.enabled || levels.tp2.enabled || levels.tp3.enabled;

  const activeCount = [
    levels.stopLoss.enabled,
    levels.trailingStop.enabled,
    levels.tp1.enabled,
    levels.tp2.enabled,
    levels.tp3.enabled,
  ].filter(Boolean).length;

  const calcPnl = (target: number): string => {
    if (levels.entry === 0) return '--';
    const pct = ((target - levels.entry) / levels.entry) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  };

  const renderRow = (
    key: 'stopLoss' | 'trailingStop' | 'tp1' | 'tp2' | 'tp3',
    label: string,
    color: string,
    icon: React.ReactNode,
    isTrailing?: boolean,
  ) => {
    const level = levels[key];
    return (
      <View style={styles.levelRow} key={key}>
        <Pressable onPress={() => toggleLevel(key)} style={styles.toggleArea}>
          {level.enabled ? (
            <ToggleRight size={18} color={color} />
          ) : (
            <ToggleLeft size={18} color={Colors.text3} />
          )}
        </Pressable>
        <View style={[styles.levelIcon, { backgroundColor: color + '18' }]}>
          {icon}
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelLabel, { color: level.enabled ? color : Colors.text3 }]}>
            {label}
          </Text>
          {isTrailing && (
            <Text style={styles.trailingHint}>offset</Text>
          )}
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            style={[
              styles.priceInput,
              { borderColor: level.enabled ? color + '40' : Colors.border },
            ]}
            value={level.price > 0 ? level.price.toString() : ''}
            onChangeText={(v) => updatePrice(key, v)}
            placeholder="0.00"
            placeholderTextColor={Colors.text3}
            keyboardType="decimal-pad"
            editable={level.enabled}
          />
        </View>
        {!isTrailing && level.enabled && levels.entry > 0 && (
          <Text
            style={[
              styles.pnlText,
              {
                color:
                  level.price >= levels.entry ? Colors.green : Colors.red,
              },
            ]}
          >
            {calcPnl(level.price)}
          </Text>
        )}
      </View>
    );
  };

  const isExpanded = alwaysExpanded || expanded;

  return (
    <View style={styles.container}>
      {!alwaysExpanded && (
        <Pressable onPress={toggleExpand} style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Target size={12} color={Colors.amber} />
            <Text style={styles.headerTitle}>Trade Levels</Text>
            {anyActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {levels.entry > 0 && (
              <Text style={styles.entryPreview}>
                Entry: {levels.entry.toLocaleString()}
              </Text>
            )}
            {isExpanded ? (
              <ChevronUp size={14} color={Colors.text2} />
            ) : (
              <ChevronDown size={14} color={Colors.text2} />
            )}
          </View>
        </Pressable>
      )}

      {isExpanded && (
        <View style={styles.body}>
          <View style={styles.entryRow}>
            <Pressable onPress={setEntry} style={styles.setEntryBtn}>
              <Text style={styles.setEntryText}>
                {levels.entry > 0 ? 'Update Entry' : 'Set Entry'} @ {currentPrice.toLocaleString()}
              </Text>
            </Pressable>
            {levels.entry > 0 && (
              <Pressable onPress={clearAll} style={styles.clearBtn}>
                <X size={12} color={Colors.red} />
              </Pressable>
            )}
          </View>

          {levels.entry > 0 && (
            <View style={styles.entryDisplay}>
              <View style={[styles.entryDot, { backgroundColor: ENTRY_COLOR }]} />
              <Text style={styles.entryLabel}>ENTRY</Text>
              <Text style={styles.entryPrice}>{levels.entry.toLocaleString()}</Text>
            </View>
          )}

          <ScrollView style={styles.levelsScroll} nestedScrollEnabled>
            {renderRow(
              'stopLoss',
              'Stop Loss',
              SL_COLOR,
              <ShieldAlert size={12} color={SL_COLOR} />,
            )}
            {renderRow(
              'trailingStop',
              'Trail Stop',
              TS_COLOR,
              <TrendingDown size={12} color={TS_COLOR} />,
              true,
            )}
            <View style={styles.tpDivider} />
            {renderRow(
              'tp1',
              'TP 1',
              TP1_COLOR,
              <Target size={12} color={TP1_COLOR} />,
            )}
            {renderRow(
              'tp2',
              'TP 2',
              TP2_COLOR,
              <Target size={12} color={TP2_COLOR} />,
            )}
            {renderRow(
              'tp3',
              'TP 3',
              TP3_COLOR,
              <Target size={12} color={TP3_COLOR} />,
            )}
          </ScrollView>

          {anyActive && levels.entry > 0 && (
            <View style={styles.summaryRow}>
              {levels.stopLoss.enabled && (
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: SL_COLOR }]} />
                  <Text style={[styles.summaryVal, { color: SL_COLOR }]}>
                    SL {calcPnl(levels.stopLoss.price)}
                  </Text>
                </View>
              )}
              {levels.tp1.enabled && (
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: TP1_COLOR }]} />
                  <Text style={[styles.summaryVal, { color: TP1_COLOR }]}>
                    TP1 {calcPnl(levels.tp1.price)}
                  </Text>
                </View>
              )}
              {levels.tp2.enabled && (
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: TP2_COLOR }]} />
                  <Text style={[styles.summaryVal, { color: TP2_COLOR }]}>
                    TP2 {calcPnl(levels.tp2.price)}
                  </Text>
                </View>
              )}
              {levels.tp3.enabled && (
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: TP3_COLOR }]} />
                  <Text style={[styles.summaryVal, { color: TP3_COLOR }]}>
                    TP3 {calcPnl(levels.tp3.price)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default React.memo(TradingLevelsPanel);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg1,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  activeBadge: {
    backgroundColor: Colors.amber + '25',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.amber + '40',
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryPreview: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  setEntryBtn: {
    flex: 1,
    backgroundColor: ENTRY_COLOR + '15',
    borderWidth: 0.5,
    borderColor: ENTRY_COLOR + '40',
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  setEntryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: ENTRY_COLOR,
    letterSpacing: 0.3,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.redDim,
    borderWidth: 0.5,
    borderColor: Colors.red + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: ENTRY_COLOR + '08',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: ENTRY_COLOR + '20',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  entryLabel: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: ENTRY_COLOR,
    letterSpacing: 1,
  },
  entryPrice: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  levelsScroll: {
    marginTop: 4,
    maxHeight: 160,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  toggleArea: {
    padding: 2,
  },
  levelIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    width: 56,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  trailingHint: {
    fontSize: 7,
    color: Colors.text3,
    marginTop: -1,
  },
  inputWrap: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pnlText: {
    fontSize: 9,
    fontWeight: '700' as const,
    width: 48,
    textAlign: 'right',
  },
  tpDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
    marginLeft: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  summaryVal: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
});
