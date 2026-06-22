export interface QueuedRequest<T = any> {
  id: string;
  broker: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  addedAt: number;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
}

interface BrokerQueueConfig {
  maxConcurrent: number;
  minIntervalMs: number;
  maxQueueSize: number;
  defaultTimeoutMs: number;
}

const DEFAULT_QUEUE_CONFIG: BrokerQueueConfig = {
  maxConcurrent: 3,
  minIntervalMs: 200,
  maxQueueSize: 50,
  defaultTimeoutMs: 20000,
};

const BROKER_CONFIGS: Record<string, Partial<BrokerQueueConfig>> = {
  binance: { maxConcurrent: 8, minIntervalMs: 50, maxQueueSize: 100 },
  tradingview: { maxConcurrent: 3, minIntervalMs: 300, maxQueueSize: 40 },
  ninjatrader: { maxConcurrent: 3, minIntervalMs: 300, maxQueueSize: 40 },
  rithmic: { maxConcurrent: 3, minIntervalMs: 300, maxQueueSize: 40 },
  yahoo: { maxConcurrent: 6, minIntervalMs: 100, maxQueueSize: 80 },
};

interface BrokerQueue {
  config: BrokerQueueConfig;
  queue: QueuedRequest[];
  activeCount: number;
  lastRequestTime: number;
  totalProcessed: number;
  totalDropped: number;
  totalTimedOut: number;
  processing: boolean;
}

const queues = new Map<string, BrokerQueue>();

let idCounter = 0;

function getQueue(broker: string): BrokerQueue {
  let q = queues.get(broker);
  if (!q) {
    const brokerConfig = BROKER_CONFIGS[broker] ?? {};
    q = {
      config: { ...DEFAULT_QUEUE_CONFIG, ...brokerConfig },
      queue: [],
      activeCount: 0,
      lastRequestTime: 0,
      totalProcessed: 0,
      totalDropped: 0,
      totalTimedOut: 0,
      processing: false,
    };
    queues.set(broker, q);
  }
  return q;
}

function processQueue(broker: string): void {
  const q = getQueue(broker);
  if (q.processing) return;
  q.processing = true;

  const tick = () => {
    while (q.queue.length > 0 && q.activeCount < q.config.maxConcurrent) {
      const now = Date.now();
      const elapsed = now - q.lastRequestTime;
      if (elapsed < q.config.minIntervalMs) {
        setTimeout(tick, q.config.minIntervalMs - elapsed + 1);
        return;
      }

      const request = q.queue.shift();
      if (!request) break;

      if (now - request.addedAt > request.timeoutMs) {
        q.totalTimedOut++;
        request.reject(new Error(`Request timed out in queue after ${now - request.addedAt}ms`));
        console.log(`[RequestQueue] ${broker}: request ${request.id} timed out in queue`);
        continue;
      }

      q.activeCount++;
      q.lastRequestTime = now;

      request.fn()
        .then((result) => {
          q.activeCount--;
          q.totalProcessed++;
          request.resolve(result);
          setTimeout(tick, 0);
        })
        .catch((err) => {
          q.activeCount--;
          q.totalProcessed++;
          request.reject(err);
          setTimeout(tick, 0);
        });
    }

    if (q.queue.length === 0 && q.activeCount === 0) {
      q.processing = false;
    }
  };

  tick();
}

export function enqueue<T>(
  broker: string,
  fn: () => Promise<T>,
  options?: { priority?: number; timeoutMs?: number; maxRetries?: number },
): Promise<T> {
  const q = getQueue(broker);
  const priority = options?.priority ?? 0;
  const timeoutMs = options?.timeoutMs ?? q.config.defaultTimeoutMs;

  if (q.queue.length >= q.config.maxQueueSize) {
    const lowest = q.queue.reduce((min, r) => r.priority < min.priority ? r : min, q.queue[0]);
    if (lowest && lowest.priority < priority) {
      q.queue = q.queue.filter(r => r.id !== lowest.id);
      q.totalDropped++;
      lowest.reject(new Error('Dropped from queue: lower priority'));
      console.log(`[RequestQueue] ${broker}: dropped low-priority request ${lowest.id}`);
    } else {
      q.totalDropped++;
      return Promise.reject(new Error(`Queue full for ${broker} (${q.config.maxQueueSize} max)`));
    }
  }

  return new Promise<T>((resolve, reject) => {
    const request: QueuedRequest<T> = {
      id: `rq_${++idCounter}`,
      broker,
      fn,
      resolve,
      reject,
      priority,
      addedAt: Date.now(),
      timeoutMs,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 0,
    };

    const insertIdx = q.queue.findIndex(r => r.priority < priority);
    if (insertIdx === -1) {
      q.queue.push(request);
    } else {
      q.queue.splice(insertIdx, 0, request);
    }

    processQueue(broker);
  });
}

export interface QueueStats {
  broker: string;
  queueLength: number;
  activeCount: number;
  totalProcessed: number;
  totalDropped: number;
  totalTimedOut: number;
  maxConcurrent: number;
}

export function getQueueStats(broker: string): QueueStats {
  const q = getQueue(broker);
  return {
    broker,
    queueLength: q.queue.length,
    activeCount: q.activeCount,
    totalProcessed: q.totalProcessed,
    totalDropped: q.totalDropped,
    totalTimedOut: q.totalTimedOut,
    maxConcurrent: q.config.maxConcurrent,
  };
}

export function getAllQueueStats(): QueueStats[] {
  return Array.from(queues.keys()).map(getQueueStats);
}

export function clearQueue(broker: string): void {
  const q = queues.get(broker);
  if (q) {
    q.queue.forEach(r => r.reject(new Error('Queue cleared')));
    q.queue = [];
    console.log(`[RequestQueue] ${broker}: queue cleared`);
  }
}

export function clearAllQueues(): void {
  queues.forEach((_, broker) => clearQueue(broker));
}
