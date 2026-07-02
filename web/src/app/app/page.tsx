"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";
import CreateMarketModal from "@/lib/create-market";

type SimplifiedMarket = {
  id: string;
  market_id_hex: string;
  question: string;
  outcomes: string[];
  status: string;
  category: string | null;
  total_pool_avax: string;
  volume_avax: string;
  fee_basis_points: number;
  probabilities: number[];
  created_at: string;
  resolved_at: string | null;
};

type CategoryTab = { id: string; label: string; icon: string };

const CATEGORIES: CategoryTab[] = [
  { id: "all", label: "All Markets", icon: "📊" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "weather", label: "Weather", icon: "🌤️" },
  { id: "technology", label: "Tech", icon: "💻" },
  { id: "general", label: "General", icon: "🎯" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    label: "Open",
  },
  resolved: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    label: "Resolved",
  },
  canceled: {
    bg: "bg-white/[0.04]",
    text: "text-white/30",
    border: "border-white/[0.06]",
    label: "Canceled",
  },
};

const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  sports: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  crypto: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  politics: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  weather: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  technology: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  general: { bg: "bg-white/[0.06]", text: "text-white/40", border: "border-white/[0.1]" },
};

export default function AppPage() {
  const { address, chainId } = useWallet();
  const [markets, setMarkets] = useState<SimplifiedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMarkets("all");
  }, []);

  const fetchMarkets = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = category === "all"
        ? "/api/simplified-markets"
        : `/api/simplified-markets?category=${category}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to fetch markets");
      const data = await r.json();
      setMarkets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSearchQuery("");
    fetchMarkets(catId);
  };

  const filtered = searchQuery
    ? markets.filter((m) =>
        m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.outcomes.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : markets;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center justify-between bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center group">
          <Image src="/logo.svg" alt="Parl" width={88} height={22} className="h-[22px] w-auto" priority />
          <span className="text-xs text-white/30 ml-1.5 font-body">/ markets</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white transition-all">Dashboard</Link>
          <Link href="/docs" className="text-xs text-white/40 hover:text-white transition-all">Docs</Link>
          <WalletButton />
        </div>
        {/* Mobile hamburger */}
        <details className="md:hidden group">
          <summary className="list-none flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] cursor-pointer hover:bg-white/[0.1] transition-colors">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute top-full right-4 mt-2 w-48 rounded-xl bg-black/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
            <Link href="/" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Home</Link>
            <Link href="/dashboard" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Dashboard</Link>
            <Link href="/docs" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Docs</Link>
            <Link href="/whitepaper" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Whitepaper</Link>
            <div className="px-4 py-3 text-sm text-white/60 border-b border-white/[0.04]">
              <WalletButton />
            </div>
          </div>
        </details>
      </nav>

      <main className="pt-20 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Polymarket-style header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-heading font-bold text-white">Prediction Markets</h1>
              <p className="text-xs text-white/40 mt-1 font-body">
                Browse, predict, and earn on Avalanche Fuji
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-xs font-medium text-white transition-all border border-purple-500/30"
              >
                + Create Market
              </button>
              <span className="text-xs text-white/30">{markets.length} markets</span>
            </div>
          </div>

          {/* Wallet info bar */}
          {mounted && address && (
            <div className="mb-6 flex items-center gap-3 text-xs">
              <span className="text-white/30">Connected:</span>
              <span className="font-mono text-white/60">{address.slice(0, 6)}...{address.slice(-4)}</span>
              {chainId && chainId !== 43113 && (
                <span className="text-amber-400">⚠ Switch to Fuji (43113) in MetaMask</span>
              )}
              {chainId === 43113 && (
                <span className="text-emerald-400">✓ Fuji</span>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>

          {/* Category tabs — Polymarket style */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-white/[0.1] text-white border border-white/[0.15]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/5 border border-red-500/20 p-4">
              <p className="text-xs text-red-300/80">⚠️ {error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 animate-pulse">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-3 w-20 bg-white/[0.04] rounded" />
                    <div className="h-3 w-16 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-sm text-white/40 font-body">
                {searchQuery ? "No markets match your search." : "No markets yet."}
              </p>
            </div>
          )}

          {/* Market list — Dune/Polymarket table style */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((m) => {
                const statusStyle = STATUS_STYLES[m.status] || STATUS_STYLES.active;
                const catStyle = CATEGORY_BADGES[m.category || "general"] || CATEGORY_BADGES.general;
                const poolNum = parseFloat(m.total_pool_avax);
                const volNum = parseFloat(m.volume_avax);

                return (
                  <Link
                    key={m.id}
                    href={`/app/${m.market_id_hex}`}
                    className="block rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left — question + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border} font-medium capitalize`}>
                            {m.category || "General"}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusStyle.label}
                          </span>
                        </div>

                        <h3 className="text-sm font-heading font-medium text-white leading-snug group-hover:text-purple-300 transition-colors duration-150">
                          {m.question}
                        </h3>

                        {/* Outcome labels + mini progress bars */}
                        <div className="mt-3 space-y-1.5">
                          {m.outcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-white/40 w-20 truncate flex-shrink-0">{outcome}</span>
                              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-300"
                                  style={{
                                    width: `${Math.max(m.probabilities[idx] || 0, 2)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-white/50 w-12 text-right tabular-nums">
                                {(m.probabilities[idx] || 0).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right — stats */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-white/30 uppercase tracking-wider">Pool</div>
                          <div className="text-sm font-semibold text-white tabular-nums">
                            {poolNum > 0 ? poolNum.toFixed(4) : "0"} <span className="text-xs text-white/40">AVAX</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/30 uppercase tracking-wider">Volume</div>
                          <div className="text-xs text-white/50">
                            {volNum > 0 ? volNum.toFixed(4) : "—"} {volNum > 0 ? "AVAX" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Connect CTA */}
          {mounted && !address && (
            <div className="mt-12 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-3xl mb-3">🔗</div>
              <h2 className="text-sm font-heading font-semibold text-white mb-2">Connect to Start Trading</h2>
              <p className="text-xs text-white/40 mb-4 font-body max-w-sm mx-auto">
                Connect your wallet to browse markets, place bets, and claim winnings on Avalanche Fuji.
              </p>
              <WalletButton />
            </div>
          )}
        </div>
      </main>

      {/* Create Market Modal */}
      <CreateMarketModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Refresh markets
          fetchMarkets(activeCategory);
        }}
      />
    </div>
  );
}
