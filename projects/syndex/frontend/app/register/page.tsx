"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/lib/miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";

export default function RegisterPage() {
  const { connected, address, requestTransaction } = useWallet();
  const { syncState } = useMidenClient();
  
  const [name, setName] = useState("");
  const [instId, setInstId] = useState("");
  const [schema, setSchema] = useState("transaction_fraud");
  const [status, setStatus] = useState<"idle" | "pending" | "submitting" | "confirmed">("idle");
  const [blockNum, setBlockNum] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const currentStep = !connected ? 1 : status === "confirmed" ? 2 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!connected || !address || !requestTransaction) {
      setError("Connect your wallet first");
      return;
    }

    // Input Validation
    if (name.trim().length < 2) {
      setError("Institution name must be at least 2 characters");
      return;
    }
    if (name.trim().length > 64) {
      setError("Institution name must be 64 characters or less");
      return;
    }

    let finalInstId: number;
    if (instId.trim()) {
      finalInstId = parseInt(instId, 10);
      if (isNaN(finalInstId) || finalInstId <= 0) {
        setError("Institution ID must be a positive integer");
        return;
      }
    } else {
      finalInstId = Math.floor(Math.random() * 1000000);
    }

    setStatus("pending");
    
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
      
      setStatus("submitting"); 
      
      const currentBlock = await syncState();
      setBlockNum(currentBlock);
      
      localStorage.setItem("syndex_institution_id", finalInstId.toString());
      localStorage.setItem("syndex_institution_name", name);
      setStatus("confirmed");
      
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Registration failed. Please check your wallet and try again.");
      setStatus("idle");
    }
  };

  const schemaPreview: Record<string, string[]> = {
    "transaction_fraud": ["amount: u64", "merchant_category: u16", "time_delta: u32", "is_international: bool"],
    "account_takeover": ["login_attempts: u8", "ip_risk_score: u8", "device_changed: bool", "time_since_creation: u32"],
    "synthetic_identity": ["ssn_vintage: u16", "address_matches: u8", "credit_history_length: u16", "identity_score: u8"],
    "money_laundering": ["velocity_24h: u32", "volume_7d: u64", "unique_counterparties: u16", "high_risk_jurisdiction: bool"],
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 min-h-[calc(100vh-4rem)] page-transition">
      <div className="mb-12 border-b border-[#1a1a2e] pb-8 animate-in-view">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2">Register Institution</h1>
        <p className="text-[#64748b] text-lg">Join the Syndex network to securely share fraud intelligence.</p>
      </div>

      {/* 3-Step Progress */}
      <div className="flex items-center justify-between mb-12 animate-in-view" style={{ animationDelay: '0.1s' }}>
        {[
          { num: 1, label: "Connect Wallet" },
          { num: 2, label: "Register Institution" }
        ].map((step, i) => {
          const isActive = currentStep === step.num;
          const isCompleted = step.num === 1 ? connected : 
                            status === "confirmed";
          return (
            <div key={i} className={`flex flex-col items-center relative z-10 ${i === 0 ? "w-1/2" : "w-1/2"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                isActive && !isCompleted ? "bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" : 
                isCompleted ? "bg-[#22c55e] text-[#050508]" : "bg-[#0a0a12] border border-[#1a1a2e] text-[#64748b]"
              }`}>
                {isCompleted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-in fade-in zoom-in duration-500">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.num}
              </div>
              <span className={`mt-3 text-xs tracking-widest font-bold uppercase transition-colors ${
                isActive && !isCompleted ? "text-[#3b82f6]" : isCompleted ? "text-[#22c55e]" : "text-[#64748b]"
              }`}>
                {step.label}
              </span>
              {i < 1 && (
                <div className="absolute top-5 left-1/2 w-full h-[2px] bg-[#1a1a2e] -z-10">
                  <div className={`h-full bg-[#3b82f6] transition-all duration-500 ease-out`} 
                       style={{ width: isCompleted ? "100%" : "0%" }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form Area */}
        <div className="flex-1 animate-in-view" style={{ animationDelay: '0.2s' }}>
          {!connected ? (
            <div className="syndex-card p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Wallet Connection Required</h2>
              <p className="text-[#64748b] mb-8 max-w-md">Please connect your Miden wallet using the button in the top right corner to proceed with registration.</p>
            </div>
          ) : status === "confirmed" ? (
            <div className="syndex-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px] border-[#22c55e]/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <div className="w-24 h-24 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6 border border-[#22c55e]/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#22c55e]">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#e2e8f0] mb-2">Registration Confirmed</h3>
              <p className="text-[#94a3b8] mb-6 max-w-md">Your institution has been securely registered on the Miden network. You can now participate in intelligence sharing.</p>
              <div className="bg-[#050508] border border-[#1a1a2e] px-6 py-3 rounded-md text-sm font-mono text-[#64748b]">
                Confirmed at block <span className="text-[#e2e8f0] font-bold">#{blockNum}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="syndex-card p-8 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">Institution Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full syndex-input p-4"
                  placeholder="e.g. Acme Bank"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase flex justify-between">
                  <span>Institution ID</span>
                  <span className="text-[#64748b] font-normal text-xs">(Auto-generates if empty)</span>
                </label>
                <input 
                  type="number" 
                  value={instId}
                  onChange={(e) => setInstId(e.target.value)}
                  className="w-full syndex-input p-4"
                  placeholder="Leave blank to auto-generate"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">Data Schema</label>
                <select 
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  className="w-full syndex-input p-4 appearance-none"
                >
                  <option value="transaction_fraud">Transaction Fraud</option>
                  <option value="account_takeover">Account Takeover</option>
                  <option value="synthetic_identity">Synthetic Identity</option>
                  <option value="money_laundering">Money Laundering</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={status === "pending" || status === "submitting"}
                className={`w-full py-4 font-bold tracking-widest uppercase text-sm mt-8 ${
                  status === "pending" ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50 cursor-wait" :
                  status === "submitting" ? "bg-[#f59e0b]/40 text-[#f59e0b] border border-[#f59e0b] cursor-wait" :
                  "syndex-btn-primary"
                }`}
              >
                {status === "pending" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></span>
                    SIGNING TRANSACTION...
                  </span>
                ) : status === "submitting" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></span>
                    SUBMITTING TO MIDEN...
                  </span>
                ) : "Sign & Register Institution"}
              </button>
            </form>
          )}
        </div>

        {/* Right: Schema Preview */}
        <div className="w-full lg:w-[400px] animate-in-view" style={{ animationDelay: '0.3s' }}>
          <div className="syndex-card p-6 h-full flex flex-col">
            <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Schema Requirements
            </h3>
            
            <p className="text-[#64748b] text-sm mb-6">
              By selecting <span className="text-[#e2e8f0] font-bold">{schema.replace('_', ' ')}</span>, your models must output gradients matching this exact shape to generate valid zero-knowledge proofs.
            </p>

            <div className="bg-[#050508] border border-[#1a1a2e] p-4 flex-1">
              <div className="text-xs text-[#64748b] mb-4">{`// Expected gradient vector format`}</div>
              <ul className="space-y-3 font-mono text-sm text-[#94a3b8]">
                {schemaPreview[schema].map((field, idx) => (
                  <li key={idx} className="flex">
                    <span className="text-[#3b82f6] mr-4">{String(idx).padStart(2, '0')}</span>
                    <span className="flex-1 text-[#e2e8f0]">{field.split(':')[0]}</span>
                    <span className="text-[#22c55e]">{field.split(':')[1]}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#1a1a2e]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#64748b]">HASH_ALGO</span>
                <span className="text-[#e2e8f0]">RPX-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
