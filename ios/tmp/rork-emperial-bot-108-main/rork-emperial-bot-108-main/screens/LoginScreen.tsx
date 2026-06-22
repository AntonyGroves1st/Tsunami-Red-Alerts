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
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock, Crown, Zap, TrendingUp, Diamond } from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, replace, resetToHome } = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [loggedInIsMember, setLoggedInIsMember] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        Haptics.notification('success');
        resetToHome();
      } else {
        setError(result.error ?? 'Login failed');
        Haptics.notification('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, resetToHome]);

  const handleGoToSignUp = useCallback(() => {
    Haptics.impact('light');
    replace('signup');
  }, [replace]);

  const handleForgotPassword = useCallback(() => {
    Haptics.impact('light');
    replace('forgot-password');
  }, [replace]);

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
          testID="login-back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Log In</Text>
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access your trading dashboard</Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
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
                  testID="login-email"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.text3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.text3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  testID="login-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.text3} />
                  ) : (
                    <Eye size={18} color={Colors.text3} />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.forgotPasswordLink,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleForgotPassword}
              testID="login-forgot-password"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && { opacity: 0.85 },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              testID="login-submit"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.bg0} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <ArrowRight size={18} color={Colors.bg0} />
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signUpLink,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleGoToSignUp}
              testID="login-go-signup"
            >
              <Text style={styles.signUpLinkText}>
                Don't have an account? <Text style={styles.signUpLinkAccent}>Sign Up</Text>
              </Text>
            </Pressable>
          </Animated.View>

          <View style={styles.plansHint}>
            <View style={styles.plansHintHeader}>
              <Crown size={16} color={Colors.amber} />
              <Text style={styles.plansHintTitle}>Subscriber Plans</Text>
            </View>
            <Text style={styles.plansHintDesc}>
              After logging in, upgrade from your Profile to unlock all features.
            </Text>
            <View style={styles.plansMini}>
              <View style={styles.planMiniRow}>
                <Zap size={14} color={Colors.blue} />
                <Text style={styles.planMiniName}>Starter</Text>
                <Text style={[styles.planMiniPrice, { color: Colors.blue }]}>$89/mo</Text>
              </View>
              <View style={styles.planMiniRow}>
                <TrendingUp size={14} color={Colors.amber} />
                <Text style={styles.planMiniName}>Pro</Text>
                <Text style={[styles.planMiniPrice, { color: Colors.amber }]}>$180/mo</Text>
              </View>
              <View style={styles.planMiniRow}>
                <Crown size={14} color={Colors.gold} />
                <Text style={styles.planMiniName}>Premium</Text>
                <Text style={[styles.planMiniPrice, { color: Colors.gold }]}>$350/mo</Text>
              </View>
              <View style={styles.planMiniRow}>
                <Diamond size={14} color={Colors.purple} />
                <Text style={styles.planMiniName}>Elite</Text>
                <Text style={[styles.planMiniPrice, { color: Colors.purple }]}>$450/mo</Text>
              </View>
            </View>
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
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 24,
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
  loginBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    height: 54,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
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
  signUpLink: {
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  signUpLinkText: {
    fontSize: 14,
    color: Colors.text2,
  },
  signUpLinkAccent: {
    color: Colors.amber,
    fontWeight: '700' as const,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end' as const,
    marginTop: -8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
  plansHint: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  plansHintHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  plansHintTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  plansHintDesc: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
    marginBottom: 12,
  },
  plansMini: {
    gap: 8,
  },
  planMiniRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  planMiniName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  planMiniPrice: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
});
