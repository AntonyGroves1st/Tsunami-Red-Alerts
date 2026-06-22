import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@/hooks/useNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Crown,
  Zap,
  Shield,
  Bot,
  TrendingUp,
  Radio,
  Clock,
  ChevronRight,
  Check,
  Star,
  Sparkles,
  AlertTriangle,
  Diamond,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSubscription, TierLevel, FALLBACK_PRICES, FALLBACK_ADDON_PRICES } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Haptics } from '@/utils/haptics';
import { PurchasesPackage } from 'react-native-purchases';

type BillingCycle = 'monthly' | 'annual';

interface TierConfig {
  key: TierLevel;
  name: string;
  icon: React.ReactNode;
  accentColor: string;
  accentDim: string;
  monthlyPkgKey: string;
  annualPkgKey: string;
  features: string[];
}

const TIERS: TierConfig[] = [
  {
    key: 'starter',
    name: 'Starter',
    icon: <Zap size={20} color={Colors.blue} />,
    accentColor: Colors.blue,
    accentDim: 'rgba(56,189,248,0.12)',
    monthlyPkgKey: 'starter_monthly',
    annualPkgKey: 'starter_annual',
    features: [
      '1s chart windows (5 pairs/day)',
      'Core indicators (EMA, RSI, oscillators)',
      'Basic signals & badges',
      'Webhook alerts (10/month)',
      'No ads',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: <TrendingUp size={20} color={Colors.amber} />,
    accentColor: Colors.amber,
    accentDim: Colors.amberDim,
    monthlyPkgKey: 'pro_monthly',
    annualPkgKey: 'pro_annual',
    features: [
      'Unlimited 1s charts & early signals',
      'Advanced indicators (ATR, RMP, MP)',
      'Trading Bot dashboard & P&L',
      'Unlimited webhooks & TradingView',
      'Arbitrage previews',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: <Crown size={20} color={Colors.gold} />,
    accentColor: Colors.gold,
    accentDim: 'rgba(253,230,138,0.12)',
    monthlyPkgKey: 'premium_monthly',
    annualPkgKey: 'premium_annual',
    features: [
      'Full bots suite with atomic clock sync',
      'Unlimited arbitrage scanner',
      'Advanced broker connections',
      'Priority signals',
      'Family sharing (3 devices)',
    ],
  },
  {
    key: 'elite',
    name: 'Elite',
    icon: <Diamond size={20} color={Colors.purple} />,
    accentColor: Colors.purple,
    accentDim: 'rgba(167,139,250,0.12)',
    monthlyPkgKey: 'elite_monthly',
    annualPkgKey: 'elite_annual',
    features: [
      'All Premium features included',
      'VIP access & priority support',
      'Dedicated account manager',
      'Custom bot strategies',
      'White-glove onboarding',
    ],
  },
];

function PricePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impact('light');
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          pillStyles.pill,
          active && pillStyles.pillActive,
        ]}
      >
        <Text style={[pillStyles.pillText, active && pillStyles.pillTextActive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  pillActive: {
    backgroundColor: Colors.amberDim,
    borderColor: Colors.amber,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  pillTextActive: {
    color: Colors.amber,
  },
});

function TierCard({
  tier,
  billing,
  currentTier,
  pkg,
  fallbackPrice,
  onPurchase,
  isPurchasing,
  rcAvailable,
}: {
  tier: TierConfig;
  billing: BillingCycle;
  currentTier: TierLevel;
  pkg: PurchasesPackage | null;
  fallbackPrice: string;
  onPurchase: (pkg: PurchasesPackage) => void;
  isPurchasing: boolean;
  rcAvailable: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tierOrder: TierLevel[] = ['free', 'starter', 'pro', 'premium', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const tierIndex = tierOrder.indexOf(tier.key);
  const isCurrentOrLower = tierIndex <= currentIndex;
  const isRecommended = tier.key === 'pro';

  const priceText = pkg?.product?.priceString ?? fallbackPrice;
  const periodText = billing === 'monthly' ? '/mo' : '/yr';

  const handlePress = () => {
    if (isCurrentOrLower || isPurchasing) return;
    if (!rcAvailable || !pkg) {
      Alert.alert(
        'Purchases Unavailable',
        Platform.OS === 'web'
          ? 'In-app purchases are only available on iOS and Android. Please use the mobile app to subscribe.'
          : 'Unable to connect to the purchase service. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impact('medium');
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPurchase(pkg);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={handlePress} style={styles.tierCard}>
        {isRecommended && (
          <View style={[styles.recommendedBadge, { backgroundColor: tier.accentColor }]}>
            <Star size={10} color={Colors.bg0} />
            <Text style={styles.recommendedText}>POPULAR</Text>
          </View>
        )}

        <View style={styles.tierHeader}>
          <View style={[styles.tierIconWrap, { backgroundColor: tier.accentDim }]}>
            {tier.icon}
          </View>
          <View style={styles.tierTitleCol}>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={[styles.tierPrice, { color: tier.accentColor }]}>
              {priceText}
              <Text style={styles.tierPeriod}>{periodText}</Text>
            </Text>
          </View>
          {isCurrentOrLower ? (
            <View style={styles.currentBadge}>
              <Check size={12} color={Colors.green} />
              <Text style={styles.currentBadgeText}>
                {tier.key === currentTier ? 'Current' : 'Included'}
              </Text>
            </View>
          ) : (
            <View style={[styles.upgradeBadge, { backgroundColor: tier.accentDim, borderColor: tier.accentColor }]}>
              {isPurchasing ? (
                <ActivityIndicator size="small" color={tier.accentColor} />
              ) : (
                <>
                  <Text style={[styles.upgradeBadgeText, { color: tier.accentColor }]}>Upgrade</Text>
                  <ChevronRight size={14} color={tier.accentColor} />
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.featureList}>
          {tier.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Check size={13} color={tier.accentColor} style={styles.featureCheck} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {billing === 'annual' && (
          <View style={[styles.savingsBadge, { backgroundColor: tier.accentDim }]}>
            <Sparkles size={12} color={tier.accentColor} />
            <Text style={[styles.savingsText, { color: tier.accentColor }]}>Save ~33% with annual billing</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function AddOnCard({
  title,
  subtitle,
  icon,
  pkg,
  fallbackPrice,
  onPurchase,
  isPurchasing,
  rcAvailable,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  pkg: PurchasesPackage | null;
  fallbackPrice: string;
  onPurchase: (pkg: PurchasesPackage) => void;
  isPurchasing: boolean;
  rcAvailable: boolean;
}) {
  const priceText = pkg?.product?.priceString ?? fallbackPrice;

  const handlePress = () => {
    if (isPurchasing) return;
    if (!rcAvailable || !pkg) {
      Alert.alert(
        'Purchases Unavailable',
        Platform.OS === 'web'
          ? 'In-app purchases are only available on iOS and Android. Please use the mobile app to subscribe.'
          : 'Unable to connect to the purchase service. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impact('light');
    onPurchase(pkg);
  };

  return (
    <Pressable onPress={handlePress} style={styles.addonCard}>
      <View style={styles.addonIcon}>{icon}</View>
      <View style={styles.addonInfo}>
        <Text style={styles.addonTitle}>{title}</Text>
        <Text style={styles.addonSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.addonPrice}>
        {isPurchasing ? (
          <ActivityIndicator size="small" color={Colors.amber} />
        ) : (
          <Text style={styles.addonPriceText}>{priceText}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const { navigate, goBack, switchTab } = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    tier,
    offerings,
    isLoading,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
    rcAvailable,
    rcError,
  } = useSubscription();
  const { upgradeMembership } = useAuth();

  const [billing, setBilling] = useState<BillingCycle>('annual');
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  const getPackage = useCallback(
    (key: string): PurchasesPackage | null => {
      if (!offerings?.current) return null;
      const found = offerings.current.availablePackages.find(
        (p) => p.identifier === key || p.identifier === `rc_${key}` || p.identifier === `$rc_${key}`
      );
      return found ?? null;
    },
    [offerings]
  );

  const getAddonPackage = useCallback(
    (key: string): PurchasesPackage | null => {
      if (!offerings?.all) return null;
      const addonsOffering = offerings.all['addons'];
      if (!addonsOffering) return null;
      const found = addonsOffering.availablePackages.find(
        (p) => p.identifier === key || p.identifier === `rc_${key}` || p.identifier === `$rc_${key}`
      );
      return found ?? null;
    },
    [offerings]
  );

  const getFallbackPrice = useCallback(
    (tierKey: string, cycle: BillingCycle): string => {
      const prices = FALLBACK_PRICES[tierKey];
      if (!prices) return '...';
      return cycle === 'monthly' ? prices.monthly : prices.annual;
    },
    []
  );

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      console.log('[Paywall] Initiating purchase for:', pkg.identifier);
      const success = await purchase(pkg);
      if (success) {
        console.log('[Paywall] Purchase successful, syncing membership...');
        const planKey = pkg.identifier.replace(/^(\$rc_|rc_)/, '').replace(/_(monthly|annual)$/, '');
        await upgradeMembership(planKey || 'pro');
        Haptics.notification('success');
        Alert.alert('Welcome!', 'Your subscription is now active.', [
          { text: 'OK', onPress: () => goBack() },
        ]);
      }
    },
    [purchase, goBack, upgradeMembership]
  );

  const handleRestore = useCallback(async () => {
    if (!rcAvailable) {
      Alert.alert(
        'Unavailable',
        Platform.OS === 'web'
          ? 'Restore purchases is only available on iOS and Android.'
          : 'Unable to connect to the purchase service.',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impact('light');
    const success = await restore();
    if (success) {
      Alert.alert('Restored', 'Your purchases have been restored.');
    } else {
      Alert.alert('No Purchases Found', 'We could not find any previous purchases.');
    }
  }, [restore, rcAvailable]);

  return (
    <View style={styles.container}>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impact('light');
            goBack();
          }}
          style={styles.closeBtn}
          hitSlop={16}
        >
          <X size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Upgrade Plan</Text>
        <View style={styles.closeBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.heroSection, { opacity: headerOpacity }]}>
            <View style={styles.heroIconRow}>
              <View style={styles.heroGlow}>
                <Crown size={32} color={Colors.gold} />
              </View>
            </View>
            <Text style={styles.heroTitle}>Unlock Your Edge</Text>
            <Text style={styles.heroSubtitle}>
              From real-time signals to automated bots — choose the plan that fits your trading style.
            </Text>
          </Animated.View>

          {!rcAvailable && (
            <View style={styles.rcWarning}>
              <AlertTriangle size={14} color={Colors.amber} />
              <Text style={styles.rcWarningText}>
                {Platform.OS === 'web'
                  ? 'In-app purchases require the iOS or Android app. Prices shown for reference.'
                  : rcError
                    ? 'Could not connect to purchase service. Prices shown for reference.'
                    : 'Purchase service unavailable. Prices shown for reference.'}
              </Text>
            </View>
          )}

          <View style={styles.billingToggle}>
            <PricePill
              label="Monthly"
              active={billing === 'monthly'}
              onPress={() => setBilling('monthly')}
            />
            <PricePill
              label="Annual (Save 33%)"
              active={billing === 'annual'}
              onPress={() => setBilling('annual')}
            />
          </View>

          <View style={styles.tiersSection}>
            {TIERS.map((t) => (
              <TierCard
                key={t.key}
                tier={t}
                billing={billing}
                currentTier={tier}
                pkg={getPackage(billing === 'monthly' ? t.monthlyPkgKey : t.annualPkgKey)}
                fallbackPrice={getFallbackPrice(t.key, billing)}
                onPurchase={handlePurchase}
                isPurchasing={isPurchasing}
                rcAvailable={rcAvailable}
              />
            ))}
          </View>

          <View style={styles.lifetimeSection}>
            <Pressable
              onPress={() => {
                const pkg = getPackage('lifetime');
                if (pkg) {
                  handlePurchase(pkg);
                } else if (!rcAvailable) {
                  Alert.alert(
                    'Purchases Unavailable',
                    Platform.OS === 'web'
                      ? 'In-app purchases are only available on iOS and Android.'
                      : 'Unable to connect to the purchase service.',
                    [{ text: 'OK' }]
                  );
                }
              }}
              style={styles.lifetimeCard}
            >
              <View style={styles.lifetimeTop}>
                <Shield size={22} color={Colors.gold} />
                <Text style={styles.lifetimeTitle}>Lifetime Premium</Text>
              </View>
              <Text style={styles.lifetimeSubtitle}>
                One-time payment for all features, forever.
              </Text>
              <View style={styles.lifetimePriceRow}>
                <Text style={styles.lifetimePrice}>
                  {getPackage('lifetime')?.product?.priceString ?? '$5,000'}
                </Text>
                <Text style={styles.lifetimeNote}>one-time</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.addonsSection}>
            <Text style={styles.addonsTitle}>Add-Ons</Text>
            <Text style={styles.addonsSubtitle}>À la carte boosts for free & starter users</Text>

            <AddOnCard
              title="1s Chart Unlock"
              subtitle="Permanent access to 1s windows for 10 pairs"
              icon={<Clock size={18} color={Colors.cyan} />}
              pkg={getAddonPackage('chart_1s_unlock')}
              fallbackPrice={FALLBACK_ADDON_PRICES['chart_1s_unlock']}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              rcAvailable={rcAvailable}
            />
            <AddOnCard
              title="Arbitrage Scan Boost"
              subtitle="50 extra scans/month (Gold/ETH cross-ex)"
              icon={<Radio size={18} color={Colors.green} />}
              pkg={getAddonPackage('arbitrage_scan_boost')}
              fallbackPrice={FALLBACK_ADDON_PRICES['arbitrage_scan_boost']}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              rcAvailable={rcAvailable}
            />
            <AddOnCard
              title="Bot Starter Kit"
              subtitle="Unlock basic Trading Bot for 1 month"
              icon={<Bot size={18} color={Colors.purple} />}
              pkg={getAddonPackage('bot_starter_kit')}
              fallbackPrice={FALLBACK_ADDON_PRICES['bot_starter_kit']}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              rcAvailable={rcAvailable}
            />
          </View>

          <View style={styles.footer}>
            <Pressable onPress={handleRestore} style={styles.restoreBtn}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.text2} />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </Pressable>
            <Text style={styles.legalText}>
              Payment will be charged to your account. Subscriptions auto-renew unless cancelled at least 24h before the end of the current period.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center' as const,
    paddingTop: 28,
    paddingBottom: 8,
  },
  heroIconRow: {
    marginBottom: 16,
  },
  heroGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253,230,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 20,
    maxWidth: 300,
  },
  rcWarning: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  rcWarningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.amber,
    lineHeight: 17,
  },
  billingToggle: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  tiersSection: {
    gap: 14,
  },
  tierCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: 18,
    overflow: 'hidden' as const,
  },
  recommendedBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.bg0,
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  tierIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tierTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  tierPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginTop: 2,
  },
  tierPeriod: {
    fontSize: 12,
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
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.green,
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
  featureList: {
    marginTop: 14,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  featureCheck: {
    marginTop: 2,
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    flex: 1,
  },
  savingsBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  lifetimeSection: {
    marginTop: 20,
  },
  lifetimeCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.25)',
    padding: 20,
  },
  lifetimeTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 6,
  },
  lifetimeTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  lifetimeSubtitle: {
    fontSize: 13,
    color: Colors.text2,
    lineHeight: 18,
    marginBottom: 12,
  },
  lifetimePriceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 8,
  },
  lifetimePrice: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  lifetimeNote: {
    fontSize: 13,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  addonsSection: {
    marginTop: 28,
  },
  addonsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  addonsSubtitle: {
    fontSize: 13,
    color: Colors.text2,
    marginBottom: 14,
  },
  addonCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: 14,
    marginBottom: 10,
  },
  addonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addonTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  addonSubtitle: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 2,
  },
  addonPrice: {
    marginLeft: 8,
  },
  addonPriceText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.amber,
  },
  footer: {
    alignItems: 'center' as const,
    marginTop: 28,
    gap: 12,
  },
  restoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  restoreText: {
    fontSize: 14,
    color: Colors.text2,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
  legalText: {
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'center' as const,
    lineHeight: 14,
    maxWidth: 320,
  },
});
