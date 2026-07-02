use tracing_subscriber::EnvFilter;

mod config;
mod indexer;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn")),
        )
        .init();

    let config = config::Config::from_env();

    // Require contract address
    if config.contract_address.is_empty() {
        anyhow::bail!("CONTRACT_ADDRESS environment variable must be set. Deploy the PoolEngine contract first.");
    }

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to PostgreSQL");

    tracing::info!("Connected to database");

    // Ensure indexer_state table exists
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS indexer_state (
            contract_address TEXT PRIMARY KEY,
            last_block BIGINT NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // Resume from last indexed block if available
    let last_block: Option<i64> = sqlx::query_scalar(
        r#"SELECT last_block FROM indexer_state WHERE contract_address = $1"#,
    )
    .bind(&config.contract_address)
    .fetch_optional(&pool)
    .await?
    .flatten();

    let config = if let Some(block) = last_block {
        tracing::info!("Resuming from block {}", block);
        config::Config { start_block: block as u64, ..config }
    } else {
        tracing::info!("Starting fresh from block {}", config.start_block);
        config
    };

    indexer::run_indexer(pool, config).await
}
