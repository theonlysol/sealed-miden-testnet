/**
 * lib/config.ts
 *
 * Centralised environment variable validation for the Sealed frontend.
 *
 * All NEXT_PUBLIC_* vars are injected at build time by Next.js. Reading them
 * here (rather than inline in components) gives us one place to catch
 * misconfiguration and a clear error instead of a silent undefined RPC call.
 *
 * HOW TO USE:
 *   import { getMidenRpcUrl } from "@/lib/config";
 *   const rpcUrl = getMidenRpcUrl();  // throws if not set
 */

/**
 * Returns the Miden node RPC endpoint URL.
 *
 * Reads from NEXT_PUBLIC_MIDEN_RPC_URL (set in .env.local).
 * Throws a descriptive error at call-time if the variable is missing or empty,
 * so developers see the problem immediately rather than getting a confusing
 * network error from a fetch() to "undefined".
 */
export function getMidenRpcUrl(): string {
  const url = process.env.NEXT_PUBLIC_MIDEN_RPC_URL;

  if (!url || url.trim() === "") {
    // Provide a developer-friendly message with the exact fix needed.
    throw new Error(
      "[Sealed] NEXT_PUBLIC_MIDEN_RPC_URL is not set.\n" +
      "Create a .env.local file in the frontend/ directory and add:\n" +
      "  NEXT_PUBLIC_MIDEN_RPC_URL=https://your-miden-node-rpc-endpoint\n" +
      "See frontend/.env.local.example for a template."
    );
  }

  return url.trim();
}

/**
 * Returns the RPC URL if set, or a fallback mock URL for development.
 * Use this in components that should degrade gracefully when no node is
 * configured (e.g. the mock layer can intercept the call).
 */
export function getMidenRpcUrlOrMock(): string {
  try {
    return getMidenRpcUrl();
  } catch {
    // During local development with the WASM mock, return a sentinel value
    // that the mock layer recognises and intercepts instead of hitting the network.
    return "mock://miden-node-rpc";
  }
}
