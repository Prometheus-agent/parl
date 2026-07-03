"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import CreateMarketModal from "@/lib/create-market";

// ─── Types ───
type Market = {
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

const CATEGORIES = [
  "all", "sports", "crypto", "politics", "weather", "tech", "general",
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  all: "All", sports: "Sports", crypto: "Crypto",
  politics: "Politics", weather: "Weather", tech: "Tech", general: "General",
};

const STATUS_CFG: Record<string, string> = {
  active: "text-green-500",
  resolved: "text-blue-500",
  canceled: "text-neutral-600",
};

const CAT_COLORS: Record<string, string> = {
  sports: "bg-green-500/15 text-green-400",
  crypto: "bg-amber-500/15 text-amber-400",
  politics: "bg-rose-500/15 text-rose-400",
  weather: "bg-cyan-500/15 text-cyan-400",
  tech: "bg-violet-500/15 text-violet-400",
  general: "bg-neutral-500/15 text-neutral-400",
};

export default function MarketsPage() {
  const { address, chainId } = useWallet();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadMarkets = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const q = category === "all" ? "" : `?category=${category}`;
      const res = await window.fetch(`/api/simplified-markets${q}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMarkets(Array.isArray(data) ? data : []);
    } catch {
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMarkets("all"); }, [loadMarkets]);

  const results = search
    ? markets.filter((m) =>
        m.question.toLowerCase().includes(search.toLowerCase()) ||
        m.outcomes.some((o) => o.toLowerCase().includes(search.toLowerCase()))
      )
    : markets;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* ─── Top Bar ─── */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">PARL</Link>
            <span className="text-neutral-600 text-sm">/</span>
            <span className="text-sm text-neutral-400">markets</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {address && (
              <span className="text-neutral-500 font-mono text-xs">
                {address.slice(0, 5)}…{address.slice(-3)}
                {chainId === 43113 && <span className="text-green-500 ml-1.5">●</span>}
              </span>
            )}
            <Link href="/dashboard" className="text-neutral-500 hover:text-white transition-colors">dashboard</Link>
            <Link href="/docs" className="text-neutral-500 hover:text-white transition-colors">docs</Link>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Markets</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {loading ? "loading…" : `${markets.length} market${markets.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-sm px-3.5 py-1.5 border border-neutral-700 rounded-md hover:bg-neutral-900 transition-colors text-neutral-300"
          >
            + Create
          </button>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <input
            type="text"
            placeholder="search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-600 transition-colors"
          />
          <nav className="flex items-center gap-1 text-sm">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setSearch(""); loadMarkets(c); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  cat === c ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-1.5">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-neutral-900/50 rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && results.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-600">
              {search ? `no markets matching "${search}"` : "no markets yet"}
            </p>
            {!search && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-300 transition-colors"
              >
                create the first one
              </button>
            )}
          </div>
        )}

        {/* Market list — compact table */}
        {!loading && results.length > 0 && (
          <div className="space-y-1.5">
            {results.map((m) => {
              const pool = parseFloat(m.total_pool_avax);
              const color = CAT_COLORS[m.category || "general"] || CAT_COLORS.general;
              return (
                <Link
                  key={m.id}
                  href={`/app/${m.market_id_hex}`}
                  className="block border border-neutral-800 rounded-md px-4 py-3 hover:bg-neutral-900/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${color}`}>
                          {m.category || "general"}
                        </span>
                        <span className={`text-[11px] ${STATUS_CFG[m.status] || "text-neutral-500"}`}>
                          {m.status}
                        </span>
                        {pool === 0 && (
                          <span className="text-[11px] text-neutral-600">empty pool</span>
                        )}
                      </div>
                      <h2 className="text-sm font-medium text-neutral-200 leading-snug">
                        {m.question}
                      </h2>
                    </div>

                    {/* Probability bars — compact */}
                    <div className="flex-shrink-0 w-48">
                      {m.outcomes.slice(0, 2).map((o, i) => {
                        const pct = m.probabilities[i] || 0;
                        return (
                          <div key={i} className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-neutral-500 w-16 truncate text-right">{o}</span>
                            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-500 rounded-full"
                                style={{ width: `${Math.max(pct, 1)}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500 w-9 text-right tabular-nums">{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                      {m.outcomes.length > 2 && (
                        <p className="text-[11px] text-neutral-600 text-right mt-0.5">+{m.outcomes.length - 2}</p>
                      )}
                    </div>

                    {/* Pool */}
                    <div className="text-right flex-shrink-0 w-20">
                      <p className="text-xs text-neutral-500">pool</p>
                      <p className="text-sm tabular-nums text-neutral-300">
                        {pool > 0 ? pool.toFixed(3) : "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateMarketModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); loadMarkets(cat); }}
      />
    </div>
  );
}
