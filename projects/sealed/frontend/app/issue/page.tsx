"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/hooks/use-miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";

const SEALED_CONTRACT_ID = process.env.NEXT_PUBLIC_SEALED_CONTRACT_ID || "0x93e850a8cc056880583d262ab400d2";

export default function IssuePage() {
  const { connected, address, requestTransaction } = useWallet();
  const { ready, error: initError, syncState } = useMidenClient();

  const [recipient, setRecipient]   = useState("");
  const [type, setType]             = useState("Governance");
  const [score, setScore]           = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txId, setTxId]             = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !score || !requestTransaction || !address) return;

    setIsSubmitting(true);
    setTxId(null);

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
      setTxId(txId);
      
      setRecipient("");
      setScore("50");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to issue credential.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Issuer Portal Locked</h2>
          <p className="text-muted-foreground">Connect your authorized issuer wallet to issue credentials.</p>
        </div>
      </div>
    );
  }

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
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Issue Credential</h1>
        <p className="text-muted-foreground">
          Sign and submit a new credential issuance transaction to the Miden network.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm relative overflow-hidden">
        {!ready && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-medium text-sm text-muted-foreground">Initializing Miden WASM client…</p>
          </div>
        )}

        {isSubmitting && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-medium text-white">Requesting Wallet Signature…</p>
          </div>
        )}

        {txId && (
          <div className="mb-8 p-4 rounded-lg border border-green-800 bg-green-950/20 space-y-2">
            <h3 className="text-sm font-medium text-green-400">Credential Issued</h3>
            <p className="font-mono text-xs text-green-300 break-all">TX: {txId}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label htmlFor="recipient" className="text-sm font-medium leading-none">Recipient Address</label>
            <input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium leading-none">Credential Type</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-zinc-950 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Governance">Governance (4×)</option>
                <option value="Contract">Completed Contract (3×)</option>
                <option value="Rating">Rating (2×)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="score" className="text-sm font-medium leading-none">Raw Score (1–100)</label>
              <input
                id="score"
                type="number"
                min="1"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !ready}
            className="inline-flex w-full h-10 items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 shadow transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {!ready ? "Awaiting WASM init…" : "Sign & Issue Credential"}
          </button>
        </form>
      </div>
    </div>
  );
}
