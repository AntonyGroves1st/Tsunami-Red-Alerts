import React from 'react';
import SignalsScreen from '@/screens/SignalsScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function SignalsTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Signals"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <SignalsScreen />;
}
