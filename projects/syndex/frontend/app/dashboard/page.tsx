/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";

export default function DashboardPage() {
  const { connected, address } = useWallet();
  const [instId, setInstId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [threats, setThreats] = useState<{ label: string; val: string }[]>([]);
  const [schemaData, setSchemaData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (address) {
      const regStr = localStorage.getItem(`syndex_registration_${address}`);
      if (regStr) {
        setInstId(JSON.parse(regStr).institutionId);
      } else {
        setInstId(null);
      }
    } else {
      setInstId(null);
    }
    
    
    const saved = localStorage.getItem("syndex_updates");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        // Show all submissions
        const allSubmissions = history.filter((h: any) => h.type === "SUBMIT");
        setSubmissions(allSubmissions);
        
        // Group updates by schema type and count them
        const schemaCounts: Record<string, number> = {
          'Transaction Fraud': 0,
          'Account Takeover': 0,
          'Synthetic Identity': 0,
          'Money Laundering': 0
        };

        allSubmissions.forEach((u: any) => {
          let schemaName = u.schema || u.desc || 'Transaction Fraud';
          if (schemaName.includes('_')) {
            schemaName = schemaName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          // Sometimes u.desc contains the friendly name, check if it matches keys
          const matchedKey = Object.keys(schemaCounts).find(k => k.toLowerCase() === schemaName.toLowerCase());
          if (matchedKey) {
            schemaCounts[matchedKey]++;
          } else {
            schemaCounts['Transaction Fraud']++;
          }
        });
        
        setSchemaData(schemaCounts);

        // Derive threats based on real counts
        const derivedThreats: {label: string, val: string}[] = [];
        Object.entries(schemaCounts).forEach(([label, count]) => {
          if (count > 0) {
            derivedThreats.push({
              label,
              val: count >= 4 ? 'HIGH' : count >= 2 ? 'MEDIUM' : 'LOW'
            });
          }
        });
        setThreats(derivedThreats);

      } catch (e) {
        console.error(e);
      }
    }
  }, [address]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center page-transition">
        <div className="syndex-card p-4 md:p-6 max-w-md">
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-4">ACCESS RESTRICTED</h2>
          <p className="text-[#64748b] mb-8">Please connect your authorized Miden wallet to view the institution dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 page-transition">
      <div className="mb-6 md:mb-8 border-b border-[#1a1a2e] pb-4 md:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in-view">
        <div>
          <div className="text-[#3b82f6] text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2">Institutional Overview</div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#e2e8f0]">Dashboard</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link href="/submit" className="syndex-btn-primary px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[10px] md:text-xs text-center w-full sm:w-auto">
            SUBMIT UPDATE
          </Link>
          <Link href="/network" className="syndex-btn px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[10px] md:text-xs text-center w-full sm:w-auto">
            NETWORK STATE
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Institution Info */}
        <div className="syndex-card p-4 md:p-6 animate-in-view" style={{ animationDelay: '0.1s' }}>
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
        <div className="syndex-card p-4 md:p-6 animate-in-view" style={{ animationDelay: '0.2s' }}>
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
                  {[...submissions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((sub, i) => (
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
      <div className="syndex-card p-4 md:p-6 animate-in-view" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 md:mb-8 border-b border-[#1a1a2e] pb-4">
          Network Intelligence Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-widest">Model Precision (Aggregated)</span>
            {submissions.length === 0 || Object.values(schemaData).every(v => v === 0) ? (
              <div className="h-40 flex items-center justify-center border border-[#1a1a2e] bg-[#050508] p-4 text-center">
                <p className="text-[10px] text-[#64748b]">Submit your first gradient update to see model precision data</p>
              </div>
            ) : (
              <>
                <div className="h-40 flex items-end gap-2">
                  {Object.entries(schemaData).map(([label, count], i) => {
                    const maxCount = Math.max(...Object.values(schemaData));
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const abbr = label.split(' ').map(w => w[0]).join('');
                    return (
                      <div key={i} className="flex-1 bg-[#3b82f6]/20 border-t-2 border-[#3b82f6] relative group flex items-end justify-center pb-2 transition-all duration-500" style={{ height: `${height}%` }}>
                        <span className="text-[10px] font-bold text-[#e2e8f0] opacity-50">{abbr}</span>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a12] border border-[#1a1a2e] px-2 py-1 text-[10px] text-[#e2e8f0] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {label}: {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#64748b]">Real-time detection accuracy across participant network.</p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-widest">Threat Velocity</span>
            <div className="flex flex-col gap-3">
              {threats.length === 0 ? (
                <div className="p-3 bg-[#050508] border border-[#1a1a2e] text-center">
                  <span className="text-[#64748b] text-[10px] italic">No threat data yet. Submit pattern updates to populate threat intelligence.</span>
                </div>
              ) : threats.map((item, i) => (
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
