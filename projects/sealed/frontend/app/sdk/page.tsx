export default function SDKPage() {
  const codeSnippet = `import { WebClient } from "@miden-sdk/miden-sdk";
import { useWallet } from "@demox-labs/miden-wallet-adapter";

// 1. Request user to prove their reputation
const { requestTransaction } = useWallet();
const transaction = {
  type: 'custom',
  payload: {
    recipientAddress: SEALED_CONTRACT_ID,
    transactionRequest: proofRequest,
  }
};
await requestTransaction(transaction);

// 2. Verify on-chain results
const client = new WebClient("https://rpc.testnet.miden.io:443");
await client.initialize();
const state = await client.syncState();
console.log("Current block:", state.blockNumber);`;


  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Developer SDK</h1>
        <p className="text-muted-foreground text-lg">
          Integrate Sealed zero-knowledge proofs into your own decentralized application.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Verification Integration</h2>
          <div className="max-w-2xl">
          <p className="text-xl text-muted-foreground">
            You can verify a user&apos;s reputation threshold instantly using our SDK. The user generates a ZK proof in their client, and you verify it against the Miden network state.
          </p>
        </div>
          <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-4">
            <pre className="text-sm font-mono text-zinc-300 overflow-x-auto p-2">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Supported Tiers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <div className="font-bold text-zinc-100">Bronze</div>
              <div className="text-sm text-zinc-500">Score &gt; 0</div>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <div className="font-bold text-zinc-100">Silver</div>
              <div className="text-sm text-zinc-500">Score &ge; 200</div>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <div className="font-bold text-zinc-100">Gold</div>
              <div className="text-sm text-zinc-500">Score &ge; 500</div>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <div className="font-bold text-zinc-100">Platinum</div>
              <div className="text-sm text-zinc-500">Score &ge; 1000</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
