"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";
import {
  encodeFunctionData,
  toHex,
  parseEther,
} from "viem";

// V2 Contracts (live on Fuji)
const POOL_ENGINE = "0xb8dadda62f236afc4ca8548f2935c90210b6f8bf";
const PARL_ORACLE = "0x8f38e370e55f13277bcd9952bf30a8d992d05cd8";
const ORACLE_BOND = parseEther("0.1");

// ─── Low-level helpers ───

function padHex(val: string): string {
  return val.replace("0x", "").padStart(64, "0");
}

function encodeUint256(val: bigint): string {
  // Return 64 hex chars (32 bytes)
  return val.toString(16).padStart(64, "0");
}

function encodeAddress(addr: string): string {
  return padHex(addr.toLowerCase());
}

function encodeBytes32(val: string): string {
  return padHex(val);
}

async function ethCall(to: string, data: string): Promise<string> {
  return window.ethereum!.request({
    method: "eth_call",
    params: [{ to, data }, "latest"],
  }) as Promise<string>;
}

async function sendTx(from: string, to: string, data: string, value?: string): Promise<string> {
  const params: Record<string, any> = { from, to, data };
  if (value) params.value = value;
  return window.ethereum!.request({ method: "eth_sendTransaction", params: [params] });
}

function waitForTx(tx: string): Promise<void> {
  return new Promise((resolve) => {
    const check = setInterval(async () => {
      try {
        const receipt = await window.ethereum!.request({
          method: "eth_getTransactionReceipt",
          params: [tx],
        });
        if (receipt && receipt.blockNumber) {
          clearInterval(check);
          resolve();
        }
      } catch {}
    }, 2000);
  });
}

// ─── Correct selectors ───
const SELECTORS = {
  placeBet:        "0xf3118d8e",  // placeBet(bytes32,uint256)
  claim:           "0xbd66528a",  // claim(bytes32)
  getUserBet:      "0x44e39303",  // getUserBet(bytes32,address)
  calculatePayout: "0x39a6f8a6",  // calculatePayout(bytes32,address)
  propose:         "0x60ad20b1",  // propose(bytes32,uint256,uint256,bytes)
  dispute:         "0xadd98c70",  // dispute(bytes32)
  executeRes:      "0x2788e5b4",  // executeResolution(bytes32)
  getProposal:     "0x430694cf",  // getProposal(bytes32)
};

// ─── On-chain reads ───

async function getUserBet(marketId: string, userAddr: string) {
  try {
    const data = SELECTORS.getUserBet + encodeBytes32(marketId) + encodeAddress(userAddr);
    const hex = await ethCall(POOL_ENGINE, data);
    if (!hex || hex === "0x") return null;
    const outcome = BigInt("0x" + hex.slice(2, 66));
    const amount = BigInt("0x" + hex.slice(66, 130));
    const claimed = BigInt("0x" + hex.slice(130, 194)) > 0n;
    return { outcome: Number(outcome), amount, claimed };
  } catch { return null; }
}

async function calcPayout(marketId: string, userAddr: string) {
  try {
    const data = SELECTORS.calculatePayout + encodeBytes32(marketId) + encodeAddress(userAddr);
    const hex = await ethCall(POOL_ENGINE, data);
    if (!hex || hex === "0x") return null;
    return BigInt("0x" + hex.slice(2));
  } catch { return null; }
}

async function getProposal(marketId: string) {
  try {
    const data = SELECTORS.getProposal + encodeBytes32(marketId);
    const hex = await ethCall(PARL_ORACLE, data);
    if (!hex || hex === "0x") return null;
    const raw = hex.slice(2);
    // Proposal struct: 10 fields, first 9 are uint256-sized, last is bytes (skip)
    return {
      marketId: ("0x" + raw.slice(0, 64)) as `0x${string}`,
      winningOutcome: BigInt("0x" + raw.slice(64, 128)),
      proposer: ("0x" + raw.slice(128, 168).replace(/^0x0+/, "0x")) as `0x${string}`,
      bond: BigInt("0x" + raw.slice(168, 232)),
      proposedAt: BigInt("0x" + raw.slice(232, 296)),
      resolved: BigInt("0x" + raw.slice(296, 360)) > 0n,
      disputed: BigInt("0x" + raw.slice(360, 424)) > 0n,
      disputer: ("0x" + raw.slice(424, 464).replace(/^0x0+/, "0x")) as `0x${string}`,
      disputeWindow: BigInt("0x" + raw.slice(464, 528)),
      data: "0x" as `0x${string}`,
    };
  } catch { return null; }
}

