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

    tracing::info!(
        "BetPlaced: market_id=0x{} bettor=0x{} outcome={} amount={}",
        hex::encode(ev.market_id),
        hex::encode(ev.bettor),
        ev.outcome,
        ev.amount
    );
}
