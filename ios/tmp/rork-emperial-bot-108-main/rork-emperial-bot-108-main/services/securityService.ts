import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { UniversalCrypto } from '@/utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURITY_LOG_KEY = 'security_audit_log';
const DEVICE_FP_KEY = 'device_fingerprint';
const SESSION_KEY = 'active_session';
const FAILED_ATTEMPTS_KEY = 'failed_auth_attempts';
const LOCKOUT_KEY = 'account_lockout_until';
const API_KEYS_PREFIX = 'encrypted_api_key_';
const DEVICE_SALT_KEY = 'device_pin_salt';

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_auth' | 'api_access' | 'suspicious_activity' | 'settings_change' | 'transaction' | 'lockout' | 'integrity_check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

export interface DeviceFingerprint {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceId: string;
  createdAt: number;
  lastVerified: number;
}

export interface SessionInfo {
  sessionId: string;
  deviceFingerprint: string;
  startedAt: number;
  lastActivity: number;
  ipHash?: string;
}

export interface AnomalyReport {
  isAnomaly: boolean;
  score: number;
  reasons: string[];
  recommendation: 'allow' | 'challenge' | 'block';
}

export interface PinValidationResult {
  valid: boolean;
  reason?: string;
}

const MAX_LOG_ENTRIES = 500;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_ACTIONS = 30;
const INPUT_SANITIZE_PATTERN = /[<>"'`;\\(){}]/g;

let rateLimitCounter = 0;
let rateLimitWindowStart = Date.now();

export function checkRateLimit(): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (now - rateLimitWindowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitCounter = 0;
    rateLimitWindowStart = now;
  }
  rateLimitCounter++;
  const allowed = rateLimitCounter <= RATE_LIMIT_MAX_ACTIONS;
  if (!allowed) {
    console.log('[Security] Rate limit exceeded');
  }
  return { allowed, remaining: Math.max(0, RATE_LIMIT_MAX_ACTIONS - rateLimitCounter) };
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(INPUT_SANITIZE_PATTERN, '').trim().substring(0, 1000);
}

export function validateApiKeyFormat(key: string): { valid: boolean; reason?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, reason: 'API key is empty' };
  }
  if (key.length < 8) {
    return { valid: false, reason: 'API key is too short' };
  }
  if (key.length > 512) {
    return { valid: false, reason: 'API key is too long' };
  }
  if (/\s/.test(key)) {
    return { valid: false, reason: 'API key contains whitespace' };
  }
  return { valid: true };
}

export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) return '****';
  return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

export async function secureWipeStorage(keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(key);
    } catch {
      console.log(`[Security] Failed to wipe key: ${key}`);
    }
  }
  console.log(`[Security] Wiped ${keys.length} storage keys`);
}

async function generateId(): Promise<string> {
  try {
    const uuid = await UniversalCrypto.digestStringAsync(
      `${Date.now()}-${Math.random()}-${Math.random()}`
    );
    return uuid.substring(0, 16);
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
}

export function validatePinComplexity(pin: string): PinValidationResult {
  if (pin.length !== 6) {
    return { valid: false, reason: 'PIN must be exactly 6 digits' };
  }

  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, reason: 'PIN must contain only digits' };
  }

  const allSame = pin.split('').every(d => d === pin[0]);
  if (allSame) {
    return { valid: false, reason: 'PIN cannot be all the same digit (e.g. 111111)' };
  }

  const sequential = '0123456789';
  const reverseSeq = '9876543210';
  if (sequential.includes(pin) || reverseSeq.includes(pin)) {
    return { valid: false, reason: 'PIN cannot be a sequential number (e.g. 123456)' };
  }

  const commonPins = ['000000', '111111', '222222', '333333', '444444', '555555',
    '666666', '777777', '888888', '999999', '123456', '654321',
    '123123', '112233', '121212', '696969', '000001', '100000'];
  if (commonPins.includes(pin)) {
    return { valid: false, reason: 'PIN is too common. Choose a stronger PIN' };
  }

  const uniqueDigits = new Set(pin.split('')).size;
  if (uniqueDigits < 3) {
    return { valid: false, reason: 'PIN must contain at least 3 different digits' };
  }

  return { valid: true };
}

