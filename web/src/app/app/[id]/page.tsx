"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";

const POOL_ENGINE = "0x895f8610Ff8c853541a74fC39c11c657FA920Ff8";

// 4-byte function selectors (computed from keccak256 of signature)
const SELECTORS = {
  getUserBet: "0x44e39303",
  calculatePayout: "0x39a6f8a6",
  placeBet: "0xf3118d8e",
  claim: "0xbd66528a",
};

function padHex(val: string): string {
  return val.replace("0x", "").padStart(64, "0");
}

function encodeAddress(addr: string): string {
  return padHex(addr.toLowerCase());
}

function encodeUint256(val: number | bigint): string {
  return BigInt(val).toString(16).padStart(64, "0");
}

async function ethCall(to: string, data: string): Promise<string> {
  return window.ethereum!.request({
    method: "eth_call",
    params: [{ to, data }, "latest"],
  }) as Promise<string>;
}

async function getUserBet(marketId: string, userAddr: string) {
  try {
    const data = SELECTORS.getUserBet + encodeBytes32(marketId) + encodeAddress(userAddr);
    const hex = await ethCall(POOL_ENGINE, data);
    if (!hex || hex === "0x") return null;
    const outcome = BigInt("0x" + hex.slice(2, 66));
    const amount = BigInt("0x" + hex.slice(66, 130));
    const claimed = BigInt("0x" + hex.slice(130, 194)) > BigInt(0);
    return { outcome, amount, claimed };
  } catch { return null; }
}

async function calculatePayout(marketId: string, userAddr: string) {
  try {
    const data = SELECTORS.calculatePayout + encodeBytes32(marketId) + encodeAddress(userAddr);
    const hex = await ethCall(POOL_ENGINE, data);
    if (!hex || hex === "0x") return null;
    return BigInt("0x" + hex.slice(2));
  } catch { return null; }
}

function encodeBytes32(val: string): string {
  return padHex(val);
}

async function sendTx(from: string, to: string, data: string, value?: string): Promise<string> {
  const params: any = { from, to, data };
  if (value) params.value = value;
  return window.ethereum!.request({ method: "eth_sendTransaction", params: [params] });
}

