"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, toBytes, parseEther, encodeFunctionData } from "viem";

const FACTORY_ADDR =
  (process.env.NEXT_PUBLIC_MARKET_FACTORY as `0x${string}`) ||
  "0x95b38D36D50BcFd4E4c875c640EB1627b48585eC";
const DEFAULT_RESOLVER =
  (process.env.NEXT_PUBLIC_PA_ORACLE as `0x${string}`) ||
  "0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2";
const CREATION_FEE = 0.01;

const FACTORY_ABI = [
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "description", type: "string" },
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
  const [resolver, setResolver] = useState<string>(DEFAULT_RESOLVER);
  const [fee, setFee] = useState(2);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { writeContractAsync } = useWriteContract();

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
    if (!address) return;

    const outcomes = outcomesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (outcomes.length < 2) {
      setErrorMsg("need at least 2 outcomes (one per line)");
      setStatus("error");
      return;
    }
    if (question.length < 3) {
      setErrorMsg("enter a question for the market");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const marketId = keccak256(toBytes(question + Date.now()));
      const feeBps = BigInt(fee * 100);

      const tx = await writeContractAsync({
        address: FACTORY_ADDR,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [marketId, question, outcomes, resolver as `0x${string}`, feeBps],
        value: parseEther(CREATION_FEE.toString()),
      });

      setTxHash(tx);
      setStatus("done");
    } catch (err: any) {
      console.error("create market error:", err);
      // User rejected or tx failed
      if (err?.code === 4001 || err?.message?.includes("rejected")) {
        setErrorMsg("transaction rejected");
      } else {
        setErrorMsg(err?.message || err?.toString() || "transaction failed");
      }
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="relative w-full max-w-lg border border-neutral-800 rounded bg-black p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-white">Create Market</h2>
          <button onClick={handleClose} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">x</button>
        </div>

        {status === "done" ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-300 mb-2">Market created!</p>
            <p className="text-xs text-neutral-600 break-all font-mono mb-4">{txHash}</p>
            <button onClick={handleClose}
              className="px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 text-xs text-neutral-400 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs text-neutral-600 mb-1">Question</label>
              <input type="text"
                placeholder="e.g. Will BTC exceed $150k by Dec 2026?"
                value={question} onChange={(e) => setQuestion(e.target.value)}
                className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-700 outline-none focus:border-neutral-600 transition-colors" />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-neutral-600 mb-1">Outcomes <span className="text-neutral-700">(one per line, min 2)</span></label>
              <textarea placeholder="Yes&#10;No" value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-700 outline-none focus:border-neutral-600 transition-colors resize-none" />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-neutral-600 mb-1">Resolver <span className="text-neutral-700">(oracle contract address)</span></label>
              <input type="text" value={resolver} onChange={(e) => setResolver(e.target.value)}
                className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-white outline-none focus:border-neutral-600 transition-colors font-mono" />
            </div>

            <div className="mb-5">
              <label className="block text-xs text-neutral-600 mb-1">Fee -- {fee}%</label>
              <input type="range" min={1} max={5} step={1} value={fee} onChange={(e) => setFee(Number(e.target.value))}
                className="w-full accent-neutral-500" />
              <div className="flex justify-between text-[11px] text-neutral-700 mt-1">
                <span>1%</span><span>2%</span><span>3%</span><span>4%</span><span>5%</span>
              </div>
            </div>

            <div className="mb-5 p-3 border border-neutral-800 rounded">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">creation fee</span>
                <span className="text-neutral-400">{CREATION_FEE} avax</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-neutral-600">resolver</span>
                <span className="text-neutral-400">{resolver.toLowerCase() === DEFAULT_RESOLVER.toLowerCase() ? "ParlOracle" : "Custom"}</span>
              </div>
            </div>

            {status === "error" && (
              <div className="mb-4 p-3 border border-red-900 rounded">
                <p className="text-xs text-red-400">{errorMsg}</p>
              </div>
            )}

            <button onClick={handleCreate} disabled={status === "sending" || !address}
              className="w-full h-10 border border-neutral-700 rounded hover:bg-neutral-900 disabled:border-neutral-800 disabled:text-neutral-700 text-sm text-neutral-400 transition-colors flex items-center justify-center gap-2">
              {status === "sending" ? (
                <><span className="w-3.5 h-3.5 border border-neutral-600 rounded-full animate-spin" />sending...</>
              ) : !address ? (
                "connect wallet first"
              ) : (
                `Create Market (${CREATION_FEE} avax)`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
