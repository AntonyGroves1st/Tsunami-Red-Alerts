import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? '',
  }) as string;
}

let rcConfigured = false;
let apiKey = '';
let rcInitAttempted = false;

function initRevenueCat(): boolean {
  if (rcInitAttempted) return rcConfigured;
  rcInitAttempted = true;

  try {
    if (Platform.OS !== 'web') {
      apiKey = getRCApiKey();
      if (apiKey) {
        console.log('[RC] Configuring RevenueCat...');
        Purchases.configure({ apiKey });
        rcConfigured = true;
        console.log('[RC] RevenueCat configured successfully');
      } else {
        console.log('[RC] No API key, running in fallback mode');
      }
    } else {
      console.log('[RC] Web platform, running in fallback mode');
    }
  } catch (e) {
    console.warn('[RC] Failed to configure RevenueCat:', e);
    rcConfigured = false;
    apiKey = '';
  }
  return rcConfigured;
}

try {
  initRevenueCat();
} catch (e) {
  console.warn('[RC] Module-level init failed safely:', e);
}

export type TierLevel = 'free' | 'starter' | 'pro' | 'premium' | 'elite';

export interface FallbackPrice {
  monthly: string;
  annual: string;
}

export const FALLBACK_PRICES: Record<string, FallbackPrice> = {
  starter: { monthly: '$89', annual: '$890' },
  pro: { monthly: '$180', annual: '$1,800' },
  premium: { monthly: '$350', annual: '$3,500' },
  elite: { monthly: '$600', annual: '$6,000' },
  lifetime: { monthly: '$5,000', annual: '$5,000' },
};

export const FALLBACK_ADDON_PRICES: Record<string, string> = {
  chart_1s_unlock: '$4.99',
  arbitrage_scan_boost: '$9.99',
  bot_starter_kit: '$19.99',
};

export interface SubscriptionState {
  tier: TierLevel;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  isPurchasing: boolean;
  isRestoring: boolean;
  hasEntitlement: (key: string) => boolean;
  rcAvailable: boolean;
  rcError: string | null;
}

function getTierFromInfo(info: CustomerInfo | null): TierLevel {
  if (!info) return 'free';
  const entitlements = info.entitlements.active;
  if (entitlements['elite']) return 'elite';
  if (entitlements['premium']) return 'premium';
  if (entitlements['pro']) return 'pro';
  if (entitlements['starter']) return 'starter';
  return 'free';
}

export const [SubscriptionProvider, useSubscription] = createContextHook(
  (): SubscriptionState => {
    const queryClient = useQueryClient();
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [rcError, setRcError] = useState<string | null>(null);

    const isRCEnabled = !!apiKey && rcConfigured;

    const customerQuery = useQuery({
      queryKey: ['rc-customer-info'],
      queryFn: async () => {
        console.log('[RC] Fetching customer info...');
        try {
          const info = await Purchases.getCustomerInfo();
          console.log('[RC] Customer info fetched, active entitlements:', Object.keys(info.entitlements.active));
          setRcError(null);
          return info;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('[RC] Failed to fetch customer info:', msg);
          setRcError(msg);
          return null;
        }
      },
      enabled: isRCEnabled,
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: 2000,
    });

    const offeringsQuery = useQuery({
      queryKey: ['rc-offerings'],
      queryFn: async () => {
        console.log('[RC] Fetching offerings...');
        try {
          const offerings = await Purchases.getOfferings();
          console.log('[RC] Offerings fetched:', offerings.current?.identifier, 'packages:', offerings.current?.availablePackages.length);
          setRcError(null);
          return offerings;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('[RC] Failed to fetch offerings:', msg);
          setRcError(msg);
          return null;
        }
      },
      enabled: isRCEnabled,
      staleTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: 2000,
    });

    useEffect(() => {
      if (customerQuery.data) {
        setCustomerInfo(customerQuery.data);
      }
    }, [customerQuery.data]);

    useEffect(() => {
      if (!isRCEnabled) return;
      const listener = (info: CustomerInfo) => {
        console.log('[RC] Customer info updated via listener');
        setCustomerInfo(info);
        queryClient.setQueryData(['rc-customer-info'], info);
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    }, [queryClient, isRCEnabled]);

    const purchaseMutation = useMutation({
      mutationFn: async (pkg: PurchasesPackage) => {
        console.log('[RC] Purchasing package:', pkg.identifier);
        const result = await Purchases.purchasePackage(pkg);
        console.log('[RC] Purchase successful:', pkg.identifier);
        return result.customerInfo;
      },
      onSuccess: (info) => {
        setCustomerInfo(info);
        queryClient.setQueryData(['rc-customer-info'], info);
      },
      onError: (error: unknown) => {
        const err = error as { userCancelled?: boolean; message?: string; code?: number; underlyingErrorMessage?: string };
        if (err.userCancelled) {
          console.log('[RC] Purchase cancelled by user');
        } else {
          console.error('[RC] Purchase error:', JSON.stringify(err, null, 2));
          console.error('[RC] Purchase error message:', err.message);
          console.error('[RC] Purchase error code:', err.code);
          console.error('[RC] Purchase underlying error:', err.underlyingErrorMessage);
        }
      },
    });

    const restoreMutation = useMutation({
      mutationFn: async () => {
        console.log('[RC] Restoring purchases...');
        const info = await Purchases.restorePurchases();
        console.log('[RC] Restore complete, active:', Object.keys(info.entitlements.active));
        return info;
      },
      onSuccess: (info) => {
        setCustomerInfo(info);
        queryClient.setQueryData(['rc-customer-info'], info);
      },
    });

    const { mutateAsync: purchaseAsync } = purchaseMutation;
    const { mutateAsync: restoreAsync } = restoreMutation;

    const purchase = useCallback(
      async (pkg: PurchasesPackage): Promise<boolean> => {
        try {
          await purchaseAsync(pkg);
          return true;
        } catch {
          return false;
        }
      },
      [purchaseAsync]
    );

    const restore = useCallback(async (): Promise<boolean> => {
      try {
        await restoreAsync();
        return true;
      } catch {
        return false;
      }
    }, [restoreAsync]);

    const hasEntitlement = useCallback(
      (key: string): boolean => {
        if (!customerInfo) return false;
        return !!customerInfo.entitlements.active[key];
      },
      [customerInfo]
    );

    const tier = getTierFromInfo(customerInfo);

    const isActuallyLoading = isRCEnabled &&
      (customerQuery.isLoading || offeringsQuery.isLoading) &&
      !customerQuery.isError && !offeringsQuery.isError;

    const rcAvailable = isRCEnabled &&
      !customerQuery.isError &&
      !offeringsQuery.isError &&
      !!offeringsQuery.data?.current;

    return {
      tier,
      isLoading: isActuallyLoading,
      customerInfo,
      offerings: offeringsQuery.data ?? null,
      purchase,
      restore,
      isPurchasing: purchaseMutation.isPending,
      isRestoring: restoreMutation.isPending,
      hasEntitlement,
      rcAvailable,
      rcError,
    };
  }
);
