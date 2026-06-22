import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ArrowLeft, Mail, ShieldCheck, RefreshCw, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import { sendVerificationCode, verifyCode } from '@/services/emailVerification';

interface EmailVerifyScreenProps {
  email: string;
  displayName: string;
  onVerified: () => void;
  onBack?: () => void;
}

export default function EmailVerifyScreen({ email, displayName, onVerified, onBack }: EmailVerifyScreenProps) {
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [tempCode, setTempCode] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    handleSendCode();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (codeSent && !verified) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [codeSent, verified, pulseAnim]);

  const handleSendCode = useCallback(async () => {
    setIsSending(true);
    setError('');
    try {
      const result = await sendVerificationCode(email);
      if (result.success) {
        if (result.code === 'ALREADY_VERIFIED') {
          console.log('[EmailVerify] Already verified, completing immediately');
          setVerified(true);
          Haptics.notification('success');
          Animated.spring(successScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
          setTimeout(() => onVerified(), 1500);
        } else {
          setCodeSent(true);
          setTempCode(result.code ?? '');
          setCooldown(60);
          Haptics.notification('success');
          console.log('[EmailVerify] Code sent successfully');
        }
      } else {
        if (result.cooldownRemaining) {
          setCooldown(result.cooldownRemaining);
          setCodeSent(true);
        }
        setError(result.error ?? 'Failed to send code');
        Haptics.notification('error');
      }
    } catch (e) {
      console.error('[EmailVerify] Send code error:', e);
      setError('Failed to send verification code');
      Haptics.notification('error');
    } finally {
      setIsSending(false);
    }
  }, [email, onVerified, successScale]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      Haptics.notification('error');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const result = await verifyCode(email, code);
      if (result.success) {
        console.log('[EmailVerify] Verification successful');
        setVerified(true);
        Haptics.notification('success');
        Animated.spring(successScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        setTimeout(() => onVerified(), 1500);
      } else {
        setError(result.error ?? 'Verification failed');
        Haptics.notification('error');
      }
    } catch (e) {
      console.error('[EmailVerify] Verify error:', e);
      setError('Verification failed. Please try again.');
      Haptics.notification('error');
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, onVerified, successScale]);

  const handleResend = useCallback(() => {
    if (cooldown > 0) return;
    setCode('');
    setTempCode('');
    handleSendCode();
  }, [cooldown, handleSendCode]);

  const handleBack = useCallback(() => {
    Haptics.impact('light');
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const maskedEmail = useCallback(() => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1);
    return `${visible}${'•'.repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
  }, [email]);

  if (verified) {
    return (
      <View style={styles.container}>
        <View style={[styles.centeredContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: successScale }] }]}>
            <CheckCircle size={48} color={Colors.green} />
          </Animated.View>
          <Text style={styles.successTitle}>Email Verified!</Text>
          <Text style={styles.successSubtitle}>
            Your email has been confirmed.{'\n'}Setting up your account...
          </Text>
          <ActivityIndicator size="small" color={Colors.amber} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={16}
          testID="verify-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Verify Email</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 32, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotDone]} />
                <Text style={[styles.stepLabel, styles.stepLabelDone]}>Sign Up</Text>
              </View>
              <View style={[styles.stepLine, styles.stepLineDone]} />
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Verify</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepLabel}>Plan</Text>
              </View>
            </View>

            <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Mail size={32} color={Colors.amber} />
            </Animated.View>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to
            </Text>
            <Text style={styles.emailHighlight}>{maskedEmail()}</Text>
          </Animated.View>

          {tempCode ? (
            <View style={styles.tempBanner}>
              <View style={styles.tempBannerHeader}>
                <AlertTriangle size={14} color={Colors.amber} />
                <Text style={styles.tempBannerTitle}>Demo Mode — Code shown here</Text>
              </View>
              <View style={styles.tempCodeRow}>
                <Text style={styles.tempCodeLabel}>Your code:</Text>
                <Text style={styles.tempCodeValue}>{tempCode}</Text>
              </View>
              <Text style={styles.tempBannerNote}>
                In production, this code will be emailed to the user. This is a temporary in-app display for testing.
              </Text>
            </View>
          ) : null}

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.codeInputSection}>
              <Text style={styles.codeLabel}>ENTER VERIFICATION CODE</Text>
              <View style={styles.codeInputWrapper}>
                <ShieldCheck size={18} color={Colors.text3} style={styles.inputIcon} />
                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor={Colors.text3}
                  value={code}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setCode(cleaned);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  testID="verify-code-input"
                />
                {code.length === 6 && (
                  <CheckCircle size={18} color={Colors.green} />
                )}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.verifyBtn,
                pressed && { opacity: 0.85 },
                (isVerifying || code.length !== 6) && { opacity: 0.6 },
              ]}
              onPress={handleVerify}
              disabled={isVerifying || code.length !== 6}
              testID="verify-submit"
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color={Colors.bg0} />
              ) : (
                <>
                  <ShieldCheck size={18} color={Colors.bg0} />
                  <Text style={styles.verifyBtnText}>Verify Email</Text>
                </>
              )}
            </Pressable>

            <View style={styles.resendSection}>
              <Text style={styles.resendLabel}>Didn't receive the code?</Text>
              <Pressable
                onPress={handleResend}
                disabled={cooldown > 0 || isSending}
                style={({ pressed }) => [
                  styles.resendBtn,
                  (cooldown > 0 || isSending) && { opacity: 0.5 },
                  pressed && { opacity: 0.7 },
                ]}
                testID="verify-resend"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={Colors.amber} />
                ) : cooldown > 0 ? (
                  <View style={styles.resendBtnInner}>
                    <Clock size={14} color={Colors.text3} />
                    <Text style={styles.resendCooldownText}>Resend in {cooldown}s</Text>
                  </View>
                ) : (
                  <View style={styles.resendBtnInner}>
                    <RefreshCw size={14} color={Colors.amber} />
                    <Text style={styles.resendBtnText}>Resend Code</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Why verify?</Text>
            <Text style={styles.infoCardText}>
              Email verification protects your account, enables password recovery, and ensures secure access to your trading tools.
            </Text>
          </View>

          <View style={styles.expiryNote}>
            <Clock size={12} color={Colors.text3} />
            <Text style={styles.expiryText}>Code expires in 10 minutes • 5 attempts max</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  flex: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    paddingHorizontal: 24,
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
  backBtn: {
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 24,
  },
  stepItem: {
    alignItems: 'center' as const,
    gap: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  stepDotActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  stepDotDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  stepLine: {
    width: 28,
    height: 1,
    backgroundColor: Colors.border2,
    marginBottom: 14,
  },
  stepLineDone: {
    backgroundColor: Colors.green,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text3,
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: Colors.amber,
  },
  stepLabelDone: {
    color: Colors.green,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.amberDim,
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  emailHighlight: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.amber,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  tempBanner: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  tempBannerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  tempBannerTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  tempCodeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  tempCodeLabel: {
    fontSize: 13,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  tempCodeValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 6,
  },
  tempBannerNote: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center' as const,
    lineHeight: 15,
  },
  formSection: {
    gap: 18,
  },
  errorBanner: {
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  codeInputSection: {
    gap: 8,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text3,
    letterSpacing: 1.2,
  },
  codeInputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  codeInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 8,
    height: '100%' as unknown as number,
  },
  verifyBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.green,
    borderRadius: 14,
    height: 54,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  resendSection: {
    alignItems: 'center' as const,
    gap: 8,
    paddingTop: 4,
  },
  resendLabel: {
    fontSize: 13,
    color: Colors.text3,
  },
  resendBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendBtnInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  resendCooldownText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text3,
  },
  infoCard: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  infoCardText: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 18,
  },
  expiryNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 16,
  },
  expiryText: {
    fontSize: 11,
    color: Colors.text3,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.greenDim,
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});
