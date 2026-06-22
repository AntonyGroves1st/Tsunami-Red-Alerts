import { Candle, IndicatorResults } from '@/utils/calculations';

export type AlertCondition =
  | 'price_above'
  | 'price_below'
  | 'ema_cross_long'
  | 'ema_cross_short'
  | 'composite_above'
  | 'composite_below'
  | 'golden_cross'
  | 'death_cross'
  | 'atr_buy'
  | 'atr_sell'
  | 'rmp_buy'
  | 'rmp_sell'
  | 'pressure_flip_bull'
  | 'pressure_flip_bear'
  | 'cloud_flip_bull'
  | 'cloud_flip_bear'
  | 'price_change_pct';

export type AlertAction = 'notify' | 'webhook' | 'both';
export type AlertStatus = 'active' | 'triggered' | 'paused' | 'expired';

export interface AlertRule {
  id: string;
  name: string;
  instrument: string;
  condition: AlertCondition;
  threshold?: number;
  action: AlertAction;
  webhookUrl?: string;
  webhookPayload?: string;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  triggerCount: number;
  maxTriggers: number;
  cooldownMs: number;
  lastTriggeredAt?: number;
  message?: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  instrument: string;
  condition: AlertCondition;
  message: string;
  price: number;
  timestamp: number;
  webhookSent: boolean;
  webhookStatus?: number;
  compositeScore?: number;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET';
  headers: Record<string, string>;
  enabled: boolean;
  lastUsed?: number;
  successCount: number;
  failCount: number;
}

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  ema_cross_long: 'EMA Cross Long',
  ema_cross_short: 'EMA Cross Short',
  composite_above: 'Composite Score Above',
  composite_below: 'Composite Score Below',
  golden_cross: 'Golden Cross',
  death_cross: 'Death Cross',
  atr_buy: 'ATR Buy Signal',
  atr_sell: 'ATR Sell Signal',
  rmp_buy: 'RMP Buy Signal',
  rmp_sell: 'RMP Sell Signal',
  pressure_flip_bull: 'Pressure Flip Bullish',
  pressure_flip_bear: 'Pressure Flip Bearish',
  cloud_flip_bull: 'Cloud Flip Bullish',
  cloud_flip_bear: 'Cloud Flip Bearish',
  price_change_pct: 'Price Change %',
};

export const CONDITION_CATEGORIES: { label: string; conditions: AlertCondition[] }[] = [
  {
    label: 'Price',
    conditions: ['price_above', 'price_below', 'price_change_pct'],
  },
  {
    label: 'Crossovers',
    conditions: ['ema_cross_long', 'ema_cross_short', 'golden_cross', 'death_cross'],
  },
  {
    label: 'Signals',
    conditions: ['atr_buy', 'atr_sell', 'rmp_buy', 'rmp_sell'],
  },
  {
    label: 'Pressure & Cloud',
    conditions: ['pressure_flip_bull', 'pressure_flip_bear', 'cloud_flip_bull', 'cloud_flip_bear'],
  },
  {
    label: 'Composite',
    conditions: ['composite_above', 'composite_below'],
  },
];

function needsThreshold(condition: AlertCondition): boolean {
  return ['price_above', 'price_below', 'composite_above', 'composite_below', 'price_change_pct'].includes(condition);
}

export { needsThreshold };

export function evaluateAlert(
  rule: AlertRule,
  price: number,
  indicators: IndicatorResults | null,
  candleCount: number,
  prevPrice?: number,
): boolean {
  if (rule.status !== 'active') return false;

  if (rule.lastTriggeredAt && Date.now() - rule.lastTriggeredAt < rule.cooldownMs) {
    return false;
  }

  if (rule.maxTriggers > 0 && rule.triggerCount >= rule.maxTriggers) {
    return false;
  }

  const n = candleCount - 1;
  if (n < 1) return false;

  const threshold = rule.threshold ?? 0;

  switch (rule.condition) {
    case 'price_above':
      return price > threshold;
    case 'price_below':
      return price < threshold;
    case 'price_change_pct': {
      if (!prevPrice || prevPrice === 0) return false;
      const pctChange = Math.abs(((price - prevPrice) / prevPrice) * 100);
      return pctChange >= threshold;
    }
    case 'ema_cross_long':
      return indicators?.emaCrossLong[n] ?? false;
    case 'ema_cross_short':
      return indicators?.emaCrossShort[n] ?? false;
    case 'golden_cross':
      return indicators?.goldenCross[n] ?? false;
    case 'death_cross':
      return indicators?.deathCross[n] ?? false;
    case 'atr_buy':
      return indicators?.combBuy[n] ?? false;
    case 'atr_sell':
      return indicators?.combSell[n] ?? false;
    case 'rmp_buy':
      return indicators?.rmpBuy[n] ?? false;
    case 'rmp_sell':
      return indicators?.rmpSell[n] ?? false;
    case 'pressure_flip_bull':
      return (indicators?.marketPressure[n] ?? 0) > 0 && (indicators?.marketPressure[n - 1] ?? 0) <= 0;
    case 'pressure_flip_bear':
      return (indicators?.marketPressure[n] ?? 0) < 0 && (indicators?.marketPressure[n - 1] ?? 0) >= 0;
    case 'cloud_flip_bull':
      return (indicators?.cloudBull[n] ?? false) && !(indicators?.cloudBull[n - 1] ?? true);
    case 'cloud_flip_bear':
      return !(indicators?.cloudBull[n] ?? true) && (indicators?.cloudBull[n - 1] ?? false);
    case 'composite_above':
      return (indicators?.composite[n] ?? 0) > threshold;
    case 'composite_below':
      return (indicators?.composite[n] ?? 0) < threshold;
    default:
      return false;
  }
}

