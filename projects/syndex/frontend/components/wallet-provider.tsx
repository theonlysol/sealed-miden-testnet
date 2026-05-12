"use client";

import { ReactNode, useMemo } from "react";
import { WalletProvider as MidenWalletProvider } from "@demox-labs/miden-wallet-adapter";
import { WalletModalProvider } from "@demox-labs/miden-wallet-adapter-reactui";
import { MidenWalletAdapter } from "@demox-labs/miden-wallet-adapter-miden";
import "@demox-labs/miden-wallet-adapter-reactui/styles.css";

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [
    new MidenWalletAdapter(),
  ], []);

  return (
    <MidenWalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </MidenWalletProvider>
  );
}

export { useWallet } from "@demox-labs/miden-wallet-adapter";
