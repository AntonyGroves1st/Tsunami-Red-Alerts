import React from 'react';
import IndicatorsScreen from '@/screens/IndicatorsScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function IndicatorsTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Indicators"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <IndicatorsScreen />;
}
