/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useMidenClient } from "@/lib/miden-client";
import { readSharedActivity, writeSharedActivity } from "@/lib/shared-store";

export default function NetworkPage() {
  const { syncState, ready } = useMidenClient();
  
  const [blockNum, setBlockNum] = useState<number | null>(null);
  const [displayBlock, setDisplayBlock] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({
    participants: 0,
    updates: 0,
    models: 0,
    health: 100
  });

  const [activities, setActivities] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const shared = await readSharedActivity();

      const allKeys = Object.keys(localStorage);
      const regKeys = allKeys.filter(k => k.startsWith('syndex_registration_'));

      const localRegEvents = regKeys.map(k => {
        const r = JSON.parse(localStorage.getItem(k) || '{}');
        return {
          type: 'REGISTER',
          institutionId: r.institutionId,
          timestamp: r.timestamp,
          block: r.block,
          label: `Institution #${r.institutionId} registered`
        };
      });

      const localUpdates = JSON.parse(localStorage.getItem('syndex_updates') || '[]');
      const localSubmitEvents = localUpdates.map((u: any) => ({
        type: 'SUBMIT',
        institutionId: u.institutionId || u.institution_id,
        timestamp: u.timestamp,
        block: u.blockNum || u.block,
        schema: u.schema || u.desc,
        gradientHash: u.gradientHash,
        label: `Institution #${u.institutionId || u.institution_id} submitted · ${u.schema || u.desc || 'Pattern Update'} · Block #${u.blockNum || u.block || '0'}`
      }));

      const regEvents = [...localRegEvents];
      if (shared.registrations) {
        shared.registrations.forEach((sr: any) => {
          const exists = regEvents.some(r => r.institutionId === sr.institutionId);
          if (!exists) {
            regEvents.push({
              type: 'REGISTER',
              institutionId: sr.institutionId,
              timestamp: sr.timestamp,
              block: sr.block,
              label: `Institution #${sr.institutionId} registered`
            });
          }
        });
      }

      const submitEvents = [...localSubmitEvents];
      if (shared.updates) {
        shared.updates.forEach((su: any) => {
          const exists = submitEvents.some(u => 
            (u.gradientHash && su.gradientHash && u.gradientHash === su.gradientHash) || 
            (u.txId && su.txId && u.txId === su.txId) ||
            (u.timestamp && su.timestamp && u.timestamp === su.timestamp)
          );
          if (!exists) {
            submitEvents.push({
              type: 'SUBMIT',
              institutionId: su.institutionId || su.institution_id,
              timestamp: su.timestamp,
              block: su.blockNum || su.block,
              schema: su.schema || su.desc,
              gradientHash: su.gradientHash,
              label: `Institution #${su.institutionId || su.institution_id} submitted · ${su.schema || su.desc || 'Pattern Update'} · Block #${su.blockNum || su.block || '0'}`
            });
          }
        });
      }

      const combined = [...regEvents, ...submitEvents]
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 10);

      // Calculate Stats
      const participants = new Set([
        ...regEvents.map(r => r.institutionId), 
        ...submitEvents.map((u: any) => u.institutionId || u.institution_id)
      ]).size;
      const totalUpdates = submitEvents.filter((h: any) => h.type === "SUBMIT" || !h.type).length;
      const models = new Set(submitEvents.filter((h: any) => h.type === "SUBMIT" || !h.type).map((h: any) => h.schema || h.desc)).size;
      
      setStats(prev => ({ ...prev, participants, updates: totalUpdates, models }));

      // Auto-sync local data to Gist shared store if missing
      setTimeout(async () => {
        try {
          for (const localReg of localRegEvents) {
            const inShared = shared.registrations?.some((sr: any) => sr.institutionId === localReg.institutionId);
            if (!inShared) {
              console.log("Auto-syncing local registration to shared store:", localReg);
              const allKeys = Object.keys(localStorage);
              const matchKey = allKeys.find(k => k.startsWith('syndex_registration_') && k.includes(localReg.institutionId));
              const orig = matchKey ? JSON.parse(localStorage.getItem(matchKey) || '{}') : {};
              await writeSharedActivity('REGISTER', {
                institutionId: localReg.institutionId,
                institutionName: orig.institutionName || 'Syndex Participant',
                block: localReg.block,
                walletAddress: orig.walletAddress || ''
              });
            }
          }
          for (const localSub of localSubmitEvents) {
            const inShared = shared.updates?.some((su: any) => 
              (su.gradientHash && localSub.gradientHash && su.gradientHash === localSub.gradientHash) || 
              (su.timestamp && localSub.timestamp && su.timestamp === localSub.timestamp)
            );
            if (!inShared) {
              console.log("Auto-syncing local submission to shared store:", localSub);
              await writeSharedActivity('SUBMIT', {
                desc: localSub.schema || 'Pattern Update',
                gradientHash: localSub.gradientHash,
                institutionId: localSub.institutionId,
                schema: localSub.schema,
                blockNum: localSub.block
              });
            }
          }
        } catch (syncErr) {
          console.error("Auto-sync to shared store failed:", syncErr);
        }
      }, 100);

      const formatted = combined.map((act) => {
        const diff = Date.now() - act.timestamp;
        const mins = Math.floor(diff / 60000);
        let timeLabel = "Just now";
        if (mins > 0 && mins < 60) timeLabel = `${mins}m ago`;
        else if (mins >= 60) timeLabel = `${Math.floor(mins / 60)}h ago`;
        
        return {
          type: act.type,
          label: act.label,
          hash: act.type === 'SUBMIT' && act.gradientHash ? `${act.gradientHash.slice(0, 8)}...${act.gradientHash.slice(-4)}` : "0x000...00",
          time: timeLabel
        };
      });
      setActivities(formatted);
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  };

  useEffect(() => {
    loadData();
    
    if (!ready) return;
    
    let isMounted = true;
    const fetchState = async () => {
      setLoading(true);
      try {
        const height = await syncState();
        if (isMounted) {
          setBlockNum(height);
          setStats(prev => ({ ...prev, health: 100 }));
        }
      } catch (err) {
        console.error("RPC Error:", err);
        if (isMounted) {
          setStats(prev => ({ ...prev, health: 0 }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchState();
    
    const interval = setInterval(() => {
      fetchState();
      loadData();
    }, 30000); // 30s polling
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ready, syncState]);

  // Block counter animation
  useEffect(() => {
    if (blockNum !== null && displayBlock < blockNum) {
      const diff = blockNum - displayBlock;
      const step = Math.max(1, Math.floor(diff / 20));
      const timer = setInterval(() => {
        setDisplayBlock(prev => {
          if (prev + step >= blockNum) {
            clearInterval(timer);
            return blockNum;
          }
          return prev + step;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [blockNum, displayBlock]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 page-transition">
      <div className="mb-8 md:mb-12 border-b border-[#1a1a2e] pb-6 md:pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in-view">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2 flex items-center gap-3">
            Network State
            <span className="flex h-3 w-3 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
            </span>
          </h1>
          <p className="text-[#64748b] text-sm md:text-lg">Live telemetry from the Syndex Miden roll-up.</p>
        </div>
        
        <div className="syndex-card px-4 md:px-6 py-3 md:py-4 flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-[#64748b] font-bold uppercase tracking-widest mb-1">Current Height</span>
            <span className="font-mono text-xl md:text-2xl font-bold text-[#e2e8f0]">
              {loading && blockNum === null ? (
                <span className="flex items-center gap-2 text-[#64748b] text-sm font-sans">
                  <span className="w-3 h-3 border-2 border-[#64748b] border-t-transparent rounded-full animate-spin"></span> Syncing...
                </span>
              ) : blockNum === null ? (
                <span className="text-[#f59e0b] text-sm font-sans">RPC Unavailable</span>
              ) : (
                `#${displayBlock.toLocaleString()}`
              )}
            </span>
          </div>
          <button 
            onClick={() => syncState()}
            disabled={loading}
            className={`p-2 md:p-3 rounded-full border border-[#1a1a2e] transition-colors ${loading ? "animate-spin border-[#3b82f6] text-[#3b82f6]" : "text-[#64748b] hover:text-[#e2e8f0] hover:border-[#3b82f6]"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="syndex-card p-4 md:p-5 animate-in-view" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Total Participants</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">{stats.participants}</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +3
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-4 md:p-5 animate-in-view" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Gradient Updates</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">{stats.updates}</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +112
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-4 md:p-5 animate-in-view" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Shared Models</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">{stats.models}</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +1
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-4 md:p-5 animate-in-view border-[#3b82f6]/30" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Active Contract</h3>
          <p className="text-lg font-mono font-bold text-[#e2e8f0] break-all">{process.env.NEXT_PUBLIC_SYNDEX_CONTRACT_ID || "0xPENDING"}</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#3b82f6]">Miden Testnet</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-6 md:space-y-8 animate-in-view" style={{ animationDelay: '0.5s' }}>
          <div className="syndex-card p-4 md:p-5">
            <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
              Network Health
            </h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">System Uptime & Finality</span>
              <span className={`font-mono font-bold ${stats.health === 100 ? "text-[#22c55e]" : "text-red-500"}`}>
                {stats.health}% {stats.health === 100 ? "ONLINE" : "RPC UNREACHABLE"}
              </span>
            </div>
            
            <div className="w-full h-2 bg-[#050508] border border-[#1a1a2e] overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${stats.health === 100 ? "bg-[#22c55e]" : "bg-red-500"}`} style={{ width: `${stats.health}%` }}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#050508] border border-[#1a1a2e] p-4 text-center">
                <span className="block text-xs text-[#64748b] font-bold uppercase tracking-widest mb-2">Proof Generation</span>
                <span className="font-mono text-[#e2e8f0] text-xl">Client-side</span>
              </div>
              <div className="bg-[#050508] border border-[#1a1a2e] p-4 text-center">
                <span className="block text-xs text-[#64748b] font-bold uppercase tracking-widest mb-2">Verification</span>
                <span className="font-mono text-[#e2e8f0] text-xl">&lt; 2s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="syndex-card p-4 md:p-5 animate-in-view" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Live Activity
            </span>
            <span className="text-[10px] text-[#64748b]">POLLING (30s)</span>
          </h3>
          
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-[#64748b] text-sm text-center py-8 italic">No activity yet. Be the first to submit.</p>
            ) : activities.map((act, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                  act.type === 'REGISTER' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]'
                }`}></div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[#e2e8f0] text-sm tracking-wider font-bold truncate pr-2">
                      {act.label}
                    </span>
                    <span className="text-[#64748b] text-[10px] whitespace-nowrap">{act.time}</span>
                  </div>
                  <div className="text-[#94a3b8] font-mono text-xs truncate">
                    {act.type === 'REGISTER' ? `ID: ${act.label.split('#')[1]?.split(' ')[0] || ''} | 0x000...00` : `TX: ${act.hash}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
