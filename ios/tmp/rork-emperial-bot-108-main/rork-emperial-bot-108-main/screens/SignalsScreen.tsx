import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Modal,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Webhook,
  ChevronRight,
  ChevronDown,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Copy,
  Settings,
  History,
  AlertTriangle,
  Radio,
  Shield,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  FileText,
  Sparkles,
  TrendingUp,
  Activity,
  Target,
  Layers,
  BarChart3,
} from 'lucide-react-native';
import { UniversalClipboard } from '@/utils/clipboard';
import { Colors, getAssetColor } from '@/constants/colors';
import { useAlerts } from '@/hooks/useAlerts';
import { useMarketData } from '@/hooks/useMarketData';
import { hasAnyLiveData, getCachedPrice } from '@/services/multiInstrumentPriceService';
import {
  AlertRule,
  AlertCondition,
  AlertAction,
  AlertEvent,
  WebhookConfig,
  CONDITION_LABELS,
  CONDITION_CATEGORIES,
  needsThreshold,
  generateId,
} from '@/services/alertEngine';
import { WEBHOOK_TEMPLATES, testWebhook } from '@/services/webhookService';
import { SPECS, CATEGORIES } from '@/constants/instruments';
import { Haptics } from '@/utils/haptics';

type TabView = 'rules' | 'events' | 'webhooks';

interface PresetRule {
  id: string;
  name: string;
  description: string;
  instrument: string;
  condition: AlertCondition;
  threshold?: number;
  action: AlertAction;
  cooldownMs: number;
  maxTriggers: number;
  category: 'realtime' | 'crossover' | 'momentum' | 'composite';
  icon: React.ReactNode;
  accentColor: string;
  priority: number;
}

const PRESET_RULES: PresetRule[] = [
  {
    id: 'preset_pressure_bull',
    name: 'Pressure Flip Bullish',
    description: 'Live momentum shift — pressure flips from bearish to bullish in real-time. Best for catching early reversals.',
    instrument: 'ES',
    condition: 'pressure_flip_bull',
    action: 'notify',
    cooldownMs: 10000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <Activity size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 1,
  },
  {
    id: 'preset_pressure_bear',
    name: 'Pressure Flip Bearish',
    description: 'Live momentum shift — pressure flips from bullish to bearish in real-time. Ideal for exits and short entries.',
    instrument: 'ES',
    condition: 'pressure_flip_bear',
    action: 'notify',
    cooldownMs: 10000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <Activity size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 2,
  },
  {
    id: 'preset_ema_cross_long',
    name: 'EMA Cross Long',
    description: 'Live EMA crossover — fast EMA crosses above slow EMA. Highest win-rate trend entry signal.',
    instrument: 'ES',
    condition: 'ema_cross_long',
    action: 'notify',
    cooldownMs: 12000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <TrendingUp size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 3,
  },
  {
    id: 'preset_ema_cross_short',
    name: 'EMA Cross Short',
    description: 'Live EMA crossover — fast EMA crosses below slow EMA. Early exit or reversal signal with real-time data.',
    instrument: 'ES',
    condition: 'ema_cross_short',
    action: 'notify',
    cooldownMs: 12000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <TrendingUp size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 4,
  },
  {
    id: 'preset_cloud_bull',
    name: 'Cloud Flip Bullish',
    description: 'Live cloud indicator flips bullish — confirms trend continuation. Pair with EMA cross for strong entries.',
    instrument: 'ES',
    condition: 'cloud_flip_bull',
    action: 'notify',
    cooldownMs: 15000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <Layers size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 5,
  },
  {
    id: 'preset_cloud_bear',
    name: 'Cloud Flip Bearish',
    description: 'Live cloud indicator flips bearish — confirms trend reversal. Strongest when paired with pressure flip.',
    instrument: 'ES',
    condition: 'cloud_flip_bear',
    action: 'notify',
    cooldownMs: 15000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <Layers size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 6,
  },
  {
    id: 'preset_price_spike',
    name: 'Price Spike ±0.5%',
    description: 'Live price move detection — fires on fast 0.5%+ moves. Catches breakouts and sudden reversals instantly.',
    instrument: 'ES',
    condition: 'price_change_pct',
    threshold: 0.5,
    action: 'notify',
    cooldownMs: 10000,
    maxTriggers: 0,
    category: 'realtime',
    icon: <Zap size={14} color={Colors.amber} />,
    accentColor: Colors.amber,
    priority: 7,
  },
  {
    id: 'preset_atr_buy',
    name: 'ATR Buy Signal',
    description: 'Volatility-adjusted buy — ATR confirms low-risk entry with optimal risk/reward. Best for scalps and day trades.',
    instrument: 'ES',
    condition: 'atr_buy',
    action: 'notify',
    cooldownMs: 20000,
    maxTriggers: 0,
    category: 'momentum',
    icon: <Target size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 8,
  },
  {
    id: 'preset_atr_sell',
    name: 'ATR Sell Signal',
    description: 'Volatility-adjusted sell — ATR confirms high-probability exit or short. Protects gains on extended moves.',
    instrument: 'ES',
    condition: 'atr_sell',
    action: 'notify',
    cooldownMs: 20000,
    maxTriggers: 0,
    category: 'momentum',
    icon: <Target size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 9,
  },
  {
    id: 'preset_rmp_buy',
    name: 'RMP Buy Signal',
    description: 'Risk-managed position buy — multi-indicator confluence entry. Highest consistency for swing trades.',
    instrument: 'ES',
    condition: 'rmp_buy',
    action: 'both',
    cooldownMs: 25000,
    maxTriggers: 0,
    category: 'momentum',
    icon: <Shield size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 10,
  },
  {
    id: 'preset_rmp_sell',
    name: 'RMP Sell Signal',
    description: 'Risk-managed position sell — multi-indicator confirmation exit. Reduces drawdown and locks in profits.',
    instrument: 'ES',
    condition: 'rmp_sell',
    action: 'both',
    cooldownMs: 25000,
    maxTriggers: 0,
    category: 'momentum',
    icon: <Shield size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 11,
  },
  {
    id: 'preset_composite_bull',
    name: 'Composite Score > 70',
    description: 'Strong bullish alignment — 70+ score means most indicators agree. High-confidence long entry zone.',
    instrument: 'ES',
    condition: 'composite_above',
    threshold: 70,
    action: 'notify',
    cooldownMs: 30000,
    maxTriggers: 0,
    category: 'composite',
    icon: <BarChart3 size={14} color={Colors.green} />,
    accentColor: Colors.green,
    priority: 12,
  },
  {
    id: 'preset_composite_bear',
    name: 'Composite Score < 30',
    description: 'Strong bearish alignment — sub-30 score means heavy sell pressure. High-confidence short or exit zone.',
    instrument: 'ES',
    condition: 'composite_below',
    threshold: 30,
    action: 'notify',
    cooldownMs: 30000,
    maxTriggers: 0,
    category: 'composite',
    icon: <BarChart3 size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 13,
  },
  {
    id: 'preset_golden_cross',
    name: 'Golden Cross',
    description: 'Long-term bullish crossover — 50 MA over 200 MA. Rare but powerful trend confirmation for swing positions.',
    instrument: 'ES',
    condition: 'golden_cross',
    action: 'both',
    cooldownMs: 60000,
    maxTriggers: 0,
    category: 'crossover',
    icon: <Sparkles size={14} color={Colors.gold} />,
    accentColor: Colors.gold,
    priority: 14,
  },
  {
    id: 'preset_death_cross',
    name: 'Death Cross',
    description: 'Long-term bearish crossover — 50 MA under 200 MA. Major trend shift warning — hedge or exit longs.',
    instrument: 'ES',
    condition: 'death_cross',
    action: 'both',
    cooldownMs: 60000,
    maxTriggers: 0,
    category: 'crossover',
    icon: <XCircle size={14} color={Colors.red} />,
    accentColor: Colors.red,
    priority: 15,
  },
];

