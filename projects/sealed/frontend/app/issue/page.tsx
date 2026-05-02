"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/hooks/use-miden-client";
import type { CredentialType } from "@/lib/miden-wasm-mock";

export default function IssuePage() {
  const { isConnected } = useWallet();

  // Gate: issueCredential must not fire before the WASM module is ready.
  const { ready, error: initError, issueCredential } = useMidenClient();

  const [recipient, setRecipient]   = useState("");
  const [type, setType]             = useState<CredentialType>("Governance");
  const [score, setScore]           = useState("50");
  const [notes, setNotes]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus]     = useState<"idle" | "pending" | "finalized">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !score) return;

    // Extra runtime guard — submit button is already disabled when !ready,
    // but we guard here too in case of programmatic calls.
    if (!ready) {
      alert("Miden WASM client is still initialising. Please wait.");
      return;
    }

    setIsSubmitting(true);
    setTxStatus("pending");

    try {
      await issueCredential(recipient, type, parseInt(score, 10));
      setTxStatus("finalized");
      setRecipient("");
      setScore("50");
      setNotes("");
    } catch {
      alert("Failed to issue credential.");
      setTxStatus("idle");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setTxStatus("idle"), 5_000);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Issuer Portal Locked</h2>
          <p className="text-muted-foreground">Connect your authorized issuer wallet to issue credentials.</p>
        </div>
      </div>
    );
  }

  // Show env/init error prominently
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-lg text-center space-y-4 p-6 rounded-xl border border-red-900 bg-red-950/20">
          <h2 className="text-xl font-bold text-red-400">Client Init Error</h2>
          <pre className="text-xs text-left text-red-300 bg-zinc-950 p-4 rounded overflow-auto whitespace-pre-wrap">
            {initError}
          </pre>
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
        {/* WASM initialising overlay */}
        {!ready && !initError && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-medium text-sm text-muted-foreground">Initialising Miden WASM client…</p>
          </div>
        )}

        {txStatus === "pending" && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-medium">Submitting to Miden Testnet…</p>
          </div>
        )}

        {txStatus === "finalized" && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
            <div className="size-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-xl font-bold text-green-500">Transaction Finalized</h3>
            <p className="text-sm text-zinc-400">Credential successfully issued to recipient.</p>
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
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium leading-none">Credential Type</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as CredentialType)}
                className="flex h-9 w-full rounded-md border border-input bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium leading-none">Notes (Optional)</label>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal memo…"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            // Disabled until WASM is ready — prevents premature on-chain call
            disabled={isSubmitting || !ready}
            className="inline-flex w-full h-10 items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 shadow transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
          >
            {!ready ? "Awaiting WASM init…" : "Sign & Issue Credential"}
          </button>
        </form>
      </div>
    </div>
  );
}
