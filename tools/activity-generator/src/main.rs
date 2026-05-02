use miden_client::builder::ClientBuilder;
use miden_client_sqlite_store::ClientBuilderSqliteExt;
use miden_client::rpc::Endpoint;
use miden_client::transaction::TransactionRequestBuilder;
use miden_client::vm::AdviceInputs;
use miden_client::account::AccountId;
use miden_client::Felt;
use serde_json::json;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Activity Generator - Executing 4 Transactions on Testnet (Miden v0.15.0)");

    // 1. Setup Paths
    let miden_dir = PathBuf::from("/root/.miden");
    let store_path = miden_dir.join("store.sqlite3");
    let keys_dir = miden_dir.join("keys");

    // 2. Setup RPC Endpoint
    let endpoint = Endpoint::new("https".to_string(), "rpc.testnet.miden.io".to_string(), Some(443));

    // 3. Create Client
    let client = ClientBuilder::new()
        .sqlite_store(store_path)
        .grpc_client(&endpoint, Some(30_000))
        .filesystem_keystore(keys_dir)?
        .build()
        .await?;
    
    // Target account from testnet.json
    let account_id = AccountId::from_hex("0x93e850a8cc056880583d262ab400d2")?;
    
    // Transaction Data
    let activities = vec![
        ("Governance", vec![1, 100, 1670000000, 4, 0, 4]), 
        ("Contract",   vec![1, 50, 1670000000, 3, 1, 4]),
        ("Rating",     vec![1, 25, 1670000000, 2, 2, 4]),
    ];

    let mut log = json!({
        "account_id": account_id.to_hex(),
        "transactions": []
    });

    for (name, values) in activities {
        println!("\n--- Issuing {} Credential ---", name);
        
        let mut advice_inputs = AdviceInputs::default();
        let felts: Vec<Felt> = values.iter().map(|&v| Felt::new(v)).collect();
        advice_inputs.extend_stack(felts);

        let script = "
            use sealed::account
            begin
                call.account::issue_credential
            end
        ";
        
        let tx_script = client.code_builder().compile_tx_script(script)?;
        let tx_request = TransactionRequestBuilder::new()
            .with_custom_script(tx_script)?
            .with_advice_inputs(advice_inputs)
            .build()?;

        println!("Executing transaction for {}...", name);
        let tx_result = client.execute_transaction(account_id, tx_request).await?;
        
        println!("Proving and submitting transaction for {}...", name);
        let proven_tx = client.prove_transaction(&tx_result).await?;
        let height = client.submit_proven_transaction(proven_tx, &tx_result).await?;
        client.apply_transaction(&tx_result, height).await?;

        println!("Transaction successful at height {}", height);
        
        log["transactions"].as_array_mut().unwrap().push(json!({
            "type": format!("issue_{}", name.to_lowercase()),
            "height": height.as_u32(),
            "nonce": client.get_account_header(account_id).await?.unwrap().0.nonce().as_int()
        }));
    }

    // 4. Prove Threshold
    println!("\n--- Proving Threshold (500) ---");
    let mut advice_inputs = AdviceInputs::default();
    let values = vec![
        3,          // count
        167001000,  // current_timestamp
        100, 4, 1670000000, // Gov
        50, 3, 1670000000,  // Con
        25, 2, 1670000000,  // Rat
    ];
    let felts: Vec<Felt> = values.iter().map(|&v| Felt::new(v)).collect();
    advice_inputs.extend_stack(felts);

    let script = "
        use sealed::account
        begin
            push.500
            call.account::prove_threshold
        end
    ";
    
    let tx_script = client.code_builder().compile_tx_script(script)?;
    let tx_request = TransactionRequestBuilder::new()
        .with_custom_script(tx_script)?
        .with_advice_inputs(advice_inputs)
        .build()?;

    println!("Executing threshold proof...");
    let tx_result = client.execute_transaction(account_id, tx_request).await?;
    
    println!("Proving and submitting threshold proof...");
    let proven_tx = client.prove_transaction(&tx_result).await?;
    let height = client.submit_proven_transaction(proven_tx, &tx_result).await?;
    client.apply_transaction(&tx_result, height).await?;

    println!("Threshold proof submitted at height {}", height);
    
    log["transactions"].as_array_mut().unwrap().push(json!({
        "type": "prove_threshold",
        "height": height.as_u32(),
        "nonce": client.get_account_header(account_id).await?.unwrap().0.nonce().as_int()
    }));

    // Save log
    let log_path = PathBuf::from("deployments/activity-log.json");
    if let Some(parent) = log_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&log_path, serde_json::to_string_pretty(&log)?)?;
    println!("\nActivity log written to {}", log_path.display());

    Ok(())
}
