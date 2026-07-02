use actix_web::{get, HttpResponse};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
    timestamp: String,
}

#[get("/health")]
pub async fn health_check() -> HttpResponse {
    let response = HealthResponse {
        status: "ok",
        version: "0.1.0",
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    HttpResponse::Ok().json(response)
}
