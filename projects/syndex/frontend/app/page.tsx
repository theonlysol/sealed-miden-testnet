"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [feedItems, setFeedItems] = useState<string[]>([]);
  const [counts, setCounts] = useState({ proofs: 0, models: 0 });

  useEffect(() => {
    // Simulated live feed
    const events = [
      "Institution #4821 submitted update · Block #34912",
      "Model root updated · 3f8a2b1c → 7d2e9f4a",
      "New participant joined · Schema: Transaction Fraud",
      "Validation successful · 12 proofs verified",
      "Institution #9102 submitted update · Block #34913",
      "Model root updated · 7d2e9f4a → a1b2c3d4",
    ];
    let i = 0;
    
    setFeedItems([events[0], events[1], events[2]]);
    
    const interval = setInterval(() => {
      i = (i + 1) % events.length;
      setFeedItems(prev => [events[i], ...prev.slice(0, 4)]);
    }, 3000);

    // Number counters
    const countInterval = setInterval(() => {
      setCounts(prev => ({
        proofs: Math.min(prev.proofs + 7, 1248),
        models: Math.min(prev.models + 1, 14),
      }));
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden page-transition">
      <div className="flex-1 flex flex-col md:flex-row items-center max-w-7xl mx-auto w-full px-6 py-12 gap-12 overflow-hidden">
        {/* Left: Hero */}
        <div className="flex-1 space-y-8 animate-in-view overflow-hidden">
          <div className="inline-block border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-3 py-1 text-[#3b82f6] text-xs font-bold uppercase tracking-widest">
            Syndex Intelligence Network
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#e2e8f0] leading-tight">
            Fraud intelligence <br/>
            <span className="text-[#64748b]">without exposure.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl leading-relaxed">
            Syndex lets competing institutions share fraud signals and train a shared detection model — without any institution seeing another&apos;s data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/register" 
              className="syndex-btn-primary px-8 py-4 text-center font-bold tracking-wider text-sm"
            >
              REGISTER INSTITUTION
            </Link>
            <Link 
              href="/network" 
              className="syndex-btn px-8 py-4 text-center font-bold tracking-wider text-sm"
            >
              VIEW NETWORK
            </Link>
          </div>
        </div>

        {/* Right: Live Feed */}
        <div className="w-full md:w-[400px] h-[500px] syndex-card p-6 flex flex-col relative overflow-hidden animate-in-view" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a2e]">
            <h3 className="font-bold text-[#e2e8f0] tracking-widest text-sm">LIVE FEED</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-fast"></span>
              <span className="text-xs text-[#22c55e] font-bold">CONNECTED</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-scroll no-scrollbar max-h-[400px]">
            {feedItems.map((item, idx) => (
              <div 
                key={idx} 
                className="text-sm font-mono p-3 bg-[#050508] border border-[#1a1a2e] text-[#94a3b8]"
                style={{ opacity: 1 - (idx * 0.2) }}
              >
                <div className="text-xs text-[#3b82f6] mb-1">[{new Date().toISOString().split('T')[1].slice(0,8)}]</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stat Bar */}
      <div className="border-t border-[#1a1a2e] bg-[#0a0a12] mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.3s' }}>
            <span className="text-xs text-[#64748b] uppercase tracking-widest mb-2">Verified Proofs</span>
            <span className="font-mono text-3xl font-bold text-[#e2e8f0]">
              {counts.proofs.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.4s' }}>
            <span className="text-xs text-[#64748b] uppercase tracking-widest mb-2">Security Guarantee</span>
            <span className="font-mono text-2xl font-bold text-[#22c55e] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ZERO-KNOWLEDGE
            </span>
          </div>
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.5s' }}>
            <span className="text-xs text-[#64748b] uppercase tracking-widest mb-2">Shared Models</span>
            <span className="font-mono text-3xl font-bold text-[#e2e8f0]">
              {counts.models}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
