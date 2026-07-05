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
            {/* Nav */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center gap-2">
          <Link href="/" className="text-sm font-semibold tracking-wider text-white shrink-0">PARL</Link>
          <span className="text-neutral-700 text-xs">/ docs</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink min-w-0 flex-wrap justify-end">
            <Link href="/app" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline shrink-0">markets</Link>
            <Link href="/whitepaper" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline shrink-0">whitepaper</Link>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-neutral-800 p-5 sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
          <p className="text-xs text-neutral-600 tracking-wide mb-3">DOCS</p>
          <nav className="space-y-1">
            {sidebarSections.map((section) => (
              <a key={section.id} href={`#${section.id}`}
                className="block text-sm text-neutral-500 hover:text-neutral-300 transition-colors py-1">
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-5 lg:px-10 py-8 max-w-4xl">
          {/* Overview */}
          <section id="overview" className="mb-14 scroll-mt-16">
            <h1 className="text-lg sm:text-xl font-semibold text-white mb-1">
              Documentation
            </h1>
            <p className="text-xs text-neutral-600 mb-6">
              Parl Protocol v0.1 -- Deployed on Avalanche Fuji.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-500">
                <span className="text-neutral-400">PoolEngine:</span>{" "}
                <code className="text-neutral-400">0xB3702B...be00</code>
              </div>
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-500">
                chain: Avalanche Fuji (43113)
              </div>
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-500">
                license: MIT
              </div>
            </div>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4 max-w-prose">
              <p>
                Parl is a fully on-chain parimutuel prediction markets protocol.
                Unlike AMM-based prediction markets (e.g. Polymarket), Parl uses a
                <strong className="text-neutral-300"> parimutuel pool</strong> mechanism
                -- all bets for a given market pool into a shared pot, and winners split
                the pot proportionally.
              </p>
              <p>
                This means <strong className="text-neutral-300">no liquidity providers</strong>,
                no impermanent loss, and no AMM slippage. The protocol is designed to be used
                as an infrastructure layer -- integrate into your own frontend, aggregator,
                or platform.
              </p>
            </div>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Quickstart</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Create your first prediction market in under 5 minutes.</p>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-2">1. Connect to Fuji</h3>
                <p className="mb-2 text-xs">Add Avalanche Fuji to your wallet:</p>
                <div className="bg-black rounded p-3 font-mono text-xs space-y-1">
                  <div><span className="text-neutral-600">network:</span> <span className="text-neutral-400">Avalanche Fuji C-Chain</span></div>
                  <div><span className="text-neutral-600">rpc:</span> <span className="text-neutral-400">https://avalanche-fuji.infura.io/v3/...</span></div>
                  <div><span className="text-neutral-600">chain id:</span> <span className="text-neutral-400">43113</span></div>
                  <div><span className="text-neutral-600">currency:</span> <span className="text-neutral-400">AVAX</span></div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-2">2. Create a Market</h3>
                <p className="text-xs mb-2">Call <code className="text-neutral-400 font-mono">createMarket</code> on PoolEngine:</p>
                <pre className="bg-black rounded p-3 text-xs font-mono overflow-x-auto text-neutral-500">
                  <span className="text-neutral-600">// Params</span>
{`
- description: "Will BTC > $100k by EOY?"
- outcomes: ["Yes", "No"]
- resolutionDelay: 604800 (7 days)
- resolverAddress: 0x...
- platformFeeBps: 200 (2%)
`.trim()}
                </pre>
              </div>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-2">3. Place a Bet</h3>
                <p className="text-xs">Call <code className="text-neutral-400 font-mono">placeBet</code> with the marketId, outcome index, and value.</p>
              </div>
            </div>
          </section>

          {/* Contracts */}
          <section id="contracts" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Smart Contracts</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>The protocol consists of a single core contract: <strong className="text-neutral-300">PoolEngine</strong>.</p>

              <h3 className="text-xs font-medium text-neutral-300">PoolEngine</h3>
              <div className="bg-black rounded p-3 font-mono text-xs border border-neutral-800">
                <span className="text-neutral-400">address</span> PoolEngine ={" "}
                <span className="text-neutral-300">0xB3702B20900AE748A68287B75b6065284081be00</span>;
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600 font-medium">function</th>
                      <th className="text-left py-2 pr-4 text-neutral-600 font-medium">params</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">description</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    {[
                      ["createMarket", "desc, outcomes[], delay, resolver, feeBps", "create a new market"],
                      ["placeBet", "marketId, outcomeIndex", "place bet (payable)"],
                      ["resolveMarket", "marketId, winnerIndex", "resolve to an outcome"],
                      ["claimPayout", "marketId", "claim winnings"],
                      ["getMarket", "marketId", "get market details"],
                    ].map(([fn, params, desc]) => (
                      <tr key={fn} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-300 whitespace-nowrap">{fn}</td>
                        <td className="py-2 pr-4 text-neutral-600 whitespace-nowrap">{params}</td>
                        <td className="py-2 text-neutral-600">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs">verified on snowscan: <a href="https://testnet.snowscan.xyz/address/0xB3702B20900AE748A68287B75b6065284081be00" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline underline-offset-2 hover:text-neutral-300">testnet.snowscan.xyz</a></p>
            </div>
          </section>

          {/* Parimutuel */}
          <section id="parimutuel" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Parimutuel Math</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Parl uses a standard parimutuel payout model. Odds are not set by a formula -- they emerge from the distribution of bets in the pool.</p>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-3">Payout Formula</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-black rounded p-4 font-mono text-xs flex-1 min-w-[200px]">
                    <div className="text-neutral-600 mb-2">winnings per bettor</div>
                    <div className="text-neutral-300">payout = (bet / winnerPool) * (totalPool * (1 - fee))</div>
                  </div>
                  <div className="bg-black rounded p-4 font-mono text-xs flex-1 min-w-[200px]">
                    <div className="text-neutral-600 mb-2">implied odds</div>
                    <div className="text-neutral-300">odds = totalPool / outcomePool</div>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-3">Example: 3-Outcome Race</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="text-left py-2 pr-4 text-neutral-600">outcome</th>
                        <th className="text-left py-2 pr-4 text-neutral-600">pool (eth)</th>
                        <th className="text-left py-2 text-neutral-600">implied odds</th>
                      </tr>
                    </thead>
                    <tbody className="text-neutral-500">
                      {[
                        ["Team A", "2.5", "1.52x"],
                        ["Team B", "1.0", "3.80x"],
                        ["Draw", "0.3", "12.67x"],
                      ].map(([o, pool, odds]) => (
                        <tr key={o} className="border-b border-neutral-800/50">
                          <td className="py-2 pr-4 text-neutral-300">{o}</td>
                          <td className="py-2 pr-4">{pool} eth</td>
                          <td className="py-2 text-neutral-400">{odds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-neutral-600">total pool: 3.8 eth. If Team A wins, the 2.5 eth pool splits the pot (minus 2% fee) proportionally.</p>
              </div>
            </div>
          </section>

          {/* Pool Lifecycle */}
          <section id="pool-lifecycle" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Pool Lifecycle</h2>
            <div className="space-y-4 text-sm text-neutral-500 leading-relaxed">
              <p>Every market goes through four distinct phases:</p>

              {[
                { phase: "Active", desc: "Bettors can place bets on any outcome. Market resolves when the resolver submits the winning outcome.", border: "border-green-800/50" },
                { phase: "Resolved", desc: "The market has a winning outcome. Bettors who bet on the winner can now claim their payout.", border: "border-blue-800/50" },
                { phase: "Claimed", desc: "All winning bettors have claimed their payouts. The market is finalized.", border: "border-neutral-800" },
                { phase: "Canceled", desc: "Market was canceled. Bettors can reclaim their stake.", border: "border-amber-800/50" },
              ].map((phase) => (
                <div key={phase.phase} className={`border rounded p-4 ${phase.border}`}>
                  <span className="text-xs font-medium text-neutral-300">{phase.phase}</span>
                  <p className="text-xs text-neutral-600 mt-1">{phase.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fees */}
          <section id="fees" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Fee Structure</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>The market creator sets a <strong className="text-neutral-300">platform fee</strong> at market creation time, expressed in basis points (bps).</p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600">parameter</th>
                      <th className="text-left py-2 pr-4 text-neutral-600">default</th>
                      <th className="text-left py-2 text-neutral-600">range</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    <tr className="border-b border-neutral-800/50">
                      <td className="py-2 pr-4 text-neutral-300">platform fee</td>
                      <td className="py-2 pr-4 text-neutral-400">200 bps (2%)</td>
                      <td className="py-2">0 - 500 bps</td>
                    </tr>
                    <tr className="border-b border-neutral-800/50">
                      <td className="py-2 pr-4 text-neutral-300">resolver fee</td>
                      <td className="py-2 pr-4 text-neutral-400">0 bps</td>
                      <td className="py-2">optional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Resolution */}
          <section id="resolution" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Resolution &amp; Oracles</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Each market has a <strong className="text-neutral-300">resolver address</strong> set at creation -- the only entity authorized to resolve the market.</p>

              <h3 className="text-xs font-medium text-neutral-300">Resolver Types</h3>

              {[
                { title: "EOA (Manual)", desc: "A regular wallet. Simple for managed markets where you control resolution." },
                { title: "Multisig", desc: "Gnosis Safe or similar. Multiple parties must agree on the outcome." },
                { title: "Oracle Contract", desc: "Programmatic resolution via an oracle (Chainlink, UMA, or custom)." },
              ].map((r) => (
                <div key={r.title} className="border border-neutral-800 rounded p-4">
                  <h4 className="text-xs font-medium text-neutral-300 mb-1">{r.title}</h4>
                  <p className="text-xs text-neutral-600">{r.desc}</p>
                </div>
              ))}

              <div className="border border-amber-800/30 rounded p-4">
                <p className="text-xs text-amber-400">the resolver address is trusted. If the resolver is malicious or compromised, the market can be resolved dishonestly. use multisig oracles for production markets.</p>
              </div>
            </div>
          </section>

          {/* API */}
          <section id="api" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">API Reference</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Parl exposes a REST API for querying on-chain data indexed by the Parl Indexer.</p>
              <p className="text-xs text-neutral-600">base url: <code className="text-neutral-400 font-mono">https://parl.build/api</code></p>

              {[
                { method: "GET", path: "/api/markets", desc: "list all markets", resp: `[{ "id": "...", "description": "will team a win?", "outcomes": ["yes","no"], "status": "active", "total_pool": "3.80", ... }]` },
                { method: "GET", path: "/api/markets/:id", desc: "get market by id", resp: `{ "id": "...", ... }` },
                { method: "GET", path: "/api/bets/:marketId", desc: "get bets for a market", resp: `[{ "bettor": "0x...", "outcome": 0, "amount": "1.5" }]` },
                { method: "GET", path: "/health", desc: "health check", resp: `{ "status": "ok", "backend": "ok", "db": "ok" }` },
              ].map((ep) => (
                <div key={ep.path} className="border border-neutral-800 rounded overflow-hidden">
                  <div className="p-4 border-b border-neutral-800">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 border border-green-800 text-green-400 rounded">{ep.method}</span>
                      <code className="text-xs font-mono text-neutral-400">{ep.path}</code>
                    </div>
                    <p className="text-xs text-neutral-600">{ep.desc}</p>
                  </div>
                  <pre className="bg-black p-4 text-xs font-mono text-neutral-600 overflow-x-auto">{ep.resp}</pre>
                </div>
              ))}
            </div>
          </section>

          {/* SDK */}
          <section id="sdk" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">SDK &amp; Integration</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Integrate Parl into your own application. The protocol is permissionless -- any frontend, aggregator, or platform can read and write to PoolEngine.</p>

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-2">Contract Integration</h3>
                <pre className="bg-black rounded p-3 text-xs font-mono overflow-x-auto text-neutral-500">
{`// ethers.js / viem
import { PoolEngineABI } from "./PoolEngineABI";

const poolEngine = new ethers.Contract(
  "0xB3702B20900AE748A68287B75b6065284081be00",
  PoolEngineABI,
  signer
);

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

              <div className="border border-neutral-800 rounded p-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-2">API Integration</h3>
                <pre className="bg-black rounded p-3 text-xs font-mono overflow-x-auto text-neutral-500">
{`// fetch markets
const res = await fetch("https://parl.build/api/markets");
const markets = await res.json();

markets.forEach(m => {
  const poolEth = ethers.formatEther(m.total_pool);
  console.log(m.description + ": " + poolEth + " eth");
});`}
                </pre>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="mb-20 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-4">Security</h2>
            <div className="space-y-5 text-sm text-neutral-500 leading-relaxed">
              <p>Parl is in early-stage development on Avalanche Fuji testnet. The following considerations apply:</p>

              <ul className="space-y-2 text-xs list-disc list-inside text-neutral-500">
                {[
                  "Contract has not undergone a formal audit. Use at your own risk.",
                  "Resolver address is a single point of trust -- use multisig for production.",
                  "No emergency pause or upgrade mechanism in v0.1.",
                  "Fuji testnet AVAX has no real value. This is experimental software.",
                  "Bet amounts are held in the contract until resolution.",
                ].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Bottom */}
          <div className="border-t border-neutral-800 pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-600">Parl Protocol Documentation</p>
              <p className="text-xs text-neutral-700">v0.1 -- last updated July 2026</p>
            </div>
            <Link href="/app"
              className="text-xs px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-500">
              Launch App
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
