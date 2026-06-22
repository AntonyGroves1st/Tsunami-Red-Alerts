import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@/hooks/useNavigation';
import {
  X,
  Copy,
  CheckCircle,
  ExternalLink,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Webhook,
  Bell,
  Send,
  Shield,
  Globe,
  AlertTriangle,
  Play,
  CircleDot,
  Radio,
  RefreshCw,
} from 'lucide-react-native';
import { UniversalClipboard } from '@/utils/clipboard';
import { Haptics } from '@/utils/haptics';
import { Colors } from '@/constants/colors';
import { safeFetch, safeFetchWithRetry } from '@/utils/safeFetch';

type StepStatus = 'pending' | 'active' | 'done';

interface SetupStep {
  id: string;
  number: number;
  title: string;
  subtitle: string;
}

const STEPS: SetupStep[] = [
  { id: 'webhook-url', number: 1, title: 'Copy Your Webhook URL', subtitle: 'This is the URL TradingView will POST alerts to' },
  { id: 'tv-alert', number: 2, title: 'Create a TradingView Alert', subtitle: 'Set up an alert on any chart in TradingView' },
  { id: 'configure', number: 3, title: 'Configure the Webhook', subtitle: 'Paste the URL and set the JSON payload' },
  { id: 'test', number: 4, title: 'Test the Connection', subtitle: 'Verify alerts are received by your app' },
];

const TV_PAYLOAD_SIMPLE = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "time": "{{time}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}"
}`;

const TV_PAYLOAD_ADVANCED = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "open": {{open}},
  "high": {{high}},
  "low": {{low}},
  "volume": {{volume}},
  "time": "{{time}}",
  "timenow": "{{timenow}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}",
  "strategy": "EmperialBot",
  "message": "{{strategy.order.comment}}"
}`;

