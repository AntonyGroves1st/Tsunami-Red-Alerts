import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet, Text, Pressable, Image, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MarketDataProvider } from '@/hooks/useMarketData';
import { AlertProvider } from '@/hooks/useAlerts';
import { SecurityProvider, useSecurity } from '@/hooks/useSecurity';
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import ErrorBoundary from '@/components/ErrorBoundary';
import PinLockScreen from '@/components/PinLockScreen';
import UpdateModal from '@/components/UpdateModal';
import { trpc, trpcClient } from '@/lib/trpc';
import { AppUpdateProvider } from '@/hooks/useAppUpdate';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, UserPlus, Zap, ShieldAlert, MapPin } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import { checkGeoRestriction } from '@/services/geoRestriction';

SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('[App] SplashScreen.preventAutoHideAsync failed');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 2000,
      staleTime: 30000,
      networkMode: 'always',
    },
    mutations: {
      retry: 0,
      networkMode: 'always',
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="signup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
      <Stack.Screen name="timeframe-picker" options={{ presentation: 'modal' }} />
      <Stack.Screen name="tradingview-setup" options={{ presentation: 'card' }} />
      <Stack.Screen name="ninjatrader-setup" options={{ presentation: 'card' }} />
      <Stack.Screen name="rithmic-setup" options={{ presentation: 'card' }} />
      <Stack.Screen name="binance-setup" options={{ presentation: 'card' }} />
      <Stack.Screen name="indicator-detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="trading-bot" options={{ presentation: 'card' }} />
      <Stack.Screen name="arbitrage-bot" options={{ presentation: 'card' }} />
      <Stack.Screen name="terms" options={{ presentation: 'card' }} />
      <Stack.Screen name="privacy" options={{ presentation: 'card' }} />
      <Stack.Screen name="about" options={{ presentation: 'card' }} />
      <Stack.Screen name="brokers-arbitrage" options={{ presentation: 'card' }} />
      <Stack.Screen name="admin-panel" options={{ presentation: 'card' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={welcomeStyles.container}>
      <View style={[welcomeStyles.container, { paddingTop: insets.top }]}>
        <Animated.View style={[welcomeStyles.content, { opacity: fadeAnim }]}>
          <View style={welcomeStyles.logoSection}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={welcomeStyles.logoIcon}
            />
            <Text style={welcomeStyles.logoText}>
              Emperial<Text style={welcomeStyles.logoAccent}>Bot</Text>
            </Text>
          </View>

          <View style={welcomeStyles.heroSection}>
            <View style={welcomeStyles.heroGlow}>
              <Zap size={36} color={Colors.amber} />
            </View>
            <Text style={welcomeStyles.heroTitle}>Professional Trading{'\n'}At Your Fingertips</Text>
            <Text style={welcomeStyles.heroSubtitle}>
              Real-time markets, advanced charts, smart signals, and automated bots — all in one place.
            </Text>
          </View>

          <View style={welcomeStyles.buttonSection}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push('/signup');
              }}
              style={({ pressed }) => [
                welcomeStyles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
              testID="welcome-signup"
            >
              <UserPlus size={18} color={Colors.bg0} />
              <Text style={welcomeStyles.primaryBtnText}>Create Account</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/login');
              }}
              style={({ pressed }) => [
                welcomeStyles.secondaryBtn,
                pressed && { opacity: 0.7 },
              ]}
              testID="welcome-login"
            >
              <LogIn size={18} color={Colors.amber} />
              <Text style={welcomeStyles.secondaryBtnText}>Log In</Text>
            </Pressable>
          </View>

          <Text style={welcomeStyles.disclaimer}>
            © {new Date().getFullYear()} Emperial Solutions International, L.L.C.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  const isOnAuthScreen = useMemo(() => {
    const currentRoute = segments[segments.length - 1];
    return currentRoute === 'login' || currentRoute === 'signup' || currentRoute === 'paywall' || currentRoute === 'forgot-password';
  }, [segments]);

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.amber} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!isAuthenticated && !isOnAuthScreen && (
        <View style={StyleSheet.absoluteFill}>
          <WelcomeScreen />
        </View>
      )}
    </View>
  );
}

