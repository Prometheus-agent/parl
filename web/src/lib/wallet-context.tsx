"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

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

interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  username: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  setUsername: (name: string) => void;
}

const WalletContext = createContext<WalletState & WalletActions>({
  address: null,
  chainId: null,
  balance: null,
  username: null,
  connect: async () => {},
  disconnect: () => {},
  setUsername: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

async function switchToFuji(): Promise<boolean> {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xa869" }],
    });
    return true;
  } catch (e: any) {
    if (e.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xa869",
            chainName: "Avalanche Fuji",
            nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
            rpcUrls: ["https://avalanche-fuji.infura.io/v3/8d35b5c2615049d685361e028b7661fe"],
            blockExplorerUrls: ["https://testnet.snowscan.xyz"],
          }],
        });
        return true;
      } catch {}
    }
    return false;
  }
}

function getStoredUsername(address: string | null): string | null {
  if (!address) return null;
  return localStorage.getItem(`parl_username_${address.toLowerCase()}`);
}

function storeUsername(address: string, name: string) {
  localStorage.setItem(`parl_username_${address.toLowerCase()}`, name);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    username: null,
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const updateState = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      setState({ address: null, chainId: null, balance: null, username: null });
      return;
    }
    const addr = accounts[0];
    const bal = await window.ethereum!.request({
      method: "eth_getBalance",
      params: [addr, "latest"],
    });
    const chain = await window.ethereum!.request({ method: "eth_chainId" });
    const savedName = getStoredUsername(addr);

    setState({
      address: addr,
      chainId: Number(chain),
      balance: (BigInt(bal) / BigInt(10) ** BigInt(18)).toString(),
      username: savedName,
    });

    // If no username saved, show the modal
    if (!savedName && accounts.length > 0) {
      setShowUsernameModal(true);
    }
  }, []);

  // Init on mount
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) updateState(accounts);
    });

    window.ethereum.on("accountsChanged", updateState);
    window.ethereum.on("chainChanged", () => {
      window.ethereum!.request({ method: "eth_accounts" }).then(updateState);
    });

    return () => {
      window.ethereum?.removeListener("accountsChanged", updateState);
      window.ethereum?.removeListener("chainChanged", () => {});
    };
  }, [updateState]);

  const connect = useCallback(async () => {
    if (!window.ethereum) return;
    await switchToFuji();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      await updateState(accounts);
      // Ensure Fuji
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      if (Number(chain) !== 43113) {
        await switchToFuji();
      }
    }
  }, [updateState]);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, balance: null, username: null });
  }, []);

  const setUsername = useCallback((name: string) => {
    if (!state.address) return;
    storeUsername(state.address, name);
    setState(prev => ({ ...prev, username: name }));
    setShowUsernameModal(false);
  }, [state.address]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, setUsername }}>
      {children}
      <UsernameModal
        open={showUsernameModal && !!state.address}
        onSubmit={setUsername}
        onSkip={() => setShowUsernameModal(false)}
      />
    </WalletContext.Provider>
  );
}

function UsernameModal({ open, onSubmit, onSkip }: { open: boolean; onSubmit: (name: string) => void; onSkip: () => void }) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-zinc-900 border border-white/[0.08] p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-lg mx-auto mb-3 shadow-lg">
            👤
          </div>
          <h2 className="text-base font-heading font-bold text-white">Welcome to Parl</h2>
          <p className="text-xs text-white/40 mt-1 font-body">Choose a display name so others can see you on the platform.</p>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your display name"
          maxLength={24}
          autoFocus
          className="w-full h-10 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white outline-none focus:border-purple-500/50 placeholder:text-white/20 mb-4"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit(name.trim()); }}
        />

        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/50 hover:text-white/80 transition-all"
          >
            Skip
          </button>
          <button
            onClick={() => { if (name.trim()) onSubmit(name.trim()); }}
            disabled={!name.trim()}
            className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
              name.trim()
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "bg-white/[0.06] text-white/30 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
