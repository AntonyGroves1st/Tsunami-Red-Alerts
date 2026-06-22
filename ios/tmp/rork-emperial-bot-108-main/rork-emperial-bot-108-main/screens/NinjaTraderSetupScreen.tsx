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
  ChevronDown,
  ChevronUp,
  Bell,
  Send,
  Shield,
  Globe,
  AlertTriangle,
  Radio,
  RefreshCw,
  Terminal,
  FileCode,
  Settings,
  Server,
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

const NT_COLOR = '#FF6D00';

const STEPS: SetupStep[] = [
  { id: 'webhook-url', number: 1, title: 'Copy Your Webhook URL', subtitle: 'This is the URL NinjaTrader will POST alerts to' },
  { id: 'nt-setup', number: 2, title: 'Configure NinjaTrader', subtitle: 'Set up the webhook connection in NinjaTrader 8' },
  { id: 'payload', number: 3, title: 'Set Up the Payload', subtitle: 'Configure the JSON message format for orders' },
  { id: 'test', number: 4, title: 'Test the Connection', subtitle: 'Verify alerts are received by your app' },
];

const NT_PAYLOAD_MARKET = `{
  "instrument": "ES 03-26",
  "action": "BUY",
  "orderType": "MARKET",
  "quantity": 1,
  "price": 0,
  "timestamp": "${new Date().toISOString()}",
  "source": "NinjaTrader",
  "strategy": "EmperialBot",
  "account": "Sim101"
}`;

const NT_PAYLOAD_LIMIT = `{
  "instrument": "NQ 03-26",
  "action": "SELL",
  "orderType": "LIMIT",
  "quantity": 2,
  "price": 18500.00,
  "stopPrice": 0,
  "timestamp": "${new Date().toISOString()}",
  "source": "NinjaTrader",
  "strategy": "EmperialBot",
  "account": "Sim101",
  "tif": "GTC"
}`;

const NT_PAYLOAD_STOP = `{
  "instrument": "ES 03-26",
  "action": "BUY",
  "orderType": "STOP_MARKET",
  "quantity": 1,
  "price": 0,
  "stopPrice": 5250.00,
  "timestamp": "${new Date().toISOString()}",
  "source": "NinjaTrader",
  "strategy": "EmperialBot",
  "account": "Sim101",
  "oco": "OCO-001"
}`;

const NT_NINJASCRIPT = `// NinjaScript Strategy snippet — place in OnBarUpdate()
// Sends webhook POST when a signal fires

if (CrossAbove(SMA(14), SMA(50), 1))
{
    string url = "YOUR_WEBHOOK_URL";
    string json = "{"
        + "\\"instrument\\": \\"" + Instrument.FullName + "\\","
        + "\\"action\\": \\"BUY\\","
        + "\\"orderType\\": \\"MARKET\\","
        + "\\"quantity\\": " + DefaultQuantity + ","
        + "\\"price\\": " + Close[0] + ","
        + "\\"timestamp\\": \\"" + DateTime.UtcNow.ToString("o") + "\\","
        + "\\"source\\": \\"NinjaTrader\\","
        + "\\"strategy\\": \\"" + Name + "\\","
        + "\\"account\\": \\"" + Account.Name + "\\""
        + "}";

    using (var client = new System.Net.WebClient())
    {
        client.Headers[System.Net.HttpRequestHeader.ContentType] = "application/json";
        client.UploadString(url, json);
    }
}`;

const NT_ADDON_SNIPPET = `// NinjaTrader Add-On: Webhook Sender
// Place in a custom Add-On's OnStateChange or event handler

protected override void OnStateChange()
{
    if (State == State.SetDefaults)
    {
        Description = "Sends webhook alerts to EmperialBot";
        Name = "EmperialBotWebhook";
    }
}

public void SendAlert(string instrument, string action, 
    double price, int qty, string strategy)
{
    string url = "YOUR_WEBHOOK_URL";
    string json = "{"
        + "\\"instrument\\": \\"" + instrument + "\\","
        + "\\"action\\": \\"" + action + "\\","
        + "\\"orderType\\": \\"MARKET\\","
        + "\\"quantity\\": " + qty + ","
        + "\\"price\\": " + price + ","
        + "\\"timestamp\\": \\"" + DateTime.UtcNow.ToString("o") + "\\","
        + "\\"source\\": \\"NinjaTrader\\","
        + "\\"strategy\\": \\"" + strategy + "\\""
        + "}";

    Task.Run(() => {
        using (var client = new System.Net.WebClient())
        {
            client.Headers["Content-Type"] = "application/json";
            client.UploadString(url, json);
        }
    });
}`;

function getNtWebhookUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/nt-webhook';
  return `${base}/api/nt-webhook`;
}

function getNtTestUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/nt-webhook/test';
  return `${base}/api/nt-webhook/test`;
}

function getNtHistoryUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/nt-webhook/history';
  return `${base}/api/nt-webhook/history?limit=5`;
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

  const bg = status === 'done' ? Colors.green : status === 'active' ? NT_COLOR : Colors.bg3;
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
              <Copy size={12} color={NT_COLOR} />
              <Text style={[st.copyBtnText, { color: NT_COLOR }]}>Copy</Text>
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

export default function NinjaTraderSetupScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [recentAlerts, setRecentAlerts] = useState<ReceivedAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);

  const webhookUrl = getNtWebhookUrl();

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
    const result = await safeFetchWithRetry(getNtTestUrl(), { method: 'GET', maxRetries: 2 });
    if (result.ok) {
      setTestResult('success');
      setTestMessage(result.data?.message ?? 'Endpoint is live!');
      console.log('[NT-Setup] Test success:', result.data);
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Connection failed');
      console.log('[NT-Setup] Test error:', result.error);
    }
    setTestLoading(false);
  }, []);

  const handleSendTestAlert = useCallback(async () => {
    setTestLoading(true);
    const result = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instrument: 'ES 03-26',
        action: 'BUY',
        orderType: 'MARKET',
        quantity: 1,
        price: 5245.50,
        timestamp: new Date().toISOString(),
        source: 'NinjaTrader',
        strategy: 'EmperialBot Test',
        account: 'Sim101',
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
    const result = await safeFetch(getNtHistoryUrl(), { method: 'GET' });
    if (result.ok && result.data?.alerts) {
      setRecentAlerts(result.data.alerts);
      console.log('[NT-Setup] Fetched', result.data.alerts.length, 'alerts');
    } else {
      console.log('[NT-Setup] History fetch error:', result.error);
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
          <View style={st.ntBadge}>
            <Text style={st.ntBadgeText}>NT</Text>
          </View>
          <View>
            <Text style={st.headerTitle}>NinjaTrader Setup</Text>
            <Text style={st.headerSub}>Connect orders & strategy signals</Text>
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
                    backgroundColor: status === 'done' ? Colors.green + '15' : status === 'active' ? NT_COLOR + '15' : Colors.bg3,
                  }]}>
                    {status === 'done' ? (
                      <CheckCircle size={14} color={Colors.green} />
                    ) : (
                      <Text style={[st.stepNumberText, {
                        color: status === 'active' ? NT_COLOR : Colors.text3,
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
                    This is your unique webhook URL. NinjaTrader will send POST requests here when strategies or indicators fire signals.
                  </Text>
                  <CopyableBlock label="Webhook URL" value={webhookUrl} mono />
                  <View style={st.tipCard}>
                    <Shield size={12} color={NT_COLOR} />
                    <Text style={st.tipText}>
                      Keep this URL private. Anyone with it can send orders to your app. Only share with trusted NinjaScript strategies.
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
                  <Text style={st.instruction}>In NinjaTrader 8, you have two integration methods:</Text>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <FileCode size={14} color={NT_COLOR} />
                      <Text style={st.methodTitle}>Method A: NinjaScript Strategy</Text>
                    </View>
                    <Text style={st.methodDesc}>Add a webhook call directly inside your strategy's OnBarUpdate() method.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Open NinjaTrader 8 → New → NinjaScript Editor' />
                      <InstructionItem number="2" text='Open or create your strategy file (.cs)' />
                      <InstructionItem number="3" text='In the OnBarUpdate() method, add the webhook HTTP POST code when your signal condition is met' />
                      <InstructionItem number="4" text='Replace YOUR_WEBHOOK_URL with the URL from Step 1' />
                      <InstructionItem number="5" text='Compile the strategy (F5) and enable it on a chart' />
                    </View>
                    <CopyableBlock label="NinjaScript Strategy Snippet" value={NT_NINJASCRIPT} mono />
                  </View>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <Terminal size={14} color={NT_COLOR} />
                      <Text style={st.methodTitle}>Method B: Custom Add-On</Text>
                    </View>
                    <Text style={st.methodDesc}>Create a reusable Add-On that any strategy can call to send webhooks.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='New → NinjaScript Editor → Add-On' />
                      <InstructionItem number="2" text='Create a public method that accepts instrument, action, price, quantity, and strategy name' />
                      <InstructionItem number="3" text='The method builds a JSON payload and POSTs it to your webhook URL' />
                      <InstructionItem number="4" text='Call this method from any strategy when a signal fires' />
                    </View>
                    <CopyableBlock label="Add-On Snippet" value={NT_ADDON_SNIPPET} mono />
                  </View>

                  <Pressable
                    style={st.linkBtn}
                    onPress={() => Linking.openURL('https://ninjatrader.com/support/helpGuides/nt8/en-us/').catch(console.log)}
                  >
                    <ExternalLink size={13} color={NT_COLOR} />
                    <Text style={[st.linkBtnText, { color: NT_COLOR }]}>Open NinjaTrader Docs</Text>
                  </Pressable>

                  <View style={st.tipCard}>
                    <AlertTriangle size={12} color={NT_COLOR} />
                    <Text style={st.tipText}>
                      NinjaTrader 8 requires .NET Framework. Make sure System.Net.WebClient is available. For async sends, wrap in Task.Run() to avoid blocking the strategy thread.
                    </Text>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've set up NinjaTrader</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 2 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    Choose a payload format that matches your trading style. The webhook expects a JSON body via POST:
                  </Text>

                  <Text style={st.sectionLabel}>ORDER PAYLOAD TEMPLATES</Text>
                  <Text style={st.sectionSub}>Select a template and use it in your NinjaScript webhook call:</Text>

                  <PayloadTab tabs={[
                    { label: 'Market', payload: NT_PAYLOAD_MARKET },
                    { label: 'Limit', payload: NT_PAYLOAD_LIMIT },
                    { label: 'Stop', payload: NT_PAYLOAD_STOP },
                  ]} />

                  <View style={st.variableRef}>
                    <Text style={st.variableRefTitle}>NinjaTrader Payload Fields</Text>
                    <View style={st.variableGrid}>
                      <VariableItem name="instrument" desc="Contract name (e.g. ES 03-26)" />
                      <VariableItem name="action" desc="BUY or SELL" />
                      <VariableItem name="orderType" desc="MARKET, LIMIT, STOP_MARKET" />
                      <VariableItem name="quantity" desc="Number of contracts" />
                      <VariableItem name="price" desc="Limit price (0 for market)" />
                      <VariableItem name="stopPrice" desc="Stop trigger price" />
                      <VariableItem name="account" desc="NT account name" />
                      <VariableItem name="strategy" desc="Strategy name" />
                      <VariableItem name="tif" desc="Time in force (DAY, GTC)" />
                      <VariableItem name="oco" desc="OCO group identifier" />
                    </View>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've configured the payload</Text>
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
                        <ActivityIndicator size="small" color={NT_COLOR} />
                      ) : (
                        <Globe size={14} color={NT_COLOR} />
                      )}
                      <Text style={[st.testBtnText, { color: NT_COLOR }]}>Ping Endpoint</Text>
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
                    <Text style={st.testLabel}>2. Send a simulated NinjaTrader order</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleSendTestAlert}
                      disabled={testLoading}
                    >
                      <Send size={14} color={NT_COLOR} />
                      <Text style={[st.testBtnText, { color: NT_COLOR }]}>Send Test Order</Text>
                    </Pressable>
                  </View>

                  <View style={st.testSection}>
                    <View style={st.testLabelRow}>
                      <Text style={st.testLabel}>3. Recent received orders</Text>
                      <Pressable style={st.refreshBtn} onPress={fetchAlertHistory}>
                        {alertsLoading ? (
                          <ActivityIndicator size="small" color={NT_COLOR} />
                        ) : (
                          <RefreshCw size={13} color={NT_COLOR} />
                        )}
                      </Pressable>
                    </View>

                    {recentAlerts.length === 0 ? (
                      <View style={st.emptyAlerts}>
                        <Radio size={20} color={Colors.text3} />
                        <Text style={st.emptyAlertsText}>
                          No orders received yet. Run your NinjaTrader strategy or send a test above.
                        </Text>
                        <Pressable style={st.refreshSmallBtn} onPress={fetchAlertHistory}>
                          <RefreshCw size={12} color={NT_COLOR} />
                          <Text style={[st.refreshSmallText, { color: NT_COLOR }]}>Refresh</Text>
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
              NinjaTrader orders will now POST to your Emperial Bot webhook. Orders appear in the Bot dashboard and can trigger automated trades.
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
                <Bell size={14} color={NT_COLOR} />
                <Text style={[st.successBtnSecondaryText, { color: NT_COLOR }]}>View Signals</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={st.faqSection}>
          <Text style={st.faqTitle}>Frequently Asked Questions</Text>
          <FAQItem
            question="Which NinjaTrader version is supported?"
            answer="NinjaTrader 8 is fully supported. The webhook integration uses standard .NET HTTP calls (System.Net.WebClient or HttpClient) which are available in NT8's NinjaScript environment."
          />
          <FAQItem
            question="Can I use this with NinjaTrader's Sim account?"
            answer="Yes. You can test the full integration using a Sim account. Set the 'account' field to your sim account name (e.g., 'Sim101'). Switch to your live account name when ready for production."
          />
          <FAQItem
            question="Will the webhook block my strategy execution?"
            answer="If you use Task.Run() as shown in the Add-On snippet, the HTTP call runs on a background thread and won't block your strategy's OnBarUpdate() method. Without Task.Run(), there may be a brief delay."
          />
          <FAQItem
            question="Can I send signals from multiple strategies?"
            answer="Absolutely. Each strategy can POST to the same webhook URL. Use the 'strategy' field in the payload to differentiate signals. The bot dashboard shows which strategy triggered each order."
          />
          <FAQItem
            question="What about NinjaTrader's built-in ATM strategies?"
            answer="ATM strategies run locally in NinjaTrader and don't natively support webhooks. To integrate ATM, create a wrapper NinjaScript strategy that monitors ATM fills and sends webhook alerts."
          />
          <FAQItem
            question="How do I handle connection failures?"
            answer="Wrap the HTTP call in a try/catch block. If the POST fails, you can log the error in NinjaTrader's Output window and optionally retry. The webhook endpoint does not retry — it's fire-and-forget from NinjaTrader's side."
          />
        </View>
      </ScrollView>
    </View>
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
  ntBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: NT_COLOR + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NT_COLOR + '30',
  },
  ntBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: NT_COLOR,
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
    backgroundColor: NT_COLOR + '10',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
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
    backgroundColor: NT_COLOR + '08',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: NT_COLOR + '15',
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
    borderColor: NT_COLOR + '30',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  methodCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: NT_COLOR + '12',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: NT_COLOR,
  },
  methodDesc: {
    fontSize: 11,
    color: Colors.text2,
    lineHeight: 16,
    marginBottom: 12,
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
    color: NT_COLOR,
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
    color: NT_COLOR,
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
    backgroundColor: NT_COLOR + '10',
  },
  refreshSmallText: {
    fontSize: 11,
    fontWeight: '600' as const,
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
    borderColor: NT_COLOR + '30',
    borderRadius: 10,
    paddingVertical: 12,
  },
  successBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