const TV_PAYLOAD_BOT = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "contracts": "{{strategy.order.contracts}}",
  "price": {{close}},
  "position_size": "{{strategy.position_size}}",
  "prev_market_position": "{{strategy.prev_market_position}}",
  "market_position": "{{strategy.market_position}}",
  "time": "{{timenow}}",
  "source": "TradingView",
  "bot": "EmperialBot"
}`;

function getWebhookUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/tv-webhook';
  return `${base}/api/tv-webhook`;
}

function getTestUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/tv-webhook/test';
  return `${base}/api/tv-webhook/test`;
}

function getHistoryUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/tv-webhook/history';
  return `${base}/api/tv-webhook/history?limit=5`;
}

interface ReceivedAlert {
  id: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

function StepIndicator({ number, status }: { number: number; status: StepStatus }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'active') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [status, pulseAnim]);

  const bg = status === 'done' ? Colors.green : status === 'active' ? Colors.amber : Colors.bg3;
  const textColor = status === 'done' ? Colors.white : status === 'active' ? Colors.bg0 : Colors.text3;

  return (
    <Animated.View style={[st.stepDot, { backgroundColor: bg, opacity: status === 'active' ? pulseAnim : 1 }]}>
      {status === 'done' ? (
        <CheckCircle size={14} color={Colors.white} />
      ) : (
        <Text style={[st.stepDotText, { color: textColor }]}>{number}</Text>
      )}
    </Animated.View>
  );
}

function CopyableBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    try {
      await UniversalClipboard.setStringAsync(value);
      setCopied(true);
      Haptics.notification('success');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.log('[Clipboard] Copy failed:', e);
    }
  }, [value]);

  return (
    <View style={st.copyBlock}>
      <View style={st.copyBlockHeader}>
        <Text style={st.copyBlockLabel}>{label}</Text>
        <Pressable style={st.copyBtn} onPress={handleCopy}>
          {copied ? (
            <>
              <CheckCircle size={12} color={Colors.green} />
              <Text style={[st.copyBtnText, { color: Colors.green }]}>Copied!</Text>
            </>
          ) : (
            <>
              <Copy size={12} color={Colors.cyan} />
              <Text style={st.copyBtnText}>Copy</Text>
            </>
          )}
        </Pressable>
      </View>
      <View style={st.copyBlockBody}>
        <Text style={[st.copyBlockValue, mono && st.monoText]} selectable>{value}</Text>
      </View>
    </View>
  );
}

function PayloadTab({ tabs }: { tabs: { label: string; payload: string }[] }) {
  const [active, setActive] = useState<number>(0);

  return (
    <View>
      <View style={st.payloadTabs}>
        {tabs.map((tab, idx) => (
          <Pressable
            key={tab.label}
            style={[st.payloadTab, active === idx && st.payloadTabActive]}
            onPress={() => setActive(idx)}
          >
            <Text style={[st.payloadTabText, active === idx && st.payloadTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <CopyableBlock label="JSON Payload" value={tabs[active].payload} mono />
    </View>
  );
}

export default function TradingViewSetupScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [recentAlerts, setRecentAlerts] = useState<ReceivedAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);

  const webhookUrl = getWebhookUrl();

  const getStepStatus = useCallback((idx: number): StepStatus => {
    if (idx < currentStep) return 'done';
    if (idx === currentStep) return 'active';
    return 'pending';
  }, [currentStep]);

  const markStepDone = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    setExpandedStep(prev => Math.min(prev + 1, STEPS.length - 1));
    Haptics.notification('success');
  }, []);

  const handleTest = useCallback(async () => {
    setTestLoading(true);
    setTestResult(null);
    setTestMessage('');
    const result = await safeFetchWithRetry(getTestUrl(), { method: 'GET', maxRetries: 2 });
    if (result.ok) {
      setTestResult('success');
      setTestMessage(result.data?.message ?? 'Endpoint is live!');
      console.log('[TV-Setup] Test success:', result.data);
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Connection failed');
      console.log('[TV-Setup] Test error:', result.error);
    }
    setTestLoading(false);
  }, []);

  const handleSendTestAlert = useCallback(async () => {
    setTestLoading(true);
    const result = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'BTCUSDT',
        action: 'buy',
        price: 69420,
        time: new Date().toISOString(),
        exchange: 'BINANCE',
        interval: '5',
        source: 'EmperialBot Test',
      }),
    });
    if (result.ok) {
      setTestResult('success');
      setTestMessage('Test alert sent and received!');
      Haptics.notification('success');
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Failed to send');
    }
    setTestLoading(false);
  }, [webhookUrl]);

  const fetchAlertHistory = useCallback(async () => {
    setAlertsLoading(true);
    const result = await safeFetch(getHistoryUrl(), { method: 'GET' });
    if (result.ok && result.data?.alerts) {
      setRecentAlerts(result.data.alerts);
      console.log('[TV-Setup] Fetched', result.data.alerts.length, 'alerts');
    } else {
      console.log('[TV-Setup] History fetch error:', result.error);
    }
    setAlertsLoading(false);
  }, []);

  const toggleStep = useCallback((idx: number) => {
    setExpandedStep(prev => prev === idx ? -1 : idx);
    Haptics.impact('light');
  }, []);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.tvBadge}>
            <Text style={st.tvBadgeText}>TV</Text>
          </View>
          <View>
            <Text style={st.headerTitle}>TradingView Setup</Text>
            <Text style={st.headerSub}>Connect alerts & bot signals</Text>
          </View>
        </View>
        <Pressable
          style={st.closeBtn}
          onPress={() => goBack()}
          hitSlop={12}
        >
          <X size={20} color={Colors.text2} />
        </Pressable>
      </View>

      <View style={st.progressBar}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <StepIndicator number={step.number} status={getStepStatus(idx)} />
            {idx < STEPS.length - 1 && (
              <View style={[st.progressLine, { backgroundColor: idx < currentStep ? Colors.green : Colors.bg3 }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {STEPS.map((step, idx) => {
          const status = getStepStatus(idx);
          const isExpanded = expandedStep === idx;

          return (
            <View key={step.id} style={[st.stepCard, status === 'done' && st.stepCardDone]}>
              <Pressable style={st.stepCardHeader} onPress={() => toggleStep(idx)}>
                <View style={st.stepCardLeft}>
                  <View style={[st.stepNumberBadge, {
                    backgroundColor: status === 'done' ? Colors.green + '15' : status === 'active' ? Colors.amber + '15' : Colors.bg3,
                  }]}>
                    {status === 'done' ? (
                      <CheckCircle size={14} color={Colors.green} />
                    ) : (
                      <Text style={[st.stepNumberText, {
                        color: status === 'active' ? Colors.amber : Colors.text3,
                      }]}>{step.number}</Text>
                    )}
                  </View>
                  <View style={st.stepCardTitleArea}>
                    <Text style={[st.stepCardTitle, status === 'done' && { color: Colors.green }]}>{step.title}</Text>
                    <Text style={st.stepCardSub}>{step.subtitle}</Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={16} color={Colors.text2} />
                ) : (
                  <ChevronDown size={16} color={Colors.text2} />
                )}
              </Pressable>

              {isExpanded && idx === 0 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    This is your unique webhook URL. TradingView will send POST requests here whenever an alert fires.
                  </Text>
                  <CopyableBlock label="Webhook URL" value={webhookUrl} mono />
                  <View style={st.tipCard}>
                    <Shield size={12} color={Colors.amber} />
                    <Text style={st.tipText}>
                      Keep this URL private. Anyone with it can send alerts to your app.
                    </Text>
                  </View>
                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've copied the URL</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 1 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>In TradingView, follow these steps:</Text>

                  <View style={st.instructionList}>
                    <InstructionItem number="1" text='Open any chart and click the "Alert" button (clock icon in the right toolbar), or press Alt+A' />
                    <InstructionItem number="2" text='Set your alert condition (e.g., BTCUSDT crossing above 70000, or a Pine Script strategy signal)' />
                    <InstructionItem number="3" text='Set "Alert actions" — check the "Webhook URL" option' />
                    <InstructionItem number="4" text="You'll be asked for the webhook URL in the next step" />
                  </View>

                  <Pressable
                    style={st.linkBtn}
                    onPress={() => Linking.openURL('https://www.tradingview.com/chart/').catch(console.log)}
                  >
                    <ExternalLink size={13} color={Colors.cyan} />
                    <Text style={st.linkBtnText}>Open TradingView Charts</Text>
                  </Pressable>

                  <View style={st.tipCard}>
                    <AlertTriangle size={12} color={Colors.amber} />
                    <Text style={st.tipText}>
                      Webhook alerts require a TradingView Pro, Pro+, or Premium plan.
                    </Text>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've created my alert</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 2 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    In the alert dialog, paste the webhook URL and set the message body:
                  </Text>

                  <View style={st.instructionList}>
                    <InstructionItem number="1" text='In the "Notifications" tab, check "Webhook URL"' />
                    <InstructionItem number="2" text="Paste the webhook URL you copied in Step 1" />
                    <InstructionItem number="3" text='Under "Message", replace the default text with one of the JSON payloads below' />
                    <InstructionItem number="4" text='Click "Create" to save the alert' />
                  </View>

                  <CopyableBlock label="Webhook URL (paste this)" value={webhookUrl} mono />

                  <Text style={st.sectionLabel}>ALERT MESSAGE PAYLOAD</Text>
                  <Text style={st.sectionSub}>Choose a template and paste it into the "Message" field:</Text>

                  <PayloadTab tabs={[
                    { label: 'Simple', payload: TV_PAYLOAD_SIMPLE },
                    { label: 'Detailed', payload: TV_PAYLOAD_ADVANCED },
                    { label: 'Bot Mode', payload: TV_PAYLOAD_BOT },
                  ]} />

                  <View style={st.variableRef}>
                    <Text style={st.variableRefTitle}>TradingView Variables Reference</Text>
                    <View style={st.variableGrid}>
                      <VariableItem name="{{ticker}}" desc="Symbol name" />
                      <VariableItem name="{{close}}" desc="Current price" />
                      <VariableItem name="{{exchange}}" desc="Exchange name" />
                      <VariableItem name="{{interval}}" desc="Chart timeframe" />
                      <VariableItem name="{{time}}" desc="Bar timestamp" />
                      <VariableItem name="{{volume}}" desc="Current volume" />
                      <VariableItem name="{{strategy.order.action}}" desc="buy/sell" />
                      <VariableItem name="{{strategy.position_size}}" desc="Position size" />
                    </View>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've configured the webhook</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 3 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    Verify the connection is working by testing the endpoint and checking for received alerts.
                  </Text>

                  <View style={st.testSection}>
                    <Text style={st.testLabel}>1. Check endpoint is live</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleTest}
                      disabled={testLoading}
                    >
                      {testLoading ? (
                        <ActivityIndicator size="small" color={Colors.cyan} />
                      ) : (
                        <Globe size={14} color={Colors.cyan} />
                      )}
                      <Text style={st.testBtnText}>Ping Endpoint</Text>
                    </Pressable>

                    {testResult && (
                      <View style={[st.testResultCard, {
                        borderColor: testResult === 'success' ? Colors.green + '30' : Colors.red + '30',
                        backgroundColor: testResult === 'success' ? Colors.green + '08' : Colors.red + '08',
                      }]}>
                        {testResult === 'success' ? (
                          <CheckCircle size={14} color={Colors.green} />
                        ) : (
                          <AlertTriangle size={14} color={Colors.red} />
                        )}
                        <Text style={[st.testResultText, {
                          color: testResult === 'success' ? Colors.green : Colors.red,
                        }]}>{testMessage}</Text>
                      </View>
                    )}
                  </View>

                  <View style={st.testSection}>
                    <Text style={st.testLabel}>2. Send a simulated alert</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleSendTestAlert}
                      disabled={testLoading}
                    >
                      <Send size={14} color={Colors.amber} />
                      <Text style={[st.testBtnText, { color: Colors.amber }]}>Send Test Alert</Text>
                    </Pressable>
                  </View>

                  <View style={st.testSection}>
                    <View style={st.testLabelRow}>
                      <Text style={st.testLabel}>3. Recent received alerts</Text>
                      <Pressable style={st.refreshBtn} onPress={fetchAlertHistory}>
                        {alertsLoading ? (
                          <ActivityIndicator size="small" color={Colors.cyan} />
                        ) : (
                          <RefreshCw size={13} color={Colors.cyan} />
                        )}
                      </Pressable>
                    </View>

                    {recentAlerts.length === 0 ? (
                      <View style={st.emptyAlerts}>
                        <Radio size={20} color={Colors.text3} />
                        <Text style={st.emptyAlertsText}>
                          No alerts received yet. Trigger an alert from TradingView or send a test above.
                        </Text>
                        <Pressable style={st.refreshSmallBtn} onPress={fetchAlertHistory}>
                          <RefreshCw size={12} color={Colors.cyan} />
                          <Text style={st.refreshSmallText}>Refresh</Text>
                        </Pressable>
                      </View>
                    ) : (
                      recentAlerts.map((alert) => (
                        <View key={alert.id} style={st.alertCard}>
                          <View style={st.alertCardHeader}>
                            <View style={st.alertDot} />
                            <Text style={st.alertTime}>
                              {new Date(alert.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Text>
                            <Text style={st.alertId}>#{alert.id}</Text>
                          </View>
                          <View style={st.alertPayload}>
                            <Text style={st.alertPayloadText} numberOfLines={4}>
                              {JSON.stringify(alert.payload, null, 2)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>Setup Complete!</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {currentStep >= STEPS.length && (
          <View style={st.successCard}>
            <View style={st.successIcon}>
              <CheckCircle size={32} color={Colors.green} />
            </View>
            <Text style={st.successTitle}>You're all set!</Text>
            <Text style={st.successSub}>
              TradingView alerts will now POST to your Emperial Bot webhook. Alerts appear in the Bot dashboard and can trigger automated trades.
            </Text>
            <View style={st.successActions}>
              <Pressable
                style={st.successBtn}
                onPress={() => { switchTab('bot'); }}
              >
                <Zap size={14} color={Colors.bg0} />
                <Text style={st.successBtnText}>Go to Bot Dashboard</Text>
              </Pressable>
              <Pressable
                style={st.successBtnSecondary}
                onPress={() => { goBack(); switchTab('signals'); }}
              >
                <Bell size={14} color={Colors.amber} />
                <Text style={st.successBtnSecondaryText}>View Signals</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={st.faqSection}>
          <Text style={st.faqTitle}>Frequently Asked Questions</Text>
          <FAQItem
            question="Do I need a paid TradingView plan?"
            answer="Yes. Webhook alerts are only available on TradingView Pro, Pro+, and Premium plans. The free plan does not support webhooks."
          />
          <FAQItem
            question="Can I send alerts from Pine Script strategies?"
            answer="Absolutely. When your Pine Script strategy fires an order, TradingView will POST the alert message to the webhook URL. Use the Bot Mode payload template for strategy signals."
          />
          <FAQItem
            question="How fast are webhook alerts delivered?"
            answer="TradingView typically delivers webhook alerts within 1-3 seconds of the condition being met. Network latency may add additional delay."
          />
          <FAQItem
            question="Can I use multiple alerts with one webhook?"
            answer="Yes. You can create unlimited alerts pointing to the same webhook URL. Each alert will POST independently. Use the ticker and action fields to differentiate them in the bot."
          />
          <FAQItem
            question="What happens if the webhook is down?"
            answer="TradingView does not retry failed webhook deliveries. If the endpoint is temporarily unavailable, that alert will be lost. Consider using redundant alert channels (e.g., email + webhook)."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InstructionItem({ number, text }: { number: string; text: string }) {
  return (
    <View style={st.instructionItem}>
      <View style={st.instructionDot}>
        <Text style={st.instructionDotText}>{number}</Text>
      </View>
      <Text style={st.instructionText}>{text}</Text>
    </View>
  );
}

function VariableItem({ name, desc }: { name: string; desc: string }) {
  return (
    <View style={st.variableItem}>
      <Text style={st.variableName}>{name}</Text>
      <Text style={st.variableDesc}>{desc}</Text>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Pressable style={st.faqItem} onPress={() => setOpen(!open)}>
      <View style={st.faqHeader}>
        <Text style={st.faqQuestion}>{question}</Text>
        {open ? <ChevronUp size={14} color={Colors.text2} /> : <ChevronDown size={14} color={Colors.text2} />}
      </View>
      {open && <Text style={st.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tvBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2962FF18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2962FF30',
  },
  tvBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#2962FF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 0,
  },
  progressLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  stepCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepCardDone: {
    borderColor: Colors.green + '25',
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  stepCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  stepCardTitleArea: {
    flex: 1,
  },
  stepCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  stepCardSub: {
    fontSize: 10,
    color: Colors.text2,
    marginTop: 1,
  },
  stepBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  instruction: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 14,
  },
  instructionList: {
    gap: 10,
    marginBottom: 14,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 10,
  },
  instructionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  instructionDotText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text2,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  copyBlock: {
    marginBottom: 12,
  },
  copyBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  copyBlockLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.cyan + '10',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  copyBlockBody: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyBlockValue: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.amber + '08',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.amber + '15',
    marginBottom: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: Colors.text2,
    lineHeight: 16,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.green,
    borderRadius: 10,
    paddingVertical: 12,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cyan + '30',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.text2,
    marginBottom: 10,
  },
  payloadTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bg3,
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
  },
  payloadTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  payloadTabActive: {
    backgroundColor: Colors.bg1,
  },
  payloadTabText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text3,
  },
  payloadTabTextActive: {
    color: Colors.amber,
  },
  variableRef: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variableRefTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  variableGrid: {
    gap: 6,
  },
  variableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variableName: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.cyan,
  },
  variableDesc: {
    fontSize: 10,
    color: Colors.text2,
  },
  testSection: {
    marginBottom: 16,
  },
  testLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  testLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  testResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  testResultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyAlertsText: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  refreshSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.cyan + '10',
  },
  refreshSmallText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  alertCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  alertTime: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  alertId: {
    fontSize: 9,
    color: Colors.text3,
    marginLeft: 'auto',
  },
  alertPayload: {
    backgroundColor: Colors.bg0,
    borderRadius: 6,
    padding: 8,
  },
  alertPayloadText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text2,
    lineHeight: 15,
  },
  successCard: {
    backgroundColor: Colors.green + '08',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.green + '20',
    marginTop: 8,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.green,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successActions: {
    gap: 10,
    width: '100%',
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.green,
    borderRadius: 10,
    paddingVertical: 14,
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  successBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.amber + '30',
    borderRadius: 10,
    paddingVertical: 12,
  },
  successBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.amber,
  },
  faqSection: {
    marginTop: 20,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 11,
    color: Colors.text2,
    lineHeight: 17,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
