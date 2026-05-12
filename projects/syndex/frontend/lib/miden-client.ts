/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";

export interface MidenClientHandle {
  ready: boolean;
  error: string | null;
  client: any;
  syncState: () => Promise<number>;
}

export function useMidenClient(): MidenClientHandle {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    let activeClient: any = null;

    async function init() {
      try {
        const sdk = await import("@miden-sdk/miden-sdk");
        const rpcUrl = process.env.NEXT_PUBLIC_MIDEN_RPC_URL || "https://rpc.testnet.miden.io:443";
        
        // Adapting from sealed pattern but using WebClient if available, otherwise fallback
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
        if (typeof activeClient.close === "function") activeClient.close();
        else if (typeof activeClient.terminate === "function") activeClient.terminate();
      }
    };
  }, []);

  const syncState = useCallback(async () => {
    if (!client) throw new Error("Client not ready");
    const summary = await client.syncState();
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
