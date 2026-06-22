import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Platform,
  TextInput,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Link2,
  Unlink,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  Key,
  Globe,
  Server,
  Zap,
  AlertTriangle,
  Info,
  Copy,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react-native';
import { useNavigation } from '@/hooks/useNavigation';
import { Colors } from '@/constants/colors';
import { Haptics } from '@/utils/haptics';
import { UniversalClipboard } from '@/utils/clipboard';

interface BrokerConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  apiKeySet: boolean;
  webhookUrl: string;
  supportedFeatures: string[];
  docsUrl: string;
  color: string;
}

interface ApiKeyForm {
  brokerId: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  passphrase: string;
}

const BROKERS: BrokerConfig[] = [
  {
    id: 'tradingview',
    name: 'TradingView',
    description: 'Receive alerts from TradingView via webhook. Set up alert actions to POST to your webhook URL.',
    logo: 'TV',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Webhook Alerts', 'Pine Script Signals', 'Custom Payloads', 'Multi-Timeframe'],
    docsUrl: 'https://www.tradingview.com/support/solutions/43000529348-about-webhooks/',
    color: '#2962FF',
  },
  {
    id: 'ninjatrader',
    name: 'NinjaTrader',
    description: 'Connect to NinjaTrader via API for automated order execution and strategy management.',
    logo: 'NT',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Order Execution', 'Strategy Automation', 'Market Data', 'Account Management'],
    docsUrl: 'https://ninjatrader.com/support/helpGuides/nt8/en-us/',
    color: '#FF6D00',
  },
  {
    id: 'rprotrader',
    name: 'R Pro Trader',
    description: 'Integrate with R Pro Trader for futures trading automation with custom webhook payloads.',
    logo: 'RP',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Futures Trading', 'Webhook Integration', 'Custom Signals', 'Risk Management'],
    docsUrl: '#',
    color: '#00C853',
  },
  {
    id: 'binance',
    name: 'Binance',
    description: 'Connect to Binance for crypto futures trading. Requires API key with futures trading permissions.',
    logo: 'BN',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Spot Trading', 'Futures Trading', 'Market Data', 'Account Info'],
    docsUrl: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072',
    color: '#F0B90B',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Push trading signals and alerts to Discord channels via webhook integration.',
    logo: 'DC',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Channel Alerts', 'Embedded Messages', 'Role Mentions', 'Rich Formatting'],
    docsUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
    color: '#5865F2',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Send real-time trading alerts to Telegram groups or channels via Bot API.',
    logo: 'TG',
    connected: false,
    status: 'disconnected',
    apiKeySet: false,
    webhookUrl: '',
    supportedFeatures: ['Bot Messages', 'Group Alerts', 'Channel Posts', 'Inline Buttons'],
    docsUrl: 'https://core.telegram.org/bots/api',
    color: '#0088CC',
  },
];

function StatusIndicator({ status }: { status: BrokerConfig['status'] }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connected') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [status, pulseAnim]);

  const color =
    status === 'connected' ? Colors.green :
    status === 'error' ? Colors.red :
    status === 'pending' ? Colors.amber :
    Colors.text3;

  return (
    <Animated.View style={[st.statusDot, { backgroundColor: color, opacity: status === 'connected' ? pulseAnim : 1 }]} />
  );
}

