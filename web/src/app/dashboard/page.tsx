"use client";

import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";

function weiToAvax(wei: string): string {
  const avax = Number(BigInt(wei || "0")) / 1e18;
  return avax.toFixed(4);
}

type UserBet = {
  id: string;
  market_id?: string;
  outcome_index?: number;
  amount: string;
  claimed: boolean;
  created_at?: string;
  market_description?: string;
  market_outcomes?: string[];
  market_status?: string;
};

export default function DashboardPage() {
  const { address } = useWallet();
  const [bets, setBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    fetch(`/api/bets?bettor=${address}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch bets");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setBets(data);
        else setBets([]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  const stats = bets.reduce(
    (acc, b) => {
      const amt = Number(BigInt(b.amount || "0")) / 1e18;
      return {
        totalBets: acc.totalBets + 1,
        totalVolume: acc.totalVolume + amt,
        wins: acc.wins + (b.market_status === "resolved" && !b.claimed ? 1 : 0),
        losses: acc.losses + (b.market_status === "resolved" && b.claimed ? 1 : 0),
        pending: acc.pending + (b.market_status === "active" ? 1 : 0),
      };
    },
    { totalBets: 0, totalVolume: 0, wins: 0, losses: 0, pending: 0 }
  );

  const winRate = (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0)
    : "—";

  return (
    <div className="min-h-screen">
            {/* Nav */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between gap-2">
          <Link href="/" className="font-semibold text-sm tracking-wider text-white shrink-0">PARL</Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink min-w-0 flex-wrap justify-end">
            <Link href="/app" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline shrink-0">markets</Link>
            <WalletButton />
          </div>
        </div>
      </div>

      <main className="px-5 py-6 max-w-6xl mx-auto">
        {!mounted ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse text-neutral-700">loading...</div>
          </div>
        ) : !address ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-base font-semibold text-white mb-2">Dashboard</h1>
            <p className="text-xs text-neutral-600 mb-6 text-center max-w-sm">
              Connect your wallet to view your prediction history and stats.
            </p>
            <WalletButton />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                  {address.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">Dashboard</h1>
                  <p className="text-xs text-neutral-600 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
                </div>
              </div>
              <Link href="/app" className="text-xs px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-500">
                Browse Markets
              </Link>
            </div>

            {/* Stats row */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-neutral-800 rounded p-4 animate-pulse">
                    <div className="h-5 w-12 bg-neutral-900 rounded mb-2" />
                    <div className="h-3 w-16 bg-neutral-900/50 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "total bets", value: String(stats.totalBets) },
                  { label: "volume", value: `${stats.totalVolume.toFixed(2)} avax` },
                  { label: "win rate", value: `${winRate}%` },
                  { label: "pending", value: String(stats.pending) },
                ].map((s) => (
                  <div key={s.label} className="border border-neutral-800 rounded p-4">
                    <div className="text-lg tabular-nums text-white">{s.value}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Win/Loss bar */}
            {!loading && (stats.wins + stats.losses + stats.pending) > 0 && (
              <div className="border border-neutral-800 rounded p-5 mb-6">
                <h3 className="text-xs text-neutral-600 tracking-wide mb-3">WIN / LOSS</h3>
                <div className="h-3 bg-neutral-800 rounded-full overflow-hidden flex">
                  {stats.wins > 0 && (
                    <div className="bg-green-800" style={{ width: `${(stats.wins / (stats.wins + stats.losses + stats.pending)) * 100}%` }} />
                  )}
                  {stats.losses > 0 && (
                    <div className="bg-red-800" style={{ width: `${(stats.losses / (stats.wins + stats.losses + stats.pending)) * 100}%` }} />
                  )}
                  {stats.pending > 0 && (
                    <div className="bg-amber-800" style={{ width: `${(stats.pending / (stats.wins + stats.losses + stats.pending)) * 100}%` }} />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-800" /> wins <span className="text-neutral-500">{stats.wins}</span></span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-800" /> losses <span className="text-neutral-500">{stats.losses}</span></span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-800" /> pending <span className="text-neutral-500">{stats.pending}</span></span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border border-red-900 rounded p-4 mb-6">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Bet History */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs text-neutral-600 tracking-wide">BET HISTORY</h2>
              {bets.length > 0 && <span className="text-xs text-neutral-600">{bets.length} bets</span>}
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-neutral-800 rounded p-4 animate-pulse">
                    <div className="h-4 w-3/4 bg-neutral-900 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-neutral-900/50 rounded" />
                  </div>
                ))}
              </div>
            ) : bets.length === 0 ? (
              <div className="border border-neutral-800 rounded p-8 text-center">
                <h3 className="text-sm text-neutral-400 mb-1">no bets yet</h3>
                <p className="text-xs text-neutral-600 mb-4">Your prediction history appears here after your first bet.</p>
                <Link href="/app" className="text-xs px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-500">
                  Explore Markets
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center text-xs text-neutral-700 uppercase tracking-wider px-4 pb-1">
                  <span className="w-[35%]">market</span>
                  <span className="w-[15%] text-right">amount</span>
                  <span className="w-[15%] text-right">outcome</span>
                  <span className="w-[15%] text-right">status</span>
                  <span className="w-[20%] text-right">result</span>
                </div>
                {bets.map((bet, i) => (
                  <div key={bet.id || i} className="border border-neutral-800 rounded p-4 hover:border-neutral-700 transition-colors flex items-center text-xs">
                    <div className="w-[35%]">
                      <div className="text-neutral-300 truncate max-w-[220px]">{bet.market_description || `market ${bet.market_id?.slice(0, 10) || "--"}...`}</div>
                      <div className="text-neutral-700 mt-0.5">
                        {bet.created_at ? new Date(bet.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "--"}
                      </div>
                    </div>
                    <div className="w-[15%] text-right text-neutral-400">{weiToAvax(bet.amount)} avax</div>
                    <div className="w-[15%] text-right">
                      <span className="text-neutral-500">{bet.outcome_index !== undefined ? bet.market_outcomes?.[bet.outcome_index] || `#${bet.outcome_index}` : "--"}</span>
                    </div>
                    <div className="w-[15%] text-right">
                      <span className={`text-xs ${
                        bet.market_status === "active" ? "text-green-500"
                        : bet.market_status === "resolved" ? "text-blue-500"
                        : "text-neutral-600"
                      }`}>{bet.market_status || "unknown"}</span>
                    </div>
                    <div className="w-[20%] text-right">
                      {bet.claimed
                        ? <span className="text-green-500">claimed</span>
                        : bet.market_status === "resolved"
                        ? <span className="text-amber-500">won</span>
                        : <span className="text-neutral-700">--</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
