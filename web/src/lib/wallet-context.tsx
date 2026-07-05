"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAccount, useBalance, useChainId, useDisconnect, useSwitchChain } from "wagmi";

import { projectId } from "./wagmi-config";

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

function getStoredUsername(address: string | null): string | null {
  if (!address) return null;
  return localStorage.getItem(`parl_username_${address.toLowerCase()}`);
}

function storeUsername(address: string, name: string) {
  localStorage.setItem(`parl_username_${address.toLowerCase()}`, name);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({ address: wagmiAddress });
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    username: null,
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Sync wagmi state to our context
  useEffect(() => {
    if (isConnected && wagmiAddress) {
      const savedName = getStoredUsername(wagmiAddress);
      setState({
        address: wagmiAddress,
        chainId,
        balance: balanceData ? (balanceData as any).formatted.slice(0, 8) : null,
        username: savedName,
      });

      if (chainId !== 43113 && mounted) {
        switchChain({ chainId: 43113 });
      }

      if (!savedName && mounted) {
        setShowUsernameModal(true);
      }
    } else {
      setState({ address: null, chainId: null, balance: null, username: null });
    }
  }, [isConnected, wagmiAddress, chainId, balanceData, switchChain, mounted]);

  const connect = useCallback(async () => {
    const modal = (window as any).__w3m_modal;
    if (modal) modal.open();
  }, []);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    setState({ address: null, chainId: null, balance: null, username: null });
  }, [wagmiDisconnect]);

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
        open={showUsernameModal && mounted && isConnected}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm mx-4 border border-neutral-800 rounded bg-black p-6">
        <h2 className="text-sm font-medium text-neutral-300 mb-1">Welcome to Parl</h2>
        <p className="text-xs text-neutral-600 mb-4">Choose a display name so others can see you on the platform.</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="display name"
          maxLength={24}
          autoFocus
          className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-white outline-none focus:border-neutral-600 placeholder:text-neutral-700 mb-3"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit(name.trim()); }}
        />

        <div className="flex gap-2">
          <button onClick={onSkip}
            className="flex-1 h-9 border border-neutral-800 rounded text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            Skip
          </button>
          <button onClick={() => { if (name.trim()) onSubmit(name.trim()); }}
            disabled={!name.trim()}
            className={`flex-1 h-9 rounded text-xs transition-colors ${
              name.trim()
                ? "border border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                : "border border-neutral-800 text-neutral-700 cursor-not-allowed"
            }`}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
