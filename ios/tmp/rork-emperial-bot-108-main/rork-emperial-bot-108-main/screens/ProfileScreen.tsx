import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, FALLBACK_PRICES } from '@/hooks/useSubscription';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Colors } from '@/constants/colors';
import {
  User,
  Crown,
  Zap,
  TrendingUp,
  Shield,
  LogOut,
  ChevronRight,
  Star,
  Check,
  Lock,
  FileText,
  HelpCircle,
  Info,
  Sparkles,
  Diamond,
  RefreshCw,
  ArrowUpCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

interface PlanOption {
  key: string;
  name: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  accentColor: string;
  features: string[];
}

const UPGRADE_PLANS: PlanOption[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$89',
    period: '/mo',
    icon: <Zap size={20} color={Colors.blue} />,
    accentColor: Colors.blue,
    features: ['1s chart windows', 'Core indicators', 'Basic signals', 'Webhook alerts (10/mo)'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$180',
    period: '/mo',
    icon: <TrendingUp size={20} color={Colors.amber} />,
    accentColor: Colors.amber,
    features: ['Unlimited 1s charts', 'Advanced indicators', 'Trading Bot', 'Unlimited webhooks'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$350',
    period: '/mo',
    icon: <Crown size={20} color={Colors.gold} />,
    accentColor: Colors.gold,
    features: ['Full bots suite', 'Arbitrage scanner', 'Advanced brokers', 'Priority signals'],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$450',
    period: '/mo',
    icon: <Diamond size={20} color={Colors.purple} />,
    accentColor: Colors.purple,
    features: ['VIP access & priority support', 'All Premium features', 'Dedicated account manager', 'Custom bot strategies'],
  },
];

function AvatarCircle({ initials, size }: { initials: string; size: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.avatarOuter,
        { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    </Animated.View>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onUpgrade,
}: {
  plan: PlanOption;
  isCurrent: boolean;
  onUpgrade: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isCurrent) return;
    Haptics.impact('medium');
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onUpgrade();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.planCard,
          isCurrent && { borderColor: plan.accentColor, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.planHeader}>
          <View style={[styles.planIconWrap, { backgroundColor: plan.accentColor + '18' }]}>
            {plan.icon}
          </View>
          <View style={styles.planTitleCol}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={[styles.planPrice, { color: plan.accentColor }]}>
              {plan.price}<Text style={styles.planPeriod}>{plan.period}</Text>
            </Text>
          </View>
          {isCurrent ? (
            <View style={[styles.currentBadge, { backgroundColor: plan.accentColor + '18' }]}>
              <Check size={12} color={plan.accentColor} />
              <Text style={[styles.currentBadgeText, { color: plan.accentColor }]}>Active</Text>
            </View>
          ) : (
            <View style={[styles.upgradeBadge, { backgroundColor: plan.accentColor + '18', borderColor: plan.accentColor + '40' }]}>
              <Text style={[styles.upgradeBadgeText, { color: plan.accentColor }]}>Upgrade</Text>
              <ChevronRight size={14} color={plan.accentColor} />
            </View>
          )}
        </View>

        <View style={styles.planFeatures}>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.planFeatureRow}>
              <Check size={12} color={plan.accentColor} style={{ marginTop: 2 }} />
              <Text style={styles.planFeatureText}>{f}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { navigate } = useNavigation();
  const { user, logout, isMember, isAdmin } = useAuth();
  const { tier } = useSubscription();
  const {
    autoUpdateEnabled,
    toggleAutoUpdate,
    checkNow,
    isChecking,
    lastChecked,
    hasUpdate,
    appVersion,
    buildNumber,
  } = useAppUpdate();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleUpgrade = useCallback((_planKey: string) => {
    Haptics.impact('medium');
    navigate('paywall');
  }, [navigate]);

  const handleOpenPaywall = useCallback(() => {
    Haptics.impact('light');
    navigate('paywall');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          Haptics.impact('medium');
          logout();
        },
      },
    ]);
  }, [logout]);

  if (!user) return null;

  const memberDate = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
          <AvatarCircle initials={user.avatarInitials} size={80} />
          <Text style={styles.userName}>{user.displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.statusRow}>
            {isMember ? (
              <View style={styles.memberBadge}>
                <Crown size={14} color={Colors.gold} />
                <Text style={styles.memberBadgeText}>
                  {(user.plan ?? 'Member').charAt(0).toUpperCase() + (user.plan ?? 'member').slice(1)} Member
                </Text>
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Lock size={14} color={Colors.text3} />
                <Text style={styles.freeBadgeText}>Free Account</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{joinDate}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
            {memberDate && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{memberDate}</Text>
                  <Text style={styles.statLabel}>Member Since</Text>
                </View>
              </>
            )}
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isMember ? Colors.green : Colors.amber }]}>
                {isMember ? 'Active' : 'Locked'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </Animated.View>

        {!isMember && (
          <View style={styles.upgradeSection}>
            <View style={styles.upgradeBanner}>
              <Sparkles size={20} color={Colors.amber} />
              <View style={styles.upgradeBannerContent}>
                <Text style={styles.upgradeBannerTitle}>Unlock Full Access</Text>
                <Text style={styles.upgradeBannerSubtitle}>
                  Upgrade your account to access charts, indicators, signals, bots, and more
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            {UPGRADE_PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                isCurrent={user.plan === plan.key}
                onUpgrade={() => handleUpgrade(plan.key)}
              />
            ))}

            <Pressable
              onPress={handleOpenPaywall}
              style={({ pressed }) => [
                styles.viewAllPlansBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.viewAllPlansText}>View All Plans & Add-Ons</Text>
              <ChevronRight size={16} color={Colors.amber} />
            </Pressable>
          </View>
        )}

        {isMember && (
          <View style={styles.memberSection}>
            <Pressable
              onPress={handleOpenPaywall}
              style={({ pressed }) => [
                styles.memberBanner,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Crown size={24} color={Colors.gold} />
              <View style={styles.memberBannerContent}>
                <Text style={styles.memberBannerTitle}>All Features Unlocked</Text>
                <Text style={styles.memberBannerSubtitle}>
                  You have full access to every feature in Emperial Bot
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.gold} />
            </Pressable>

            <Pressable
              onPress={handleOpenPaywall}
              style={({ pressed }) => [
                styles.managePlanBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Star size={16} color={Colors.amber} />
              <Text style={styles.managePlanText}>Manage Subscription</Text>
              <ChevronRight size={16} color={Colors.text3} />
            </Pressable>
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Updates</Text>

          <View style={styles.menuItem}>
            <ArrowUpCircle size={18} color={Colors.green} />
            <Text style={styles.menuItemText}>Auto-Update from Server</Text>
            <Switch
              value={autoUpdateEnabled}
              onValueChange={(val) => {
                Haptics.impact('light');
                toggleAutoUpdate(val);
              }}
              trackColor={{ false: Colors.bg3, true: Colors.green + '60' }}
              thumbColor={autoUpdateEnabled ? Colors.green : Colors.text3}
              testID="auto-update-toggle"
            />
          </View>

          <Pressable
            onPress={() => {
              Haptics.impact('medium');
              checkNow();
            }}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            testID="check-updates-btn"
          >
            <RefreshCw size={18} color={Colors.cyan} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>Check for Updates</Text>
              {lastChecked && (
                <Text style={styles.menuItemSubtext}>
                  Last checked: {lastChecked.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            {isChecking ? (
              <ActivityIndicator size="small" color={Colors.cyan} />
            ) : hasUpdate ? (
              <View style={styles.updateDot} />
            ) : (
              <ChevronRight size={16} color={Colors.text3} />
            )}
          </Pressable>

          <View style={styles.versionInfoRow}>
            <Text style={styles.versionInfoLabel}>Current Version</Text>
            <Text style={styles.versionInfoValue}>v{appVersion} (Build {buildNumber})</Text>
          </View>
        </View>

        {isAdmin && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <Pressable
              onPress={() => {
                Haptics.impact('medium');
                navigate('admin-panel');
              }}
              style={({ pressed }) => [styles.menuItem, styles.adminItem, pressed && { opacity: 0.7 }]}
              testID="admin-panel-btn"
            >
              <ShieldCheck size={18} color={Colors.red} />
              <Text style={[styles.menuItemText, { color: Colors.red }]}>Admin Control Panel</Text>
              <ChevronRight size={16} color={Colors.red} />
            </Pressable>
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable
            onPress={() => navigate('terms')}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <FileText size={18} color={Colors.text2} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <ChevronRight size={16} color={Colors.text3} />
          </Pressable>

          <Pressable
            onPress={() => navigate('privacy')}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <Shield size={18} color={Colors.text2} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <ChevronRight size={16} color={Colors.text3} />
          </Pressable>

          <Pressable
            onPress={() => navigate('about')}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <Info size={18} color={Colors.text2} />
            <Text style={styles.menuItemText}>About</Text>
            <ChevronRight size={16} color={Colors.text3} />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.menuItem, styles.logoutItem, pressed && { opacity: 0.7 }]}
          >
            <LogOut size={18} color={Colors.red} />
            <Text style={[styles.menuItemText, { color: Colors.red }]}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  topBar: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center' as const,
    paddingTop: 28,
    paddingBottom: 24,
  },
  avatarOuter: {
    borderWidth: 2,
    borderColor: Colors.amber + '40',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: Colors.bg3,
    borderWidth: 2,
    borderColor: Colors.amber,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text2,
    marginBottom: 12,
  },
  statusRow: {
    marginBottom: 20,
  },
  memberBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(253,230,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memberBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  freeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  freeBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text3,
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text3,
    fontWeight: '600' as const,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border2,
    marginHorizontal: 8,
  },
  upgradeSection: {
    gap: 14,
    marginBottom: 24,
  },
  upgradeBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  upgradeBannerContent: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.amber,
    marginBottom: 4,
  },
  upgradeBannerSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
    marginTop: 8,
  },
  planCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  planTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '800' as const,
    marginTop: 2,
  },
  planPeriod: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.text2,
  },
  currentBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  upgradeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  planFeatures: {
    marginTop: 12,
    gap: 6,
  },
  planFeatureRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  planFeatureText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
    flex: 1,
  },
  viewAllPlansBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  viewAllPlansText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  memberSection: {
    gap: 12,
    marginBottom: 24,
  },
  memberBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(253,230,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  memberBannerContent: {
    flex: 1,
  },
  memberBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 4,
  },
  memberBannerSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
  },
  managePlanBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  managePlanText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  menuSection: {
    gap: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  logoutItem: {
    marginTop: 16,
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  adminItem: {
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  menuItemSubtext: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 2,
  },
  updateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
  },
  versionInfoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  versionInfoLabel: {
    fontSize: 12,
    color: Colors.text3,
    fontWeight: '500' as const,
  },
  versionInfoValue: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
});
