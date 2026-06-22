import { BrokerType } from './brokerHealthService';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: string | null;
}

interface PayloadField {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

const BROKER_SCHEMAS: Record<BrokerType, PayloadField[]> = {
  tradingview: [
    { name: 'ticker', required: true, type: 'string', minLength: 1, maxLength: 20 },
    { name: 'action', required: true, type: 'string', pattern: /^(buy|sell|close|cancel)$/i },
    { name: 'price', required: true, type: 'number', min: 0 },
    { name: 'timestamp', required: false, type: 'string' },
    { name: 'strategy', required: false, type: 'string', maxLength: 100 },
    { name: 'message', required: false, type: 'string', maxLength: 500 },
  ],
  ninjatrader: [
    { name: 'instrument', required: true, type: 'string', minLength: 1, maxLength: 20 },
    { name: 'action', required: true, type: 'string', pattern: /^(BUY|SELL|CLOSE|CANCEL)$/ },
    { name: 'orderType', required: true, type: 'string', pattern: /^(MARKET|LIMIT|STOP|STOP_LIMIT)$/ },
    { name: 'quantity', required: true, type: 'number', min: 0.0001 },
    { name: 'price', required: true, type: 'number', min: 0 },
    { name: 'timestamp', required: false, type: 'string' },
    { name: 'source', required: false, type: 'string', maxLength: 50 },
    { name: 'signal', required: false, type: 'string', maxLength: 100 },
  ],
  rithmic: [
    { name: 'symbol', required: true, type: 'string', minLength: 1, maxLength: 20 },
    { name: 'side', required: true, type: 'string', pattern: /^(BUY|SELL|CLOSE)$/ },
    { name: 'type', required: true, type: 'string', pattern: /^(MARKET|LIMIT|STOP|STOP_LIMIT)$/ },
    { name: 'quantity', required: true, type: 'number', min: 0.0001 },
    { name: 'price', required: true, type: 'number', min: 0 },
    { name: 'stopLoss', required: false, type: 'number', min: 0 },
    { name: 'takeProfit', required: false, type: 'number', min: 0 },
    { name: 'strategy', required: false, type: 'string', maxLength: 100 },
    { name: 'timestamp', required: false, type: 'string' },
  ],
  binance: [
    { name: 'symbol', required: true, type: 'string', minLength: 1, maxLength: 20, pattern: /^[A-Z0-9]+$/ },
    { name: 'side', required: true, type: 'string', pattern: /^(BUY|SELL)$/ },
    { name: 'type', required: true, type: 'string', pattern: /^(MARKET|LIMIT|STOP_LOSS|STOP_LOSS_LIMIT|TAKE_PROFIT|TAKE_PROFIT_LIMIT)$/ },
    { name: 'quantity', required: false, type: 'number', min: 0 },
    { name: 'price', required: false, type: 'number', min: 0 },
    { name: 'timeInForce', required: false, type: 'string', pattern: /^(GTC|IOC|FOK)$/ },
    { name: 'timestamp', required: false, type: 'number' },
  ],
};

function validateField(value: any, field: PayloadField): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value === undefined || value === null) {
    if (field.required) {
      errors.push(`Missing required field: ${field.name}`);
    }
    return { errors, warnings };
  }

  const actualType = typeof value;
  if (field.type === 'number') {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || !isFinite(num)) {
      errors.push(`${field.name} must be a valid number, got: ${actualType}`);
      return { errors, warnings };
    }
    if (field.min !== undefined && num < field.min) {
      errors.push(`${field.name} must be >= ${field.min}, got: ${num}`);
    }
    if (field.max !== undefined && num > field.max) {
      errors.push(`${field.name} must be <= ${field.max}, got: ${num}`);
    }
  } else if (field.type === 'string') {
    if (actualType !== 'string') {
      errors.push(`${field.name} must be a string, got: ${actualType}`);
      return { errors, warnings };
    }
    if (field.minLength !== undefined && value.length < field.minLength) {
      errors.push(`${field.name} must be at least ${field.minLength} characters`);
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      warnings.push(`${field.name} exceeds max length ${field.maxLength}, will be truncated`);
    }
    if (field.pattern && !field.pattern.test(value)) {
      errors.push(`${field.name} has invalid format: "${value}" (expected: ${field.pattern.source})`);
    }
  } else if (field.type === 'boolean') {
    if (actualType !== 'boolean') {
      warnings.push(`${field.name} expected boolean, got: ${actualType}`);
    }
  }

  return { errors, warnings };
}

