"use client";

import { useWallet } from "@/lib/wallet-context";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, cb: (...args: any[]) => void) => void;
      removeListener: (event: string, cb: (...args: any[]) => void) => void;
    };
  }
}

export function WalletButton() {
  const { address, chainId, balance, username, connect, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-28 rounded-lg bg-white/[0.06] animate-pulse" />;
  }

  if (typeof window === "undefined" || !window.ethereum) {
    return (
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
        className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-medium text-white transition-all"
      >Install MetaMask</a>
    );
  }

  if (address) {
    const wrongChain = chainId !== null && chainId !== 43113;
    const displayName = username || address.slice(0, 6) + "..." + address.slice(-4);

    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <div className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            ⚠ Wrong network
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08]">
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/80 font-medium leading-tight">
              {displayName}
            </span>
            {balance !== null && (
              <span className="text-[10px] text-white/30 leading-tight">{balance} AVAX</span>
            )}
          </div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-[10px] font-bold shadow-sm">
            {username ? username[0].toUpperCase() : address.slice(2, 4).toUpperCase()}
          </div>
          <button onClick={disconnect}
            className="text-[10px] text-white/30 hover:text-red-400 transition-colors ml-1"
            title="Disconnect">✕</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={connect}
      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
    >Connect Wallet</button>
  );
}
