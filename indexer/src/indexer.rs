use ethers::{
    abi::{Abi, RawLog},
    prelude::*,
    providers::{Middleware, Provider},
    types::{Filter, Log, H160},
};
use sqlx::PgPool;
use std::sync::Arc;

use crate::config::Config;

abigen!(
    PoolEngine,
    "./PoolEngine.abi.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

/// Spawns the indexer event loop. Runs until cancelled.
pub async fn run_indexer(pool: PgPool, config: Config) -> anyhow::Result<()> {
    let provider = Provider::<Http>::try_from(&config.rpc_url)?;
    let client = Arc::new(provider);
    let contract_addr: H160 = config.contract_address.parse()?;

    // Load contract ABI for event signature hashing
    let abi: Abi = serde_json::from_str(include_str!("../PoolEngine.abi.json"))?;

    let market_created_sig = abi.event("MarketCreated")?.signature();
    let bet_placed_sig = abi.event("BetPlaced")?.signature();
    let market_resolved_sig = abi.event("MarketResolved")?.signature();
    let claim_processed_sig = abi.event("ClaimProcessed")?.signature();

    let poll_ms = config.poll_interval_ms;
    let mut last_block = config.start_block;
    let mut consecutive_errors = 0u32;

    tracing::info!(
        "Indexer started — contract={}, start_block={}, poll={}ms",
        config.contract_address,
        last_block,
        poll_ms
    );

    loop {
        let current_block: u64 = match client.get_block_number().await {
            Ok(n) => n.as_u64(),
            Err(e) => {
                tracing::error!("Failed to get block number: {e}");
                consecutive_errors += 1;
                let backoff = std::cmp::min(3000u64 * 2u64.pow(std::cmp::min(consecutive_errors - 1, 10)), 30000);
                tokio::time::sleep(tokio::time::Duration::from_millis(backoff)).await;
                continue;
            }
        };

        if last_block >= current_block {
            consecutive_errors = 0;
            tokio::time::sleep(tokio::time::Duration::from_millis(poll_ms)).await;
            continue;
        }

        // Small batch size to avoid Infura rate limits on free tier
        let batch_size = std::cmp::min(500u64, current_block - last_block);
        let to_block = last_block + batch_size;

        let filter = Filter::new()
            .address(contract_addr)
            .from_block(last_block + 1)
            .to_block(to_block);

        let logs: Vec<Log> = match client.get_logs(&filter).await {
            Ok(l) => {
                consecutive_errors = 0;
                l
            }
            Err(e) => {
                let err_str = e.to_string();
                tracing::error!("Failed to get logs (block {}-{}): {}", last_block + 1, to_block, err_str);
                consecutive_errors += 1;
                let backoff = std::cmp::min(3000u64 * 2u64.pow(std::cmp::min(consecutive_errors - 1, 10)), 30000);
                tracing::warn!("Rate limited — backing off {}ms (error #{})", backoff, consecutive_errors);
                tokio::time::sleep(tokio::time::Duration::from_millis(backoff)).await;
                continue;
            }
        };

        // Gentle rate-limit avoidance if we just recovered
        if consecutive_errors > 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(
                std::cmp::min(consecutive_errors as u64 * 100, 2000),
            ))
            .await;
        }

        let mut processed = 0u32;
        let chain_id = config.chain_id;

        for log in &logs {
            let raw_log = RawLog {
                topics: log.topics.clone(),
                data: log.data.to_vec(),
            };

            if raw_log.topics.is_empty() {
                continue;
            }

            let topic0 = raw_log.topics[0];

            if topic0 == market_created_sig {
                if let Ok(event) = PoolEngineEvents::decode_log(&raw_log) {
                    if let PoolEngineEvents::MarketCreatedFilter(ev) = event {
                        if let Err(e) = handle_market_created(&pool, &ev, log, chain_id).await {
                            tracing::error!("MarketCreated handler: {e}");
                        } else {
                            processed += 1;
                        }
                    }
                }
            } else if topic0 == bet_placed_sig {
                if let Ok(event) = PoolEngineEvents::decode_log(&raw_log) {
                    if let PoolEngineEvents::BetPlacedFilter(ev) = event {
                        if let Err(e) = handle_bet_placed(&pool, &ev, log).await {
                            tracing::error!("BetPlaced handler: {e}");
                        } else {
                            processed += 1;
                        }
                    }
                }
            } else if topic0 == market_resolved_sig {
                if let Ok(event) = PoolEngineEvents::decode_log(&raw_log) {
                    if let PoolEngineEvents::MarketResolvedFilter(ev) = event {
                        if let Err(e) = handle_market_resolved(&pool, &ev, log).await {
                            tracing::error!("MarketResolved handler: {e}");
                        } else {
                            processed += 1;
                        }
                    }
                }
            } else if topic0 == claim_processed_sig {
                if let Ok(event) = PoolEngineEvents::decode_log(&raw_log) {
                    if let PoolEngineEvents::ClaimProcessedFilter(ev) = event {
                        if let Err(e) = handle_claim_processed(&pool, &ev, log).await {
                            tracing::error!("ClaimProcessed handler: {e}");
                        } else {
                            processed += 1;
                        }
                    }
                }
            }
        }

        if processed > 0 {
            tracing::info!("Processed {} events up to block {}", processed, to_block);
        }

        last_block = to_block;

        // Persist last indexed block
        if let Err(e) = sqlx::query(
            "INSERT INTO indexer_state (contract_address, last_block, updated_at) \
             VALUES ($1, $2, NOW()) \
             ON CONFLICT (contract_address) DO UPDATE SET last_block = $2, updated_at = NOW()",
        )
        .bind(&config.contract_address)
        .bind(last_block as i64)
        .execute(&pool)
        .await
        {
            tracing::error!("Failed to persist indexer state: {e}");
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(poll_ms)).await;
    }
}

