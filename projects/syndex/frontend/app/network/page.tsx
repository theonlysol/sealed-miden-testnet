"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { useMidenClient } from "@/lib/miden-client";

export default function NetworkPage() {
  const { connected } = useWallet();
  const { syncState, ready } = useMidenClient();
  
  const [blockNum, setBlockNum] = useState<number | null>(null);
  const [displayBlock, setDisplayBlock] = useState(0);
  const [loading, setLoading] = useState(false);
  const [health] = useState(99.8); // Mock network health
  const [activities, setActivities] = useState([
    { type: "register", hash: "0x7a2...b4", time: "Just now" },
    { type: "submit", hash: "0x3f8...1c", time: "2 mins ago" },
    { type: "verify", hash: "0x1d9...ea", time: "5 mins ago" },
    { type: "submit", hash: "0x9c2...4d", time: "12 mins ago" }
  ]);

  useEffect(() => {
    if (!ready) return;
    
    let isMounted = true;
    const fetchState = async () => {
      setLoading(true);
      try {
        const height = await syncState();
        if (isMounted) setBlockNum(height);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchState();
    
    const interval = setInterval(() => {
      fetchState();
      
      // Simulate live activity feed
      setActivities(prev => {
        const newAct = {
          type: ["submit", "verify", "register"][Math.floor(Math.random() * 3)],
          hash: "0x" + Array.from({length: 3}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") + "..." + Array.from({length: 2}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
          time: "Just now"
        };
        const updated = [newAct, ...prev].slice(0, 8);
        // update "Just now" to "X mins ago" etc theoretically
        return updated;
      });
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
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-[calc(100vh-4rem)] page-transition">
      <div className="mb-12 border-b border-[#1a1a2e] pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in-view">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] mb-2 flex items-center gap-3">
            Network State
            <span className="flex h-3 w-3 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
            </span>
          </h1>
          <p className="text-[#64748b] text-lg">Live telemetry from the Syndex Miden roll-up.</p>
        </div>
        
        {connected && (
          <div className="syndex-card px-6 py-4 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-1">Current Height</span>
              <span className="font-mono text-2xl font-bold text-[#e2e8f0]">
                {loading && blockNum === null ? "..." : `#${displayBlock.toLocaleString()}`}
              </span>
            </div>
            <button 
              onClick={() => syncState()}
              disabled={loading}
              className={`p-3 rounded-full border border-[#1a1a2e] transition-colors ${loading ? "animate-spin border-[#3b82f6] text-[#3b82f6]" : "text-[#64748b] hover:text-[#e2e8f0] hover:border-[#3b82f6]"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="syndex-card p-6 animate-in-view" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Total Participants</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">142</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +3
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-6 animate-in-view" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Gradient Updates</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">1,248</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +112
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-6 animate-in-view" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Shared Models</h3>
          <p className="text-4xl font-mono font-bold text-[#e2e8f0]">14</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#22c55e] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              +1
            </span>
            <span className="text-[#64748b]">this week</span>
          </div>
        </div>

        <div className="syndex-card p-6 animate-in-view border-[#3b82f6]/30" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-4">Active Contract</h3>
          <p className="text-lg font-mono font-bold text-[#e2e8f0] break-all">{process.env.NEXT_PUBLIC_SYNDEX_CONTRACT_ID || "0xPENDING"}</p>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs">
            <span className="text-[#3b82f6]">Miden Testnet</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 animate-in-view" style={{ animationDelay: '0.5s' }}>
          <div className="syndex-card p-8">
            <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
              Network Health
            </h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">System Uptime & Finality</span>
              <span className="text-[#22c55e] font-mono font-bold">{health}%</span>
            </div>
            
            <div className="w-full h-2 bg-[#050508] border border-[#1a1a2e] overflow-hidden">
              <div className="h-full bg-[#22c55e] transition-all duration-1000" style={{ width: `${health}%` }}></div>
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

        <div className="syndex-card p-8 animate-in-view" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-[#e2e8f0] font-bold tracking-widest uppercase text-sm mb-6 border-b border-[#1a1a2e] pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Live Activity
            </span>
            <span className="text-[10px] text-[#64748b]">POLLING (30s)</span>
          </h3>
          
          <div className="space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                  act.type === 'register' ? 'bg-[#3b82f6]' : 
                  act.type === 'verify' ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
                }`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[#e2e8f0] text-sm uppercase tracking-wider font-bold">
                      {act.type}
                    </span>
                    <span className="text-[#64748b] text-[10px]">{act.time}</span>
                  </div>
                  <div className="text-[#94a3b8] font-mono text-xs truncate">
                    TX: {act.hash}
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
