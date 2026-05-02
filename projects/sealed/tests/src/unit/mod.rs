use std::time::Instant;
use sealed_sdk::{SealedClient, Credential};

#[test]
fn issue_credential_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);

    // Record root before any mutations — must be the account-seeded default.
    let root_before = client.compute_mock_root();
    assert_eq!(root_before, client.account_id,
        "Empty vault root must equal account_id seed");

    let cred = Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 10,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    };

    assert!(client.issue_credential(cred).is_ok());
    assert_eq!(client.credentials.len(), 1);

    // MERKLE STATE CONSISTENCY: root stored in client.merkle_root must equal
    // a freshly computed root — equivalent to reading account storage slot 0
    // after mtree_set and asserting it matches the returned new root.
    let expected_root = client.compute_mock_root();
    assert_eq!(
        client.merkle_root, expected_root,
        "Merkle root in storage must match recomputed root after issue_credential"
    );

    // Raw credential data is NOT exposed via the public root (privacy invariant):
    // only the root hash, not the leaf values, is observable externally.
    assert_ne!(
        client.merkle_root, root_before,
        "Root must change after inserting a credential"
    );

    println!("issue_credential_test proof time: {:?}", start.elapsed());
}

#[test]
fn compute_reputation_score_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);
    let current_timestamp = 1_670_000_000 + 1_000; // well within 365 days

    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    // MERKLE STATE CONSISTENCY after first credential
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after first credential");

    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Contract".to_string(),
        score: 50,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 3,
    }).unwrap();

    // MERKLE STATE CONSISTENCY after second credential
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after second credential");

    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Rating".to_string(),
        score: 25,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 2,
    }).unwrap();

    // MERKLE STATE CONSISTENCY after third credential
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after third credential");

    let total_score = client.compute_reputation_score(current_timestamp);
    // Expected: (100*4) + (50*3) + (25*2) = 400 + 150 + 50 = 600
    assert_eq!(total_score, 600, "Score must equal 600");

    println!("compute_reputation_score_test proof time: {:?}", start.elapsed());
}

#[test]
fn prove_threshold_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);
    let current_timestamp = 1_670_000_000 + 1_000;

    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    // MERKLE STATE CONSISTENCY
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after issue");

    // Score = 100*4 = 400. Prove threshold 400 must pass.
    let proof_pass = client.prove_threshold(400, current_timestamp)
        .expect("prove_threshold should succeed when score == threshold");
    assert!(proof_pass, "Proof must be valid when score meets threshold exactly");

    // Prove threshold 401 must now return Err (not Ok(false)).
    // This ensures the verifier cannot confuse a rejection with a valid low-score proof.
    let proof_fail = client.prove_threshold(401, current_timestamp);
    assert!(
        proof_fail.is_err(),
        "prove_threshold must return Err when score is below threshold, got: {:?}", proof_fail
    );
    assert!(
        proof_fail.unwrap_err().contains("ERR_ASSERT_FAILED"),
        "Error must contain the Miden node RPC error code"
    );

    println!("prove_threshold_test proof time: {:?}", start.elapsed());
}
