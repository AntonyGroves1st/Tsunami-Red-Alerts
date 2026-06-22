import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const EFFECTIVE_DATE = 'February 26, 2026';
const APP_NAME = 'Emperial Bot';
const COMPANY_NAME = 'Emperial Solutions International, L.L.C.';

interface Section {
  heading: string;
  body: string;
}

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: '1. Information We Collect',
    body: `${APP_NAME} is designed with a privacy-first architecture. We collect minimal data necessary to provide our services:

(a) Information You Provide:
- Account preferences and app settings
- Trading bot configurations and alert rules
- Broker API keys (stored locally on your device only)
- PIN and biometric authentication preferences

(b) Automatically Collected Information:
- Anonymized usage analytics (feature usage, screen views)
- Device type, operating system version, and app version
- Crash reports and performance metrics
- General geographic region (country-level, not precise location)

(c) Information We Do NOT Collect:
- We do not collect, store, or transmit your API keys to our servers
- We do not track your trading history or positions
- We do not collect personal financial information
- We do not collect precise location data
- We do not access your contacts, photos, or other device data`,
  },
  {
    heading: '2. How We Use Your Information',
    body: `We use the limited information we collect for the following purposes:

(a) App Functionality: To provide, maintain, and improve the core features of ${APP_NAME}, including market data display, indicator calculations, bot operations, and alert management.

(b) Performance Optimization: To monitor app performance, identify bugs, and optimize the user experience through anonymized crash reports and performance data.

(c) Security: To detect and prevent unauthorized access, fraud, and other malicious activity through our security monitoring systems.

(d) Communications: To send important service updates, security alerts, and (with your consent) promotional communications about new features.

(e) Legal Compliance: To comply with applicable laws, regulations, and legal processes.`,
  },
  {
    heading: '3. Data Storage and Security',
    body: `(a) Local Storage: The vast majority of your data — including API keys, trading configurations, alert rules, and preferences — is stored locally on your device. We use industry-standard encryption methods including:
- SHA-256 hashing for PIN codes with unique salts
- Expo SecureStore for sensitive credentials (hardware-backed on iOS/Android)
- AES encryption for locally stored configuration data

(b) No Cloud Storage of Sensitive Data: Your API keys, broker credentials, and trading configurations are never transmitted to or stored on our servers.

(c) Security Measures: We implement commercially reasonable physical, technical, and administrative safeguards to protect your information, including:
- Input sanitization to prevent injection attacks
- Rate limiting to prevent brute-force attempts
- Session integrity verification
- Device binding for session tokens
- Automatic lockout after failed authentication attempts

(d) Data Breach Notification: In the unlikely event of a data breach affecting your personal information, we will notify affected users within 72 hours in accordance with applicable law.`,
  },
  {
    heading: '4. Third-Party Services',
    body: `${APP_NAME} integrates with third-party services to provide its functionality:

(a) Market Data Providers: We connect to public APIs (including Binance) to fetch real-time market data. These connections transmit only the instrument symbols being queried — no personal data is shared.

(b) Broker Integrations: When you connect to brokers (TradingView, NinjaTrader, Binance, etc.), API communications occur directly between your device and the broker's servers. We do not act as an intermediary.

(c) RevenueCat: We use RevenueCat for subscription management. RevenueCat may collect anonymized purchase and subscription data. See RevenueCat's privacy policy for details.

(d) App Store / Google Play: Purchases are processed through Apple App Store or Google Play. Their respective privacy policies govern payment data collection.

(e) Analytics: We may use anonymized analytics services to understand usage patterns. No personally identifiable information is included in analytics data.`,
  },
  {
    heading: '5. Data Sharing and Disclosure',
    body: `We do not sell, trade, rent, or otherwise share your personal information with third parties for their marketing purposes. We may share information only in these limited circumstances:

(a) With Your Consent: When you explicitly authorize sharing (e.g., connecting a broker).

(b) Service Providers: With trusted service providers who assist in operating our app, subject to strict confidentiality agreements.

(c) Legal Requirements: When required by law, regulation, subpoena, court order, or governmental request.

(d) Safety and Rights: When necessary to protect the safety, rights, or property of ${COMPANY_NAME}, our users, or the public.

(e) Business Transfers: In connection with a merger, acquisition, or sale of assets, with continued protection of your data under comparable terms.`,
  },
  {
    heading: '6. Your Rights and Choices',
    body: `You have the following rights regarding your data:

(a) Access and Portability: You can access all your data stored within the app at any time. Since data is stored locally, you have full control.

(b) Deletion: You can delete all app data by:
- Clearing app data through your device settings
- Uninstalling the application
- Using the "Clear Audit Log" feature for security event history

(c) Opt-Out of Analytics: You can disable anonymized analytics through the app's settings.

(d) Push Notifications: You can disable push notifications through your device settings at any time.

(e) Account Deletion: Since we don't maintain server-side accounts, deleting the app removes all your data.

(f) GDPR Rights (EU Users): If you are located in the European Economic Area, you have additional rights under GDPR including the right to access, rectification, erasure, restriction of processing, data portability, and the right to object.

(g) CCPA Rights (California Users): California residents have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information (we do not sell personal information).`,
  },
  {
    heading: '7. Children\'s Privacy',
    body: `${APP_NAME} is not intended for use by individuals under the age of 18 (or the age of majority in their jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected data from a child, we will take immediate steps to delete such information.`,
  },
  {
    heading: '8. International Data Transfers',
    body: `If you access ${APP_NAME} from outside the United States, please be aware that anonymized analytics data may be transferred to and processed in the United States or other countries. By using the app, you consent to such transfers. We ensure appropriate safeguards are in place for any international data transfers in compliance with applicable data protection laws.`,
  },
  {
    heading: '9. Data Retention',
    body: `(a) Local Data: Data stored on your device persists until you delete the app or clear app data.

(b) Analytics Data: Anonymized analytics data is retained for up to 24 months for trend analysis and then permanently deleted.

(c) Crash Reports: Crash report data is retained for up to 12 months and then automatically purged.

(d) No Server-Side Retention: Since we do not maintain user accounts or store personal data on our servers, there is no server-side data retention to manage.`,
  },
  {
    heading: '10. Changes to This Privacy Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes through:

- In-app notifications
- Updated "Effective Date" at the top of this policy
- A notice on the app's Help screen

Your continued use of ${APP_NAME} after any changes to this Privacy Policy constitutes your acceptance of the updated terms. We encourage you to review this policy periodically.`,
  },
  {
    heading: '11. Contact Us',
    body: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

${COMPANY_NAME}
Email: privacy@emperialbot.com

For data deletion requests: privacy@emperialbot.com
For security concerns: security@emperialbot.com

We will respond to all privacy-related inquiries within 30 days.`,
  },
];

