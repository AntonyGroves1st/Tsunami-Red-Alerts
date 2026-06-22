import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart' }} />
      <Tabs.Screen name="indicators" options={{ title: 'Indicators' }} />
      <Tabs.Screen name="signals" options={{ title: 'Signals' }} />
      <Tabs.Screen name="markets" options={{ title: 'Markets' }} />
      <Tabs.Screen name="bot" options={{ title: 'Bot' }} />
      <Tabs.Screen name="brokers" options={{ title: 'Brokers' }} />
      <Tabs.Screen name="security" options={{ title: 'Security' }} />
      <Tabs.Screen name="help" options={{ title: 'Help' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
