import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@/hooks/useNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BarChart3,
  TrendingUp,
  Bot,
  Shield,
  Bell,
  Zap,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import { Colors } from '@/constants/colors';

const ONBOARDING_KEY = 'emperial_onboarding_complete';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: <BarChart3 size={28} color={Colors.cyan} />,
    title: 'Real-Time Markets',
    subtitle: 'Live data from Binance, futures, options & indices with instant price updates',
    color: Colors.cyan,
  },
  {
    icon: <TrendingUp size={28} color={Colors.green} />,
    title: 'Professional Charts',
    subtitle: 'Interactive candlestick charts with 8 built-in indicators and trade levels',
    color: Colors.green,
  },
  {
    icon: <Bell size={28} color={Colors.orange} />,
    title: 'Smart Alerts',
    subtitle: 'Signal rules engine with webhook integration for TradingView, Discord & more',
    color: Colors.orange,
  },
  {
    icon: <Bot size={28} color={Colors.amber} />,
    title: 'Trading Bots',
    subtitle: 'Automated trading and arbitrage bots with configurable risk management',
    color: Colors.amber,
  },
  {
    icon: <Shield size={28} color={Colors.purple} />,
    title: 'Enterprise Security',
    subtitle: 'PIN lock, biometrics, encrypted storage & real-time threat detection',
    color: Colors.purple,
  },
];

function FeatureDot({ active, color }: { active: boolean; color: string }) {
  return (
    <View
      style={[
        styles.dot,
        active ? { backgroundColor: color, width: 20 } : { backgroundColor: Colors.text3 },
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { navigate, goBack, switchTab } = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const animateStep = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    Haptics.impact('light');
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      animateStep();
    } else {
      handleComplete();
    }
  }, [currentStep, animateStep]);

  const handleComplete = useCallback(async () => {
    Haptics.notification('success');
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.log('[Onboarding] Failed to save completion:', e);
    }
    goBack();
  }, [goBack]);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topSection}>
        <Pressable
          style={styles.skipBtn}
          onPress={handleComplete}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.heroArea,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.iconRing,
              { borderColor: step.color + '30', transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={[styles.iconInner, { backgroundColor: step.color + '12' }]}>
              {step.icon}
            </View>
          </Animated.View>

          <Text style={[styles.stepTitle, { color: step.color }]}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </Animated.View>

        <View style={styles.dotsRow}>
          {STEPS.map((s, i) => (
            <FeatureDot key={i} active={i === currentStep} color={s.color} />
          ))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        {currentStep === 0 && (
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoIcon}
            />
            <Text style={styles.logoText}>
              Emperial<Text style={styles.logoAccent}>Bot</Text>
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: step.color },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          {isLast ? (
            <Zap size={18} color={Colors.bg0} />
          ) : (
            <ArrowRight size={18} color={Colors.bg0} />
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroArea: {
    alignItems: 'center',
    gap: 20,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 14,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  logoAccent: {
    color: Colors.amber,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center',
  },
});
