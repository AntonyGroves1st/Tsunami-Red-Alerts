import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@/hooks/useNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { TIMEFRAMES } from '@/constants/instruments';
import { useMarketData } from '@/hooks/useMarketData';
import { X, Clock } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import { Platform } from 'react-native';

const TF_GROUPS = [
  { label: 'Seconds', keys: ['1s', '3s', '5s', '15s', '30s', '45s'] },
  { label: 'Minutes', keys: ['1m', '2m', '3m', '5m', '10m', '15m', '30m', '45m'] },
  { label: 'Hours', keys: ['1h', '2h', '4h'] },
  { label: 'Days+', keys: ['1d', '1w', '1mo', '1y'] },
];

export default function TimeframePicker() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const { timeframe, setTimeframe } = useMarketData();
  const { width: screenWidth } = useWindowDimensions();
  const isSmall = screenWidth < 360;
  const hPad = isSmall ? 12 : 16;
  const gridGap = isSmall ? 6 : 8;
  const itemMinWidth = isSmall ? 68 : 80;

  const handleSelect = useCallback(
    (tf: string) => {
      Haptics.impact('medium');
      setTimeframe(tf);
      goBack();
    },
    [setTimeframe, goBack]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerLeft}>
          <Clock size={isSmall ? 16 : 18} color={Colors.amber} />
          <Text style={[styles.headerTitle, { fontSize: isSmall ? 16 : 18 }]}>Timeframe</Text>
        </View>
        <Pressable onPress={() => goBack()} hitSlop={12}>
          <X size={isSmall ? 20 : 22} color={Colors.text2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {TF_GROUPS.map((group) => (
          <View key={group.label} style={styles.groupSection}>
            <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
            <View style={[styles.grid, { gap: gridGap }]}>
              {group.keys.map((key) => {
                const tf = TIMEFRAMES.find((t) => t.key === key);
                if (!tf) return null;
                const isActive = timeframe === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleSelect(key)}
                    style={({ pressed }) => [
                      styles.tfItem,
                      { minWidth: itemMinWidth, paddingHorizontal: isSmall ? 12 : 16, paddingVertical: isSmall ? 10 : 12 },
                      isActive && styles.tfItemActive,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.tfLabel, { fontSize: isSmall ? 14 : 16 }, isActive && styles.tfLabelActive]}>
                      {tf.label}
                    </Text>
                    <Text style={[styles.tfCandles, { fontSize: isSmall ? 8 : 9 }]}>{tf.count} candles</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
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
    paddingVertical: 14,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  groupSection: {
    marginBottom: 20,
  },
  groupLabel: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tfItem: {
    borderRadius: 10,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tfItemActive: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  tfLabel: {
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tfLabelActive: {
    color: Colors.amber,
  },
  tfCandles: {
    color: Colors.text3,
    marginTop: 2,
  },
});