export function buildAlertMessage(
  rule: AlertRule,
  price: number,
  compositeScore?: number,
): string {
  const sym = rule.instrument;
  const priceStr = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  switch (rule.condition) {
    case 'price_above':
      return `${sym} crossed above $${rule.threshold?.toFixed(2)} — now at $${priceStr}`;
    case 'price_below':
      return `${sym} dropped below $${rule.threshold?.toFixed(2)} — now at $${priceStr}`;
    case 'price_change_pct':
      return `${sym} moved ${rule.threshold}%+ — now at $${priceStr}`;
    case 'ema_cross_long':
      return `${sym} EMA Cross LONG signal at $${priceStr}`;
    case 'ema_cross_short':
      return `${sym} EMA Cross SHORT signal at $${priceStr}`;
    case 'golden_cross':
      return `${sym} GOLDEN CROSS detected at $${priceStr}`;
    case 'death_cross':
      return `${sym} DEATH CROSS detected at $${priceStr}`;
    case 'atr_buy':
      return `${sym} ATR BUY signal at $${priceStr}`;
    case 'atr_sell':
      return `${sym} ATR SELL signal at $${priceStr}`;
    case 'rmp_buy':
      return `${sym} RMP Buy signal at $${priceStr}`;
    case 'rmp_sell':
      return `${sym} RMP Sell signal at $${priceStr}`;
    case 'pressure_flip_bull':
      return `${sym} pressure flipped BULLISH at $${priceStr}`;
    case 'pressure_flip_bear':
      return `${sym} pressure flipped BEARISH at $${priceStr}`;
    case 'cloud_flip_bull':
      return `${sym} cloud flipped BULLISH at $${priceStr}`;
    case 'cloud_flip_bear':
      return `${sym} cloud flipped BEARISH at $${priceStr}`;
    case 'composite_above':
      return `${sym} composite score ${compositeScore?.toFixed(1)} > ${rule.threshold} at $${priceStr}`;
    case 'composite_below':
      return `${sym} composite score ${compositeScore?.toFixed(1)} < ${rule.threshold} at $${priceStr}`;
    default:
      return `${sym} alert triggered at $${priceStr}`;
  }
}

export function buildWebhookPayload(
  rule: AlertRule,
  event: AlertEvent,
  customPayload?: string,
): string {
  const defaultPayload = {
    alert: rule.name,
    instrument: rule.instrument,
    condition: rule.condition,
    conditionLabel: CONDITION_LABELS[rule.condition],
    price: event.price,
    message: event.message,
    compositeScore: event.compositeScore,
    timestamp: new Date(event.timestamp).toISOString(),
    triggerCount: rule.triggerCount + 1,
  };

  if (customPayload) {
    try {
      let payload = customPayload;
      payload = payload.replace(/\{\{instrument\}\}/g, rule.instrument);
      payload = payload.replace(/\{\{price\}\}/g, String(event.price));
      payload = payload.replace(/\{\{condition\}\}/g, CONDITION_LABELS[rule.condition]);
      payload = payload.replace(/\{\{message\}\}/g, event.message);
      payload = payload.replace(/\{\{timestamp\}\}/g, new Date(event.timestamp).toISOString());
      payload = payload.replace(/\{\{composite\}\}/g, String(event.compositeScore ?? 0));
      payload = payload.replace(/\{\{alert_name\}\}/g, rule.name);
      return payload;
    } catch {
      console.log('[AlertEngine] Custom payload parse error, using default');
    }
  }

  return JSON.stringify(defaultPayload);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
