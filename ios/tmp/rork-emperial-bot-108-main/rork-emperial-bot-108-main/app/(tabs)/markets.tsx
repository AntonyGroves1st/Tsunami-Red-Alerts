import React from 'react';
import MarketsScreen from '@/screens/MarketsScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function MarketsTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Markets"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <MarketsScreen />;
}