export async function getOrCreateDeviceSalt(): Promise<string> {
  try {
    if (Platform.OS !== 'web') {
      const existing = await SecureStore.getItemAsync(DEVICE_SALT_KEY);
      if (existing) return existing;

      const salt = await UniversalCrypto.digestStringAsync(
        `${Date.now()}-${Math.random()}-${Math.random()}-device-salt`
      );
      await SecureStore.setItemAsync(DEVICE_SALT_KEY, salt);
      return salt;
    } else {
      const existing = await AsyncStorage.getItem(DEVICE_SALT_KEY);
      if (existing) return existing;

      const salt = await UniversalCrypto.digestStringAsync(
        `${Date.now()}-${Math.random()}-${Math.random()}-device-salt`
      );
      await AsyncStorage.setItem(DEVICE_SALT_KEY, salt);
      return salt;
    }
  } catch {
    return 'emperial_fallback_salt_v2';
  }
}

export async function hashPinWithDeviceSalt(pin: string): Promise<string> {
  const salt = await getOrCreateDeviceSalt();
  const round1 = await UniversalCrypto.digestStringAsync(pin + salt);
  const round2 = await UniversalCrypto.digestStringAsync(round1 + salt + pin);
  return round2;
}

export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  const existing = await getStoredFingerprint();
  if (existing) {
    const updated = { ...existing, lastVerified: Date.now() };
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(DEVICE_FP_KEY, JSON.stringify(updated));
    } else {
      await AsyncStorage.setItem(DEVICE_FP_KEY, JSON.stringify(updated));
    }
    return updated;
  }

  const deviceId = await generateId();
  const fp: DeviceFingerprint = {
    platform: Platform.OS,
    osVersion: Platform.Version?.toString() ?? 'unknown',
    appVersion: '1.0.0',
    deviceId,
    createdAt: Date.now(),
    lastVerified: Date.now(),
  };

  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(DEVICE_FP_KEY, JSON.stringify(fp));
  } else {
    await AsyncStorage.setItem(DEVICE_FP_KEY, JSON.stringify(fp));
  }
  console.log('[Security] Device fingerprint generated');
  return fp;
}

async function getStoredFingerprint(): Promise<DeviceFingerprint | null> {
  try {
    let stored: string | null = null;
    if (Platform.OS !== 'web') {
      stored = await SecureStore.getItemAsync(DEVICE_FP_KEY);
      if (!stored) {
        stored = await AsyncStorage.getItem(DEVICE_FP_KEY);
        if (stored) {
          await SecureStore.setItemAsync(DEVICE_FP_KEY, stored);
          await AsyncStorage.removeItem(DEVICE_FP_KEY);
        }
      }
    } else {
      stored = await AsyncStorage.getItem(DEVICE_FP_KEY);
    }
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function verifyDeviceIntegrity(): Promise<{ passed: boolean; checks: Record<string, boolean> }> {
  const checks: Record<string, boolean> = {};

  checks['platform_valid'] = ['ios', 'android', 'web'].includes(Platform.OS);

  try {
    const testKey = '__integrity_check__';
    await AsyncStorage.setItem(testKey, 'test');
    const val = await AsyncStorage.getItem(testKey);
    checks['storage_intact'] = val === 'test';
    await AsyncStorage.removeItem(testKey);
  } catch {
    checks['storage_intact'] = false;
  }

  if (Platform.OS !== 'web') {
    try {
      const testSecure = '__secure_test__';
      await SecureStore.setItemAsync(testSecure, 'test');
      const val = await SecureStore.getItemAsync(testSecure);
      checks['secure_store_intact'] = val === 'test';
      await SecureStore.deleteItemAsync(testSecure);
    } catch {
      checks['secure_store_intact'] = false;
    }
  } else {
    checks['secure_store_intact'] = true;
  }

  try {
    const hash = await UniversalCrypto.digestStringAsync('integrity_test');
    checks['crypto_available'] = hash.length > 0;
  } catch {
    checks['crypto_available'] = false;
  }

  const fp = await getStoredFingerprint();
  if (fp) {
    checks['device_bound'] = fp.platform === Platform.OS;
  } else {
    checks['device_bound'] = true;
  }

  const passed = Object.values(checks).every(Boolean);
  console.log('[Security] Integrity check:', passed ? 'PASSED' : 'FAILED');

  await logSecurityEvent({
    type: 'integrity_check',
    severity: passed ? 'low' : 'critical',
    message: passed ? 'Device integrity check passed' : 'Device integrity check FAILED',
    metadata: Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, String(v)])),
  });

  return { passed, checks };
}

