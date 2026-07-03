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

const CAT_LABEL: Record<string, string> = {
  all: "All", sports: "Sports", crypto: "Crypto",
  politics: "Politics", weather: "Weather", tech: "Tech", general: "General",
};

const CAT_BADGE: Record<string, string> = {
  sports: "border-green-800 text-green-400",
  crypto: "border-amber-800 text-amber-400",
  politics: "border-rose-800 text-rose-400",
  weather: "border-cyan-800 text-cyan-400",
  tech: "border-violet-800 text-violet-400",
  general: "border-neutral-700 text-neutral-400",
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
    <div className="min-h-screen bg-black text-white">
      {/* ─── Nav ─── */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-sm tracking-wider">PARL</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-sm text-neutral-500">markets</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {address && (
              <span className="text-neutral-600 font-mono text-xs hidden sm:inline">
                {address.slice(0,5)}…{address.slice(-3)}
                {chainId === 43113 && <span className="text-green-500 ml-1.5">●</span>}
              </span>
            )}
            <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline">dashboard</Link>
            <Link href="/docs" className="text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline">docs</Link>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Markets</h1>
            {!loading && (
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                {markets.length > 0
                  ? `${markets.length} market${markets.length > 1 ? "s" : ""} on Fuji`
                  : "no markets yet — create the first one"}
              </p>
            )}
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-sm px-3 sm:px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-300"
          >
            + Create
          </button>
        </div>

        {/* ─── Search + Filters ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-7">
          <input
            type="text"
            placeholder="search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 h-9 px-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-700 outline-none focus:border-neutral-600 transition-colors"
          />
          <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setSearch(""); loadMarkets(c); }}
                className={`whitespace-nowrap px-2.5 py-1 rounded transition-colors ${
                  cat === c
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="h-16 bg-neutral-900/30 rounded animate-pulse" />
            ))}
          </div>
        )}

        {/* ─── Empty ─── */}
        {!loading && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-600 text-sm mb-3">
              {search ? `nothing for "${search}"` : "zero markets"}
            </p>
            {!search && (
              <button
                onClick={() => setCreateOpen(true)}
                className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-300 transition-colors"
              >
                make one
              </button>
            )}
          </div>
        )}

        {/* ─── Market List ─── */}
        {!loading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((m) => {
              const poolNum = parseFloat(m.total_pool_avax);
              const catColor = CAT_BADGE[m.category || "general"] || CAT_BADGE.general;
              return (
                <Link
                  key={m.id}
                  href={`/app/${m.market_id_hex}`}
                  className="block border border-neutral-800 rounded px-5 py-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[12px] px-2 py-0.5 border rounded ${catColor}`}>
                          {m.category || "general"}
                        </span>
                        <span className={`text-[12px] ${m.status === "active" ? "text-green-500" : m.status === "resolved" ? "text-blue-500" : "text-neutral-600"}`}>
                          {m.status}
                        </span>
                      </div>
                      {/* Question */}
                      <h2 className="text-sm text-neutral-200 font-medium leading-snug">
                        {m.question}
                      </h2>
                    </div>

                    {/* Outcomes & odds + Pool — row on mobile too */}
                    <div className="flex items-start justify-between sm:justify-end gap-4 sm:gap-6">
                      <div className="flex-shrink-0 w-40 sm:w-48">
                        {m.outcomes.slice(0, 2).map((o, i) => {
                          const p = m.probabilities[i] || 0;
                          return (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-neutral-600 w-14 sm:w-16 truncate text-right hidden sm:block">{o}</span>
                              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-neutral-500 rounded-full" style={{ width: `${Math.max(p, 2)}%` }} />
                              </div>
                              <span className="text-xs text-neutral-500 w-9 text-right tabular-nums">{p.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                        {m.outcomes.length > 2 && (
                          <p className="text-xs text-neutral-700 text-right">+{m.outcomes.length - 2}</p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0 w-16 sm:w-20">
                        <p className="text-xs text-neutral-700">pool</p>
                        <p className="text-sm tabular-nums text-neutral-400">
                          {poolNum > 0 ? poolNum.toFixed(3) : "—"}
                        </p>
                      </div>
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
