import Link from "next/link";

const toc = [
  { id: "abstract", title: "Abstract" },
  { id: "problem", title: "Problem Statement" },
  { id: "parimutuel", title: "The Parimutuel Mechanism" },
  { id: "architecture", title: "Protocol Architecture" },
  { id: "resolution", title: "Resolution & Oracles" },
  { id: "factory", title: "Permissionless Market Factory" },
  { id: "categorization", title: "Auto-Categorization" },
  { id: "api", title: "Data API & Indexer" },
  { id: "tokenomics", title: "Token Economics" },
  { id: "valueloops", title: "Value Loops & Game Design" },
  { id: "comparison", title: "Comparison with Polymarket" },
  { id: "roadmap", title: "Product Roadmap" },
  { id: "risks", title: "Risk Factors" },
  { id: "conclusion", title: "Conclusion" },
];

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
            {/* Nav */}
      <div className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center gap-2">
          <Link href="/" className="text-sm font-semibold tracking-wider text-white shrink-0">PARL</Link>
          <span className="text-neutral-700 text-xs">/ whitepaper</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink min-w-0 flex-wrap justify-end">
            <Link href="/app" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline shrink-0">markets</Link>
            <Link href="/docs" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors hidden sm:inline shrink-0">docs</Link>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-neutral-800 p-5 sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
          <p className="text-xs text-neutral-600 tracking-wide mb-3">CONTENTS</p>
          <nav className="space-y-1">
            {toc.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="block text-sm text-neutral-500 hover:text-neutral-300 transition-colors py-1">{s.title}</a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-5 lg:px-10 py-8 max-w-4xl">

          {/* Title page */}
          <div className="mb-14 pb-10 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-600 mb-5">
              <span className="px-2 py-0.5 border border-neutral-800 rounded">DRAFT v0.3</span>
              <span>july 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white leading-tight mb-3">
              Parl: Parimutuel Prediction Markets Protocol
            </h1>
            <p className="text-sm text-neutral-500 max-w-xl leading-relaxed">
              Infrastructure for infinite-scale, market-maker-free prediction markets on EVM-compatible chains.
              Permissionless market creation with auto-categorization, optimistic oracle, and Chainlink Functions integration.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-600">license: mit</div>
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-600">network: avalanche fuji (43113)</div>
              <div className="px-3 py-1 border border-neutral-800 rounded text-xs text-neutral-600">status: testnet (v2 contracts)</div>
            </div>
          </div>

          {/* Abstract */}
          <section id="abstract" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">Abstract</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-3">
              <p>Prediction markets are powerful tools for aggregating information and forecasting future events. However, existing implementations face a fundamental trade-off between <strong className="text-neutral-300">liquidity</strong> and <strong className="text-neutral-300">market breadth</strong>. AMM-based markets (like Polymarket) require active liquidity provisioning, which concentrates activity on a handful of high-volume markets.</p>
              <p>Parl introduces a <strong className="text-neutral-300">parimutuel pool</strong> mechanism that eliminates the need for liquidity providers entirely. Each market operates as an independent pool: all bets are collected, and winners split the pool proportionally. This design means any market -- no matter how niche -- can exist from day one with zero liquidity bootstrapping.</p>
              <p>This paper presents the Parl protocol v0.3: its mathematical model, smart contract architecture (PoolEngine v2, MarketFactory, ParlOracle), resolution framework, auto-categorization system, data API, comparison with Polymarket, token economics, and value loop game design. The protocol is deployed on Avalanche Fuji testnet.</p>
            </div>
          </section>

          {/* Problem */}
          <section id="problem" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">1. Problem Statement</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">

              <h3 className="text-xs font-medium text-neutral-300 mt-5">1.1 The Liquidity Bottleneck</h3>
              <p>Prediction markets require liquidity to function. In traditional order-book markets, market makers provide continuous quotes. In AMM-based markets, liquidity providers deposit assets into pools to enable trading. Both models suffer from a cold-start problem: a market with no liquidity is functionally dead.</p>
              <p>This creates a <strong className="text-neutral-300">power-law distribution</strong> of market activity: 80%+ of volume concentrates in fewer than 5% of markets. Niche, timely, or experimental events -- the very class where prediction markets create the most informational value -- never gain traction.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">1.2 The Permission Barrier</h3>
              <p>In most prediction market platforms, creating a market requires either platform approval (Polymarket, Kalshi) or significant technical expertise (custom AMM deployment, orderbook setup). Parl solves this with <strong className="text-neutral-300">permissionless market creation</strong> via a MarketFactory contract. Any user with an EVM wallet can create a market in a single transaction, paying only gas plus a minimal anti-spam creation fee.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">1.3 Market Maker Incentives</h3>
              <p>AMM-based prediction markets require LPs to deposit capital into outcome-specific pools. This exposes LPs to adverse selection -- informed traders bet against mispriced pools, and LPs absorb the loss. Parl eliminates the concept of a "liquidity provider" entirely. In a parimutuel system, the <em>bettors</em> are the pool.</p>
            </div>
          </section>

          {/* Parimutuel */}
          <section id="parimutuel" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">2. The Parimutuel Mechanism</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">

              <h3 className="text-xs font-medium text-neutral-300 mt-5">2.1 Historical Context</h3>
              <p>Parimutuel betting (from French <em>pari mutuel</em>, "mutual stake") originated in 19th-century horse racing. All bets on a race are pooled together; after deducting a commission, the pool is divided among winning tickets. The odds are not set in advance -- they emerge from the distribution of bets.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">2.2 Mathematical Model</h3>
              <div className="border border-neutral-800 rounded p-4 my-3">
                <p className="text-xs font-medium text-neutral-600 mb-2">Core Equations</p>
                <div className="space-y-2 font-mono text-xs">
                  <div><span className="text-neutral-600">total pool (gross):</span><div className="text-neutral-400">P = sum_i b_i (where b_i = all bets)</div></div>
                  <div><span className="text-neutral-600">pool after fee:</span><div className="text-neutral-400">N = P * (1 - f) (where f = platform fee)</div></div>
                  <div><span className="text-neutral-600">winning pool:</span><div className="text-neutral-400">W = sum_j b_j (where outcome_j = winner)</div></div>
                  <div><span className="text-neutral-600">per-bettor payout:</span><div className="text-neutral-400">payout(b) = (b / W) * N</div></div>
                  <div><span className="text-neutral-600">implied odds for outcome k:</span><div className="text-neutral-400">odds(k) = P / sum_i b_i (for outcome i = k)</div></div>
                </div>
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">2.3 Key Properties</h3>
              <div className="grid sm:grid-cols-2 gap-3 my-3">
                {[
                  { title: "Zero Slippage", desc: "All bets pool together. Every bettor gets the same implied odds at the time of their bet." },
                  { title: "Infinite Liquidity", desc: "A market can exist with 1 wei deposited. The pool grows with every bet naturally." },
                  { title: "No LPs Needed", desc: "No liquidity providers, no impermanent loss, no AMM curve math. Purely additive pools." },
                  { title: "Fair Odds", desc: "Odds reflect collective wisdom of all bettors, not an algorithm or LP." },
                ].map((p) => (
                  <div key={p.title} className="border border-neutral-800 rounded p-4">
                    <h4 className="text-xs font-medium text-neutral-300 mb-1">{p.title}</h4>
                    <p className="text-xs text-neutral-600">{p.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">2.4 Implied Probability & Price Display</h3>
              <p>Parl calculates and displays implied probabilities for every outcome, matching the pattern used by Polymarket. The probability of outcome k winning is:</p>
              <div className="bg-black rounded p-3 font-mono text-xs text-neutral-400 my-2">probability(k) = pool(k) / totalPool</div>
              <p>These probabilities are computed server-side by the Parl Indexer and served through the API. The frontend renders them as visual bars with percentage labels, giving users an intuitive sense of market sentiment.</p>
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">3. Protocol Architecture</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">

              <h3 className="text-xs font-medium text-neutral-300 mt-5">3.1 Design Philosophy</h3>
              <p>Parl is designed as a minimal protocol layer. The core contract handles three operations: create markets, place bets, and resolve + claim. Everything else is built on top as separate services.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">3.2 Smart Contracts (V2)</h3>

              <div className="space-y-3 mt-3">
                {[
                  { title: "PoolEngine", addr: "0xB3702B20900AE748A68287B75b6065284081be00", desc: "The core parimutuel engine. Handles market state, bet placement, payout calculation, and resolution. Permissionless market creation.", tag: "core" },
                  { title: "MarketFactory", addr: "0x95b38D36D50BcFd4E4c875c640EB1627b48585eC", desc: "Permissionless market creation gateway. Users call createMarket() with a small anti-spam fee (0.01 AVAX).", tag: "gateway" },
                  { title: "ParlOracle (Optimistic)", addr: "0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2", desc: "An optimistic oracle with a challenge window. Anyone can propose an outcome with a bond; anyone can dispute within the window.", tag: "oracle" },
                  { title: "ParlAutoResolver (Chainlink)", addr: "Not deployed (compiled)", desc: "A Chainlink Functions consumer for automated resolution via external APIs (CoinGecko, sports scores, weather).", tag: "future" },
                ].map((c) => (
                  <div key={c.title} className="border border-neutral-800 rounded p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 border rounded ${
                        c.tag === "core" ? "border-neutral-700 text-neutral-400" :
                        c.tag === "gateway" ? "border-green-800 text-green-400" :
                        c.tag === "oracle" ? "border-blue-800 text-blue-400" :
                        "border-amber-800 text-amber-400"
                      }`}>{c.tag}</span>
                      <h4 className="text-xs font-medium text-neutral-300">{c.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-600 font-mono mb-1">{c.addr}</p>
                    <p className="text-xs text-neutral-600">{c.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">3.3 Off-Chain Services</h3>
              {[
                { title: "Parl Indexer (Rust)", desc: "Monitors the chain for PoolEngine events using ethers-rs. Maintains a PostgreSQL database of markets, bets, claims, and fee ledger. Auto-categorizes markets on creation." },
                { title: "Parl API (Rust, Actix-web)", desc: "REST API exposing market data, probability calculations, categories, simplified market listings, and bettor queries." },
                { title: "Parl Frontend (Next.js)", desc: "Terminal-inspired dark UI. Category-filtered market browsing, probability bars, search, wallet connect, user dashboard, and Create Market modal." },
              ].map((s) => (
                <div key={s.title} className="border border-neutral-800 rounded p-4 mt-2">
                  <h4 className="text-xs font-medium text-neutral-300 mb-1">{s.title}</h4>
                  <p className="text-xs text-neutral-600">{s.desc}</p>
                </div>
              ))}

              <div className="border border-neutral-800 rounded p-4 mt-4">
                <h3 className="text-xs font-medium text-neutral-300 mb-3">End-to-End Data Flow</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-600">
                  <span className="px-2 py-1 border border-neutral-800 text-neutral-400 rounded">User</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-amber-800 text-amber-400 rounded">Frontend</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-green-800 text-green-400 rounded">Factory</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-neutral-700 text-neutral-400 rounded">PoolEngine</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-blue-800 text-blue-400 rounded">Events</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-green-800 text-green-400 rounded">Indexer</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-blue-800 text-blue-400 rounded">DB</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-neutral-700 text-neutral-400 rounded">API</span>
                  <span className="text-neutral-700">→</span>
                  <span className="px-2 py-1 border border-amber-800 text-amber-400 rounded">Frontend</span>
                </div>
              </div>
            </div>
          </section>

          {/* Resolution */}
          <section id="resolution" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">4. Resolution &amp; Oracles</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mt-5">4.1 Resolution Model</h3>
              <p>Each market has a designated resolver address. Only this address can call <code className="text-neutral-400 font-mono text-xs">resolveMarket(marketId, outcomeIndex, proof)</code>.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">4.2 Optimistic Oracle (ParlOracle)</h3>
              <p>The ParlOracle implements a propose-dispute-resolve pattern inspired by UMA's optimistic oracle design:</p>

              <div className="border border-neutral-800 rounded p-4 my-3">
                <div className="space-y-3 text-xs">
                  {[
                    { step: "1", title: "Propose", desc: "Any address calls oracle.propose(marketId, outcome), posting a bond. The bond size is set at contract creation." },
                    { step: "2", title: "Dispute Window", desc: "For a configurable period (default 4 hours on Fuji), any address can dispute the proposal." },
                    { step: "3", title: "Resolve", desc: "If the dispute window expires with no dispute, anyone can call oracle.executeResolution(). The proposer gets their bond back." },
                    { step: "4", title: "Slashing", desc: "If a dispute occurs, it goes to a final arbitrator. The losing party's bond is slashed." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <span className="w-5 h-5 rounded border border-neutral-700 flex items-center justify-center text-xs font-mono text-neutral-500 shrink-0">{item.step}</span>
                      <div>
                        <span className="text-neutral-300 font-medium">{item.title}:</span>{" "}
                        <span className="text-neutral-600">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">4.3 Chainlink Functions (Planned)</h3>
              <p>For automated, data-driven resolution, Parl includes ParlAutoResolver, a Chainlink Functions consumer contract:</p>
              <div className="grid sm:grid-cols-3 gap-3 my-3">
                {[
                  { title: "Crypto Prices", desc: "CoinGecko / Binance API" },
                  { title: "Sports Scores", desc: "TheSportsDB / ESPN API" },
                  { title: "Weather Data", desc: "OpenWeatherMap API" },
                ].map((item) => (
                  <div key={item.title} className="border border-neutral-800 rounded p-4 text-center">
                    <h4 className="text-xs font-medium text-neutral-300 mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-600">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">4.4 Oracle Options</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600">type</th>
                      <th className="text-left py-2 pr-4 text-neutral-600">trust model</th>
                      <th className="text-left py-2 text-neutral-600">best for</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    {[
                      ["EOA (Manual)", "Single party", "Test markets, managed events"],
                      ["ParlOracle (Optimistic)", "Bonded proposer + dispute", "Subjective outcomes"],
                      ["Chainlink Functions", "Decentralized computation", "Data-driven events"],
                      ["Gnosis Safe (Multisig)", "Multi-party M-of-N", "Community-governed markets"],
                    ].map(([t, trust, use]) => (
                      <tr key={t} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-300">{t}</td>
                        <td className="py-2 pr-4">{trust}</td>
                        <td className="py-2 text-neutral-600">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Factory */}
          <section id="factory" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">5. Permissionless Market Factory</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mt-5">5.1 Motivation</h3>
              <p>In Parl v1, only the contract owner could create markets. V2 introduces the MarketFactory contract -- a permissionless gateway that any user can call.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">5.2 Factory Design</h3>
              <div className="border border-neutral-800 rounded p-4 my-3">
                <h4 className="text-xs font-medium text-neutral-300 mb-3">User Flow</h4>
                <div className="space-y-2 text-xs">
                  {[
                    { step: "1", title: "Connect Wallet", desc: "User connects MetaMask (or any EVM wallet) to the Parl frontend." },
                    { step: "2", title: "Fill Form", desc: "User enters question, outcomes, resolver address, and fee percentage." },
                    { step: "3", title: "Sign & Submit", desc: "Frontend computes a deterministic marketId, encodes the function call." },
                    { step: "4", title: "Transaction", desc: "MetaMask prompts confirmation. Transaction calls MarketFactory.createMarket() with 0.01 AVAX fee." },
                    { step: "5", title: "On-Chain", desc: "MarketFactory validates inputs, forwards to PoolEngine, emits MarketCreated event." },
                    { step: "6", title: "Indexed", desc: "Parl Indexer detects the event, auto-categorizes, and stores it in PostgreSQL." },
                    { step: "7", title: "Live", desc: "Market appears in the frontend immediately. Anyone can browse, bet, and claim." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <span className="w-5 h-5 rounded border border-green-800 text-green-400 flex items-center justify-center text-xs font-mono shrink-0">{item.step}</span>
                      <div>
                        <span className="text-neutral-300 font-medium">{item.title}:</span>{" "}
                        <span className="text-neutral-600">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">5.3 Anti-Spam & Economics</h3>
              <p>Market creation requires a 0.01 AVAX fee (~$0.0003), sufficient to prevent spam but negligible in value. Collected fees accumulate in the factory contract and can be withdrawn by the protocol owner.</p>
            </div>
          </section>

          {/* Categorization */}
          <section id="categorization" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">6. Auto-Categorization</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mt-5">6.1 Category Detection</h3>
              <p>Parl implements a server-side auto-categorization system that analyzes market outcome strings and assigns a category, enabling category filtering in the frontend.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600">priority</th>
                      <th className="text-left py-2 pr-4 text-neutral-600">category</th>
                      <th className="text-left py-2 text-neutral-600">keywords</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    {[
                      ["1 (highest)", "politics", "election, president, congress, senate, party, vote"],
                      ["2", "crypto", "btc, bitcoin, eth, ethereum, solana, defi, tvl, nft"],
                      ["3", "weather", "temperature, storm, hurricane, celsius, climate, rain"],
                      ["4", "technology", "ai, gpt, openai, spacex, tesla, satellite, launch"],
                      ["5 (lowest)", "sports", "nba, nfl, team, win, match, goal, soccer, ufc"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-600">{row[0]}</td>
                        <td className="py-2 pr-4 text-neutral-300">{row[1]}</td>
                        <td className="py-2 text-neutral-600">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* API */}
          <section id="api" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">7. Data API &amp; Indexer</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mt-5">7.1 Indexer</h3>
              <p>A Rust binary that connects to Avalanche Fuji and listens for PoolEngine events, maintaining a PostgreSQL database with 6 tables: markets, bets, claims, fee_ledger, indexer_state.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">7.2 API Endpoints</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600">endpoint</th>
                      <th className="text-left py-2 pr-4 text-neutral-600">description</th>
                      <th className="text-left py-2 text-neutral-600">params</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    {[
                      ["GET /api/markets", "list markets with probs", "?status=&category="],
                      ["GET /api/markets/:id", "single market detail", "uuid or hex id"],
                      ["GET /api/markets/:id/bets", "bets for a market", "uuid"],
                      ["GET /api/bets", "bettor bet history", "?bettor=0x..."],
                      ["GET /api/simplified-markets", "lightweight market list", "?category="],
                      ["GET /api/categories", "categories with counts", "none"],
                      ["GET /health", "service health", "none"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-400 text-xs">{row[0]}</td>
                        <td className="py-2 pr-4">{row[1]}</td>
                        <td className="py-2 text-neutral-600 text-xs">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Tokenomics */}
          <section id="tokenomics" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">8. Token Economics</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mt-5">8.1 Fee Model</h3>
              <p>Parl generates revenue through platform fees on each market (100-500 bps = 1%-5%), deducted from the total pool before payout distribution.</p>

              <h4 className="text-xs font-medium text-neutral-300 mt-4">Fee Tiers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead><tr className="border-b border-neutral-800">
                    <th className="text-left py-2 pr-4 text-neutral-600">tier</th>
                    <th className="text-left py-2 pr-4 text-neutral-600">fee (bps)</th>
                    <th className="text-left py-2 text-neutral-600">requirement</th>
                  </tr></thead>
                  <tbody className="text-neutral-500">
                    <tr className="border-b border-neutral-800/50"><td className="py-2 pr-4 text-neutral-300">standard</td><td className="py-2 pr-4">200 (2%)</td><td className="py-2">none</td></tr>
                    <tr className="border-b border-neutral-800/50"><td className="py-2 pr-4 text-neutral-300">premium</td><td className="py-2 pr-4">100 (1%)</td><td className="py-2">stake 1,000 $PARL</td></tr>
                    <tr className="border-b border-neutral-800/50"><td className="py-2 pr-4 text-neutral-300">zero</td><td className="py-2 pr-4">0 (0%)</td><td className="py-2">stake 10,000 $PARL</td></tr>
                    <tr className="border-b border-neutral-800/50"><td className="py-2 pr-4 text-neutral-300">negative</td><td className="py-2 pr-4">-100 (-1%)</td><td className="py-2">dao approval + stake</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">8.2 $PARL Token Model</h3>
              <p>$PARL is the native protocol token, designed to align incentives. No token is deployed on testnet; all mechanics below are planned for mainnet launch.</p>

              <div className="grid sm:grid-cols-2 gap-3 my-3">
                {[
                  { title: "Fee Discounts", desc: "Stake $PARL to access lower fee tiers." },
                  { title: "Staking Rewards", desc: "25% of protocol fees distributed to stakers." },
                  { title: "Creator Bonds", desc: "Creators stake $PARL to signal quality." },
                  { title: "Governance", desc: "$PARL holders govern protocol parameters." },
                  { title: "Oracle Staking", desc: "Resolvers stake $PARL as a bond against dishonesty." },
                  { title: "Buyback & Burn", desc: "Treasury fees buy back $PARL, creating deflationary pressure." },
                ].map((u) => (
                  <div key={u.title} className="border border-neutral-800 rounded p-4">
                    <h4 className="text-xs font-medium text-neutral-300 mb-1">{u.title}</h4>
                    <p className="text-xs text-neutral-600">{u.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border border-neutral-800 rounded p-4">
                <p className="text-xs text-neutral-600">tokenomics is in active design. all figures are proposals. no $PARL token is deployed or available for trading.</p>
              </div>
            </div>
          </section>

          {/* Value Loops */}
          <section id="valueloops" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">9. Value Loops &amp; Game Design</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <p>Prediction markets are games of coordination and prediction. The parimutuel model unlocks game-design primitives that AMM-based markets cannot replicate.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">9.1 Pool Boosters (Tipping)</h3>
              <p>Anyone can deposit additional funds into a market pool after creation, increasing the total payout for winners.</p>
              <div className="border border-neutral-800 rounded p-4">
                <h4 className="text-xs font-medium text-neutral-300 mb-2">Use Cases</h4>
                <ul className="space-y-1 text-xs text-neutral-600 list-disc list-inside">
                  <li>Community Tipping -- a promoter tips a pool to create buzz</li>
                  <li>Subsidized Promotions -- a brand sponsors a prediction market</li>
                  <li>Creator Rewards -- creators donate fees back to signal confidence</li>
                </ul>
              </div>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">9.2 Outcome NFTs (Bets as Collectibles)</h3>
              <p>Every bet is minted as an NFT, turning betting into a collecting mechanic with bet provenance, collector rarity, outcome badges, and secondary markets.</p>

              <h3 className="text-xs font-medium text-neutral-300 mt-5">9.3 Manager Mode</h3>
              <p>A gamified layer over Parl markets with prediction streaks, market quests, XP and levels, squad/syndicate systems, mystery markets, and market crafting.</p>
            </div>
          </section>

          {/* Comparison */}
          <section id="comparison" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">10. Comparison with Polymarket</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 pr-4 text-neutral-600">dimension</th>
                      <th className="text-left py-2 pr-4 text-neutral-600">polymarket</th>
                      <th className="text-left py-2 text-neutral-600">parl</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-500">
                    {[
                      ["mechanism", "AMM (constant product)", "parimutuel pool"],
                      ["liquidity", "requires LPs", "no LPs needed"],
                      ["slippage", "depends on pool depth", "zero slippage"],
                      ["market creation", "approval required", "permissionless"],
                      ["fee model", "trading fee (maker/taker)", "platform fee (1-5%)"],
                      ["oracle", "CryptoOracle (UMIP)", "optimistic + Chainlink"],
                      ["chain", "Polygon", "Avalanche Fuji"],
                      ["token", "no native token", "$PARL (planned)"],
                      ["open source", "partial", "full (MIT)"],
                    ].map(([dim, poly, parl]) => (
                      <tr key={dim} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-300">{dim}</td>
                        <td className="py-2 pr-4">{poly}</td>
                        <td className="py-2">{parl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-600">Polymarket is the dominant prediction market protocol by volume. Parl differentiates through parimutuel mechanics, permissionless creation, and full open-source code.</p>
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">11. Product Roadmap</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              {[
                { phase: "V0 (Q1 2024)", items: ["Proof of concept on Fuji", "Single contract (PoolEngine V1)", "Manual market creation", "Basic front-end"] },
                { phase: "V1 (Q2 2024)", items: ["PoolEngine V2 with permissionless creation", "MarketFactory contract", "ParlOracle (optimistic)", "Auto-categorization", "Rust indexer + API", "Create Market modal", "Wallet connect"] },
                { phase: "V2 (Q3 2024)", items: ["Bet history dashboard", "Probability bars on market cards", "Full mobile responsiveness", "Real-time search"] },
                { phase: "V3 (Q4 2024)", items: ["Polymarket-style UI overhaul", "Correct Augur/Gnosis references removed", "Database cleanup", "Reframed competition analysis"] },
                { phase: "V4 (Q1 2025)", items: ["Manager Mode (streaks, quests, XP, squads)", "Outcome NFTs", "Pool boosters / tipping", "Chainlink Functions integration"] },
                { phase: "Mainnet (Q2 2025)", items: ["Audited contracts", "$PARL token launch", "Liquidity migration", "Multi-chain expansion"] },
              ].map((r) => (
                <div key={r.phase} className="border border-neutral-800 rounded p-4">
                  <h3 className="text-xs font-medium text-neutral-300 mb-2">{r.phase}</h3>
                  <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">
                    {r.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Risks */}
          <section id="risks" className="mb-14 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">12. Risk Factors</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-4">
              {[
                { title: "Smart Contract Risk", desc: "Unaudited contracts may contain bugs. Use only on Fuji testnet.", severity: "high" },
                { title: "Oracle Trust", desc: "Centralized resolver is a single point of failure.", severity: "high" },
                { title: "Liquidity Risk", desc: "Parimutuel markets depend on sufficient participation. Very low participation may lead to unfavorable odds.", severity: "medium" },
                { title: "Frontrunning", desc: "On-chain transactions are visible in the mempool, enabling potential frontrunning.", severity: "medium" },
                { title: "Regulatory Risk", desc: "Prediction markets operate in a complex regulatory landscape. Seek legal counsel.", severity: "variable" },
              ].map((risk) => (
                <div key={risk.title} className="border border-neutral-800 rounded p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-medium text-neutral-300">{risk.title}</h3>
                    <span className={`text-xs font-mono ${
                      risk.severity === "high" ? "text-red-400" : risk.severity === "medium" ? "text-amber-400" : "text-neutral-500"
                    }`}>{risk.severity}</span>
                  </div>
                  <p className="text-xs text-neutral-600">{risk.desc}</p>
                </div>
              ))}
              <div className="border border-red-900/50 rounded p-4">
                <p className="text-xs text-red-400">Disclaimer: This whitepaper describes a protocol in active development. All specifications subject to change. Nothing constitutes financial or legal advice.</p>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section id="conclusion" className="mb-20 scroll-mt-16">
            <h2 className="text-sm font-semibold text-white mb-3">13. Conclusion</h2>
            <div className="text-sm text-neutral-500 leading-relaxed space-y-3">
              <p>Parl introduces a novel approach to on-chain prediction markets by leveraging the parimutuel mechanism. By eliminating the need for liquidity providers, Parl enables a fundamentally different market structure -- where any event, no matter how niche, can have a liquid market from the moment of creation.</p>
              <p>The protocol is live on Avalanche Fuji testnet with full functionality: permissionless market creation, auto-categorization, optimistic oracle, Chainlink integration, data API, and a terminal-inspired user dashboard.</p>
              <p>With token economics and game mechanics inspired by the best engagement systems in consumer technology, Parl is positioned not just as a financial protocol -- but as a platform that people genuinely enjoy using.</p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/app" className="text-sm px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-400">
                Explore Markets
              </Link>
              <Link href="/docs" className="text-sm px-4 py-1.5 border border-neutral-700 rounded hover:bg-neutral-900 transition-colors text-neutral-400">
                Documentation
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-neutral-800 pt-6 pb-6">
            <div className="flex items-center justify-between text-xs text-neutral-700">
              <span>Parl Protocol Whitepaper -- DRAFT v0.3</span>
              <span>July 2026 | Open source (MIT)</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
