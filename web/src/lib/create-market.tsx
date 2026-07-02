"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import {
  encodeFunctionData,
  keccak256,
  toBytes,
  parseEther,
  stringToHex,
} from "viem";

const FACTORY_ADDR =
  process.env.NEXT_PUBLIC_MARKET_FACTORY ||
  "0x95b38D36D50BcFd4E4c875c640EB1627b48585eC";
const DEFAULT_RESOLVER =
  process.env.NEXT_PUBLIC_PA_ORACLE ||
  "0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2";
const CREATION_FEE = 0.01; // AVAX
const CHAIN_ID = 43113; // Fuji

const FACTORY_ABI = [
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "outcomes", type: "string[]" },
      { name: "resolver", type: "address" },
      { name: "feeBasisPoints", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

export default function CreateMarketModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { address } = useWallet();
  const [question, setQuestion] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [resolver, setResolver] = useState(DEFAULT_RESOLVER);
  const [fee, setFee] = useState(2);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => {
    setQuestion("");
    setOutcomesText("");
    setResolver(DEFAULT_RESOLVER);
    setFee(2);
    setStatus("idle");
    setTxHash("");
    setErrorMsg("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!address || !window.ethereum) return;

    const outcomes = outcomesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (outcomes.length < 2) {
      setErrorMsg("Need at least 2 outcomes (one per line)");
      setStatus("error");
      return;
    }
    if (question.length < 3) {
      setErrorMsg("Enter a question for the market");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      // Generate deterministic marketId via keccak256
      const marketId = keccak256(
        toBytes(question + Date.now())
      );

      // Encode function call
      const data = encodeFunctionData({
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [marketId, outcomes, resolver as `0x${string}`, BigInt(fee * 100)],
      });

      const valueWei = parseEther(CREATION_FEE.toString());

      const ethProvider = window.ethereum as any;
      const accounts: string[] = await ethProvider.request({
        method: "eth_requestAccounts",
      });
      const user = accounts[0];

      const tx: string = await ethProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: user,
            to: FACTORY_ADDR,
            data,
            value: "0x" + valueWei.toString(16),
            chainId: "0xa86a", // 43113
          },
        ],
      });

      setTxHash(tx);
      setStatus("done");
    } catch (err: any) {
      console.error("Create market error:", err);
      setErrorMsg(err?.message || err?.toString() || "Transaction failed");
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-semibold text-white">
            Create Market
          </h2>
          <button
            onClick={handleClose}
            className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {status === "done" ? (
          /* Success state */
          <div className="text-center py-6">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm text-white/70 mb-1 font-body">Market created!</p>
            <p className="text-xs text-white/40 break-all font-mono mb-4">{txHash}</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm text-white transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="mb-4">
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
                Question
              </label>
              <input
                type="text"
                placeholder="e.g. Will BTC exceed $150k by Dec 2026?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            {/* Outcomes */}
            <div className="mb-4">
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
                Outcomes{" "}
                <span className="text-white/20">(one per line, min 2)</span>
              </label>
              <textarea
                placeholder={`Yes\nNo`}
                value={outcomesText}
                onChange={(e) => setOutcomesText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 transition-all resize-none"
              />
            </div>

            {/* Resolver */}
            <div className="mb-4">
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
                Resolver{" "}
                <span className="text-white/20">(oracle contract address)</span>
              </label>
              <input
                type="text"
                value={resolver}
                onChange={(e) => setResolver(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 transition-all font-mono text-[13px]"
              />
            </div>

            {/* Fee slider */}
            <div className="mb-5">
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
                Fee — {fee}%
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[11px] text-white/20 mt-1">
                <span>1%</span>
                <span>2%</span>
                <span>3%</span>
                <span>4%</span>
                <span>5%</span>
              </div>
            </div>

            {/* Info box */}
            <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Creation fee</span>
                <span className="text-white/70">{CREATION_FEE} AVAX</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-white/40">Resolver</span>
                <span className="text-white/70">
                  {resolver.toLowerCase() ===
                  DEFAULT_RESOLVER.toLowerCase()
                    ? "ParlOracle (Optimistic)"
                    : "Custom address"}
                </span>
              </div>
            </div>

            {/* Error */}
            {status === "error" && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-300/90">{errorMsg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={status === "sending" || !address}
              className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.06] disabled:text-white/30 text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
            >
              {status === "sending" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                  Sending...
                </>
              ) : !address ? (
                "Connect wallet first"
              ) : (
                `Create Market (${CREATION_FEE} AVAX)`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
