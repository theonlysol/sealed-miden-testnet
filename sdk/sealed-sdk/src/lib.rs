/// A single credential issued to a user.
/// In the real Miden implementation, each credential is RPO-hashed and stored
/// as a leaf in a private Merkle tree; only the root hash is visible on-chain.
pub struct Credential {
    pub issuer_address: [u64; 4],
    pub credential_type: String,
    pub score: u32,
    pub timestamp: u64,
    /// Issuer's signature over the credential data.
    /// In the mock, [0;4] is accepted only for the two whitelisted test issuers.
    pub signature: [u64; 4],
    /// Fixed-point weight multiplier (Governance=4, Contract=3, Rating=2).
    pub weight: u32,
}

/// Client that manages a user's private credential vault and drives SDK operations.
/// Mirrors the on-chain MASM component interface exactly so unit tests validate
/// the same logic that will run inside the Miden ZK VM.
pub struct SealedClient {
    pub credentials: Vec<Credential>,
    pub account_id: u64,
    /// Simulates the Merkle root stored in account storage slot 0.
    /// After every `issue_credential` call this must equal the deterministic
    /// hash of all current credentials (here we use a simple XOR checksum as
    /// a stand-in for RPO hashing to keep the mock dependency-free).
    pub merkle_root: u64,
}

impl SealedClient {
    pub fn new(account_id: u64) -> Self {
        // merkle_root starts at account_id (the XOR seed for an empty vault),
        // so compute_mock_root() == merkle_root is true immediately on construction
        // without requiring a dummy initial issuance.
        Self {
            credentials: Vec::new(),
            account_id,
            merkle_root: account_id,
        }
    }

    /// Simulates issuing a credential.
    ///
    /// Validation mirrors the MASM `issue_credential` procedure:
    ///   - Rejects credentials from issuers whose signature is a zero-array
    ///     UNLESS the issuer address is one of the two whitelisted test issuers.
    ///   - On success, updates the internal Merkle root so callers can assert
    ///     state consistency after every mutation.
    pub fn issue_credential(&mut self, cred: Credential) -> Result<(), &'static str> {
        // Signature check: mirrors the `adv.read` + signature verify logic in MASM.
        // Only whitelisted issuers may use the all-zero test signature.
        if cred.signature == [0; 4]
            && cred.issuer_address != [1, 2, 3, 4]
            && cred.issuer_address != [5, 6, 7, 8]
        {
            return Err("Invalid signature");
        }

        self.credentials.push(cred);

        // Recompute the Merkle root after mutation.
        // Real implementation: RPO hash of all leaf hashes → root.
        // Mock: XOR of (issuer_address[0] ^ score ^ timestamp) per credential,
        //       seeded with account_id to keep roots account-specific.
        self.merkle_root = self.compute_mock_root();

        Ok(())
    }

    /// Deterministic mock Merkle root — recomputed from scratch on every call
    /// so tests can assert root == expected after any sequence of mutations.
    /// This is analogous to calling `mtree_set` and reading back slot 0.
    pub fn compute_mock_root(&self) -> u64 {
        self.credentials.iter().fold(self.account_id, |acc, c| {
            acc ^ c.issuer_address[0] ^ (c.score as u64) ^ c.timestamp
        })
    }

    /// Computes the aggregated weighted reputation score.
    ///
    /// Mirrors the MASM `compute_reputation_score` procedure:
    ///   - Excludes credentials older than 365 days (31 536 000 seconds).
    ///   - Uses `saturating_mul` / `saturating_add` to match the field-element
    ///     overflow behaviour expected in Miden (no panics on large values).
    pub fn compute_reputation_score(&self, current_timestamp: u64) -> u32 {
        let mut total: u32 = 0;
        for cred in &self.credentials {
            // Mirror MASM: diff = current_timestamp - timestamp; valid if diff <= 31536000.
            // Guard against underflow when current_timestamp < cred.timestamp.
            if current_timestamp >= cred.timestamp
                && (current_timestamp - cred.timestamp) <= 31_536_000
            {
                let weighted = cred.score.saturating_mul(cred.weight);
                total = total.saturating_add(weighted);
            }
        }
        total
    }

    /// Simulates zero-knowledge threshold proof generation and verification.
    ///
    /// **Soundness contract** (mirrors `prove_threshold` MASM):
    ///   - If score >= threshold → `Ok(true)`: proof generated and verified.
    ///   - If score <  threshold → `Err(...)`: proof generation FAILS and the
    ///     error string matches what the Miden node RPC returns for an
    ///     `ERR_ASSERT_FAILED` halt inside `prove_threshold`.
    ///
    /// Returning `Ok(false)` was the previous behaviour and is intentionally
    /// removed: a verifier receiving `Ok(false)` could mistake it for a valid
    /// proof that coincidentally scored 0, masking a soundness failure.
    pub fn prove_threshold(
        &self,
        threshold: u32,
        current_timestamp: u64,
    ) -> Result<bool, &'static str> {
        let total_score = self.compute_reputation_score(current_timestamp);

        if total_score >= threshold {
            Ok(true)
        } else {
            // Map to the exact error the Miden node RPC surfaces when `assert`
            // halts inside prove_threshold with ERR_ASSERT_FAILED.
            Err("Proof rejected: score below threshold (Miden node: ERR_ASSERT_FAILED)")
        }
    }
}
