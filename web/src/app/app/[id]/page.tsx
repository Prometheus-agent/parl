"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { WalletButton } from "@/lib/wallet-button";
import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";
import { useWriteContract } from "wagmi";

// V2 Contracts (live on Fuji)
const POOL_ENGINE = "0xb8dadda62f236afc4ca8548f2935c90210b6f8bf";
const PARL_ORACLE = "0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2";

function padHex(val: string): string {
  return val.replace("0x", "").padStart(64, "0");
}

function encodeUint256(val: bigint): string {
  return val.toString(16).padStart(64, "0");
}

function encodeAddress(addr: string): string {
  return padHex(addr.toLowerCase());
}

function encodeBytes32(val: string): string {
  return padHex(val);
}

async function ethCall(to: string, data: string): Promise<string> {
  const w = window as any;
  if (!w.ethereum) throw new Error("no ethereum provider");
  return w.ethereum.request({
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

const SELECTORS = {
  placeBet:        "0xf3118d8e",
  claim:           "0xbd66528a",
  getUserBet:      "0x44e39303",
  calculatePayout: "0x39a6f8a6",
  propose:         "0x60ad20b1",
  dispute:         "0xadd98c70",
  executeRes:      "0x2788e5b4",
  getProposal:     "0x430694cf",
};

const statusStyles: Record<string, { label: string; color: string }> = {
  active:    { label: "Open",     color: "text-green-500" },
  resolved:  { label: "Resolved", color: "text-blue-500" },
  canceled:  { label: "Canceled", color: "text-amber-500" },
};

const catBadge: Record<string, string> = {
  sports:     "border-green-800 text-green-400",
  crypto:     "border-amber-800 text-amber-400",
  politics:   "border-rose-800 text-rose-400",
  weather:    "border-cyan-800 text-cyan-400",
  technology: "border-violet-800 text-violet-400",
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

  const { writeContractAsync } = useWriteContract();

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
        if (typeof window !== "undefined" && (window as any).ethereum && mId) {
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

  const handleBet = async () => {
    if (selectedOutcome === null || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const val = BigInt(Math.floor(parseFloat(betAmount) * 1e18));
      const data = SELECTORS.placeBet + encodeBytes32(marketIdHex) + encodeUint256(BigInt(selectedOutcome));
      const tx = await writeContractAsync({
        address: POOL_ENGINE as `0x${string}`,
        abi: [{
          type: "function",
          name: "placeBet",
          inputs: [
            { name: "marketId", type: "bytes32" },
            { name: "outcomeIndex", type: "uint256" },
          ],
          outputs: [],
          stateMutability: "payable",
        }],
        functionName: "placeBet",
        args: [marketIdHex as `0x${string}`, BigInt(selectedOutcome)],
        value: val,
      });
      setTxHash(tx); setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Transaction failed"); }
    setIsPending(false);
  };

  const handleClaim = async () => {
    if (!marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const tx = await writeContractAsync({
        address: POOL_ENGINE as `0x${string}`,
        abi: [{
          type: "function",
          name: "claimPayout",
          inputs: [{ name: "marketId", type: "bytes32" }],
          outputs: [],
          stateMutability: "nonpayable",
        }],
        functionName: "claimPayout",
        args: [marketIdHex as `0x${string}`],
      });
      setTxHash(tx); setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Claim failed"); }
    setIsPending(false);
  };

  const handlePropose = async () => {
    if (proposedOutcome === null || !marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const bondWei = 100000000000000000n; // 0.1 AVX
      const tx = await writeContractAsync({
        address: PARL_ORACLE as `0x${string}`,
        abi: [{
          type: "function",
          name: "propose",
          inputs: [
            { name: "marketId", type: "bytes32" },
            { name: "outcome", type: "uint256" },
            { name: "data", type: "bytes" },
          ],
          outputs: [],
          stateMutability: "payable",
        }],
        functionName: "propose",
        args: [marketIdHex as `0x${string}`, BigInt(proposedOutcome), ("0x" as `0x${string}`)],
        value: bondWei,
      });
      setTxHash(tx); setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Propose failed"); }
    setIsPending(false);
  };

  const handleDispute = async () => {
    if (!marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const bond = proposal?.bond || 100000000000000000n;
      const tx = await writeContractAsync({
        address: PARL_ORACLE as `0x${string}`,
        abi: [{
          type: "function",
          name: "dispute",
          inputs: [
            { name: "marketId", type: "bytes32" },
            { name: "data", type: "bytes" },
          ],
          outputs: [],
          stateMutability: "payable",
        }],
        functionName: "dispute",
        args: [marketIdHex as `0x${string}`, ("0x" as `0x${string}`)],
        value: bond,
      });
      setTxHash(tx); setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Dispute failed"); }
    setIsPending(false);
  };

  const handleExecuteResolution = async () => {
    if (!marketIdHex) return;
    setTxError(null); setIsPending(true);
    try {
      const tx = await writeContractAsync({
        address: PARL_ORACLE as `0x${string}`,
        abi: [{
          type: "function",
          name: "executeResolution",
          inputs: [{ name: "marketId", type: "bytes32" }],
          outputs: [],
          stateMutability: "nonpayable",
        }],
        functionName: "executeResolution",
        args: [marketIdHex as `0x${string}`],
      });
      setTxHash(tx); setRefreshKey(k => k + 1);
    } catch (e: any) { setTxError(e.message || "Execute failed"); }
    setIsPending(false);
  };

  const outcomes = market?.outcomes || [];
  const totalPoolAvax = Number(BigInt(market?.total_pool || "0")) / 1e18;
  const status = market?.status || "unknown";
  const sInfo = statusStyles[status] || { label: status, color: "" };
  const prob = market?.probabilities || [];
  const outcomePools = market?.outcome_pools || [];

  return (
    <div className="min-h-screen bg-black text-white">
            {/* Nav */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 min-h-12 py-1 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/app" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors shrink-0">
            {"<-"} back
          </Link>
          <div className="shrink min-w-0 max-w-full overflow-hidden"><WalletButton /></div>
        </div>
      </div>

      <main className="px-5 py-6 max-w-5xl mx-auto">
        {!mounted || loading ? (
          <div className="animate-pulse space-y-4 pt-8">
            <div className="h-5 w-48 bg-neutral-900 rounded" />
            <div className="h-4 w-80 bg-neutral-900/50 rounded" />
            <div className="h-40 bg-neutral-900/30 rounded" />
          </div>
        ) : market ? (<>
          <div className="mb-6">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className={`text-xs ${sInfo.color}`}>{sInfo.label}</span>
              {market.category && (
                <span className={`text-xs px-2 py-0.5 border rounded ${catBadge[market.category] || "border-neutral-700 text-neutral-500"}`}>
                  {market.category}
                </span>
              )}
              {Number(market.fee_basis_points) > 0 && (
                <span className="text-xs text-neutral-600 font-mono">{Number(market.fee_basis_points) / 100}% fee</span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-medium text-white mb-2 leading-snug">{outcomes.join(" | ")}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-600 font-mono">
              <span>pool: {totalPoolAvax.toFixed(4)} avax</span>
              <span>volume: {market.volume_avax || "0"} avax</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs text-neutral-600 tracking-wide">OUTCOMES</h2>
              {outcomes.map((outcome: string, i: number) => {
                const isWinner = status === "resolved" && Number(market.winning_outcome) === i;
                const uOutcome = userBet?.outcome ?? -1;
                const uAmount = userBet?.amount ?? 0n;
                const poolAvax = Number(BigInt(outcomePools[i] || "0")) / 1e18;
                const probability = prob[i] || 0;
                return (
                  <div key={i}
                    className={`border rounded p-4 transition-colors cursor-pointer ${
                      selectedOutcome === i
                        ? "border-neutral-600 bg-neutral-900/50"
                        : isWinner
                        ? "border-green-800 bg-green-900/10"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                    onClick={() => { if (status === "active") setSelectedOutcome(i); }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedOutcome === i ? "border-neutral-400" : "border-neutral-700"
                        }`}>
                          {selectedOutcome === i && <div className="w-2 h-2 rounded-full bg-neutral-400" />}
                        </div>
                        <span className="text-sm text-neutral-200">{outcome}</span>
                        {isWinner && <span className="text-[11px] text-green-500">winner</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-300 font-medium">{probability.toFixed(1)}%</div>
                        <div className="text-[11px] text-neutral-600">{poolAvax.toFixed(4)} avax</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-500 rounded-full" style={{ width: `${Math.max(probability, 2)}%` }} />
                    </div>
                    {uOutcome === i && uAmount > 0n && (
                      <div className="mt-2 text-xs text-neutral-400">your bet: {(Number(uAmount) / 1e18).toFixed(4)} avax</div>
                    )}
                    {uOutcome === i && userBet?.claimed && (
                      <div className="mt-1 text-xs text-neutral-600">claimed</div>
                    )}
                  </div>
                );
              })}

              {/* Bet */}
              {mounted && address && status === "active" && (
                <div className="border border-neutral-800 rounded p-5 mt-4">
                  <h3 className="text-xs text-neutral-600 tracking-wide mb-4">PLACE BET</h3>
                  <div className="flex items-end gap-3 mb-3">
                    <div className="flex-1">
                      <label className="text-xs text-neutral-600 mb-1 block">amount (avax)</label>
                      <input type="number" step="0.001" min="0.001" value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-white outline-none focus:border-neutral-600" />
                    </div>
                    <button onClick={handleBet} disabled={selectedOutcome === null || isPending}
                      className={`px-5 h-9 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedOutcome === null
                          ? "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                          : "border border-neutral-700 hover:bg-neutral-900 text-neutral-300"
                      }`}
                    >{isPending ? "confirm..." : "Place Bet"}</button>
                  </div>
                  {selectedOutcome === null && (
                    <p className="text-xs text-amber-500/70">select an outcome first</p>
                  )}
                </div>
              )}

              {/* Claim */}
              {mounted && address && payout !== null && Number(payout) > 0 && !userBet?.claimed && (
                <div className="border border-green-800 bg-green-900/5 rounded p-5 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-500">Claim Available</p>
                      <p className="text-xs text-green-500/60">payout: {(Number(payout) / 1e18).toFixed(4)} avax</p>
                    </div>
                    <button onClick={handleClaim} disabled={isPending}
                      className="px-4 py-1.5 rounded border border-green-800 hover:bg-green-900/20 text-xs text-green-500 transition-colors"
                    >{isPending ? "confirm..." : "Claim"}</button>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {mounted && address && status === "active" && (
                <div className="border border-neutral-800 rounded p-5 mt-4">
                  <h3 className="text-xs text-neutral-600 tracking-wide mb-3">RESOLUTION</h3>
                  {proposal && !proposal.resolved ? (
                    <div className="text-xs text-neutral-500 space-y-2 mb-3">
                      <p>outcome proposed: <span className="text-neutral-300">{outcomes[Number(proposal.winningOutcome)] || `#${proposal.winningOutcome}`}</span></p>
                      <p>by: <span className="font-mono text-neutral-400">{proposal.proposer.slice(0, 10)}...</span></p>
                      <p>bond: {(Number(proposal.bond) / 1e18).toFixed(2)} avax</p>
                      <p>block: {proposal.proposedAt.toString()} (window: {proposal.disputeWindow.toString()})</p>
                      {proposal.disputed ? (
                        <p className="text-amber-500">disputed -- manual arbitration needed</p>
                      ) : (<>
                        <button onClick={handleDispute} disabled={isPending}
                          className="text-xs px-4 py-1 rounded border border-amber-800 text-amber-400 hover:bg-amber-900/10 transition-colors mr-2"
                        >{isPending ? "..." : "Dispute"}</button>
                        <button onClick={handleExecuteResolution} disabled={isPending}
                          className="text-xs px-4 py-1 rounded border border-green-800 text-green-400 hover:bg-green-900/10 transition-colors"
                        >{isPending ? "..." : "Execute Resolution"}</button>
                      </>)}
                    </div>
                  ) : proposal?.resolved ? (
                    <p className="text-xs text-neutral-600">resolution executed</p>
                  ) : null}

                  {!proposal && (<div>
                    <p className="text-xs text-neutral-600 mb-3">propose a resolution (requires 0.1 avax bond):</p>
                    <div className="flex flex-wrap gap-2">
                      {outcomes.map((o: string, i: number) => (
                        <button key={i} onClick={() => { setProposedOutcome(i); handlePropose(); }}
                          className="text-xs px-4 py-1 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                        >Propose: {o}</button>
                      ))}
                    </div>
                  </div>)}
                </div>
              )}

              {txHash && (
                <div className="border border-neutral-800 rounded p-3 flex items-center gap-2 mt-4">
                  <span className="text-xs text-neutral-400">tx:</span>
                  <a href={`https://testnet.snowscan.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-neutral-500 underline truncate hover:text-neutral-400">{txHash}</a>
                </div>
              )}
              {txError && (
                <div className="border border-red-900 rounded p-3 mt-4">
                  <p className="text-xs text-red-400">{txError}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs text-neutral-600 tracking-wide mb-3">MARKET INFO</h3>
                <div className="space-y-3 text-xs">
                  <div><span className="text-neutral-600">status</span><p className="text-neutral-300 mt-0.5">{sInfo.label}</p></div>
                  <div><span className="text-neutral-600">total pool</span><p className="text-neutral-300 mt-0.5">{totalPoolAvax.toFixed(4)} avax</p></div>
                  <div><span className="text-neutral-600">fee</span><p className="text-neutral-300 mt-0.5">{Number(market.fee_basis_points) / 100}%</p></div>
                  <div><span className="text-neutral-600">category</span><p className="text-neutral-300 mt-0.5 capitalize">{market.category || "general"}</p></div>
                  <div><span className="text-neutral-600">creator</span><p className="text-neutral-400 mt-0.5 font-mono text-[11px]">{market.creator?.slice(0, 14)}...</p></div>
                  <div><span className="text-neutral-600">resolver</span><p className="text-neutral-400 mt-0.5 font-mono text-[11px]">{market.resolver?.slice(0, 14)}...</p></div>
                  <div><span className="text-neutral-600">contract</span>
                    <p className="text-[11px] mt-0.5">
                      <a href={`https://testnet.snowscan.xyz/address/${POOL_ENGINE}`} target="_blank" rel="noopener noreferrer"
                        className="text-neutral-500 underline underline-offset-2 hover:text-neutral-400">PoolEngine v2</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs text-neutral-600 tracking-wide mb-3">YOUR POSITION</h3>
                {!address
                  ? <p className="text-xs text-neutral-600">connect wallet</p>
                  : userBet && userBet.amount > 0n ? (
                    <div className="space-y-2 text-xs">
                      <div><span className="text-neutral-600">outcome:</span><p className="text-neutral-300 mt-0.5">{outcomes[userBet.outcome] || `#${userBet.outcome}`}</p></div>
                      <div><span className="text-neutral-600">amount:</span><p className="text-neutral-300 mt-0.5">{(Number(userBet.amount) / 1e18).toFixed(4)} avax</p></div>
                      <div><span className="text-neutral-600">claimed:</span><p className="text-neutral-300 mt-0.5">{userBet.claimed ? "yes" : "no"}</p></div>
                      {payout !== null && Number(payout) > 0 && (
                        <div><span className="text-green-500">payout:</span><p className="text-green-500 mt-0.5">{(Number(payout) / 1e18).toFixed(4)} avax</p></div>
                      )}
                    </div>
                  ) : <p className="text-xs text-neutral-600">no bet placed</p>}
              </div>
            </div>
          </div>
        </>) : (
          <div className="text-center pt-16">
            <p className="text-neutral-600 text-sm">market not found</p>
            <Link href="/app" className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-400 mt-2 block">{"<-"} back to markets</Link>
          </div>
        )}
      </main>
    </div>
  );
}