export default function BrokersScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [brokers, setBrokers] = useState<BrokerConfig[]>(BROKERS);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerConfig | null>(null);
  const [form, setForm] = useState<ApiKeyForm>({
    brokerId: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    passphrase: '',
  });
  const [copied, setCopied] = useState<boolean>(false);

  const connectedCount = brokers.filter(b => b.connected).length;

  const webhookEndpoint = 'https://your-app.com/api/webhook/';

  const openConfig = useCallback((broker: BrokerConfig) => {
    setSelectedBroker(broker);
    setForm({
      brokerId: broker.id,
      apiKey: '',
      apiSecret: '',
      webhookUrl: broker.webhookUrl,
      passphrase: '',
    });
    setShowConfigModal(true);
    Haptics.impact('light');
  }, []);

  const handleConnect = useCallback(() => {
    if (!selectedBroker) return;
    setBrokers(prev => prev.map(b =>
      b.id === selectedBroker.id
        ? { ...b, connected: true, status: 'connected' as const, apiKeySet: true, webhookUrl: form.webhookUrl }
        : b
    ));
    setShowConfigModal(false);
    Haptics.notification('success');
  }, [selectedBroker, form]);

  const handleDisconnect = useCallback((brokerId: string) => {
    setBrokers(prev => prev.map(b =>
      b.id === brokerId
        ? { ...b, connected: false, status: 'disconnected' as const, apiKeySet: false, webhookUrl: '' }
        : b
    ));
    Haptics.notification('warning');
  }, []);

  const copyWebhookUrl = useCallback(async (brokerId: string) => {
    try {
      await UniversalClipboard.setStringAsync(`${webhookEndpoint}${brokerId}`);
      setCopied(true);
      Haptics.notification('success');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.log('[Clipboard] Failed:', e);
    }
  }, []);

  const openDocs = useCallback((url: string) => {
    if (url && url !== '#') {
      Linking.openURL(url).catch(console.log);
    }
  }, []);

  const needsApiKey = (id: string) => ['binance', 'ninjatrader'].includes(id);
  const needsWebhook = (id: string) => ['tradingview', 'rprotrader', 'discord', 'telegram'].includes(id);
  const needsPassphrase = (id: string) => ['ninjatrader'].includes(id);

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.headerTitle}>
            Broker<Text style={st.headerAccent}>Connect</Text>
          </Text>
        </View>
        <View style={st.headerBadge}>
          <Link2 size={11} color={connectedCount > 0 ? Colors.green : Colors.text2} />
          <Text style={[st.headerBadgeText, { color: connectedCount > 0 ? Colors.green : Colors.text2 }]}>
            {connectedCount} linked
          </Text>
        </View>
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={st.tvSetupCard}
          onPress={() => {
            navigate('tradingview-setup');
            Haptics.impact('medium');
          }}
        >
          <View style={st.tvSetupInner}>
            <View style={st.tvSetupIcon}>
              <Text style={st.tvSetupIconText}>TV</Text>
            </View>
            <View style={st.tvSetupInfo}>
              <Text style={st.tvSetupTitle}>TradingView Setup Wizard</Text>
              <Text style={st.tvSetupDesc}>Step-by-step guide to connect alerts & bot signals</Text>
            </View>
            <ChevronRight size={16} color="#2962FF" />
          </View>
          <View style={st.tvSetupTags}>
            <View style={st.tvSetupTag}><Text style={st.tvSetupTagText}>Webhook Alerts</Text></View>
            <View style={st.tvSetupTag}><Text style={st.tvSetupTagText}>Pine Script</Text></View>
            <View style={st.tvSetupTag}><Text style={st.tvSetupTagText}>Auto-Trade</Text></View>
          </View>
        </Pressable>

        <Pressable
          style={st.ntSetupCard}
          onPress={() => {
            navigate('ninjatrader-setup');
            Haptics.impact('medium');
          }}
        >
          <View style={st.ntSetupInner}>
            <View style={st.ntSetupIcon}>
              <Text style={st.ntSetupIconText}>NT</Text>
            </View>
            <View style={st.ntSetupInfo}>
              <Text style={st.ntSetupTitle}>NinjaTrader Setup Wizard</Text>
              <Text style={st.ntSetupDesc}>Step-by-step guide to connect orders & strategies</Text>
            </View>
            <ChevronRight size={16} color="#FF6D00" />
          </View>
          <View style={st.ntSetupTags}>
            <View style={st.ntSetupTag}><Text style={st.ntSetupTagText}>Order Execution</Text></View>
            <View style={st.ntSetupTag}><Text style={st.ntSetupTagText}>NinjaScript</Text></View>
            <View style={st.ntSetupTag}><Text style={st.ntSetupTagText}>Auto-Trade</Text></View>
          </View>
        </Pressable>

        <Pressable
          style={st.bnSetupCard}
          onPress={() => {
            navigate('binance-setup');
            Haptics.impact('medium');
          }}
        >
          <View style={st.bnSetupInner}>
            <View style={st.bnSetupIcon}>
              <Text style={st.bnSetupIconText}>BN</Text>
            </View>
            <View style={st.bnSetupInfo}>
              <Text style={st.bnSetupTitle}>Binance Setup Wizard</Text>
              <Text style={st.bnSetupDesc}>Step-by-step guide for Binance & Binance.US</Text>
            </View>
            <ChevronRight size={16} color="#F0B90B" />
          </View>
          <View style={st.bnSetupTags}>
            <View style={st.bnSetupTag}><Text style={st.bnSetupTagText}>Spot Trading</Text></View>
            <View style={st.bnSetupTag}><Text style={st.bnSetupTagText}>Futures</Text></View>
            <View style={st.bnSetupTag}><Text style={st.bnSetupTagText}>API Keys</Text></View>
          </View>
        </Pressable>

        <View style={st.infoCard}>
          <Info size={14} color={Colors.cyan} />
          <View style={st.infoContent}>
            <Text style={st.infoTitle}>How Broker Integration Works</Text>
            <Text style={st.infoText}>
              Connect your brokers to receive signals and execute trades automatically. 
              Webhook-based brokers receive POST requests when signals fire. 
              API-based brokers can execute orders directly.
            </Text>
          </View>
        </View>

        <Pressable
          style={st.arbitrageCard}
          onPress={() => {
            navigate('brokers-arbitrage');
            Haptics.impact('medium');
          }}
        >
          <View style={st.arbitrageCardInner}>
            <View style={st.arbitrageIcon}>
              <ArrowLeftRight size={20} color={Colors.amber} />
            </View>
            <View style={st.arbitrageInfo}>
              <Text style={st.arbitrageTitle}>Arbitrage Scanner</Text>
              <Text style={st.arbitrageDesc}>Find price differences across connected platforms</Text>
            </View>
            <ChevronRight size={16} color={Colors.amber} />
          </View>
          <View style={st.arbitrageTags}>
            <View style={st.arbitrageTag}><Text style={st.arbitrageTagText}>Cross-Exchange</Text></View>
            <View style={st.arbitrageTag}><Text style={st.arbitrageTagText}>Spot vs Futures</Text></View>
            <View style={st.arbitrageTag}><Text style={st.arbitrageTagText}>Live Prices</Text></View>
          </View>
        </Pressable>

        <Text style={st.sectionLabel}>TRADING PLATFORMS</Text>
        {brokers.filter(b => ['tradingview', 'ninjatrader', 'rprotrader', 'binance'].includes(b.id)).map((broker) => (
          <Pressable
            key={broker.id}
            style={[st.brokerCard, broker.connected && { borderColor: broker.color + '30' }]}
            onPress={() => openConfig(broker)}
          >
            <View style={st.brokerCardTop}>
              <View style={[st.brokerLogo, { backgroundColor: broker.color + '18' }]}>
                <Text style={[st.brokerLogoText, { color: broker.color }]}>{broker.logo}</Text>
              </View>
              <View style={st.brokerInfo}>
                <View style={st.brokerNameRow}>
                  <Text style={st.brokerName}>{broker.name}</Text>
                  <StatusIndicator status={broker.status} />
                </View>
                <Text style={st.brokerDesc} numberOfLines={2}>{broker.description}</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </View>

            <View style={st.featureRow}>
              {broker.supportedFeatures.slice(0, 3).map((feat) => (
                <View key={feat} style={st.featureTag}>
                  <Text style={st.featureTagText}>{feat}</Text>
                </View>
              ))}
              {broker.supportedFeatures.length > 3 && (
                <View style={st.featureTag}>
                  <Text style={st.featureTagText}>+{broker.supportedFeatures.length - 3}</Text>
                </View>
              )}
            </View>

            {broker.connected && (
              <View style={st.connectedBar}>
                <CheckCircle size={11} color={Colors.green} />
                <Text style={st.connectedText}>Connected</Text>
                <Pressable
                  style={st.disconnectBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleDisconnect(broker.id);
                  }}
                >
                  <Unlink size={10} color={Colors.red} />
                  <Text style={st.disconnectText}>Disconnect</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        ))}

        <Text style={[st.sectionLabel, { marginTop: 20 }]}>NOTIFICATION CHANNELS</Text>
        {brokers.filter(b => ['discord', 'telegram'].includes(b.id)).map((broker) => (
          <Pressable
            key={broker.id}
            style={[st.brokerCard, broker.connected && { borderColor: broker.color + '30' }]}
            onPress={() => openConfig(broker)}
          >
            <View style={st.brokerCardTop}>
              <View style={[st.brokerLogo, { backgroundColor: broker.color + '18' }]}>
                <Text style={[st.brokerLogoText, { color: broker.color }]}>{broker.logo}</Text>
              </View>
              <View style={st.brokerInfo}>
                <View style={st.brokerNameRow}>
                  <Text style={st.brokerName}>{broker.name}</Text>
                  <StatusIndicator status={broker.status} />
                </View>
                <Text style={st.brokerDesc} numberOfLines={2}>{broker.description}</Text>
              </View>
              <ChevronRight size={16} color={Colors.text3} />
            </View>

            <View style={st.featureRow}>
              {broker.supportedFeatures.slice(0, 3).map((feat) => (
                <View key={feat} style={st.featureTag}>
                  <Text style={st.featureTagText}>{feat}</Text>
                </View>
              ))}
            </View>

            {broker.connected && (
              <View style={st.connectedBar}>
                <CheckCircle size={11} color={Colors.green} />
                <Text style={st.connectedText}>Connected</Text>
                <Pressable
                  style={st.disconnectBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleDisconnect(broker.id);
                  }}
                >
                  <Unlink size={10} color={Colors.red} />
                  <Text style={st.disconnectText}>Disconnect</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        ))}

        <View style={st.webhookSection}>
          <View style={st.webhookHeader}>
            <Server size={13} color={Colors.cyan} />
            <Text style={st.webhookTitle}>YOUR WEBHOOK ENDPOINT</Text>
          </View>
          <Text style={st.webhookDesc}>
            Use this URL in your broker's webhook settings to receive signals in this app.
          </Text>
          <View style={st.webhookUrlBox}>
            <Text style={st.webhookUrlText} numberOfLines={1}>
              {webhookEndpoint}{'<broker_id>'}
            </Text>
            <Pressable
              style={st.webhookCopyBtn}
              onPress={() => copyWebhookUrl('signals')}
            >
              {copied ? (
                <CheckCircle size={14} color={Colors.green} />
              ) : (
                <Copy size={14} color={Colors.cyan} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showConfigModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBroker && (
                <>
                  <View style={st.modalHeader}>
                    <View style={[st.modalLogo, { backgroundColor: selectedBroker.color + '18' }]}>
                      <Text style={[st.modalLogoText, { color: selectedBroker.color }]}>{selectedBroker.logo}</Text>
                    </View>
                    <View>
                      <Text style={st.modalTitle}>{selectedBroker.name}</Text>
                      <Text style={st.modalSubtitle}>
                        {selectedBroker.connected ? 'Connected' : 'Configure Integration'}
                      </Text>
                    </View>
                  </View>

                  {needsApiKey(selectedBroker.id) && (
                    <>
                      <Text style={st.fieldLabel}>API Key</Text>
                      <View style={st.inputRow}>
                        <Key size={14} color={Colors.text2} />
                        <TextInput
                          style={st.input}
                          value={form.apiKey}
                          onChangeText={(v) => setForm(f => ({ ...f, apiKey: v }))}
                          placeholder="Enter your API key"
                          placeholderTextColor={Colors.text3}
                          autoCapitalize="none"
                          autoCorrect={false}
                          secureTextEntry
                        />
                      </View>

                      <Text style={st.fieldLabel}>API Secret</Text>
                      <View style={st.inputRow}>
                        <Shield size={14} color={Colors.text2} />
                        <TextInput
                          style={st.input}
                          value={form.apiSecret}
                          onChangeText={(v) => setForm(f => ({ ...f, apiSecret: v }))}
                          placeholder="Enter your API secret"
                          placeholderTextColor={Colors.text3}
                          autoCapitalize="none"
                          autoCorrect={false}
                          secureTextEntry
                        />
                      </View>
                    </>
                  )}

                  {needsPassphrase(selectedBroker.id) && (
                    <>
                      <Text style={st.fieldLabel}>Passphrase</Text>
                      <View style={st.inputRow}>
                        <Shield size={14} color={Colors.text2} />
                        <TextInput
                          style={st.input}
                          value={form.passphrase}
                          onChangeText={(v) => setForm(f => ({ ...f, passphrase: v }))}
                          placeholder="Enter passphrase"
                          placeholderTextColor={Colors.text3}
                          autoCapitalize="none"
                          autoCorrect={false}
                          secureTextEntry
                        />
                      </View>
                    </>
                  )}

                  {needsWebhook(selectedBroker.id) && (
                    <>
                      <Text style={st.fieldLabel}>Webhook URL</Text>
                      <View style={st.inputRow}>
                        <Globe size={14} color={Colors.text2} />
                        <TextInput
                          style={st.input}
                          value={form.webhookUrl}
                          onChangeText={(v) => setForm(f => ({ ...f, webhookUrl: v }))}
                          placeholder={
                            selectedBroker.id === 'discord' ? 'https://discord.com/api/webhooks/...' :
                            selectedBroker.id === 'telegram' ? 'https://api.telegram.org/bot.../sendMessage' :
                            'https://...'
                          }
                          placeholderTextColor={Colors.text3}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </>
                  )}

                  <View style={st.featuresSection}>
                    <Text style={st.featuresTitle}>Supported Features</Text>
                    <View style={st.featuresGrid}>
                      {selectedBroker.supportedFeatures.map((feat) => (
                        <View key={feat} style={st.featureItem}>
                          <CheckCircle size={10} color={Colors.green} />
                          <Text style={st.featureItemText}>{feat}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {selectedBroker.docsUrl !== '#' && (
                    <Pressable
                      style={st.docsBtn}
                      onPress={() => openDocs(selectedBroker.docsUrl)}
                    >
                      <ExternalLink size={12} color={Colors.cyan} />
                      <Text style={st.docsBtnText}>View Documentation</Text>
                    </Pressable>
                  )}

                  <View style={st.warningBox}>
                    <AlertTriangle size={12} color={Colors.amber} />
                    <Text style={st.warningText}>
                      API keys are stored locally on your device. Never share your API keys or secrets with anyone.
                    </Text>
                  </View>

                  <View style={st.modalButtons}>
                    <Pressable style={st.cancelBtn} onPress={() => setShowConfigModal(false)}>
                      <Text style={st.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[st.connectBtn, { backgroundColor: selectedBroker.color }]}
                      onPress={handleConnect}
                    >
                      <Link2 size={14} color={Colors.white} />
                      <Text style={st.connectBtnText}>
                        {selectedBroker.connected ? 'Update' : 'Connect'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerAccent: {
    color: Colors.cyan,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cyan + '08',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cyan + '15',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.cyan,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  brokerCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brokerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brokerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerLogoText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  brokerInfo: {
    flex: 1,
  },
  brokerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brokerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  brokerDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 3,
    lineHeight: 17,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  featureTag: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featureTagText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600' as const,
  },
  connectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  connectedText: {
    fontSize: 12,
    color: Colors.green,
    fontWeight: '600' as const,
    flex: 1,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.red + '10',
    borderWidth: 1,
    borderColor: Colors.red + '20',
  },
  disconnectText: {
    fontSize: 12,
    color: Colors.red,
    fontWeight: '600' as const,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  webhookSection: {
    marginTop: 20,
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cyan + '15',
  },
  webhookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  webhookTitle: {
    fontSize: 10,
    color: Colors.cyan,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  webhookDesc: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
    marginBottom: 10,
  },
  webhookUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webhookUrlText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  webhookCopyBtn: {
    padding: 4,
    marginLeft: 8,
  },
  arbitrageCard: {
    backgroundColor: Colors.amber + '08',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.amber + '20',
  },
  arbitrageCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arbitrageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.amber + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arbitrageInfo: {
    flex: 1,
  },
  arbitrageTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  arbitrageDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  arbitrageTags: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  arbitrageTag: {
    backgroundColor: Colors.amber + '10',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  arbitrageTagText: {
    fontSize: 11,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.bg1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoText: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text2,
    marginBottom: 5,
    marginTop: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  featuresSection: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  featuresGrid: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureItemText: {
    fontSize: 13,
    color: Colors.text,
  },
  docsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cyan + '30',
    marginTop: 16,
  },
  docsBtnText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600' as const,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.amber + '08',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.amber + '15',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 17,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  connectBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  tvSetupCard: {
    backgroundColor: '#2962FF08',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2962FF20',
  },
  tvSetupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tvSetupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2962FF18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tvSetupIconText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#2962FF',
  },
  tvSetupInfo: {
    flex: 1,
  },
  tvSetupTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#2962FF',
  },
  tvSetupDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  tvSetupTags: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  tvSetupTag: {
    backgroundColor: '#2962FF10',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tvSetupTagText: {
    fontSize: 11,
    color: '#2962FF',
    fontWeight: '600' as const,
  },
  ntSetupCard: {
    backgroundColor: '#FF6D0008',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6D0020',
  },
  ntSetupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ntSetupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF6D0018',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ntSetupIconText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FF6D00',
  },
  ntSetupInfo: {
    flex: 1,
  },
  ntSetupTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FF6D00',
  },
  ntSetupDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  ntSetupTags: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  ntSetupTag: {
    backgroundColor: '#FF6D0010',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ntSetupTagText: {
    fontSize: 11,
    color: '#FF6D00',
    fontWeight: '600' as const,
  },
  bnSetupCard: {
    backgroundColor: '#F0B90B08',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0B90B20',
  },
  bnSetupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bnSetupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0B90B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bnSetupIconText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#F0B90B',
  },
  bnSetupInfo: {
    flex: 1,
  },
  bnSetupTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F0B90B',
  },
  bnSetupDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  bnSetupTags: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  bnSetupTag: {
    backgroundColor: '#F0B90B10',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bnSetupTagText: {
    fontSize: 11,
    color: '#F0B90B',
    fontWeight: '600' as const,
  },
});
