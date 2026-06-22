import { useRouter, useSegments } from 'expo-router';
import { useCallback, useMemo } from 'react';

export type TabName = 'dashboard' | 'chart' | 'indicators' | 'signals' | 'markets' | 'bot' | 'brokers' | 'security' | 'help' | 'profile';

export type ScreenName =
  | 'onboarding' | 'paywall' | 'timeframe-picker'
  | 'tradingview-setup' | 'ninjatrader-setup' | 'rithmic-setup' | 'binance-setup'
  | 'indicator-detail' | 'trading-bot' | 'arbitrage-bot'
  | 'terms' | 'privacy' | 'about' | 'brokers-arbitrage'
  | 'signup' | 'login' | 'verify-email' | 'forgot-password'
  | 'admin-panel';

const PATH_TO_TAB: Record<string, TabName> = {
  chart: 'chart',
  indicators: 'indicators',
  signals: 'signals',
  markets: 'markets',
  bot: 'bot',
  brokers: 'brokers',
  security: 'security',
  help: 'help',
  profile: 'profile',
};

export function useNavigation() {
  const router = useRouter();
  const segments = useSegments();

  const activeTab: TabName = useMemo(() => {
    const segs = segments as string[];
    const tabSegment = segs.length >= 2 ? segs[1] : null;
    if (tabSegment && PATH_TO_TAB[tabSegment]) {
      return PATH_TO_TAB[tabSegment];
    }
    return 'dashboard';
  }, [segments]);

  const navigate = useCallback((screen: ScreenName, params?: Record<string, string>) => {
    console.log('[Navigation] navigate to:', screen, params);
    if (params) {
      router.push({ pathname: `/${screen}` as any, params });
    } else {
      router.push(`/${screen}` as any);
    }
  }, [router]);

  const goBack = useCallback(() => {
    console.log('[Navigation] goBack');
    router.back();
  }, [router]);

  const switchTab = useCallback((tab: TabName) => {
    console.log('[Navigation] switchTab to:', tab);
    try {
      if (tab === 'dashboard') {
        router.replace('/(tabs)' as any);
      } else {
        router.replace(`/(tabs)/${tab}` as any);
      }
    } catch (e) {
      console.log('[Navigation] switchTab error, retrying with push:', e);
      setTimeout(() => {
        try {
          if (tab === 'dashboard') {
            router.push('/(tabs)' as any);
          } else {
            router.push(`/(tabs)/${tab}` as any);
          }
        } catch (e2) {
          console.log('[Navigation] switchTab retry also failed:', e2);
        }
      }, 100);
    }
  }, [router]);

  const replace = useCallback((screen: ScreenName, params?: Record<string, string>) => {
    console.log('[Navigation] replace with:', screen);
    if (params) {
      router.replace({ pathname: `/${screen}` as any, params });
    } else {
      router.replace(`/${screen}` as any);
    }
  }, [router]);

  const resetToHome = useCallback(() => {
    console.log('[Navigation] resetToHome');
    router.replace('/(tabs)' as any);
  }, [router]);

  return {
    activeTab,
    navigate,
    goBack,
    switchTab,
    replace,
    resetToHome,
  };
}
