import Link from "next/link";

const API_BASE = process.env.API_BASE || "http://127.0.0.1:8080";

const navigation = [
  { name: "Markets", href: "/app" },
  { name: "Docs", href: "/docs" },
  { name: "Whitepaper", href: "/whitepaper" },
];

interface SimplifiedMarket {
  id: string;
  market_id_hex: string;
  question: string;
  outcomes: string[];
  status: string;
  category: string;
  total_pool_avax: string;
  volume_avax: string;
  probabilities: number[];
  created_at: string;
}

interface FullMarket {
  id: string;
  total_pool: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

async function getMarkets(): Promise<SimplifiedMarket[]> {
  try {
    const res = await fetch(`${API_BASE}/api/simplified-markets`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getFullMarkets(): Promise<FullMarket[]> {
  try {
    const res = await fetch(`${API_BASE}/api/markets`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCategories(): Promise<CategoryCount[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function computeStats(markets: SimplifiedMarket[], fullMarkets: FullMarket[]) {
  const total = markets.length;
  // Use total_pool from full markets API for accurate volume (in wei)
  const totalVolumeWei = fullMarkets.reduce((sum, m) => sum + BigInt(m.total_pool || "0"), BigInt(0));
  const totalVolumeAvax = Number(totalVolumeWei) / 1e18;
  return { total, totalVolume: totalVolumeAvax };
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    sports: "⚽",
    crypto: "₿",
    politics: "🏛️",
    weather: "🌤️",
    technology: "💻",
  };
  return icons[cat] || "🎯";
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    sports: "from-emerald-500/20 to-emerald-600/10",
    crypto: "from-amber-500/20 to-amber-600/10",
    politics: "from-rose-500/20 to-rose-600/10",
    weather: "from-cyan-500/20 to-cyan-600/10",
    technology: "from-violet-500/20 to-violet-600/10",
  };
  return colors[cat] || "from-white/[0.06] to-white/[0.02]";
}

function getCategoryBadgeColor(cat: string): string {
  const colors: Record<string, string> = {
    sports: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    crypto: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    politics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    weather: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    technology: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return colors[cat] || "bg-white/[0.06] text-white/40 border-white/[0.1]";
}

function truncateQuestion(q: string): string {
  // "Party A wins election | Party B wins election" -> "Party A wins election"
  return q.split(" | ")[0] || q;
}

export default async function HomePage() {
  const [markets, categories, fullMarkets] = await Promise.all([getMarkets(), getCategories(), getFullMarkets()]);
  const stats = computeStats(markets, fullMarkets);

  // Pick up to 3 markets for trending, preferring ones with pool > 0
  const trending = [...markets]
    .sort((a, b) => parseFloat(b.volume_avax || "0") - parseFloat(a.volume_avax || "0"))
    .slice(0, 3);

  // Build category list from API + fallback static
  const categoryMap: Record<string, { icon: string; desc: string; color: string }> = {
    sports: { icon: "⚽", desc: "NFL, NBA, UFC & more", color: "from-emerald-500/20 to-emerald-600/10" },
    crypto: { icon: "₿", desc: "BTC, ETH, DeFi, NFTs", color: "from-amber-500/20 to-amber-600/10" },
    politics: { icon: "🏛️", desc: "Elections & policy", color: "from-rose-500/20 to-rose-600/10" },
    weather: { icon: "🌤️", desc: "Temp, storms, climate", color: "from-cyan-500/20 to-cyan-600/10" },
    technology: { icon: "💻", desc: "AI, space, launches", color: "from-violet-500/20 to-violet-600/10" },
    general: { icon: "🎯", desc: "Everything else", color: "from-white/[0.06] to-white/[0.02]" },
  };

  // Show categories that have markets, plus general always
  const activeCategories = categories
    .filter((c) => c.count > 0)
    .map((c) => c.category);
  const displayCategories = ["sports", "crypto", "politics", "weather", "technology", "general"]
    .filter((c) => activeCategories.includes(c) || c === "general");

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-250">
              P
            </div>
            <span className="font-heading text-base font-semibold tracking-tight text-white">
              Parl
            </span>
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors duration-150">
              Dashboard
            </Link>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {item.name}
              </Link>
            ))}
          </div>
          {/* Mobile hamburger */}
          <details className="md:hidden group">
            <summary className="list-none flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] cursor-pointer hover:bg-white/[0.1] transition-colors">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute top-full right-4 mt-2 w-48 rounded-xl bg-black/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
              <Link href="/dashboard" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">
                Dashboard
              </Link>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-8 tracking-wide">
            ✦ Deployed on Avalanche Fuji
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight leading-[0.98]">
            Prediction Markets,
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Based on Pools
            </span>
          </h1>
          <p className="mt-5 text-lg text-white/45 max-w-2xl mx-auto leading-relaxed font-body">
            Parl is a parimutuel protocol for prediction markets — no liquidity providers,
            no orderbooks, no AMM curves. Just pools, probabilities, and payouts.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-lg mx-auto">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Link href="/app">
                <input
                  type="text"
                  placeholder="Search markets, addresses, or topics..."
                  className="w-full h-11 pl-11 pr-14 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all duration-250 cursor-pointer"
                  readOnly
                />
              </Link>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white/[0.06] text-[11px] text-white/25 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/app"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all duration-250 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
            >
              Explore Markets →
            </Link>
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white/80 hover:text-white transition-all duration-250"
            >
              Documentation
            </Link>
          </div>

          {/* Stats row — dynamic from API */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-xl font-heading font-semibold text-white">{stats.total}</div>
              <div className="text-xs text-white/35 mt-0.5">Total Markets</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-xl font-heading font-semibold text-white">{stats.totalVolume.toFixed(4)} AVAX</div>
              <div className="text-xs text-white/35 mt-0.5">Total Volume</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-xl font-heading font-semibold text-white">{markets.length ? "—" : "0"}</div>
              <div className="text-xs text-white/35 mt-0.5">Unique Bettors</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-xl font-heading font-semibold text-white">1–5%</div>
              <div className="text-xs text-white/35 mt-0.5">Protocol Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories section — dynamic from API */}
      <section className="pb-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold text-white">
              Browse by Category
            </h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {displayCategories.map((catKey) => {
              const cat = categoryMap[catKey] || categoryMap.general!;
              const count = categories.find((c) => c.category === catKey)?.count || 0;
              return (
                <Link
                  key={catKey}
                  href={`/app`}
                  className={`rounded-xl bg-gradient-to-br ${cat.color} border border-white/[0.06] p-4 hover:border-white/[0.15] transition-all text-center group relative`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-heading font-medium text-white capitalize">{catKey}</div>
                  <div className="text-[11px] text-white/30 mt-0.5">{cat.desc}</div>
                  {count > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-mono">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Markets — dynamic from API */}
      {markets.length > 0 && (
        <section className="pb-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-heading font-semibold text-white">
                Trending Markets
              </h2>
              <Link
                href="/app"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-150"
              >
                View all →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {trending.map((market) => (
                <Link
                  key={market.id}
                  href={`/app/${market.id}`}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-250 group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getCategoryBadgeColor(market.category)}`}>
                      {market.status === "active" ? "Open" : market.status}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-white/[0.03] text-white/30 border-white/[0.06]">
                      {market.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-heading font-medium text-white leading-snug mb-3 group-hover:text-purple-300 transition-colors duration-150">
                    {truncateQuestion(market.question)}
                  </h3>
                  {market.probabilities && market.probabilities.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {market.outcomes.map((outcome, idx) => {
                        const prob = market.probabilities[idx] || 0;
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs text-white/40 w-16 truncate flex-shrink-0">{outcome}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                                style={{ width: `${Math.max(prob, 2)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-white/40 w-12 text-right tabular-nums">{prob.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>Pool: {market.total_pool_avax} AVAX</span>
                    <span>Vol: {market.volume_avax} AVAX</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
              ?
            </div>
            <h2 className="text-lg font-heading font-semibold text-white">
              How Parl Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Create", desc: "Define outcomes, set fee & resolver. Anyone can launch a market — sports, crypto, politics, weather." },
              { step: "02", title: "Pool", desc: "Bettors put AVAX in. Probabilities emerge naturally from where money flows — pure parimutuel math." },
              { step: "03", title: "Resolve", desc: "Oracle resolves the market. Winners split the pool minus protocol fee. No slippage, no AMM." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] transition-all duration-250">
                <span className="text-xs font-mono text-white/20">{item.step}</span>
                <h3 className="text-sm font-heading font-semibold text-white mt-2 mb-1">{item.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs text-white/30 mb-3 uppercase tracking-[0.15em] font-medium">
            Infrastructure Layer
          </p>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">
            Build on Parl
          </h2>
          <p className="text-sm text-white/40 mb-8 max-w-md mx-auto font-body">
            Parl is a protocol layer — not an app. Integrate prediction markets
            into your platform with our smart contracts and API.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/docs" className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white/80 hover:text-white transition-all duration-250">
              Documentation
            </Link>
            <Link href="/whitepaper" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all duration-250 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30">
              Whitepaper
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-white/25">
          <span>Parl Protocol — {new Date().getFullYear()}</span>
          <span></span>
        </div>
      </footer>
    </>
  );
}
