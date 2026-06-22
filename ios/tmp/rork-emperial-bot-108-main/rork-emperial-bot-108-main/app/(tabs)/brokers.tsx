import React from 'react';
import BrokersScreen from '@/screens/BrokersScreen';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function BrokersTab() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !isMember) {
    return (
      <LockedFeatureOverlay
        featureName="Brokers"
        onUpgrade={() => router.push('/paywall' as any)}
      />
    );
  }

  return <BrokersScreen />;
}
