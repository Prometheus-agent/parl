/// On-chain category detection for Parl prediction markets.
///
/// Single source of truth — used by both the indexer (on MarketCreated)
/// and the backend API (on manual create). Keywords are ordered by
/// specificity to avoid false positives:
///   politics > crypto > weather > tech > sports > general

/// Auto-detect category from outcomes text.
/// Returns one of: "politics", "crypto", "weather", "technology", "sports", "general"
pub fn detect_category(outcomes: &[String]) -> &'static str {
    let text: String = outcomes.join(" ").to_lowercase();

    // Politics — most specific keywords, check first
    if contains_any(&text, &[
        "president", "election", "vote", "senate", "congress",
        "democrat", "republican", "governor", "mayor",
        "prime minister", "party", "candidate", "ballot",
        "referendum", "impeachment", "inauguration",
    ]) {
        return "politics";
    }

    // Crypto / Blockchain
    if contains_any(&text, &[
        "btc", "bitcoin", "eth", "ethereum", "sol", "solana",
        "crypto", "token", "price", "defi", "nft", "tvl",
        "market cap", "airdrop", "halving", "etf",
        "blockchain", "layer 2", "l2", "rollup", "wallet",
        "avax", "avalanche", "fuji",
    ]) {
        return "crypto";
    }

    // Weather / Climate
    if contains_any(&text, &[
        "temperature", "weather", "climate", "hurricane",
        "celsius", "fahrenheit", "degrees", "storm", "rain",
        "snow", "flood", "drought", "earthquake", "tornado",
    ]) {
        return "weather";
    }

    // Tech / AI
    if contains_any(&text, &[
        "gpt", "ai", "artificial intelligence", "openai",
        "google", "apple", "microsoft", "amazon", "tesla",
        "spacex", "launch", "rocket", "satellite",
        "semiconductor", "chip", "processor", "quantum",
        "agi", "llm", "transformer",
    ]) {
        return "technology";
    }

    // Sports — check last since keywords like "win"/"lose"/"draw" are generic
    if contains_any(&text, &[
        "win", "lose", "draw", "team", "match", "tournament",
        "champion", "goal", "score", "nfl", "nba", "nhl",
        "mlb", "ufc", "soccer", "football", "basketball",
        "tennis", "f1", "gp", "race", "driver", "pilot",
        "world cup", "championship", "playoff",
    ]) {
        return "sports";
    }

    "general"
}

fn contains_any(text: &str, keywords: &[&str]) -> bool {
    keywords.iter().any(|k| text.contains(k))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_politics() {
        let o = vec!["Will the president win the election?".to_string()];
        assert_eq!(detect_category(&o), "politics");
    }

    #[test]
    fn test_crypto() {
        let o = vec!["BTC", "ETH"].map(|s| s.to_string());
        assert_eq!(detect_category(&o), "crypto");
    }

    #[test]
    fn test_weather() {
        let o = vec!["Temperature above 30c tomorrow".to_string()];
        assert_eq!(detect_category(&o), "weather");
    }

    #[test]
    fn test_technology() {
        let o = vec!["Will OpenAI release GPT-5 in 2026?".to_string()];
        assert_eq!(detect_category(&o), "technology");
    }

    #[test]
    fn test_sports() {
        let o = vec!["Will Liverpool win the match?".to_string()];
        assert_eq!(detect_category(&o), "sports");
    }

    #[test]
    fn test_general() {
        let o = vec!["Something completely random".to_string()];
        assert_eq!(detect_category(&o), "general");
    }
}
