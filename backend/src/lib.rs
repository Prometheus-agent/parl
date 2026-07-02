use sqlx::PgPool;
use std::net::TcpListener;

mod db;
mod routes;

pub async fn run(pool: PgPool, bind_addr: &str) -> std::io::Result<()> {
    use actix_web::{App, HttpServer, middleware, web};

    tracing::info!("Starting Parl API server on {bind_addr}");

    let listener = TcpListener::bind(bind_addr)?;

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Compress::default())
            .wrap(
                actix_cors::Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .max_age(3600),
            )
            .app_data(web::Data::new(pool.clone()))
            .service(routes::health::health_check)
            .service(routes::markets::list_markets)
            .service(routes::markets::get_market)
            .service(routes::markets::get_market_bets)
            .service(routes::markets::list_bettor_bets)
            .service(routes::markets::get_payout)
            .service(routes::markets::list_categories)
            .service(routes::markets::list_simplified_markets)
    })
    .listen(listener)?
    .run()
    .await
}
