"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";

const WalletMultiButton = dynamic(
  () => import("@demox-labs/miden-wallet-adapter-reactui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavLink = ({ href, children, mobile }: { href: string; children: React.ReactNode; mobile?: boolean }) => {
    const isActive = href === "/" ? false : pathname === href;
    return (
      <Link 
        href={href} 
        onClick={() => setIsMenuOpen(false)}
        className={`relative ${mobile ? 'block py-2 px-6 border-b border-[#1a1a2e]' : 'px-4 py-2'} transition-colors hover:text-[#e2e8f0] ${isActive ? "text-[#e2e8f0]" : "text-[#64748b]"}`}
      >
        {isActive && !mobile && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#3b82f6] rounded-r-full"></span>
        )}
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#1a1a2e] bg-[#050508]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[#3b82f6] text-[#050508] font-bold text-sm rounded-sm">
            SX
          </div>
          <Link href="/" className="text-lg md:text-xl font-bold tracking-widest text-[#e2e8f0]">
            SYNDEX
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm">
          <NavLink href="/dashboard">DASHBOARD</NavLink>
          <NavLink href="/submit">SUBMIT</NavLink>
          <NavLink href="/network">NETWORK</NavLink>
          <NavLink href="/docs">DOCS</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="[&>button]:bg-[#0a0a12] [&>button]:border [&>button]:border-[#1a1a2e] [&>button:hover]:border-[#3b82f6] [&>button]:text-[#e2e8f0] [&>button]:font-mono [&>button]:text-xs md:[&>button]:text-sm [&>button]:px-2 md:[&>button]:px-4 [&>button]:transition-colors">
            <WalletMultiButton />
          </div>
          <button 
            className="md:hidden text-[#e2e8f0] p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#050508] border-b border-[#1a1a2e] flex flex-col">
          <NavLink href="/dashboard" mobile>DASHBOARD</NavLink>
          <NavLink href="/submit" mobile>SUBMIT</NavLink>
          <NavLink href="/network" mobile>NETWORK</NavLink>
          <NavLink href="/docs" mobile>DOCS</NavLink>
        </div>
      )}
    </nav>
  );
}
