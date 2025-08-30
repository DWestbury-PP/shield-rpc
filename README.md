# shield rpc

MEV-Protected Transaction Router + Analytics (API + SDK).

## From brainstorming

- **What**: A drop-in RPC/router that auto-selects the best private mempool path (Flashbots Protect, MEV-Blocker, BlockSec), with fallback logic, tx-success SLAs, gas/MEV refund tracking, and a Grafana-ready metrics endpoint.
- **Why it pays**: Teams will spend to avoid sandwiching and failed tx gas waste; finance desks want auditability.
- **How you stand out**: Package it like "Stripe for protected orderflow" — one endpoint, per-project dashboards, and webhooks. Start with Ethereum + major L2s.

## References
- Flashbots Protect: https://docs.flashbots.net/flashbots-protect/overview
- MEV-Blocker (CoW): https://docs.cow.fi/mevblocker
- BlockSec Anti-MEV RPC: https://docs.blocksec.com/blocksec-anti-mev-rpc
- MEV blocking provider notes: https://web3-ethereum-defi.readthedocs.io/api/provider/_autosummary_provider/eth_defi.provider.mev_blocker.html

## Status
Draft scaffold based on brainstorming.
