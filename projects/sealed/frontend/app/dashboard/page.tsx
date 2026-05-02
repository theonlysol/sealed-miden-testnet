"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/hooks/use-miden-client";
import type { MidenCredential } from "@/lib/miden-wasm-mock";

export default function DashboardPage() {
  const { isConnected } = useWallet();

  // Use the initialisation-gated hook — no WASM method is called before `ready`.
  const { ready, error: initError, getVaultCredentials, getReputationTier, generateProof } =
    useMidenClient();

  const [credentials, setCredentials] = useState<MidenCredential[]>([]);
  const [tier, setTier]               = useState<string>("Bronze");
  const [loading, setLoading]         = useState(true);
  const [proof, setProof]             = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Guard: only load vault data once the wallet is connected AND the WASM
    // module has finished initialising (`ready === true`).
    // Without this guard, the dashboard would call getVaultCredentials()
    // before the async WASM init resolves, causing a race condition.
    if (!isConnected || !ready) return;

    const loadVault = async () => {
      setLoading(true);
      try {
        const [creds, tierData] = await Promise.all([
          getVaultCredentials(),
          getReputationTier(),
        ]);
        setCredentials(creds);
        setTier(tierData.tier);
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [isConnected, ready, getVaultCredentials, getReputationTier]);

  const handleGenerateProof = async () => {
    // ready is guaranteed true here because the button is only rendered
    // after the vault loads (which requires ready === true above).
    setIsGenerating(true);
    setProof(null);
    try {
      const p = await generateProof(200); // threshold for demo
      setProof(p);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      alert("Failed to generate proof: " + msg);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Vault Locked</h2>
          <p className="text-muted-foreground">Connect your wallet to access your private credentials.</p>
        </div>
      </div>
    );
  }

  // Show init error (e.g. missing env var) prominently before trying to render vault
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

  // Show WASM loading state while init is in progress
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="size-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Initialising Miden WASM client…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Vault</h1>
          <p className="text-muted-foreground">Manage your private credentials on the Miden network.</p>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-zinc-900/50">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reputation Tier</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              {loading ? "…" : tier}
            </span>
          </div>
          <div className="h-10 w-px bg-border mx-2" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Credentials</span>
            <span className="text-xl font-bold text-zinc-100">{loading ? "…" : credentials.length}</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Credential Collection</h2>
          <button
            onClick={handleGenerateProof}
            disabled={isGenerating || loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 shadow transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
          >
            {isGenerating ? "Generating ZK Proof…" : "Prove Reputation"}
          </button>
        </div>

        {proof && (
          <div className="mb-8 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">Generated Proof (Base64)</h3>
            <p className="font-mono text-xs text-zinc-500 break-all bg-zinc-950 p-3 rounded border border-zinc-800">
              {proof}
            </p>
            <p className="text-xs text-zinc-400">Share this proof string to prove you meet the threshold without revealing your score.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Loading credentials…</div>
          ) : credentials.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-zinc-800 rounded-xl">
              No credentials found.
            </div>
          ) : (
            credentials.map((cred) => (
              <div key={cred.id} className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm transition-all hover:border-zinc-700">
                <div className="space-y-3">
                  <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                    {cred.type}
                  </div>
                  <h3 className="font-medium text-zinc-200 truncate" title={cred.issuer}>
                    Issuer: {cred.issuer}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
                  <span>Issued</span>
                  <span>{new Date(cred.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
