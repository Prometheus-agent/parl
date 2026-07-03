"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState, useCallback } from "react";
import CreateMarketModal from "@/lib/create-market";

// ─── Types ───
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

// ─── Constants ───
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

const SAMPLE_MARKETS = [
  {
    id: "sample-1",
    market_id_hex: "0x",
    question: "Will AVAX reach $50 by end of 2026?",
    outcomes: ["Yes", "No"],
    status: "active",
    category: "crypto",
    total_pool_avax: "0.0000",
    volume_avax: "0.0000",
    fee_basis_points: 200,
    probabilities: [50, 50],
    created_at: "",
    resolved_at: null,
  },
] as SimplifiedMarket[];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// ─── Component ───
export default function AppPage() {
  const { address, chainId } = useWallet();
  const [markets, setMarkets] = useState<SimplifiedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchMarkets = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_BASE || "";
      const url = category === "all"
        ? `${baseUrl}/api/simplified-markets`
        : `${baseUrl}/api/simplified-markets?category=${category}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to fetch markets");
      const data = await r.json();
      const parsed = Array.isArray(data) ? data : [];
      setMarkets(parsed);
      // Show welcome guide when no markets exist
      if (parsed.length === 0) setShowWelcomeGuide(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets("all");
  }, [fetchMarkets]);

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

  // Use sample markets for preview when empty
  const displayMarkets = filtered.length > 0 ? filtered : (searchQuery ? [] : SAMPLE_MARKETS);
  const isEmpty = !loading && filtered.length === 0 && !searchQuery;
  const isSearchEmpty = !loading && searchQuery && filtered.length === 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ─── NAV ─── */}
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
            <div className="px-4 py-3 text-sm text-white/60"><WalletButton /></div>
          </div>
        </details>
      </nav>

      {/* ─── MAIN ─── */}
      <main className="pt-20 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-heading font-bold text-white">Prediction Markets</h1>
              <p className="text-xs text-white/40 mt-1 font-body">
                {markets.length > 0
                  ? `${markets.length} active market${markets.length !== 1 ? "s" : ""} on Avalanche Fuji`
                  : "Be the first to create a market"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                title={viewMode === "list" ? "Grid view" : "List view"}
              >
                {viewMode === "list" ? (
                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-xs font-medium text-white transition-all border border-purple-500/30 active:scale-95 duration-150"
              >
                + Create Market
              </button>
              <span className="text-xs text-white/30">{markets.length}</span>
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

          {/* Search + Categories row */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search markets, topics, or outcomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
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
            <div className="space-y-2 animate-fade-in">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <div className="animate-pulse">
                    <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-3" />
                    <div className="h-3 w-2/3 bg-white/[0.04] rounded mb-2" />
                    <div className="flex gap-2">
                      <div className="h-2 flex-1 bg-white/[0.04] rounded" />
                      <div className="h-3 w-12 bg-white/[0.04] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── WELCOME GUIDE (empty state) ─── */}
          {!loading && isEmpty && !showWelcomeGuide && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🏗️</span>
              </div>
              <h2 className="text-lg font-heading font-semibold text-white mb-2">No Markets Yet</h2>
              <p className="text-sm text-white/40 mb-8 max-w-sm mx-auto font-body">
                Prediction markets start with a question. Create the first one and invite others to participate.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-95"
                >
                  + Create Your First Market
                </button>
                <button
                  onClick={() => setShowWelcomeGuide(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white/70 hover:text-white transition-all"
                >
                  How It Works
                </button>
              </div>
            </div>
          )}

          {/* ─── WELCOME GUIDE (expanded guide) ─── */}
          {!loading && showWelcomeGuide && (
            <div className="mb-8 animate-fade-in">
              <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-purple-500/[0.03] border border-white/[0.06] p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-base font-heading font-semibold text-white">Welcome to Parl Markets</h2>
                    <p className="text-xs text-white/40 mt-1 font-body">Get started in 3 simple steps</p>
                  </div>
                  <button
                    onClick={() => setShowWelcomeGuide(false)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06]"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      step: "01",
                      icon: "📝",
                      title: "Create a Market",
                      desc: "Define a question with 2+ outcomes. Set your fee and resolver. Anyone can launch — no permission needed.",
                      action: "Create Market",
                      onClick: () => setShowCreateModal(true),
                    },
                    {
                      step: "02",
                      icon: "💎",
                      title: "Bettors Predict",
                      desc: "Participants put AVAX on their chosen outcome. Probabilities shift naturally with demand — pure parimutuel math.",
                      action: "Connect Wallet",
                      onClick: address ? undefined : () => {},
                    },
                    {
                      step: "03",
                      icon: "🏆",
                      title: "Resolve & Claim",
                      desc: "Oracle settles the market. Winners split the pool proportionally minus protocol fee. No slippage, no AMM.",
                      action: "Learn More",
                      onClick: () => window.open("/docs", "_self"),
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.06] transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[10px] font-mono text-white/20">0{item.step}</span>
                      </div>
                      <h3 className="text-sm font-heading font-medium text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed mb-3 font-body">{item.desc}</p>
                      {item.action && item.onClick && (
                        <button
                          onClick={item.onClick}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                        >
                          {item.action} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick-create bar */}
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <span className="text-sm">🚀</span>
                      </div>
                      <div>
                        <p className="text-sm font-heading font-medium text-white">Launch your first market</p>
                        <p className="text-xs text-white/40">Cost: 0.01 AVAX creation fee</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all active:scale-95 flex-shrink-0"
                    >
                      + Create Market
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SEARCH EMPTY ─── */}
          {!loading && isSearchEmpty && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-12 text-center animate-fade-in">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm text-white/40 font-body">
                No markets match "<span className="text-white/60">{searchQuery}</span>"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {/* ─── MARKET LIST ─── */}
          {!loading && !isEmpty && displayMarkets.length > 0 && (
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-3" : "space-y-2"}>
              {displayMarkets.map((m, idx) => {
                const statusStyle = STATUS_STYLES[m.status] || STATUS_STYLES.active;
                const catStyle = CATEGORY_BADGES[m.category || "general"] || CATEGORY_BADGES.general;
                const poolNum = parseFloat(m.total_pool_avax);
                const volNum = parseFloat(m.volume_avax);
                const isSample = m.id.startsWith("sample-");

                const cardContent = (
                  <div className={`rounded-xl border p-5 transition-all duration-250 group ${
                    isSample
                      ? "bg-purple-500/[0.03] border-purple-500/10 hover:bg-purple-500/[0.06] hover:border-purple-500/20"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
                  }`}>
                    {isSample && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-medium">
                          <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                          Preview
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium capitalize ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                            {m.category || "General"}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusStyle.label}
                          </span>
                          <span className="text-[10px] text-white/20 font-mono">
                            {m.fee_basis_points / 100}% fee
                          </span>
                        </div>

                        <h3 className={`text-sm font-heading font-medium leading-snug transition-colors duration-150 ${
                          isSample ? "text-purple-200/80" : "text-white group-hover:text-purple-300"
                        }`}>
                          {m.question}
                        </h3>

                        {/* Outcome bars */}
                        <div className="mt-3 space-y-1.5">
                          {m.outcomes.slice(0, 3).map((outcome, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-white/40 w-20 truncate flex-shrink-0">{outcome}</span>
                              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-300"
                                  style={{ width: `${Math.max(m.probabilities[idx] || 0, 2)}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/50 w-12 text-right tabular-nums">
                                {(m.probabilities[idx] || 0).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                          {m.outcomes.length > 3 && (
                            <p className="text-[10px] text-white/20">+{m.outcomes.length - 3} more outcomes</p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      {viewMode === "list" && (
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">Pool</div>
                            <div className="text-sm font-semibold text-white tabular-nums">
                              {poolNum > 0 ? poolNum.toFixed(4) : "0"} <span className="text-xs text-white/40">AVAX</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">Volume</div>
                            <div className="text-xs text-white/50">
                              {volNum > 0 ? volNum.toFixed(4) : "—"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {viewMode === "grid" && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Pool</span>
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {poolNum > 0 ? poolNum.toFixed(4) : "0"} <span className="text-[11px] text-white/40">AVAX</span>
                        </span>
                      </div>
                    )}
                  </div>
                );

                if (isSample) {
                  return (
                    <div key={m.id} className="opacity-80">
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={m.id}
                    href={`/app/${m.market_id_hex}`}
                    className="block"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          )}

          {/* ─── CONNECT CTA ─── */}
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

          {/* ─── FOOTER ─── */}
          <div className="mt-16 pt-6 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/20">
            <span>Parl Protocol</span>
            <a
              href="https://parlmarket.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors"
            >
              parlmarket.xyz
            </a>
          </div>
        </div>
      </main>

      {/* Create Market Modal */}
      <CreateMarketModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowWelcomeGuide(false);
          fetchMarkets(activeCategory);
        }}
      />
    </div>
  );
}
