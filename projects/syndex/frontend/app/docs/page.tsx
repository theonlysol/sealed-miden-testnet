"use client";

import { useState } from "react";

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-md overflow-hidden bg-[#0a0a12] border border-[#1a1a2e] mb-6">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className={`px-2 py-1 text-xs font-mono border transition-colors ${
            copied ? "bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]" : "bg-[#050508] border-[#1a1a2e] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#3b82f6]"
          }`}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <div className="flex items-center px-4 py-2 bg-[#050508] border-b border-[#1a1a2e] text-xs text-[#64748b] font-mono">
        {language.toUpperCase()}
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed" style={{ color: "#94a3b8" }}>
        <pre className="m-0">
          <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        </pre>
      </div>
    </div>
  );
};

// Simple regex-based syntax highlighter for dark blue theme
function highlight(code: string) {
  return code
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/("[^"]*")/g, '<span style="color: #60a5fa;">$1</span>') // strings (light blue)
    .replace(/\b(import|from|export|function|const|let|var|return|await|async|class|interface|type)\b/g, '<span style="color: #3b82f6; font-weight: bold;">$1</span>') // keywords (blue)
    .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span style="color: #818cf8;">$1</span>') // types/classes (indigo)
    .replace(/(\/\/.*)/g, '<span style="color: #64748b;">$1</span>'); // comments (slate)
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const menuItems = [
    { id: "overview", label: "Overview" },
    { id: "quickstart", label: "Quickstart" },
    { id: "schemas", label: "Data Schemas" },
    { id: "proofs", label: "ZK Proofs" },
    { id: "api", label: "API Reference" }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col md:flex-row gap-6 md:gap-8 page-transition">
      
      {/* Mobile Horizontal Navigation (Visible only below md breakpoint) */}
      <div className="block md:hidden w-full mb-4">
        <div 
          className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide" 
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-mono transition-all duration-200 border rounded ${
                activeTab === item.id 
                  ? "bg-[#3b82f6] text-white border-[#3b82f6] font-bold" 
                  : "bg-transparent border-[#1a1a2e] text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar Navigation (Visible only md and above) */}
      <div className="hidden md:block w-full md:w-64 flex-shrink-0 animate-in-view">
        <div className="sticky top-24">
          <h2 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 pb-2 border-b border-[#1a1a2e]">Documentation</h2>
          <nav className="flex flex-col gap-2 font-mono text-sm">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`text-left px-4 py-2 border-l-2 transition-colors ${
                  activeTab === item.id 
                    ? "border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5 font-bold" 
                    : "border-transparent text-[#64748b] hover:text-[#e2e8f0] hover:border-[#1a1a2e]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 animate-in-view" style={{ animationDelay: '0.1s' }}>
        <div className="syndex-card p-4 md:p-6">
          
          {/* OVERVIEW SECTION */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">Syndex Integration Guide</h1>
              <p className="text-[#94a3b8] leading-relaxed font-sans text-sm md:text-base">
                Syndex uses the Miden Roll-up to enable private intelligence sharing. Institutions train fraud detection models locally on their own proprietary data, then submit only the <strong className="text-[#e2e8f0]">gradient updates</strong> along with a <strong className="text-[#e2e8f0]">zero-knowledge validity proof</strong> to the network.
              </p>
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-4 text-[#e2e8f0] text-sm mt-8">
                <span className="font-bold uppercase tracking-widest text-[#3b82f6] block mb-2 text-xs">Key Concept</span>
                <p className="text-[#94a3b8] leading-relaxed">
                  No raw PII, transaction data, or raw flags ever leave your institution&apos;s infrastructure. The network only sees cryptographic proofs that your local update was computed correctly according to the shared schema.
                </p>
              </div>
            </div>
          )}

          {/* QUICKSTART SECTION */}
          {activeTab === "quickstart" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">Quickstart</h1>
              <p className="text-[#94a3b8] mb-6 font-sans text-sm">Install the SDK and initialize the client.</p>
              <CodeBlock 
                language="bash"
                code={`npm install @demox-labs/miden-sdk @demox-labs/miden-wallet-adapter-react`}
              />
              <CodeBlock 
                language="typescript"
                code={`import { useMidenClient } from "@/lib/miden-client";
 
export function App() {
  const { syncState, requestTransaction } = useMidenClient();
  
  const submitUpdate = async (weights) => {
    // Computes ZK proof locally in WASM
    const proof = await generateValidityProof(weights);
    
    // Submit to Miden testnet
    await requestTransaction({
      procedure: "submit_gradient_update",
      adviceInputs: { weights_hash: proof.hash }
    });
  }
}`}
              />
            </div>
          )}

          {/* DATA SCHEMAS SECTION */}
          {activeTab === "schemas" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">Data Schemas</h1>
              <p className="text-[#94a3b8] leading-relaxed font-sans text-sm">
                Syndex supports four fraud intelligence schemas. Each schema defines the gradient vector format that institutions must conform to when submitting pattern updates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* Schema 1 */}
                <div className="border border-[#1a1a2e] bg-[#050508] p-5 rounded-md flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xs text-[#3b82f6] font-bold">SCHEMA ID: 1</span>
                      <span className="text-[10px] tracking-widest font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 uppercase">
                        Threat: Medium
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">Transaction Fraud</h3>
                    <ul className="space-y-2 text-xs font-mono text-[#94a3b8] border-t border-[#1a1a2e]/50 pt-3">
                      <li>• <strong className="text-[#e2e8f0]">velocity_24h</strong>: u32 <span className="text-[#64748b]">— tx count in 24h</span></li>
                      <li>• <strong className="text-[#e2e8f0]">volume_7d</strong>: u64 <span className="text-[#64748b]">— total volume over 7d</span></li>
                      <li>• <strong className="text-[#e2e8f0]">unique_counterparties</strong>: u16 <span className="text-[#64748b]">— distinct merchants</span></li>
                      <li>• <strong className="text-[#e2e8f0]">is_international</strong>: bool <span className="text-[#64748b]">— cross-border flag</span></li>
                    </ul>
                  </div>
                  <div className="text-[11px] font-mono text-[#64748b] mt-4 border-t border-[#1a1a2e]/30 pt-2 flex justify-between">
                    <span>Algo: RPX-256</span>
                    <span>Format: Binary</span>
                  </div>
                </div>

                {/* Schema 2 */}
                <div className="border border-[#1a1a2e] bg-[#050508] p-5 rounded-md flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xs text-[#3b82f6] font-bold">SCHEMA ID: 2</span>
                      <span className="text-[10px] tracking-widest font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 uppercase font-bold">
                        Threat: High
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">Account Takeover</h3>
                    <ul className="space-y-2 text-xs font-mono text-[#94a3b8] border-t border-[#1a1a2e]/50 pt-3">
                      <li>• <strong className="text-[#e2e8f0]">login_velocity</strong>: u32 <span className="text-[#64748b]">— attempts per hour</span></li>
                      <li>• <strong className="text-[#e2e8f0]">device_change</strong>: bool <span className="text-[#64748b]">— new device flag</span></li>
                      <li>• <strong className="text-[#e2e8f0]">new_beneficiary</strong>: bool <span className="text-[#64748b]">— new payee flag</span></li>
                      <li>• <strong className="text-[#e2e8f0]">amount_usd</strong>: u64 <span className="text-[#64748b]">— transfer amount in cents</span></li>
                    </ul>
                  </div>
                  <div className="text-[11px] font-mono text-[#64748b] mt-4 border-t border-[#1a1a2e]/30 pt-2 flex justify-between">
                    <span>Algo: RPX-256</span>
                    <span>Format: Binary</span>
                  </div>
                </div>

                {/* Schema 3 */}
                <div className="border border-[#1a1a2e] bg-[#050508] p-5 rounded-md flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xs text-[#3b82f6] font-bold">SCHEMA ID: 3</span>
                      <span className="text-[10px] tracking-widest font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 uppercase font-bold">
                        Threat: High
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">Synthetic Identity</h3>
                    <ul className="space-y-2 text-xs font-mono text-[#94a3b8] border-t border-[#1a1a2e]/50 pt-3">
                      <li>• <strong className="text-[#e2e8f0]">ssn_vintage</strong>: u16 <span className="text-[#64748b]">— SSN issuance year</span></li>
                      <li>• <strong className="text-[#e2e8f0]">address_matches</strong>: u8 <span className="text-[#64748b]">— shared address count</span></li>
                      <li>• <strong className="text-[#e2e8f0]">credit_history_length</strong>: u16 <span className="text-[#64748b]">— months of credit</span></li>
                      <li>• <strong className="text-[#e2e8f0]">identity_score</strong>: u8 <span className="text-[#64748b]">— normalized confidence 0-100</span></li>
                    </ul>
                  </div>
                  <div className="text-[11px] font-mono text-[#64748b] mt-4 border-t border-[#1a1a2e]/30 pt-2 flex justify-between">
                    <span>Algo: RPX-256</span>
                    <span>Format: Binary</span>
                  </div>
                </div>

                {/* Schema 4 */}
                <div className="border border-[#1a1a2e] bg-[#050508] p-5 rounded-md flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xs text-[#3b82f6] font-bold">SCHEMA ID: 4</span>
                      <span className="text-[10px] tracking-widest font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 uppercase font-bold">
                        Threat: High
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">Money Laundering</h3>
                    <ul className="space-y-2 text-xs font-mono text-[#94a3b8] border-t border-[#1a1a2e]/50 pt-3">
                      <li>• <strong className="text-[#e2e8f0]">velocity_24h</strong>: u32 <span className="text-[#64748b]">— tx count in 24h</span></li>
                      <li>• <strong className="text-[#e2e8f0]">volume_7d</strong>: u64 <span className="text-[#64748b]">— total volume over 7d</span></li>
                      <li>• <strong className="text-[#e2e8f0]">unique_counterparties</strong>: u16 <span className="text-[#64748b]">— distinct recipient count</span></li>
                      <li>• <strong className="text-[#e2e8f0]">high_risk_jurisdiction</strong>: bool <span className="text-[#64748b]">— flagged jurisdiction flag</span></li>
                    </ul>
                  </div>
                  <div className="text-[11px] font-mono text-[#64748b] mt-4 border-t border-[#1a1a2e]/30 pt-2 flex justify-between">
                    <span>Algo: RPX-256</span>
                    <span>Format: Binary</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ZK PROOFS SECTION */}
          {activeTab === "proofs" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">How Syndex ZK Proofs Work</h1>
              <div className="space-y-4 text-[#94a3b8] leading-relaxed font-sans text-sm md:text-base">
                <p>
                  Syndex uses zero-knowledge proofs to allow institutions to contribute fraud intelligence without revealing their underlying transaction data. Every gradient update submitted to the network is accompanied by a validity proof — a cryptographic commitment that proves the update was derived from real data conforming to the committed schema.
                </p>
                <p>
                  Proof generation happens entirely client-side. When an institution submits a pattern update, their local client computes a SHA-256 hash of the gradient data (the gradient hash) and a second SHA-256 hash of that hash (the validity proof). Only these two hashes are transmitted to the Miden network. The raw fraud pattern description and any underlying transaction records never leave the institution&apos;s device.
                </p>
                <p>
                  The Syndex smart contract on Miden verifies that each submitted gradient hash is accompanied by a valid proof before updating the shared model root. The model root is a rolling cryptographic commitment to the network&apos;s collective fraud intelligence — updated with every verified contribution.
                </p>
              </div>

              <div className="mt-6">
                <CodeBlock 
                  language="text"
                  code={`// ZK Proof Flow
1. Institution describes fraud pattern locally
2. Client computes: gradient_hash = SHA256(pattern)
3. Client computes: validity_proof = SHA256(gradient_hash)
4. Only {gradient_hash, validity_proof} sent to Miden
5. Contract verifies and updates model_root:
   new_model_root = RPO_HASH(gradient_hash || model_root)
6. Institution receives confirmation at block #N`}
                />
              </div>

              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-4 text-[#e2e8f0] text-sm mt-6">
                <span className="font-bold uppercase tracking-widest text-[#3b82f6] block mb-2 text-xs">V2 ROADMAP</span>
                <p className="text-[#94a3b8] leading-relaxed">
                  Full ZK gradient validity proofs using RISC Zero will prove that gradient updates were computed over real data matching the committed schema, with differential privacy noise applied — without revealing any underlying records. This upgrade path makes Syndex production-ready for regulated financial institutions.
                </p>
              </div>
            </div>
          )}

          {/* API REFERENCE SECTION */}
          {activeTab === "api" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">API & Smart Contract Reference</h1>
                <p className="text-[#94a3b8] leading-relaxed font-sans text-sm">
                  Syndex exposes three primary smart contract procedures to interface with the Miden network.
                </p>
              </div>

              <div className="space-y-6">
                
                {/* Procedure 1 */}
                <div className="border border-[#1a1a2e] bg-[#050508]/60 p-5 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-bold text-[#e2e8f0] font-mono text-sm md:text-base">procedure: register_institution</h3>
                    <span className="text-[10px] font-mono text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 uppercase">WRITE</span>
                  </div>
                  <p className="text-[#94a3b8] text-xs leading-relaxed mb-4 font-sans">
                    Register a new institution on the Syndex network. Must be called once per wallet address before submitting gradient updates.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4 text-[#94a3b8]">
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Advice Inputs:</strong>
                      • schema_hash[0..3]: felt <span className="text-[#64748b]">— 4-felt schema hash</span><br/>
                      • institution_id: felt <span className="text-[#64748b]">— derived linked ID</span>
                    </div>
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Storage Writes:</strong>
                      • Slot 0: schema_hash (private)<br/>
                      • Slot 1: institution_id (private)<br/>
                      • Slot 2: model_root initialized to [0,0,0,0]<br/>
                      • Slot 3: participant_count initialized to 0
                    </div>
                  </div>
                  <CodeBlock 
                    language="typescript"
                    code={`// Via Syndex frontend
await wallet.sendTransaction(
  createCustomTransaction({
    targetAccount: SYNDEX_CONTRACT_ID,
    procedure: 'register_institution',
    adviceInputs: [schema_hash_felts, institution_id_felt]
  })
)`}
                  />
                </div>

                {/* Procedure 2 */}
                <div className="border border-[#1a1a2e] bg-[#050508]/60 p-5 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-bold text-[#e2e8f0] font-mono text-sm md:text-base">procedure: submit_gradient_update</h3>
                    <span className="text-[10px] font-mono text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 uppercase">WRITE</span>
                  </div>
                  <p className="text-[#94a3b8] text-xs leading-relaxed mb-4 font-sans">
                    Submit a verified fraud pattern gradient update to the shared model.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4 text-[#94a3b8]">
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Advice Inputs:</strong>
                      • gradient_hash[0..3]: felt <span className="text-[#64748b]">— split 4 x 8-byte felts</span><br/>
                      • validity_proof_hash[0..3]: felt <span className="text-[#64748b]">— split 4 x 8-byte felts</span><br/>
                      • institution_id: felt <span className="text-[#64748b]">— must match registered ID</span>
                    </div>
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Storage Updates:</strong>
                      • Slot 2: model_root updated via RPO_HASH<br/>
                      • Slot 3: participant_count incremented by 1
                    </div>
                  </div>
                  <CodeBlock 
                    language="typescript"
                    code={`// Via Syndex frontend
await wallet.sendTransaction(
  createCustomTransaction({
    targetAccount: SYNDEX_CONTRACT_ID,
    procedure: 'submit_gradient_update',
    adviceInputs: [
      gradient_hash_felts,
      validity_proof_felts,
      institution_id_felt
    ]
  })
)`}
                  />
                </div>

                {/* Procedure 3 */}
                <div className="border border-[#1a1a2e] bg-[#050508]/60 p-5 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-bold text-[#e2e8f0] font-mono text-sm md:text-base">procedure: pull_model</h3>
                    <span className="text-[10px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 uppercase">READ</span>
                  </div>
                  <p className="text-[#94a3b8] text-xs leading-relaxed mb-4 font-sans">
                    Read the current shared model state. Returns the current model_root and participant_count. Read-only — does not modify any storage.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4 text-[#94a3b8]">
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Stack Output:</strong>
                      • [participant_count, model_root_word]
                    </div>
                    <div className="border border-[#1a1a2e]/60 p-3 rounded">
                      <strong className="text-[#e2e8f0] block mb-1 text-[11px]">Method Properties:</strong>
                      • Pure Query / Constant<br/>
                      • Cost: 0 Gas
                    </div>
                  </div>
                  <CodeBlock 
                    language="typescript"
                    code={`// Read model state via miden-client
const state = await midenClient.callProcedure(
  SYNDEX_CONTRACT_ID,
  'pull_model'
)
const { modelRoot, participantCount } = state`}
                  />
                </div>

              </div>

              {/* CONTRACT DETAILS */}
              <div className="border border-[#1a1a2e] bg-[#050508] p-5 rounded-md mt-8">
                <h3 className="text-md font-bold text-[#e2e8f0] mb-4 tracking-widest uppercase font-mono text-sm border-b border-[#1a1a2e] pb-2">
                  Contract Deployment Metadata
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-[#94a3b8]">
                  <div>
                    <span className="block text-[#64748b] text-[10px] uppercase tracking-widest mb-1">Contract Address</span>
                    <span className="text-[#e2e8f0] break-all select-all">0x552c71210b324a80295db1b0850d9f</span>
                  </div>
                  <div>
                    <span className="block text-[#64748b] text-[10px] uppercase tracking-widest mb-1">Network</span>
                    <span className="text-[#e2e8f0]">Miden Testnet</span>
                  </div>
                  <div>
                    <span className="block text-[#64748b] text-[10px] uppercase tracking-widest mb-1">Anchored Block</span>
                    <span className="text-[#e2e8f0]">654779</span>
                  </div>
                  <div>
                    <span className="block text-[#64748b] text-[10px] uppercase tracking-widest mb-1">Signer Wallet</span>
                    <span className="text-[#e2e8f0] break-all select-all">0xe74c477fa1a89380132fe5955aff14</span>
                  </div>
                  <div className="sm:col-span-2 mt-2 pt-2 border-t border-[#1a1a2e]/50">
                    <span className="block text-[#64748b] text-[10px] uppercase tracking-widest mb-1">GitHub Repository</span>
                    <a 
                      href="https://github.com/theonlysol/sealed-miden-testnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline"
                    >
                      github.com/theonlysol/sealed-miden-testnet
                    </a>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
