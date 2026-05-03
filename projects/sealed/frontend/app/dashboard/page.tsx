"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/hooks/use-miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";

const SEALED_CONTRACT_ID = process.env.NEXT_PUBLIC_SEALED_CONTRACT_ID || "0x93e850a8cc056880583d262ab400d2";

export default function DashboardPage() {
  const { connected, address, requestTransaction } = useWallet();
  const { ready, error: initError, syncState } = useMidenClient();

  const [lastBlock, setLastBlock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !ready) return;

    const sync = async () => {
      setLoading(true);
      try {
        const block = await syncState();
        setLastBlock(block);
      } catch (e) {
        console.error("Sync failed:", e);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, [connected, ready, syncState]);

  const handleProveReputation = async () => {
    if (!connected || !address || !requestTransaction || !ready) return;
    
    setIsGenerating(true);
    setTxId(null);
    try {
      await syncState();

      // We need a valid serialized TransactionRequest.
      // We use the SDK's TransactionRequestBuilder to create an empty but valid one.
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

      const result = await requestTransaction(transaction);
      setTxId(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      alert("Failed to prove reputation: " + msg);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Vault Locked</h2>
          <p className="text-muted-foreground">Connect your Miden wallet to access your private credentials.</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-lg text-center space-y-4 p-6 rounded-xl border border-red-900 bg-red-950/20">
          <h2 className="text-xl font-bold text-red-400">SDK Initialization Error</h2>
          <p className="text-red-300 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="size-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing Miden WebClient (WASM)...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Vault
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">My Vault</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-zinc-800"></span>
            Account: <span className="font-mono text-zinc-100 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800/50">{address?.slice(0, 8)}...{address?.slice(-8)}</span>
          </p>
        </div>
        
        <div className="glass glow-green p-5 rounded-2xl border border-zinc-800/50 flex items-center gap-5 min-w-[240px]">
          <div className="size-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="M16 5V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2"/><path d="M10 10l4 4"/><path d="M14 10l-4 4"/><path d="M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><circle cx="18" cy="18" r="3"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Current Height</span>
            <span className="text-2xl font-black text-white tracking-tighter">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-green-500 border-t-transparent animate-spin rounded-full"></span>
                  SYNCING
                </span>
              ) : (
                `#${lastBlock !== null ? lastBlock.toLocaleString() : "???"}`
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Private Credentials</h2>
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 text-[10px] font-bold border border-zinc-800">ZERO-KNOWLEDGE</span>
          </div>
          <button
            onClick={handleProveReputation}
            disabled={isGenerating || loading}
            className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-white px-6 font-bold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <span className="size-4 border-2 border-zinc-900 border-t-transparent animate-spin rounded-full"></span>
                  GENERATING PROOF
                </>
              ) : (
                <>
                  PROVE REPUTATION
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </>
              )}
            </span>
          </button>
        </div>

        {txId && (
          <div className="mb-10 p-5 rounded-2xl glass border-green-500/20 bg-green-500/5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Proof Submitted to Miden</h3>
              <p className="font-mono text-xs text-green-400/80 break-all bg-green-500/10 p-2 rounded border border-green-500/10">
                {txId}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full py-20 glass border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 hover-scale cursor-default group">
            <div className="size-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-zinc-400 transition-colors"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="max-w-xs">
              <h3 className="text-white font-bold mb-1">Secure Client-Side Storage</h3>
              <p className="text-sm text-muted-foreground">
                All credentials remain fully private within your browser&apos;s WASM-encrypted vault.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
