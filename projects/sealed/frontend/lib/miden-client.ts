/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";

export interface MidenClientHandle {
  ready: boolean;
  error: string | null;
  client: unknown;
  syncState: () => Promise<number>;
}

export function useMidenClient(): MidenClientHandle {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<unknown>(null);

  useEffect(() => {
    let activeClient: unknown = null;

    async function init() {
      try {
        const sdk = await import("@miden-sdk/miden-sdk");
        const rpcUrl = process.env.NEXT_PUBLIC_MIDEN_RPC_URL || "https://rpc.testnet.miden.io:443";
        
        const midenClient = await (sdk as any).WasmWebClient.createClient(rpcUrl);
        
        activeClient = midenClient;
        setClient(midenClient);
        setReady(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error("Miden SDK init failed:", err);
      }
    }

    init();

    return () => {
      if (activeClient) {
        if (typeof (activeClient as any).close === "function") (activeClient as any).close();
        else if (typeof (activeClient as any).terminate === "function") (activeClient as any).terminate();
      }
    };
  }, []);

  const syncState = useCallback(async () => {
    if (!client) throw new Error("Client not ready");
    const summary = await (client as { syncState: () => Promise<any> }).syncState();
    // Use .blockNum() as a function if available (WASM class), otherwise fall back to property
    const blockNum = typeof summary.blockNum === 'function' ? summary.blockNum() : summary.blockNum;
    return Number(blockNum);
  }, [client]);

  return {
    ready,
    error,
    client,
    syncState,
  };
}
