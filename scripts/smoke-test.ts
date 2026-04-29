import axios from 'axios';
import { midenWasm } from '../frontend/lib/miden-wasm-mock';
import * as fs from 'fs';
import * as path from 'path';

async function runSmokeTest() {
  const startTime = Date.now();
  console.log("Starting smoke test...");

  try {
    // 1. Issue credential (simulated)
    console.log("Step 1: Issuing test credential...");
    await midenWasm.issueCredential("0xTestAccount", "Governance", 100);

    // 2. Generate ZK Proof
    console.log("Step 2: Generating ZK Proof...");
    const proof = await midenWasm.generateProof(400); // threshold 400

    // 3. Verify via Frontend Endpoint (simulated hit to the logic)
    console.log("Step 3: Verifying proof via Vercel logic...");
    // We assume the frontend is deployed at the URL we will get from Vercel.
    // For the smoke test, we verify the logic works locally first.
    const result = await midenWasm.verifyProof(proof, 400, "https://rpc.testnet.miden.io");

    if (!result.valid) {
      throw new Error("Proof verification failed: " + result.message);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Smoke test PASSED in ${duration}s`);

    const results = {
      timestamp: new Date().toISOString(),
      status: "success",
      duration,
      result
    };

    // Save results
    const deploymentsDir = path.resolve(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
    fs.writeFileSync(path.join(deploymentsDir, 'smoke-test-results.json'), JSON.stringify(results, null, 2));

    console.log("Results logged to /deployments/smoke-test-results.json");

  } catch (error) {
    console.error("Smoke test FAILED:", error);
    process.exit(1);
  }
}

runSmokeTest();
