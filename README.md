# Parl — Parimutuel Prediction Markets Protocol

**Infrastructure for infinite-scale, market-maker-free prediction markets on EVM-compatible chains.**

[🌐 parlmarket.xyz](https://parlmarket.xyz) · [📄 Whitepaper](https://parlmarket.xyz/whitepaper) · [📖 Docs](https://parlmarket.xyz/docs)

---

## Overview

Parl is a parimutuel prediction market protocol that eliminates the need for liquidity providers and AMM curves. Each market operates as an independent pool — all bets are collected, and winners split the pool proportionally.

### Key Features

- **Permissionless Market Creation** — Anyone can create a market via MarketFactory (0.01 AVAX fee)
- **Auto-Categorization** — Markets auto-sorted into 6 categories (sports, crypto, politics, weather, tech, general)
- **Optimistic Oracle** — Bonded propose-dispute-execute resolution
- **Chainlink Functions** (planned) — Automated data-driven resolution
- **Polymarket-Style API** — Simplified markets endpoint, category filtering, probability calculations

## Architecture

```
User → Frontend (Next.js) → MarketFactory → PoolEngine → Events → Indexer → DB → API → Frontend
                                                                                        ↑
Caddy (reverse proxy, SSL) → Next.js (:3000) → API (:8080) ────────────────────────────┘
```

## Smart Contracts (V2 — Fuji Testnet)

| Contract | Address | Role |
|---|---|---|
| **PoolEngine** | `0xB3702B20900AE748A68287B75b6065284081be00` | Core parimutuel engine |
| **MarketFactory** | `0x95b38D36D50BcFd4E4c875c640EB1627b48585eC` | Permissionless creation gateway |
| **ParlOracle** | `0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2` | Optimistic Oracle |

## Services

- **Backend API** (Rust, Actix-web, port 8080)
- **Indexer** (Rust, ethers-rs, polls every 5s)
- **Frontend** (Next.js, standalone, port 3000)
- **Caddy** (reverse proxy, port 80/443, auto SSL)

## Requirements

- Node.js v24+
- Rust 1.80+
- PostgreSQL 16+
- Foundry (for contract deployment)
- Caddy (for HTTPS)

## Quick Start

```bash
# Clone
git clone https://github.com/<your-org>/parl.git
cd parl

# Backend
cd backend
cp .env.example .env  # edit RPC + DB
cargo run

# Indexer
cd ../indexer
cargo run

# Frontend
cd ../web
npm install
npm run build
node .next/standalone/parl/web/server.js  # or: systemctl start parl-next

# Deploy contracts
cd ../contracts
forge script script/DeployV2.s.sol --broadcast --rpc-url <RPC>
```

## License

MIT
