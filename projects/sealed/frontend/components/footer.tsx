import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-12 px-4 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-green-500 flex items-center justify-center">
                <span className="text-zinc-950 font-bold text-xs">S</span>
              </div>
              <span className="font-bold tracking-tight text-white">Sealed</span>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs">
              Private, zero-knowledge credential system built on the Miden blockchain.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/theonlysol_"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-800"
            >
              <svg 
                viewBox="0 0 24 24" 
                aria-hidden="true" 
                className="size-5 fill-zinc-400 group-hover:fill-white transition-colors"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">@theonlysol_</span>
            </a>

            <a
              href="https://github.com/theonlysol/sealed-miden-testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-800"
            >
              <svg 
                viewBox="0 0 24 24" 
                aria-hidden="true" 
                className="size-5 fill-zinc-400 group-hover:fill-white transition-colors"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.011 10.011 0 0022 12c0-5.523-4.477-10-10-10z"></path>
              </svg>
              <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">GitHub</span>
            </a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Sealed Miden. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Built on Miden Testnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
