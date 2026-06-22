import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import createContextHook from '@nkzw/create-context-hook';
import {
  generateDeviceFingerprint,
  verifyDeviceIntegrity,
  createSession,
  validateSession,
  refreshSessionActivity,
  destroySession,
  recordFailedAttempt,
  clearFailedAttempts,
  isAccountLocked,
  getSecurityScore,
  getSecurityLog,
  logSecurityEvent,
  clearSecurityLog,
  validatePinComplexity,
  hashPinWithDeviceSalt,
  ensureDeviceSalt,
  checkRateLimit,
  sanitizeInput,
} from '@/services/securityService';
import type { SecurityEvent } from '@/services/securityService';

const PIN_HASH_KEY = 'security_pin_hash';
const BIOMETRIC_KEY = 'security_biometric_enabled';
const SESSION_TIMEOUT_KEY = 'security_session_timeout';
const AUTO_LOCK_KEY = 'security_auto_lock';
const TRANSACTION_ALERTS_KEY = 'security_transaction_alerts';
const TWO_FA_KEY = 'security_2fa_enabled';

export interface SecuritySettings {
  pinEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeoutMinutes: number;
  autoLockOnBackground: boolean;
  transactionAlerts: boolean;
  twoFactorEnabled: boolean;
}

export interface SecurityState {
  isLocked: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: SecuritySettings;
  securityScore: { score: number; grade: string; issues: string[] };
  auditLog: SecurityEvent[];
  biometricAvailable: boolean;
  biometricType: string;
  lockoutInfo: { locked: boolean; remainingMinutes: number };
}

const DEFAULT_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  biometricEnabled: false,
  sessionTimeoutMinutes: 5,
  autoLockOnBackground: true,
  transactionAlerts: true,
  twoFactorEnabled: false,
};

