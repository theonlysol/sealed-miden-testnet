/**
 * hooks/use-miden-client.ts
 *
 * React hook that provides a safe, initialisation-gated handle to the
 * Miden WASM client.
 *
 * WHY THIS IS NEEDED
 * ------------------
 * The real miden-client WASM module is loaded asynchronously via
 * `await import("miden-client")`. Any call made before the module resolves
 * will throw or return undefined. This hook wraps that async initialisation
 * behind a `ready` boolean so every consumer can guard its RPC calls:
 *
 *   const { client, ready } = useMidenClient();
 *   if (!ready) return <Spinner />;
 *   await client.generateProof(threshold);
 *
 * During development, the real WASM import is replaced with the midenWasm
 * mock from lib/miden-wasm-mock.ts. The hook still simulates async init
 * (300 ms delay) so components behave identically to production.
 *
 * ENVIRONMENT VALIDATION
 * ----------------------
 * On mount, the hook calls getMidenRpcUrlOrMock() which will throw (and set
 * an `error` state) if NEXT_PUBLIC_MIDEN_RPC_URL is missing in a production
 * build, blocking all RPC calls before they happen.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { midenWasm } from "@/lib/miden-wasm-mock";
import { getMidenRpcUrlOrMock } from "@/lib/config";
import type { CredentialType, MidenCredential, ProofVerificationResult } from "@/lib/miden-wasm-mock";

export interface MidenClientHandle {
  /** True once the WASM module has finished loading and the RPC URL is validated. */
  ready: boolean;
  /** Non-null when initialisation failed (e.g. missing env var). */
  error: string | null;
  /** The RPC endpoint that was resolved from env (for display / debug). */
  rpcUrl: string | null;
  /** Safe wrappers — each checks `ready` before calling the underlying WASM. */
  getVaultCredentials: () => Promise<MidenCredential[]>;
  getReputationTier: () => Promise<{ tier: string; minScore: number }>;
  generateProof: (threshold: number) => Promise<string>;
  verifyProof: (proofString: string, requiredThreshold: number) => Promise<ProofVerificationResult>;
  issueCredential: (recipient: string, type: CredentialType, score: number) => Promise<boolean>;
}

export function useMidenClient(): MidenClientHandle {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);

  // Ref flag prevents calling setState after unmount during the async init.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function init() {
      try {
        // 1. Validate the env var first — throws immediately if missing in prod.
        const url = getMidenRpcUrlOrMock();

        // 2. Simulate async WASM module loading.
        //    In production replace this block with:
        //      const wasmModule = await import("miden-client");
        //      await wasmModule.default(); // run wasm-bindgen init
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        if (!mounted.current) return; // component unmounted during init
        setRpcUrl(url);
        setReady(true);
      } catch (err: unknown) {
        if (!mounted.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        // ready stays false — all method calls will throw a clear error.
      }
    }

    init();

    return () => {
      mounted.current = false;
    };
  }, []);

  /** Guards every public method — throws if called before WASM is ready. */
  const assertReady = useCallback(() => {
    if (!ready) {
      throw new Error(
        error
          ? `[useMidenClient] Init failed: ${error}`
          : "[useMidenClient] WASM module not yet initialised. " +
            "Check the `ready` flag before calling any client method."
      );
    }
  }, [ready, error]);

  return {
    ready,
    error,
    rpcUrl,

    getVaultCredentials: useCallback(async () => {
      assertReady();
      return midenWasm.getVaultCredentials();
    }, [assertReady]),

    getReputationTier: useCallback(async () => {
      assertReady();
      return midenWasm.getReputationTier();
    }, [assertReady]),

    generateProof: useCallback(async (threshold: number) => {
      assertReady();
      return midenWasm.generateProof(threshold);
    }, [assertReady]),

    verifyProof: useCallback(async (proofString: string, requiredThreshold: number) => {
      assertReady();
      // Pass rpcUrl to the mock so it can log which node it would hit.
      return midenWasm.verifyProof(proofString, requiredThreshold, rpcUrl ?? undefined);
    }, [assertReady, rpcUrl]),

    issueCredential: useCallback(async (recipient: string, type: CredentialType, score: number) => {
      assertReady();
      return midenWasm.issueCredential(recipient, type, score);
    }, [assertReady]),
  };
}
