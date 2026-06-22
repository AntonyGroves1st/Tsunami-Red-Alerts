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
  TextInput,
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
  Key,
  Lock,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
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

const BN_COLOR = '#F0B90B';
const BN_US_COLOR = '#1E2329';

const STEPS: SetupStep[] = [
  { id: 'choose-platform', number: 1, title: 'Choose Your Platform', subtitle: 'Select Binance.com or Binance.US' },
  { id: 'api-keys', number: 2, title: 'Create API Keys', subtitle: 'Generate API keys with correct permissions' },
  { id: 'webhook-url', number: 3, title: 'Copy Your Webhook URL', subtitle: 'Webhook endpoint for order signals' },
  { id: 'configure', number: 4, title: 'Configure Payload', subtitle: 'Set up the JSON order format' },
  { id: 'test', number: 5, title: 'Test the Connection', subtitle: 'Verify everything is connected' },
];

const BN_PAYLOAD_SPOT = `{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 0.001,
  "timestamp": "${new Date().toISOString()}",
  "source": "Binance",
  "strategy": "EmperialBot",
  "platform": "binance"
}`;

const BN_PAYLOAD_LIMIT = `{
  "symbol": "ETHUSDT",
  "side": "SELL",
  "type": "LIMIT",
  "quantity": 0.1,
  "price": 3500.00,
  "timeInForce": "GTC",
  "timestamp": "${new Date().toISOString()}",
  "source": "Binance",
  "strategy": "EmperialBot",
  "platform": "binance"
}`;

const BN_PAYLOAD_FUTURES = `{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 0.01,
  "leverage": 10,
  "marginType": "CROSSED",
  "positionSide": "LONG",
  "reduceOnly": false,
  "timestamp": "${new Date().toISOString()}",
  "source": "Binance Futures",
  "strategy": "EmperialBot",
  "platform": "binance"
}`;

const BN_PYTHON_SCRIPT = `# Python script using python-binance
# Listens for webhook signals and executes orders on Binance

import asyncio
import aiohttp
from aiohttp import web
from binance.client import Client
from binance.enums import *
import json

API_KEY = "YOUR_API_KEY"
API_SECRET = "YOUR_API_SECRET"
WEBHOOK_URL = "YOUR_WEBHOOK_URL"
USE_TESTNET = True  # Set False for live trading

client = Client(API_KEY, API_SECRET, testnet=USE_TESTNET)

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

async def execute_order(data: dict):
    try:
        symbol = data.get("symbol", "BTCUSDT")
        side = data.get("side", "BUY")
        order_type = data.get("type", "MARKET")
        quantity = data.get("quantity", 0.001)

        if order_type == "MARKET":
            order = client.create_order(
                symbol=symbol,
                side=side,
                type=ORDER_TYPE_MARKET,
                quantity=quantity
            )
        elif order_type == "LIMIT":
            price = data.get("price")
            tif = data.get("timeInForce", "GTC")
            order = client.create_order(
                symbol=symbol,
                side=side,
                type=ORDER_TYPE_LIMIT,
                timeInForce=tif,
                quantity=quantity,
                price=str(price)
            )

        print(f"[Binance] Order placed: {order['orderId']}")

        # Forward to webhook
        await send_webhook({
            "symbol": symbol,
            "side": side,
            "type": order_type,
            "quantity": quantity,
            "orderId": order["orderId"],
            "status": order["status"],
            "price": order.get("price", "0"),
            "fills": order.get("fills", []),
            "timestamp": order["transactTime"],
            "source": "Binance",
            "strategy": "EmperialBot"
        })

        return order
    except Exception as e:
        print(f"[Binance] Order error: {e}")
        return None

# Run as webhook listener
async def handle_signal(request):
    data = await request.json()
    print(f"[Signal] Received: {json.dumps(data)}")
    result = await execute_order(data)
    return web.json_response({"success": bool(result)})

app = web.Application()
app.router.add_post("/signal", handle_signal)

if __name__ == "__main__":
    print("[Binance Bridge] Starting...")
    print(f"[Binance Bridge] Testnet: {USE_TESTNET}")
    web.run_app(app, port=8080)`;