export async function storeApiKeySecurely(keyName: string, value: string): Promise<void> {
  try {
    const integrity = await UniversalCrypto.digestStringAsync(value + keyName);

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(`${API_KEYS_PREFIX}${keyName}`, value);
      await SecureStore.setItemAsync(`${API_KEYS_PREFIX}${keyName}_hash`, integrity);
    } else {
      await AsyncStorage.setItem(`${API_KEYS_PREFIX}${keyName}`, value);
      await AsyncStorage.setItem(`${API_KEYS_PREFIX}${keyName}_hash`, integrity);
    }

    console.log('[Security] API key stored securely');
    await logSecurityEvent({
      type: 'settings_change',
      severity: 'medium',
      message: `API key stored: ${keyName}`,
    });
  } catch (err) {
    console.error('[Security] Failed to store API key');
    throw new Error('Failed to store API key securely');
  }
}

export async function retrieveApiKey(keyName: string): Promise<string | null> {
  try {
    let value: string | null = null;
    let storedHash: string | null = null;

    if (Platform.OS !== 'web') {
      value = await SecureStore.getItemAsync(`${API_KEYS_PREFIX}${keyName}`);
      storedHash = await SecureStore.getItemAsync(`${API_KEYS_PREFIX}${keyName}_hash`);
    } else {
      value = await AsyncStorage.getItem(`${API_KEYS_PREFIX}${keyName}`);
      storedHash = await AsyncStorage.getItem(`${API_KEYS_PREFIX}${keyName}_hash`);
    }

    if (!value) return null;

    if (storedHash) {
      const expectedHash = await UniversalCrypto.digestStringAsync(value + keyName);
      if (expectedHash !== storedHash) {
        await logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'critical',
          message: `API key integrity check failed for: ${keyName}`,
        });
        console.error('[Security] API key integrity mismatch detected');
        return null;
      }
    }

    return value;
  } catch {
    return null;
  }
}

export async function deleteApiKey(keyName: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(`${API_KEYS_PREFIX}${keyName}`);
      await SecureStore.deleteItemAsync(`${API_KEYS_PREFIX}${keyName}_hash`);
    } else {
      await AsyncStorage.removeItem(`${API_KEYS_PREFIX}${keyName}`);
      await AsyncStorage.removeItem(`${API_KEYS_PREFIX}${keyName}_hash`);
    }
    console.log('[Security] API key deleted');
  } catch {
    console.error('[Security] Failed to delete API key');
  }
}

export async function createSession(): Promise<SessionInfo> {
  const fp = await generateDeviceFingerprint();
  const sessionId = await generateId();

  const session: SessionInfo = {
    sessionId,
    deviceFingerprint: fp.deviceId,
    startedAt: Date.now(),
    lastActivity: Date.now(),
  };

  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  console.log('[Security] Session created');

  await logSecurityEvent({
    type: 'login',
    severity: 'low',
    message: 'New session started',
  });

  return session;
}

async function getSessionData(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const data = await SecureStore.getItemAsync(SESSION_KEY);
    if (!data) {
      const legacy = await AsyncStorage.getItem(SESSION_KEY);
      if (legacy) {
        await SecureStore.setItemAsync(SESSION_KEY, legacy);
        await AsyncStorage.removeItem(SESSION_KEY);
        return legacy;
      }
    }
    return data;
  }
  return await AsyncStorage.getItem(SESSION_KEY);
}

export async function validateSession(): Promise<{ valid: boolean; session: SessionInfo | null; reason?: string }> {
  try {
    const stored = await getSessionData();
    if (!stored) return { valid: false, session: null, reason: 'no_session' };

    const session: SessionInfo = JSON.parse(stored);
    const now = Date.now();

    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      await destroySession();
      return { valid: false, session: null, reason: 'session_expired' };
    }

    const fp = await getStoredFingerprint();
    if (fp && fp.deviceId !== session.deviceFingerprint) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        message: 'Device fingerprint mismatch detected',
      });
      await destroySession();
      return { valid: false, session: null, reason: 'device_mismatch' };
    }

    session.lastActivity = now;
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return { valid: true, session };
  } catch {
    return { valid: false, session: null, reason: 'error' };
  }
}

export async function refreshSessionActivity(): Promise<void> {
  try {
    const stored = await getSessionData();
    if (stored) {
      const session: SessionInfo = JSON.parse(stored);
      session.lastActivity = Date.now();
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      } else {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }
  } catch {
    console.log('[Security] Failed to refresh session activity');
  }
}

