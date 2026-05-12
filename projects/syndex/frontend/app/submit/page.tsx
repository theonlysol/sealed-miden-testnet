"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/lib/miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";

interface Submission {
  desc: string;
  gradientHash: string;
  status: "pending" | "confirmed";
}

export default function SubmitPage() {
  const { connected, address, requestTransaction } = useWallet();
  const { syncState } = useMidenClient();
  
  const [instId, setInstId] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "submitting" | "confirmed">("idle");
  const [history, setHistory] = useState<Submission[]>([]);
  
  // Visuals for right panel
  const [generatedHash, setGeneratedHash] = useState("Awaiting input...");
  const [proofHash, setProofHash] = useState("Awaiting generation...");
  const [blockNum, setBlockNum] = useState<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("syndex_institution_id");
    if (id) setInstId(id);
    
    const saved = localStorage.getItem("syndex_updates");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Animation effect for proof generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "generating" || status === "submitting") {
      const chars = "0123456789abcdef";
      interval = setInterval(() => {
        let randStr = "0x";
        for (let i = 0; i < 64; i++) {
          randStr += chars[Math.floor(Math.random() * chars.length)];
        }
        setProofHash(randStr);
      }, 50);
    } else if (status === "confirmed") {
      setProofHash("0x" + Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""));
    }
    
    return () => clearInterval(interval);
  }, [status]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Simulate gradient hash immediately upon file selection
      const mockHash = "0x" + Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      setGeneratedHash(mockHash);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!connected || !address || !requestTransaction) {
      setError("Connect your wallet first");
      return;
    }

    if (!instId) {
      setError("Register your institution first");
      return;
    }

    if (!file) {
      setError("Please upload a weights file first");
      return;
    }

    setStatus("generating");
    
    // Simulate ZK proof generation time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setStatus("submitting");
    
    try {
      const { TransactionRequestBuilder } = await import("@miden-sdk/miden-sdk");
      const builder = new TransactionRequestBuilder();
      const txRequest = builder.build();

      const txTemplate = Transaction.createCustomTransaction(
        address,
        process.env.NEXT_PUBLIC_SYNDEX_CONTRACT_ID || "0x0000000000000000",
        txRequest,
        [],
        []
      );

      const txIdResult = await requestTransaction(txTemplate);
      console.log("Transaction sent:", txIdResult);
      
      const currentBlock = await syncState();
      setBlockNum(currentBlock);
      
      const newUpdate: Submission = {
        desc: desc || "Unlabeled Update",
        gradientHash: generatedHash,
        status: "confirmed"
      };
      
      const newHistory = [newUpdate, ...history];
      setHistory(newHistory);
      localStorage.setItem("syndex_updates", JSON.stringify(newHistory));
      
      setStatus("confirmed");
      setDesc("");
      setFile(null);
      
      // Reset after a bit
      setTimeout(() => {
        setStatus("idle");
        setGeneratedHash("Awaiting input...");
        setProofHash("Awaiting generation...");
      }, 5000);
      
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Submission failed. Check your wallet and try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-[calc(100vh-4rem)] page-transition">
      <div className="mb-12 border-b border-[#1a1a2e] pb-8 animate-in-view">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2">Submit Gradient Update</h1>
        <p className="text-[#64748b] text-lg">Generate zero-knowledge proofs for your local model updates and submit them to the network.</p>
      </div>

      {!connected ? (
        <div className="syndex-card p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-in-view">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Wallet Connection Required</h2>
          <p className="text-[#64748b] max-w-md mb-6">Connect your Miden wallet to submit model updates.</p>
        </div>
      ) : !instId ? (
        <div className="syndex-card p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-in-view">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Institution Not Registered</h2>
          <p className="text-[#64748b] max-w-md mb-6">You must register your institution before you can submit updates.</p>
          <Link href="/register" className="syndex-btn-primary px-6 py-3 font-bold uppercase tracking-widest text-sm">
            Go to Registration
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form Area */}
          <div className="flex-1 space-y-8 animate-in-view" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="syndex-card p-8 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">Model Weights File (.bin)</label>
                <div className="relative border-2 border-dashed border-[#1a1a2e] bg-[#050508] p-8 text-center hover:border-[#3b82f6] transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    onChange={handleFile}
                    accept=".bin,.pt,.h5"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  {file ? (
                    <div className="text-[#22c55e] flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                      <span className="font-mono text-sm">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-[#64748b] flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span className="font-bold text-sm tracking-widest uppercase">Upload Weights</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">Update Description (Optional)</label>
                <input 
                  type="text" 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full syndex-input p-4"
                  placeholder="e.g. Q3 New Fraud Patterns"
                />
              </div>

              <button 
                type="submit" 
                disabled={status !== "idle" || !file}
                className={`w-full py-4 font-bold tracking-widest uppercase text-sm mt-8 ${
                  status === "generating" ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50 cursor-wait" :
                  status === "submitting" ? "bg-[#f59e0b]/40 text-[#f59e0b] border border-[#f59e0b] cursor-wait" :
                  status === "confirmed" ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50" :
                  !file ? "bg-[#1a1a2e] text-[#64748b] border border-[#1a1a2e] cursor-not-allowed" : "syndex-btn-primary"
                }`}
              >
                {status === "generating" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></span>
                    GENERATING ZK PROOF...
                  </span>
                ) : status === "submitting" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></span>
                    SUBMITTING TO MIDEN...
                  </span>
                ) : status === "confirmed" ? "CONFIRMED" : "Generate Proof & Submit"}
              </button>
            </form>
            
            {/* History */}
            <div className="syndex-card p-8">
              <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4">Recent Submissions</h3>
              {history.length === 0 ? (
                <p className="text-[#64748b] text-sm text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={i} className="flex flex-col gap-2 p-4 bg-[#050508] border border-[#1a1a2e]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#e2e8f0] font-bold text-sm">{h.desc}</span>
                        <span className="text-[#22c55e] text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          VERIFIED
                        </span>
                      </div>
                      <span className="text-[#64748b] text-xs font-mono truncate">{h.gradientHash}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Visualization */}
          <div className="w-full lg:w-[450px] animate-in-view" style={{ animationDelay: '0.2s' }}>
            <div className="syndex-card p-6 h-full flex flex-col bg-[#050508] border-2 border-[#1a1a2e] relative overflow-hidden">
              <h3 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm mb-8 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                Live Proof Visualization
              </h3>
              
              <div className="space-y-8 flex-1">
                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2">Status</div>
                  <div className={`font-mono text-sm px-3 py-1 inline-block border ${
                    status === "idle" ? "text-[#64748b] border-[#1a1a2e]" :
                    status === "generating" ? "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10 animate-pulse" :
                    status === "submitting" ? "text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10 animate-pulse" :
                    "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10"
                  }`}>
                    {status === "idle" ? "READY" :
                     status === "generating" ? "GENERATING_ZK_PROOF" :
                     status === "submitting" ? "BROADCASTING_TX" : "CONFIRMED"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2">Gradient Hash (Public)</div>
                  <div className={`font-mono text-xs break-all p-3 border ${
                    file ? "text-[#e2e8f0] border-[#3b82f6]/30 bg-[#0a0a12]" : "text-[#64748b] border-[#1a1a2e] bg-[#050508]"
                  }`}>
                    {generatedHash}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2 flex justify-between">
                    <span>Validity Proof (Private)</span>
                    {status === "generating" && <span className="text-[#f59e0b] animate-pulse">Computing...</span>}
                  </div>
                  <div className={`font-mono text-xs break-all p-3 border ${
                    status === "confirmed" ? "text-[#22c55e] border-[#22c55e]/50 bg-[#22c55e]/5" :
                    status === "generating" || status === "submitting" ? "text-[#f59e0b] border-[#f59e0b]/50 bg-[#f59e0b]/5" :
                    "text-[#64748b] border-[#1a1a2e] bg-[#050508]"
                  }`}>
                    {proofHash}
                  </div>
                </div>
              </div>
              
              {status === "confirmed" && (
                <div className="mt-8 pt-6 border-t border-[#1a1a2e] flex items-center justify-between">
                  <span className="text-[#e2e8f0] text-sm font-bold">Network Block</span>
                  <span className="font-mono text-[#3b82f6] font-bold bg-[#3b82f6]/10 px-2 py-1 border border-[#3b82f6]/30">#{blockNum}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