const BN_NODE_SCRIPT = `// Node.js script using binance connector
// Executes orders and forwards fills to your webhook

const { Spot } = require("@binance/connector");
const express = require("express");
const axios = require("axios");

const API_KEY = "YOUR_API_KEY";
const API_SECRET = "YOUR_API_SECRET";
const WEBHOOK_URL = "YOUR_WEBHOOK_URL";
const USE_TESTNET = true;

const client = new Spot(API_KEY, API_SECRET, {
  baseURL: USE_TESTNET
    ? "https://testnet.binance.vision"
    : "https://api.binance.com",
});

async function sendWebhook(payload) {
  try {
    const res = await axios.post(WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("[Webhook] Sent:", res.data);
  } catch (err) {
    console.log("[Webhook] Error:", err.message);
  }
}

const app = express();
app.use(express.json());

app.post("/signal", async (req, res) => {
  const { symbol, side, type, quantity, price, timeInForce } = req.body;

  try {
    let order;
    if (type === "MARKET") {
      order = await client.newOrder(symbol, side, type, {
        quantity,
      });
    } else if (type === "LIMIT") {
      order = await client.newOrder(symbol, side, type, {
        quantity,
        price: String(price),
        timeInForce: timeInForce || "GTC",
      });
    }

    console.log("[Binance] Order:", order.data.orderId);

    await sendWebhook({
      symbol,
      side,
      type,
      quantity,
      orderId: order.data.orderId,
      status: order.data.status,
      timestamp: new Date().toISOString(),
      source: "Binance",
      strategy: "EmperialBot",
    });

    res.json({ success: true, orderId: order.data.orderId });
  } catch (err) {
    console.log("[Binance] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(8080, () => {
  console.log("[Binance Bridge] Listening on port 8080");
  console.log("[Binance Bridge] Testnet:", USE_TESTNET);
});`;

function getBnWebhookUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/binance-webhook';
  return `${base}/api/binance-webhook`;
}

function getBnTestUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/binance-webhook/test';
  return `${base}/api/binance-webhook/test`;
}

function getBnHistoryUrl(): string {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) return 'https://your-api-url/api/binance-webhook/history';
  return `${base}/api/binance-webhook/history?limit=5`;
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

  const bg = status === 'done' ? Colors.green : status === 'active' ? BN_COLOR : Colors.bg3;
  const textColor = status === 'done' ? Colors.white : status === 'active' ? '#1E2329' : Colors.text3;

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
              <Copy size={12} color={BN_COLOR} />
              <Text style={[st.copyBtnText, { color: BN_COLOR }]}>Copy</Text>
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

