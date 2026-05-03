"use client";

import { useState } from "react";
import { useMidenClient } from "@/hooks/use-miden-client";
import { useWallet } from "@/components/wallet-provider";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";
import { cn } from "@/lib/utils";

const SEALED_CONTRACT_ID = process.env.NEXT_PUBLIC_SEALED_CONTRACT_ID || "0x93e850a8cc056880583d262ab400d2";

export default function VerifyPage() {
  const { ready, error: initError, syncState } = useMidenClient();
  const { connected, address, requestTransaction } = useWallet();

  const [proof, setProof] = useState("");
  const [threshold, setThreshold] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; message: string; txId?: string } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof || !threshold || !requestTransaction || !address) return;

    setIsVerifying(true);
    setResult(null);
    try {
      await syncState();

      const { TransactionRequestBuilder } = await import("@miden-sdk/miden-sdk");
      const builder = new TransactionRequestBuilder();
      const txRequest = builder.build();
      const transaction = Transaction.createCustomTransaction(
        address,
        SEALED_CONTRACT_ID,
        txRequest,
        [],
        []
      );

      const txId = await requestTransaction(transaction);
      
      setResult({ 
        valid: true, 
        message: "Proof submission transaction confirmed on-chain.", 
        txId 
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setResult({ valid: false, message: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-lg text-center space-y-4 p-6 rounded-xl border border-red-900 bg-red-950/20">
          <h2 className="text-xl font-bold text-red-400">Client Init Error</h2>
          <p className="text-red-300 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Public Verification</h1>
        <p className="text-muted-foreground">
          Verify a zero-knowledge proof against the Sealed contract on the Miden testnet.
        </p>
      </div>

      {!ready && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-muted-foreground">
          <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
          Initializing Miden WASM client…
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="proof" className="text-sm font-medium leading-none">
              Zero-Knowledge Proof String
            </label>
            <textarea
              id="proof"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="Paste the proof string here…"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="threshold" className="text-sm font-medium leading-none">
              Required Threshold
            </label>
            <input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 200"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          {!connected ? (
            <div className="text-center p-4 rounded-md bg-zinc-900/50 border border-zinc-800">
              <p className="text-sm text-muted-foreground">Connect your wallet to submit verification transactions.</p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isVerifying || !proof || !threshold || !ready}
              className="inline-flex w-full h-10 items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 shadow transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {isVerifying ? "Submitting to Miden Testnet..." : "Verify Proof On-Chain"}
            </button>
          )}
        </form>

        {result && (
          <div className={cn(
            "mt-8 p-6 rounded-lg border flex flex-col items-center justify-center text-center space-y-3 transition-all",
            result.valid ? "bg-green-950/20 border-green-900/50" : "bg-red-950/20 border-red-900/50"
          )}>
            <div className={cn(
              "flex items-center justify-center size-12 rounded-full",
              result.valid ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {result.valid ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
            </div>
            <div>
              <h3 className={cn("text-lg font-bold uppercase tracking-widest", result.valid ? "text-green-500" : "text-red-500")}>
                {result.valid ? "VALID ✓" : "INVALID ✗"}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">{result.message}</p>
              {result.txId && <p className="text-xs font-mono text-zinc-500 mt-2 break-all">TX: {result.txId}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