const PRESET_CATEGORIES: { key: string; label: string; color: string; desc: string }[] = [
  { key: 'realtime', label: 'Live / Real-Time', color: Colors.cyan, desc: 'Fastest alerts — react to live price action, pressure shifts & EMA crosses as they happen' },
  { key: 'momentum', label: 'Momentum & Risk', color: Colors.amber, desc: 'ATR & RMP signals — volatility-filtered entries with built-in risk management' },
  { key: 'composite', label: 'Composite Score', color: Colors.green, desc: 'Multi-indicator alignment — highest confidence when most signals agree' },
  { key: 'crossover', label: 'Macro Crossovers', color: Colors.purple, desc: 'Rare but powerful — Golden/Death cross for longer-term trend shifts' },
];

function PulseIcon({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <View style={[s.statCard, { borderColor: color + '30' }]}>
      <View style={[s.statIconWrap, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function EventRow({ event }: { event: AlertEvent }) {
  const time = new Date(event.timestamp);
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isBullish = ['price_above', 'ema_cross_long', 'golden_cross', 'atr_buy', 'rmp_buy', 'pressure_flip_bull', 'cloud_flip_bull', 'composite_above'].includes(event.condition);
  const accentColor = isBullish ? Colors.green : Colors.red;

  return (
    <View style={s.eventRow}>
      <View style={[s.eventDot, { backgroundColor: accentColor }]} />
      <View style={s.eventContent}>
        <View style={s.eventHeader}>
          <Text style={[s.eventInstrument, { color: getAssetColor(event.instrument) }]}>
            {event.instrument}
          </Text>
          <Text style={s.eventCondition}>{CONDITION_LABELS[event.condition]}</Text>
          {event.webhookSent && (
            <View style={s.webhookBadge}>
              <Send size={8} color={Colors.cyan} />
            </View>
          )}
        </View>
        <Text style={s.eventMessage} numberOfLines={2}>{event.message}</Text>
        <View style={s.eventFooter}>
          <Text style={s.eventTime}>{dateStr} {timeStr}</Text>
          <Text style={s.eventPrice}>${event.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>
    </View>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onEdit,
  livePrice,
}: {
  rule: AlertRule;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  livePrice?: number;
}) {
  const isActive = rule.status === 'active';
  const isPaused = rule.status === 'paused';
  const isExpired = rule.status === 'expired';
  const accentColor = isActive ? Colors.green : isPaused ? Colors.amber : Colors.text2;

  return (
    <Pressable
      style={[s.ruleCard, { borderLeftColor: accentColor, opacity: isExpired ? 0.5 : 1 }]}
      onPress={onEdit}
      testID={`rule-${rule.id}`}
    >
      <View style={s.ruleHeader}>
        <View style={s.ruleHeaderLeft}>
          {isActive && <PulseIcon color={Colors.green} />}
          {isPaused && <Pause size={10} color={Colors.amber} />}
          {isExpired && <XCircle size={10} color={Colors.text2} />}
          <Text style={[s.ruleName, { color: isExpired ? Colors.text2 : Colors.text }]}>{rule.name}</Text>
        </View>
        <View style={s.ruleActions}>
          {livePrice !== undefined && livePrice > 0 && (
            <View style={s.rulePriceBadge}>
              <Text style={s.rulePriceText}>
                ${livePrice >= 1000 ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </Text>
            </View>
          )}
          <Pressable
            style={s.ruleActionBtn}
            onPress={(e) => { e.stopPropagation?.(); onToggle(); }}
          >
            {isActive ? <Pause size={14} color={Colors.amber} /> : <Play size={14} color={Colors.green} />}
          </Pressable>
          <Pressable
            style={s.ruleActionBtn}
            onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
          >
            <Trash2 size={14} color={Colors.red} />
          </Pressable>
        </View>
      </View>
      <View style={s.ruleBody}>
        <View style={s.ruleTag}>
          <Text style={[s.ruleTagText, { color: getAssetColor(rule.instrument) }]}>{rule.instrument}</Text>
        </View>
        <View style={[s.ruleTag, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
          <Text style={s.ruleTagText}>{CONDITION_LABELS[rule.condition]}</Text>
        </View>
        {rule.threshold !== undefined && needsThreshold(rule.condition) && (
          <View style={[s.ruleTag, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
            <Text style={s.ruleTagText}>{rule.threshold}</Text>
          </View>
        )}
        {(rule.action === 'webhook' || rule.action === 'both') && (
          <View style={[s.ruleTag, { backgroundColor: Colors.cyan + '15' }]}>
            <Webhook size={9} color={Colors.cyan} />
            <Text style={[s.ruleTagText, { color: Colors.cyan, marginLeft: 3 }]}>WH</Text>
          </View>
        )}
      </View>
      <View style={s.ruleFooter}>
        <Text style={s.ruleFooterText}>
          Triggered {rule.triggerCount}x
          {rule.maxTriggers > 0 ? ` / ${rule.maxTriggers} max` : ''}
        </Text>
        {rule.triggeredAt && (
          <Text style={s.ruleFooterText}>
            Last: {new Date(rule.triggeredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const alertData = useAlerts();
  const {
    rules,
    events,
    webhooks,
    engineRunning,
    setEngineRunning,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    clearEvents,
    addWebhook,
    updateWebhook,
    deleteWebhook,
    activeRuleCount,
    stats,
  } = alertData;

  const { instrument, price } = useMarketData();

  const {
    instrumentPrices,
    liveInstrumentCount,
    monitoredInstruments,
    instrumentLiveStatus,
  } = alertData;

  const [activeTab, setActiveTab] = useState<TabView>('rules');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const [newName, setNewName] = useState<string>('');
  const [newInstrument, setNewInstrument] = useState<string>(instrument);
  const [newCondition, setNewCondition] = useState<AlertCondition>('price_above');
  const [newThreshold, setNewThreshold] = useState<string>('');
  const [newAction, setNewAction] = useState<AlertAction>('notify');
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [newWebhookPayload, setNewWebhookPayload] = useState<string>('');
  const [newMaxTriggers, setNewMaxTriggers] = useState<string>('0');
  const [newCooldown, setNewCooldown] = useState<string>('30');
  const [showConditionPicker, setShowConditionPicker] = useState<boolean>(false);
  const [showInstrumentPicker, setShowInstrumentPicker] = useState<boolean>(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState<boolean>(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const [whName, setWhName] = useState<string>('');
  const [whUrl, setWhUrl] = useState<string>('');
  const [whMethod, setWhMethod] = useState<'POST' | 'GET'>('POST');
  const [whTesting, setWhTesting] = useState<boolean>(false);
  const [whTestResult, setWhTestResult] = useState<string>('');

  const resetForm = useCallback(() => {
    setNewName('');
    setNewInstrument(instrument);
    setNewCondition('price_above');
    setNewThreshold(String(Math.round(price)));
    setNewAction('notify');
    setNewWebhookUrl('');
    setNewWebhookPayload('');
    setNewMaxTriggers('0');
    setNewCooldown('30');
    setEditingRule(null);
  }, [instrument, price]);

  const openCreate = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
    Haptics.impact('light');
  }, [resetForm]);

  const openEdit = useCallback((rule: AlertRule) => {
    setEditingRule(rule);
    setNewName(rule.name);
    setNewInstrument(rule.instrument);
    setNewCondition(rule.condition);
    setNewThreshold(String(rule.threshold ?? ''));
    setNewAction(rule.action);
    setNewWebhookUrl(rule.webhookUrl ?? '');
    setNewWebhookPayload(rule.webhookPayload ?? '');
    setNewMaxTriggers(String(rule.maxTriggers));
    setNewCooldown(String(rule.cooldownMs / 1000));
    setShowCreateModal(true);
  }, []);

  const handleSave = useCallback(() => {
    const name = newName.trim() || `${newInstrument} ${CONDITION_LABELS[newCondition]}`;
    const threshold = parseFloat(newThreshold) || undefined;
    const maxTriggers = parseInt(newMaxTriggers, 10) || 0;
    const cooldownMs = (parseInt(newCooldown, 10) || 30) * 1000;

    if (editingRule) {
      updateRule(editingRule.id, {
        name,
        instrument: newInstrument,
        condition: newCondition,
        threshold,
        action: newAction,
        webhookUrl: newWebhookUrl || undefined,
        webhookPayload: newWebhookPayload || undefined,
        maxTriggers,
        cooldownMs,
      });
    } else {
      addRule({
        name,
        instrument: newInstrument,
        condition: newCondition,
        threshold,
        action: newAction,
        webhookUrl: newWebhookUrl || undefined,
        webhookPayload: newWebhookPayload || undefined,
        status: 'active',
        maxTriggers,
        cooldownMs,
      });
    }

    setShowCreateModal(false);
    Haptics.notification('success');
  }, [newName, newInstrument, newCondition, newThreshold, newAction, newWebhookUrl, newWebhookPayload, newMaxTriggers, newCooldown, editingRule, addRule, updateRule]);

  const handleDeleteRule = useCallback((id: string) => {
    Alert.alert('Delete Alert', 'Remove this alert rule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRule(id) },
    ]);
  }, [deleteRule]);

  const handleSaveWebhook = useCallback(() => {
    if (!whUrl.trim()) return;
    addWebhook({
      name: whName.trim() || 'Webhook',
      url: whUrl.trim(),
      method: whMethod,
      headers: {},
      enabled: true,
    });
    setShowWebhookModal(false);
    setWhName('');
    setWhUrl('');
  }, [whName, whUrl, whMethod, addWebhook]);

  const handleTestWebhook = useCallback(async () => {
    if (!whUrl.trim()) return;
    setWhTesting(true);
    setWhTestResult('');
    const result = await testWebhook(whUrl.trim(), whMethod);
    setWhTesting(false);
    if (result.success) {
      setWhTestResult(`Success (${result.statusCode}) in ${result.responseTime}ms`);
    } else {
      setWhTestResult(`Failed: ${result.error ?? `Status ${result.statusCode}`}`);
    }
  }, [whUrl, whMethod]);

  const allSymbols = useMemo(() => {
    const syms: string[] = [];
    CATEGORIES.forEach((cat) => cat.symbols.forEach((s) => syms.push(s)));
    return syms;
  }, []);

  return (
    <View style={s.container}>
      <View style={s.statsRow}>
        <StatCard
          label="Active"
          value={activeRuleCount}
          color={Colors.green}
          icon={<Bell size={14} color={Colors.green} />}
        />
        <StatCard
          label="Triggered"
          value={stats.totalTriggered}
          color={Colors.amber}
          icon={<Zap size={14} color={Colors.amber} />}
        />
        <StatCard
          label="Webhooks"
          value={stats.webhooksSent}
          color={Colors.cyan}
          icon={<Send size={14} color={Colors.cyan} />}
        />
        <StatCard
          label="24h"
          value={stats.last24h}
          color={Colors.purple}
          icon={<Clock size={14} color={Colors.purple} />}
        />
      </View>

      <View style={s.engineBar}>
        <View style={s.engineLeft}>
          {engineRunning ? <PulseIcon color={Colors.green} /> : <BellOff size={12} color={Colors.text2} />}
          <Text style={[s.engineText, { color: engineRunning ? Colors.green : Colors.text2 }]}>
            {engineRunning ? 'Engine Active' : 'Engine Paused'}
          </Text>
        </View>
        <Switch
          value={engineRunning}
          onValueChange={setEngineRunning}
          trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
          thumbColor={engineRunning ? Colors.green : Colors.text2}
        />
      </View>

      {monitoredInstruments.length > 0 && engineRunning && (
        <View style={s.liveMonitorBar}>
          <View style={s.liveMonitorLeft}>
            <Radio size={11} color={Colors.cyan} />
            <Text style={s.liveMonitorText}>
              Monitoring {monitoredInstruments.length} instrument{monitoredInstruments.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.liveChipScroll} contentContainerStyle={s.liveChipContainer}>
            {monitoredInstruments.map((inst) => {
              const status = instrumentLiveStatus.get(inst);
              const livePrice = status?.price ?? getCachedPrice(inst)?.price;
              const isLive = !!status?.isLive || !!getCachedPrice(inst);
              const hasData = hasAnyLiveData(inst);
              return (
                <View
                  key={inst}
                  style={[
                    s.liveChip,
                    { borderColor: isLive ? Colors.green + '40' : hasData ? Colors.amber + '40' : Colors.text3 + '30' },
                  ]}
                >
                  <View style={[s.liveChipDot, { backgroundColor: isLive ? Colors.green : hasData ? Colors.amber : Colors.text3 }]} />
                  <Text style={[s.liveChipSymbol, { color: getAssetColor(inst) }]}>{inst}</Text>
                  {livePrice !== undefined && livePrice > 0 && (
                    <Text style={s.liveChipPrice}>
                      ${livePrice >= 1000 ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={s.tabBar}>
        {(['rules', 'events', 'webhooks'] as TabView[]).map((tab) => (
          <Pressable
            key={tab}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            {tab === 'rules' && <Shield size={13} color={activeTab === tab ? Colors.amber : Colors.text2} />}
            {tab === 'events' && <History size={13} color={activeTab === tab ? Colors.amber : Colors.text2} />}
            {tab === 'webhooks' && <Webhook size={13} color={activeTab === tab ? Colors.amber : Colors.text2} />}
            <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
              {tab === 'rules' ? `Rules (${rules.length})` : tab === 'events' ? `Events (${events.length})` : `Hooks (${webhooks.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={s.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'rules' && (
          <>
            <Pressable style={s.addButton} onPress={openCreate} testID="add-alert-btn">
              <Plus size={16} color={Colors.bg0} />
              <Text style={s.addButtonText}>New Alert Rule</Text>
            </Pressable>

            {rules.length === 0 && (
              <View style={s.emptyState}>
                <Bell size={40} color={Colors.text3} />
                <Text style={s.emptyTitle}>No Alert Rules</Text>
                <Text style={s.emptySubtitle}>Create your first alert to get notified on price movements, crossovers, and signal changes.</Text>
              </View>
            )}

            <View style={s.presetsSection}>
              <View style={s.presetsHeader}>
                <View style={s.presetsHeaderLeft}>
                  <Sparkles size={16} color={Colors.amber} />
                  <Text style={s.presetsTitle}>Recommended Presets</Text>
                </View>
                <Pressable
                  style={s.addAllBtn}
                  onPress={() => {
                    const existingConditions = new Set(rules.map(r => r.condition));
                    let added = 0;
                    PRESET_RULES.forEach((preset) => {
                      if (!existingConditions.has(preset.condition)) {
                        addRule({
                          name: preset.name,
                          instrument: instrument,
                          condition: preset.condition,
                          threshold: preset.threshold,
                          action: preset.action,
                          status: 'active',
                          maxTriggers: preset.maxTriggers,
                          cooldownMs: preset.cooldownMs,
                        });
                        existingConditions.add(preset.condition);
                        added++;
                      }
                    });
                    Haptics.notification('success');
                    Alert.alert('Presets Added', `${added} alert rules added for ${instrument}`);
                  }}
                >
                  <Plus size={11} color={Colors.bg0} />
                  <Text style={s.addAllBtnText}>Add All</Text>
                </Pressable>
              </View>
              <Text style={s.presetsSubtitle}>
                Optimized for consistent trades — live real-time data alerts are prioritized first for fastest execution
              </Text>

              {PRESET_CATEGORIES.map((cat) => {
                const presets = PRESET_RULES.filter(p => p.category === cat.key).sort((a, b) => a.priority - b.priority);
                if (presets.length === 0) return null;
                return (
                  <View key={cat.key} style={s.presetCatBlock}>
                    <View style={s.presetCatHeader}>
                      <View style={[s.presetCatDot, { backgroundColor: cat.color }]} />
                      <Text style={[s.presetCatLabel, { color: cat.color }]}>{cat.label}</Text>
                      {cat.key === 'realtime' && (
                        <View style={s.liveBadge}>
                          <PulseIcon color={Colors.cyan} />
                          <Text style={s.liveBadgeText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.presetCatDesc}>{cat.desc}</Text>
                    {presets.map((preset) => {
                      const alreadyAdded = rules.some(r => r.condition === preset.condition && r.instrument === instrument);
                      return (
                        <Pressable
                          key={preset.id}
                          style={[s.presetCard, alreadyAdded && s.presetCardAdded]}
                          onPress={() => {
                            if (alreadyAdded) return;
                            addRule({
                              name: preset.name,
                              instrument: instrument,
                              condition: preset.condition,
                              threshold: preset.threshold,
                              action: preset.action,
                              status: 'active',
                              maxTriggers: preset.maxTriggers,
                              cooldownMs: preset.cooldownMs,
                            });
                            Haptics.impact('medium');
                          }}
                          testID={`preset-${preset.id}`}
                        >
                          <View style={s.presetCardLeft}>
                            <View style={[s.presetIconWrap, { backgroundColor: preset.accentColor + '15' }]}>
                              {preset.icon}
                            </View>
                            <View style={s.presetInfo}>
                              <View style={s.presetNameRow}>
                                <Text style={s.presetName}>{preset.name}</Text>
                                {preset.action === 'both' && (
                                  <View style={s.presetWhBadge}>
                                    <Webhook size={8} color={Colors.cyan} />
                                  </View>
                                )}
                              </View>
                              <Text style={s.presetDesc} numberOfLines={2}>{preset.description}</Text>
                              <View style={s.presetMeta}>
                                <Text style={s.presetMetaText}>Cooldown: {preset.cooldownMs / 1000}s</Text>
                                <Text style={s.presetMetaDot}> · </Text>
                                <Text style={s.presetMetaText}>{instrument}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={s.presetCardRight}>
                            {alreadyAdded ? (
                              <View style={s.presetAddedBadge}>
                                <CheckCircle size={12} color={Colors.green} />
                              </View>
                            ) : (
                              <View style={[s.presetAddBtn, { borderColor: preset.accentColor + '50' }]}>
                                <Plus size={14} color={preset.accentColor} />
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {rules.map((rule) => {
              const status = instrumentLiveStatus.get(rule.instrument);
              const liveP = status?.price ?? getCachedPrice(rule.instrument)?.price;
              return (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => handleDeleteRule(rule.id)}
                  onEdit={() => openEdit(rule)}
                  livePrice={liveP}
                />
              );
            })}
          </>
        )}

        {activeTab === 'events' && (
          <>
            {events.length > 0 && (
              <Pressable style={s.clearBtn} onPress={() => Alert.alert('Clear Events', 'Clear all event history?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clearEvents }])}>
                <RotateCcw size={13} color={Colors.text2} />
                <Text style={s.clearBtnText}>Clear History</Text>
              </Pressable>
            )}

            {events.length === 0 && (
              <View style={s.emptyState}>
                <History size={40} color={Colors.text3} />
                <Text style={s.emptyTitle}>No Events Yet</Text>
                <Text style={s.emptySubtitle}>Events will appear here when your alert rules are triggered.</Text>
              </View>
            )}

            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </>
        )}

        {activeTab === 'webhooks' && (
          <>
            <Pressable style={s.addButton} onPress={() => { setWhName(''); setWhUrl(''); setWhTestResult(''); setShowWebhookModal(true); }}>
              <Plus size={16} color={Colors.bg0} />
              <Text style={s.addButtonText}>Add Webhook</Text>
            </Pressable>

            {webhooks.length === 0 && (
              <View style={s.emptyState}>
                <Webhook size={40} color={Colors.text3} />
                <Text style={s.emptyTitle}>No Webhooks</Text>
                <Text style={s.emptySubtitle}>Add webhook endpoints for Discord, Slack, Telegram, TradingView, NinjaTrader, or any custom URL.</Text>
              </View>
            )}

            {webhooks.map((wh) => (
              <View key={wh.id} style={s.webhookCard}>
                <View style={s.webhookHeader}>
                  <View style={s.webhookHeaderLeft}>
                    <View style={[s.webhookDot, { backgroundColor: wh.enabled ? Colors.green : Colors.text2 }]} />
                    <Text style={s.webhookName}>{wh.name}</Text>
                    <View style={[s.methodBadge, { backgroundColor: wh.method === 'POST' ? Colors.green + '20' : Colors.blue + '20' }]}>
                      <Text style={[s.methodBadgeText, { color: wh.method === 'POST' ? Colors.green : Colors.blue }]}>{wh.method}</Text>
                    </View>
                  </View>
                  <View style={s.ruleActions}>
                    <Switch
                      value={wh.enabled}
                      onValueChange={(val) => updateWebhook(wh.id, { enabled: val })}
                      trackColor={{ false: Colors.bg3, true: Colors.green + '40' }}
                      thumbColor={wh.enabled ? Colors.green : Colors.text2}
                      style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                    />
                    <Pressable style={s.ruleActionBtn} onPress={() => deleteWebhook(wh.id)}>
                      <Trash2 size={14} color={Colors.red} />
                    </Pressable>
                  </View>
                </View>
                <Text style={s.webhookUrl} numberOfLines={1}>{wh.url}</Text>
                <View style={s.webhookStats}>
                  <Text style={s.webhookStatText}>
                    <Text style={{ color: Colors.green }}>{wh.successCount}</Text> sent
                  </Text>
                  <Text style={s.webhookStatText}>
                    <Text style={{ color: Colors.red }}>{wh.failCount}</Text> failed
                  </Text>
                  {wh.lastUsed && (
                    <Text style={s.webhookStatText}>
                      Last: {new Date(wh.lastUsed).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <View style={s.templateSection}>
              <Text style={s.templateTitle}>Webhook Payload Templates</Text>
              <Text style={s.templateSubtitle}>Tap to copy payload template to clipboard</Text>
              {WEBHOOK_TEMPLATES.map((tmpl) => (
                <Pressable
                  key={tmpl.id}
                  style={[s.templateCard, copiedTemplateId === tmpl.id && s.templateCardCopied]}
                  onPress={async () => {
                    try {
                      await UniversalClipboard.setStringAsync(tmpl.template);
                      setCopiedTemplateId(tmpl.id);
                      Haptics.notification('success');
                      setTimeout(() => setCopiedTemplateId(null), 2000);
                    } catch (e) {
                      console.log('[Clipboard] Failed to copy:', e);
                    }
                  }}
                >
                  <View style={s.templateHeader}>
                    <FileText size={13} color={Colors.amber} />
                    <Text style={s.templateName}>{tmpl.name}</Text>
                    {copiedTemplateId === tmpl.id && (
                      <View style={s.copiedBadge}>
                        <CheckCircle size={10} color={Colors.green} />
                        <Text style={s.copiedBadgeText}>Copied!</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.templateDesc}>{tmpl.description}</Text>
                  <View style={s.templatePreview}>
                    <Text style={s.templatePreviewText} numberOfLines={2}>{tmpl.template}</Text>
                  </View>
                  <View style={s.templateActions}>
                    <View style={s.templateCopyBtn}>
                      <Copy size={11} color={Colors.cyan} />
                      <Text style={s.templateCopyText}>
                        {copiedTemplateId === tmpl.id ? 'Copied!' : 'Copy Template'}
                      </Text>
                    </View>
                    <Pressable
                      style={s.templateUseBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setNewWebhookPayload(tmpl.template);
                        setNewAction('webhook');
                        setShowCreateModal(true);
                        Haptics.impact('light');
                      }}
                    >
                      <Plus size={11} color={Colors.amber} />
                      <Text style={s.templateUseText}>Use in Rule</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>{editingRule ? 'Edit Alert' : 'New Alert Rule'}</Text>

              <Text style={s.fieldLabel}>Name (optional)</Text>
              <TextInput
                style={s.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. BTC Breakout Alert"
                placeholderTextColor={Colors.text3}
              />

              <Text style={s.fieldLabel}>Instrument</Text>
              <Pressable style={s.pickerBtn} onPress={() => setShowInstrumentPicker(!showInstrumentPicker)}>
                <View style={s.pickerBtnInner}>
                  <View style={[s.instrDot, { backgroundColor: getAssetColor(newInstrument) }]} />
                  <Text style={s.pickerBtnText}>{newInstrument}</Text>
                  <Text style={s.pickerBtnSub}>{SPECS[newInstrument]?.name ?? ''}</Text>
                </View>
                <ChevronDown size={16} color={Colors.text2} />
              </Pressable>
              {showInstrumentPicker && (
                <ScrollView style={s.pickerList} nestedScrollEnabled>
                  {CATEGORIES.map((cat) => (
                    <View key={cat.label}>
                      <Text style={s.pickerCatLabel}>{cat.label}</Text>
                      <View style={s.pickerGrid}>
                        {cat.symbols.map((sym) => (
                          <Pressable
                            key={sym}
                            style={[s.pickerItem, newInstrument === sym && s.pickerItemActive]}
                            onPress={() => { setNewInstrument(sym); setShowInstrumentPicker(false); }}
                          >
                            <Text style={[s.pickerItemText, newInstrument === sym && { color: Colors.amber }]}>{sym}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={s.fieldLabel}>Condition</Text>
              <Pressable style={s.pickerBtn} onPress={() => setShowConditionPicker(!showConditionPicker)}>
                <Text style={s.pickerBtnText}>{CONDITION_LABELS[newCondition]}</Text>
                <ChevronDown size={16} color={Colors.text2} />
              </Pressable>
              {showConditionPicker && (
                <ScrollView style={s.pickerList} nestedScrollEnabled>
                  {CONDITION_CATEGORIES.map((cat) => (
                    <View key={cat.label}>
                      <Text style={s.pickerCatLabel}>{cat.label}</Text>
                      {cat.conditions.map((cond) => (
                        <Pressable
                          key={cond}
                          style={[s.condItem, newCondition === cond && s.condItemActive]}
                          onPress={() => { setNewCondition(cond); setShowConditionPicker(false); }}
                        >
                          <Text style={[s.condItemText, newCondition === cond && { color: Colors.amber }]}>
                            {CONDITION_LABELS[cond]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              )}

              {needsThreshold(newCondition) && (
                <>
                  <Text style={s.fieldLabel}>
                    {newCondition === 'price_change_pct' ? 'Threshold (%)' : 'Threshold'}
                  </Text>
                  <TextInput
                    style={s.input}
                    value={newThreshold}
                    onChangeText={setNewThreshold}
                    placeholder={newCondition === 'price_change_pct' ? 'e.g. 2.5' : 'e.g. 70000'}
                    placeholderTextColor={Colors.text3}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={s.fieldLabel}>Action</Text>
              <View style={s.actionRow}>
                {(['notify', 'webhook', 'both'] as AlertAction[]).map((act) => (
                  <Pressable
                    key={act}
                    style={[s.actionBtn, newAction === act && s.actionBtnActive]}
                    onPress={() => setNewAction(act)}
                  >
                    {act === 'notify' && <Bell size={13} color={newAction === act ? Colors.amber : Colors.text2} />}
                    {act === 'webhook' && <Webhook size={13} color={newAction === act ? Colors.cyan : Colors.text2} />}
                    {act === 'both' && <Zap size={13} color={newAction === act ? Colors.green : Colors.text2} />}
                    <Text style={[s.actionBtnText, newAction === act && s.actionBtnTextActive]}>
                      {act === 'notify' ? 'Notify' : act === 'webhook' ? 'Webhook' : 'Both'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(newAction === 'webhook' || newAction === 'both') && (
                <>
                  <Text style={s.fieldLabel}>Webhook URL</Text>
                  <TextInput
                    style={s.input}
                    value={newWebhookUrl}
                    onChangeText={setNewWebhookUrl}
                    placeholder="https://..."
                    placeholderTextColor={Colors.text3}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={s.fieldLabel}>Custom Payload (optional)</Text>
                  <Pressable style={s.templateSelectBtn} onPress={() => setShowTemplatePicker(!showTemplatePicker)}>
                    <FileText size={12} color={Colors.cyan} />
                    <Text style={s.templateSelectText}>Choose Template</Text>
                  </Pressable>
                  {showTemplatePicker && (
                    <ScrollView style={s.templatePickerList} nestedScrollEnabled>
                      {WEBHOOK_TEMPLATES.map((tmpl) => (
                        <Pressable
                          key={tmpl.id}
                          style={s.templatePickerItem}
                          onPress={() => { setNewWebhookPayload(tmpl.template); setShowTemplatePicker(false); }}
                        >
                          <Text style={s.templatePickerName}>{tmpl.name}</Text>
                          <Text style={s.templatePickerDesc}>{tmpl.description}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                  <TextInput
                    style={[s.input, { height: 80, textAlignVertical: 'top' as const }]}
                    value={newWebhookPayload}
                    onChangeText={setNewWebhookPayload}
                    placeholder='{"alert":"{{alert_name}}", ...}'
                    placeholderTextColor={Colors.text3}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={s.helpText}>
                    Variables: {'{{instrument}}, {{price}}, {{condition}}, {{message}}, {{timestamp}}, {{composite}}, {{alert_name}}'}
                  </Text>
                </>
              )}

              <View style={s.settingsRow}>
                <View style={s.settingField}>
                  <Text style={s.fieldLabel}>Max Triggers (0 = unlimited)</Text>
                  <TextInput
                    style={s.input}
                    value={newMaxTriggers}
                    onChangeText={setNewMaxTriggers}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.text3}
                  />
                </View>
                <View style={s.settingField}>
                  <Text style={s.fieldLabel}>Cooldown (seconds)</Text>
                  <TextInput
                    style={s.input}
                    value={newCooldown}
                    onChangeText={setNewCooldown}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor={Colors.text3}
                  />
                </View>
              </View>

              <View style={s.modalButtons}>
                <Pressable style={s.cancelBtn} onPress={() => setShowCreateModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveBtnText}>{editingRule ? 'Update' : 'Create'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showWebhookModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { maxHeight: 500 }]}>
            <Text style={s.modalTitle}>Add Webhook</Text>

            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={s.input}
              value={whName}
              onChangeText={setWhName}
              placeholder="e.g. Discord Bot"
              placeholderTextColor={Colors.text3}
            />

            <Text style={s.fieldLabel}>URL</Text>
            <TextInput
              style={s.input}
              value={whUrl}
              onChangeText={setWhUrl}
              placeholder="https://discord.com/api/webhooks/..."
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.fieldLabel}>Method</Text>
            <View style={s.actionRow}>
              <Pressable
                style={[s.actionBtn, whMethod === 'POST' && s.actionBtnActive]}
                onPress={() => setWhMethod('POST')}
              >
                <Text style={[s.actionBtnText, whMethod === 'POST' && s.actionBtnTextActive]}>POST</Text>
              </Pressable>
              <Pressable
                style={[s.actionBtn, whMethod === 'GET' && s.actionBtnActive]}
                onPress={() => setWhMethod('GET')}
              >
                <Text style={[s.actionBtnText, whMethod === 'GET' && s.actionBtnTextActive]}>GET</Text>
              </Pressable>
            </View>

            <Pressable
              style={[s.testBtn, whTesting && { opacity: 0.5 }]}
              onPress={handleTestWebhook}
              disabled={whTesting || !whUrl.trim()}
            >
              <ExternalLink size={13} color={Colors.cyan} />
              <Text style={s.testBtnText}>{whTesting ? 'Testing...' : 'Test Webhook'}</Text>
            </Pressable>
            {whTestResult !== '' && (
              <Text style={[s.testResult, { color: whTestResult.startsWith('Success') ? Colors.green : Colors.red }]}>
                {whTestResult}
              </Text>
            )}

            <View style={s.modalButtons}>
              <Pressable style={s.cancelBtn} onPress={() => setShowWebhookModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={s.saveBtn} onPress={handleSaveWebhook}>
                <Text style={s.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600' as const,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  engineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  engineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: Colors.bg3,
  },
  tabBtnText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  tabBtnTextActive: {
    color: Colors.amber,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.amber,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 19,
  },
  ruleCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ruleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ruleActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  ruleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ruleTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ruleFooterText: {
    fontSize: 11,
    color: Colors.white,
  },
  eventRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventDot: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInstrument: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  eventCondition: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  webhookBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.cyan + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMessage: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
    lineHeight: 17,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventTime: {
    fontSize: 10,
    color: Colors.white,
  },
  eventPrice: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    marginBottom: 8,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.white,
  },
  webhookCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webhookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webhookHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  webhookDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  webhookName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  methodBadge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  webhookUrl: {
    fontSize: 11,
    color: Colors.white,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  webhookStats: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  webhookStatText: {
    fontSize: 11,
    color: Colors.white,
  },
  templateSection: {
    marginTop: 20,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 10,
  },
  templateCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  templateSubtitle: {
    fontSize: 11,
    color: Colors.white,
    marginBottom: 8,
  },
  templateCardCopied: {
    borderColor: Colors.green + '40',
  },
  templateDesc: {
    fontSize: 11,
    color: Colors.white,
    marginTop: 4,
  },
  templatePreview: {
    backgroundColor: Colors.bg2,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  templatePreviewText: {
    fontSize: 9,
    color: Colors.white,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 14,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  templateCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateCopyText: {
    fontSize: 10,
    color: Colors.cyan,
    fontWeight: '600' as const,
  },
  templateUseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.amber + '30',
  },
  templateUseText: {
    fontSize: 10,
    color: Colors.amber,
    fontWeight: '600' as const,
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.green + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto' as const,
  },
  copiedBadgeText: {
    fontSize: 9,
    color: Colors.green,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 5,
    marginTop: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerBtn: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instrDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  pickerBtnSub: {
    fontSize: 11,
    color: Colors.white,
  },
  pickerList: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    marginTop: 4,
    padding: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerCatLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  pickerItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pickerItemActive: {
    backgroundColor: Colors.amber + '25',
  },
  pickerItemText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  condItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  condItemActive: {
    backgroundColor: Colors.amber + '15',
  },
  condItemText: {
    fontSize: 12,
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnActive: {
    borderColor: Colors.amber + '60',
    backgroundColor: Colors.amber + '10',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  actionBtnTextActive: {
    color: Colors.amber,
  },
  templateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  templateSelectText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '600' as const,
  },
  templatePickerList: {
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  templatePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  templatePickerName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  templatePickerDesc: {
    fontSize: 10,
    color: Colors.white,
    marginTop: 2,
  },
  helpText: {
    fontSize: 9,
    color: Colors.white,
    marginTop: 4,
    lineHeight: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  settingField: {
    flex: 1,
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
    color: Colors.white,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.amber,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cyan + '40',
    marginTop: 12,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  testResult: {
    fontSize: 11,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: 6,
  },
  presetsSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  presetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  presetsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  presetsSubtitle: {
    fontSize: 12,
    color: Colors.white,
    marginBottom: 14,
    lineHeight: 17,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addAllBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  presetCatBlock: {
    marginBottom: 14,
  },
  presetCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  presetCatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presetCatLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  presetCatDesc: {
    fontSize: 11,
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cyan + '12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.cyan,
    letterSpacing: 1,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    padding: 11,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetCardAdded: {
    opacity: 0.5,
    borderColor: Colors.green + '30',
  },
  presetCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  presetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  presetInfo: {
    flex: 1,
  },
  presetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  presetWhBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.cyan + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetDesc: {
    fontSize: 11,
    color: Colors.white,
    marginTop: 3,
    lineHeight: 16,
  },
  presetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  presetMetaText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  presetMetaDot: {
    fontSize: 10,
    color: Colors.white,
  },
  presetCardRight: {
    marginLeft: 8,
  },
  presetAddedBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.green + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulePriceBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 4,
  },
  rulePriceText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  presetAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMonitorBar: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.cyan + '20',
  },
  liveMonitorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  liveMonitorText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
  liveChipScroll: {
    flexGrow: 0,
  },
  liveChipContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  liveChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  liveChipSymbol: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  liveChipPrice: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.text2,
    marginLeft: 2,
  },
});
