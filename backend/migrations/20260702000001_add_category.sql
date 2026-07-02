-- Add off-chain category to markets
ALTER TABLE markets ADD COLUMN IF NOT EXISTS category TEXT;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
