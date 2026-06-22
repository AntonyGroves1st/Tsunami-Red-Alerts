import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { Shield, Fingerprint, Delete, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSecurity } from '@/hooks/useSecurity';
import { Haptics } from '@/utils/haptics';

const PIN_LENGTH = 6;

export default function PinLockScreen() {
  const {
    verifyPin,
    authenticateWithBiometric,
    settings,
    biometricAvailable,
    biometricType,
    lockoutInfo,
  } = useSecurity();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(
    Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (settings.biometricEnabled && biometricAvailable) {
      setTimeout(() => {
        authenticateWithBiometric();
      }, 500);
    }
  }, [fadeAnim, settings.biometricEnabled, biometricAvailable, authenticateWithBiometric]);

  useEffect(() => {
    if (pin.length > 0) {
      const idx = pin.length - 1;
      Animated.spring(dotAnims[idx], {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [pin, dotAnims]);

  const shakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleDigit = useCallback(async (digit: string) => {
    if (isVerifying || lockoutInfo.locked) return;

    if (Platform.OS !== 'web') {
      Haptics.impact('light');
    }

    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      setIsVerifying(true);
      const success = await verifyPin(newPin);
      if (!success) {
        shakeAnimation();
        if (Platform.OS !== 'web') {
          Haptics.notification('error');
        } else {
          try { Vibration.vibrate(200); } catch {}
        }
        setError('Incorrect PIN');
        dotAnims.forEach(a => a.setValue(0));
        setPin('');
      }
      setIsVerifying(false);
    }
  }, [pin, isVerifying, lockoutInfo.locked, verifyPin, shakeAnimation, dotAnims]);

  const handleDelete = useCallback(() => {
    if (pin.length > 0) {
      const idx = pin.length - 1;
      dotAnims[idx].setValue(0);
      setPin(prev => prev.slice(0, -1));
      setError('');
      if (Platform.OS !== 'web') {
        Haptics.impact('light');
      }
    }
  }, [pin, dotAnims]);

  const handleBiometric = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impact('medium');
    }
    await authenticateWithBiometric();
  }, [authenticateWithBiometric]);

  const renderDots = () => (
    <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const scale = dotAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              { transform: [{ scale }] },
            ]}
          />
        );
      })}
    </Animated.View>
  );

  const renderKeypad = () => {
    const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['bio', '0', 'del']];
    return (
      <View style={styles.keypad}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map(key => {
              if (key === 'bio') {
                if (settings.biometricEnabled && biometricAvailable) {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.keyBtn}
                      onPress={handleBiometric}
                      activeOpacity={0.6}
                      testID="biometric-btn"
                    >
                      <Fingerprint size={28} color={Colors.amber} />
                    </TouchableOpacity>
                  );
                }
                return <View key={key} style={styles.keyBtn} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.keyBtn}
                    onPress={handleDelete}
                    onLongPress={() => {
                      dotAnims.forEach(a => a.setValue(0));
                      setPin('');
                    }}
                    activeOpacity={0.6}
                    testID="delete-btn"
                  >
                    <Delete size={26} color={Colors.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.keyBtn}
                  onPress={() => handleDigit(key)}
                  activeOpacity={0.5}
                  testID={`pin-key-${key}`}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.topSection}>
        <View style={styles.iconWrap}>
          <Shield size={44} color={Colors.amber} />
        </View>
        <Text style={styles.title}>Emperial Bot</Text>
        <Text style={styles.subtitle}>
          {lockoutInfo.locked
            ? `Account locked. Try again in ${lockoutInfo.remainingMinutes}m`
            : 'Enter your PIN to unlock'}
        </Text>
      </View>

      {renderDots()}

      {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorSpacer} />}

      {lockoutInfo.locked ? (
        <View style={styles.lockoutBox}>
          <Lock size={24} color={Colors.red} />
          <Text style={styles.lockoutText}>
            Too many failed attempts.{'\n'}
            Try again in {lockoutInfo.remainingMinutes} minute{lockoutInfo.remainingMinutes !== 1 ? 's' : ''}.
          </Text>
        </View>
      ) : (
        renderKeypad()
      )}

      {settings.biometricEnabled && biometricAvailable && !lockoutInfo.locked && (
        <Text style={styles.biometricHint}>
          {biometricType} available — tap the icon or use PIN
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border2,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    marginBottom: 20,
    height: 18,
  },
  errorSpacer: {
    height: 18,
    marginBottom: 20,
  },
  keypad: {
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 24,
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500' as const,
    color: Colors.white,
  },
  lockoutBox: {
    alignItems: 'center',
    backgroundColor: Colors.redDim,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: 12,
  },
  lockoutText: {
    fontSize: 14,
    color: Colors.red,
    textAlign: 'center',
    lineHeight: 20,
  },
  biometricHint: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 24,
    textAlign: 'center',
  },
});
