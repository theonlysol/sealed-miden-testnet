use std::time::Instant;
use sealed_sdk::{SealedClient, Credential};

#[test]
fn empty_tree_test() {
    let start = Instant::now();
    let client = SealedClient::new(1);
    let current_timestamp = 1_670_000_000;

    // Empty vault must score zero
    assert_eq!(client.compute_reputation_score(current_timestamp), 0);

    // MERKLE STATE CONSISTENCY: new() seeds merkle_root = account_id so that
    // compute_mock_root() (which folds with account_id as the XOR seed) matches
    // client.merkle_root immediately, without needing any credential issuance.
    assert_eq!(client.merkle_root, client.account_id,
        "Empty vault merkle_root must equal the account_id XOR seed");
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Empty vault root must be consistent with compute_mock_root()");

    println!("empty_tree_test proof time: {:?}", start.elapsed());
}


#[test]
fn score_overflow_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);
    // Use current_timestamp == credential timestamp so diff == 0 (always valid)
    let current_timestamp = 1_670_000_000;

    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        // u32::MAX/2 + 1 = 2_147_483_648; multiplied by weight 4 gives 8_589_934_592
        // which exceeds u32::MAX (4_294_967_295), so saturating_mul correctly caps at u32::MAX.
        // Using u32::MAX/4 (the previous value) does NOT overflow: 1_073_741_823 * 4 = 4_294_967_292.
        score: u32::MAX / 2 + 1,
        timestamp: 1_670_000_000,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    // MERKLE STATE CONSISTENCY after potentially-large credential
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root must be consistent after high-score credential");

    // Must not panic — saturating_mul caps at u32::MAX
    let score = client.compute_reputation_score(current_timestamp);
    assert_eq!(score, u32::MAX,
        "saturating_mul(u32::MAX/2+1, 4) must saturate to u32::MAX without panic");

    println!("score_overflow_test proof time: {:?}", start.elapsed());
}

#[test]
fn exclude_older_than_365_days_test() {
    let start = Instant::now();
    let mut client = SealedClient::new(1);

    let current_timestamp = 1_670_000_000_u64;
    let old_timestamp = current_timestamp - 31_536_001; // 365 days + 1 second — must be excluded
    let boundary_timestamp = current_timestamp - 31_536_000; // exactly 365 days — must be included

    // Issue an expired credential
    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Governance".to_string(),
        score: 100,
        timestamp: old_timestamp,
        signature: [0; 4],
        weight: 4,
    }).unwrap();

    // MERKLE STATE CONSISTENCY: root must update even for expired credentials
    // (they are stored in the tree but excluded from score computation)
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after expired credential");

    // Expired credential contributes 0 to score
    assert_eq!(client.compute_reputation_score(current_timestamp), 0,
        "Credential older than 365 days must be excluded from score");

    // Issue a credential at exactly the 365-day boundary (diff == 31_536_000 → included)
    client.issue_credential(Credential {
        issuer_address: [1, 2, 3, 4],
        credential_type: "Contract".to_string(),
        score: 50,
        timestamp: boundary_timestamp,
        signature: [0; 4],
        weight: 3,
    }).unwrap();

    // MERKLE STATE CONSISTENCY after second credential
    assert_eq!(client.merkle_root, client.compute_mock_root(),
        "Root mismatch after boundary credential");

    // Boundary credential (diff == 31_536_000) must be included: score = 50*3 = 150
    assert_eq!(client.compute_reputation_score(current_timestamp), 150,
        "Credential at exactly 365 days must be included");

    println!("exclude_older_than_365_days_test proof time: {:?}", start.elapsed());
}
