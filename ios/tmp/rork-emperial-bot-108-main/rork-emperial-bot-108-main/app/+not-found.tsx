import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>This screen does not exist.</Text>
      <Pressable
        onPress={() => router.replace('/')}
        style={({ pressed }) => [
          styles.homeBtn,
          pressed && { opacity: 0.8 },
        ]}
        testID="not-found-home"
      >
        <Home size={18} color={Colors.bg0} />
        <Text style={styles.homeBtnText}>Go Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text2,
    marginBottom: 28,
  },
  homeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 48,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
});
