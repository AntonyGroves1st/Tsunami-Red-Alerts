import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Lock, Crown, ArrowRight } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import { useRouter } from 'expo-router';

interface LockedFeatureOverlayProps {
  featureName: string;
  onUpgrade?: () => void;
}

export default function LockedFeatureOverlay({ featureName, onUpgrade }: LockedFeatureOverlayProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [fadeAnim, scaleAnim, glowAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.lockRing, { opacity: glowAnim }]}>
          <View style={styles.lockCircle}>
            <Lock size={32} color={Colors.amber} />
          </View>
        </Animated.View>

        <Text style={styles.title}>Feature Locked</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.featureName}>{featureName}</Text> requires an active membership to access
        </Text>

        <Pressable
          onPress={() => {
            Haptics.impact('medium');
            if (onUpgrade) {
              onUpgrade();
            } else {
              router.push('/paywall' as any);
            }
          }}
          style={({ pressed }) => [
            styles.upgradeBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Crown size={18} color={Colors.bg0} />
          <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
          <ArrowRight size={16} color={Colors.bg0} />
        </Pressable>

        <Text style={styles.hint}>
          Go to Profile → Choose a plan to unlock all features
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center' as const,
    gap: 16,
  },
  lockRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 21,
    maxWidth: 280,
  },
  featureName: {
    color: Colors.amber,
    fontWeight: '700' as const,
  },
  upgradeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 32,
    marginTop: 8,
    width: '100%',
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    color: Colors.text3,
    textAlign: 'center' as const,
    marginTop: 4,
  },
});
