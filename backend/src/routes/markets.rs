use actix_web::{get, web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db;

#[get("/api/markets")]
pub async fn list_markets(
    pool: web::Data<PgPool>,
    query: web::Query<MarketFilter>,
) -> HttpResponse {
    match db::list_markets(pool.get_ref(), query.status.clone(), query.category.clone()).await {
        Ok(markets) => {
            let response: Vec<db::MarketResponse> = markets
                .into_iter()
                .map(|(m, probs, pools)| db::MarketResponse::from((m, probs, pools)))
                .collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to list markets: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to fetch markets"
            }))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct MarketFilter {
    pub status: Option<String>,
    pub category: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct StatusFilter {
    pub status: Option<String>,
}

#[get("/api/markets/{id}")]
pub async fn get_market(pool: web::Data<PgPool>, path: web::Path<String>) -> HttpResponse {
    let id_str = path.into_inner();

    // Try UUID first, then hex bytes
    let (market_id, maybe_uuid) = if let Ok(uuid) = Uuid::parse_str(&id_str) {
        (None, Some(uuid))
    } else if let Ok(bytes) = hex::decode(id_str.strip_prefix("0x").unwrap_or(&id_str)) {
        (Some(bytes), None)
    } else {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "invalid market id"
        }));
    };

    // Fetch market
    let market = if let Some(uuid) = maybe_uuid {
        db::get_market(pool.get_ref(), uuid).await
    } else if let Some(bytes) = market_id {
        db::get_market_by_contract_id(pool.get_ref(), bytes).await
    } else {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "invalid market id"
        }));
    };

    match market {
        Ok(Some(m)) => {
            // Get outcome pools and probabilities
            let pools = db::get_outcome_pools(pool.get_ref(), m.id).await.unwrap_or_default();
            let probs = db::calc_probabilities(&m.outcomes, &pools, &m.total_pool);
            HttpResponse::Ok().json(db::MarketResponse::from((m, probs, pools)))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "market not found"
        })),
        Err(e) => {
            tracing::error!("Failed to get market: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "internal error"
            }))
        }
    }
}

#[get("/api/markets/{id}/bets")]
pub async fn get_market_bets(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> HttpResponse {
    let market_id = path.into_inner();

    match db::get_market_bets(pool.get_ref(), market_id).await {
        Ok(bets) => {
            let response: Vec<db::BetResponse> = bets.into_iter().map(Into::into).collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to get market bets: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to fetch bets"
            }))
        }
    }
}

#[get("/api/bets")]
pub async fn list_bettor_bets(
    pool: web::Data<PgPool>,
    query: web::Query<BettorParam>,
) -> HttpResponse {
    let bettor_hex = &query.bettor;
    let bettor_bytes = match hex::decode(bettor_hex.strip_prefix("0x").unwrap_or(bettor_hex)) {
        Ok(b) => b,
        Err(_) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "invalid bettor address"
            }));
        }
    };

    match db::get_bettor_bets(pool.get_ref(), bettor_bytes).await {
        Ok(bets) => {
            let response: Vec<db::BetResponse> = bets.into_iter().map(Into::into).collect();
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to get bettor bets: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to fetch bets"
            }))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct BettorParam {
    bettor: String,
}

#[get("/api/markets/{id}/payout/{bettor}")]
pub async fn get_payout(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
) -> HttpResponse {
    let (market_id, bettor_hex) = path.into_inner();
    let bettor_bytes = match hex::decode(bettor_hex.strip_prefix("0x").unwrap_or(&bettor_hex)) {
        Ok(b) => b,
        Err(_) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "invalid bettor address"
            }));
        }
    };

    match db::calculate_payout(pool.get_ref(), market_id, bettor_bytes).await {
        Ok(Some(payout)) => HttpResponse::Ok().json(serde_json::json!({
            "payout": payout
        })),
        Ok(None) => HttpResponse::Ok().json(serde_json::json!({
            "payout": "0"
        })),
        Err(e) => {
            tracing::error!("Failed to calculate payout: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to calculate payout"
            }))
        }
    }
}

/* ───── New Endpoints ───── */

/// GET /api/categories — list all categories with market counts
#[get("/api/categories")]
pub async fn list_categories(pool: web::Data<PgPool>) -> HttpResponse {
    match db::get_categories(pool.get_ref()).await {
        Ok(cats) => HttpResponse::Ok().json(cats),
        Err(e) => {
            tracing::error!("Failed to get categories: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to fetch categories"
            }))
        }
    }
}

/// GET /api/simplified-markets — lightweight market list for frontend
#[get("/api/simplified-markets")]
pub async fn list_simplified_markets(
    pool: web::Data<PgPool>,
    query: web::Query<MarketFilter>,
) -> HttpResponse {
    match db::list_simplified_markets(pool.get_ref(), query.category.clone()).await {
        Ok(markets) => HttpResponse::Ok().json(markets),
        Err(e) => {
            tracing::error!("Failed to list simplified markets: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "failed to fetch simplified markets"
            }))
        }
    }
}
