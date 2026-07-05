use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;
use parl_shared::category::detect_category;

/* ───── Types ───── */

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "market_status", rename_all = "lowercase")]
pub enum MarketStatus {
    Active,
    Resolving,
    Resolved,
    Canceled,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Market {
    pub id: Uuid,
    pub market_id: Vec<u8>,
    pub creator: Vec<u8>,
    pub resolver: Vec<u8>,
    pub outcomes: Vec<String>,
    pub description: Option<String>,
    pub fee_basis_points: i32,
    pub status: String,
    pub total_pool: String,
    pub winning_outcome: Option<i32>,
    pub dispute_window: i32,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub tx_hash: Option<Vec<u8>>,
    pub block_number: Option<i64>,
    pub chain_id: i64,
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Bet {
    pub id: Uuid,
    pub market_id: Uuid,
    pub bettor: Vec<u8>,
    pub outcome: i32,
    pub amount: String,
    pub claimed: bool,
    pub created_at: DateTime<Utc>,
    pub tx_hash: Option<Vec<u8>>,
    pub block_number: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Claim {
    pub id: Uuid,
    pub bet_id: Uuid,
    pub market_id: Uuid,
    pub bettor: Vec<u8>,
    pub payout: String,
    pub created_at: DateTime<Utc>,
    pub tx_hash: Option<Vec<u8>>,
}

/* ───── API Response Types ───── */

#[derive(Debug, Serialize)]
pub struct MarketResponse {
    pub id: Uuid,
    pub market_id_hex: String,
    pub creator: String,
    pub resolver: String,
    pub outcomes: Vec<String>,
    pub description: Option<String>,
    pub fee_basis_points: i32,
    pub status: String,
    pub total_pool: String,
    pub winning_outcome: Option<i32>,
    pub dispute_window: i32,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub chain_id: i64,
    pub category: Option<String>,
    /// Implied probabilities per outcome (e.g. [0.25, 0.75])
    pub probabilities: Vec<f64>,
    /// Pool per outcome in AVAX
    pub outcome_pools: Vec<String>,
}

impl From<(Market, Vec<f64>, Vec<String>)> for MarketResponse {
    fn from((m, probs, pools): (Market, Vec<f64>, Vec<String>)) -> Self {
        Self {
            id: m.id,
            market_id_hex: hex_encode(&m.market_id),
            creator: hex_encode(&m.creator),
            resolver: hex_encode(&m.resolver),
            outcomes: m.outcomes,
            description: m.description.clone(),
            fee_basis_points: m.fee_basis_points,
            status: m.status,
            total_pool: m.total_pool,
            winning_outcome: m.winning_outcome,
            dispute_window: m.dispute_window,
            created_at: m.created_at,
            resolved_at: m.resolved_at,
            chain_id: m.chain_id,
            category: m.category,
            probabilities: probs,
            outcome_pools: pools,
        }
    }
}

/// Simplified market — Polymarket-style lightweight response
#[derive(Debug, Serialize)]
pub struct SimplifiedMarket {
    pub id: Uuid,
    pub market_id_hex: String,
    pub question: String,
    pub outcomes: Vec<String>,
    pub description: Option<String>,
    pub status: String,
    pub category: Option<String>,
    pub total_pool_avax: String,
    pub volume_avax: String,
    pub fee_basis_points: i32,
    pub probabilities: Vec<f64>,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct BetResponse {
    pub id: Uuid,
    pub market_id: Uuid,
    pub bettor: String,
    pub outcome: i32,
    pub amount: String,
    pub claimed: bool,
    pub created_at: DateTime<Utc>,
}

impl From<Bet> for BetResponse {
    fn from(b: Bet) -> Self {
        Self {
            id: b.id,
            market_id: b.market_id,
            bettor: hex_encode(&b.bettor),
            outcome: b.outcome,
            amount: b.amount,
            claimed: b.claimed,
            created_at: b.created_at,
        }
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

/* ───── Helpers ───── */

fn hex_encode(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}

/// Calculate implied probabilities from outcome pool sizes
pub fn calc_probabilities(outcomes: &[String], pools: &[String], total_pool: &str) -> Vec<f64> {
    let total: f64 = total_pool.parse::<f64>().unwrap_or(0.0);
    if total == 0.0 {
        return outcomes.iter().map(|_| 0.0).collect();
    }
    pools
        .iter()
        .map(|p| {
            let val: f64 = p.parse().unwrap_or(0.0);
            if val > 0.0 && total > 0.0 {
                (val / total * 10000.0).round() / 100.0 // round to 2 decimals
            } else {
                0.0
            }
        })
        .collect()
}

/// Auto-detect category from outcomes text
pub fn detect_category(outcomes: &[String]) -> &'static str {
    let text: String = outcomes.join(" ").to_lowercase();

    // Politics (check before sports)
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

    // Weather
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

    "general"
}

/* ───── Queries ───── */

/// Fetch outcome pool sizes for a market
pub async fn get_outcome_pools(pool: &PgPool, market_uuid: Uuid) -> Result<Vec<String>, sqlx::Error> {
    // Get the outcomes array first to know how many outcomes
    let outcomes: Vec<String> = sqlx::query_scalar(
        "SELECT unnest(outcomes) FROM markets WHERE id = $1"
    )
    .bind(market_uuid)
    .fetch_all(pool)
    .await?;

    // For each outcome, sum the bets
    let mut pools = Vec::new();
    for i in 0..outcomes.len() {
        let amt: Option<String> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(amount::numeric), 0)::text FROM bets WHERE market_id = $1 AND outcome = $2"
        )
        .bind(market_uuid)
        .bind(i as i32)
        .fetch_optional(pool)
        .await?
        .flatten();
        pools.push(amt.unwrap_or_else(|| "0".to_string()));
    }
    Ok(pools)
}

pub async fn list_markets(
    pool: &PgPool,
    status_filter: Option<String>,
    category_filter: Option<String>,
) -> Result<Vec<(Market, Vec<f64>, Vec<String>)>, sqlx::Error> {
    let markets = if let Some(status) = status_filter {
        if let Some(cat) = category_filter {
            sqlx::query_as::<_, Market>(
                r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                          description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                          dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
                   FROM markets WHERE status::text = $1 AND category = $2 ORDER BY created_at DESC"#
            )
            .bind(status)
            .bind(cat)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Market>(
                r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                          description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                          dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
                   FROM markets WHERE status::text = $1 ORDER BY created_at DESC"#
            )
            .bind(status)
            .fetch_all(pool)
            .await?
        }
    } else if let Some(cat) = category_filter {
        sqlx::query_as::<_, Market>(
            r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                      description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                      dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
               FROM markets WHERE category = $1 ORDER BY created_at DESC"#
        )
        .bind(cat)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Market>(
            r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                      description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                      dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
               FROM markets ORDER BY created_at DESC"#
        )
        .fetch_all(pool)
        .await?
    };

    let mut result = Vec::new();
    for m in markets {
        let pools = get_outcome_pools(pool, m.id).await?;
        let probs = calc_probabilities(&m.outcomes, &pools, &m.total_pool);
        result.push((m, probs, pools));
    }
    Ok(result)
}

pub async fn get_market(pool: &PgPool, id: Uuid) -> Result<Option<Market>, sqlx::Error> {
    sqlx::query_as::<_, Market>(
        r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                  description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                  dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
           FROM markets WHERE id = $1"#
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_market_by_contract_id(pool: &PgPool, market_id: Vec<u8>) -> Result<Option<Market>, sqlx::Error> {
    sqlx::query_as::<_, Market>(
        r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                  description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                  dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
           FROM markets WHERE market_id = $1"#
    )
    .bind(market_id)
    .fetch_optional(pool)
    .await
}

pub async fn get_market_bets(pool: &PgPool, market_id: Uuid) -> Result<Vec<Bet>, sqlx::Error> {
    sqlx::query_as::<_, Bet>(
        r#"SELECT id, market_id, bettor, outcome, amount::text, claimed, created_at, tx_hash, block_number
           FROM bets WHERE market_id = $1 ORDER BY created_at DESC"#
    )
    .bind(market_id)
    .fetch_all(pool)
    .await
}

pub async fn get_bettor_bets(pool: &PgPool, bettor: Vec<u8>) -> Result<Vec<Bet>, sqlx::Error> {
    sqlx::query_as::<_, Bet>(
        r#"SELECT id, market_id, bettor, outcome, amount::text, claimed, created_at, tx_hash, block_number
           FROM bets WHERE bettor = $1 ORDER BY created_at DESC"#
    )
    .bind(bettor)
    .fetch_all(pool)
    .await
}

pub async fn calculate_payout(pool: &PgPool, market_id: Uuid, bettor: Vec<u8>) -> Result<Option<String>, sqlx::Error> {
    let row = sqlx::query_scalar::<_, Option<String>>(
        r#"
        SELECT
            CASE
                WHEN m.status = 'resolved' AND b.claimed = false AND b.outcome = m.winning_outcome THEN
                    ((b.amount::numeric * (m.total_pool::numeric * (10000 - m.fee_basis_points) / 10000)) /
                     (SELECT COALESCE(SUM(b2.amount::numeric), 0)
                      FROM bets b2
                      WHERE b2.market_id = $1 AND b2.outcome = m.winning_outcome))::text
                ELSE NULL
            END
        FROM bets b
        JOIN markets m ON m.id = b.market_id
        WHERE b.market_id = $1 AND b.bettor = $2
        "#,
    )
    .bind(market_id)
    .bind(bettor)
    .fetch_optional(pool)
    .await?;

    Ok(row.flatten())
}

/// Get categories with market counts
pub async fn get_categories(pool: &PgPool) -> Result<Vec<CategoryCount>, sqlx::Error> {
    sqlx::query_as::<_, CategoryCount>(
        r#"
        SELECT COALESCE(category, 'uncategorized') AS category, COUNT(*)::bigint AS count
        FROM markets
        GROUP BY category
        ORDER BY count DESC
        "#
    )
    .fetch_all(pool)
    .await
}

/// Simplified markets list — lightweight for frontend table
pub async fn list_simplified_markets(
    pool: &PgPool,
    category_filter: Option<String>,
) -> Result<Vec<SimplifiedMarket>, sqlx::Error> {
    let markets = if let Some(cat) = category_filter {
        sqlx::query_as::<_, Market>(
            r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                      description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                      dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
               FROM markets WHERE category = $1 ORDER BY created_at DESC"#
        )
        .bind(cat)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Market>(
            r#"SELECT id, market_id, creator, resolver, outcomes, fee_basis_points,
                      description, status::text AS "status", total_pool::text AS "total_pool", winning_outcome,
                      dispute_window, created_at, resolved_at, tx_hash, block_number, chain_id, category
               FROM markets ORDER BY created_at DESC"#
        )
        .fetch_all(pool)
        .await?
    };

    let mut result = Vec::new();
    for m in markets {
        let amo_pools = get_outcome_pools(pool, m.id).await?;
        let probs = calc_probabilities(&m.outcomes, &amo_pools, &m.total_pool);

        // Calculate volume (total of all bets)
        let volume: Option<String> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(amount::numeric), 0)::text FROM bets WHERE market_id = $1"
        )
        .bind(m.id)
        .fetch_optional(pool)
        .await?
        .flatten();

        let pool_avax = pool_amount_to_avax(&m.total_pool);
        let vol_avax = pool_amount_to_avax(&volume.unwrap_or_else(|| "0".to_string()));
        let question = m.description.clone().unwrap_or_else(|| m.outcomes.join(" | "));

        result.push(SimplifiedMarket {
            id: m.id,
            market_id_hex: hex_encode(&m.market_id),
            question,
            outcomes: m.outcomes,
            description: m.description.clone(),
            status: m.status,
            category: m.category,
            total_pool_avax: pool_avax,
            volume_avax: vol_avax,
            fee_basis_points: m.fee_basis_points,
            probabilities: probs,
            created_at: m.created_at,
            resolved_at: m.resolved_at,
        });
    }
    Ok(result)
}

fn pool_amount_to_avax(amount: &str) -> String {
    let val: f64 = amount.parse().unwrap_or(0.0);
    let avax = val / 1e18;
    format!("{:.4}", avax)
}
