"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";

interface Submission {
  desc: string;
  gradientHash: string;
  status: "pending" | "confirmed";
}

export default function DashboardPage() {
  const { connected, address } = useWallet();
  const [instId, setInstId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    setInstId(localStorage.getItem("syndex_institution_id"));
    const saved = localStorage.getItem("syndex_updates");
    if (saved) {
      try {
        setSubmissions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-center page-transition">
        <div className="syndex-card p-12 max-w-md">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-4">ACCESS RESTRICTED</h2>
          <p className="text-[#64748b] mb-8">Please connect your authorized Miden wallet to view the institution dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-[calc(100vh-4rem)] page-transition">
      <div className="mb-12 border-b border-[#1a1a2e] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in-view">
        <div>
          <div className="text-[#3b82f6] text-xs font-bold uppercase tracking-widest mb-2">Institutional Overview</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0]">Dashboard</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/submit" className="syndex-btn-primary px-6 py-3 font-bold uppercase tracking-widest text-xs">
            SUBMIT UPDATE
          </Link>
          <Link href="/network" className="syndex-btn px-6 py-3 font-bold uppercase tracking-widest text-xs">
            NETWORK STATE
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Institution Info */}
        <div className="syndex-card p-8 animate-in-view" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-[#64748b] font-bold tracking-widest uppercase text-xs mb-6">Institution Identity</h3>
          <div className="space-y-6">
            <div>
              <span className="block text-[10px] text-[#3b82f6] font-bold uppercase mb-1">Registration ID</span>
              <span className="font-mono text-[#e2e8f0] text-xl font-bold">{instId || "NOT_REGISTERED"}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#3b82f6] font-bold uppercase mb-1">Wallet Address</span>
              <span className="font-mono text-[#94a3b8] text-xs break-all">{address}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#3b82f6] font-bold uppercase mb-1">Network Status</span>
              <span className="flex items-center gap-2 text-[#22c55e] font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                ACTIVE_PARTICIPANT
              </span>
            </div>
          </div>
          {!instId && (
            <Link href="/register" className="mt-8 block text-center py-3 border border-[#3b82f6] text-[#3b82f6] text-xs font-bold uppercase tracking-widest hover:bg-[#3b82f6]/10 transition-colors">
              COMPLETE REGISTRATION
            </Link>
          )}
        </div>

        {/* Activity Summary */}
        <div className="lg:col-span-2 syndex-card p-8 animate-in-view" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-[#64748b] font-bold tracking-widest uppercase text-xs mb-6 flex justify-between">
            <span>Intelligence Contributions</span>
            <span className="text-[#e2e8f0]">{submissions.length} UPDATES</span>
          </h3>
          
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#64748b] border border-dashed border-[#1a1a2e]">
              <p className="mb-4">No gradient updates contributed yet.</p>
              <Link href="/submit" className="text-[#3b82f6] text-xs font-bold uppercase underline underline-offset-4">
                Submit First Update
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-[#3b82f6] border-b border-[#1a1a2e]">
                    <th className="pb-4 font-bold tracking-widest">DESCRIPTION</th>
                    <th className="pb-4 font-bold tracking-widest">GRADIENT_HASH</th>
                    <th className="pb-4 font-bold tracking-widest">STATUS</th>
                  </tr>
                </thead>
                <tbody className="text-[#94a3b8]">
                  {submissions.map((sub, i) => (
                    <tr key={i} className="border-b border-[#1a1a2e]/50">
                      <td className="py-4 text-[#e2e8f0] font-bold">{sub.desc}</td>
                      <td className="py-4 truncate max-w-[200px]">{sub.gradientHash}</td>
                      <td className="py-4">
                        <span className="text-[#22c55e] border border-[#22c55e]/30 px-2 py-0.5 rounded-sm">VERIFIED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Insights (Mock) */}
      <div className="syndex-card p-8 animate-in-view" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-8 border-b border-[#1a1a2e] pb-4">
          Network Intelligence Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-widest">Model Precision (Aggregated)</span>
            <div className="h-40 flex items-end gap-2">
              {[40, 65, 55, 80, 70, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-[#3b82f6]/20 border-t-2 border-[#3b82f6] relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a12] border border-[#1a1a2e] px-2 py-1 text-[10px] text-[#e2e8f0] opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#64748b]">Real-time detection accuracy across participant network.</p>
          </div>

          <div className="space-y-4">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-widest">Threat Velocity</span>
            <div className="flex flex-col gap-3">
              {[
                { label: "Account Takeover", val: "LOW" },
                { label: "Synthetic ID", val: "HIGH" },
                { label: "Card Not Present", val: "MEDIUM" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#050508] border border-[#1a1a2e]">
                  <span className="text-[#e2e8f0] text-xs font-mono">{item.label}</span>
                  <span className={`text-[10px] font-bold font-mono ${item.val === 'HIGH' ? 'text-[#ef4444]' : item.val === 'MEDIUM' ? 'text-[#f59e0b]' : 'text-[#22c55e]'}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-[#3b82f6]/5 border border-[#3b82f6]/20 flex flex-col justify-center">
            <span className="text-[#3b82f6] font-bold text-xs uppercase tracking-widest mb-2">Network Security</span>
            <p className="text-[#94a3b8] text-xs leading-relaxed">
              Your institutional data is protected by ZK-SNARKs. All shared gradients are cryptographically verified to ensure honest participation without revealing underlying records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