export const [SecurityProvider, useSecurity] = createContextHook(() => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [securityScore, setSecurityScore] = useState<{ score: number; grade: string; issues: string[] }>({ score: 0, grade: '-', issues: [] });
  const [auditLog, setAuditLog] = useState<SecurityEvent[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('None');
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingMinutes: number }>({ locked: false, remainingMinutes: 0 });
  const appStateRef = useRef<string>(AppState.currentState);
  const lastBackgroundRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeSecurity();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [settings.autoLockOnBackground, settings.pinEnabled]);

  const handleAppStateChange = useCallback((nextState: string) => {
    if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
      lastBackgroundRef.current = Date.now();
      if (settings.autoLockOnBackground && settings.pinEnabled) {
        console.log('[Security] App backgrounded, will lock on return');
      }
    }

    if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
      const bgDuration = Date.now() - lastBackgroundRef.current;
      if (settings.autoLockOnBackground && settings.pinEnabled && bgDuration > 5000) {
        console.log('[Security] App returned from background, locking');
        setIsLocked(true);
        setIsAuthenticated(false);
      }
      refreshSessionActivity();
    }

    appStateRef.current = nextState;
  }, [settings.autoLockOnBackground, settings.pinEnabled]);

  const initializeSecurity = async () => {
    try {
      console.log('[Security] Initializing security system...');
      await generateDeviceFingerprint();
      await ensureDeviceSalt();

      const [
        pinHash,
        bioEnabled,
        timeout,
        autoLock,
        txAlerts,
        twoFa,
      ] = await Promise.all([
        AsyncStorage.getItem(PIN_HASH_KEY),
        AsyncStorage.getItem(BIOMETRIC_KEY),
        AsyncStorage.getItem(SESSION_TIMEOUT_KEY),
        AsyncStorage.getItem(AUTO_LOCK_KEY),
        AsyncStorage.getItem(TRANSACTION_ALERTS_KEY),
        AsyncStorage.getItem(TWO_FA_KEY),
      ]);

      const loadedSettings: SecuritySettings = {
        pinEnabled: !!pinHash,
        biometricEnabled: bioEnabled === 'true',
        sessionTimeoutMinutes: timeout ? parseInt(timeout, 10) : 5,
        autoLockOnBackground: autoLock !== 'false',
        transactionAlerts: txAlerts !== 'false',
        twoFactorEnabled: twoFa === 'true',
      };
      setSettings(loadedSettings);

      if (Platform.OS !== 'web') {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          setBiometricAvailable(hasHardware && isEnrolled);

          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('Iris');
          }
        } catch {
          console.log('[Security] Biometric check failed');
        }
      }

      const lockStatus = await isAccountLocked();
      setLockoutInfo(lockStatus);

      if (loadedSettings.pinEnabled) {
        setIsLocked(true);
        setIsAuthenticated(false);
      } else {
        setIsLocked(false);
        setIsAuthenticated(true);
        await createSession();
      }

      await verifyDeviceIntegrity();
      await purgeStaleIntegrityEvents();
      await refreshScore();
      await refreshLog();

      console.log('[Security] Security system initialized');
    } catch (err) {
      console.error('[Security] Init error:', err);
      setIsAuthenticated(false);
      setIsLocked(true);
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        message: 'Security initialization failed — app locked for safety',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshScore = async () => {
    try {
      const score = await getSecurityScore();
      setSecurityScore(score);
    } catch {
      console.log('[Security] Failed to refresh score');
    }
  };

  const refreshLog = async () => {
    try {
      const logs = await getSecurityLog(100);
      setAuditLog(logs);
    } catch {
      console.log('[Security] Failed to refresh log');
    }
  };

  const setupPin = useCallback(async (pin: string): Promise<{ success: boolean; reason?: string }> => {
    try {
      const complexity = validatePinComplexity(pin);
      if (!complexity.valid) {
        return { success: false, reason: complexity.reason };
      }

      const hash = await hashPinWithDeviceSalt(pin);
      await AsyncStorage.setItem(PIN_HASH_KEY, hash);
      setSettings(prev => ({ ...prev, pinEnabled: true }));

      await logSecurityEvent({
        type: 'settings_change',
        severity: 'medium',
        message: 'PIN lock enabled',
      });
      await refreshScore();
      await refreshLog();
      console.log('[Security] PIN configured');
      return { success: true };
    } catch (err) {
      console.error('[Security] PIN setup failed:', err);
      return { success: false, reason: 'Failed to configure PIN' };
    }
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const lockStatus = await isAccountLocked();
      if (lockStatus.locked) {
        setLockoutInfo(lockStatus);
        return false;
      }

      const hash = await hashPinWithDeviceSalt(pin);
      const stored = await AsyncStorage.getItem(PIN_HASH_KEY);

      if (hash === stored) {
        await clearFailedAttempts();
        setIsLocked(false);
        setIsAuthenticated(true);
        setLockoutInfo({ locked: false, remainingMinutes: 0 });
        await createSession();

        await logSecurityEvent({
          type: 'login',
          severity: 'low',
          message: 'PIN authentication successful',
        });
        await refreshLog();
        return true;
      } else {
        const result = await recordFailedAttempt();
        setLockoutInfo({ locked: result.locked, remainingMinutes: result.locked ? 15 : 0 });
        await refreshLog();
        return false;
      }
    } catch (err) {
      console.error('[Security] PIN verify error:', err);
      return false;
    }
  }, []);

  const removePin = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(PIN_HASH_KEY);
    setSettings(prev => ({ ...prev, pinEnabled: false }));
    setIsLocked(false);
    setIsAuthenticated(true);

    await logSecurityEvent({
      type: 'settings_change',
      severity: 'medium',
      message: 'PIN lock disabled',
    });
    await refreshScore();
    await refreshLog();
  }, []);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to Emperial Bot',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await clearFailedAttempts();
        setIsLocked(false);
        setIsAuthenticated(true);
        setLockoutInfo({ locked: false, remainingMinutes: 0 });
        await createSession();

        await logSecurityEvent({
          type: 'login',
          severity: 'low',
          message: 'Biometric authentication successful',
        });
        await refreshLog();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Security] Biometric auth error:', err);
      return false;
    }
  }, []);

  const toggleBiometric = useCallback(async (enabled: boolean): Promise<void> => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
    setSettings(prev => ({ ...prev, biometricEnabled: enabled }));

    await logSecurityEvent({
      type: 'settings_change',
      severity: 'medium',
      message: `Biometric authentication ${enabled ? 'enabled' : 'disabled'}`,
    });
    await refreshScore();
    await refreshLog();
  }, []);

  const setSessionTimeout = useCallback(async (minutes: number): Promise<void> => {
    await AsyncStorage.setItem(SESSION_TIMEOUT_KEY, minutes.toString());
    setSettings(prev => ({ ...prev, sessionTimeoutMinutes: minutes }));

    await logSecurityEvent({
      type: 'settings_change',
      severity: 'low',
      message: `Session timeout set to ${minutes} minutes`,
    });
    await refreshLog();
  }, []);

  const setAutoLock = useCallback(async (enabled: boolean): Promise<void> => {
    await AsyncStorage.setItem(AUTO_LOCK_KEY, enabled ? 'true' : 'false');
    setSettings(prev => ({ ...prev, autoLockOnBackground: enabled }));
  }, []);

  const setTransactionAlerts = useCallback(async (enabled: boolean): Promise<void> => {
    await AsyncStorage.setItem(TRANSACTION_ALERTS_KEY, enabled ? 'true' : 'false');
    setSettings(prev => ({ ...prev, transactionAlerts: enabled }));
  }, []);

  const lockApp = useCallback(async (): Promise<void> => {
    if (settings.pinEnabled) {
      setIsLocked(true);
      setIsAuthenticated(false);
      await destroySession();
    }
  }, [settings.pinEnabled]);

  const clearAuditLog = useCallback(async (): Promise<void> => {
    await clearSecurityLog();
    setAuditLog([]);
  }, []);

  const purgeStaleIntegrityEvents = async () => {
    try {
      const logs = await getSecurityLog(500);
      const cleaned = logs.filter(l => {
        if (l.type === 'integrity_check' && l.severity === 'low') {
          const age = Date.now() - l.timestamp;
          return age < 24 * 60 * 60 * 1000;
        }
        if (l.type === 'integrity_check' && l.severity === 'critical') {
          return false;
        }
        return true;
      });
      if (cleaned.length !== logs.length) {
        await AsyncStorage.setItem('security_audit_log', JSON.stringify(cleaned));
        console.log(`[Security] Purged ${logs.length - cleaned.length} stale integrity events`);
      }
    } catch {
      console.log('[Security] Failed to purge stale events');
    }
  };

  return {
    isLocked,
    isAuthenticated,
    isLoading,
    settings,
    securityScore,
    auditLog,
    biometricAvailable,
    biometricType,
    lockoutInfo,
    setupPin,
    verifyPin,
    removePin,
    authenticateWithBiometric,
    toggleBiometric,
    setSessionTimeout,
    setAutoLock,
    setTransactionAlerts,
    lockApp,
    refreshScore,
    refreshLog,
    clearAuditLog,
  };
});
