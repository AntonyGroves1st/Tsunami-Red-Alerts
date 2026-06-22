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
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Lock, Check } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import EmailVerifyScreen from '@/screens/EmailVerifyScreen';

type SignUpStep = 'form' | 'verify' | 'creating';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, replace, resetToHome } = useNavigation();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<SignUpStep>('form');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSignUp = useCallback(async () => {
    setError('');
    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Please enter your name');
      Haptics.notification('error');
      return;
    }
    if (!email.includes('@') || email.length < 5) {
      setError('Please enter a valid email address');
      Haptics.notification('error');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      Haptics.notification('error');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notification('error');
      return;
    }
    Haptics.impact('medium');
    console.log('[SignUp] Validation passed, moving to email verification');
    setStep('verify');
  }, [email, password, confirmPassword, displayName]);

  const handleVerificationComplete = useCallback(async () => {
    console.log('[SignUp] Email verified, creating account...');
    setStep('creating');
    try {
      const result = await signUp(email, password, displayName);
      if (result.success) {
        console.log('[SignUp] Account created successfully, navigating to paywall');
        Haptics.notification('success');
        replace('paywall');
      } else {
        console.log('[SignUp] Account creation failed:', result.error);
        setError(result.error ?? 'Sign up failed');
        setStep('form');
        Haptics.notification('error');
      }
    } catch (e) {
      console.error('[SignUp] Unexpected error:', e);
      setError('Something went wrong. Please try again.');
      setStep('form');
      Haptics.notification('error');
    }
  }, [email, password, displayName, signUp, replace]);

  const handleVerificationBack = useCallback(() => {
    console.log('[SignUp] Going back from verification to form');
    setStep('form');
  }, []);

  const handleGoToLogin = useCallback(() => {
    Haptics.impact('light');
    replace('login');
  }, [replace]);

  const handleForgotPassword = useCallback(() => {
    Haptics.impact('light');
    replace('forgot-password');
  }, [replace]);

  if (step === 'verify') {
    return (
      <EmailVerifyScreen
        email={email}
        displayName={displayName}
        onVerified={handleVerificationComplete}
        onBack={handleVerificationBack}
      />
    );
  }

  if (step === 'creating') {
    return (
      <View style={styles.container}>
        <View style={[styles.centeredContent, { paddingTop: insets.top + 80 }]}>
          <View style={styles.creatingIconWrap}>
            <Check size={32} color={Colors.green} />
          </View>
          <Text style={styles.creatingTitle}>Creating Your Account</Text>
          <Text style={styles.creatingSubtitle}>
            Email verified! Setting up your trading account...
          </Text>
          <ActivityIndicator size="large" color={Colors.amber} style={{ marginTop: 28 }} />
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
            goBack();
          }}
          style={styles.backBtn}
          hitSlop={16}
          testID="signup-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Create Account</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 24, paddingBottom: insets.bottom + 40 },
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
            <Text style={styles.title}>Join EmperialBot</Text>
            <Text style={styles.subtitle}>Start your journey to smarter trading</Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.text3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.text3}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                  testID="signup-name"
                />
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
                  testID="signup-email"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.text3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={Colors.text3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  testID="signup-password"
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
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.text3}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  testID="signup-confirm"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signUpBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleSignUp}
              testID="signup-submit"
            >
              <Text style={styles.signUpBtnText}>Create Account</Text>
              <ArrowRight size={18} color={Colors.bg0} />
            </Pressable>

            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Sign Up</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepLabel}>Verify Email</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepLabel}>Choose Plan</Text>
              </View>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginLink,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleGoToLogin}
              testID="signup-go-login"
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkAccent}>Log In</Text>
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.forgotLink,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleForgotPassword}
              testID="signup-forgot-password"
            >
              <Text style={styles.forgotLinkText}>Forgot your password?</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.termsRow}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => navigate('terms')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => navigate('privacy')}>Privacy Policy</Text>
            </Text>
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
  creatingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greenDim,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  creatingTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  creatingSubtitle: {
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
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 20,
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
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text2,
    letterSpacing: 0.2,
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
  signUpBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    height: 54,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    gap: 6,
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
  stepLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text3,
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: Colors.amber,
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
  loginLink: {
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.text2,
  },
  loginLinkAccent: {
    color: Colors.amber,
    fontWeight: '700' as const,
  },
  termsRow: {
    marginTop: 20,
    alignItems: 'center' as const,
  },
  termsText: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center' as const,
    lineHeight: 16,
    maxWidth: 300,
  },
  termsLink: {
    color: Colors.amber,
    textDecorationLine: 'underline' as const,
  },
  forgotLink: {
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  forgotLinkText: {
    fontSize: 13,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
});
