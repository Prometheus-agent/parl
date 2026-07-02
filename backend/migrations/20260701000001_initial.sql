-- Parl Protocol — PostgreSQL Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* ───── Markets ───── */

CREATE TYPE market_status AS ENUM (
    'active',
    'resolving',
    'resolved',
    'canceled'
);

CREATE TABLE markets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id       BYTEA NOT NULL UNIQUE,          -- keccak256 id from contract
    creator         BYTEA NOT NULL,                  -- address (20 bytes)
    resolver        BYTEA NOT NULL,                  -- address (20 bytes)
    outcomes        TEXT[] NOT NULL,
    fee_basis_points INTEGER NOT NULL CHECK (fee_basis_points BETWEEN 100 AND 500),
    status          market_status NOT NULL DEFAULT 'active',
    total_pool      NUMERIC(78, 0) NOT NULL DEFAULT 0,
    winning_outcome INTEGER,
    dispute_window  INTEGER NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    tx_hash         BYTEA,                           -- creation tx
    block_number    BIGINT,
    chain_id        BIGINT NOT NULL DEFAULT 84532    -- Base Sepolia
);

CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);

/* ───── Bets ───── */

CREATE TABLE bets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id       UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    bettor          BYTEA NOT NULL,                  -- address (20 bytes)
    outcome         INTEGER NOT NULL,
    amount          NUMERIC(78, 0) NOT NULL,
    claimed         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash         BYTEA,
    block_number    BIGINT
);

CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_bettor ON bets(bettor);
CREATE UNIQUE INDEX idx_bets_market_bettor ON bets(market_id, bettor);

/* ───── Claims ───── */

CREATE TABLE claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id          UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    market_id       UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    bettor          BYTEA NOT NULL,
    payout          NUMERIC(78, 0) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash         BYTEA
);

CREATE INDEX idx_claims_bettor ON claims(bettor);

/* ───── Fee Ledger ───── */

CREATE TABLE fee_ledger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id       UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    amount          NUMERIC(78, 0) NOT NULL,
    claimed         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash         BYTEA
);
