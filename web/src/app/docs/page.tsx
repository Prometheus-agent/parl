import Image from "next/image";
import Link from "next/link";

const sidebarSections = [
  { id: "overview", title: "Overview" },
  { id: "quickstart", title: "Quickstart" },
  { id: "contracts", title: "Smart Contracts" },
  { id: "parimutuel", title: "Parimutuel Math" },
  { id: "pool-lifecycle", title: "Pool Lifecycle" },
  { id: "fees", title: "Fee Structure" },
  { id: "resolution", title: "Resolution & Oracles" },
  { id: "api", title: "API Reference" },
  { id: "sdk", title: "SDK & Integration" },
  { id: "security", title: "Security" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center group">
          <Image src="/logo.svg" alt="Parl" width={88} height={22} className="h-[22px] w-auto" priority />
          <span className="text-xs text-white/30 ml-1.5 font-body">/ docs</span>
        </Link>
        <div className="hidden md:flex ml-auto items-center gap-4">
          <Link href="/app" className="text-xs text-white/40 hover:text-white transition-colors">Markets</Link>
          <Link href="/whitepaper" className="text-xs text-white/40 hover:text-white transition-colors">Whitepaper</Link>
        </div>
        {/* Mobile hamburger */}
        <details className="md:hidden group ml-auto">
          <summary className="list-none flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] cursor-pointer hover:bg-white/[0.1] transition-colors">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute top-full right-4 mt-2 w-48 rounded-xl bg-black/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
            <Link href="/" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Home</Link>
            <Link href="/app" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Markets</Link>
            <Link href="/dashboard" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Dashboard</Link>
            <Link href="/docs" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">Docs</Link>
            <Link href="/whitepaper" className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">Whitepaper</Link>
          </div>
        </details>
      </nav>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-white/[0.06] p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">
            Documentation
          </p>
          <nav className="space-y-1">
            {sidebarSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block text-sm text-white/40 hover:text-white transition-colors duration-150 py-1.5"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10 max-w-4xl">
          {/* ── Overview ── */}
          <section id="overview" className="mb-16 scroll-mt-20">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Documentation
            </h1>
            <p className="text-sm text-white/40 mb-8 font-body">
              Parl Protocol v0.1 — Deployed on Avalanche Fuji.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50">
                <span className="text-white/70">PoolEngine:</span>{" "}
                <code className="text-purple-400 font-mono">0xB3702B...be00</code>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50">
                <span className="text-white/70">Chain:</span> Avalanche Fuji (43113)
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50">
                <span className="text-white/70">License:</span> MIT
              </div>
            </div>
            <div className="prose prose-invert max-w-none text-sm text-white/60 leading-relaxed font-body space-y-4">
              <p>
                Parl is a fully on-chain parimutuel prediction markets protocol.
                Unlike AMM-based prediction markets (e.g. Polymarket), Parl uses
                a <strong className="text-white/80">parimutuel pool</strong>{" "}
                mechanism — all bets for a given market pool into a shared pot,
                and winners split the pot proportionally.
              </p>
              <p>
                This means <strong className="text-white/80">no liquidity providers</strong>,{" "}
                no impermanent loss, and no AMM slippage. The protocol is
                designed to be used as an infrastructure layer — integrate into
                your own frontend, aggregator, or platform.
              </p>
            </div>
          </section>

          {/* ── Quickstart ── */}
          <section id="quickstart" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">1</span>
              Quickstart
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>Create your first prediction market in under 5 minutes.</p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-3">1. Connect to Fuji</h3>
                <p className="mb-3">Add Avalanche Fuji to your wallet:</p>
                <div className="bg-black rounded-lg p-3 font-mono text-xs space-y-1">
                  <div><span className="text-white/30">Network:</span> <span className="text-purple-400">Avalanche Fuji C-Chain</span></div>
                  <div><span className="text-white/30">RPC:</span> <span className="text-purple-400">https://avalanche-fuji.infura.io/v3/...</span></div>
                  <div><span className="text-white/30">Chain ID:</span> <span className="text-purple-400">43113</span></div>
                  <div><span className="text-white/30">Currency:</span> <span className="text-purple-400">AVAX</span></div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-3">2. Create a Market</h3>
                <p className="mb-3">Call <code className="text-purple-400 font-mono text-xs">createMarket</code> on PoolEngine:</p>
                <pre className="bg-black rounded-lg p-3 text-xs font-mono overflow-x-auto text-white/70">
                  <span className="text-emerald-400">// Params</span>
                  {`
- description: "Will BTC > $100k by EOY?"
- outcomes: ["Yes", "No"]
- resolutionDelay: 604800 (7 days)
- resolverAddress: 0x...
- platformFeeBps: 200 (2%)
                  `.trim()}
                </pre>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-3">3. Place a Bet</h3>
                <p>Call <code className="text-purple-400 font-mono text-xs">placeBet</code> with the marketId, outcome index, and ETH value.</p>
              </div>
            </div>
          </section>

          {/* ── Smart Contracts ── */}
          <section id="contracts" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">2</span>
              Smart Contracts
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                The protocol consists of a single core contract:{" "}
                <strong className="text-white/80">PoolEngine</strong>.
              </p>

              <h3 className="text-sm font-medium text-white mt-6">PoolEngine</h3>
              <div className="bg-black rounded-lg p-4 font-mono text-xs border border-white/[0.06]">
                <span className="text-purple-400">address</span> PoolEngine ={" "}
                <span className="text-emerald-400">0xB3702B20900AE748A68287B75b6065284081be00</span>;
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30 font-medium">Function</th>
                      <th className="text-left py-2 pr-4 text-white/30 font-medium">Params</th>
                      <th className="text-left py-2 text-white/30 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["createMarket", "desc, outcomes[], delay, resolver, feeBps", "Create a new market"],
                      ["placeBet", "marketId, outcomeIndex", "Place bet (payable)"],
                      ["resolveMarket", "marketId, winnerIndex", "Resolve to an outcome"],
                      ["claimPayout", "marketId", "Claim winnings"],
                      ["getMarket", "marketId", "Get market details"],
                    ].map(([fn, params, desc]) => (
                      <tr key={fn} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-purple-400 whitespace-nowrap">{fn}</td>
                        <td className="py-2 pr-4 text-white/40 whitespace-nowrap">{params}</td>
                        <td className="py-2 text-white/40">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                Verified on Snowscan:{" "}
                <a
                  href="https://testnet.snowscan.xyz/address/0xB3702B20900AE748A68287B75b6065284081be00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  testnet.snowscan.xyz →
                </a>
              </p>
            </div>
          </section>

          {/* ── Parimutuel Math ── */}
          <section id="parimutuel" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">3</span>
              Parimutuel Math
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                Parl uses a standard parimutuel payout model. Unlike AMMs, odds
                are not set by a formula — they emerge from the distribution of
                bets in the pool.
              </p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-3">Payout Formula</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-black rounded-lg p-4 font-mono text-xs flex-1 min-w-[200px]">
                    <div className="text-white/30 mb-2">Winnings per bettor</div>
                    <div className="text-white/80">
                      payout = (betAmount / totalWinnerPool) × (totalPool × (1 - fee))
                    </div>
                  </div>
                  <div className="bg-black rounded-lg p-4 font-mono text-xs flex-1 min-w-[200px]">
                    <div className="text-white/30 mb-2">Implied odds</div>
                    <div className="text-white/80">
                      odds ≈ totalPool / outcomePool
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-3">Example: 3-Outcome Race</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-2 pr-4 text-white/30">Outcome</th>
                        <th className="text-left py-2 pr-4 text-white/30">Pool (ETH)</th>
                        <th className="text-left py-2 text-white/30">Implied Odds</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/60">
                      {[
                        ["Team A", "2.5", "1.52×"],
                        ["Team B", "1.0", "3.80×"],
                        ["Draw", "0.3", "12.67×"],
                      ].map(([outcome, pool, odds]) => {
                        const pct = pool === "2.5" ? "65.8" : pool === "1.0" ? "26.3" : "7.9";
                        return (
                          <tr key={outcome} className="border-b border-white/[0.03]">
                            <td className="py-2 pr-4 text-white">{outcome}</td>
                            <td className="py-2 pr-4">{pool} ETH</td>
                            <td className="py-2 text-purple-400">{odds}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  Total pool: 3.8 ETH. If Team A wins, the 2.5 ETH pool splits the
                  pool (minus 2% fee) proportionally.
                </p>
              </div>
            </div>
          </section>

          {/* ── Pool Lifecycle ── */}
          <section id="pool-lifecycle" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">4</span>
              Pool Lifecycle
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>Every market goes through four distinct phases:</p>

              {[
                {
                  phase: "Active",
                  desc: "Bettors can place bets on any outcome. Market resolves when the resolver submits the winning outcome.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                },
                {
                  phase: "Resolved",
                  desc: "The market has a winning outcome. Bettors who bet on the winner can now claim their payout.",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/20",
                },
                {
                  phase: "Claimed",
                  desc: "All winning bettors have claimed their payouts. The market is finalized.",
                  color: "text-white/40",
                  bg: "bg-white/[0.03]",
                  border: "border-white/[0.06]",
                },
                {
                  phase: "Canceled",
                  desc: "Market was canceled (e.g., no resolution within timeout). Bettors can reclaim their stake.",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/20",
                },
              ].map((phase) => (
                <div
                  key={phase.phase}
                  className={`rounded-xl ${phase.bg} ${phase.border} border p-4`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${phase.bg} ${phase.color} border ${phase.border}`}>
                      {phase.phase}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{phase.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Fees ── */}
          <section id="fees" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">5</span>
              Fee Structure
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                The market creator sets a <strong className="text-white/80">platform fee</strong>{" "}
                at market creation time, expressed in basis points (bps).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Parameter</th>
                      <th className="text-left py-2 pr-4 text-white/30">Default</th>
                      <th className="text-left py-2 text-white/30">Range</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    <tr className="border-b border-white/[0.03]">
                      <td className="py-2 pr-4 text-white">Platform fee</td>
                      <td className="py-2 pr-4 text-purple-400">200 bps (2%)</td>
                      <td className="py-2">0 – 500 bps</td>
                    </tr>
                    <tr className="border-b border-white/[0.03]">
                      <td className="py-2 pr-4 text-white">Resolver fee</td>
                      <td className="py-2 pr-4 text-purple-400">0 bps</td>
                      <td className="py-2">Optional</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Fees are taken from the total pool <em>after</em> betting closes
                and <em>before</em> payouts are distributed. The fee only applies
                to the winning pool — losers forfeit their stake entirely.
              </p>
            </div>
          </section>

          {/* ── Resolution ── */}
          <section id="resolution" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">6</span>
              Resolution &amp; Oracles
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                Each market has a <strong className="text-white/80">resolver address</strong>{" "}
                set at creation — the only entity authorized to resolve the market.
              </p>

              <h3 className="text-sm font-medium text-white mt-4">Resolver Types</h3>

              {[
                {
                  title: "EOA (Manual)",
                  desc: "A regular wallet. Simple for managed markets where you control resolution.",
                },
                {
                  title: "Multisig",
                  desc: "Gnosis Safe or similar. Multiple parties must agree on the outcome.",
                },
                {
                  title: "Oracle Contract",
                  desc: "Programmatic resolution via an oracle (e.g., Chainlink, UMA, or custom).",
                },
              ].map((resolver) => (
                <div
                  key={resolver.title}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
                >
                  <h4 className="text-xs font-medium text-white mb-1">{resolver.title}</h4>
                  <p className="text-xs text-white/40">{resolver.desc}</p>
                </div>
              ))}

              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mt-4">
                <p className="text-xs text-amber-300/80">
                  ⚠️ The resolver address is trusted. If the resolver is malicious or
                  compromised, the market can be resolved dishonestly. Use multisig
                  oracles for production markets.
                </p>
              </div>
            </div>
          </section>

          {/* ── API ── */}
          <section id="api" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">7</span>
              API Reference
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                Parl exposes a REST API for querying on-chain data indexed by the
                Parl Indexer.
              </p>
              <p className="text-xs text-white/30">
                Base URL: <code className="text-purple-400 font-mono">https://parl.build/api</code> (or via proxy)
              </p>

              {[
                {
                  method: "GET",
                  path: "/api/markets",
                  desc: "List all markets",
                  resp: `[
  {
    "id": "9a228815-...",
    "market_id": "0xe1cc...",
    "description": "Will Team A win?",
    "outcomes": ["Yes", "No"],
    "status": "active",
    "total_pool": "3.800000000000000000",
    "platform_fee_bps": 200,
    "created_at": "2026-07-01T12:00:00Z"
  }
]`,
                },
                {
                  method: "GET",
                  path: "/api/markets/:id",
                  desc: "Get market by ID",
                  resp: `{ "id": "...", "market_id": "...", ... }`,
                },
                {
                  method: "GET",
                  path: "/api/bets/:marketId",
                  desc: "Get bets for a market",
                  resp: `[ { "bettor": "0x...", "outcome": 0, "amount": "1.5" }, ... ]`,
                },
                {
                  method: "GET",
                  path: "/health",
                  desc: "Health check",
                  resp: `{ "status": "ok", "backend": "ok", "db": "ok" }`,
                },
              ].map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {endpoint.method}
                      </span>
                      <code className="text-xs font-mono text-purple-400">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-xs text-white/40">{endpoint.desc}</p>
                  </div>
                  <pre className="bg-black p-4 text-xs font-mono text-white/50 overflow-x-auto">
                    {endpoint.resp}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* ── SDK ── */}
          <section id="sdk" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">8</span>
              SDK &amp; Integration
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                Integrate Parl into your own application. The protocol is
                permissionless — any frontend, aggregator, or platform can read
                and write to PoolEngine.
              </p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-2">Contract Integration</h3>
                <pre className="bg-black rounded-lg p-3 text-xs font-mono overflow-x-auto text-white/70">
                  {`// ethers.js / viem
import { PoolEngineABI } from "./PoolEngineABI";

const poolEngine = new ethers.Contract(
  "0xB3702B20900AE748A68287B75b6065284081be00",
  PoolEngineABI,
  signer
);

// Create market
const tx = await poolEngine.createMarket(
  "Will BTC > $100k?",
  ["Yes", "No"],
  604800,
  resolverAddress,
  200
);
await tx.wait();`}
                </pre>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-medium text-white mb-2">API Integration</h3>
                <pre className="bg-black rounded-lg p-3 text-xs font-mono overflow-x-auto text-white/70">
                  {`// Fetch markets
const res = await fetch("https://parl.build/api/markets");
const markets = await res.json();

// Display pool amounts
markets.forEach(m => {
  const poolEth = ethers.formatEther(m.total_pool);
  console.log(\`\${m.description}: \${poolEth} ETH\`);
});`}
                </pre>
              </div>
            </div>
          </section>

          {/* ── Security ── */}
          <section id="security" className="mb-20 scroll-mt-20">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[11px] text-purple-400 font-mono">9</span>
              Security
            </h2>
            <div className="space-y-6 text-sm text-white/60 leading-relaxed font-body">
              <p>
                Parl is in early-stage development on Avalanche Fuji testnet.
                The following considerations apply:
              </p>

              <ul className="space-y-3">
                {[
                  "Contract has not undergone a formal audit. Use at your own risk.",
                  "Resolver address is a single point of trust — use multisig for production.",
                  "No emergency pause or upgrade mechanism in v0.1.",
                  "Fuji testnet AVAX has no real value. This is experimental software.",
                  "Bet amounts are held in the contract until resolution.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-amber-400/60 mt-0.5 shrink-0">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-5 mt-6">
                <p className="text-xs text-purple-300/80">
                  🛡️ The contract is verified on Snowscan. Review the source
                  code before depositing any meaningful value.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom nav */}
          <div className="border-t border-white/[0.06] pt-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/30">Parl Protocol Documentation</p>
              <p className="text-xs text-white/20">v0.1 — Last updated July 2026</p>
            </div>
            <Link
              href="/app"
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium transition-all"
            >
              Launch App →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
