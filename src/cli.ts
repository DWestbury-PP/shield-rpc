#!/usr/bin/env node
/*
Usage:
  npm run -s cli ping --relays url1,url2
  npm run -s cli send --shield http://localhost:8080 --rawTx 0xSIGNED --public https://mainnet.infura.io/v3/KEY [--simulate]

Notes:
  - ping: measures latency using eth_chainId (no broadcasting)
  - send: posts rawTx to shield-rpc; if --public provided, posts to public RPC too
  - --simulate on send: measures connectivity (eth_chainId) instead of broadcasting
*/

const argv = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=').slice(1).join('=');
  return undefined;
}
function hasFlag(name: string): boolean {
  return argv.includes(`--${name}`) || argv.some((a) => a === `--${name}=true`);
}

async function postJsonRpc(url: string, method: string, params: any[]): Promise<{ ms: number; json: any }>{
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const ms = Date.now() - start;
  let json: any;
  try { json = await res.json(); } catch { json = { error: `http_${res.status}` }; }
  return { ms, json };
}

async function ping(): Promise<number> {
  const relaysEnv = process.env.RELAY_URLS || '';
  const relaysArg = getFlag('relays');
  const relays = (relaysArg || relaysEnv || 'https://rpc.flashbots.net,https://rpc.mevblocker.io')
    .split(',').map((s) => s.trim()).filter(Boolean);
  console.log(`Pinging ${relays.length} relay(s) with eth_chainId...`);
  for (const url of relays) {
    const { ms, json } = await postJsonRpc(url, 'eth_chainId', []);
    const ok = json && json.result && json.result.startsWith('0x');
    console.log(`${ok ? 'OK ' : 'ERR'} ${ms}ms  ${url}`);
  }
  return 0;
}

async function send(): Promise<number> {
  const shield = getFlag('shield') || 'http://localhost:8080';
  const rawTx = getFlag('rawTx');
  const pub = getFlag('public');
  const simulate = hasFlag('simulate');
  if (!rawTx && !simulate) {
    console.error('Missing --rawTx 0x... or use --simulate');
    return 1;
  }
  console.log(simulate ? 'Simulating connectivity (no broadcast)...' : 'Broadcasting signed tx...');

  if (simulate) {
    // Measure shield connectivity via /metrics (GET) and chainId via a known relay (optional)
    const { ms } = await postJsonRpc('https://rpc.flashbots.net', 'eth_chainId', []);
    console.log(`Relay connectivity: flashbots eth_chainId ~${ms}ms`);
  }

  // Shield
  const shieldUrl = `${shield.replace(/\/$/, '')}/sendRawTransaction`;
  const startShield = Date.now();
  const shieldRes = await fetch(shieldUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rawTx: rawTx || '0x' }) });
  const shieldMs = Date.now() - startShield;
  const shieldJson = await shieldRes.json().catch(() => ({}));
  console.log(`shield-rpc: ${shieldMs}ms ->`, shieldJson);

  // Public (optional)
  if (pub) {
    const { ms, json } = await postJsonRpc(pub, simulate ? 'eth_chainId' : 'eth_sendRawTransaction', simulate ? [] : [rawTx]);
    console.log(`public   : ${ms}ms ->`, json);
  }
  return 0;
}

(async () => {
  const cmd = argv[0];
  try {
    let code = 0;
    if (cmd === 'ping') code = await ping();
    else if (cmd === 'send') code = await send();
    else {
      console.log('Usage:\n  npm run -s cli ping [--relays url1,url2]\n  npm run -s cli send --shield http://localhost:8080 --rawTx 0xSIGNED [--public https://rpc] [--simulate]');
    }
    process.exit(code);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