const statusLabels: Record<number, { label: string; color: string }> = {
  0: { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  1: { label: "Resolved", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  3: { label: "Canceled", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketIdHex = params.id as string;
  const { address } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("0.01");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [state, setState] = useState<any>(null);
  const [userBet, setUserBet] = useState<any>(null);
  const [payout, setPayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined" || !window.ethereum) return;
    const formattedId = marketIdHex.startsWith("0x") ? marketIdHex : `0x${marketIdHex}`;
    setLoading(true);
    Promise.all([
      fetch(`/api/markets/${formattedId}`).then(r => r.json()).catch(() => null),
      address ? getUserBet(formattedId, address) : null,
      address ? calculatePayout(formattedId, address) : null,
    ]).then(([resp, bet, pay]) => {
      setState(resp ? {
        config: {
          description: resp.outcomes?.join(" / ") || "Market",
          outcomes: resp.outcomes || [],
          platformFeeBps: BigInt(resp.fee_basis_points || 0),
        },
        totalPool: BigInt(resp.total_pool || "0"),
        status: resp.status === "resolved" ? 1 : resp.status === "canceled" ? 3 : 0,
        winningOutcome: BigInt(resp.winning_outcome ?? 0),
      } : null);
      setUserBet(bet);
      setPayout(pay);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [mounted, address, marketIdHex, refreshKey]);

  async function waitForTx(tx: string) {
    return new Promise<void>((resolve) => {
      const check = setInterval(async () => {
        try {
          const receipt = await window.ethereum!.request({
            method: "eth_getTransactionReceipt", params: [tx],
          });
          if (receipt && receipt.blockNumber) { clearInterval(check); resolve(); }
        } catch {}
      }, 2000);
    });
  }

  const handleBet = async () => {
    if (selectedOutcome === null || !window.ethereum) return;
    setTxError(null);
    setIsPending(true);
    try {
      const amountWei = "0x" + BigInt(Math.floor(parseFloat(betAmount) * 1e18)).toString(16);
      const data = SELECTORS.placeBet + encodeBytes32(marketIdHex) + encodeUint256(selectedOutcome);
      const tx = await sendTx(address!, POOL_ENGINE, data, amountWei);
      setTxHash(tx);
      await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || e.code || "Transaction failed"); }
    setIsPending(false);
  };

  const handleClaim = async () => {
    if (!window.ethereum) return;
    setTxError(null);
    setIsPending(true);
    try {
      const data = SELECTORS.claim + encodeBytes32(marketIdHex);
      const tx = await sendTx(address!, POOL_ENGINE, data);
      setTxHash(tx);
      await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || e.code || "Claim failed"); }
    setIsPending(false);
  };

  const config = state?.config;
  const outcomes = config?.outcomes || [];
  const description = config?.description || "Market";
  const feeBps = config?.platformFeeBps || BigInt(0);
  const status = state?.status;
  const statusInfo = status !== undefined ? statusLabels[status] || { label: "Unknown", color: "" } : { label: "Loading", color: "" };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center justify-between bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-xs text-white/30 hover:text-white">← Markets</Link>
          <span className="text-xs text-white/10">/</span>
          <span className="text-xs text-white/50 truncate max-w-[200px]">{description}</span>
        </div>
        <WalletButton />
      </nav>

      <main className="pt-20 px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {!mounted || loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-white/[0.06] rounded" />
              <div className="h-4 w-96 bg-white/[0.04] rounded" />
              <div className="h-32 bg-white/[0.03] rounded-xl" />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.color}`}>{statusInfo.label}</span>
                  {Number(feeBps) > 0 && <span className="text-xs text-white/30">Fee: {Number(feeBps) / 100}%</span>}
                </div>
                <h1 className="text-2xl font-heading font-bold text-white mb-2">{description}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-white/30 font-mono">
                  <span>ID: {marketIdHex.slice(0, 18)}...</span>
                  <span>Pool: {state?.totalPool ? `${(Number(state.totalPool) / 1e18).toFixed(4)} AVAX` : "0 AVAX"}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-sm font-heading font-semibold text-white">Outcomes</h2>
                  {outcomes.map((outcome: string, i: number) => {
                    const isWinner = status === 1 && state && Number(state.winningOutcome) === i;
                    const uOutcome = userBet ? Number(userBet.outcome) : -1;
                    const uAmount = userBet ? Number(userBet.amount) : 0;
                    return (
                      <div key={i}
                        className={`rounded-xl border p-4 transition-all cursor-pointer ${
                          selectedOutcome === i ? "border-purple-500/40 bg-purple-500/5"
                          : isWinner ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                        onClick={() => { if (status === 0) setSelectedOutcome(i); }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedOutcome === i ? "border-purple-500" : "border-white/[0.15]"
                            }`}>
                              {selectedOutcome === i && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                            </div>
                            <span className="text-sm text-white">{outcome}</span>
                          </div>
                          <div className="text-right text-sm text-white/60">
                            {state?.totalPool ? `${(Number(state.totalPool) / 1e18).toFixed(4)} AVAX` : "—"}
                          </div>
                        </div>
                        {isWinner && <div className="mt-2 text-xs text-emerald-400">🏆 Winning outcome</div>}
                        {uOutcome === i && uAmount > 0 && (
                          <div className="mt-2 text-xs text-purple-400">Your bet: {(uAmount / 1e18).toFixed(4)} AVAX</div>
                        )}
                      </div>
                    );
                  })}

                  {mounted && address && status === 0 && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mt-6">
                      <h3 className="text-sm font-medium text-white mb-4">Place a Bet</h3>
                      <div className="flex items-end gap-3 mb-4">
                        <div className="flex-1">
                          <label className="text-xs text-white/30 mb-1 block">Amount (AVAX)</label>
                          <input type="number" step="0.001" min="0.001" value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <button onClick={handleBet} disabled={selectedOutcome === null || isPending}
                          className={`px-6 h-10 rounded-lg text-sm font-medium transition-all ${
                            selectedOutcome === null ? "bg-white/[0.06] text-white/30 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                          }`}
                        >{isPending ? "Confirming..." : "Place Bet"}</button>
                      </div>
                      {selectedOutcome === null && <p className="text-xs text-amber-400/80">Select an outcome above first</p>}
                    </div>
                  )}

                  {mounted && address && payout !== null && Number(payout) > 0 && (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-400">Claim Available</p>
                          <p className="text-xs text-emerald-400/60">Payout: {(Number(payout) / 1e18).toFixed(4)} AVAX</p>
                        </div>
                        <button onClick={handleClaim} disabled={isPending}
                          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-all"
                        >{isPending ? "Confirming..." : "Claim"}</button>
                      </div>
                    </div>
                  )}

                  {txHash && (
                    <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3 flex items-center gap-2">
                      <span className="text-xs text-purple-300/80">✅ Tx:</span>
                      <a href={`https://testnet.snowscan.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-purple-400 underline truncate">{txHash.slice(0, 18)}...</a>
                    </div>
                  )}
                  {txError && (
                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                      <p className="text-xs text-red-300/80">⚠️ {txError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Market Info</h3>
                    <div className="space-y-3 text-xs">
                      <div><span className="text-white/30">Status</span><p className="text-white mt-0.5">{statusInfo.label}</p></div>
                      <div><span className="text-white/30">Total Pool</span><p className="text-white mt-0.5">{state?.totalPool ? `${(Number(state.totalPool) / 1e18).toFixed(4)} AVAX` : "0 AVAX"}</p></div>
                      <div><span className="text-white/30">Fee</span><p className="text-white mt-0.5">{Number(feeBps) / 100}%</p></div>
                      <div><span className="text-white/30">Outcomes</span><p className="text-white mt-0.5">{outcomes.length}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Your Position</h3>
                    {!address ? <p className="text-xs text-white/30">Connect wallet to view</p>
                    : userBet && Number(userBet.amount) > 0 ? (
                      <div className="space-y-2 text-xs">
                        <div><span className="text-white/30">Outcome:</span><p className="text-white mt-0.5">{outcomes[Number(userBet.outcome)] || `#${userBet.outcome}`}</p></div>
                        <div><span className="text-white/30">Amount:</span><p className="text-white mt-0.5">{(Number(userBet.amount) / 1e18).toFixed(4)} AVAX</p></div>
                        <div><span className="text-white/30">Claimed:</span><p className="text-white mt-0.5">{userBet.claimed ? "Yes" : "No"}</p></div>
                      </div>
                    ) : <p className="text-xs text-white/30">No bet placed yet</p>}
                  </div>
                  <a href={`https://testnet.snowscan.xyz/address/${POOL_ENGINE}`} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2">View Contract on Snowscan →</a>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