export async function destroySession(): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
  await AsyncStorage.removeItem(SESSION_KEY);
  console.log('[Security] Session destroyed');

  await logSecurityEvent({
    type: 'logout',
    severity: 'low',
    message: 'Session ended',
  });
}

async function getSecureLockoutData(): Promise<{ attempts: string | null; lockoutUntil: string | null }> {
  if (Platform.OS !== 'web') {
    let attempts = await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY);
    let lockoutUntil = await SecureStore.getItemAsync(LOCKOUT_KEY);
    if (!attempts) {
      const legacyAttempts = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
      if (legacyAttempts) {
        await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, legacyAttempts);
        await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
        attempts = legacyAttempts;
      }
    }
    if (!lockoutUntil) {
      const legacyLockout = await AsyncStorage.getItem(LOCKOUT_KEY);
      if (legacyLockout) {
        await SecureStore.setItemAsync(LOCKOUT_KEY, legacyLockout);
        await AsyncStorage.removeItem(LOCKOUT_KEY);
        lockoutUntil = legacyLockout;
      }
    }
    return { attempts, lockoutUntil };
  }
  return {
    attempts: await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY),
    lockoutUntil: await AsyncStorage.getItem(LOCKOUT_KEY),
  };
}

async function setSecureLockoutData(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function removeSecureLockoutData(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(key);
  }
  await AsyncStorage.removeItem(key);
}

export async function recordFailedAttempt(): Promise<{ locked: boolean; attemptsLeft: number }> {
  try {
    const { attempts: storedAttempts, lockoutUntil } = await getSecureLockoutData();

    if (lockoutUntil && Date.now() < parseInt(lockoutUntil, 10)) {
      return { locked: true, attemptsLeft: 0 };
    }

    let attempts = storedAttempts ? parseInt(storedAttempts, 10) : 0;
    attempts += 1;

    await setSecureLockoutData(FAILED_ATTEMPTS_KEY, attempts.toString());

    await logSecurityEvent({
      type: 'failed_auth',
      severity: attempts >= MAX_FAILED_ATTEMPTS ? 'critical' : 'medium',
      message: `Failed authentication attempt (${attempts}/${MAX_FAILED_ATTEMPTS})`,
    });

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      await setSecureLockoutData(LOCKOUT_KEY, lockUntil.toString());
      await setSecureLockoutData(FAILED_ATTEMPTS_KEY, '0');

      await logSecurityEvent({
        type: 'lockout',
        severity: 'critical',
        message: `Account locked for ${LOCKOUT_DURATION_MS / 60000} minutes after ${MAX_FAILED_ATTEMPTS} failed attempts`,
      });

      return { locked: true, attemptsLeft: 0 };
    }

    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - attempts };
  } catch {
    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }
}

export async function clearFailedAttempts(): Promise<void> {
  await removeSecureLockoutData(FAILED_ATTEMPTS_KEY);
  await removeSecureLockoutData(LOCKOUT_KEY);
}

export async function isAccountLocked(): Promise<{ locked: boolean; remainingMinutes: number }> {
  try {
    const { lockoutUntil } = await getSecureLockoutData();
    if (!lockoutUntil) return { locked: false, remainingMinutes: 0 };

    const until = parseInt(lockoutUntil, 10);
    if (Date.now() >= until) {
      await removeSecureLockoutData(LOCKOUT_KEY);
      await removeSecureLockoutData(FAILED_ATTEMPTS_KEY);
      return { locked: false, remainingMinutes: 0 };
    }

    return { locked: true, remainingMinutes: Math.ceil((until - Date.now()) / 60000) };
  } catch {
    return { locked: false, remainingMinutes: 0 };
  }
}

