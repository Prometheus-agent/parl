"use client";

import { useWallet } from "@/lib/wallet-context";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

export function WalletButton() {
  const { address, chainId, balance, username, connect, disconnect } = useWallet();
  const { isConnecting } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-28 border border-neutral-800 rounded animate-pulse" />;
  }

  if (address) {
    const wrongChain = chainId !== null && chainId !== 43113;
    const displayName = username || address.slice(0, 6) + "..." + address.slice(-4);

    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <div className="text-xs px-2 py-1 border border-amber-800 rounded text-amber-400 whitespace-nowrap">
            wrong network
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 rounded">
          <div className="flex flex-col items-end">
            <span className="text-xs text-neutral-300">{displayName}</span>
            {balance !== null && (
              <span className="text-[10px] text-neutral-600">{balance} avax</span>
            )}
          </div>
          <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
            {username ? username[0].toUpperCase() : address.slice(2, 4).toUpperCase()}
          </div>
          <button onClick={disconnect}
            className="text-xs text-neutral-600 hover:text-red-400 transition-colors ml-1"
            title="Disconnect">x</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={connect}
      className="px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 text-xs text-neutral-400 transition-colors"
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
