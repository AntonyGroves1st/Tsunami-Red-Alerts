import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { Haptics } from '@/utils/haptics';
import {
  AlertRule,
  AlertEvent,
  WebhookConfig,
  AlertStatus,
  evaluateAlert,
  buildAlertMessage,
  generateId,
} from '@/services/alertEngine';
import { sendWebhook } from '@/services/webhookService';
import { useMarketData } from '@/hooks/useMarketData';
import {
  fetchPricesForInstruments,
  getCachedPrice,
  hasAnyLiveData,
  InstrumentPrice,
} from '@/services/multiInstrumentPriceService';

const ALERTS_KEY = 'futuresbot_alerts';
const EVENTS_KEY = 'futuresbot_alert_events';
const WEBHOOKS_KEY = 'futuresbot_webhooks';
const MAX_EVENTS = 200;
const MULTI_INSTRUMENT_POLL_MS = 10000;

export const [AlertProvider, useAlerts] = createContextHook(() => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [engineRunning, setEngineRunning] = useState<boolean>(true);
  const [instrumentPrices, setInstrumentPrices] = useState<Map<string, InstrumentPrice>>(new Map());
  const [liveInstrumentCount, setLiveInstrumentCount] = useState<number>(0);
  const [monitoredInstruments, setMonitoredInstruments] = useState<string[]>([]);

  const { price, instrument, indicators, candles, compositeScore } = useMarketData();
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  const engineRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multiPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rulesRef = useRef<AlertRule[]>([]);
  const webhooksRef = useRef<WebhookConfig[]>([]);
  const isFetchingPricesRef = useRef<boolean>(false);

  rulesRef.current = rules;
  webhooksRef.current = webhooks;

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = useCallback(async () => {
    try {
      const [rulesData, eventsData, webhooksData] = await Promise.all([
        AsyncStorage.getItem(ALERTS_KEY),
        AsyncStorage.getItem(EVENTS_KEY),
        AsyncStorage.getItem(WEBHOOKS_KEY),
      ]);

      if (rulesData) {
        const parsed = JSON.parse(rulesData) as AlertRule[];
        setRules(parsed);
        console.log('[Alerts] Loaded', parsed.length, 'rules');
      }
      if (eventsData) {
        const parsed = JSON.parse(eventsData) as AlertEvent[];
        setEvents(parsed);
        console.log('[Alerts] Loaded', parsed.length, 'events');
      }
      if (webhooksData) {
        const parsed = JSON.parse(webhooksData) as WebhookConfig[];
        setWebhooks(parsed);
        console.log('[Alerts] Loaded', parsed.length, 'webhooks');
      }
    } catch (err) {
      console.log('[Alerts] Load error:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistRules = useCallback(async (newRules: AlertRule[]) => {
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(newRules));
    } catch (err) {
      console.log('[Alerts] Persist rules error:', err);
    }
  }, []);

  const persistEvents = useCallback(async (newEvents: AlertEvent[]) => {
    try {
      const trimmed = newEvents.slice(-MAX_EVENTS);
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.log('[Alerts] Persist events error:', err);
    }
  }, []);

  const persistWebhooks = useCallback(async (newWebhooks: WebhookConfig[]) => {
    try {
      await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(newWebhooks));
    } catch (err) {
      console.log('[Alerts] Persist webhooks error:', err);
    }
  }, []);

  const addRule = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: generateId(),
      createdAt: Date.now(),
      triggerCount: 0,
    };
    setRules((prev) => {
      const updated = [...prev, newRule];
      persistRules(updated);
      return updated;
    });
    console.log('[Alerts] Added rule:', newRule.name);
    return newRule;
  }, [persistRules]);

  const updateRule = useCallback((id: string, updates: Partial<AlertRule>) => {
    setRules((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      persistRules(updated);
      return updated;
    });
  }, [persistRules]);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistRules(updated);
      return updated;
    });
  }, [persistRules]);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        const newStatus: AlertStatus = r.status === 'active' ? 'paused' : 'active';
        return { ...r, status: newStatus };
      });
      persistRules(updated);
      return updated;
    });
  }, [persistRules]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    persistEvents([]);
  }, [persistEvents]);

  const addWebhook = useCallback((config: Omit<WebhookConfig, 'id' | 'successCount' | 'failCount'>) => {
    const newConfig: WebhookConfig = {
      ...config,
      id: generateId(),
      successCount: 0,
      failCount: 0,
    };
    setWebhooks((prev) => {
      const updated = [...prev, newConfig];
      persistWebhooks(updated);
      return updated;
    });
    return newConfig;
  }, [persistWebhooks]);

  const updateWebhook = useCallback((id: string, updates: Partial<WebhookConfig>) => {
    setWebhooks((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
      persistWebhooks(updated);
      return updated;
    });
  }, [persistWebhooks]);

  const deleteWebhook = useCallback((id: string) => {
    setWebhooks((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      persistWebhooks(updated);
      return updated;
    });
  }, [persistWebhooks]);

  const triggerAlertWithPrice = useCallback(async (rule: AlertRule, triggerPrice: number, triggerComposite?: number) => {
    const effectivePrice = triggerPrice;
    const effectiveComposite = triggerComposite ?? 0;
    const message = buildAlertMessage(rule, effectivePrice, effectiveComposite);

    const event: AlertEvent = {
      id: generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      instrument: rule.instrument,
      condition: rule.condition,
      message,
      price: effectivePrice,
      timestamp: Date.now(),
      webhookSent: false,
      compositeScore: effectiveComposite,
    };

    if (Platform.OS !== 'web') {
      Haptics.notification('warning');
    }

    let webhookSent = false;
    let webhookStatus: number | undefined;

    if (rule.action === 'webhook' || rule.action === 'both') {
      const currentWebhooks = webhooksRef.current;
      const matchingWebhook = currentWebhooks.find((w) => w.enabled && (rule.webhookUrl === w.url || !rule.webhookUrl));
      const result = await sendWebhook(rule, event, matchingWebhook);
      webhookSent = result.success;
      webhookStatus = result.statusCode;

      if (matchingWebhook) {
        setWebhooks((prev) => {
          const updated = prev.map((w) => {
            if (w.id !== matchingWebhook.id) return w;
            return {
              ...w,
              lastUsed: Date.now(),
              successCount: result.success ? w.successCount + 1 : w.successCount,
              failCount: result.success ? w.failCount : w.failCount + 1,
            };
          });
          persistWebhooks(updated);
          return updated;
        });
      }
    }

    event.webhookSent = webhookSent;
    event.webhookStatus = webhookStatus;

    setEvents((prev) => {
      const updated = [...prev, event].slice(-MAX_EVENTS);
      persistEvents(updated);
      return updated;
    });

    setRules((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== rule.id) return r;
        const newCount = r.triggerCount + 1;
        const newStatus: AlertStatus = r.maxTriggers > 0 && newCount >= r.maxTriggers ? 'expired' : r.status;
        return {
          ...r,
          triggerCount: newCount,
          triggeredAt: Date.now(),
          lastTriggeredAt: Date.now(),
          status: newStatus,
        };
      });
      persistRules(updated);
      return updated;
    });

    console.log('[Alerts] Triggered:', rule.name, '| Price:', effectivePrice, '| Webhook:', webhookSent);
  }, [persistEvents, persistRules, persistWebhooks]);

  const getActiveInstruments = useCallback((): string[] => {
    const activeRules = rulesRef.current.filter((r) => r.status === 'active');
    const instruments = new Set<string>();
    for (const rule of activeRules) {
      instruments.add(rule.instrument);
    }
    return Array.from(instruments);
  }, []);

  const fetchMultiInstrumentPrices = useCallback(async () => {
    if (isFetchingPricesRef.current) return;

    const activeInstruments = getActiveInstruments();
    if (activeInstruments.length === 0) return;

    const otherInstruments = activeInstruments.filter(inst => inst !== instrument);
    if (otherInstruments.length === 0) return;

    isFetchingPricesRef.current = true;
    try {
      console.log('[Alerts] Fetching prices for', otherInstruments.length, 'other instruments:', otherInstruments.join(', '));
      const prices = await fetchPricesForInstruments(otherInstruments);
      setInstrumentPrices(prices);
      setLiveInstrumentCount(prices.size);
      console.log('[Alerts] Got prices for', prices.size, 'instruments');
    } catch (err: any) {
      console.log('[Alerts] Multi-instrument price fetch error:', err?.message ?? err);
    } finally {
      isFetchingPricesRef.current = false;
    }
  }, [getActiveInstruments, instrument]);

  useEffect(() => {
    const activeInstruments = getActiveInstruments();
    setMonitoredInstruments(activeInstruments);

    if (multiPollRef.current) {
      clearInterval(multiPollRef.current);
      multiPollRef.current = null;
    }

    const otherInstruments = activeInstruments.filter(inst => inst !== instrument);
    if (otherInstruments.length === 0 || !engineRunning || !isLoaded) return;

    console.log('[Alerts] Starting multi-instrument price polling for', otherInstruments.length, 'instruments');

    const initialTimeout = setTimeout(() => {
      fetchMultiInstrumentPrices();
    }, 2000);

    multiPollRef.current = setInterval(() => {
      fetchMultiInstrumentPrices();
    }, MULTI_INSTRUMENT_POLL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (multiPollRef.current) {
        clearInterval(multiPollRef.current);
        multiPollRef.current = null;
      }
    };
  }, [rules, instrument, engineRunning, isLoaded, fetchMultiInstrumentPrices, getActiveInstruments]);

  useEffect(() => {
    if (!isLoaded || !engineRunning) return;

    if (engineRef.current) {
      clearInterval(engineRef.current);
    }

    engineRef.current = setInterval(() => {
      const currentRules = rulesRef.current;
      const activeRules = currentRules.filter((r) => r.status === 'active');
      if (activeRules.length === 0) return;

      const currentInstrumentRules = activeRules.filter((r) => r.instrument === instrument);
      for (const rule of currentInstrumentRules) {
        const triggered = evaluateAlert(
          rule,
          price,
          indicators,
          candles.length,
          prevPricesRef.current.get(instrument),
        );

        if (triggered) {
          triggerAlertWithPrice(rule, price, compositeScore);
        }
      }
      prevPricesRef.current.set(instrument, price);

      const otherInstrumentRules = activeRules.filter((r) => r.instrument !== instrument);
      for (const rule of otherInstrumentRules) {
        const cachedPrice = getCachedPrice(rule.instrument);
        if (!cachedPrice) continue;

        const prevPrice = prevPricesRef.current.get(rule.instrument);
        const triggered = evaluateAlert(
          rule,
          cachedPrice.price,
          null,
          2,
          prevPrice,
        );

        if (triggered) {
          triggerAlertWithPrice(rule, cachedPrice.price, undefined);
        }

        prevPricesRef.current.set(rule.instrument, cachedPrice.price);
      }
    }, 3000);

    return () => {
      if (engineRef.current) clearInterval(engineRef.current);
    };
  }, [isLoaded, engineRunning, instrument, price, indicators, candles, compositeScore, triggerAlertWithPrice]);

  useEffect(() => {
    return () => {
      if (multiPollRef.current) clearInterval(multiPollRef.current);
      if (engineRef.current) clearInterval(engineRef.current);
    };
  }, []);

  const activeRuleCount = useMemo(() => rules.filter((r) => r.status === 'active').length, [rules]);
  const recentEvents = useMemo(() => [...events].reverse().slice(0, 50), [events]);

  const stats = useMemo(() => {
    const totalTriggered = events.length;
    const webhooksSent = events.filter((e) => e.webhookSent).length;
    const webhooksFailed = events.filter((e) => !e.webhookSent && e.webhookStatus !== undefined).length;
    const last24h = events.filter((e) => Date.now() - e.timestamp < 86400000).length;
    return { totalTriggered, webhooksSent, webhooksFailed, last24h };
  }, [events]);

  const instrumentLiveStatus = useMemo(() => {
    const status = new Map<string, { isLive: boolean; price: number; source: string; lastUpdate: number }>();

    status.set(instrument, {
      isLive: true,
      price,
      source: 'primary',
      lastUpdate: Date.now(),
    });

    for (const [inst, priceData] of instrumentPrices) {
      status.set(inst, {
        isLive: true,
        price: priceData.price,
        source: priceData.source,
        lastUpdate: priceData.timestamp,
      });
    }

    return status;
  }, [instrument, price, instrumentPrices]);

  return {
    rules,
    events: recentEvents,
    webhooks,
    isLoaded,
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
    instrumentPrices,
    liveInstrumentCount,
    monitoredInstruments,
    instrumentLiveStatus,
  };
});
