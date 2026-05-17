export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a2e] bg-[#050508] px-4 md:px-8 py-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        
        {/* Left Side: Brand Logo and Title */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-[#3b82f6] text-white font-mono font-bold text-[12px] px-2 py-0.5 rounded">
            SX
          </div>
          <span className="font-mono text-xs md:text-sm text-[#64748b]">
            Syndex — Private Fraud Intelligence on Miden
          </span>
        </div>

        {/* Right Side: Navigation & Stats */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-6">
            {/* Twitter Link */}
            <a
              href="https://x.com/theonlysol_"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs md:text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors no-underline flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @theonlysol_
            </a>

            {/* GitHub Link */}
            <a
              href="https://github.com/theonlysol/sealed-miden-testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs md:text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors no-underline flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217 .682-.483 0-.237-.008-.868-.013-1.703-2.782 .605-3.369-1.343-3.369-1.343-.454-1.158-1.11 -1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636 -1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446 -1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379 .202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309 .678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </a>
          </div>

          {/* Testnet Stat */}
          <span className="font-mono text-[10px] text-[#2a2a3e] tracking-widest uppercase">
            Built on Miden Testnet · Block 654779
          </span>
        </div>

      </div>
    </footer>
  );
}
