use sealed_sdk::{SealedClient, Credential};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_issuance_updates_merkle_root() {
        let mut client = SealedClient::new(1);
        let root_before = client.merkle_root;
        
        let cred = Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Governance".to_string(),
            score: 10,
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 4, 
        };
        
        client.issue_credential(cred).unwrap();
        
        assert_eq!(client.credentials.len(), 1);
        assert_ne!(client.merkle_root, root_before, "Merkle root must change after issuance");
        assert_eq!(client.merkle_root, client.compute_mock_root(), "Merkle root must be consistent with mock");
    }

    #[test]
    fn test_score_aggregation_with_scaled_weights() {
        let mut client = SealedClient::new(1);
        let current_timestamp = 1670000000 + 1000;
        
        // Governance = 4 weight
        client.issue_credential(Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Governance".to_string(),
            score: 100, // 100 * 4 = 400
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 4, 
        }).unwrap();
        
        // Completed Contracts = 3 weight
        client.issue_credential(Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Contract".to_string(),
            score: 50, // 50 * 3 = 150
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 3, 
        }).unwrap();
        
        // Ratings = 2 weight
        client.issue_credential(Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Rating".to_string(),
            score: 25, // 25 * 2 = 50
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 2, 
        }).unwrap();
        
        let total_score = client.compute_reputation_score(current_timestamp);
        assert_eq!(total_score, 400 + 150 + 50); // 600
    }

    #[test]
    fn test_threshold_proof_passes() {
        let mut client = SealedClient::new(1);
        let current_timestamp = 1670000000 + 1000;
        client.issue_credential(Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Governance".to_string(),
            score: 100,
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 4, 
        }).unwrap();
        
        // Score is 400. Threshold 400 should pass.
        assert!(client.prove_threshold(400, current_timestamp).unwrap());
        
        // Threshold 399 should pass.
        assert!(client.prove_threshold(399, current_timestamp).unwrap());
    }

    #[test]
    fn test_threshold_proof_fails() {
        let mut client = SealedClient::new(1);
        let current_timestamp = 1670000000 + 1000;
        client.issue_credential(Credential {
            issuer_address: [1, 2, 3, 4],
            credential_type: "Governance".to_string(),
            score: 100,
            timestamp: 1670000000,
            signature: [0; 4],
            weight: 4, 
        }).unwrap();
        
        // Score is 400. Threshold 401 should fail (return Err).
        let res = client.prove_threshold(401, current_timestamp);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("ERR_ASSERT_FAILED"));
    }
}

