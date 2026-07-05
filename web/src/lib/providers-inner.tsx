"use client";

import * as React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultWagmiConfig, createWeb3Modal } from "@web3modal/wagmi";
import { avalancheFuji } from "wagmi/chains";
import { WalletProvider } from "./wallet-context";

const projectId = "d27815b1d09376b7e00baf6ca4ebfda9";

const wagmiConfig = defaultWagmiConfig({
  chains: [avalancheFuji],
  projectId,
  metadata: {
    name: "Parl Markets",
    description: "Parimutuel Prediction Markets",
    url: "https://parlmarket.xyz",
    icons: ["https://parlmarket.xyz/favicon.svg"],
  },
  enableInjected: true,
  enableWalletConnect: true,
  enableCoinbase: true,
});

export { wagmiConfig, projectId };

const queryClient = new QueryClient();

// Init modal once at the module level (synchronous, runs on client)
let modal: ReturnType<typeof createWeb3Modal> | null = null;

export function initModal() {
  if (typeof window === "undefined") return null;
  if (!modal) {
    modal = createWeb3Modal({
      wagmiConfig,
      projectId,
      themeMode: "dark",
    });
  }
  return modal;
}

export default function ProvidersInner({ children }: { children: React.ReactNode }) {
  // Init Web3Modal alongside WagmiProvider so they share the same config
  React.useEffect(() => {
    const m = initModal();
    (window as any).__w3m_modal = m;
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
