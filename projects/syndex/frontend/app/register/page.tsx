/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/lib/miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";
import { deriveInstitutionId } from "@/lib/utils";
import { writeSharedActivity } from "@/lib/shared-store";

export default function RegisterPage() {
  const { connected, address, requestTransaction } = useWallet();
  const { syncState } = useMidenClient();
  
  const [name, setName] = useState("");
  const [existingReg, setExistingReg] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "submitting" | "confirmed">("idle");
  const [blockNum, setBlockNum] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`syndex_registration_${address}`);
      if (saved) {
        setExistingReg(JSON.parse(saved));
      } else {
        setExistingReg(null);
      }
    } else {
      setExistingReg(null);
    }
  }, [address]);

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

    const finalInstId = deriveInstitutionId(address || "");

    setStatus("pending");
    
    try {
      const advice = ["0", "0", "0", "0", finalInstId.toString()].map(s => {
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setBigUint64(0, BigInt(s), true);
        return new Uint8Array(buf);
      });

      const { TransactionRequestBuilder } = await import("@miden-sdk/miden-sdk");
      const builder = new TransactionRequestBuilder();
      const txRequest = builder.build();

      const txTemplate = Transaction.createCustomTransaction(
        address,
        process.env.NEXT_PUBLIC_SYNDEX_CONTRACT_ID || "0x0000000000000000",
        txRequest,
        [],
        advice
      );

      const txIdResult = await requestTransaction(txTemplate);
      console.log("Transaction sent:", txIdResult);
      
      setStatus("submitting"); 
      
      const currentBlock = await syncState();
      setBlockNum(currentBlock);
      
      const regData = {
        institutionId: finalInstId.toString(),
        institutionName: name,
        schema: null,
        timestamp: Date.now(),
        block: currentBlock,
        walletAddress: address
      };
      localStorage.setItem(`syndex_registration_${address}`, JSON.stringify(regData));

      // Add registration to history
      const saved = localStorage.getItem("syndex_updates");
      const history = saved ? JSON.parse(saved) : [];
      const registrationEvent = {
        type: "REGISTER",
        institution_id: finalInstId.toString(),
        institution_name: name,
        timestamp: Date.now(),
        status: "confirmed"
      };
      localStorage.setItem("syndex_updates", JSON.stringify([registrationEvent, ...history]));

      // Don't await this - let it fail/run in the background
      writeSharedActivity('REGISTER', {
        institutionId: finalInstId.toString(),
        institutionName: name,
        block: currentBlock,
        walletAddress: address
      }).catch((e) => console.warn('Gist sync failed:', e));

      setStatus("confirmed");
      
    } catch (err) {
      console.error('Registration error:', JSON.stringify(err, null, 2));
      console.error("Full registration error object:", err);
      setError("Registration failed. Please check your wallet and try again.");
      setStatus("idle");
    }
  };



  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 page-transition">
      <div className="mb-8 md:mb-12 border-b border-[#1a1a2e] pb-6 md:pb-8 animate-in-view">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2">Register Institution</h1>
        <p className="text-sm md:text-lg text-[#64748b]">Join the Syndex network to securely share fraud intelligence.</p>
      </div>

      {/* 3-Step Progress */}
      <div className="flex items-center justify-between mb-8 md:mb-12 animate-in-view" style={{ animationDelay: '0.1s' }}>
        {[
          { num: 1, label: "Connect Wallet" },
          { num: 2, label: "Register Institution" }
        ].map((step, i) => {
          const isActive = currentStep === step.num;
          const isCompleted = step.num === 1 ? connected : 
                            status === "confirmed";
          return (
            <div key={i} className={`flex flex-col items-center relative z-10 w-1/2`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 ${
                isActive && !isCompleted ? "bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" : 
                isCompleted ? "bg-[#22c55e] text-[#050508]" : "bg-[#0a0a12] border border-[#1a1a2e] text-[#64748b]"
              }`}>
                {isCompleted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-6 md:h-6 animate-in fade-in zoom-in duration-500">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.num}
              </div>
              <span className={`mt-2 md:mt-3 text-[10px] md:text-xs tracking-widest font-bold uppercase transition-colors text-center ${
                isActive && !isCompleted ? "text-[#3b82f6]" : isCompleted ? "text-[#22c55e]" : "text-[#64748b]"
              }`}>
                {step.label}
              </span>
              {i < 1 && (
                <div className="absolute top-4 md:top-5 left-1/2 w-full h-[2px] bg-[#1a1a2e] -z-10">
                  <div className={`h-full bg-[#3b82f6] transition-all duration-500 ease-out`} 
                       style={{ width: isCompleted ? "100%" : "0%" }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left: Form Area */}
        <div className="animate-in-view" style={{ animationDelay: '0.2s' }}>
          {existingReg ? (
            <div className="syndex-card p-4 md:p-6 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">INSTITUTION ALREADY REGISTERED</h2>
              <div className="space-y-2 mb-6 text-left w-full max-w-sm bg-[#050508] p-4 border border-[#1a1a2e]">
                <div className="flex justify-between">
                  <span className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Institution ID:</span>
                  <span className="text-[#e2e8f0] font-mono">{existingReg.institutionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Registered:</span>
                  <span className="text-[#e2e8f0] font-mono">{new Date(existingReg.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Wallet:</span>
                  <span className="text-[#e2e8f0] font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
                </div>
              </div>
              <p className="text-[#64748b] text-xs mb-8">This wallet is already a registered Syndex participant.</p>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Link href="/dashboard" className="syndex-btn-primary w-full py-3 font-bold tracking-widest uppercase text-sm text-center">
                  GO TO DASHBOARD
                </Link>
                <Link href="/submit" className="w-full py-3 text-center font-bold tracking-widest uppercase text-sm border border-[#1a1a2e] text-[#e2e8f0] hover:bg-[#1a1a2e] transition-colors">
                  SUBMIT UPDATE
                </Link>
              </div>
            </div>
          ) : !connected ? (
            <div className="syndex-card p-4 md:p-6 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Wallet Connection Required</h2>
              <p className="text-[#64748b] mb-8 max-w-md">Please connect your Miden wallet using the button in the top right corner to proceed with registration.</p>
            </div>
          ) : status === "confirmed" ? (
            <div className="syndex-card p-4 md:p-6 py-6 flex flex-col items-center justify-center text-center h-full border-[#22c55e]/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
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
            <form onSubmit={handleSubmit} className="syndex-card p-4 md:p-6 space-y-6">
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

              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 p-4">
                <label className="block text-sm font-bold mb-2 text-[#3b82f6] tracking-widest uppercase">Your Institution ID</label>
                <div className="text-3xl font-mono font-bold text-[#e2e8f0] mb-2">{deriveInstitutionId(address || "")}</div>
                <p className="text-xs text-[#64748b]">This ID is permanently linked to your wallet address.</p>
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

        {/* Right: Info Card */}
        <div className="w-full animate-in-view" style={{ animationDelay: '0.3s' }}>
          <div className="syndex-card p-4 md:p-6 h-full flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-4">
              Flexible Submissions
            </h3>
            <p className="text-[#64748b] text-sm leading-relaxed max-w-sm">
              Once registered, you can submit fraud pattern updates across any schema type from the Submit page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
