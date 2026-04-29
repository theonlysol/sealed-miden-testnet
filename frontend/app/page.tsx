import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500">
          Private Credentials on Miden
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The Sealed protocol enables verifiable reputation systems without compromising user privacy. 
          Powered by zero-knowledge proofs and the Miden blockchain.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link 
            href="/dashboard" 
            className="inline-flex h-12 items-center justify-center rounded-md bg-zinc-50 px-8 text-sm font-medium text-zinc-950 shadow transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
          >
            Enter Vault
          </Link>
          <Link 
            href="/verify" 
            className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-800 bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
          >
            Verify a Proof
          </Link>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-500 opacity-[0.15] blur-[100px]"></div>
      </div>
    </div>
  );
}
