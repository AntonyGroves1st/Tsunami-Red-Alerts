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
  Cpu,
  Network,
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

const RT_COLOR = '#00A878';

const STEPS: SetupStep[] = [
  { id: 'webhook-url', number: 1, title: 'Copy Your Webhook URL', subtitle: 'This is the URL Rithmic will POST orders to' },
  { id: 'rithmic-setup', number: 2, title: 'Configure R | Trader Pro', subtitle: 'Set up the webhook connection in R | Trader Pro' },
  { id: 'payload', number: 3, title: 'Set Up the Payload', subtitle: 'Configure the JSON message format for orders' },
  { id: 'test', number: 4, title: 'Test the Connection', subtitle: 'Verify orders are received by your app' },
];

const RT_PAYLOAD_MARKET = `{
  "instrument": "ESZ6",
  "exchange": "CME",
  "action": "BUY",
  "orderType": "MARKET",
  "quantity": 1,
  "price": 0,
  "timestamp": "${new Date().toISOString()}",
  "source": "Rithmic",
  "strategy": "EmperialBot",
  "account": "DEMO12345",
  "fcmId": "TopStepTrader"
}`;

const RT_PAYLOAD_LIMIT = `{
  "instrument": "NQZ6",
  "exchange": "CME",
  "action": "SELL",
  "orderType": "LIMIT",
  "quantity": 2,
  "price": 18500.00,
  "stopPrice": 0,
  "timestamp": "${new Date().toISOString()}",
  "source": "Rithmic",
  "strategy": "EmperialBot",
  "account": "DEMO12345",
  "fcmId": "TopStepTrader",
  "tif": "GTC"
}`;

const RT_PAYLOAD_BRACKET = `{
  "instrument": "ESZ6",
  "exchange": "CME",
  "action": "BUY",
  "orderType": "BRACKET",
  "quantity": 1,
  "price": 5250.00,
  "takeProfit": 5270.00,
  "stopLoss": 5240.00,
  "timestamp": "${new Date().toISOString()}",
  "source": "Rithmic",
  "strategy": "EmperialBot",
  "account": "DEMO12345",
  "fcmId": "TopStepTrader"
}`;

const RT_PYTHON_SCRIPT = `# Python script using pyrithmic (Rithmic Protocol Buffer API)
# Sends webhook POST when an order fill is detected

import asyncio
import aiohttp
import json
from pyrithmic import RithmicClient, Gateway

WEBHOOK_URL = "YOUR_WEBHOOK_URL"
RITHMIC_USER = "your_username"
RITHMIC_PASS = "your_password"
RITHMIC_SYSTEM = "Rithmic Paper Trading"  # or "Rithmic 01" for live
GATEWAY = Gateway.CHICAGO

async def send_webhook(payload: dict):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as resp:
                result = await resp.json()
                print(f"[Webhook] Sent: {result}")
        except Exception as e:
            print(f"[Webhook] Error: {e}")

async def on_fill(fill_data):
    payload = {
        "instrument": fill_data["symbol"],
        "exchange": fill_data["exchange"],
        "action": fill_data["side"],
        "orderType": fill_data["order_type"],
        "quantity": fill_data["filled_qty"],
        "price": fill_data["fill_price"],
        "timestamp": fill_data["timestamp"],
        "source": "Rithmic",
        "strategy": "EmperialBot",
        "account": fill_data["account"],
        "fcmId": fill_data.get("fcm_id", "")
    }
    await send_webhook(payload)

async def main():
    client = RithmicClient(
        user=RITHMIC_USER,
        password=RITHMIC_PASS,
        system_name=RITHMIC_SYSTEM,
        gateway=GATEWAY
    )
    await client.connect()
    print("[Rithmic] Connected to", RITHMIC_SYSTEM)

    # Subscribe to order fills
    async for fill in client.stream_order_fills():
        await on_fill(fill)

asyncio.run(main())`;

