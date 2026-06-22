export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
  monitorWindowMs: number;
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  consecutiveSuccesses: number;
  openedAt: number | null;
  halfOpenAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 10,
  resetTimeoutMs: 12000,
  halfOpenMaxAttempts: 3,
  monitorWindowMs: 45000,
};

const breakers = new Map<string, { state: CircuitState; config: CircuitBreakerConfig; metrics: CircuitMetrics }>();

function getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>) {
  let breaker = breakers.get(name);
  if (!breaker) {
    breaker = {
      state: 'closed',
      config: { ...DEFAULT_CONFIG, ...config },
      metrics: {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        totalRequests: 0,
        totalFailures: 0,
        consecutiveSuccesses: 0,
        openedAt: null,
        halfOpenAttempts: 0,
      },
    };
    breakers.set(name, breaker);
  }
  return breaker;
}

export function canRequest(name: string, config?: Partial<CircuitBreakerConfig>): boolean {
  const breaker = getOrCreate(name, config);
  const now = Date.now();

  if (breaker.state === 'closed') return true;

  if (breaker.state === 'open') {
    if (breaker.metrics.openedAt && now - breaker.metrics.openedAt >= breaker.config.resetTimeoutMs) {
      breaker.state = 'half-open';
      breaker.metrics.halfOpenAttempts = 0;
      console.log(`[CircuitBreaker] ${name}: open -> half-open`);
      return true;
    }
    return false;
  }

  if (breaker.state === 'half-open') {
    return breaker.metrics.halfOpenAttempts < breaker.config.halfOpenMaxAttempts;
  }

  return true;
}

export function recordSuccess(name: string): void {
  const breaker = breakers.get(name);
  if (!breaker) return;

  breaker.metrics.successes++;
  breaker.metrics.totalRequests++;
  breaker.metrics.lastSuccessTime = Date.now();
  breaker.metrics.consecutiveSuccesses++;

  if (breaker.state === 'half-open') {
    breaker.metrics.halfOpenAttempts++;
    if (breaker.metrics.consecutiveSuccesses >= breaker.config.halfOpenMaxAttempts) {
      breaker.state = 'closed';
      breaker.metrics.failures = 0;
      breaker.metrics.openedAt = null;
      console.log(`[CircuitBreaker] ${name}: half-open -> closed (recovered)`);
    }
  }

  if (breaker.state === 'closed') {
    const window = breaker.config.monitorWindowMs;
    if (Date.now() - breaker.metrics.lastFailureTime > window) {
      breaker.metrics.failures = 0;
    }
  }
}

export function recordFailure(name: string, error?: string): void {
  const breaker = breakers.get(name);
  if (!breaker) return;

  breaker.metrics.failures++;
  breaker.metrics.totalFailures++;
  breaker.metrics.totalRequests++;
  breaker.metrics.lastFailureTime = Date.now();
  breaker.metrics.consecutiveSuccesses = 0;

  if (breaker.state === 'half-open') {
    breaker.state = 'open';
    breaker.metrics.openedAt = Date.now();
    console.log(`[CircuitBreaker] ${name}: half-open -> open (failed probe) ${error ?? ''}`);
    return;
  }

  if (breaker.state === 'closed' && breaker.metrics.failures >= breaker.config.failureThreshold) {
    breaker.state = 'open';
    breaker.metrics.openedAt = Date.now();
    console.log(`[CircuitBreaker] ${name}: closed -> open (${breaker.metrics.failures} failures) ${error ?? ''}`);
  }
}

export function getState(name: string): CircuitState {
  const breaker = breakers.get(name);
  if (!breaker) return 'closed';

  if (breaker.state === 'open' && breaker.metrics.openedAt) {
    if (Date.now() - breaker.metrics.openedAt >= breaker.config.resetTimeoutMs) {
      breaker.state = 'half-open';
      breaker.metrics.halfOpenAttempts = 0;
    }
  }

  return breaker.state;
}

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitState;
  failures: number;
  totalRequests: number;
  totalFailures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  openedAt: number | null;
}

export function getStatus(name: string): CircuitBreakerStatus {
  const breaker = getOrCreate(name);
  return {
    name,
    state: getState(name),
    failures: breaker.metrics.failures,
    totalRequests: breaker.metrics.totalRequests,
    totalFailures: breaker.metrics.totalFailures,
    lastFailureTime: breaker.metrics.lastFailureTime,
    lastSuccessTime: breaker.metrics.lastSuccessTime,
    openedAt: breaker.metrics.openedAt,
  };
}

export function getAllStatuses(): CircuitBreakerStatus[] {
  const names = Array.from(breakers.keys());
  return names.map(getStatus);
}

export function reset(name: string): void {
  const breaker = breakers.get(name);
  if (breaker) {
    breaker.state = 'closed';
    breaker.metrics.failures = 0;
    breaker.metrics.consecutiveSuccesses = 0;
    breaker.metrics.openedAt = null;
    breaker.metrics.halfOpenAttempts = 0;
    console.log(`[CircuitBreaker] ${name}: manually reset`);
  }
}

export function resetAll(): void {
  breakers.forEach((_, name) => reset(name));
}

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallback?: T,
  config?: Partial<CircuitBreakerConfig>,
): Promise<T> {
  getOrCreate(name, config);

  if (!canRequest(name)) {
    console.log(`[CircuitBreaker] ${name}: circuit OPEN, request blocked`);
    if (fallback !== undefined) return fallback;
    throw new Error(`Circuit breaker open for ${name}`);
  }

  try {
    const result = await fn();
    recordSuccess(name);
    return result;
  } catch (err: any) {
    recordFailure(name, err?.message);
    if (fallback !== undefined) return fallback;
    throw err;
  }
}