export default function PrivacyScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
          testID="privacy-close-btn"
        >
          <X size={20} color={Colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>Privacy Policy</Text>
          <Text style={styles.bannerSubtitle}>
            Effective Date: {EFFECTIVE_DATE}
          </Text>
          <View style={styles.bannerDivider} />
          <Text style={styles.bannerNote}>
            {APP_NAME} is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
          </Text>
        </View>

        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <View style={styles.footerAccent} />
          <Text style={styles.footerText}>
            Last Updated: {EFFECTIVE_DATE}
          </Text>
          <Text style={styles.footerSub}>
            {COMPANY_NAME} — All Rights Reserved
          </Text>
          <Text style={styles.footerDisclaimer}>
            Your privacy matters to us. We are committed to transparency and protecting your data.
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
    gap: 10,
  },
  bannerCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cyan + '30',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.cyan,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.text2,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: Colors.cyan + '20',
    marginBottom: 12,
  },
  bannerNote: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionBody: {
    fontSize: 13,
    color: Colors.text2,
    lineHeight: 21,
  },
  footerCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  footerAccent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.cyan,
    opacity: 0.5,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.3,
  },
  footerSub: {
    fontSize: 12,
    color: Colors.text3,
    marginTop: 4,
  },
  footerDisclaimer: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