export function validatePayload(broker: BrokerType, payload: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [], sanitized: null };

  if (!payload || payload.trim().length === 0) {
    result.valid = false;
    result.errors.push('Payload is empty');
    return result;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch (err: any) {
    result.valid = false;
    result.errors.push(`Invalid JSON: ${err?.message ?? 'parse error'}`);
    return result;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    result.valid = false;
    result.errors.push('Payload must be a JSON object');
    return result;
  }

  const schema = BROKER_SCHEMAS[broker];
  if (!schema) {
    result.warnings.push(`No schema defined for broker: ${broker}`);
    result.sanitized = payload;
    return result;
  }

  for (const field of schema) {
    const { errors, warnings } = validateField(parsed[field.name], field);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
  }

  const knownFields = new Set(schema.map(f => f.name));
  for (const key of Object.keys(parsed)) {
    if (!knownFields.has(key)) {
      result.warnings.push(`Unknown field: ${key} (will be passed through)`);
    }
  }

  result.valid = result.errors.length === 0;

  if (result.valid) {
    const sanitized = { ...parsed };
    for (const field of schema) {
      if (field.type === 'string' && field.maxLength && typeof sanitized[field.name] === 'string') {
        sanitized[field.name] = sanitized[field.name].substring(0, field.maxLength);
      }
      if (field.type === 'number' && typeof sanitized[field.name] === 'string') {
        sanitized[field.name] = parseFloat(sanitized[field.name]);
      }
    }
    result.sanitized = JSON.stringify(sanitized);
  }

  console.log(`[PayloadValidator] ${broker}: ${result.valid ? 'VALID' : 'INVALID'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);
  return result;
}

export function validateWebhookUrl(url: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [], sanitized: null };

  if (!url || url.trim().length === 0) {
    result.valid = false;
    result.errors.push('Webhook URL is empty');
    return result;
  }

  const trimmed = url.trim();

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    result.valid = false;
    result.errors.push('URL must start with http:// or https://');
    return result;
  }

  if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
    result.warnings.push('Using HTTP instead of HTTPS — data will not be encrypted');
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname || parsed.hostname.length < 3) {
      result.valid = false;
      result.errors.push('Invalid hostname in URL');
      return result;
    }

    const blockedHosts = ['0.0.0.0', '169.254.', '10.0.0.', '192.168.', '172.16.'];
    for (const blocked of blockedHosts) {
      if (parsed.hostname.startsWith(blocked)) {
        result.warnings.push(`URL points to private network (${parsed.hostname}) — may not be reachable`);
      }
    }

    result.sanitized = trimmed;
  } catch {
    result.valid = false;
    result.errors.push('Malformed URL');
  }

  return result;
}

export function validateApiCredentials(broker: BrokerType, credentials: Record<string, string>): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [], sanitized: null };

  switch (broker) {
    case 'binance': {
      const apiKey = credentials.apiKey ?? '';
      const secretKey = credentials.secretKey ?? '';

      if (!apiKey || apiKey.length < 10) {
        result.valid = false;
        result.errors.push('Binance API key is missing or too short');
      } else if (apiKey.length !== 64) {
        result.warnings.push('Binance API key length is unusual (expected 64 characters)');
      }

      if (!secretKey || secretKey.length < 10) {
        result.valid = false;
        result.errors.push('Binance Secret key is missing or too short');
      }

      if (apiKey.includes(' ') || secretKey.includes(' ')) {
        result.valid = false;
        result.errors.push('API keys should not contain spaces — check for copy/paste errors');
      }
      break;
    }
    case 'tradingview': {
      const webhookUrl = credentials.webhookUrl ?? '';
      if (webhookUrl) {
        const urlValidation = validateWebhookUrl(webhookUrl);
        result.errors.push(...urlValidation.errors);
        result.warnings.push(...urlValidation.warnings);
        result.valid = result.valid && urlValidation.valid;
      }
      break;
    }
    case 'ninjatrader': {
      const connectionUrl = credentials.connectionUrl ?? '';
      if (connectionUrl && !connectionUrl.startsWith('http')) {
        result.valid = false;
        result.errors.push('NinjaTrader connection URL must start with http:// or https://');
      }
      break;
    }
    case 'rithmic': {
      const username = credentials.username ?? '';
      const password = credentials.password ?? '';
      if (!username) {
        result.valid = false;
        result.errors.push('Rithmic username is required');
      }
      if (!password || password.length < 6) {
        result.valid = false;
        result.errors.push('Rithmic password is missing or too short');
      }
      break;
    }
  }

  return result;
}

export interface DeadLetterEntry {
  id: string;
  broker: BrokerType;
  payload: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

const deadLetterQueue: DeadLetterEntry[] = [];
const DEAD_LETTER_MAX = 100;

export function addToDeadLetter(broker: BrokerType, payload: string, error: string, retryCount: number = 0): void {
  const entry: DeadLetterEntry = {
    id: `dlq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    broker,
    payload,
    error,
    timestamp: Date.now(),
    retryCount,
  };

  deadLetterQueue.unshift(entry);
  if (deadLetterQueue.length > DEAD_LETTER_MAX) {
    deadLetterQueue.splice(DEAD_LETTER_MAX);
  }

  console.log(`[DeadLetter] Added entry for ${broker}: ${error}`);
}

export function getDeadLetterQueue(): DeadLetterEntry[] {
  return [...deadLetterQueue];
}

export function clearDeadLetterQueue(): void {
  deadLetterQueue.length = 0;
  console.log('[DeadLetter] Queue cleared');
}

export function removeFromDeadLetter(id: string): void {
  const idx = deadLetterQueue.findIndex(e => e.id === id);
  if (idx >= 0) {
    deadLetterQueue.splice(idx, 1);
  }
}
