import React from 'react';
import SecurityScreen from '@/screens/SecurityScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function SecurityTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Security"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <SecurityScreen />;
}
