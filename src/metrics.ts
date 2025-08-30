import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

export const relayRequestCount = new Counter({
  name: 'relay_requests_total',
  help: 'Total JSON-RPC requests sent to relays',
  labelNames: ['relay', 'method'] as const,
});

export const relaySuccessCount = new Counter({
  name: 'relay_success_total',
  help: 'Total successful relay responses',
  labelNames: ['relay', 'method'] as const,
});

export const relayFailureCount = new Counter({
  name: 'relay_failures_total',
  help: 'Total failed relay responses',
  labelNames: ['relay', 'method', 'reason'] as const,
});

export const relayLatencyMs = new Histogram({
  name: 'relay_latency_ms',
  help: 'Latency of relay requests in milliseconds',
  labelNames: ['relay', 'method'] as const,
  buckets: [25, 50, 100, 200, 400, 800, 1600, 3200]
});

registry.registerMetric(relayRequestCount);
registry.registerMetric(relaySuccessCount);
registry.registerMetric(relayFailureCount);
registry.registerMetric(relayLatencyMs);
