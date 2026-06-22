import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Haptics } from '@/utils/haptics';
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Sliders,
  Zap,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import {
  TradingBotConfig,
  DEFAULT_BOT_CONFIG,
  SignalSource,
  SIGNAL_SOURCE_LABELS,
} from '@/services/tradingBotService';

const ALL_INSTRUMENTS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'ATOM', 'UNI', 'LTC'];
const ALL_SOURCES: SignalSource[] = ['ema_cross', 'golden_cross', 'death_cross', 'atr_signal', 'rmp_signal', 'pressure_flip', 'cloud_flip', 'composite'];

interface Props {
  config: TradingBotConfig;
  onConfigChange: (config: TradingBotConfig) => void;
  alwaysExpanded?: boolean;
}

function BotConfigPanel({ config, onConfigChange, alwaysExpanded = false }: Props) {
  const [expanded, setExpanded] = useState<boolean>(alwaysExpanded);

  const haptic = useCallback(() => {
    Haptics.impact('light');
  }, []);

  const toggleExpand = useCallback(() => {
    haptic();
    setExpanded((p) => !p);
  }, [haptic]);

  const setRisk = useCallback((level: 'conservative' | 'moderate' | 'aggressive') => {
    haptic();
    onConfigChange({ ...config, riskLevel: level });
  }, [haptic, config, onConfigChange]);

  const updateNum = useCallback((key: keyof TradingBotConfig, val: string, isFloat?: boolean) => {
    const num = isFloat ? parseFloat(val) : parseInt(val, 10);
    if (!isNaN(num)) {
      onConfigChange({ ...config, [key]: num });
    }
  }, [config, onConfigChange]);

  const toggleBool = useCallback((key: 'trailingStop' | 'autoCloseEOD', val: boolean) => {
    haptic();
    onConfigChange({ ...config, [key]: val });
  }, [haptic, config, onConfigChange]);

  const toggleInstrument = useCallback((symbol: string) => {
    haptic();
    const allowed = config.allowedInstruments.includes(symbol)
      ? config.allowedInstruments.filter(s => s !== symbol)
      : [...config.allowedInstruments, symbol];
    onConfigChange({ ...config, allowedInstruments: allowed });
  }, [haptic, config, onConfigChange]);

  const toggleSource = useCallback((source: SignalSource) => {
    haptic();
    const sources = config.signalSources.includes(source)
      ? config.signalSources.filter(s => s !== source)
      : [...config.signalSources, source];
    onConfigChange({ ...config, signalSources: sources });
  }, [haptic, config, onConfigChange]);

  const riskColor = config.riskLevel === 'conservative' ? Colors.green : config.riskLevel === 'moderate' ? Colors.amber : Colors.red;
  const activeSourceCount = config.signalSources.length;
  const activeInstrumentCount = config.allowedInstruments.length;

  const isExpanded = alwaysExpanded || expanded;

  return (
    <View style={s.container}>
      {!alwaysExpanded && (
        <Pressable onPress={toggleExpand} style={s.headerBar}>
          <View style={s.headerLeft}>
            <Sliders size={12} color={Colors.cyan} />
            <Text style={s.headerTitle}>Bot Config</Text>
            <View style={[s.riskBadge, { backgroundColor: riskColor + '18', borderColor: riskColor + '30' }]}>
              <Text style={[s.riskBadgeText, { color: riskColor }]}>
                {config.riskLevel.charAt(0).toUpperCase() + config.riskLevel.slice(1)}
              </Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>{activeSourceCount}S · {activeInstrumentCount}I</Text>
            {isExpanded ? (
              <ChevronUp size={14} color={Colors.text2} />
            ) : (
              <ChevronDown size={14} color={Colors.text2} />
            )}
          </View>
        </Pressable>
      )}

      {isExpanded && (
        <View style={s.body}>
          <Text style={s.sectionLabel}>RISK PROFILE</Text>
          <View style={s.riskRow}>
            {(['conservative', 'moderate', 'aggressive'] as const).map((level) => {
              const isActive = config.riskLevel === level;
              const levelColor = level === 'conservative' ? Colors.green : level === 'moderate' ? Colors.amber : Colors.red;
              return (
                <Pressable
                  key={level}
                  style={[s.riskBtn, isActive && { backgroundColor: levelColor + '15', borderColor: levelColor + '40' }]}
                  onPress={() => setRisk(level)}
                >
                  <Shield size={11} color={isActive ? levelColor : Colors.text3} />
                  <Text style={[s.riskBtnText, isActive && { color: levelColor }]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.sectionLabel}>TRADE PARAMETERS</Text>
          <View style={s.paramCard}>
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Max Position</Text>
              <View style={s.paramInputWrap}>
                <Text style={s.paramUnit}>$</Text>
                <TextInput
                  style={s.paramInput}
                  value={String(config.maxPositionSize)}
                  onChangeText={(t) => updateNum('maxPositionSize', t)}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
              </View>
            </View>
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Max Concurrent</Text>
              <View style={s.paramInputWrap}>
                <TextInput
                  style={s.paramInput}
                  value={String(config.maxConcurrentTrades)}
                  onChangeText={(t) => updateNum('maxConcurrentTrades', t)}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
              </View>
            </View>
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Stop Loss %</Text>
              <View style={s.paramInputWrap}>
                <TextInput
                  style={s.paramInput}
                  value={String(config.stopLossPercent)}
                  onChangeText={(t) => updateNum('stopLossPercent', t, true)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
                <Text style={s.paramUnit}>%</Text>
              </View>
            </View>
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Take Profit %</Text>
              <View style={s.paramInputWrap}>
                <TextInput
                  style={s.paramInput}
                  value={String(config.takeProfitPercent)}
                  onChangeText={(t) => updateNum('takeProfitPercent', t, true)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
                <Text style={s.paramUnit}>%</Text>
              </View>
            </View>
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Scan Interval</Text>
              <View style={s.paramInputWrap}>
                <TextInput
                  style={s.paramInput}
                  value={String(config.cooldownSeconds)}
                  onChangeText={(t) => updateNum('cooldownSeconds', t)}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
                <Text style={s.paramUnit}>sec</Text>
              </View>
            </View>
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Min Confidence</Text>
              <View style={s.paramInputWrap}>
                <TextInput
                  style={s.paramInput}
                  value={String(config.minConfidence)}
                  onChangeText={(t) => updateNum('minConfidence', t)}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.text3}
                  selectionColor={Colors.amber}
                  cursorColor={Colors.amber}
                />
                <Text style={s.paramUnit}>%</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionLabel}>FEATURES</Text>
          <View style={s.paramCard}>
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Trailing Stop</Text>
              <Switch
                value={config.trailingStop}
                onValueChange={(v) => toggleBool('trailingStop', v)}
                trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                thumbColor={config.trailingStop ? Colors.green : Colors.text2}
              />
            </View>
            {config.trailingStop && (
              <>
                <View style={s.paramDivider} />
                <View style={s.paramRow}>
                  <Text style={s.paramLabel}>Trailing Stop %</Text>
                  <View style={s.paramInputWrap}>
                    <TextInput
                      style={s.paramInput}
                      value={String(config.trailingStopPercent)}
                      onChangeText={(t) => updateNum('trailingStopPercent', t, true)}
                      keyboardType="decimal-pad"
                      placeholderTextColor={Colors.text3}
                      selectionColor={Colors.amber}
                      cursorColor={Colors.amber}
                    />
                    <Text style={s.paramUnit}>%</Text>
                  </View>
                </View>
              </>
            )}
            <View style={s.paramDivider} />
            <View style={s.paramRow}>
              <Text style={s.paramLabel}>Auto-Close EOD</Text>
              <Switch
                value={config.autoCloseEOD}
                onValueChange={(v) => toggleBool('autoCloseEOD', v)}
                trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                thumbColor={config.autoCloseEOD ? Colors.green : Colors.text2}
              />
            </View>
          </View>

          <Text style={s.sectionLabel}>SIGNAL SOURCES</Text>
          <View style={s.chipsGrid}>
            {ALL_SOURCES.map((source) => {
              const isActive = config.signalSources.includes(source);
              return (
                <Pressable
                  key={source}
                  style={[s.chip, isActive && s.chipActive]}
                  onPress={() => toggleSource(source)}
                >
                  <Zap size={9} color={isActive ? Colors.amber : Colors.text3} />
                  <Text style={[s.chipText, isActive && s.chipTextActive]}>{SIGNAL_SOURCE_LABELS[source]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.sectionLabel, { marginTop: 8 }]}>ALLOWED INSTRUMENTS</Text>
          <View style={s.chipsGrid}>
            {ALL_INSTRUMENTS.map((symbol) => {
              const isAllowed = config.allowedInstruments.includes(symbol);
              return (
                <Pressable
                  key={symbol}
                  style={[s.chip, isAllowed && s.chipActive]}
                  onPress={() => toggleInstrument(symbol)}
                >
                  <Text style={[s.chipText, isAllowed && s.chipTextActive]}>{symbol}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={s.disclaimerRow}>
            <AlertTriangle size={10} color={Colors.amber} />
            <Text style={s.disclaimerText}>
              Live trading carries risk. Use proper risk management.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default React.memo(BotConfigPanel);

const s = StyleSheet.create({
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
    paddingVertical: 7,
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
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  riskBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerMeta: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 6,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  riskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  riskBtnText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  paramCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  paramLabel: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600' as const,
    flex: 1,
  },
  paramInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg1,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: Colors.border,
    minHeight: 36,
  },
  paramInput: {
    fontSize: 14,
    color: Colors.amber,
    fontWeight: '700' as const,
    minWidth: 50,
    textAlign: 'right' as const,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 28,
  },
  paramUnit: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  paramDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.amber + '12',
    borderColor: Colors.amber + '30',
  },
  chipText: {
    fontSize: 10,
    color: Colors.text3,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    color: Colors.amber,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.amber + '06',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: Colors.amber + '12',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 9,
    color: Colors.text2,
    lineHeight: 13,
  },
});
