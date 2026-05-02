use std::time::Instant;
use sealed_sdk::{SealedClient, Credential};

#[test]
fn end_to_end_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);
    let current_timestamp = 1_670_000_000 + 1_000;
    let valid_issuer = [1, 2, 3, 4];

    client.issue_credential(Credential {
        issuer_address: valid_issuer,
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();
    // MERKLE STATE CONSISTENCY: root in storage must match recomputed root
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after first credential");

    client.issue_credential(Credential {
        issuer_address: valid_issuer,
        credential_type: "Contract".to_string(),
        score: 50,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 3,
    }).unwrap();
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after second credential");

    client.issue_credential(Credential {
        issuer_address: valid_issuer,
        credential_type: "Rating".to_string(),
        score: 25,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 2,
    }).unwrap();
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after third credential");

    let score = client.compute_reputation_score(current_timestamp);
    assert_eq!(score, 600, "Total score must be 600");

    // prove_threshold now returns Err on failure — assert Ok on passing case
    let proof = client.prove_threshold(500, current_timestamp)
        .expect("Proof must succeed when score (600) >= threshold (500)");
    assert!(proof);

    println!("end_to_end_test proof time: {:?}", start.elapsed());
}

#[test]
fn isolation_test() {
    let start = Instant::now();
    let mut client1 = SealedClient::new(1);
    let client2 = SealedClient::new(2);
    let current_timestamp = 1_670_000_000 + 1_000;

    client1.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    // MERKLE STATE CONSISTENCY: each client has its own independent root
    assert_eq!(client1.merkle_root, client1.compute_mock_root(),
        "client1 root mismatch");
    assert_eq!(client2.merkle_root, client2.compute_mock_root(),
        "client2 root mismatch (empty vault)");

    // client2's root must be different from client1's despite having no credentials
    // (roots are seeded with account_id so they differ even when both are empty)
    assert_ne!(
        client1.merkle_root, client2.merkle_root,
        "Different accounts must have different roots even when empty"
    );

    assert_eq!(client1.compute_reputation_score(current_timestamp), 400);
    assert_eq!(client2.compute_reputation_score(current_timestamp), 0);

    println!("isolation_test proof time: {:?}", start.elapsed());
}

#[test]
fn unauthorized_issuer_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);
    let root_before = client.merkle_root;

    let res = client.issue_credential(Credential {
        issuer_address: [9, 9, 9, 9], // Not a whitelisted issuer
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    });

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), "Invalid signature");

    // MERKLE STATE CONSISTENCY: a failed issuance must NOT mutate the root
    assert_eq!(client.merkle_root, root_before,
        "Root must be unchanged after a rejected credential");
    assert_eq!(client.credentials.len(), 0,
        "Credential list must be empty after a rejected issuance");

    println!("unauthorized_issuer_test proof time: {:?}", start.elapsed());
}

/// PROOF SOUNDNESS: verifies that a user whose score is below the threshold
/// cannot produce a passing proof. This directly maps to the `assert` instruction
/// inside the MASM `prove_threshold` procedure — if the assertion fails, the
/// Miden node halts execution and returns ERR_ASSERT_FAILED over RPC.
///
/// In this mock, we manually attempt to call prove_threshold for a user with
/// score=200 against threshold=500 and confirm the verifier rejects it with
/// the exact error string the Miden node RPC would surface.
#[test]
fn fake_proof_rejection_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(42);
    let current_timestamp = 1_670_000_000 + 1_000;

    // Issue a credential giving score = 50 * 4 = 200 (below threshold 500)
    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 50,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    let actual_score = client.compute_reputation_score(current_timestamp);
    assert_eq!(actual_score, 200, "Sanity: score must be 200 before proof attempt");

    // Attempt proof for threshold=500 — must be REJECTED
    let result = client.prove_threshold(500, current_timestamp);

    assert!(
        result.is_err(),
        "SOUNDNESS VIOLATION: prove_threshold returned Ok for a below-threshold user! \
         This means a fake proof could pass verification. Got: {:?}",
        result
    );

    let err = result.unwrap_err();
    // Confirm the exact error matches the Miden node RPC error code.
    // In production this string comes from parsing the RPC response JSON:
    //   { "error": { "code": -32000, "message": "ERR_ASSERT_FAILED at pc=..." } }
    assert!(
        err.contains("ERR_ASSERT_FAILED"),
        "Error must contain Miden node RPC code 'ERR_ASSERT_FAILED', got: {}", err
    );

    println!(
        "fake_proof_rejection_test: score={} threshold=500 → rejected with: {}",
        actual_score, err
    );
    println!("fake_proof_rejection_test proof time: {:?}", start.elapsed());
}