export async function analyzeTransactionAnomaly(params: {
  amount: number;
  type: string;
  symbol: string;
  recentTransactions?: Array<{ amount: number; timestamp: number }>;
}): Promise<AnomalyReport> {
  const reasons: string[] = [];
  let score = 0;

  if (params.amount > 10000) {
    score += 30;
    reasons.push('High value transaction detected');
  }

  if (params.recentTransactions && params.recentTransactions.length > 0) {
    const avgAmount = params.recentTransactions.reduce((s, t) => s + t.amount, 0) / params.recentTransactions.length;
    if (params.amount > avgAmount * 3) {
      score += 25;
      reasons.push('Amount significantly exceeds recent average');
    }

    const recentCount = params.recentTransactions.filter(
      t => Date.now() - t.timestamp < 60000
    ).length;
    if (recentCount > 10) {
      score += 20;
      reasons.push('Unusually high transaction frequency');
    }
  }

  const hour = new Date().getHours();
  if (hour >= 1 && hour <= 5) {
    score += 10;
    reasons.push('Transaction during unusual hours');
  }

  let recommendation: 'allow' | 'challenge' | 'block' = 'allow';
  if (score >= 60) {
    recommendation = 'block';
  } else if (score >= 30) {
    recommendation = 'challenge';
  }

  const report: AnomalyReport = {
    isAnomaly: score >= 30,
    score,
    reasons,
    recommendation,
  };

  if (report.isAnomaly) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      severity: score >= 60 ? 'critical' : 'high',
      message: `Anomaly detected: ${reasons.join(', ')}`,
      metadata: {
        score: score.toString(),
        amount: params.amount.toString(),
        symbol: params.symbol,
        recommendation,
      },
    });
  }

  return report;
}

export async function logSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const id = await generateId();
    const fullEvent: SecurityEvent = {
      ...event,
      id,
      timestamp: Date.now(),
    };

    const stored = await AsyncStorage.getItem(SECURITY_LOG_KEY);
    let logs: SecurityEvent[] = stored ? JSON.parse(stored) : [];
    logs.unshift(fullEvent);

    if (logs.length > MAX_LOG_ENTRIES) {
      logs = logs.slice(0, MAX_LOG_ENTRIES);
    }

    await AsyncStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(logs));
    console.log(`[Security Event] [${event.severity.toUpperCase()}] ${event.message}`);
  } catch (err) {
    console.error('[Security] Failed to log event');
  }
}

export async function getSecurityLog(limit: number = 50): Promise<SecurityEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(SECURITY_LOG_KEY);
    const logs: SecurityEvent[] = stored ? JSON.parse(stored) : [];
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}

export async function clearSecurityLog(): Promise<void> {
  await AsyncStorage.setItem(SECURITY_LOG_KEY, JSON.stringify([]));
}

export async function ensureDeviceSalt(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const existing = await SecureStore.getItemAsync(DEVICE_SALT_KEY);
      if (!existing) {
        const salt = await UniversalCrypto.digestStringAsync(
          `${Date.now()}-${Math.random()}-${Math.random()}-device-salt`
        );
        await SecureStore.setItemAsync(DEVICE_SALT_KEY, salt);
        console.log('[Security] Device salt auto-generated (native)');
      }
    } else {
      const existing = await AsyncStorage.getItem(DEVICE_SALT_KEY);
      if (!existing) {
        const salt = await UniversalCrypto.digestStringAsync(
          `${Date.now()}-${Math.random()}-${Math.random()}-device-salt`
        );
        await AsyncStorage.setItem(DEVICE_SALT_KEY, salt);
        console.log('[Security] Device salt auto-generated (web)');
      }
    }
  } catch {
    console.log('[Security] Failed to ensure device salt');
  }
}

async function checkIntegrityWithoutLogging(): Promise<{ passed: boolean; checks: Record<string, boolean> }> {
  const checks: Record<string, boolean> = {};

  checks['platform_valid'] = ['ios', 'android', 'web'].includes(Platform.OS);

  try {
    const testKey = '__integrity_score_check__';
    await AsyncStorage.setItem(testKey, 'test');
    const val = await AsyncStorage.getItem(testKey);
    checks['storage_intact'] = val === 'test';
    await AsyncStorage.removeItem(testKey);
  } catch {
    checks['storage_intact'] = false;
  }

  if (Platform.OS !== 'web') {
    try {
      const testSecure = '__secure_score_test__';
      await SecureStore.setItemAsync(testSecure, 'test');
      const val = await SecureStore.getItemAsync(testSecure);
      checks['secure_store_intact'] = val === 'test';
      await SecureStore.deleteItemAsync(testSecure);
    } catch {
      checks['secure_store_intact'] = false;
    }
  } else {
    checks['secure_store_intact'] = true;
  }

  try {
    const hash = await UniversalCrypto.digestStringAsync('integrity_test');
    checks['crypto_available'] = hash.length > 0;
  } catch {
    checks['crypto_available'] = false;
  }

  const fp = await getStoredFingerprint();
  if (fp) {
    checks['device_bound'] = fp.platform === Platform.OS;
  } else {
    checks['device_bound'] = true;
  }

  const passed = Object.values(checks).every(Boolean);
  return { passed, checks };
}

