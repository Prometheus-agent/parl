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

/* ── SVG Donut Chart ── */
function DonutChart({ wins, losses, pending }: { wins: number; losses: number; pending: number }) {
  const total = wins + losses + pending;
  if (total === 0) return null;
  const wPct = (wins / total) * 100;
  const lPct = (losses / total) * 100;
  const pPct = (pending / total) * 100;

  // Build SVG arc segments
  const r = 36;
  const cx = 40;
  const cy = 40;
  const circ = 2 * Math.PI * r;

  const segments = [
    { pct: wPct, color: "#22c55e", label: "Wins" },
    { pct: lPct, color: "#ef4444", label: "Losses" },
    { pct: pPct, color: "#f59e0b", label: "Pending" },
  ];

  let offset = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
      {segments.map((s) => {
        if (s.pct === 0) return null;
        const dash = circ * (s.pct / 100);
        const seg = (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-500"
            style={{ opacity: 0.85 }}
          />
        );
        offset += dash;
        return seg;
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        className="fill-white text-[10px] font-heading font-bold">{total}</text>
    </svg>
  );
}

/* ── SVG Bar Chart ── */
function BarChart({ data, label }: { data: { label: string; value: number; color?: string }[]; label: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barH = 24;
  const gap = 6;
  const h = data.length * (barH + gap) + 10;

  return (
    <svg width="100%" height={h} className="overflow-visible">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const y = i * (barH + gap) + 4;
        return (
          <g key={i}>
            <text x="0" y={y + barH / 2 + 4} textAnchor="start"
              className="fill-white/40 text-[10px] font-body">{d.label}</text>
            <rect x="72" y={y} width={`${Math.max(pct, 2)}%`} height={barH} rx="4"
              fill={d.color || "#8B5CF6"} opacity="0.8" className="transition-all duration-700" />
            <text x={`${Math.max(pct + 1, 8)}%`} y={y + barH / 2 + 4} textAnchor="start"
              className="fill-white/70 text-[10px] font-mono">{d.value.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

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

  // Data for bar chart: bet amounts by market
  const barData = bets.slice(0, 8).map((b) => ({
    label: b.market_outcomes?.[0]?.slice(0, 8) || "Market",
    value: Number(BigInt(b.amount || "0")) / 1e18,
    color: b.market_status === "active" ? "#8B5CF6" : b.claimed ? "#ef4444" : "#22c55e",
  }));

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center justify-between bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-purple-500/20">P</div>
          <span className="text-sm font-heading font-semibold">Parl</span>
          <span className="text-xs text-white/30 ml-1 font-body">/ dashboard</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/app" className="text-xs text-white/40 hover:text-white transition-colors">Markets</Link>
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
            <Link href="/app" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Markets</Link>
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
          {!mounted ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-pulse text-white/20">Loading...</div>
            </div>
          ) : !address ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4">👤</div>
              <h1 className="text-xl font-heading font-bold text-white mb-2">Your Dashboard</h1>
              <p className="text-sm text-white/40 mb-6 text-center max-w-sm font-body">
                Connect your wallet to view your prediction history, stats, and manage positions.
              </p>
              <WalletButton />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20">
                    {address.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-lg font-heading font-bold text-white">Dashboard</h1>
                    <p className="text-xs text-white/40 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
                  </div>
                </div>
                <Link href="/app" className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/80 hover:text-white transition-all">
                  Browse Markets →
                </Link>
              </div>

              {/* Row 1: Stat Cards */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-pulse">
                      <div className="h-5 w-16 bg-white/[0.06] rounded mb-2" />
                      <div className="h-3 w-20 bg-white/[0.04] rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Total Bets", value: String(stats.totalBets), icon: "🎲" },
                    { label: "Volume", value: `${stats.totalVolume.toFixed(2)} AVAX`, icon: "💰" },
                    { label: "Win Rate", value: `${winRate}%`, icon: "🎯" },
                    { label: "Pending", value: String(stats.pending), icon: "⏳" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-lg font-heading font-semibold text-white">{s.value}</div>
                        <span className="text-sm">{s.icon}</span>
                      </div>
                      <div className="text-xs text-white/35">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 2: Charts */}
              {!loading && stats.totalBets > 0 && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Win/Loss Donut */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Win / Loss Breakdown</h3>
                    <div className="flex items-center gap-6">
                      <DonutChart wins={stats.wins} losses={stats.losses} pending={stats.pending} />
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-white/60">Wins</span><span className="text-white font-mono ml-auto">{stats.wins}</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-white/60">Losses</span><span className="text-white font-mono ml-auto">{stats.losses}</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-white/60">Pending</span><span className="text-white font-mono ml-auto">{stats.pending}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Bet Amounts (AVAX)</h3>
                    {barData.length > 0 ? (
                      <BarChart data={barData} label="AVAX" />
                    ) : (
                      <p className="text-xs text-white/20">No bet data</p>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 mb-6">
                  <p className="text-xs text-red-300/80">⚠️ {error}</p>
                </div>
              )}

              {/* Bet History Table */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-heading font-semibold text-white">Bet History</h2>
                {bets.length > 0 && <span className="text-xs text-white/30">{bets.length} bets</span>}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-pulse">
                      <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
                      <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
                    </div>
                  ))}
                </div>
              ) : bets.length === 0 ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
                  <div className="text-2xl mb-3">📭</div>
                  <h3 className="text-sm font-medium text-white mb-1">No bets yet</h3>
                  <p className="text-xs text-white/40 mb-4 font-body">Your prediction history will appear here once you place your first bet.</p>
                  <Link href="/app" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all">Explore Markets</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-white/20 uppercase tracking-wider px-4 pb-2">
                    <span className="w-[40%]">Market</span>
                    <span className="w-[15%] text-right">Amount</span>
                    <span className="w-[15%] text-right">Outcome</span>
                    <span className="w-[15%] text-right">Status</span>
                    <span className="w-[15%] text-right">Result</span>
                  </div>
                  {bets.map((bet, i) => (
                    <div key={bet.id || i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.06] transition-all flex items-center">
                      <div className="w-[40%]">
                        <div className="text-sm text-white truncate max-w-[300px]">{bet.market_description || `Market ${bet.market_id?.slice(0, 10) || "—"}...`}</div>
                        <div className="text-xs text-white/25 mt-0.5">
                          {bet.created_at ? new Date(bet.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </div>
                      </div>
                      <div className="w-[15%] text-right text-sm text-white/70">{weiToAvax(bet.amount)} AVAX</div>
                      <div className="w-[15%] text-right">
                        <span className="text-xs text-white/50">{bet.outcome_index !== undefined ? bet.market_outcomes?.[bet.outcome_index] || `#${bet.outcome_index}` : "—"}</span>
                      </div>
                      <div className="w-[15%] text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          bet.market_status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : bet.market_status === "resolved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-white/[0.04] text-white/30 border-white/[0.06]"
                        }`}>{bet.market_status || "unknown"}</span>
                      </div>
                      <div className="w-[15%] text-right">
                        {bet.claimed ? <span className="text-xs text-emerald-400">✅ Claimed</span>
                        : bet.market_status === "resolved" ? <span className="text-xs text-amber-400">🏆 Won</span>
                        : <span className="text-xs text-white/20">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manager Mode Teaser */}
              <div className="mt-8 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5 border border-purple-500/20 p-6 text-center">
                <div className="text-2xl mb-2">🎮</div>
                <h3 className="text-sm font-heading font-semibold text-white mb-1">Manager Mode — Coming Soon</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto font-body">Prediction streaks, quests, XP levels, and syndicate leaderboards.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
