import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@/hooks/useNavigation';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  Shield,
  FileText,
  Lock,
  Mail,
  Globe,
  ChevronRight,
  Zap,
  Bot,
  BarChart3,
  Activity,
  Bell,
  Link2,
  TrendingUp,
  Star,
  X,
} from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

interface FeatureItem {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const FEATURES: FeatureItem[] = [
  { icon: <BarChart3 size={16} color={Colors.cyan} />, label: 'Real-Time Market Dashboard', color: Colors.cyan },
  { icon: <TrendingUp size={16} color={Colors.green} />, label: 'Interactive Candlestick Charts', color: Colors.green },
  { icon: <Activity size={16} color={Colors.purple} />, label: '8 Professional Indicators', color: Colors.purple },
  { icon: <Bell size={16} color={Colors.orange} />, label: 'Smart Signal Alerts & Webhooks', color: Colors.orange },
  { icon: <Bot size={16} color={Colors.green} />, label: 'Automated Trading & Arbitrage Bots', color: Colors.green },
  { icon: <Link2 size={16} color={Colors.pink} />, label: 'Multi-Broker Integration', color: Colors.pink },
  { icon: <Shield size={16} color={Colors.amber} />, label: 'Enterprise-Grade Security', color: Colors.amber },
  { icon: <Zap size={16} color={Colors.gold} />, label: 'AI-Powered Analysis', color: Colors.gold },
];

export default function AboutScreen() {
  const { navigate, goBack, switchTab } = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(console.log);
  };

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>About</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
          testID="about-close-btn"
        >
          <X size={20} color={Colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
          />
          <Text style={styles.appName}>
            Emperial<Text style={styles.appNameAccent}>Bot</Text>
          </Text>
          <Text style={styles.tagline}>Professional Trading Suite</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{APP_VERSION}</Text>
            </View>
            <View style={styles.buildBadge}>
              <Text style={styles.buildText}>Build {BUILD_NUMBER}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEATURES</Text>
          <View style={styles.featuresCard}>
            {FEATURES.map((feat, i) => (
              <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
                <View style={[styles.featureIconWrap, { backgroundColor: feat.color + '12' }]}>
                  {feat.icon}
                </View>
                <Text style={styles.featureLabel}>{feat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <View style={styles.linksCard}>
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Haptics.impact('light');
                navigate('terms');
              }}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: Colors.amber + '12' }]}>
                <FileText size={16} color={Colors.amber} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Terms & Conditions</Text>
                <Text style={styles.linkSubtitle}>Legal agreement & policies</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </Pressable>

            <View style={styles.linkDivider} />

            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Haptics.impact('light');
                navigate('privacy');
              }}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: Colors.cyan + '12' }]}>
                <Lock size={16} color={Colors.cyan} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Privacy Policy</Text>
                <Text style={styles.linkSubtitle}>How we protect your data</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT & SUPPORT</Text>
          <View style={styles.linksCard}>
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => openLink('mailto:support@emperialbot.com')}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: Colors.green + '12' }]}>
                <Mail size={16} color={Colors.green} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Email Support</Text>
                <Text style={styles.linkSubtitle}>support@emperialbot.com</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </Pressable>

            <View style={styles.linkDivider} />

            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => openLink('mailto:security@emperialbot.com')}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: Colors.red + '12' }]}>
                <Shield size={16} color={Colors.red} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Security Issues</Text>
                <Text style={styles.linkSubtitle}>security@emperialbot.com</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </Pressable>
          </View>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            Trading financial instruments carries a high level of risk. Past performance is not indicative of future results. Only trade with capital you can afford to lose. This app does not constitute financial advice.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Emperial Solutions International, L.L.C.
          </Text>
          <Text style={styles.footerRights}>All Rights Reserved</Text>
          <Text style={styles.footerOwnership}>
            Emperial Bot™ is the exclusive property of Emperial Solutions International, L.L.C.
          </Text>
          <Text style={styles.footerDeveloper}>EMPERIAL — Proprietary Software</Text>
          <Text style={styles.footerBuilt}>
            Built with precision for professional traders
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 120,
    gap: 12,
  },
  heroCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.amber + '20',
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 14,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  appNameAccent: {
    color: Colors.amber,
  },
  tagline: {
    fontSize: 14,
    color: Colors.text2,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  versionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  versionBadge: {
    backgroundColor: Colors.amber + '15',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.amber + '30',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  buildBadge: {
    backgroundColor: Colors.bg2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buildText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text3,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  featuresCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  linksCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 58,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  linkSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  disclaimerCard: {
    backgroundColor: Colors.red + '06',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.red + '12',
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 18,
    textAlign: 'center',
  },
  footerCard: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  footerCopyright: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text2,
  },
  footerRights: {
    fontSize: 11,
    color: Colors.text3,
  },
  footerOwnership: {
    fontSize: 11,
    color: Colors.text2,
    textAlign: 'center' as const,
    marginTop: 6,
    lineHeight: 16,
  },
  footerDeveloper: {
    fontSize: 12,
    color: Colors.amber,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  footerBuilt: {
    fontSize: 11,
    color: Colors.text3,
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
});
