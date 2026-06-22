import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HelpCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Bell,
  Globe,
  Bot,
  Link2,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Settings,
  Radio,
  Webhook,
  ArrowLeftRight,
  Clock,
  Layers,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Search,
  Play,
  Pause,
  Key,
  FileText,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Haptics } from '@/utils/haptics';
import { useNavigation } from '@/hooks/useNavigation';

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  subsections: {
    title: string;
    content: string;
  }[];
}

const TUTORIAL_DATA: TutorialSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen size={18} color={Colors.amber} />,
    color: Colors.amber,
    subsections: [
      {
        title: 'Welcome to Emperial Bot',
        content:
          'Emperial Bot is a professional-grade trading platform that provides real-time market data, technical analysis, automated trading bots, signal alerts, and broker integrations — all in one app.\n\nThe app connects to live market feeds including Binance spot & futures, giving you institutional-quality tools on your mobile device.',
      },
      {
        title: 'Navigation Overview',
        content:
          'The app is organized into tabs at the bottom of the screen:\n\n• Dashboard — Live market overview, composite scores, and indicator summaries\n• Chart — Full interactive candlestick chart with indicators and trade levels\n• Indicators — Detailed technical indicator readings with customizable parameters\n• Signals — Alert rules engine with webhook integrations\n• Markets — Browse and select instruments with live prices\n• Bot — Automated trading and arbitrage bots\n• Brokers — Connect to external trading platforms\n• Help — This tutorial and reference guide',
      },
      {
        title: 'Selecting an Instrument',
        content:
          'Go to the Markets tab to browse available instruments. They are organized by category:\n\n• Crypto — BTC, ETH, SOL, BNB, XRP, DOGE, and more\n• Indices — ES, NQ, YM, RTY (E-mini futures)\n• Metals — Gold (GC), Silver (SI), Copper (HG), Platinum (PL)\n• Energy — Crude Oil (CL), Natural Gas (NG)\n• Currencies — EUR, GBP, JPY, AUD, CAD pairs\n• Bonds — ZN, ZB, ZT, ZF\n• Agriculture — Corn (ZC), Wheat (ZW), Soybeans (ZS)\n• Softs — Cocoa, Cotton, Coffee, Sugar\n• Meats — Live Cattle, Lean Hogs\n\nTap any instrument to select it. A green checkmark shows the active selection. The selected instrument will be used across Dashboard, Chart, Indicators, and Signals.',
      },
      {
        title: 'Live Data & Connectivity',
        content:
          'Instruments with a Wi-Fi icon support live data from Binance or futures APIs. When live mode is active, you\'ll see a pulsing green dot on the Dashboard.\n\n• Green dot = live WebSocket connected\n• Orange dot = polling mode (refreshing periodically)\n• Red indicator = connection error (tap retry to reconnect)\n\nYou can toggle live mode on/off from the Dashboard header. Adjust the refresh rate (1s, 2s, 5s, 10s, 30s) to balance between speed and data usage.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <BarChart3 size={18} color="#38bdf8" />,
    color: '#38bdf8',
    subsections: [
      {
        title: 'Price Header',
        content:
          'The top of the Dashboard shows the current instrument, price, and percentage change. The color reflects the trend:\n\n• Green = price up from previous close\n• Red = price down from previous close\n\nTap the timeframe button (e.g. "5m") to open the timeframe picker and change between intervals like 1s, 5s, 1m, 5m, 15m, 1h, 4h, 1d, etc.',
      },
      {
        title: 'Composite Score',
        content:
          'The Composite Score is a combined reading from all active indicators, scored from -8 (extremely bearish) to +8 (extremely bullish).\n\n• Strong Buy: +5 to +8\n• Buy: +2 to +5\n• Neutral: -2 to +2\n• Sell: -5 to -2\n• Strong Sell: -8 to -5\n\nThe animated bar visually represents the current bias. Signal badges (LONG, SHORT, FIRE) appear based on indicator confluence.',
      },
      {
        title: 'Oscillator Bars',
        content:
          'Below the composite score, oscillator bars show individual indicator readings:\n\n• RSI — Relative Strength Index (overbought/oversold)\n• MACD — Moving Average Convergence Divergence\n• Stochastic — Momentum oscillator\n• CCI — Commodity Channel Index\n• Williams %R — Overbought/oversold momentum\n• MFI — Money Flow Index\n\nEach bar extends left (bearish) or right (bullish) from center, with the exact value shown alongside.',
      },
      {
        title: 'Ticker Data & Recent Trades',
        content:
          'When live data is active, you\'ll see real-time ticker information:\n\n• 24h High / Low — Daily trading range\n• 24h Volume — Total volume in the last 24 hours\n• VWAP — Volume Weighted Average Price\n• Bid/Ask — Current best bid and ask\n\nRecent Trades shows the last executed trades with time, price, and direction (buy/sell) color coded.',
      },
      {
        title: 'Time Sync',
        content:
          'The Dashboard includes a time synchronization module that syncs with NTP servers to ensure accurate timestamps.\n\n• Synced = green shield icon, offset shown in ms\n• Drift shows how much local clock differs from server time\n• Tap "Resync" to force a new time synchronization',
      },
    ],
  },
  {
    id: 'chart',
    title: 'Chart',
    icon: <TrendingUp size={18} color={Colors.green} />,
    color: Colors.green,
    subsections: [
      {
        title: 'Interactive Candlestick Chart',
        content:
          'The Chart tab displays a professional candlestick chart with the following features:\n\n• Pinch to zoom in/out\n• Drag to pan across time\n• Double-tap to reset view\n• Long press for crosshair with OHLCV data\n\nGreen candles = bullish (close > open)\nRed candles = bearish (close < open)\n\nThe chart updates in real-time when live data is active.',
      },
      {
        title: 'Timeframe Selection',
        content:
          'Tap any timeframe button below the chart to switch intervals:\n\n• Ultra-fast: 1s, 5s, 15s, 30s, 45s\n• Minutes: 1m, 3m, 5m, 15m, 30m\n• Hours: 1h, 4h\n• Daily+: 1d, 1w, 1mo, 1y\n\nEach timeframe recalculates all indicators and reloads candle data accordingly.',
      },
      {
        title: 'Indicator Overlays',
        content:
          'The chart renders technical indicator overlays directly on the price chart:\n\n• Moving Averages (SMA/EMA) — Trend lines\n• Bollinger Bands — Volatility bands\n• VWAP — Volume weighted line\n• Pivot Points — Support/resistance levels\n\nEnable or disable overlays from the Indicators tab. Each overlay uses a distinct color for easy identification.',
      },
      {
        title: 'Trade Levels',
        content:
          'Below the chart is the Trade Levels panel (expanded by default). It allows you to set:\n\n• Entry Price — Tap "Set Entry" to lock in the current price\n• Stop Loss — Automated stop loss level with toggle\n• Trailing Stop — Offset-based trailing stop\n• TP 1, TP 2, TP 3 — Three take profit targets\n\nEach level can be individually enabled/disabled. When entry is set, P&L percentages are calculated and displayed for each target.\n\nThe clear button (X) resets all levels. Trade levels are also drawn on the chart as horizontal lines with labels.',
      },
    ],
  },
  {
    id: 'indicators',
    title: 'Indicators',
    icon: <Activity size={18} color={Colors.purple} />,
    color: Colors.purple,
    subsections: [
      {
        title: 'Indicator Overview',
        content:
          'The Indicators tab provides detailed technical analysis readings for the selected instrument and timeframe.\n\nIndicators are grouped into categories:\n• Trend — SMA, EMA, MACD, ADX\n• Momentum — RSI, Stochastic, CCI, Williams %R, MFI\n• Volatility — Bollinger Bands, ATR, Keltner Channels\n• Volume — OBV, VWAP, Volume Profile\n\nEach indicator shows its current value and a bull/bear/neutral signal.',
      },
      {
        title: 'Customizable Parameters',
        content:
          'Each indicator has adjustable parameters via the settings icon:\n\n• Period/Length — Number of bars used in calculation\n• Multiplier — Standard deviation or ATR multiplier\n• Source — Close, Open, High, Low, HL2, HLC3\n\nUse the stepper controls (+ / -) to adjust values. Tap the reset icon to restore defaults. Changes are applied instantly and reflected on the Chart overlay.',
      },
      {
        title: 'Scalable Mini-Charts',
        content:
          'Each indicator section includes a mini chart showing the indicator\'s values plotted over recent history. These charts:\n\n• Show the indicator line in its signature color\n• Include reference lines (e.g., RSI 30/70, zero line for MACD)\n• Auto-scale to fit the data range\n• Update in real-time with new data',
      },
      {
        title: 'Visibility Toggle',
        content:
          'Use the eye icon on each indicator to show/hide it from the main chart overlay. Hidden indicators still calculate values but won\'t clutter the chart.\n\nThis lets you keep your chart clean while monitoring multiple indicators in the Indicators tab.',
      },
    ],
  },
  {
    id: 'signals',
    title: 'Signals & Alerts',
    icon: <Bell size={18} color={Colors.orange} />,
    color: Colors.orange,
    subsections: [
      {
        title: 'Alert Rules Engine',
        content:
          'The Signals tab is a powerful alert system. Create rules that trigger when specific conditions are met:\n\n• Price crosses above/below a level\n• RSI enters overbought/oversold\n• MACD crossover (bullish/bearish)\n• Bollinger Band breakout\n• Volume spike\n• Composite score threshold\n\nEach rule can have multiple conditions combined with AND logic.',
      },
      {
        title: 'Creating an Alert',
        content:
          'Tap the "+" button to create a new alert:\n\n1. Name your alert (e.g., "BTC Breakout")\n2. Select the condition type from the dropdown\n3. Set the threshold value\n4. Choose actions: notification, webhook, or both\n5. Optionally set an expiry time\n6. Tap Save\n\nActive alerts show a green indicator. Triggered alerts appear in the History section with timestamp and details.',
      },
      {
        title: 'Webhook Integration',
        content:
          'Connect alerts to external services via webhooks:\n\n1. Go to the Webhook Config section\n2. Enter your webhook URL (e.g., Discord, Slack, TradingView)\n3. Customize the payload template using variables:\n   • {{symbol}} — Instrument symbol\n   • {{price}} — Current price\n   • {{action}} — Buy/Sell signal\n   • {{timestamp}} — Alert time\n4. Test the webhook with the "Send Test" button\n5. Copy the webhook URL for external use\n\nPayload templates support R-Pro Trader format for direct broker integration.',
      },
      {
        title: 'Alert History',
        content:
          'The History tab shows all triggered alerts with:\n\n• Timestamp of when the alert fired\n• The condition that was met\n• The price at trigger time\n• Whether webhook delivery succeeded or failed\n\nUse the "Clear History" button to reset. Failed webhook deliveries can be retried.',
      },
      {
        title: 'Signal Monitor',
        content:
          'The Signal Monitor runs continuously in the background, evaluating all active alert rules against incoming market data.\n\n• Green pulse = monitor is active and checking\n• Pause button to temporarily stop monitoring\n• Stats show: total checks, triggers, and success rate\n\nThe monitor respects the current instrument and timeframe selection.',
      },
    ],
  },
  {
    id: 'markets',
    title: 'Markets',
    icon: <Globe size={18} color={Colors.cyan} />,
    color: Colors.cyan,
    subsections: [
      {
        title: 'Instrument Browser',
        content:
          'The Markets tab lets you browse all available instruments organized by category. Use the search bar to quickly find any symbol.\n\nEach instrument card shows:\n• Symbol and full name\n• Exchange/market\n• Current price (live if available)\n• 24h change percentage\n• Wi-Fi icon for live data availability',
      },
      {
        title: 'Category Filters',
        content:
          'Filter instruments by category using the horizontal pill buttons:\n\n• All — Show everything\n• Crypto — Digital currencies\n• Indices — Stock index futures\n• Metals — Precious and base metals\n• Energy — Oil, gas, and fuels\n• Currencies — Forex pairs\n• Bonds — Interest rate futures\n• Agriculture — Grain and crop futures\n• Softs — Coffee, cocoa, sugar, cotton\n• Meats — Livestock futures\n\nEach category has a distinct accent color for quick visual identification.',
      },
      {
        title: 'Live Price Updates',
        content:
          'Instruments with live data support show real-time price updates directly in the market list. Prices flash green or red briefly when they change.\n\nLive data is sourced from:\n• Binance Spot API — For major crypto pairs\n• Binance Futures API — For perpetual contracts\n• Simulated feeds — For traditional futures (indices, metals, energy, etc.)\n\nThe data source is indicated by the icon next to each instrument.',
      },
    ],
  },
  {
    id: 'bot',
    title: 'Trading & Arbitrage Bots',
    icon: <Bot size={18} color={Colors.green} />,
    color: Colors.green,
    subsections: [
      {
        title: 'Bot Overview',
        content:
          'The Bot tab provides automated trading capabilities with two bot types:\n\n1. Trading Bot — Signal-based automated trading\n2. Arbitrage Bot — Cross-exchange price difference exploitation\n\nAccess each bot from the Bot hub screen. Each bot has its own dashboard, settings, and trade history.',
      },
      {
        title: 'Trading Bot',
        content:
          'The Trading Bot executes trades based on signal rules:\n\n• Overview Tab — Live P&L, win rate, total trades, active positions\n• Trades Tab — Full trade history with entry/exit prices and profit\n• Signals Tab — Active signals being monitored\n\nControls:\n• Play/Pause — Start or stop the bot\n• Settings gear — Configure bot parameters\n\nBot Settings include:\n• Strategy type (Trend Following, Mean Reversion, Scalping, etc.)\n• Risk per trade (percentage of capital)\n• Max concurrent positions\n• Stop loss and take profit percentages\n• Trailing stop toggle\n• Cooldown period between trades',
      },
      {
        title: 'Arbitrage Bot',
        content:
          'The Arbitrage Bot scans for price discrepancies across exchanges:\n\n• Monitors price differences between Binance Spot, Binance Futures, and other configured exchanges\n• Calculates spread percentage in real-time\n• Shows potential profit after fees\n• Auto-executes when spread exceeds your minimum threshold\n\nDashboard shows:\n• Active opportunities with spread %\n• Historical arbitrage trades\n• Total profit from arbitrage\n• Success rate and average profit per trade',
      },
      {
        title: 'Bot Settings',
        content:
          'Each bot has a dedicated settings panel:\n\n• Enable/Disable — Master toggle to activate the bot\n• Risk Management — Set max loss per day, position sizing\n• Execution Mode — Paper trading vs live (requires API keys)\n• Notifications — Get alerts for bot trades\n• Auto-restart — Resume after disconnection\n\n⚠️ Warning: Live trading with real API keys carries financial risk. Always start with paper trading to validate your strategy.',
      },
    ],
  },
  {
    id: 'brokers',
    title: 'Broker Integrations',
    icon: <Link2 size={18} color={Colors.pink} />,
    color: Colors.pink,
    subsections: [
      {
        title: 'Supported Brokers',
        content:
          'The Brokers tab lets you connect to external trading platforms:\n\n• TradingView — Webhook alerts integration\n• Binance — Direct API trading\n• Bybit — API connection for spot & derivatives\n• OKX — API trading support\n• Interactive Brokers — Professional broker integration\n• MetaTrader 4/5 — Expert Advisor webhook bridge\n• NinjaTrader — Automated trading connection\n• R-Pro Trader — Direct webhook payload support\n\nEach broker card shows connection status and supported features.',
      },
      {
        title: 'Connecting a Broker',
        content:
          'To connect a broker:\n\n1. Tap the broker card\n2. Enter your API Key and Secret\n3. (Optional) Set IP whitelist for security\n4. Tap "Connect"\n5. The status indicator turns green on success\n\n🔒 Security: API keys are stored locally on your device. We recommend using read-only keys or keys with restricted permissions where possible.',
      },
      {
        title: 'Arbitrage Between Brokers',
        content:
          'The Arbitrage page (accessible from Brokers) enables cross-platform arbitrage:\n\n1. Select two or more connected brokers\n2. Choose the instrument to monitor\n3. Set minimum spread threshold\n4. Enable the scanner\n\nThe scanner continuously compares prices across your connected brokers and highlights profitable opportunities. When the spread exceeds your threshold, it can auto-execute if enabled.',
      },
      {
        title: 'Webhook URLs',
        content:
          'Each broker connection provides a unique webhook URL that you can use in external services:\n\n• Copy the webhook URL from the broker card\n• Paste it into TradingView alerts, custom scripts, or other signal providers\n• The webhook receives JSON payloads and routes trades to the connected broker\n\nTest your webhook using the "Send Test" button to verify connectivity before going live.',
      },
    ],
  },
  {
    id: 'trade-levels',
    title: 'Trade Levels',
    icon: <Target size={18} color="#eab308" />,
    color: '#eab308',
    subsections: [
      {
        title: 'Setting Up Trade Levels',
        content:
          'Trade Levels appear below the Chart and allow you to define your trade plan:\n\n1. Tap "Set Entry" to capture the current price as your entry\n2. Stop Loss and Take Profit levels are auto-calculated based on defaults (2% SL, 2/4/6% TP)\n3. Adjust any level by typing a custom price\n4. Toggle individual levels on/off with the switch\n\nThe panel expands by default so you can immediately start planning trades.',
      },
      {
        title: 'Level Types',
        content:
          '• Entry (Yellow) — Your planned entry price. Tap "Set Entry" to lock current price, or "Update Entry" to refresh.\n\n• Stop Loss (Red) — Fixed stop loss price. Shows P&L % relative to entry.\n\n• Trailing Stop (Orange) — Offset-based trailing stop. The value represents the trailing distance, not an absolute price.\n\n• TP 1 (Green) — First take profit target\n• TP 2 (Teal) — Second take profit target\n• TP 3 (Cyan) — Third take profit target\n\nEach TP level shows the potential profit % from entry.',
      },
      {
        title: 'Chart Visualization',
        content:
          'When Trade Levels are set, they appear as colored horizontal lines on the main chart:\n\n• Dashed lines for each active level\n• Color-coded to match the level type\n• Labels on the right side showing the price\n• Entry line is always solid yellow\n\nThis gives you a visual reference for your trade plan directly on the price chart.',
      },
      {
        title: 'Summary Bar',
        content:
          'When entry and at least one level is active, a summary bar appears at the bottom of the Trade Levels panel showing:\n\n• SL % — Risk percentage\n• TP1/TP2/TP3 % — Reward percentages\n\nThis gives you a quick risk/reward overview for your planned trade.',
      },
    ],
  },
  {
    id: 'tips',
    title: 'Pro Tips & Best Practices',
    icon: <Lightbulb size={18} color="#fde68a" />,
    color: '#fde68a',
    subsections: [
      {
        title: 'Optimal Workflow',
        content:
          '1. Start in Markets — Select your instrument\n2. Check Dashboard — Review composite score and overall bias\n3. Open Chart — Analyze price action with indicators\n4. Set Trade Levels — Plan your entry, stops, and targets\n5. Configure Signals — Set alerts for your conditions\n6. (Optional) Enable Bot — Let the bot manage execution\n\nThis top-down approach ensures you have a complete picture before entering any trade.',
      },
      {
        title: 'Risk Management',
        content:
          '• Never risk more than 1-2% of your capital per trade\n• Always set a stop loss before entering\n• Use the trailing stop for trending markets\n• Scale out using TP1, TP2, TP3 levels\n• Monitor the composite score for confluence\n• Review bot performance regularly and adjust settings\n• Start with paper trading before going live',
      },
      {
        title: 'Timeframe Strategy',
        content:
          '• Scalping: 1s - 1m timeframes, tight stops\n• Day Trading: 3m - 15m, moderate stops\n• Swing Trading: 1h - 4h, wider stops\n• Position Trading: 1d - 1w, widest stops\n\nHigher timeframes give more reliable signals but fewer opportunities. Lower timeframes give more opportunities but more noise. Use multiple timeframes for confirmation.',
      },
      {
        title: 'Indicator Combinations',
        content:
          'Effective indicator combinations:\n\n• Trend + Momentum: EMA crossover + RSI confirmation\n• Volatility Breakout: Bollinger Band squeeze + Volume spike\n• Mean Reversion: RSI oversold + Support level + MACD divergence\n• Trend Following: ADX > 25 + EMA alignment + MACD positive\n\nAvoid using too many indicators — 2-3 complementary indicators are sufficient. The Composite Score already combines multiple signals for you.',
      },
      {
        title: 'Troubleshooting',
        content:
          '• No live data? Check your internet connection and retry from Dashboard\n• Chart not updating? Toggle live mode off and on\n• Webhook not firing? Verify the URL in Signals settings and send a test\n• Bot not trading? Ensure it\'s enabled and has valid conditions\n• Indicators showing "--"? The selected timeframe may not have enough data yet\n• App feels slow? Reduce the live refresh rate to 5s or 10s',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Disclaimers',
    icon: <Shield size={18} color={Colors.red} />,
    color: Colors.red,
    subsections: [
      {
        title: 'Risk Warning',
        content:
          'Trading financial instruments carries a high level of risk. You can lose some or all of your invested capital. Past performance is not indicative of future results.\n\n• Only trade with money you can afford to lose\n• Understand the risks of leveraged products\n• Automated bots can execute trades rapidly — monitor them closely\n• API keys grant access to your exchange account — use restricted permissions\n• Never share your API keys with anyone',
      },
      {
        title: 'Data Accuracy',
        content:
          'While Emperial Bot strives for accuracy:\n\n• Market data may have slight delays depending on the source\n• Indicator calculations are based on available candle data\n• Simulated data is used for instruments without live API support\n• Always verify critical trading decisions with your broker\'s platform\n• The app is a tool to assist your analysis, not a guarantee of profit',
      },
      {
        title: 'API Key Security',
        content:
          'Your API keys are stored locally on your device only. Best practices:\n\n• Use API keys with trading permissions only (no withdrawal)\n• Set IP restrictions on your exchange API settings\n• Rotate keys periodically\n• Revoke keys immediately if you suspect compromise\n• Never screenshot or share your keys',
      },
    ],
  },
];

function SectionAccordion({ section }: { section: TutorialSection }) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impact('light');
    }
    setExpanded((p) => !p);
  }, []);

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded, animHeight]);

  return (
    <View style={styles.sectionContainer}>
      <Pressable onPress={toggle} style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: section.color + '15' }]}>
          {section.icon}
        </View>
        <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
        <View style={styles.sectionChevron}>
          {expanded ? (
            <ChevronUp size={16} color={Colors.text2} />
          ) : (
            <ChevronDown size={16} color={Colors.text2} />
          )}
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.subsectionsWrap}>
          {section.subsections.map((sub, idx) => (
            <View key={idx} style={styles.subsection}>
              <View style={styles.subHeaderRow}>
                <View style={[styles.subDot, { backgroundColor: section.color }]} />
                <Text style={styles.subTitle}>{sub.title}</Text>
              </View>
              <Text style={styles.subContent}>{sub.content}</Text>
              {idx < section.subsections.length - 1 && <View style={styles.subDivider} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { navigate, goBack, switchTab } = useNavigation();

  return (
    <View style={styles.root}>
      <View style={[styles.headerArea, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <HelpCircle size={22} color={Colors.amber} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Help & Tutorial</Text>
            <Text style={styles.headerSubtitle}>Complete guide to Emperial Bot</Text>
          </View>
        </View>
        <View style={styles.headerAccent} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickStartCard}>
          <View style={styles.quickStartHeader}>
            <Zap size={14} color={Colors.amber} />
            <Text style={styles.quickStartTitle}>Quick Start</Text>
          </View>
          <Text style={styles.quickStartText}>
            1. Go to <Text style={styles.highlight}>Markets</Text> and select an instrument{'\n'}
            2. View analysis on the <Text style={styles.highlight}>Dashboard</Text>{'\n'}
            3. Open <Text style={styles.highlight}>Chart</Text> for price action & set Trade Levels{'\n'}
            4. Configure <Text style={styles.highlight}>Signals</Text> for alerts{'\n'}
            5. Enable <Text style={styles.highlight}>Bot</Text> for automated trading
          </Text>
        </View>

        {TUTORIAL_DATA.map((section) => (
          <SectionAccordion key={section.id} section={section} />
        ))}

        <Pressable
          style={styles.termsCard}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impact('light');
            }
            navigate('terms');
          }}
          testID="terms-link"
        >
          <View style={styles.termsIconWrap}>
            <FileText size={18} color={Colors.amber} />
          </View>
          <View style={styles.termsTextWrap}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsSubtitle}>Legal agreement & policies</Text>
          </View>
          <ChevronRight size={16} color={Colors.text2} />
        </Pressable>

        <Pressable
          style={[styles.termsCard, { borderColor: Colors.cyan + '20' }]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impact('light');
            }
            navigate('privacy');
          }}
          testID="privacy-link"
        >
          <View style={[styles.termsIconWrap, { backgroundColor: Colors.cyan + '12', borderColor: Colors.cyan + '30' }]}>
            <Shield size={18} color={Colors.cyan} />
          </View>
          <View style={styles.termsTextWrap}>
            <Text style={styles.termsTitle}>Privacy Policy</Text>
            <Text style={styles.termsSubtitle}>How we protect your data</Text>
          </View>
          <ChevronRight size={16} color={Colors.text2} />
        </Pressable>

        <Pressable
          style={[styles.termsCard, { borderColor: Colors.green + '20' }]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impact('light');
            }
            navigate('about');
          }}
          testID="about-link"
        >
          <View style={[styles.termsIconWrap, { backgroundColor: Colors.green + '12', borderColor: Colors.green + '30' }]}>
            <Info size={18} color={Colors.green} />
          </View>
          <View style={styles.termsTextWrap}>
            <Text style={styles.termsTitle}>About Emperial Bot</Text>
            <Text style={styles.termsSubtitle}>Version, features & contact</Text>
          </View>
          <ChevronRight size={16} color={Colors.text2} />
        </Pressable>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            Emperial Bot v1.0 — Professional Trading Suite
          </Text>
          <Text style={styles.footerSubtext}>
            © {new Date().getFullYear()} Emperial Solutions International, L.L.C.
          </Text>
          <Text style={styles.footerSubtext}>
            Developed by Tony Groves. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  headerArea: {
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.amber + '30',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 1,
  },
  headerAccent: {
    height: 2,
    backgroundColor: Colors.amber,
    opacity: 0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  quickStartCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.amber + '25',
  },
  quickStartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  quickStartTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  quickStartText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 21,
  },
  highlight: {
    color: Colors.amber,
    fontWeight: '700' as const,
  },
  sectionContainer: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sectionChevron: {
    padding: 4,
  },
  subsectionsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  subsection: {
    paddingTop: 12,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subContent: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 19,
    paddingLeft: 14,
  },
  subDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 12,
    marginLeft: 14,
  },
  footerCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginTop: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 4,
    textAlign: 'center',
  },
  termsCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.amber + '20',
    marginTop: 6,
  },
  termsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsTextWrap: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  termsSubtitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
});
