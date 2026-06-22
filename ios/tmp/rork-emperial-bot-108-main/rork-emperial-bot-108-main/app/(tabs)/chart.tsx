import React from 'react';
import ChartScreen from '@/screens/ChartScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function ChartTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Charts"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <ChartScreen />;
}
