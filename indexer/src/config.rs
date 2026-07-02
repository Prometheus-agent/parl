use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub rpc_url: String,
    pub contract_address: String,
    pub start_block: u64,
    pub poll_interval_ms: u64,
    pub batch_size: u64,
    pub chain_id: u64,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            rpc_url: std::env::var("RPC_URL")
                .expect("RPC_URL must be set"),
            contract_address: std::env::var("CONTRACT_ADDRESS")
                .unwrap_or_default(),
            start_block: std::env::var("START_BLOCK")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(0),
            poll_interval_ms: std::env::var("POLL_INTERVAL_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2000),
            batch_size: std::env::var("BATCH_SIZE")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(500),
            chain_id: std::env::var("CHAIN_ID")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(84532),
        }
    }
}
