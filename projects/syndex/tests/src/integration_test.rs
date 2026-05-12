use syndex_sdk::{SyndexClient, Institution, GradientUpdate};
use std::time::Instant;

#[test]
fn test_register_institution_success() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    let res = client.register_institution(42, [1, 2, 3, 4]);
    
    assert!(res.is_ok());
    let inst = client.institution.as_ref().unwrap();
    assert_eq!(inst.institution_id, 42);
    assert_eq!(inst.schema_hash, [1, 2, 3, 4]);
    assert_eq!(client.model_state.participant_count, 0);
    
    println!("test_register_institution_success passed in {:?}", start.elapsed());
}

#[test]
fn test_register_institution_duplicate_fails() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(42, [1, 2, 3, 4]).unwrap();
    
    let res = client.register_institution(42, [1, 2, 3, 4]);
    assert!(res.is_err());
    assert!(res.unwrap_err().contains("already registered"));
    
    println!("test_register_institution_duplicate_fails passed in {:?}", start.elapsed());
}

#[test]
fn test_submit_gradient_update_success() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(1, [1, 2, 3, 4]).unwrap();
    
    let res = client.submit_gradient_update([10, 20, 30, 40], [50, 60, 70, 80]);
    assert!(res.is_ok());
    assert_eq!(client.gradient_history.len(), 1);
    assert_eq!(client.model_state.participant_count, 1);
    assert_ne!(client.model_state.model_root, [0, 0, 0, 0]);
    
    println!("test_submit_gradient_update_success passed in {:?}", start.elapsed());
}

#[test]
fn test_submit_without_registration_fails() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    
    let res = client.submit_gradient_update([10, 20, 30, 40], [50, 60, 70, 80]);
    assert!(res.is_err());
    assert!(res.unwrap_err().contains("not registered"));
    
    println!("test_submit_without_registration_fails passed in {:?}", start.elapsed());
}

#[test]
fn test_gradient_validity_check_passes() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(5, [1, 1, 1, 1]).unwrap();
    
    let update = GradientUpdate {
        institution_id: 5,
        gradient_hash: [1, 2, 3, 4],
        validity_proof_hash: [5, 6, 7, 8],
        timestamp: 1700000000,
    };
    
    assert!(client.verify_gradient_validity(&update));
    
    println!("test_gradient_validity_check_passes passed in {:?}", start.elapsed());
}

#[test]
fn test_gradient_validity_check_fails_zeros() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(5, [1, 1, 1, 1]).unwrap();
    
    let update = GradientUpdate {
        institution_id: 5,
        gradient_hash: [0, 0, 0, 0],
        validity_proof_hash: [5, 6, 7, 8],
        timestamp: 1700000000,
    };
    
    assert!(!client.verify_gradient_validity(&update));
    
    println!("test_gradient_validity_check_fails_zeros passed in {:?}", start.elapsed());
}

#[test]
fn test_pull_model_returns_correct_state() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(1, [1, 2, 3, 4]).unwrap();
    
    client.submit_gradient_update([10, 20, 30, 40], [50, 60, 70, 80]).unwrap();
    client.submit_gradient_update([1, 2, 3, 4], [5, 6, 7, 8]).unwrap();
    
    let model = client.pull_model();
    assert_eq!(model.participant_count, 2);
    assert_ne!(model.model_root, [0, 0, 0, 0]);
    assert!(model.last_updated > 0);
    
    println!("test_pull_model_returns_correct_state passed in {:?}", start.elapsed());
}

#[test]
fn test_model_root_changes_after_update() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(1, [1, 2, 3, 4]).unwrap();
    
    let root_before = client.pull_model().model_root;
    client.submit_gradient_update([10, 20, 30, 40], [50, 60, 70, 80]).unwrap();
    let root_after = client.pull_model().model_root;
    
    assert_ne!(root_before, root_after);
    
    println!("test_model_root_changes_after_update passed in {:?}", start.elapsed());
}

#[test]
fn test_full_institution_lifecycle() {
    let total_start = Instant::now();
    let mut client = SyndexClient::new(100);
    
    client.register_institution(100, [9, 8, 7, 6]).unwrap();
    
    client.submit_gradient_update([1, 1, 1, 1], [1, 1, 1, 1]).unwrap();
    client.submit_gradient_update([2, 2, 2, 2], [2, 2, 2, 2]).unwrap();
    client.submit_gradient_update([3, 3, 3, 3], [3, 3, 3, 3]).unwrap();
    
    let model = client.pull_model();
    assert_eq!(model.participant_count, 3);
    assert_eq!(client.gradient_history.len(), 3);
    
    let duration = total_start.elapsed();
    println!("Full lifecycle test passed in {:?}", duration);
}

#[test]
fn test_two_institutions_isolated() {
    let start = Instant::now();
    let mut client_a = SyndexClient::new(1);
    let mut client_b = SyndexClient::new(2);
    
    client_a.register_institution(1, [1, 1, 1, 1]).unwrap();
    client_b.register_institution(2, [2, 2, 2, 2]).unwrap();
    
    client_a.submit_gradient_update([10, 10, 10, 10], [10, 10, 10, 10]).unwrap();
    
    assert_eq!(client_a.pull_model().participant_count, 1);
    assert_eq!(client_b.pull_model().participant_count, 0);
    assert_ne!(client_a.pull_model().model_root, client_b.pull_model().model_root);
    
    println!("test_two_institutions_isolated passed in {:?}", start.elapsed());
}

#[test]
fn test_advice_stack_format() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(42, [1, 2, 3, 4]).unwrap();
    client.submit_gradient_update([10, 20, 30, 40], [50, 60, 70, 80]).unwrap();
    
    let stack = client.generate_advice_stack();
    assert!(!stack.is_empty());
    assert_eq!(stack[0], 42);
    assert_eq!(stack.len(), 9);
    
    println!("test_advice_stack_format passed in {:?}", start.elapsed());
}

#[test]
fn test_multiple_updates_accumulate() {
    let start = Instant::now();
    let mut client = SyndexClient::new(1);
    client.register_institution(1, [1, 2, 3, 4]).unwrap();
    
    for i in 1..=5 {
        client.submit_gradient_update([i, 0, 0, 0], [1, 1, 1, 1]).unwrap();
    }
    
    assert_eq!(client.model_state.participant_count, 5);
    assert_eq!(client.gradient_history.len(), 5);
    
    let mut hashes = Vec::new();
    for update in &client.gradient_history {
        assert!(!hashes.contains(&update.gradient_hash));
        hashes.push(update.gradient_hash);
    }
    
    println!("test_multiple_updates_accumulate passed in {:?}", start.elapsed());
}