const RT_CSHARP_SCRIPT = `// C# script using Rithmic R | Protocol API
// Sends webhook POST on order state changes

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using com.omnesys.rapi;

public class RithmicWebhookBridge
{
    private static readonly HttpClient _http = new HttpClient();
    private const string WEBHOOK_URL = "YOUR_WEBHOOK_URL";

    private REngine _engine;
    private RCallbacks _callbacks;

    public async Task Initialize(string user, string pass,
        string system, string gateway)
    {
        _engine = new REngine();
        _callbacks = new RCallbacks();

        _callbacks.OrderFillNotification += OnOrderFill;

        _engine.login(
            _callbacks, user, pass,
            system, gateway, ""
        );
        Console.WriteLine("[Rithmic] Login initiated...");
    }

    private async void OnOrderFill(object sender, 
        OrderFillArgs args)
    {
        var payload = new {
            instrument = args.Symbol,
            exchange = args.Exchange,
            action = args.BuySellType.ToString(),
            orderType = args.OrderType.ToString(),
            quantity = args.FillQty,
            price = args.FillPrice,
            timestamp = DateTime.UtcNow.ToString("o"),
            source = "Rithmic",
            strategy = "EmperialBot",
            account = args.Account,
            fcmId = args.FcmId
        };

        var json = Newtonsoft.Json.JsonConvert
            .SerializeObject(payload);
        var content = new StringContent(
            json, Encoding.UTF8, "application/json");

        try {
            var resp = await _http.PostAsync(
                WEBHOOK_URL, content);
            Console.WriteLine(
                $"[Webhook] Sent: {resp.StatusCode}");
        } catch (Exception ex) {
            Console.WriteLine(
                $"[Webhook] Error: {ex.Message}");
        }
    }
}`;

function getRtWebhookUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/rithmic-webhook';
  return `${base}/api/rithmic-webhook`;
}

function getRtTestUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/rithmic-webhook/test';
  return `${base}/api/rithmic-webhook/test`;
}

function getRtHistoryUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/rithmic-webhook/history';
  return `${base}/api/rithmic-webhook/history?limit=5`;
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

  const bg = status === 'done' ? Colors.green : status === 'active' ? RT_COLOR : Colors.bg3;
  const textColor = status === 'done' ? Colors.white : status === 'active' ? Colors.white : Colors.text3;

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
              <Copy size={12} color={RT_COLOR} />
              <Text style={[st.copyBtnText, { color: RT_COLOR }]}>Copy</Text>
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

