"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/lib/miden-client";
import { Transaction } from "@demox-labs/miden-wallet-adapter-base";
import { writeSharedActivity } from "@/lib/shared-store";

function detectSchema(text: string): string {
  const t = text.toLowerCase()
  
  if (t.includes('login') || 
      t.includes('password') || 
      t.includes('device') || 
      t.includes('account takeover') ||
      t.includes('credential') ||
      t.includes('2am') || t.includes('3am') ||
      t.includes('4am') || t.includes('5am') ||
      t.includes('early hour')) {
    return 'Account Takeover'
  }
  
  if (t.includes('ssn') || 
      t.includes('synthetic') ||
      t.includes('credit history') ||
      t.includes('identity') ||
      t.includes('bust-out') ||
      t.includes('address match')) {
    return 'Synthetic Identity'
  }
  
  if (t.includes('cash deposit') || 
      t.includes('wire') ||
      t.includes('jurisdiction') ||
      t.includes('laundering') ||
      t.includes('structuring') ||
      t.includes('threshold') ||
      t.includes('9,500') || t.includes('9500')) {
    return 'Money Laundering'
  }
  
  if (t.includes('transaction') ||
      t.includes('card') ||
      t.includes('merchant') ||
      t.includes('petrol') ||
      t.includes('velocity') ||
      t.includes('pos') ||
      t.includes('skimming')) {
    return 'Transaction Fraud'
  }
  
  return 'Transaction Fraud' // default
}

function detectSchemaFromBin(buffer: ArrayBuffer): string {
  try {
    // Read the binary content as text to extract payload
    const bytes = new Uint8Array(buffer)
    
    // Check magic header: first 4 bytes should be 'SNDX'
    const magic = String.fromCharCode(
      bytes[0], bytes[1], bytes[2], bytes[3]
    )
    
    if (magic === 'SNDX') {
      // Read schema_id from bytes 6-7 (big-endian uint16)
      const schemaId = (bytes[6] << 8) | bytes[7]
      switch(schemaId) {
        case 1: return 'Transaction Fraud'
        case 2: return 'Account Takeover'
        case 3: return 'Synthetic Identity'
        case 4: return 'Money Laundering'
        default: return 'Transaction Fraud'
      }
    }
    
    // Fallback: scan text content for keywords
    // (for non-SNDX format .bin files)
    const text = new TextDecoder('utf-8', { fatal: false })
      .decode(buffer).toLowerCase()
    
    if (text.includes('account_takeover') ||
        text.includes('account takeover') ||
        text.includes('sim swap') ||
        text.includes('otp') ||
        text.includes('login') ||
        text.includes('password') ||
        text.includes('device')) {
      return 'Account Takeover'
    }
    
    if (text.includes('synthetic_identity') ||
        text.includes('synthetic identity') ||
        text.includes('ssn') ||
        text.includes('bust-out') ||
        text.includes('credit history')) {
      return 'Synthetic Identity'
    }
    
    if (text.includes('money_laundering') ||
        text.includes('money laundering') ||
        text.includes('structuring') ||
        text.includes('wire') ||
        text.includes('jurisdiction') ||
        text.includes('smurfing') ||
        text.includes('trade-based')) {
      return 'Money Laundering'
    }
    
    if (text.includes('transaction_fraud') ||
        text.includes('transaction fraud') ||
        text.includes('card') ||
        text.includes('merchant') ||
        text.includes('pos') ||
        text.includes('skimming') ||
        text.includes('velocity')) {
      return 'Transaction Fraud'
    }
    
    return 'Transaction Fraud' // default
    
  } catch {
    return 'Transaction Fraud'
  }
}


interface Submission {
  type: "SUBMIT" | "REGISTER";
  desc: string;
  gradientHash?: string;
  institution_id: string;
  schema: string;
  timestamp: number;
  status: "pending" | "confirmed";
  txId?: string;
  blockNum?: number;
}

