import Fastify from 'fastify';
import { collectDefaultMetrics } from 'prom-client';
import { registry } from './metrics';
import { getRelayConfigs, serverHost, serverPort } from './config';
import { sendRawTransactionWithFallback } from './relays';

const app = Fastify({ logger: true });
collectDefaultMetrics({ register: registry });

app.get('/healthz', async () => {
  return { status: 'ok' };
});

app.get('/health', async () => {
  return { status: 'ok' };
});

app.get('/metrics', async (req, reply) => {
  reply.header('content-type', registry.contentType);
  return registry.metrics();
});

app.post('/sendRawTransaction', async (req, reply) => {
  const body = (req.body ?? {}) as { rawTx?: string };
  const rawTx = body.rawTx;
  if (!rawTx || typeof rawTx !== 'string' || !rawTx.startsWith('0x')) {
    reply.code(400);
    return { error: 'invalid_raw_tx', message: 'Provide rawTx as 0x-prefixed hex string' };
  }
  const relays = getRelayConfigs();
  try {
    const { relay, txHash } = await sendRawTransactionWithFallback(rawTx, relays);
    return { relay: relay.name, txHash };
  } catch (err) {
    req.log.warn({ err }, 'all relays failed');
    reply.code(502);
    return { error: 'relay_failure', message: (err as Error).message };
  }
});

app.listen({ host: serverHost, port: serverPort }).then(() => {
  app.log.info({ port: serverPort }, 'shield-rpc listening');
});