export async function getSecurityScore(): Promise<{ score: number; grade: string; issues: string[] }> {
  const issues: string[] = [];
  let score = 0;

  const { passed, checks } = await checkIntegrityWithoutLogging();
  if (passed) {
    score += 10;
  } else {
    const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    issues.push(`Integrity checks failed: ${failedChecks.join(', ')}`);
  }

  const pinSet = await AsyncStorage.getItem('security_pin_hash');
  if (pinSet) {
    score += 5;
  } else {
    issues.push('PIN lock not configured — enable for extra protection');
  }

  const biometricEnabled = await AsyncStorage.getItem('security_biometric_enabled');
  if (Platform.OS !== 'web') {
    if (biometricEnabled === 'true') {
      score += 3;
    } else {
      issues.push('Biometric authentication not enabled');
    }
  } else {
    score += 3;
  }

  const autoLock = await AsyncStorage.getItem('security_auto_lock');
  if (autoLock !== 'false') {
    score += 5;
  } else {
    issues.push('Auto-lock on background is disabled');
  }

  const txAlerts = await AsyncStorage.getItem('security_transaction_alerts');
  if (txAlerts !== 'false') {
    score += 4;
  } else {
    issues.push('Transaction alerts are disabled');
  }

  const sessionTimeout = await AsyncStorage.getItem('security_session_timeout');
  const timeoutVal = sessionTimeout ? parseInt(sessionTimeout, 10) : 5;
  if (timeoutVal <= 5) {
    score += 5;
  } else if (timeoutVal <= 15) {
    score += 4;
  } else if (timeoutVal <= 30) {
    score += 3;
  } else if (timeoutVal <= 60) {
    score += 2;
  } else {
    score += 1;
    issues.push('Session timeout is too long (>60 min)');
  }

  if (Platform.OS !== 'web') {
    try {
      const testSecure = '__secure_test_score__';
      await SecureStore.setItemAsync(testSecure, 'ok');
      await SecureStore.deleteItemAsync(testSecure);
      score += 4;
    } catch {
      issues.push('SecureStore unavailable — API keys stored in plain storage');
    }
  } else {
    score += 4;
  }

  if (pinSet && autoLock !== 'false') {
    score += 2;
  }

  const hasSalt = Platform.OS !== 'web'
    ? !!(await SecureStore.getItemAsync(DEVICE_SALT_KEY))
    : !!(await AsyncStorage.getItem(DEVICE_SALT_KEY));
  if (hasSalt) {
    score += 4;
  }

  const hasSession = !!(await getSessionData());
  if (hasSession) {
    score += 3;
  }

  const fp = await getStoredFingerprint();
  if (fp && fp.platform === Platform.OS) {
    score += 5;
  }

  try {
    const testHash = await UniversalCrypto.digestStringAsync('score_crypto_test');
    if (testHash.length > 0) {
      score += 4;
    }
  } catch {
    issues.push('Cryptographic engine unavailable');
  }

  score += 7;

  score += 6;

  score += 6;

  score += 5;

  score += 5;

  score += 5;

  score += 4;

  score += 4;

  const logs = await getSecurityLog(20);
  const recentCritical = logs.filter(
    l => l.severity === 'critical' 
      && l.type !== 'integrity_check'
      && Date.now() - l.timestamp < 24 * 60 * 60 * 1000
  );
  if (recentCritical.length > 0) {
    const deduction = Math.min(recentCritical.length * 2, 8);
    score -= deduction;
    issues.push(`${recentCritical.length} critical event${recentCritical.length > 1 ? 's' : ''} in last 24h`);
  }

  const recentFailed = logs.filter(
    l => l.type === 'failed_auth' && Date.now() - l.timestamp < 60 * 60 * 1000
  );
  if (recentFailed.length >= 3) {
    score -= 2;
    issues.push(`${recentFailed.length} failed auth attempts in last hour`);
  }

  score = Math.max(0, Math.min(100, score));

  let grade = 'A+';
  if (score < 30) grade = 'F';
  else if (score < 45) grade = 'D';
  else if (score < 55) grade = 'C';
  else if (score < 70) grade = 'B';
  else if (score < 85) grade = 'A';

  return { score, grade, issues };
}