export default function RithmicSetupScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [recentAlerts, setRecentAlerts] = useState<ReceivedAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);

  const webhookUrl = getRtWebhookUrl();

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
    const result = await safeFetchWithRetry(getRtTestUrl(), { method: 'GET', maxRetries: 2 });
    if (result.ok) {
      setTestResult('success');
      setTestMessage(result.data?.message ?? 'Endpoint is live!');
      console.log('[RT-Setup] Test success:', result.data);
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Connection failed');
      console.log('[RT-Setup] Test error:', result.error);
    }
    setTestLoading(false);
  }, []);

  const handleSendTestAlert = useCallback(async () => {
    setTestLoading(true);
    const result = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instrument: 'ESZ6',
        exchange: 'CME',
        action: 'BUY',
        orderType: 'MARKET',
        quantity: 1,
        price: 5245.50,
        timestamp: new Date().toISOString(),
        source: 'Rithmic',
        strategy: 'EmperialBot Test',
        account: 'DEMO12345',
        fcmId: 'TestFCM',
      }),
    });
    if (result.ok) {
      setTestResult('success');
      setTestMessage('Test order sent and received!');
      Haptics.notification('success');
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Failed to send');
    }
    setTestLoading(false);
  }, [webhookUrl]);

  const fetchAlertHistory = useCallback(async () => {
    setAlertsLoading(true);
    const result = await safeFetch(getRtHistoryUrl(), { method: 'GET' });
    if (result.ok && result.data?.alerts) {
      setRecentAlerts(result.data.alerts);
      console.log('[RT-Setup] Fetched', result.data.alerts.length, 'alerts');
    } else {
      console.log('[RT-Setup] History fetch error:', result.error);
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
          <View style={st.rtBadge}>
            <Text style={st.rtBadgeText}>R</Text>
          </View>
          <View>
            <Text style={st.headerTitle}>R | Trader Pro Setup</Text>
            <Text style={st.headerSub}>Connect Rithmic orders & data feed</Text>
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
                    backgroundColor: status === 'done' ? Colors.green + '15' : status === 'active' ? RT_COLOR + '15' : Colors.bg3,
                  }]}>
                    {status === 'done' ? (
                      <CheckCircle size={14} color={Colors.green} />
                    ) : (
                      <Text style={[st.stepNumberText, {
                        color: status === 'active' ? RT_COLOR : Colors.text3,
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
                    This is your unique webhook URL. Your Rithmic bridge script will send POST requests here when orders fill or signals fire.
                  </Text>
                  <CopyableBlock label="Webhook URL" value={webhookUrl} mono />
                  <View style={st.tipCard}>
                    <Shield size={12} color={RT_COLOR} />
                    <Text style={st.tipText}>
                      Keep this URL private. Anyone with it can send orders to your app. Only use in trusted bridge scripts running on your own infrastructure.
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
                  <Text style={st.instruction}>
                    Rithmic uses a Protocol Buffer API. You'll need a bridge script that connects to Rithmic and forwards orders/fills to your webhook. Choose your preferred method:
                  </Text>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <Terminal size={14} color={RT_COLOR} />
                      <Text style={st.methodTitle}>Method A: Python (pyrithmic)</Text>
                    </View>
                    <Text style={st.methodDesc}>Use the pyrithmic library to stream order fills and POST them to your webhook. Ideal for VPS or cloud deployment.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Install Python 3.9+ and pip install pyrithmic aiohttp' />
                      <InstructionItem number="2" text='Get your Rithmic credentials from your FCM (e.g., TopStep, Apex, your broker)' />
                      <InstructionItem number="3" text='Choose your system: "Rithmic Paper Trading" for demo, "Rithmic 01" for live' />
                      <InstructionItem number="4" text='Replace YOUR_WEBHOOK_URL with the URL from Step 1' />
                      <InstructionItem number="5" text='Run the script — it connects to Rithmic and streams fills to your app' />
                    </View>
                    <CopyableBlock label="Python Bridge Script" value={RT_PYTHON_SCRIPT} mono />
                  </View>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <FileCode size={14} color={RT_COLOR} />
                      <Text style={st.methodTitle}>Method B: C# (R | API)</Text>
                    </View>
                    <Text style={st.methodDesc}>Use the official Rithmic R | API (.NET) for direct integration. Best for Windows-based setups alongside R | Trader Pro.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Download the R | API SDK from Rithmic (requires approved developer account)' />
                      <InstructionItem number="2" text='Create a .NET Console App and reference the Rithmic API DLLs' />
                      <InstructionItem number="3" text='Subscribe to order fill notifications and POST them to your webhook' />
                      <InstructionItem number="4" text='Replace YOUR_WEBHOOK_URL with the URL from Step 1' />
                      <InstructionItem number="5" text='Build and run alongside R | Trader Pro' />
                    </View>
                    <CopyableBlock label="C# Bridge Snippet" value={RT_CSHARP_SCRIPT} mono />
                  </View>

                  <View style={st.infoCard}>
                    <View style={st.infoCardHeader}>
                      <Network size={14} color={RT_COLOR} />
                      <Text style={st.infoCardTitle}>R | Trader Pro Setup</Text>
                    </View>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Open R | Trader Pro and log in with your FCM credentials' />
                      <InstructionItem number="2" text='Go to Preferences → Connections and verify your gateway (e.g., Chicago, Aurora)' />
                      <InstructionItem number="3" text='Ensure your account has API access enabled (contact your FCM if unsure)' />
                      <InstructionItem number="4" text='Run the bridge script on the same machine or VPS for lowest latency' />
                    </View>
                  </View>

                  <Pressable
                    style={st.linkBtn}
                    onPress={() => Linking.openURL('https://www.rithmic.com/').catch(console.log)}
                  >
                    <ExternalLink size={13} color={RT_COLOR} />
                    <Text style={[st.linkBtnText, { color: RT_COLOR }]}>Visit Rithmic.com</Text>
                  </Pressable>

                  <View style={st.tipCard}>
                    <AlertTriangle size={12} color={RT_COLOR} />
                    <Text style={st.tipText}>
                      Rithmic API access requires approval from your FCM/broker. Paper trading systems are available for testing. The bridge script must run continuously to forward fills.
                    </Text>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've set up the bridge</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 2 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    Choose a payload format that matches your trading style. The webhook expects a JSON body via POST:
                  </Text>

                  <Text style={st.sectionLabel}>ORDER PAYLOAD TEMPLATES</Text>
                  <Text style={st.sectionSub}>Select a template for your bridge script's webhook call:</Text>

                  <PayloadTab tabs={[
                    { label: 'Market', payload: RT_PAYLOAD_MARKET },
                    { label: 'Limit', payload: RT_PAYLOAD_LIMIT },
                    { label: 'Bracket', payload: RT_PAYLOAD_BRACKET },
                  ]} />

                  <View style={st.variableRef}>
                    <Text style={st.variableRefTitle}>Rithmic Payload Fields</Text>
                    <View style={st.variableGrid}>
                      <VariableItem name="instrument" desc="Contract symbol (e.g. ESZ6)" />
                      <VariableItem name="exchange" desc="CME, NYMEX, CBOT, etc." />
                      <VariableItem name="action" desc="BUY or SELL" />
                      <VariableItem name="orderType" desc="MARKET, LIMIT, BRACKET" />
                      <VariableItem name="quantity" desc="Number of contracts" />
                      <VariableItem name="price" desc="Limit price (0 for market)" />
                      <VariableItem name="takeProfit" desc="Bracket TP price" />
                      <VariableItem name="stopLoss" desc="Bracket SL price" />
                      <VariableItem name="account" desc="Rithmic account ID" />
                      <VariableItem name="fcmId" desc="FCM/broker identifier" />
                      <VariableItem name="tif" desc="Time in force (DAY, GTC)" />
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
                    Verify the connection is working by testing the endpoint and checking for received orders.
                  </Text>

                  <View style={st.testSection}>
                    <Text style={st.testLabel}>1. Check endpoint is live</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleTest}
                      disabled={testLoading}
                    >
                      {testLoading ? (
                        <ActivityIndicator size="small" color={RT_COLOR} />
                      ) : (
                        <Globe size={14} color={RT_COLOR} />
                      )}
                      <Text style={[st.testBtnText, { color: RT_COLOR }]}>Ping Endpoint</Text>
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
                    <Text style={st.testLabel}>2. Send a simulated Rithmic order</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleSendTestAlert}
                      disabled={testLoading}
                    >
                      <Send size={14} color={RT_COLOR} />
                      <Text style={[st.testBtnText, { color: RT_COLOR }]}>Send Test Order</Text>
                    </Pressable>
                  </View>

                  <View style={st.testSection}>
                    <View style={st.testLabelRow}>
                      <Text style={st.testLabel}>3. Recent received orders</Text>
                      <Pressable style={st.refreshBtn} onPress={fetchAlertHistory}>
                        {alertsLoading ? (
                          <ActivityIndicator size="small" color={RT_COLOR} />
                        ) : (
                          <RefreshCw size={13} color={RT_COLOR} />
                        )}
                      </Pressable>
                    </View>

                    {recentAlerts.length === 0 ? (
                      <View style={st.emptyAlerts}>
                        <Radio size={20} color={Colors.text3} />
                        <Text style={st.emptyAlertsText}>
                          No orders received yet. Start your Rithmic bridge script or send a test above.
                        </Text>
                        <Pressable style={st.refreshSmallBtn} onPress={fetchAlertHistory}>
                          <RefreshCw size={12} color={RT_COLOR} />
                          <Text style={[st.refreshSmallText, { color: RT_COLOR }]}>Refresh</Text>
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
              Rithmic orders will now POST to your Emperial Bot webhook via the bridge script. Orders appear in the Bot dashboard and can trigger automated trades.
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
                <Bell size={14} color={RT_COLOR} />
                <Text style={[st.successBtnSecondaryText, { color: RT_COLOR }]}>View Signals</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={st.faqSection}>
          <Text style={st.faqTitle}>Frequently Asked Questions</Text>
          <FAQItem
            question="What is R | Trader Pro?"
            answer="R | Trader Pro is the front-end trading platform from Rithmic. It connects to Rithmic's ultra-low-latency infrastructure used by prop firms (TopStep, Apex, Earn2Trade) and professional traders for futures trading on CME, NYMEX, CBOT, and more."
          />
          <FAQItem
            question="Do I need a separate API developer account?"
            answer="Yes. Rithmic API access requires approval. Contact your FCM/broker to enable API access on your account. Most prop firms support API connections. For paper trading, use the 'Rithmic Paper Trading' system which has fewer restrictions."
          />
          <FAQItem
            question="What is an FCM and which ones are supported?"
            answer="An FCM (Futures Commission Merchant) is your broker/clearing firm. Popular FCMs that use Rithmic include TopStep, Apex Trader Funding, Earn2Trade, and Optimus Futures. Your FCM provides the login credentials for Rithmic."
          />
          <FAQItem
            question="Can I run the bridge script on a VPS?"
            answer="Yes, and it's recommended for production. Run the Python or C# bridge on a VPS close to Rithmic's gateway servers (e.g., Chicago) for minimal latency. The script maintains a persistent connection and forwards fills in real-time."
          />
          <FAQItem
            question="What's the difference between gateways?"
            answer="Rithmic operates multiple gateway servers: Chicago (primary), Aurora (backup), and others. Choose the gateway closest to your location or VPS. Your FCM may specify which gateway to use."
          />
          <FAQItem
            question="Can I use this with multiple accounts?"
            answer="Yes. The bridge script can connect to multiple Rithmic accounts simultaneously. Each fill will include the 'account' field so the bot dashboard knows which account triggered the order."
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
  rtBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: RT_COLOR + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: RT_COLOR + '30',
  },
  rtBadgeText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: RT_COLOR,
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
    backgroundColor: RT_COLOR + '10',
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
    backgroundColor: RT_COLOR + '08',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: RT_COLOR + '15',
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
    borderColor: RT_COLOR + '30',
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
    borderColor: RT_COLOR + '12',
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
    color: RT_COLOR,
  },
  methodDesc: {
    fontSize: 11,
    color: Colors.text2,
    lineHeight: 16,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: RT_COLOR + '12',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: RT_COLOR,
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
    color: RT_COLOR,
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
    color: RT_COLOR,
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
    backgroundColor: RT_COLOR + '10',
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
    borderColor: RT_COLOR + '30',
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