function SafeUpdateModal() {
  return (
    <ErrorBoundary fallbackMessage="">
      <UpdateModal />
    </ErrorBoundary>
  );
}

function SecuredApp() {
  const { isLocked, isLoading } = useSecurity();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.amber} />
      </View>
    );
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <AuthGate>
      <RootLayoutNav />
      <SafeUpdateModal />
    </AuthGate>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 48,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  logoAccent: {
    color: Colors.amber,
  },
  heroSection: {
    alignItems: 'center' as const,
    marginBottom: 48,
    gap: 16,
  },
  heroGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.amberDim,
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 320,
  },
  buttonSection: {
    width: '100%',
    gap: 14,
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
  secondaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 14,
    height: 54,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.amber,
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center' as const,
    marginTop: 32,
  },
});

function GeoBlockedScreen({ reason }: { reason: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[geoStyles.container, { paddingTop: insets.top + 40 }]}>
      <View style={geoStyles.iconWrap}>
        <ShieldAlert size={48} color={Colors.red} />
      </View>
      <Text style={geoStyles.title}>Access Restricted</Text>
      <View style={geoStyles.locationRow}>
        <MapPin size={14} color={Colors.red} />
        <Text style={geoStyles.locationText}>Region Not Authorized</Text>
      </View>
      <Text style={geoStyles.message}>{reason}</Text>
      <View style={geoStyles.legalCard}>
        <Text style={geoStyles.legalTitle}>EMPERIAL Security Notice</Text>
        <Text style={geoStyles.legalText}>
          This application is the exclusive property of Emperial Solutions International, L.L.C. and is restricted to authorized users within the United States of America. Unauthorized access attempts are logged and may result in legal action.
        </Text>
      </View>
      <Text style={geoStyles.footer}>
        © {new Date().getFullYear()} Emperial Solutions International, L.L.C.
      </Text>
    </View>
  );
}

const geoStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    alignItems: 'center' as const,
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.red,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.red,
  },
  message: {
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
  },
  legalCard: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    borderRadius: 14,
    padding: 18,
    width: '100%' as const,
  },
  legalTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.amber,
    letterSpacing: 1,
    marginBottom: 8,
  },
  legalText: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 18,
  },
  footer: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 32,
  },
});

function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState<boolean>(false);
  const [geoBlocked, setGeoBlocked] = useState<boolean>(false);
  const [geoReason, setGeoReason] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[App] Checking geo-restriction...');
        const geoResult = await checkGeoRestriction();
        if (!geoResult.allowed) {
          console.log('[App] Access blocked for country:', geoResult.country);
          setGeoBlocked(true);
          setGeoReason(geoResult.reason ?? 'Access restricted to United States only.');
          return;
        }
        console.log('[App] Geo check passed:', geoResult.country);
      } catch (err) {
        console.log('[App] Geo check error, allowing access:', err);
      }
      setReady(true);
      console.log('[App] Providers ready, rendering app');
    };
    const timer = setTimeout(init, 100);
    return () => clearTimeout(timer);
  }, []);

  if (geoBlocked) {
    return <GeoBlockedScreen reason={geoReason} />;
  }

  if (!ready) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.amber} />
      </View>
    );
  }

  return (
    <SecurityProvider>
      <SubscriptionProvider>
        <AppUpdateProvider>
          <MarketDataProvider>
            <AlertProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </AlertProvider>
          </MarketDataProvider>
        </AppUpdateProvider>
      </SubscriptionProvider>
    </SecurityProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      console.log('[App] SplashScreen.hideAsync failed');
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary fallbackMessage="The app encountered an error. Tap below to restart.">
            <AppProviders>
              <SecuredApp />
            </AppProviders>
          </ErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
