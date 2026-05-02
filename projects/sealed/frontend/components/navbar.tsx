"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./wallet-provider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, address, connect, disconnect } = useWallet();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/verify", label: "Verify" },
    { href: "/issue", label: "Issue" },
    { href: "/sdk", label: "SDK" },
  ];

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center">
              <span className="font-bold text-lg text-white">S</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Sealed</span>
          </Link>

          <div className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={disconnect}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
