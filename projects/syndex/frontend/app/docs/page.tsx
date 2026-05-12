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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-4rem)] page-transition">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 animate-in-view">
        <div className="sticky top-24">
          <h2 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 pb-2 border-b border-[#1a1a2e]">Documentation</h2>
          <nav className="flex flex-col gap-2 font-mono text-sm">
            {[
              { id: "overview", label: "Overview" },
              { id: "quickstart", label: "Quickstart" },
              { id: "schemas", label: "Data Schemas" },
              { id: "proofs", label: "ZK Proofs" },
              { id: "api", label: "API Reference" }
            ].map(item => (
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
        <div className="syndex-card p-8 md:p-12">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">Syndex Integration Guide</h1>
              <p className="text-[#94a3b8] leading-relaxed">
                Syndex uses the Miden Roll-up to enable private intelligence sharing. Institutions train fraud detection models locally on their own proprietary data, then submit only the <strong className="text-[#e2e8f0]">gradient updates</strong> along with a <strong className="text-[#e2e8f0]">zero-knowledge validity proof</strong> to the network.
              </p>
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-4 text-[#e2e8f0] text-sm mt-8">
                <span className="font-bold uppercase tracking-widest text-[#3b82f6] block mb-2">Key Concept</span>
                No raw PII, transaction data, or raw flags ever leave your institution&apos;s infrastructure. The network only sees mathematical proofs that your local update was computed correctly according to the shared schema.
              </div>
            </div>
          )}

          {activeTab === "quickstart" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4">Quickstart</h1>
              <p className="text-[#94a3b8] mb-6">Install the SDK and initialize the client.</p>
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

          {(activeTab === "schemas" || activeTab === "proofs" || activeTab === "api") && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#e2e8f0] mb-4 capitalize">{activeTab.replace('_', ' ')}</h1>
              <p className="text-[#94a3b8] italic">This section is currently being expanded. Check back for detailed {activeTab} documentation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
