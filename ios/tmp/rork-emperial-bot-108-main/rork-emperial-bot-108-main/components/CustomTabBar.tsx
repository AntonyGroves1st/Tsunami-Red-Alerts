import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, TabName } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Bell,
  Globe,
  Bot,
  Link2,
  ShieldCheck,
  HelpCircle,
  UserCircle,
  Lock,
} from 'lucide-react-native';

const ICON_SIZE = 18;

const TAB_CONFIG: { name: TabName; label: string; Icon: React.ComponentType<{ size: number; color: string }>; memberOnly: boolean }[] = [
  { name: 'dashboard', label: 'Dashboard', Icon: BarChart3, memberOnly: false },
  { name: 'chart', label: 'Chart', Icon: TrendingUp, memberOnly: true },
  { name: 'indicators', label: 'Indicators', Icon: Activity, memberOnly: true },
  { name: 'signals', label: 'Signals', Icon: Bell, memberOnly: true },
  { name: 'markets', label: 'Markets', Icon: Globe, memberOnly: true },
  { name: 'bot', label: 'Bot', Icon: Bot, memberOnly: true },
  { name: 'brokers', label: 'Brokers', Icon: Link2, memberOnly: true },
  { name: 'security', label: 'Security', Icon: ShieldCheck, memberOnly: true },
  { name: 'help', label: 'Help', Icon: HelpCircle, memberOnly: false },
  { name: 'profile', label: 'Profile', Icon: UserCircle, memberOnly: false },
];

function TabItem({
  label,
  Icon,
  isFocused,
  isLocked,
  onPress,
}: {
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  isFocused: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.1 : 1,
      useNativeDriver: false,
      friction: 6,
    }).start();
    Animated.timing(glowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, scaleAnim, glowAnim]);

  const color = isLocked ? Colors.text3 : isFocused ? Colors.amber : Colors.text2;

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(245,158,11,0.08)'],
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabItemInner,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: bgColor,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon size={ICON_SIZE} color={color} />
          {isLocked && (
            <View style={styles.lockBadge}>
              <Lock size={7} color={Colors.amber} />
            </View>
          )}
        </View>
        <Animated.Text
          style={[
            styles.tabLabel,
            { color },
            isFocused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const { activeTab, switchTab } = useNavigation();
  const { isMember, isAuthenticated } = useAuth();

  const row1 = TAB_CONFIG.slice(0, 5);
  const row2 = TAB_CONFIG.slice(5);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === 'web' ? 4 : Math.max(insets.bottom, 2),
        },
      ]}
    >
      <View style={styles.dividerTop} />
      <View style={styles.scrollContent}>
        <View style={styles.row}>
          {row1.map((tab) => (
            <TabItem
              key={tab.name}
              label={tab.label}
              Icon={tab.Icon}
              isFocused={activeTab === tab.name}
              isLocked={!isMember && tab.memberOnly && isAuthenticated}
              onPress={() => switchTab(tab.name)}
            />
          ))}
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.row}>
          {row2.map((tab) => (
            <TabItem
              key={tab.name}
              label={tab.label}
              Icon={tab.Icon}
              isFocused={activeTab === tab.name}
              isLocked={!isMember && tab.memberOnly && isAuthenticated}
              onPress={() => switchTab(tab.name)}
            />
          ))}
        </View>
      </View>
      <View style={styles.copyrightRow}>
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} Emperial Solutions International, L.L.C. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg1,
    paddingTop: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dividerTop: {
    height: 1,
    backgroundColor: Colors.border,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-evenly' as const,
    alignItems: 'center' as const,
    paddingVertical: 1,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    opacity: 0.5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabItemInner: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    minWidth: 40,
  },
  iconContainer: {
    position: 'relative' as const,
  },
  lockBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    marginTop: 1,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700' as const,
  },
  copyrightRow: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 1,
    paddingBottom: 0,
  },
  copyrightText: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.2,
    fontWeight: '500' as const,
  },
});