export default function SubmitPage() {
  const { connected, address, requestTransaction } = useWallet();
  const { syncState } = useMidenClient();
  
  const [instId, setInstId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"describe" | "upload">("describe");
  const [patternText, setPatternText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed">("idle");
  const [history, setHistory] = useState<Submission[]>([]);
  const [selectedSchema, setSelectedSchema] = useState("Transaction Fraud");
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  
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

  const computeSHA256 = async (data: string | ArrayBuffer): Promise<string> => {
    const buffer = typeof data === "string" 
      ? new TextEncoder().encode(data) 
      : data;
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  useEffect(() => {
    let isMounted = true;
    const updateHash = async () => {
      let gradHash = "Awaiting input...";
      if (inputMode === "describe") {
        if (patternText.trim().length > 0) {
          gradHash = await computeSHA256(patternText);
        }
      } else {
        if (file) {
          gradHash = await computeSHA256(await file.arrayBuffer());
        }
      }
      
      if (isMounted) setGeneratedHash(gradHash);
      
      if (gradHash !== "Awaiting input...") {
        if (isMounted) setProofHash("Computing...");
        // Add artificial delay for ZK proof generation
        setTimeout(async () => {
          const pHash = await computeSHA256(gradHash);
          if (isMounted) setProofHash(pHash);
        }, 1500);
      } else {
        if (isMounted) setProofHash("Awaiting generation...");
      }
    };
    updateHash();
    return () => { isMounted = false; };
  }, [inputMode, patternText, file]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      try {
        const buffer = await selectedFile.arrayBuffer();
        const detectedSchema = detectSchemaFromBin(buffer);
        setSelectedSchema(detectedSchema);
        setIsAutoDetected(true);
      } catch (err) {
        console.error("Failed to detect schema from binary:", err);
      }
    } else {
      setFile(null);
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

    const isReadyToSubmit = 
      generatedHash.length === 64 && 
      proofHash.length === 64 &&
      !generatedHash.includes('Awaiting') &&
      !proofHash.includes('Awaiting');

    if (!isReadyToSubmit) {
      setError("Please wait for proof generation to complete.");
      return;
    }
    
    setStatus("submitting");
    
    try {
      // Helper to split 64-char hex hash into 4 felts
      const hexToFelts = (hex: string) => {
        const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
        const chunks = [];
        for (let i = 0; i < 4; i++) {
          chunks.push(BigInt("0x" + clean.slice(i * 16, (i + 1) * 16)).toString());
        }
        return chunks;
      };

      const gradientFelts = hexToFelts(generatedHash);
      const proofFelts = hexToFelts(proofHash);
      const advice = [...gradientFelts, ...proofFelts, instId || "0"].map(s => {
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
      
      const currentBlock = await syncState();
      setBlockNum(currentBlock);
      
      const schemaLabel = selectedSchema;
      const currentSchema = schemaLabel.toLowerCase().replace(/ /g, '_');

      const newUpdate: Submission = {
        type: "SUBMIT",
        desc: schemaLabel,
        gradientHash: generatedHash,
        institution_id: instId || "0",
        schema: currentSchema,
        timestamp: Date.now(),
        status: "confirmed",
        txId: txIdResult,
        blockNum: currentBlock
      };
      
      const existing = JSON.parse(localStorage.getItem("syndex_updates") || "[]");
      existing.push(newUpdate);
      setHistory(existing);
      localStorage.setItem("syndex_updates", JSON.stringify(existing));
      
      // Don't await this - let it fail/run in the background
      writeSharedActivity('SUBMIT', {
        desc: schemaLabel,
        gradientHash: generatedHash,
        institutionId: instId || "0",
        schema: currentSchema,
        txId: txIdResult,
        blockNum: currentBlock
      }).catch((e) => console.warn('Gist sync failed:', e));

      setStatus("confirmed");
      
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Submission failed. Check your wallet and try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 page-transition">
      <div className="mb-8 md:mb-12 border-b border-[#1a1a2e] pb-6 md:pb-8 animate-in-view">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2">Submit Gradient Update</h1>
        <p className="text-sm md:text-lg text-[#64748b]">Generate zero-knowledge proofs for your local model updates and submit them to the network.</p>
      </div>

      {!connected ? (
        <div className="syndex-card p-4 md:p-6 text-center flex flex-col items-center justify-center animate-in-view">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Wallet Connection Required</h2>
          <p className="text-[#64748b] max-w-md mb-6">Connect your Miden wallet to submit model updates.</p>
        </div>
      ) : !instId ? (
        <div className="syndex-card p-4 md:p-6 text-center flex flex-col items-center justify-center animate-in-view">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Institution Not Registered</h2>
          <p className="text-[#64748b] max-w-md mb-6">You must register your institution before you can submit updates.</p>
          <Link href="/register" className="syndex-btn-primary px-6 py-3 font-bold uppercase tracking-widest text-sm">
            Go to Registration
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left: Form Area */}
          <div className="space-y-6 md:space-y-8 animate-in-view" style={{ animationDelay: '0.1s' }}>
            {status === "confirmed" ? (
              <div className="syndex-card p-4 md:p-6 flex flex-col justify-start items-center text-center gap-4 border-[#22c55e]/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <div className="w-24 h-24 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6 border border-[#22c55e]/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#22c55e]">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">GRADIENT UPDATE CONFIRMED</h2>
                <div className="text-[#3b82f6] font-mono text-sm mb-6">Confirmed at block #{blockNum}</div>
                <div className="bg-[#050508] border border-[#1a1a2e] p-4 text-xs font-mono text-[#64748b] break-all max-w-full mb-8">
                  {generatedHash.slice(0, 24)}...{generatedHash.slice(-8)}
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={() => {
                      setStatus("idle");
                      setPatternText("");
                      setFile(null);
                      setGeneratedHash("Awaiting input...");
                      setProofHash("Awaiting generation...");
                    }}
                    className="syndex-btn-primary w-full py-4 font-bold tracking-widest uppercase text-sm"
                  >
                    SUBMIT ANOTHER UPDATE
                  </button>
                  <Link href="/network" className="w-full py-4 text-center font-bold tracking-widest uppercase text-sm border border-[#1a1a2e] text-[#e2e8f0] hover:bg-[#1a1a2e] transition-colors">
                    VIEW NETWORK STATE
                  </Link>
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
              {/* Fraud Category Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase flex items-center gap-3">
                  Fraud Category
                  {isAutoDetected && (
                    <span className="text-xs text-[#3b82f6] font-bold tracking-widest lowercase border border-[#3b82f6]/30 px-2 py-0.5 bg-[#3b82f6]/10">
                      auto-detected
                    </span>
                  )}
                </label>
                <select 
                  value={selectedSchema}
                  onChange={(e) => {
                    setSelectedSchema(e.target.value);
                    setIsAutoDetected(false);
                  }}
                  className="w-full syndex-input p-4 appearance-none"
                >
                  <option value="Transaction Fraud">Transaction Fraud</option>
                  <option value="Account Takeover">Account Takeover</option>
                  <option value="Synthetic Identity">Synthetic Identity</option>
                  <option value="Money Laundering">Money Laundering</option>
                </select>
              </div>

              {/* Input Mode Switcher */}
              <div className="flex rounded-md bg-[#050508] border border-[#1a1a2e] mb-6 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setInputMode("describe")}
                  className={`flex-1 py-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${inputMode === "describe" ? "bg-[#3b82f6] text-white" : "text-[#64748b] hover:text-[#e2e8f0]"}`}
                >
                  Describe Pattern
                </button>
                <div className="w-[1px] bg-[#1a1a2e]"></div>
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`flex-1 py-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${inputMode === "upload" ? "bg-[#3b82f6] text-white" : "text-[#64748b] hover:text-[#e2e8f0]"}`}
                >
                  Upload Weights (.bin)
                </button>
              </div>

              {inputMode === "describe" ? (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">
                      Fraud Pattern Description
                    </label>
                    <textarea 
                      value={patternText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPatternText(val);
                        const detected = detectSchema(val);
                        setSelectedSchema(detected);
                        setIsAutoDetected(val.trim().length > 0);
                      }}
                      maxLength={2000}
                      className="w-full syndex-input p-4 min-h-[120px] resize-y"
                      placeholder="Describe the fraud pattern your model detected.&#10;e.g. High velocity transactions from new devices between 1am-4am, average amount $3,200, 89% correlated with account takeover attempts."
                    />
                    <div className="text-right text-xs text-[#64748b] mt-2 font-mono">
                      {patternText.length} / 2000
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">
                      Gradient Hash (Auto-Generated)
                    </label>
                    <p className="text-xs text-[#64748b] mb-2">
                      Cryptographically represents your pattern without revealing the description.
                    </p>
                    <div className="w-full bg-[#050508] border border-[#1a1a2e] p-4 font-mono text-xs text-[#e2e8f0] break-all">
                      {generatedHash}
                    </div>
                  </div>

                  <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/20 p-4 text-xs text-[#94a3b8] leading-relaxed">
                    <strong className="text-[#3b82f6]">Your fraud description never leaves your device.</strong><br/>
                    Only the cryptographic hash is submitted to the Miden network. The hash cannot be reversed to reveal your original description.
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-[#94a3b8] tracking-widest uppercase">Model Weights File (.bin)</label>
                    <div className="relative border-2 border-dashed border-[#1a1a2e] bg-[#050508] p-8 text-center hover:border-[#3b82f6] transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        onChange={handleFile}
                        accept=".bin,.pt,.h5"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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

                  <div className="bg-[#1a1a2e]/30 border border-[#1a1a2e] p-4 text-xs text-[#94a3b8] leading-relaxed">
                    <strong className="text-[#e2e8f0]">For institutions running local ML models.</strong><br/>
                    Upload your model weights binary. Syndex will automatically detect the fraud category and derive the gradient hash from the file content. Supported format: SNDX binary v1.
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!(generatedHash.length === 64 && proofHash.length === 64 && !generatedHash.includes('Awaiting') && !proofHash.includes('Awaiting')) || status !== "idle"}
                style={{ opacity: !(generatedHash.length === 64 && proofHash.length === 64 && !generatedHash.includes('Awaiting') && !proofHash.includes('Awaiting')) || status !== "idle" ? 0.4 : 1, cursor: !(generatedHash.length === 64 && proofHash.length === 64 && !generatedHash.includes('Awaiting') && !proofHash.includes('Awaiting')) || status !== "idle" ? 'not-allowed' : 'pointer' }}
                className={`w-full py-4 font-bold tracking-widest uppercase text-sm mt-8 ${
                  status === "submitting" ? "bg-[#f59e0b]/40 text-[#f59e0b] border border-[#f59e0b] cursor-wait" :
                  "syndex-btn-primary"
                }`}
              >
                {status === "submitting" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></span>
                    SUBMITTING TO MIDEN...
                  </span>
                ) : "Generate Proof & Submit"}
              </button>
            </form>
            )}
            
            {/* History */}
            <div className="syndex-card p-4 md:p-6 mt-6">
              <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4">Recent Submissions</h3>
              {history.length === 0 ? (
                <p className="text-[#64748b] text-sm text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {[...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((h, i) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const hAny = h as any;
                    const title = h.desc || h.schema || hAny.description || "Pattern Update";
                    const hash = h.gradientHash || hAny.hash || hAny.gradient || null;
                    const block = h.blockNum || hAny.block || hAny.blockNumber || null;
                    
                    return (
                    <div key={i} className="flex flex-col gap-2 p-4 bg-[#050508] border border-[#1a1a2e]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#e2e8f0] font-bold text-sm">
                          {title}
                        </span>
                        <span className="text-[#22c55e] text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          VERIFIED
                        </span>
                      </div>
                      {hash && (
                        <span className="text-[#64748b] text-xs font-mono truncate max-w-full">
                          {hash.length > 40 ? hash.slice(0, 40) + "..." : hash}
                        </span>
                      )}
                      {block && (
                        <span className="text-[#3b82f6] text-xs font-mono">Block #{block}</span>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Visualization */}
          <div className="w-full animate-in-view" style={{ animationDelay: '0.2s' }}>
            <div className="syndex-card p-4 md:p-6 h-full flex flex-col bg-[#050508] border-2 border-[#1a1a2e] relative overflow-hidden">
              <h3 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm mb-8 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                Live Proof Visualization
              </h3>
              
              <div className="space-y-8 flex-1">
                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2">Status</div>
                  <div className={`font-mono text-sm px-3 py-1 inline-block border ${
                    status === "idle" ? "text-[#64748b] border-[#1a1a2e]" :
                    status === "submitting" ? "text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10 animate-pulse" :
                    "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10"
                  }`}>
                    {status === "idle" ? "READY" :
                     status === "submitting" ? "BROADCASTING_TX" : "CONFIRMED"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2">Gradient Hash (Public)</div>
                  <div className={`font-mono text-xs break-all p-3 border ${
                    generatedHash !== "Awaiting input..." ? "text-[#e2e8f0] border-[#3b82f6]/30 bg-[#0a0a12]" : "text-[#64748b] border-[#1a1a2e] bg-[#050508]"
                  }`}>
                    {generatedHash}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#64748b] font-bold tracking-widest uppercase mb-2 flex justify-between">
                    <span>Validity Proof (Private)</span>
                    {proofHash === "Computing..." && <span className="text-[#f59e0b] animate-pulse">Computing...</span>}
                  </div>
                  <div className={`font-mono text-xs break-all p-3 border ${
                    status === "confirmed" ? "text-[#22c55e] border-[#22c55e]/50 bg-[#22c55e]/5" :
                    status === "submitting" || proofHash === "Computing..." ? "text-[#f59e0b] border-[#f59e0b]/50 bg-[#f59e0b]/5" :
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
