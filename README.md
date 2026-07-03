# Parl — Parimutuel Prediction Markets Protocol

> **Infrastructure for infinite-scale, market-maker-free prediction markets on EVM-compatible chains.**

[![Website](https://img.shields.io/badge/web-parlmarket.xyz-8B5CF6?style=flat&logo=nextdotjs)](https://parlmarket.xyz)
[![API](https://img.shields.io/badge/api-api.parlmarket.xyz-8B5CF6?style=flat)](https://api.parlmarket.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)
[![Solidity](https://img.shields.io/badge/solidity-%5E0.8.28-363636?style=flat&logo=solidity)](contracts/)
[![Rust](https://img.shields.io/badge/rust-1.80+-DEA584?style=flat&logo=rust)](backend/)

---

## Overview

Parl is a parimutuel prediction market protocol that eliminates the need for liquidity providers, AMM curves, and order books. Each market operates as an independent pool — all bets are collected into a single pot, and winners split the pot proportionally based on their contribution to the winning outcome.

No LP tokens. No slippage. No impermanent loss. Pure, pooled speculation.

### Why Parimutuel?

| Feature | Parl (Parimutuel) | Polymarket (CFMM) | Azuro (LP Pools) |
|---|---|---|---|
| Liquidity needed | **None** | Yes (LP pools) | Yes (LP pools) |
| Slippage | **Zero** | Yes | Yes |
| Capital efficiency | **Max** | Low (locked LP) | Low (locked LP) |
| Scalability | **Infinite** | Per-pool caps | Per-pool caps |
| Complexity | **Low** | Medium | Medium |

---

## Features

- **⚡ Permissionless Market Creation** — Anyone creates a market via `MarketFactory` for a 0.01 AVAX spam fee
- **🧠 Auto-Categorization** — Markets auto-classified into 6 categories: Sports, Crypto, Politics, Weather, Technology, General
- **🔮 Optimistic Oracle** — Bonded propose-dispute-execute resolution with configurable dispute windows
- **💰 Protocol Fee** — Configurable 1–5% platform fee on winning pools (default 2%), withdrawable by owner
- **🖥️ Polymarket-Style API** — Simplified markets endpoint, category counts, volume tracking, implied probabilities
- **🔗 No Oracle Required** — Markets can resolve to any resolver contract, or use the built-in optimistic oracle
- **🌐 Full-Stack Live** — Frontend at `parlmarket.xyz` · API at `api.parlmarket.xyz`

---

## Architecture

```
                    ┌──────────────┐
                    │    User      │
                    │  (Browser)   │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │    Caddy     │
                    │  80/443 SSL  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼──────┐     │
     │  Frontend  │ │  Backend   │     │
     │  Next.js   │ │  Rust      │     │
     │  :3000     │ │  :8080     │     │
     └────────────┘ └─────┬──────┘     │
                          │            │
              ┌───────────▼────┐       │
              │   PostgreSQL   │       │
              │   (markets,    │       │
              │    bets, etc)  │       │
              └───────┬────────┘       │
                      │                │
              ┌───────▼────────┐       │
              │    Indexer     │◄──────┘
              │  (Rust, poll)  │  EVM Events
              └────────────────┘
```

**Flow:**
1. User places a bet via the frontend → MetaMask → `PoolEngine.placeBet()`
2. Contract emits `BetPlaced` event
3. Indexer picks up events and writes to PostgreSQL
4. Backend API serves market state, probabilities, and bet history
5. Frontend renders live data

---

## Smart Contracts (Fuji Testnet — V3)

| Contract | Address | Role |
|---|---|---|
| **PoolEngine** | [`0xb4f8D67b6E614FcF5fC6bF195bF50380C2086d95`](https://testnet.snowscan.xyz/address/0xb4f8D67b6E614FcF5fC6bF195bF50380C2086d95) | Core parimutuel engine — bet, claim, pool math |
| **MarketFactory** | [`0x06eD03E5A7F771bfA4E8fB9E81a0b6e0D9466277`](https://testnet.snowscan.xyz/address/0x06eD03E5A7F771bfA4E8fB9E81a0b6e0D9466277) | Permissionless market creation gateway |
| **ParlOracle** | [`0xfb4B68186875fb5200cC3Cf21591b3A6f7d94EC9`](https://testnet.snowscan.xyz/address/0xfb4B68186875fb5200cC3Cf21591b3A6f7d94EC9) | Optimistic oracle (propose → dispute → execute) |

> All contracts verified on Snowtrace. Chain: Avalanche Fuji (43113).

### Key Protocol Values

- **Market creation fee**: 0.01 AVAX (anti-spam, sent to Factory)
- **Platform fee**: 200 bps (2%) — owner-configurable 1–5%
- **Oracle bond**: 1 AVAX (configurable)
- **Dispute window**: 100 blocks (~5 min on Fuji)

---

## Tech Stack

### Contracts
- **Language**: Solidity 0.8.28
- **Framework**: Foundry (Forge)
- **Key dependencies**: Chainlink (interfaces), OpenZeppelin (ownable)

### Backend
- **Language**: Rust
- **Web framework**: Actix-web
- **Database**: PostgreSQL 16 (sqlx)
- **Blockchain**: ethers-rs (event indexing)

### Frontend
- **Framework**: Next.js 16 (standalone, App Router)
- **Wallet**: vanilla EIP-1193 (`window.ethereum`)
- **ABI encoding**: viem
- **Styling**: Tailwind CSS
- **Deployment**: Standalone output, Caddy reverse proxy

---

## Getting Started

### Prerequisites

- Node.js v24+
- Rust 1.80+
- PostgreSQL 16+
- Foundry (for contract work)
- Caddy (for production HTTPS)

### 1. Smart Contracts

```bash
cd contracts

# Build
forge build

# Test (36 tests)
forge test -vvv

# Deploy to Fuji
forge script script/DeployV2.s.sol:DeployV2 \
  --rpc-url https://avalanche-fuji.infura.io/v3/<KEY> \
  --broadcast --verify --chain 43113

# Deploy Oracle
forge script script/DeployOracle.s.sol:DeployOracle \
  --rpc-url <RPC> --broadcast --verify --chain 43113

# Create markets
FACTORY_ADDRESS=<addr> ORACLE_ADDRESS=<addr> \
  forge script script/CreateFromFactory.s.sol:CreateFromFactory \
  --rpc-url <RPC> --broadcast --chain 43113
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL + RPC_URL
cargo run --release    # starts on :8080
```

### 3. Indexer

```bash
cd indexer
cp .env.example .env       # edit DATABASE_URL, CONTRACT_ADDRESS, START_BLOCK
cargo run --release        # polls every 15s by default
```

### 4. Frontend

```bash
cd web
npm install
cp .env.example .env   # fill in contract addresses
npm run build
node .next/standalone/server.js   # starts on :3000
```

### 5. Production (systemd)

All services have systemd units:

```bash
systemctl enable --now parl-caddy parl-next parl-backend parl-indexer
```

---

## API Endpoints

Base: `https://api.parlmarket.xyz` (or via Next.js rewrite at `https://parlmarket.xyz/api`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/simplified-markets?category=<cat>` | List markets (lightweight) |
| `GET` | `/api/markets` | Full market list with probabilities |
| `GET` | `/api/markets/:id` | Single market detail |
| `GET` | `/api/categories` | Category counts |
| `GET` | `/api/bets?bettor=<address>` | User's bets |
| `GET` | `/health` | Health check |

### Sample Response

```json
{
  "id": "e4c5cce2-...",
  "market_id_hex": "0xdb7ea9bd...",
  "question": "Will BTC exceed 100k?",
  "outcomes": ["Yes - BTC exceeds 100k", "No - BTC stays below 100k"],
  "status": "active",
  "category": "crypto",
  "total_pool_avax": "0.0000",
  "fee_basis_points": 200,
  "probabilities": [0.5, 0.5]
}
```

---

## Contract Architecture

```
MarketFactory
  │
  │  createMarket{value: 0.01}(marketId, description, outcomes, resolver, feeBps)
  ▼
PoolEngine
  ├─ placeBet(marketId, outcome, amount)
  ├─ claim(marketId)
  ├─ calculatePayout(marketId, bettor)
  ├─ cancelMarket(marketId)
  ├─ getMarketState(marketId) → MarketState
  └─ withdrawProtocolFees(to, amount)

ParlOracle (optimistic oracle)
  ├─ proposeOutcome(marketId, outcome, bond)
  ├─ disputeProposal(marketId, bond)
  └─ executeResolution(marketId)
```

---

## Testing

```bash
cd contracts
forge test -vvv   # 36 tests, 0 failed
```

- `PoolEngine.t.sol` — 7 unit tests (bet, claim, pause, cancel, edge cases)
- `ParlE2E.t.sol` — 29 integration tests (full lifecycle, fees, proposals, disputes, oracles)
- Coverage: duplicate markets, invalid fees, zero bets, cancelation, fee withdrawal, multi-market
- All tests run on a fresh anvil instance (no mainnet fork needed)

---

## Roadmap

- [x] V3 contracts with `description` field and `withdrawProtocolFees`
- [x] Optimistic oracle with bonded resolution
- [x] Full-stack MVP (create, bet, claim, resolve)
- [ ] ParlAutoResolver — Chainlink Functions-driven automated resolution
- [ ] Multi-chain deployment (Ethereum Sepolia, Polygon Amoy)
- [ ] MEV-resistant batch settlements
- [ ] Sub-second finality markets
- [ ] Parl SDK for third-party market creation

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built with Foundry, Rust, Next.js, and ☕ by [Zyrian Dev](https://github.com/Zyriandev).*
