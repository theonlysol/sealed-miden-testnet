import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Syndex - Fraud Intelligence Network",
  description: "Private fraud intelligence network for financial institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        {/* Animated Top Bar */}
        <div className="h-[2px] w-full top-bar-animated absolute top-0 z-50"></div>
        
        <WalletProvider>
          <Navbar />
          <main className="flex-1 relative">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
