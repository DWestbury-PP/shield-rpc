# shield rpc

MEV-protected transaction router with simple endpoints and Prometheus metrics.

Think of it like a smart mail room: you hand it a sealed envelope (your signed tx), and it chooses the safest, fastest private courier (Flashbots, MEV-Blocker, etc.). If the first courier is down, it tries the next — and logs everything so you can see what happened.

## Why
- Reduce failed-tx gas waste and sandwich risk
- Measure relay health, latency, and success rate
- One simple endpoint instead of juggling multiple relay APIs

## Quickstart
Requirements: Node 20+

```bash
# install deps
npm ci

# build and run
npm run build
npm start
# server: http://localhost:8080
```

Environment variables:
- `PORT` (default: 8080)
- `RELAY_URLS` (optional): comma-separated list of JSON-RPC endpoints to try in order. Example:
  - `RELAY_URLS=https://rpc.flashbots.net,https://rpc.mevblocker.io`

## Endpoints
- `GET /healthz`
  - Returns `{ "status": "ok" }` if the service is up
- `GET /metrics`
  - Prometheus exposition format (relay latency/success/fail, etc.)
- `POST /sendRawTransaction`
  - Body: `{ "rawTx": "0x...signedTx..." }`
  - Tries relays in order until one accepts; returns `{ "relay": "name", "txHash": "0x..." }`
  - On failure: `502` with `{ "error": "relay_failure", "message": "..." }`

### curl examples
```bash
# health
curl -s http://localhost:8080/healthz | jq

# metrics
curl -s http://localhost:8080/metrics | head -n 20

# send raw tx (replace with a real signed tx)
curl -s -X POST http://localhost:8080/sendRawTransaction \
  -H 'content-type: application/json' \
  -d '{"rawTx":"0xSIGNED_RAW_TX"}' | jq
```

## Configuration & behavior
- Fallback: relays are attempted sequentially until success
- Defaults: Flashbots Protect, MEV-Blocker (override with `RELAY_URLS`)
- Metrics: relay request/response counts and latency histograms

## Docker
```bash
# build
docker build -t shield-rpc:dev .
# run
docker run --rm -p 8080:8080 \
  -e RELAY_URLS="https://rpc.flashbots.net,https://rpc.mevblocker.io" \
  shield-rpc:dev
```

## Roadmap (next)
- Add BlockSec Anti-MEV relay adapter
- Add simulation endpoint and policy rules
- Per-project API keys and rate limits
- Grafana dashboard JSON

## License
Apache-2.0

### CLI demo
```bash
# measure relay latencies
RELAYS="https://rpc.flashbots.net,https://rpc.mevblocker.io" npm run -s cli ping --relays $RELAYS

# compare shield vs public (simulate without sending)
npm run -s cli send --shield http://localhost:8080 --public https://rpc.flashbots.net --simulate
```

### Grafana
- Import `dashboards/shield-rpc-grafana.json` into Grafana.
- Example Prometheus scrape config in `docs/prometheus-scrape-example.yml`.
