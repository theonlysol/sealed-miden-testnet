/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet-provider";
import { readSharedActivity, writeSharedActivity } from "@/lib/shared-store";

export default function Home() {
  const { connected } = useWallet();
  const [feedItems, setFeedItems] = useState<{time: string, message: string, type: string, timestamp?: number, isExample?: boolean}[]>([]);
  const [counts, setCounts] = useState({ proofs: 0, models: 0 });
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    const loadLandingData = async () => {
      try {
        const shared = await readSharedActivity();

        const updates = JSON.parse(
          localStorage.getItem('syndex_updates') || '[]'
        );
        const allKeys = Object.keys(localStorage);
        const regKeys = allKeys.filter(k => k.startsWith('syndex_registration_'));
        
        const localRegEvents = regKeys.map(k => {
          const r = JSON.parse(localStorage.getItem(k) || '{}');
          return {
            time: new Date(r.timestamp).toLocaleTimeString(),
            message: `Institution #${r.institutionId} registered on Syndex network`,
            type: 'REGISTER',
            timestamp: r.timestamp,
            institutionId: r.institutionId
          };
        });
        
        const localSubmitEvents = updates.map((u: any) => ({
          time: new Date(u.timestamp).toLocaleTimeString(),
          message: `Institution #${u.institutionId || u.institution_id || 'Unknown'} submitted update · ${u.schema || u.desc || 'Pattern Update'} · Block #${u.blockNum || u.block || '0'}`,
          type: 'SUBMIT',
          timestamp: u.timestamp,
          gradientHash: u.gradientHash,
          txId: u.txId,
          institutionId: u.institutionId || u.institution_id,
          schema: u.schema || u.desc
        }));

        // Merge Gist and local
        const regEvents = [...localRegEvents];
        if (shared.registrations) {
          shared.registrations.forEach((sr: any) => {
            const exists = regEvents.some(r => r.institutionId === sr.institutionId);
            if (!exists) {
              regEvents.push({
                time: new Date(sr.timestamp).toLocaleTimeString(),
                message: `Institution #${sr.institutionId} registered on Syndex network`,
                type: 'REGISTER',
                timestamp: sr.timestamp,
                institutionId: sr.institutionId
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
                time: new Date(su.timestamp).toLocaleTimeString(),
                message: `Institution #${su.institutionId || su.institution_id || 'Unknown'} submitted update · ${su.schema || su.desc || 'Pattern Update'} · Block #${su.blockNum || su.block || '0'}`,
                type: 'SUBMIT',
                timestamp: su.timestamp,
                gradientHash: su.gradientHash,
                txId: su.txId,
                institutionId: su.institutionId || su.institution_id,
                schema: su.schema || su.desc
              });
            }
          });
        }

        let items = [...regEvents, ...submitEvents].sort((a, b) => 
          (b.timestamp || 0) - (a.timestamp || 0)
        ).slice(0, 10);

        if (items.length === 0) {
          setIsSample(true);
          items = [
            { time: new Date().toLocaleTimeString(), message: "Institution #959843 submitted update · Money Laundering · Block #2435", type: "EXAMPLE", isExample: true, timestamp: 3 },
            { time: new Date(Date.now() - 5000).toLocaleTimeString(), message: "Institution #22419 registered on Syndex network", type: "EXAMPLE", isExample: true, timestamp: 2 },
            { time: new Date(Date.now() - 15000).toLocaleTimeString(), message: "Institution #11054 submitted update · Account Takeover · Block #2433", type: "EXAMPLE", isExample: true, timestamp: 1 }
          ];
        } else {
          setIsSample(false);
        }

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
                  block: localReg.timestamp ? 0 : 0 // fallback
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

        setFeedItems(items);
        
        const realProofs = submitEvents.length;
        const realModels = new Set(submitEvents.map(u => u.schema)).size;

        // Animated counters
        const startTime = Date.now();
        const duration = 2000;
        const countTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          setCounts({
            proofs: Math.floor(progress * realProofs),
            models: Math.floor(progress * realModels)
          });

          if (progress === 1) clearInterval(countTimer);
        }, 50);

        return () => clearInterval(countTimer);
      } catch (e) {
        console.error("Failed to load landing data:", e);
      }
    };

    let cancelTimer: (() => void) | undefined;
    const run = async () => {
      cancelTimer = await loadLandingData();
    };
    run();
    
    const fetchInterval = setInterval(loadLandingData, 30000);

    return () => {
      clearInterval(fetchInterval);
      if (cancelTimer) cancelTimer();
    };
  }, []);

  // Auto-cycle effect
  useEffect(() => {
    if (feedItems.length <= 1) return;
    
    const cycleInterval = setInterval(() => {
      setFeedItems(prev => {
        const next = [...prev];
        const first = next.shift();
        if (first) {
          next.push(first);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(cycleInterval);
  }, [feedItems.length]);

  return (
    <div className="flex flex-col page-transition max-w-6xl mx-auto px-4 md:px-8">
      <div className="flex-1 flex flex-col lg:flex-row items-center w-full py-8 md:py-12 gap-8 md:gap-12">
        {/* Left: Hero */}
        <div className="flex-1 space-y-6 md:space-y-8 animate-in-view w-full">
          <div className="inline-block border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-3 py-1 text-[#3b82f6] text-[10px] md:text-xs font-bold uppercase tracking-widest">
            Syndex Intelligence Network
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#e2e8f0] leading-tight">
            Fraud intelligence <br/>
            <span className="text-[#64748b]">without exposure.</span>
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-[#94a3b8] max-w-2xl leading-relaxed">
            Syndex lets competing institutions share fraud signals and train a shared detection model — without any institution seeing another&apos;s data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/register" 
              className="syndex-btn-primary px-8 py-4 text-center font-bold tracking-wider text-sm w-full sm:w-auto"
            >
              REGISTER INSTITUTION
            </Link>
            <Link 
              href="/network" 
              className="syndex-btn px-8 py-4 text-center font-bold tracking-wider text-sm w-full sm:w-auto"
            >
              VIEW NETWORK
            </Link>
          </div>
        </div>

        {/* Right: Live Feed */}
        <div className="w-full lg:w-[400px] max-h-64 md:max-h-96 syndex-card p-4 md:p-6 flex flex-col relative animate-in-view" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4 md:mb-6 pb-4 border-b border-[#1a1a2e]">
            <h3 className="font-bold text-[#e2e8f0] tracking-widest text-xs md:text-sm">LIVE FEED</h3>
            <div className="flex items-center gap-2">
              {isSample && (
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 font-bold mr-2">
                  SAMPLE DATA
                </span>
              )}
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-fast"></span>
                  <span className="text-[10px] md:text-xs text-[#22c55e] font-bold">CONNECTED</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
                  <span className="text-[10px] md:text-xs text-[#64748b] font-bold">NOT CONNECTED</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4 flex-1 overflow-hidden max-h-72 relative">
            {feedItems.map((item, idx) => (
              <div 
                key={`${item.timestamp}-${item.message}`} 
                className="text-xs md:text-sm font-mono p-3 bg-[#050508] border border-[#1a1a2e] text-[#94a3b8] break-words transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in"
                style={{ opacity: 1 - (idx * 0.2) }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] md:text-xs text-[#3b82f6]">[{item.time}]</span>
                  {item.isExample && (
                    <span className="text-[10px] font-bold text-amber-500 border border-amber-500/30 px-1.5 py-0.5 bg-amber-500/10">EXAMPLE</span>
                  )}
                </div>
                {item.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stat Bar */}
      <div className="border-t border-[#1a1a2e] bg-[#0a0a12] mt-auto w-full max-w-none">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.3s' }}>
            <span className="text-[10px] md:text-xs text-[#64748b] uppercase tracking-widest mb-1 md:mb-2">Verified Proofs</span>
            <span className="font-mono text-2xl md:text-3xl font-bold text-[#e2e8f0]">
              {counts.proofs.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.4s' }}>
            <span className="text-[10px] md:text-xs text-[#64748b] uppercase tracking-widest mb-1 md:mb-2">Security Guarantee</span>
            <span className="font-mono text-xl md:text-2xl font-bold text-[#22c55e] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ZERO-KNOWLEDGE
            </span>
          </div>
          <div className="flex flex-col animate-in-view" style={{ animationDelay: '0.5s' }}>
            <span className="text-[10px] md:text-xs text-[#64748b] uppercase tracking-widest mb-1 md:mb-2">Shared Models</span>
            <span className="font-mono text-2xl md:text-3xl font-bold text-[#e2e8f0]">
              {counts.models}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
