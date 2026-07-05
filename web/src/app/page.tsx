import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";

const API_BASE = process.env.API_BASE || "http://127.0.0.1:8080";

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

interface FullMarket { id: string; total_pool: string; }
interface CategoryCount { category: string; count: number; }

async function getMarkets(): Promise<SimplifiedMarket[]> {
  try {
    const res = await fetch(`${API_BASE}/api/simplified-markets`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getFullMarkets(): Promise<FullMarket[]> {
  try {
    const res = await fetch(`${API_BASE}/api/markets`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getCategories(): Promise<CategoryCount[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

function computeStats(markets: SimplifiedMarket[], fullMarkets: FullMarket[]) {
  const total = markets.length;
  const totalVolumeWei = fullMarkets.reduce((sum, m) => sum + BigInt(m.total_pool || "0"), BigInt(0));
  return { total, totalVolume: Number(totalVolumeWei) / 1e18 };
}

const CAT_STYLE: Record<string, string> = {
  sports: "border-green-800 text-green-400/80",
  crypto: "border-amber-800 text-amber-400/80",
  politics: "border-rose-800 text-rose-400/80",
  weather: "border-cyan-800 text-cyan-400/80",
  tech: "border-violet-800 text-violet-400/80",
  general: "border-neutral-700 text-neutral-500",
};

export default async function HomePage() {
  const [markets, categories, fullMarkets] = await Promise.all([getMarkets(), getCategories(), getFullMarkets()]);
  const stats = computeStats(markets, fullMarkets);
  const trending = [...markets].sort((a, b) => parseFloat(b.volume_avax || "0") - parseFloat(a.volume_avax || "0")).slice(0, 3);
  const activeCats = categories.filter(c => c.count > 0).map(c => c.category);
  const displayCats = ["sports", "crypto", "politics", "weather", "tech", "general"].filter(c => activeCats.includes(c) || c === "general");

  return (
    <>
      {/* Nav */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between gap-2">
          <Link href="/" className="font-semibold text-sm tracking-wider text-white shrink-0">PARL</Link>
          <div className="flex items-center gap-4 sm:gap-6 text-sm flex-wrap justify-end">
            <Link href="/app" className="text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:inline">markets</Link>
            <Link href="/dashboard" className="text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:inline">dashboard</Link>
            <Link href="/docs" className="text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:inline">docs</Link>
            <Link href="/whitepaper" className="text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:inline">whitepaper</Link>
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-5 pt-20 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-600 mb-4 tracking-wide border border-neutral-800 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            DEPLOYED ON AVALANCHE FUJI
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15] text-balance">
            Prediction Markets, Parimutuel
          </h1>
          <p className="mt-4 text-sm text-neutral-500 max-w-lg leading-relaxed">
            Parl is a parimutuel protocol for prediction markets — no liquidity providers, no orderbooks, no AMM curves. Just pools, probabilities, and payouts.
          </p>
          <div className="mt-7 flex items-center gap-4">
            <Link href="/app" className="text-sm px-5 py-2 border border-neutral-700 rounded-full hover:bg-neutral-900 transition-colors text-neutral-300">Explore Markets</Link>
            <Link href="/docs" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-400 transition-colors">Documentation →</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { val: String(stats.total), label: "markets" },
            { val: stats.totalVolume.toFixed(2), label: "avax volume" },
            { val: "—", label: "bettors" },
            { val: "1-5%", label: "protocol fee" },
          ].map(s => (
            <div key={s.label} className="border border-neutral-800 rounded-lg p-4">
              <div className="text-xl tabular-nums text-white font-medium">{s.val}</div>
              <div className="text-xs text-neutral-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {displayCats.length > 0 && (
        <div className="border-t border-neutral-800">
          <div className="max-w-6xl mx-auto px-5 py-6">
            <div className="text-xs text-neutral-600 tracking-wide mb-3">CATEGORIES</div>
            <div className="flex flex-wrap gap-2">
              {displayCats.map(c => {
                const count = categories.find(cat => cat.category === c)?.count || 0;
                return (
                  <Link key={c} href="/app"
                    className={`text-xs px-2.5 py-1 border rounded-full ${CAT_STYLE[c] || CAT_STYLE.general}`}
                  >{c}{count > 0 ? ` (${count})` : ""}</Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Markets */}
      {trending.length > 0 && (
        <div className="border-t border-neutral-800">
          <div className="max-w-6xl mx-auto px-5 py-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs text-neutral-600 tracking-wide">MARKETS</h2>
              <Link href="/app" className="text-xs text-neutral-600 underline underline-offset-4 hover:text-neutral-400">all markets →</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {trending.map(m => (
                <Link key={m.id} href={`/app/${m.id}`}
                  className="border border-neutral-800 rounded-lg p-4 card-hover block"
                >
                  <div className="flex items-center gap-2 mb-2.5 text-xs">
                    <span className={`text-xs px-2 py-0.5 border rounded-full ${CAT_STYLE[m.category] || CAT_STYLE.general}`}>{m.category || "general"}</span>
                    <span className={m.status === "active" ? "text-green-500/80" : "text-neutral-600"}>{m.status}</span>
                  </div>
                  <h3 className="text-sm text-neutral-200 font-medium leading-snug mb-3">{m.question}</h3>
                  {m.probabilities && m.probabilities.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {m.outcomes.slice(0, 2).map((o, i) => {
                        const p = m.probabilities[i] || 0;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-neutral-600 w-14 truncate shrink-0">{o}</span>
                            <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                              <div className="h-full bg-neutral-500 rounded-full" style={{ width: `${Math.max(p, 2)}%` }} />
                            </div>
                            <span className="text-neutral-600 w-8 text-right tabular-nums">{p.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                      {m.outcomes.length > 2 && <p className="text-xs text-neutral-700">+{m.outcomes.length - 2} more</p>}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-neutral-700 pt-1 border-t border-neutral-800/60">
                    <span>pool: {m.total_pool_avax} avax</span>
                    <span>vol: {m.volume_avax} avax</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <h2 className="text-xs text-neutral-600 tracking-wide mb-5">HOW IT WORKS</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { step: "01", title: "Create", desc: "Define outcomes, set fee & resolver. Anyone can launch a market." },
              { step: "02", title: "Pool", desc: "Bettors put AVAX in. Probabilities emerge from where money flows." },
              { step: "03", title: "Resolve", desc: "Oracle resolves. Winners split the pool minus protocol fee." },
            ].map(item => (
              <div key={item.step} className="border border-neutral-800 rounded-lg p-5">
                <span className="text-xs text-neutral-700 font-mono">{item.step}</span>
                <h3 className="text-sm font-medium text-white mt-1 mb-1.5">{item.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 py-12 text-center">
          <h2 className="text-base font-medium text-white mb-2">Build on Parl</h2>
          <p className="text-xs text-neutral-600 mb-5 max-w-md mx-auto leading-relaxed">Integrate prediction markets into your platform with Parl's smart contracts and API.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/docs" className="text-sm px-4 py-1.5 border border-neutral-700 rounded-full hover:bg-neutral-900 transition-colors text-neutral-300">Documentation</Link>
            <Link href="/whitepaper" className="text-sm px-4 py-1.5 border border-neutral-700 rounded-full hover:bg-neutral-900 transition-colors text-neutral-300">Whitepaper</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-10 flex items-center text-xs text-neutral-700">
          <span>Parl Protocol — {new Date().getFullYear()}</span>
        </div>
      </div>
    </>
  );
}