/* ───── Helpers ───── */

fn h256_to_vec(h: &[u8; 32]) -> Vec<u8> {
    h.to_vec()
}

fn h160_to_fixed(h: &H160) -> Vec<u8> {
    h.0.to_vec()
}

/* ───── Event Handlers ───── */

/// Auto-detect category from outcomes
fn detect_category(outcomes: &[String]) -> &'static str {
    let text: String = outcomes.join(" ").to_lowercase();

    // Politics (check before sports to avoid "election" matching "win")
    if ["president", "election", "vote", "senate", "congress", "democrat", "republican",
         "governor", "mayor", "prime minister", "party"]
        .iter().any(|k| text.contains(k))
    {
        return "politics";
    }

    // Crypto
    if ["btc", "bitcoin", "eth", "ethereum", "sol", "solana", "crypto", "token", "price",
         "defi", "nft", "tvl", "market cap", "airdrop", "halving", "etf"]
        .iter().any(|k| text.contains(k))
    {
        return "crypto";
    }

    // Weather / Climate
    if ["temperature", "weather", "climate", "hurricane", "celsius", "fahrenheit", "degrees",
         "storm", "rain", "snow"]
        .iter().any(|k| text.contains(k))
    {
        return "weather";
    }

    // Tech / AI
    if ["gpt", "ai", "artificial intelligence", "openai", "google", "apple", "microsoft",
         "amazon", "tesla", "spacex", "launch", "rocket", "satellite"]
        .iter().any(|k| text.contains(k))
    {
        return "technology";
    }

    // Sports (check last)
    if ["win", "lose", "draw", "team", "match", "tournament", "champion", "goal", "score", "nfl",
         "nba", "nhl", "mlb", "ufc", "soccer", "football", "basketball", "tennis", "f1", "gp"]
        .iter().any(|k| text.contains(k))
    {
        return "sports";
    }

    // General
    "general"
}

