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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

type ResetStep = 'email' | 'verify' | 'newPassword' | 'success';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { goBack, replace } = useNavigation();
  const { checkEmailExists, resetPassword } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<ResetStep>('email');
  const [userName, setUserName] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const stepFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateStepChange = useCallback(() => {
    stepFade.setValue(0);
    Animated.timing(stepFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [stepFade]);

  const handleEmailSubmit = useCallback(async () => {
    setError('');
    if (!email.includes('@') || email.length < 5) {
      setError('Please enter a valid email address');
      Haptics.notification('error');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await checkEmailExists(email);
      if (!result.exists) {
        setError('No account found with this email address');
        Haptics.notification('error');
        return;
      }
      setUserName(result.displayName ?? '');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedCode(code);
      console.log('[ForgotPassword] Verification code generated for:', email, 'Code:', code);
      Haptics.impact('medium');
      animateStepChange();
      setStep('verify');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, checkEmailExists, animateStepChange]);

  const handleVerifyCode = useCallback(() => {
    setError('');
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      Haptics.notification('error');
      return;
    }
    if (verificationCode !== generatedCode) {
      setError('Invalid verification code. Please try again.');
      Haptics.notification('error');
      return;
    }
    Haptics.impact('medium');
    animateStepChange();
    setStep('newPassword');
  }, [verificationCode, generatedCode, animateStepChange]);

  const handleResetPassword = useCallback(async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      Haptics.notification('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notification('error');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await resetPassword(email, newPassword);
      if (result.success) {
        Haptics.notification('success');
        animateStepChange();
        setStep('success');
      } else {
        setError(result.error ?? 'Password reset failed');
        Haptics.notification('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [newPassword, confirmPassword, email, resetPassword, animateStepChange]);

  const handleGoToLogin = useCallback(() => {
    Haptics.impact('light');
    replace('login');
  }, [replace]);

  const getStepIndex = useCallback((): number => {
    switch (step) {
      case 'email': return 0;
      case 'verify': return 1;
      case 'newPassword': return 2;
      case 'success': return 3;
      default: return 0;
    }
  }, [step]);

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={[styles.centeredContent, { paddingTop: insets.top + 80 }]}>
          <Animated.View style={[styles.successContent, { opacity: stepFade }]}>
            <View style={styles.successIconWrap}>
              <CheckCircle size={40} color={Colors.green} />
            </View>
            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successSubtitle}>
              Your password has been successfully updated. You can now log in with your new password.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
                { marginTop: 32 },
              ]}
              onPress={handleGoToLogin}
              testID="forgot-go-login"
            >
              <Text style={styles.primaryBtnText}>Go to Login</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impact('light');
            if (step === 'email') {
              goBack();
            } else if (step === 'verify') {
              setStep('email');
              setError('');
            } else if (step === 'newPassword') {
              setStep('verify');
              setError('');
            }
          }}
          style={styles.backBtn}
          hitSlop={16}
          testID="forgot-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Reset Password</Text>
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
            <View style={styles.logoRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoIcon}
              />
              <Text style={styles.logoText}>
                Emperial<Text style={styles.logoAccent}>Bot</Text>
              </Text>
            </View>
          </Animated.View>

          <View style={styles.stepsRow}>
            {['Find Account', 'Verify', 'New Password'].map((label, idx) => (
              <React.Fragment key={label}>
                {idx > 0 && <View style={[styles.stepLine, getStepIndex() > idx - 1 && styles.stepLineActive]} />}
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, getStepIndex() >= idx && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, getStepIndex() >= idx && styles.stepLabelActive]}>{label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Animated.View style={[styles.formSection, { opacity: stepFade }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 'email' && (
              <>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconWrap}>
                    <Mail size={24} color={Colors.amber} />
                  </View>
                  <Text style={styles.stepTitle}>Find Your Account</Text>
                  <Text style={styles.stepSubtitle}>
                    Enter the email address associated with your account
                  </Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Mail size={18} color={Colors.text3} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.text3}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    testID="forgot-email"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                    isSubmitting && { opacity: 0.7 },
                  ]}
                  onPress={handleEmailSubmit}
                  disabled={isSubmitting}
                  testID="forgot-email-submit"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.bg0} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Find Account</Text>
                  )}
                </Pressable>
              </>
            )}

            {step === 'verify' && (
              <>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconWrap}>
                    <ShieldCheck size={24} color={Colors.amber} />
                  </View>
                  <Text style={styles.stepTitle}>Verify Your Identity</Text>
                  {userName ? (
                    <Text style={styles.stepSubtitle}>
                      Hi <Text style={styles.userNameHighlight}>{userName}</Text>, enter the 6-digit code sent to your email
                    </Text>
                  ) : (
                    <Text style={styles.stepSubtitle}>
                      Enter the 6-digit code sent to your email
                    </Text>
                  )}
                </View>

                <View style={styles.codeHintBox}>
                  <Text style={styles.codeHintLabel}>Verification Code</Text>
                  <Text style={styles.codeHintValue}>{generatedCode}</Text>
                  <Text style={styles.codeHintNote}>
                    (In production, this would be sent via email)
                  </Text>
                </View>

                <View style={styles.inputWrapper}>
                  <ShieldCheck size={18} color={Colors.text3} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="6-Digit Code"
                    placeholderTextColor={Colors.text3}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    testID="forgot-code"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleVerifyCode}
                  testID="forgot-code-submit"
                >
                  <Text style={styles.primaryBtnText}>Verify Code</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.resendBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    const code = String(Math.floor(100000 + Math.random() * 900000));
                    setGeneratedCode(code);
                    console.log('[ForgotPassword] New code generated:', code);
                    Haptics.impact('light');
                  }}
                >
                  <Text style={styles.resendBtnText}>Resend Code</Text>
                </Pressable>
              </>
            )}

            {step === 'newPassword' && (
              <>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconWrap}>
                    <KeyRound size={24} color={Colors.amber} />
                  </View>
                  <Text style={styles.stepTitle}>Set New Password</Text>
                  <Text style={styles.stepSubtitle}>
                    Create a strong new password for your account
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={Colors.text3} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password (min 6 characters)"
                      placeholderTextColor={Colors.text3}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      testID="forgot-new-password"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                      {showPassword ? (
                        <EyeOff size={18} color={Colors.text3} />
                      ) : (
                        <Eye size={18} color={Colors.text3} />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={Colors.text3} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor={Colors.text3}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      testID="forgot-confirm-password"
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                    isSubmitting && { opacity: 0.7 },
                  ]}
                  onPress={handleResetPassword}
                  disabled={isSubmitting}
                  testID="forgot-reset-submit"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.bg0} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Reset Password</Text>
                  )}
                </Pressable>
              </>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.linkBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleGoToLogin}
              testID="forgot-go-login-link"
            >
              <Text style={styles.linkBtnText}>
                Remember your password? <Text style={styles.linkBtnAccent}>Log In</Text>
              </Text>
            </Pressable>
          </Animated.View>
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
  successContent: {
    alignItems: 'center' as const,
    width: '100%',
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.greenDim,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
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
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  logoAccent: {
    color: Colors.amber,
  },
  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 6,
    marginBottom: 8,
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
  stepLine: {
    width: 28,
    height: 1,
    backgroundColor: Colors.border2,
    marginBottom: 14,
  },
  stepLineActive: {
    backgroundColor: Colors.amber,
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
  formSection: {
    gap: 18,
  },
  stepHeader: {
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 20,
    maxWidth: 300,
  },
  userNameHighlight: {
    color: Colors.amber,
    fontWeight: '700' as const,
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
  inputGroup: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    height: '100%' as unknown as number,
  },
  primaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    height: 54,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  codeHintBox: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    gap: 6,
  },
  codeHintLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  codeHintValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 6,
  },
  codeHintNote: {
    fontSize: 10,
    color: Colors.text3,
    fontStyle: 'italic' as const,
  },
  resendBtn: {
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  resendBtnText: {
    fontSize: 13,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border2,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.text3,
    fontWeight: '600' as const,
  },
  linkBtn: {
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  linkBtnText: {
    fontSize: 14,
    color: Colors.text2,
  },
  linkBtnAccent: {
    color: Colors.amber,
    fontWeight: '700' as const,
  },
});
