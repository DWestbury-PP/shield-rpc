import { RelayConfig } from './config';
import { relayFailureCount, relayLatencyMs, relayRequestCount, relaySuccessCount } from './metrics';

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export async function sendRawTransactionWithFallback(rawTx: string, relays: RelayConfig[]): Promise<{ relay: RelayConfig; txHash: string }>{
  const method = 'eth_sendRawTransaction';
  let lastError: Error | undefined;
  for (const relay of relays) {
    const start = Date.now();
    relayRequestCount.labels(relay.name, method).inc();
    try {
      const res = await fetch(relay.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [rawTx] })
      });
      const elapsed = Date.now() - start;
      relayLatencyMs.labels(relay.name, method).observe(elapsed);
      const json = (await res.json()) as JsonRpcResponse<string>;
      if (json.result && json.result.startsWith('0x')) {
        relaySuccessCount.labels(relay.name, method).inc();
        return { relay, txHash: json.result };
      }
      const reason = json.error?.message || `http_${res.status}`;
      relayFailureCount.labels(relay.name, method, reason).inc();
      lastError = new Error(reason);
    } catch (err) {
      const elapsed = Date.now() - start;
      relayLatencyMs.labels(relay.name, method).observe(elapsed);
      const reason = err instanceof Error ? err.message : 'unknown_error';
      relayFailureCount.labels(relay.name, method, reason).inc();
      lastError = err as Error;
    }
  }
  throw lastError || new Error('all_relays_failed');
}