async fn handle_market_created(
    pool: &PgPool,
    ev: &MarketCreatedFilter,
    log: &Log,
    chain_id: u64,
) -> Result<(), sqlx::Error> {
    let tx_hash = log.transaction_hash.map(|h| h.as_bytes().to_vec());

    let category = detect_category(&ev.outcomes);

    sqlx::query(
        r#"
        INSERT INTO markets (market_id, creator, resolver, outcomes, fee_basis_points, status,
                             dispute_window, total_pool, tx_hash, block_number, chain_id, category)
        VALUES ($1, $2, $3, $4, $5, 'active', 100, '0', $6, $7, $8, $9)
        ON CONFLICT (market_id) DO NOTHING
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(h160_to_fixed(&ev.resolver))
    .bind(h160_to_fixed(&ev.resolver))
    .bind(&ev.outcomes)
    .bind(ev.fee_basis_points.low_u32() as i32)
    .bind(tx_hash)
    .bind(log.block_number.map(|n| n.as_u64() as i64))
    .bind(chain_id as i64)
    .bind(category)
    .execute(pool)
    .await?;

    tracing::info!(
        "MarketCreated: market_id=0x{} outcomes={:?} fee={} category={}",
        hex::encode(ev.market_id),
        ev.outcomes,
        ev.fee_basis_points,
        category
    );

    Ok(())
}

async fn handle_bet_placed(
    pool: &PgPool,
    ev: &BetPlacedFilter,
    log: &Log,
) -> Result<(), sqlx::Error> {
    let tx_hash = log.transaction_hash.map(|h| h.as_bytes().to_vec());

    // Upsert bet (accumulate on same market + bettor)
    sqlx::query(
        r#"
        INSERT INTO bets (market_id, bettor, outcome, amount, claimed, tx_hash, block_number)
        VALUES (
            (SELECT id FROM markets WHERE market_id = $1),
            $2, $3, $4::numeric, false, $5, $6
        )
        ON CONFLICT (market_id, bettor) DO UPDATE SET
            amount = bets.amount + $4::numeric,
            tx_hash = COALESCE(bets.tx_hash, $5),
            outcome = $3
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(h160_to_fixed(&ev.bettor))
    .bind(ev.outcome.low_u32() as i32)
    .bind(ev.amount.to_string())
    .bind(tx_hash)
    .bind(log.block_number.map(|n| n.as_u64() as i64))
    .execute(pool)
    .await?;

    // Update total pool on parent market
    sqlx::query(
        r#"
        UPDATE markets
        SET total_pool = total_pool + $2::numeric
        WHERE market_id = $1
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(ev.amount.to_string())
    .execute(pool)
    .await?;

    Ok(())
}

async fn handle_market_resolved(
    pool: &PgPool,
    ev: &MarketResolvedFilter,
    log: &Log,
) -> Result<(), sqlx::Error> {
    let _tx_hash = log.transaction_hash.map(|h| h.as_bytes().to_vec());

    sqlx::query(
        r#"
        UPDATE markets
        SET status = 'resolved',
            winning_outcome = $2,
            resolved_at = NOW(),
            total_pool = $3::numeric
        WHERE market_id = $1
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(ev.winning_outcome.low_u32() as i32)
    .bind(ev.total_pool.to_string())
    .execute(pool)
    .await?;

    tracing::info!(
        "MarketResolved: market_id=0x{} winner={} pool={}",
        hex::encode(ev.market_id),
        ev.winning_outcome,
        ev.total_pool
    );

    Ok(())
}

async fn handle_claim_processed(
    pool: &PgPool,
    ev: &ClaimProcessedFilter,
    log: &Log,
) -> Result<(), sqlx::Error> {
    let _tx_hash = log.transaction_hash.map(|h| h.as_bytes().to_vec());

    // Mark bet as claimed
    sqlx::query(
        r#"
        UPDATE bets
        SET claimed = true
        WHERE market_id = (SELECT id FROM markets WHERE market_id = $1)
          AND bettor = $2
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(h160_to_fixed(&ev.bettor))
    .execute(pool)
    .await?;

    // Insert claim record
    sqlx::query(
        r#"
        INSERT INTO claims (bet_id, market_id, bettor, payout, tx_hash)
        VALUES (
            (SELECT b.id FROM bets b
             JOIN markets m ON m.id = b.market_id
             WHERE m.market_id = $1 AND b.bettor = $2 LIMIT 1),
            (SELECT id FROM markets WHERE market_id = $1),
            $2, $3::numeric, $4
        )
        "#,
    )
    .bind(h256_to_vec(&ev.market_id))
    .bind(h160_to_fixed(&ev.bettor))
    .bind(ev.amount.to_string())
    .bind(_tx_hash)
    .execute(pool)
    .await?;

    Ok(())
}