export default function BinanceSetupScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [recentAlerts, setRecentAlerts] = useState<ReceivedAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'binance' | 'binance-us' | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showApiSecret, setShowApiSecret] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [enableTestnet, setEnableTestnet] = useState<boolean>(true);

  const webhookUrl = getBnWebhookUrl();

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
    const result = await safeFetchWithRetry(getBnTestUrl(), { method: 'GET', maxRetries: 2 });
    if (result.ok) {
      setTestResult('success');
      setTestMessage(result.data?.message ?? 'Endpoint is live!');
      console.log('[BN-Setup] Test success:', result.data);
    } else {
      setTestResult('error');
      setTestMessage(result.error ?? 'Connection failed');
      console.log('[BN-Setup] Test error:', result.error);
    }
    setTestLoading(false);
  }, []);

  const handleSendTestAlert = useCallback(async () => {
    setTestLoading(true);
    const result = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: 0.001,
        timestamp: new Date().toISOString(),
        source: 'Binance',
        strategy: 'EmperialBot Test',
        platform: selectedPlatform ?? 'binance',
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
  }, [webhookUrl, selectedPlatform]);

  const fetchAlertHistory = useCallback(async () => {
    setAlertsLoading(true);
    const result = await safeFetch(getBnHistoryUrl(), { method: 'GET' });
    if (result.ok && result.data?.alerts) {
      setRecentAlerts(result.data.alerts);
      console.log('[BN-Setup] Fetched', result.data.alerts.length, 'alerts');
    } else {
      console.log('[BN-Setup] History fetch error:', result.error);
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
          <View style={st.bnBadge}>
            <Text style={st.bnBadgeText}>BN</Text>
          </View>
          <View>
            <Text style={st.headerTitle}>Binance Setup</Text>
            <Text style={st.headerSub}>Connect spot & futures trading</Text>
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
                    backgroundColor: status === 'done' ? Colors.green + '15' : status === 'active' ? BN_COLOR + '15' : Colors.bg3,
                  }]}>
                    {status === 'done' ? (
                      <CheckCircle size={14} color={Colors.green} />
                    ) : (
                      <Text style={[st.stepNumberText, {
                        color: status === 'active' ? BN_COLOR : Colors.text3,
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
                    Choose which Binance platform you use. This determines the API endpoints and available features.
                  </Text>

                  <Pressable
                    style={[st.platformCard, selectedPlatform === 'binance' && st.platformCardSelected]}
                    onPress={() => {
                      setSelectedPlatform('binance');
                      Haptics.impact('light');
                    }}
                  >
                    <View style={st.platformCardInner}>
                      <View style={[st.platformBadge, { backgroundColor: BN_COLOR + '20' }]}>
                        <Text style={[st.platformBadgeText, { color: BN_COLOR }]}>BN</Text>
                      </View>
                      <View style={st.platformInfo}>
                        <Text style={st.platformName}>Binance.com</Text>
                        <Text style={st.platformDesc}>Global exchange — full features, futures, margin</Text>
                      </View>
                      {selectedPlatform === 'binance' && <CheckCircle size={16} color={BN_COLOR} />}
                    </View>
                    <View style={st.platformFeatures}>
                      <View style={[st.platformFeatureTag, { backgroundColor: BN_COLOR + '10' }]}>
                        <Text style={[st.platformFeatureText, { color: BN_COLOR }]}>Spot</Text>
                      </View>
                      <View style={[st.platformFeatureTag, { backgroundColor: BN_COLOR + '10' }]}>
                        <Text style={[st.platformFeatureText, { color: BN_COLOR }]}>Futures</Text>
                      </View>
                      <View style={[st.platformFeatureTag, { backgroundColor: BN_COLOR + '10' }]}>
                        <Text style={[st.platformFeatureText, { color: BN_COLOR }]}>Margin</Text>
                      </View>
                      <View style={[st.platformFeatureTag, { backgroundColor: BN_COLOR + '10' }]}>
                        <Text style={[st.platformFeatureText, { color: BN_COLOR }]}>Options</Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[st.platformCard, selectedPlatform === 'binance-us' && st.platformCardSelectedUS]}
                    onPress={() => {
                      setSelectedPlatform('binance-us');
                      Haptics.impact('light');
                    }}
                  >
                    <View style={st.platformCardInner}>
                      <View style={[st.platformBadge, { backgroundColor: '#1E232918' }]}>
                        <Text style={[st.platformBadgeText, { color: '#C99400' }]}>US</Text>
                      </View>
                      <View style={st.platformInfo}>
                        <Text style={st.platformName}>Binance.US</Text>
                        <Text style={st.platformDesc}>US-regulated exchange — spot trading only</Text>
                      </View>
                      {selectedPlatform === 'binance-us' && <CheckCircle size={16} color="#C99400" />}
                    </View>
                    <View style={st.platformFeatures}>
                      <View style={[st.platformFeatureTag, { backgroundColor: '#C9940010' }]}>
                        <Text style={[st.platformFeatureText, { color: '#C99400' }]}>Spot</Text>
                      </View>
                      <View style={[st.platformFeatureTag, { backgroundColor: '#C9940010' }]}>
                        <Text style={[st.platformFeatureText, { color: '#C99400' }]}>OTC</Text>
                      </View>
                      <View style={[st.platformFeatureTag, { backgroundColor: '#C9940010' }]}>
                        <Text style={[st.platformFeatureText, { color: '#C99400' }]}>Staking</Text>
                      </View>
                    </View>
                  </Pressable>

                  <View style={st.tipCard}>
                    <AlertTriangle size={12} color={BN_COLOR} />
                    <Text style={st.tipText}>
                      Binance.US has limited features compared to Binance.com. Futures and margin trading are not available on Binance.US.
                    </Text>
                  </View>

                  <Pressable
                    style={[st.doneBtn, !selectedPlatform && { opacity: 0.4 }]}
                    onPress={selectedPlatform ? markStepDone : undefined}
                    disabled={!selectedPlatform}
                  >
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>
                      {selectedPlatform === 'binance-us' ? "I'm using Binance.US" : selectedPlatform === 'binance' ? "I'm using Binance.com" : 'Select a platform'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 1 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    Create API keys on {selectedPlatform === 'binance-us' ? 'Binance.US' : 'Binance.com'} with the correct permissions for trading:
                  </Text>

                  <View style={st.instructionList}>
                    <InstructionItem number="1" text={`Log in to ${selectedPlatform === 'binance-us' ? 'binance.us' : 'binance.com'} and go to Account → API Management`} />
                    <InstructionItem number="2" text='Click "Create API" and choose "System Generated" keys' />
                    <InstructionItem number="3" text="Complete 2FA verification (Google Auth or SMS)" />
                    <InstructionItem number="4" text='Enable "Enable Spot & Margin Trading" permission' />
                    {selectedPlatform === 'binance' && (
                      <InstructionItem number="5" text='For futures: also enable "Enable Futures" permission' />
                    )}
                    <InstructionItem number={selectedPlatform === 'binance' ? '6' : '5'} text='IMPORTANT: Restrict API access to your IP address for security' />
                    <InstructionItem number={selectedPlatform === 'binance' ? '7' : '6'} text='Copy your API Key and Secret Key — the secret is only shown once!' />
                  </View>

                  <View style={st.apiInputSection}>
                    <Text style={st.apiInputLabel}>API Key (optional — stored locally only)</Text>
                    <View style={st.apiInputRow}>
                      <Key size={14} color={Colors.text3} />
                      <TextInput
                        style={st.apiInput}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="Paste your API key here"
                        placeholderTextColor={Colors.text3}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showApiKey}
                      />
                      <Pressable onPress={() => setShowApiKey(!showApiKey)} hitSlop={8}>
                        {showApiKey ? <EyeOff size={14} color={Colors.text3} /> : <Eye size={14} color={Colors.text3} />}
                      </Pressable>
                    </View>

                    <Text style={[st.apiInputLabel, { marginTop: 10 }]}>API Secret (optional — stored locally only)</Text>
                    <View style={st.apiInputRow}>
                      <Lock size={14} color={Colors.text3} />
                      <TextInput
                        style={st.apiInput}
                        value={apiSecret}
                        onChangeText={setApiSecret}
                        placeholder="Paste your API secret here"
                        placeholderTextColor={Colors.text3}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showApiSecret}
                      />
                      <Pressable onPress={() => setShowApiSecret(!showApiSecret)} hitSlop={8}>
                        {showApiSecret ? <EyeOff size={14} color={Colors.text3} /> : <Eye size={14} color={Colors.text3} />}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable style={st.testnetToggle} onPress={() => setEnableTestnet(!enableTestnet)}>
                    {enableTestnet ? (
                      <ToggleRight size={22} color={BN_COLOR} />
                    ) : (
                      <ToggleLeft size={22} color={Colors.text3} />
                    )}
                    <View style={st.testnetInfo}>
                      <Text style={st.testnetLabel}>Use Testnet (Paper Trading)</Text>
                      <Text style={st.testnetDesc}>
                        {enableTestnet ? 'Using testnet — no real funds at risk' : 'Using LIVE trading — real funds!'}
                      </Text>
                    </View>
                  </Pressable>

                  {!enableTestnet && (
                    <View style={[st.tipCard, { borderColor: Colors.red + '20', backgroundColor: Colors.red + '08' }]}>
                      <AlertTriangle size={12} color={Colors.red} />
                      <Text style={[st.tipText, { color: Colors.red }]}>
                        Live trading mode is enabled. Real funds will be used. Make sure you have tested thoroughly on testnet first.
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={st.linkBtn}
                    onPress={() => {
                      const url = selectedPlatform === 'binance-us'
                        ? 'https://www.binance.us/settings/api-management'
                        : 'https://www.binance.com/en/my/settings/api-management';
                      Linking.openURL(url).catch(console.log);
                    }}
                  >
                    <ExternalLink size={13} color={BN_COLOR} />
                    <Text style={[st.linkBtnText, { color: BN_COLOR }]}>Open API Management</Text>
                  </Pressable>

                  <View style={st.tipCard}>
                    <Shield size={12} color={BN_COLOR} />
                    <Text style={st.tipText}>
                      Never share your API Secret with anyone. Always enable IP restriction for your API keys. Never enable "Enable Withdrawals" permission unless absolutely necessary.
                    </Text>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've created my API keys</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 2 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    This is your unique webhook URL. Your Binance bridge script will forward order fills and signals here.
                  </Text>
                  <CopyableBlock label="Webhook URL" value={webhookUrl} mono />
                  <View style={st.tipCard}>
                    <Shield size={12} color={BN_COLOR} />
                    <Text style={st.tipText}>
                      Keep this URL private. Only use it in your trusted bridge scripts. Anyone with this URL can send signals to your app.
                    </Text>
                  </View>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <Globe size={14} color={BN_COLOR} />
                      <Text style={st.methodTitle}>Python Bridge (python-binance)</Text>
                    </View>
                    <Text style={st.methodDesc}>Execute orders via python-binance SDK and forward fills to your webhook. Supports testnet.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Install Python 3.9+ and pip install python-binance aiohttp' />
                      <InstructionItem number="2" text='Replace YOUR_API_KEY and YOUR_API_SECRET with your Binance keys' />
                      <InstructionItem number="3" text='Replace YOUR_WEBHOOK_URL with the URL above' />
                      <InstructionItem number="4" text='Set USE_TESTNET = True for paper trading, False for live' />
                      <InstructionItem number="5" text='Run the script — it listens for signals and executes orders' />
                    </View>
                    <CopyableBlock label="Python Bridge Script" value={BN_PYTHON_SCRIPT} mono />
                  </View>

                  <View style={st.methodCard}>
                    <View style={st.methodHeader}>
                      <Globe size={14} color={BN_COLOR} />
                      <Text style={st.methodTitle}>Node.js Bridge (@binance/connector)</Text>
                    </View>
                    <Text style={st.methodDesc}>Use the official Binance Node.js SDK. Ideal for serverless or VPS deployment.</Text>
                    <View style={st.instructionList}>
                      <InstructionItem number="1" text='Install Node.js 18+ and npm install @binance/connector express axios' />
                      <InstructionItem number="2" text='Replace YOUR_API_KEY and YOUR_API_SECRET with your Binance keys' />
                      <InstructionItem number="3" text='Replace YOUR_WEBHOOK_URL with the URL above' />
                      <InstructionItem number="4" text='Set USE_TESTNET = true for paper trading, false for live' />
                      <InstructionItem number="5" text='Run: node bridge.js — it listens on port 8080 for signals' />
                    </View>
                    <CopyableBlock label="Node.js Bridge Script" value={BN_NODE_SCRIPT} mono />
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've set up the bridge</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 3 && (
                <View style={st.stepBody}>
                  <Text style={st.instruction}>
                    Choose a payload format that matches your trading style. The webhook expects a JSON body via POST:
                  </Text>

                  <Text style={st.sectionLabel}>ORDER PAYLOAD TEMPLATES</Text>
                  <Text style={st.sectionSub}>Select a template for your bridge script's webhook call:</Text>

                  <PayloadTab tabs={[
                    { label: 'Spot', payload: BN_PAYLOAD_SPOT },
                    { label: 'Limit', payload: BN_PAYLOAD_LIMIT },
                    ...(selectedPlatform !== 'binance-us' ? [{ label: 'Futures', payload: BN_PAYLOAD_FUTURES }] : []),
                  ]} />

                  <View style={st.variableRef}>
                    <Text style={st.variableRefTitle}>Binance Payload Fields</Text>
                    <View style={st.variableGrid}>
                      <VariableItem name="symbol" desc="Trading pair (e.g. BTCUSDT)" />
                      <VariableItem name="side" desc="BUY or SELL" />
                      <VariableItem name="type" desc="MARKET, LIMIT, STOP_LOSS" />
                      <VariableItem name="quantity" desc="Order quantity" />
                      <VariableItem name="price" desc="Limit price (for LIMIT orders)" />
                      <VariableItem name="timeInForce" desc="GTC, IOC, FOK" />
                      {selectedPlatform !== 'binance-us' && (
                        <>
                          <VariableItem name="leverage" desc="Futures leverage (1-125x)" />
                          <VariableItem name="marginType" desc="CROSSED or ISOLATED" />
                          <VariableItem name="positionSide" desc="LONG, SHORT, BOTH" />
                          <VariableItem name="reduceOnly" desc="Close position only" />
                        </>
                      )}
                      <VariableItem name="platform" desc="binance or binance-us" />
                    </View>
                  </View>

                  <Pressable style={st.doneBtn} onPress={markStepDone}>
                    <CheckCircle size={14} color={Colors.bg0} />
                    <Text style={st.doneBtnText}>I've configured the payload</Text>
                  </Pressable>
                </View>
              )}

              {isExpanded && idx === 4 && (
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
                        <ActivityIndicator size="small" color={BN_COLOR} />
                      ) : (
                        <Globe size={14} color={BN_COLOR} />
                      )}
                      <Text style={[st.testBtnText, { color: BN_COLOR }]}>Ping Endpoint</Text>
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
                    <Text style={st.testLabel}>2. Send a simulated Binance order</Text>
                    <Pressable
                      style={[st.testBtn, testLoading && { opacity: 0.6 }]}
                      onPress={handleSendTestAlert}
                      disabled={testLoading}
                    >
                      <Send size={14} color={BN_COLOR} />
                      <Text style={[st.testBtnText, { color: BN_COLOR }]}>Send Test Order</Text>
                    </Pressable>
                  </View>

                  <View style={st.testSection}>
                    <View style={st.testLabelRow}>
                      <Text style={st.testLabel}>3. Recent received orders</Text>
                      <Pressable style={st.refreshBtn} onPress={fetchAlertHistory}>
                        {alertsLoading ? (
                          <ActivityIndicator size="small" color={BN_COLOR} />
                        ) : (
                          <RefreshCw size={13} color={BN_COLOR} />
                        )}
                      </Pressable>
                    </View>

                    {recentAlerts.length === 0 ? (
                      <View style={st.emptyAlerts}>
                        <Radio size={20} color={Colors.text3} />
                        <Text style={st.emptyAlertsText}>
                          No orders received yet. Start your Binance bridge script or send a test above.
                        </Text>
                        <Pressable style={st.refreshSmallBtn} onPress={fetchAlertHistory}>
                          <RefreshCw size={12} color={BN_COLOR} />
                          <Text style={[st.refreshSmallText, { color: BN_COLOR }]}>Refresh</Text>
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
              {selectedPlatform === 'binance-us' ? 'Binance.US' : 'Binance'} orders will now POST to your Emperial Bot webhook via the bridge script. Orders appear in the Bot dashboard and can trigger automated trades.
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
                <Bell size={14} color={BN_COLOR} />
                <Text style={[st.successBtnSecondaryText, { color: BN_COLOR }]}>View Signals</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={st.faqSection}>
          <Text style={st.faqTitle}>Frequently Asked Questions</Text>
          <FAQItem
            question="What's the difference between Binance.com and Binance.US?"
            answer="Binance.com is the global exchange with full features including futures, margin, and options trading. Binance.US is a US-regulated exchange limited to spot trading, OTC, and staking. US residents must use Binance.US due to regulatory requirements."
          />
          <FAQItem
            question="How do I create API keys on Binance?"
            answer="Go to Account → API Management → Create API. Choose 'System Generated' keys. Enable 'Spot & Margin Trading' permission. For futures on Binance.com, also enable 'Futures' permission. Always restrict API access to your server's IP address."
          />
          <FAQItem
            question="What is testnet and should I use it?"
            answer="Testnet is a paper trading environment with fake funds. It's identical to the live exchange but uses no real money. Always test your bot on testnet first before switching to live trading. Binance testnet URL: testnet.binance.vision"
          />
          <FAQItem
            question="Can I trade futures on Binance.US?"
            answer="No. Binance.US only supports spot trading. For futures trading, you need a Binance.com account (not available to US residents). The bridge scripts automatically handle the difference between spot and futures endpoints."
          />
          <FAQItem
            question="How fast are orders executed?"
            answer="Binance API typically processes market orders within 50-200ms. Limit orders are placed instantly but fill times depend on market conditions. The bridge script adds minimal latency (usually <50ms) for webhook forwarding."
          />
          <FAQItem
            question="Is my API key safe?"
            answer="API keys entered in this app are stored locally on your device only and never sent to any server. The bridge scripts run on your own infrastructure. Always enable IP restriction on your API keys and never enable withdrawal permissions."
          />
          <FAQItem
            question="Can I use this with TradingView signals?"
            answer="Yes! You can chain TradingView webhooks → your bridge script → Binance API. When TradingView fires an alert, the bridge script receives it and executes the corresponding order on Binance, then forwards the fill to your app."
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
  bnBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BN_COLOR + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BN_COLOR + '30',
  },
  bnBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: BN_COLOR,
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
    backgroundColor: BN_COLOR + '10',
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
    backgroundColor: BN_COLOR + '08',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: BN_COLOR + '15',
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
    borderColor: BN_COLOR + '30',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  platformCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  platformCardSelected: {
    borderColor: BN_COLOR,
    backgroundColor: BN_COLOR + '06',
  },
  platformCardSelectedUS: {
    borderColor: '#C99400',
    backgroundColor: '#C9940006',
  },
  platformCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  platformDesc: {
    fontSize: 10,
    color: Colors.text2,
    marginTop: 2,
  },
  platformFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  platformFeatureTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  platformFeatureText: {
    fontSize: 9,
    fontWeight: '600' as const,
  },
  apiInputSection: {
    marginBottom: 14,
  },
  apiInputLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  apiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  apiInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  testnetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testnetInfo: {
    flex: 1,
  },
  testnetLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  testnetDesc: {
    fontSize: 10,
    color: Colors.text2,
    marginTop: 2,
  },
  methodCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BN_COLOR + '12',
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
    color: BN_COLOR,
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
    color: BN_COLOR,
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
    color: BN_COLOR,
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
    backgroundColor: BN_COLOR + '10',
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
    borderColor: BN_COLOR + '30',
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
