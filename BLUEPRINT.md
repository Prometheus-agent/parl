# Parl — Project Blueprint

> Parimutuel Prediction Markets Protocol

## Tech Stack Decision Record

| Layer | Selection | Rationale |
|---|---|---|
| **Chain** | Base (EVM L2) | Low fees, EVM-compatible, Coinbase ecosystem, growing DeFi |
| **Smart Contracts** | Solidity | EVM standard, largest ecosystem, best tooling |
| **Backend** | Rust | Performance, memory safety, ideal for high-throughput pool engine |
| **Database** | PostgreSQL | Reliable, ACID-compliant, best for financial/reconciliation data |
| **Indexer** | Custom (Rust) | Full control over pool state indexing and event processing |
| **Frontend Framework** | Next.js + TypeScript | SSR, SEO, App Router, best DX |
| **Wallet Connection** | RainbowKit + Wagmi | Industry standard for EVM dApps |
| **Mobile** | Web Responsive (PWA) | MVP speed; native later if needed |
| **Landing Page** | Docs Portal + Demo App | Unified entry: learn + try simultaneously |

## Project Structure

```
parl/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── PoolEngine.sol
│   │   ├── Market.sol
│   │   ├── FeeModule.sol
│   │   └── interfaces/
│   └── test/
├── indexer/            # Custom Rust indexer
│   ├── src/
│   ├── migrations/
│   └── Cargo.toml
├── backend/            # Rust API server
│   ├── src/
│   ├── migrations/
│   └── Cargo.toml
├── web/                # Next.js frontend
│   ├── app/
│   │   ├── (marketing)/   # Landing, docs, blog
│   │   ├── app/           # Demo app (market browse, bet, claim)
│   │   └── api/           # BFF routes
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Build Order (MVP, 6-8 weeks)

| Sprint | Scope | Deliverable |
|---|---|---|
| **Week 1-2** | Smart Contracts | PoolEngine + Market + FeeModule (Foundry), tests |
| **Week 3** | Backend API | Rust server: pool CRUD, bet placement, claim |
| **Week 4** | Indexer | Rust indexer: contract events → PostgreSQL |
| **Week 5-6** | Frontend | Next.js: landing page + docs portal + basic demo app |
| **Week 7** | Integration | Wallet connect → place bet → claim flow end-to-end |
| **Week 8** | Polish | Audit prep, testnet deploy, docs completion |

## Infrastructure (MVP)

- **Testnet:** Base Sepolia
- **Hosting:** Vercel (Next.js) + dedicated server or Railway (Rust backend + DB)
- **CI/CD:** GitHub Actions
- **Wallet:** RainbowKit (mainnet) + Coinbase Wallet SDK

## Key Principles

- **Infrastructure-first:** Parl is a protocol, not an app. Frontend is a reference implementation.
- **Oracle-agnostic:** Resolution layer decoupled from pool engine.
- **Clean code over speed:** Financial contracts need correctness above all.
- **Partner-ready:** SDK design from day one.

---

*Recorded: July 2026 — ZyraBot 🛠️*
