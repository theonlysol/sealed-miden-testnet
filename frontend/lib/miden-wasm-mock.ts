/**
 * lib/miden-wasm-mock.ts
 *
 * Simulated WASM bindings for the Miden client.
 * Provides in-process mocking for ZK operations until the real WASM is wired.
 *
 * All methods are async to match the real miden-client API surface exactly,
 * so switching from mock → real WASM requires only a one-line import change.
 *
 * The RPC URL is accepted as an optional parameter on methods that would
 * normally contact a Miden node (verifyProof). This makes the integration
 * point explicit and auditable — no hardcoded URLs anywhere in this file.
 */

export type CredentialType = "Governance" | "Contract" | "Rating";

export interface MidenCredential {
  id: string;
  type: CredentialType;
  issuer: string;
  timestamp: number;
}

export interface ProofVerificationResult {
  valid: boolean;
  message: string;
  /** The RPC endpoint that was consulted (for transparency / debugging). */
  rpcUrl?: string;
}

// ---------------------------------------------------------------------------
// In-memory session state (replaces on-chain Merkle tree for mock purposes)
// ---------------------------------------------------------------------------
const mockCredentials: MidenCredential[] = [
  { id: "c1", type: "Governance", issuer: "0x123...abc", timestamp: Date.now() - 86_400_000 },
  { id: "c2", type: "Contract",   issuer: "0x456...def", timestamp: Date.now() - 172_800_000 },
];
let mockScore = 650; // Arbitrary starting score — fits Silver or Gold tier

// ---------------------------------------------------------------------------
// Mock client object
// ---------------------------------------------------------------------------
export const midenWasm = {
  /** Returns the user's private credentials from the local vault. */
  getVaultCredentials: async (): Promise<MidenCredential[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockCredentials), 300));
  },

  /** Returns the reputation tier derived from the locally computed score. */
  getReputationTier: async (): Promise<{ tier: string; minScore: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if      (mockScore >= 1000) resolve({ tier: "Platinum", minScore: 1000 });
        else if (mockScore >= 500)  resolve({ tier: "Gold",     minScore: 500  });
        else if (mockScore >= 200)  resolve({ tier: "Silver",   minScore: 200  });
        else                        resolve({ tier: "Bronze",   minScore: 0    });
      }, 300);
    });
  },

  /**
   * Simulates ZK proof generation.
   * In production this calls the WASM `prove_threshold` which runs the MASM
   * procedure inside the Miden VM and returns an opaque proof blob.
   *
   * Returns a Base64-encoded mock proof on success.
   * Rejects (throws) on failure — matching the ERR_ASSERT_FAILED halt that the
   * real VM returns when score < threshold.
   */
  generateProof: async (threshold: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockScore >= threshold) {
          resolve(btoa(JSON.stringify({ valid: true, threshold, timestamp: Date.now() })));
        } else {
          // Mirror the exact error the Miden node RPC surfaces for a failed assert.
          reject(new Error(
            `Proof rejected: score below threshold (Miden node: ERR_ASSERT_FAILED)`
          ));
        }
      }, 1_000);
    });
  },

  /**
   * Simulates ZK proof verification against a Miden node.
   *
   * @param proofString     Base64 proof blob from generateProof.
   * @param requiredThreshold  The threshold the verifier demands.
   * @param rpcUrl          The Miden node RPC endpoint to contact.
   *                        Read from NEXT_PUBLIC_MIDEN_RPC_URL via getMidenRpcUrlOrMock().
   *                        Never hardcoded here — always injected by the caller.
   */
  verifyProof: async (
    proofString: string,
    requiredThreshold: number,
    rpcUrl?: string,
  ): Promise<ProofVerificationResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Log which node would be contacted (visible in browser devtools).
        if (rpcUrl && rpcUrl !== "mock://miden-node-rpc") {
          console.info(`[midenWasm] verifyProof → RPC node: ${rpcUrl}`);
        }

        try {
          const decoded = JSON.parse(atob(proofString));
          if (decoded.valid && decoded.threshold >= requiredThreshold) {
            resolve({ valid: true,  message: "Proof verified successfully.", rpcUrl });
          } else {
            resolve({ valid: false, message: "Proof invalid or threshold not met.", rpcUrl });
          }
        } catch {
          resolve({ valid: false, message: "Malformed proof string.", rpcUrl });
        }
      }, 1_500);
    });
  },

  /**
   * Simulates issuing a credential on-chain.
   * In production this submits a Miden transaction invoking `issue_credential`.
   */
  issueCredential: async (
    recipient: string,
    type: CredentialType,
    score: number,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const weight = type === "Governance" ? 4 : type === "Contract" ? 3 : 2;
        mockScore += score * weight;
        mockCredentials.push({
          id: `c${Date.now()}`,
          type,
          issuer: `${recipient.slice(0, 8)}... (Mock Issuer)`,
          timestamp: Date.now(),
        });
        resolve(true);
      }, 2_000);
    });
  },
};