// ─── UI constants ───

const statusLabels: Record<string, { label: string; color: string }> = {
  active:    { label: "Open",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  resolved:  { label: "Resolved", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  canceled:  { label: "Canceled", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

const categoryBadge: Record<string, string> = {
  sports:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  crypto:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  politics:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  weather:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  technology: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketIdUuid = params.id as string;
  const [marketIdHex, setMarketIdHex] = useState<string>("");
  const { address } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("0.01");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [market, setMarket] = useState<any>(null);
  const [userBet, setUserBet] = useState<any>(null);
  const [payout, setPayout] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proposedOutcome, setProposedOutcome] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    const uuidId = encodeURIComponent(marketIdUuid);
    fetch(`/api/markets/${uuidId}`)
      .then(r => r.json())
      .then(resp => {
        setMarket(resp);
        const mId = resp.market_id_hex || "";
        setMarketIdHex(mId);
        if (window.ethereum && mId) {
          Promise.all([
            address ? getUserBet(mId, address!) : null,
            address ? calcPayout(mId, address!) : null,
            getProposal(mId),
          ]).then(([bet, pay, prop]) => {
            setUserBet(bet); setPayout(pay); setProposal(prop);
            setLoading(false);
          }).catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [mounted, address, marketIdUuid, refreshKey]);

  // ─── Actions ───

  const handleBet = async () => {
    if (selectedOutcome === null || !window.ethereum || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const val = BigInt(Math.floor(parseFloat(betAmount) * 1e18));
      const data = SELECTORS.placeBet + encodeBytes32(marketIdHex) + encodeUint256(BigInt(selectedOutcome));
      const tx = await sendTx(address!, POOL_ENGINE, data, "0x" + val.toString(16));
      setTxHash(tx); await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Transaction failed"); }
    setIsPending(false);
  };

  const handleClaim = async () => {
    if (!window.ethereum || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const data = SELECTORS.claim + encodeBytes32(marketIdHex);
      const tx = await sendTx(address!, POOL_ENGINE, data);
      setTxHash(tx); await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Claim failed"); }
    setIsPending(false);
  };

  const handlePropose = async () => {
    if (proposedOutcome === null || !window.ethereum || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      // propose(bytes32,uint256,uint256,bytes) -> 4 params
      const data = SELECTORS.propose
        + encodeBytes32(marketIdHex)
        + encodeUint256(BigInt(proposedOutcome))
        + encodeUint256(100n)      // disputeWindow = 100 blocks
        + "0000000000000000000000000000000000000000000000000000000000000080" // offset of bytes data
        + "0000000000000000000000000000000000000000000000000000000000000000"; // empty bytes
      const bondWei = "0x" + ORACLE_BOND.toString(16);
      const tx = await sendTx(address!, PARL_ORACLE, data, bondWei);
      setTxHash(tx); await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Propose failed"); }
    setIsPending(false);
  };

  const handleDispute = async () => {
    if (!window.ethereum || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const data = SELECTORS.dispute + encodeBytes32(marketIdHex);
      const bond = proposal?.bond || ORACLE_BOND;
      const tx = await sendTx(address!, PARL_ORACLE, data, "0x" + bond.toString(16));
      setTxHash(tx); await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Dispute failed"); }
    setIsPending(false);
  };

  const handleExecuteResolution = async () => {
    if (!window.ethereum || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const data = SELECTORS.executeRes + encodeBytes32(marketIdHex);
      const tx = await sendTx(address!, PARL_ORACLE, data);
      setTxHash(tx); await waitForTx(tx);
      setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Execute failed"); }
    setIsPending(false);
  };

  // ─── Derived ───
  const outcomes = market?.outcomes || [];
  const totalPoolAvax = Number(BigInt(market?.total_pool || "0")) / 1e18;
  const status = market?.status || "unknown";
  const sInfo = statusLabels[status] || { label: status, color: "" };
  const prob = market?.probabilities || [];
  const outcomePools = market?.outcome_pools || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center justify-between bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <Link href="/app" className="text-xs text-white/40 hover:text-white transition-colors">← Back</Link>
        <WalletButton />
      </nav>
      <main className="pt-20 px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {!mounted || loading ? (
            <div className="animate-pulse space-y-4 pt-10">
              <div className="h-6 w-64 bg-white/[0.06] rounded" />
              <div className="h-4 w-96 bg-white/[0.04] rounded" />
              <div className="h-48 bg-white/[0.03] rounded-xl" />
            </div>
          ) : market ? (<>
            <div className="mb-8">
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sInfo.color}`}>{sInfo.label}</span>
                {market.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryBadge[market.category] || "bg-white/[0.06] text-white/40 border-white/[0.1]"}`}>
                    {market.category}
                  </span>
                )}
                {Number(market.fee_basis_points) > 0 && (
                  <span className="text-xs text-white/30 font-mono">{Number(market.fee_basis_points) / 100}% fee</span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-heading font-bold text-white mb-2 leading-snug">{outcomes.join(" | ")}</h1>
              <div className="flex flex-wrap gap-4 text-xs text-white/30 font-mono">
                <span>Pool: {totalPoolAvax.toFixed(4)} AVAX</span>
                <span>Volume: {market.volume_avax || "0"} AVAX</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-sm font-heading font-semibold text-white">Outcomes</h2>
                {outcomes.map((outcome: string, i: number) => {
                  const isWinner = status === "resolved" && Number(market.winning_outcome) === i;
                  const uOutcome = userBet?.outcome ?? -1;
                  const uAmount = userBet?.amount ?? 0n;
                  const poolAvax = Number(BigInt(outcomePools[i] || "0")) / 1e18;
                  const probability = prob[i] || 0;
                  return (
                    <div key={i} className={`rounded-xl border p-4 transition-all cursor-pointer ${selectedOutcome === i ? "border-purple-500/40 bg-purple-500/5" : isWinner ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"}`}
                      onClick={() => { if (status === "active") setSelectedOutcome(i); }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedOutcome === i ? "border-purple-500" : "border-white/[0.15]"}`}>
                            {selectedOutcome === i && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                          </div>
                          <span className="text-sm text-white">{outcome}</span>
                          {isWinner && <span className="text-[11px] text-emerald-400">🏆</span>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/70 font-medium">{probability.toFixed(1)}%</div>
                          <div className="text-[11px] text-white/30">{poolAvax.toFixed(4)} AVAX</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${Math.max(probability, 2)}%` }} />
                      </div>
                      {uOutcome === i && uAmount > 0n && (
                        <div className="mt-2 text-xs text-purple-400">Your bet: {(Number(uAmount) / 1e18).toFixed(4)} AVAX</div>
                      )}
                      {uOutcome === i && userBet?.claimed && (
                        <div className="mt-1 text-xs text-blue-400/70">Already claimed ✓</div>
                      )}
                    </div>
                  );
                })}

                {/* Bet */}
                {mounted && address && status === "active" && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mt-4">
                    <h3 className="text-sm font-medium text-white mb-4">Place a Bet</h3>
                    <div className="flex items-end gap-3 mb-3">
                      <div className="flex-1">
                        <label className="text-xs text-white/30 mb-1 block">Amount (AVAX)</label>
                        <input type="number" step="0.001" min="0.001" value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white outline-none focus:border-purple-500/50" />
                      </div>
                      <button onClick={handleBet} disabled={selectedOutcome === null || isPending}
                        className={`px-6 h-10 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedOutcome === null ? "bg-white/[0.06] text-white/30 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"}`}
                      >{isPending ? "Confirm..." : "Place Bet"}</button>
                    </div>
                    {selectedOutcome === null && <p className="text-xs text-amber-400/80">Select an outcome first</p>}
                  </div>
                )}

                {/* Claim */}
                {mounted && address && payout !== null && Number(payout) > 0 && !userBet?.claimed && (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-400">🎉 Claim Available</p>
                        <p className="text-xs text-emerald-400/60">Payout: {(Number(payout) / 1e18).toFixed(4)} AVAX</p>
                      </div>
                      <button onClick={handleClaim} disabled={isPending}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-all"
                      >{isPending ? "Confirm..." : "Claim"}</button>
                    </div>
                  </div>
                )}

                {/* Oracle Resolution */}
                {mounted && address && status === "active" && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mt-4">
                    <h3 className="text-sm font-medium text-white mb-3">Resolution</h3>
                    {proposal && !proposal.resolved ? (
                      <div className="text-xs text-white/50 space-y-2 mb-3">
                        <p>Outcome proposed: <span className="text-white/80">{outcomes[Number(proposal.winningOutcome)] || `#${proposal.winningOutcome}`}</span></p>
                        <p>By: <span className="font-mono text-white/60">{proposal.proposer.slice(0, 10)}...</span></p>
                        <p>Bond: {(Number(proposal.bond) / 1e18).toFixed(2)} AVAX</p>
                        <p>Block: {proposal.proposedAt.toString()} (window: {proposal.disputeWindow.toString()})</p>
                        {proposal.disputed ? (
                          <p className="text-amber-400/80">⚠️ Disputed — manual arbitration needed</p>
                        ) : (<>
                          <button onClick={handleDispute} disabled={isPending}
                            className="text-xs px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors mr-2"
                          >{isPending ? "..." : "Dispute"}</button>
                          <button onClick={handleExecuteResolution} disabled={isPending}
                            className="text-xs px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >{isPending ? "..." : "Execute Resolution"}</button>
                        </>)}
                      </div>
                    ) : proposal?.resolved ? (<p className="text-xs text-white/40">✅ Resolution executed</p>) : null}

                    {!proposal && (<div>
                      <p className="text-xs text-white/40 mb-3">Propose a resolution (requires 0.1 AVAX bond):</p>
                      <div className="flex flex-wrap gap-2">
                        {outcomes.map((o: string, i: number) => (
                          <button key={i} onClick={() => { setProposedOutcome(i); handlePropose(); }}
                            className="text-xs px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors"
                          >Propose: {o}</button>
                        ))}
                      </div>
                    </div>)}
                  </div>
                )}

                {txHash && (
                  <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3 flex items-center gap-2 mt-4">
                    <span className="text-xs text-purple-300/80">✅ Tx:</span>
                    <a href={`https://testnet.snowscan.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-400 underline truncate">{txHash}</a>
                  </div>
                )}
                {txError && (
                  <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 mt-4">
                    <p className="text-xs text-red-300/80">⚠️ {txError}</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Market Info</h3>
                  <div className="space-y-3 text-xs">
                    <div><span className="text-white/30">Status</span><p className="text-white mt-0.5">{sInfo.label}</p></div>
                    <div><span className="text-white/30">Total Pool</span><p className="text-white mt-0.5">{totalPoolAvax.toFixed(4)} AVAX</p></div>
                    <div><span className="text-white/30">Fee</span><p className="text-white mt-0.5">{Number(market.fee_basis_points) / 100}%</p></div>
                    <div><span className="text-white/30">Category</span><p className="text-white mt-0.5 capitalize">{market.category || "General"}</p></div>
                    <div><span className="text-white/30">Creator</span><p className="text-white mt-0.5 font-mono text-[11px]">{market.creator?.slice(0, 14)}...</p></div>
                    <div><span className="text-white/30">Resolver</span><p className="text-white mt-0.5 font-mono text-[11px]">{market.resolver?.slice(0, 14)}...</p></div>
                    <div><span className="text-white/30">Contract</span>
                      <p className="text-[11px] mt-0.5">
                        <a href={`https://testnet.snowscan.xyz/address/${POOL_ENGINE}`} target="_blank" rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline underline-offset-2">PoolEngine v2</a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Your Position</h3>
                  {!address ? <p className="text-xs text-white/30">Connect wallet</p>
                  : userBet && userBet.amount > 0n ? (
                    <div className="space-y-2 text-xs">
                      <div><span className="text-white/30">Outcome:</span><p className="text-white mt-0.5">{outcomes[userBet.outcome] || `#${userBet.outcome}`}</p></div>
                      <div><span className="text-white/30">Amount:</span><p className="text-white mt-0.5">{(Number(userBet.amount) / 1e18).toFixed(4)} AVAX</p></div>
                      <div><span className="text-white/30">Claimed:</span><p className="text-white mt-0.5">{userBet.claimed ? "Yes ✓" : "No"}</p></div>
                      {payout !== null && Number(payout) > 0 && <div><span className="text-emerald-400">Payout:</span><p className="text-emerald-400 mt-0.5">{(Number(payout) / 1e18).toFixed(4)} AVAX</p></div>}
                    </div>
                  ) : <p className="text-xs text-white/30">No bet placed</p>}
                </div>
              </div>
            </div>
          </>) : (
            <div className="text-center pt-20">
              <p className="text-white/40 text-sm">Market not found</p>
              <Link href="/app" className="text-xs text-purple-400 hover:text-purple-300 mt-2 block">← Back to Markets</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
