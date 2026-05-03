"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter-reactui";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

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
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
