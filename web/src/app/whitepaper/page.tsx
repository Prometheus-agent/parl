import Image from "next/image";
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
      <nav className="border-b border-white/[0.06] px-6 h-14 flex items-center bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center group">
          <Image src="/logo.svg" alt="Parl" width={88} height={22} className="h-[22px] w-auto" priority />
          <span className="text-xs text-white/30 ml-1.5 font-body">/ whitepaper</span>
        </Link>
        <div className="hidden md:flex ml-auto items-center gap-4">
          <Link href="/app" className="text-xs text-white/40 hover:text-white transition-colors">App</Link>
          <Link href="/docs" className="text-xs text-white/40 hover:text-white transition-colors">Docs</Link>
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
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-white/[0.06] p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Contents</p>
          <nav className="space-y-1">
            {toc.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="block text-sm text-white/40 hover:text-white transition-colors duration-150 py-1.5">{section.title}</a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10 max-w-4xl">

          {/* Title page */}
          <div className="mb-16 pb-12 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
              <span className="px-2 py-0.5 rounded border border-white/[0.08]">DRAFT v0.3</span>
              <span>July 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-[1.05] mb-4">
              Parl: Parimutuel Prediction Markets Protocol
            </h1>
            <p className="text-base text-white/40 font-body max-w-xl">
              Infrastructure for infinite-scale, market-maker-free prediction markets on EVM-compatible chains.
              Permissionless market creation with auto-categorization, optimistic oracle, and Chainlink Functions integration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
                <span className="text-white/70">License:</span> MIT
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
                <span className="text-white/70">Network:</span> Avalanche Fuji (43113)
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
                <span className="text-white/70">Status:</span> Testnet (v2 contracts)
              </div>
            </div>
          </div>

          {/* ─── Abstract ─── */}
          <section id="abstract" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">Abstract</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <p>
                Prediction markets are powerful tools for aggregating information and
                forecasting future events. However, existing implementations face a
                fundamental trade-off between <strong className="text-white/80">liquidity</strong>{" "}
                and <strong className="text-white/80">market breadth</strong>. AMM-based
                markets (like Polymarket) require active liquidity provisioning, which
                concentrates activity on a handful of high-volume markets. Long-tail
                markets — the thousands of niche or short-lived events — remain
                underserved.
              </p>
              <p>
                Parl introduces a <strong className="text-white/80">parimutuel pool</strong>{" "}
                mechanism that eliminates the need for liquidity providers entirely.
                Each market operates as an independent pool: all bets are collected,
                and winners split the pool proportionally. This design means any market
                — no matter how niche — can exist from day one with zero liquidity bootstrapping.
              </p>
              <p>
                This paper presents the Parl protocol v0.3: its mathematical model,
                smart contract architecture (PoolEngine v2, MarketFactory, ParlOracle),
                resolution framework (Optimistic Oracle + Chainlink Functions),
                auto-categorization system, data API and indexer architecture,
                comparison with Polymarket, token economics, and value loop game design.
                The protocol is deployed on Avalanche Fuji testnet with full end-to-end
                functionality including permissionless market creation, auto-categorization,
                and a Polymarket-inspired user dashboard with probability displays.
              </p>
            </div>
          </section>

          {/* ─── Problem ─── */}
          <section id="problem" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">1. Problem Statement</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">1.1 The Liquidity Bottleneck</h3>
              <p>
                Prediction markets require liquidity to function. In traditional
                order-book markets, market makers provide continuous quotes. In
                AMM-based markets, liquidity providers deposit assets into pools
                to enable trading. Both models suffer from a cold-start problem:
                a market with no liquidity is functionally dead.
              </p>
              <p>
                This creates a <strong className="text-white/80">power-law distribution</strong>{" "}
                of market activity: 80%+ of volume concentrates in fewer than 5% of
                markets. Niche, timely, or experimental events — the very class of events
                where prediction markets create the most informational value — never gain
                traction.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">1.2 The Permission Barrier</h3>
              <p>
                In most prediction market platforms, creating a market requires either
                platform approval (Polymarket, Kalshi) or significant technical expertise
                (Augur, Gnosis). This gatekeeping limits the diversity of markets and
                slows the platform's ability to react to current events.
              </p>
              <p>
                Parl solves this with <strong className="text-white/80">permissionless market creation</strong>{" "}
                via a MarketFactory contract. Any user with an EVM wallet can create
                a market in a single transaction, paying only gas plus a minimal
                anti-spam creation fee. No approval, no KYC, no technical barriers.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">1.3 Market Maker Incentives</h3>
              <p>
                AMM-based prediction markets require LPs to deposit capital into
                outcome-specific pools. This exposes LPs to adverse selection —
                informed traders bet against mispriced pools, and LPs absorb the
                loss. Over time, LPs demand higher fees or exit, reducing market
                efficiency.
              </p>
              <p>
                Parl solves both problems by eliminating the concept of a
                "liquidity provider" entirely. In a parimutuel system, the
                <em> bettors</em> are the pool. Every new bet increases the pool,
                and the odds automatically adjust to reflect the new distribution.
              </p>
            </div>
          </section>

          {/* ─── Parimutuel ─── */}
          <section id="parimutuel" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">2. The Parimutuel Mechanism</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">2.1 Historical Context</h3>
              <p>
                Parimutuel betting (from French <em>pari mutuel</em>, "mutual stake")
                originated in 19th-century horse racing. All bets on a race are pooled
                together; after deducting a commission, the pool is divided among
                winning tickets. The odds are not set in advance — they emerge from
                the distribution of bets.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">2.2 Mathematical Model</h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 my-4">
                <p className="text-xs font-medium text-white/30 mb-3">Core Equations</p>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-white/50 mb-1">Total pool (gross):</div>
                    <div className="bg-black rounded-lg p-3 text-purple-300">P = Σᵢ bᵢ<span className="text-white/40">  where bᵢ = all bets in market</span></div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Pool after fee:</div>
                    <div className="bg-black rounded-lg p-3 text-purple-300">N = P × (1 − f)<span className="text-white/40">  where f = platform fee</span></div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Winning pool (total bets on winner):</div>
                    <div className="bg-black rounded-lg p-3 text-purple-300">W = Σⱼ bⱼ<span className="text-white/40">  where outcomeⱼ = winner</span></div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Per-bettor payout:</div>
                    <div className="bg-black rounded-lg p-3 text-purple-300">payout(b) = (b / W) × N</div>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">Implied odds for outcome k:</div>
                    <div className="bg-black rounded-lg p-3 text-purple-300">odds(k) = P / Σᵢ bᵢ<span className="text-white/40">  for outcome i = k</span></div>
                  </div>
                </div>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">2.3 Key Properties</h3>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                {[
                  { title: "Zero Slippage", desc: "Since all bets pool together, there is no slippage. Every bettor gets the same implied odds at the time of their bet." },
                  { title: "Infinite Liquidity", desc: "A market can exist with just 1 wei deposited. The pool grows with every bet naturally." },
                  { title: "No LPs Needed", desc: "No liquidity providers, no impermanent loss, no AMM curve math. Purely additive pools." },
                  { title: "Fair Odds", desc: "Odds reflect the collective wisdom of all bettors, not the pricing model of an algorithm or LP." },
                ].map((prop) => (
                  <div key={prop.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h4 className="text-sm font-medium text-white mb-1">{prop.title}</h4>
                    <p className="text-xs text-white/40">{prop.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">2.4 Implied Probability & Price Display</h3>
              <p>
                Parl calculates and displays <strong className="text-white/80">implied probabilities</strong>{" "}
                for every outcome in every market, matching the pattern used by Polymarket.
                The probability of outcome k winning is:
              </p>
              <div className="bg-black rounded-lg p-3 font-mono text-xs text-purple-300 my-3">
                probability(k) = pool(k) / totalPool
              </div>
              <p>
                These probabilities are computed server-side by the Parl Indexer and
                served through the API. The frontend renders them as visual bars with
                percentage labels, giving users an intuitive sense of market sentiment.
                A market with 70% probability on outcome A and 30% on outcome B
                immediately signals crowd wisdom without requiring users to compute
                pool ratios manually.
              </p>
            </div>
          </section>

          {/* ─── Architecture ─── */}
          <section id="architecture" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">3. Protocol Architecture</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">3.1 Design Philosophy</h3>
              <p>
                Parl is designed as a minimal protocol layer. The core contract
                handles three operations: create markets, place bets, and resolve
                + claim. Everything else — frontend UX, data indexing, notifications
                — is built on top as separate services.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">3.2 Smart Contracts (V2)</h3>
              <p>
                Parl v2 introduces a three-contract architecture that separates
                concerns and enables permissionless market creation:
              </p>

              <div className="space-y-3 mt-4">
                {[
                  {
                    title: "PoolEngine",
                    addr: "0xB3702B20900AE748A68287B75b6065284081be00",
                    desc: "The core parimutuel engine. Handles market state, bet placement, payout calculation, and resolution. In v2, createMarket() is permissionless — any address can create a market. Single contract, no proxies, minimal attack surface.",
                    tag: "Core",
                    color: "purple",
                  },
                  {
                    title: "MarketFactory",
                    addr: "0x95b38D36D50BcFd4E4c875c640EB1627b48585eC",
                    desc: "Permissionless market creation gateway. Users call createMarket() with a small anti-spam fee (0.01 AVAX). The factory validates inputs, forwards to PoolEngine, and collects fees that can be withdrawn by the protocol owner.",
                    tag: "Gateway",
                    color: "emerald",
                  },
                  {
                    title: "ParlOracle (Optimistic)",
                    addr: "0xb650C22EB696F68EdB14fFEd62E528E7E1FCbDC2",
                    desc: "An optimistic oracle with a challenge window. Anyone can propose an outcome with a bond; anyone can dispute within the window; after the window expires without dispute, the market is resolved. Bonds are slashed on dishonest proposals.",
                    tag: "Oracle",
                    color: "blue",
                  },
                  {
                    title: "ParlAutoResolver (Chainlink)",
                    addr: "Not deployed (compiled)",
                    desc: "A Chainlink Functions consumer for automated resolution via external APIs (CoinGecko, sports scores, weather). Registered as a resolver on PoolEngine; triggered by anyone paying for the request.",
                    tag: "Future",
                    color: "amber",
                  },
                ].map((component) => (
                  <div key={component.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={"text-xs font-medium px-2 py-0.5 rounded-full border " + 
                        (component.color === "purple" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                         component.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                         component.color === "blue" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                         "bg-amber-500/10 text-amber-400 border-amber-500/20")
                      }>{component.tag}</span>
                      <h4 className="text-sm font-medium text-white">{component.title}</h4>
                    </div>
                    <p className="text-xs text-white/50 mb-1 font-mono">{component.addr}</p>
                    <p className="text-xs text-white/40">{component.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">3.3 Off-Chain Services</h3>
              {[
                { title: "Parl Indexer (Rust)", desc: "Monitors the chain for PoolEngine events using ethers-rs. Maintains a PostgreSQL database of markets, bets, claims, and fee ledger. Auto-categorizes markets on creation. Polls every 5 seconds with exponential backoff for rate-limit resilience." },
                { title: "Parl API (Rust, Actix-web)", desc: "REST API exposing market data, probability calculations, categories, simplified market listings (Polymarket-compatible format), and bettor queries. Six endpoints serving data to the frontend and third-party integrators." },
                { title: "Parl Frontend (Next.js)", desc: "Dune-inspired dark UI with Space Grotesk typography, gradient accents, and OLED backgrounds. Features include category-filtered market browsing, probability bars, real-time search, wallet connect via MetaMask, user dashboard with charts, and a Create Market modal." },
              ].map((component) => (
                <div key={component.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mt-3">
                  <h4 className="text-sm font-medium text-white mb-1">{component.title}</h4>
                  <p className="text-xs text-white/40">{component.desc}</p>
                </div>
              ))}

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mt-6">
                <h3 className="text-sm font-medium text-white mb-3">End-to-End Data Flow</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/50">
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">User</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Frontend</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">MarketFactory</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">PoolEngine</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Events</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Indexer</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">DB</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">API</span><span className="text-white/20">→</span>
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Frontend</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Resolution ─── */}
          <section id="resolution" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">4. Resolution &amp; Oracles</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">4.1 Resolution Model</h3>
              <p>
                Each market has a designated resolver address. Only this address
                can call <code className="text-purple-400 font-mono text-xs">resolveMarket(marketId, outcomeIndex, proof)</code>.
                After resolution, winners can claim their payout at any time via
                the <code className="text-purple-400 font-mono text-xs">claim(marketId)</code> function.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">4.2 Optimistic Oracle (ParlOracle)</h3>
              <p>
                The ParlOracle implements a <strong className="text-white/80">propose-dispute-resolve</strong>{" "}
                pattern inspired by UMA's optimistic oracle design but simplified
                for Parl's use case:
              </p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 my-4">
                <div className="space-y-3 text-xs">
                  {[
                    { step: "1", title: "Propose", desc: "Any address calls oracle.propose(marketId, outcome), posting a bond in AVAX. The bond size is set at contract creation (configurable)." },
                    { step: "2", title: "Dispute Window", desc: "For a configurable period (default 4 hours on Fuji), any address can dispute the proposal by calling oracle.dispute(marketId). The disputer must also post a bond." },
                    { step: "3", title: "Resolve", desc: "If the dispute window expires with no dispute, anyone can call oracle.executeResolution(marketId). The ParlOracle calls PoolEngine.resolveMarket(). The proposer gets their bond back." },
                    { step: "4", title: "Slashing", desc: "If a dispute occurs, the dispute goes to a final arbitrator (initially the deployer, later a multisig or DAO). The losing party's bond is slashed and awarded to the winner." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-mono text-purple-400 shrink-0">{item.step}</span>
                      <div>
                        <span className="text-white/70 font-medium">{item.title}:</span>{" "}
                        <span className="text-white/40">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">4.3 Chainlink Functions (Planned)</h3>
              <p>
                For automated, data-driven resolution, Parl includes <strong className="text-white/80">ParlAutoResolver</strong>,
                a Chainlink Functions consumer contract. This enables markets to resolve
                automatically based on real-world API data:
              </p>
              <div className="grid md:grid-cols-3 gap-4 my-4">
                {[
                  { title: "Crypto Prices", desc: "CoinGecko / Binance API — \"Will BTC exceed $100k?\"", icon: "₿" },
                  { title: "Sports Scores", desc: "TheSportsDB / ESPN API — \"Will Lakers win?\"", icon: "🏀" },
                  { title: "Weather Data", desc: "OpenWeatherMap API — \"Will temp exceed 30°C?\"", icon: "🌤️" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <h4 className="text-xs font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">4.4 Oracle Options Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Type</th>
                      <th className="text-left py-2 pr-4 text-white/30">Trust Model</th>
                      <th className="text-left py-2 text-white/30">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["EOA (Manual)", "Single party", "Test markets, managed events"],
                      ["ParlOracle (Optimistic)", "Bonded proposer + dispute", "Subjective outcomes, sports, politics"],
                      ["Chainlink Functions", "Decentralized computation", "Data-driven events (prices, weather)"],
                      ["Gnosis Safe (Multisig)", "Multi-party M-of-N", "Community-governed markets"],
                    ].map(([type, trust, use]) => (
                      <tr key={type} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white">{type}</td>
                        <td className="py-2 pr-4">{trust}</td>
                        <td className="py-2 text-white/40">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ─── Factory ─── */}
          <section id="factory" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">5. Permissionless Market Factory</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">5.1 Motivation</h3>
              <p>
                In Parl v1, only the contract owner could create markets. While this
                was safe for initial testing, it fundamentally limited the protocol's
                utility. V2 introduces the <strong className="text-white/80">MarketFactory</strong>{" "}
                contract — a permissionless gateway that any user can call.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">5.2 Factory Design</h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 my-4">
                <h4 className="text-xs font-medium text-white mb-3">User Flow</h4>
                <div className="space-y-3 text-xs">
                  {[
                    { step: "1", title: "Connect Wallet", desc: "User connects MetaMask (or any EVM wallet) to the Parl frontend." },
                    { step: "2", title: "Fill Form", desc: "User enters: question, outcomes (one per line), resolver address, and fee percentage (1-5%)." },
                    { step: "3", title: "Sign & Submit", desc: "User clicks 'Create Market'. The frontend computes a deterministic marketId via keccak256 and encodes the function call." },
                    { step: "4", title: "Transaction", desc: "MetaMask prompts user to confirm. The transaction calls MarketFactory.createMarket() with 0.01 AVAX creation fee." },
                    { step: "5", title: "On-Chain", desc: "MarketFactory validates inputs, forwards to PoolEngine, and emits MarketCreated event." },
                    { step: "6", title: "Indexed", desc: "Parl Indexer detects the event, auto-categorizes the market, and stores it in PostgreSQL." },
                    { step: "7", title: "Live", desc: "Market appears in the frontend immediately. Anyone can browse, bet, and eventually claim." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-mono text-emerald-400 shrink-0">{item.step}</span>
                      <div>
                        <span className="text-white/70 font-medium">{item.title}:</span>{" "}
                        <span className="text-white/40">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">5.3 Anti-Spam & Economics</h3>
              <p>
                Market creation requires a <strong className="text-white/80">0.01 AVAX</strong>{" "}
                fee (~$0.0003 at current testnet prices, negligible in value but
                sufficient to prevent spam attacks). The fee is configurable by the
                protocol owner. Collected fees accumulate in the factory contract
                and can be withdrawn by the owner via <code className="text-purple-400 font-mono text-xs">withdrawFees()</code>.
              </p>
              <p>
                Excess payments are automatically refunded to the user. If a user
                sends 0.1 AVAX for a 0.01 AVAX fee, 0.09 AVAX is returned immediately
                in the same transaction.
              </p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mt-4">
                <h4 className="text-xs font-medium text-white mb-2">Factory Contract Interface</h4>
                <div className="bg-black rounded-lg p-3 font-mono text-xs text-white/50">
                  <span className="text-white/30">// Anyone can call</span><br />
                  factory.createMarket(keccak256(...), ["Yes","No"], oracle, 200)<br />
                  <span className="text-white/30">// with value: 0.01 AVAX</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Categorization ─── */}
          <section id="categorization" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">6. Auto-Categorization</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">6.1 Category Detection</h3>
              <p>
                Parl implements a server-side auto-categorization system that analyzes
                market outcome strings and assigns a category. Categories are stored
                in the database and served via the API, enabling Polymarket-style
                category filtering in the frontend.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">6.2 Category Hierarchy</h3>
              <p>
                The categorization engine uses keyword matching with a <strong className="text-white/80">priority
                hierarchy</strong> to avoid false positives. For example, "Party A wins
                election" contains "win" (sports keyword) but "election" (politics
                keyword) takes priority:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Priority</th>
                      <th className="text-left py-2 pr-4 text-white/30">Category</th>
                      <th className="text-left py-2 pr-4 text-white/30">Keywords</th>
                      <th className="text-left py-2 text-white/30">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["1 (highest)", "Politics", "election, president, congress, senate, party, vote", '"Party A wins election"'],
                      ["2", "Crypto", "btc, bitcoin, eth, ethereum, solana, defi, tvl, nft", '"BTC exceeds $100k"'],
                      ["3", "Weather", "temperature, storm, hurricane, celsius, climate, rain", '"Temp above 30°C"'],
                      ["4", "Technology", "ai, gpt, openai, spacex, tesla, satellite, launch", '"GPT-5 launches"'],
                      ["5 (lowest)", "Sports", "nba, nfl, team, win, match, goal, soccer, ufc", '"Lakers vs Celtics"'],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white/40">{row[0]}</td>
                        <td className="py-2 pr-4 text-white">{row[1]}</td>
                        <td className="py-2 pr-4 text-white/40">{row[2]}</td>
                        <td className="py-2 text-white/40">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">6.3 Frontend Integration</h3>
              <p>
                The frontend displays category badges with distinct colors:
              </p>
              <div className="flex flex-wrap gap-2 my-3">
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">Sports</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">Crypto</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium">Politics</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-medium">Weather</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20 font-medium">Technology</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/40 border-white/[0.1] font-medium">General</span>
              </div>
              <p>
                Users can filter markets by category via tab buttons in the frontend,
                and the API supports <code className="text-purple-400 font-mono text-xs">?category=sports</code>{" "}
                query parameters for programmatic filtering. The <code className="text-purple-400 font-mono text-xs">/api/categories</code>{" "}
                endpoint returns all categories with market counts.
              </p>
            </div>
          </section>

          {/* ─── API ─── */}
          <section id="api" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">7. Data API &amp; Indexer</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <h3 className="text-base font-heading font-semibold text-white mt-6">7.1 Indexer</h3>
              <p>
                The Parl Indexer is a Rust binary that connects to Avalanche Fuji via
                WebSocket/HTTP and listens for PoolEngine events (MarketCreated,
                BetPlaced, MarketResolved, ClaimProcessed). It maintains a PostgreSQL
                database with 6 tables:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Table</th>
                      <th className="text-left py-2 pr-4 text-white/30">Rows</th>
                      <th className="text-left py-2 text-white/30">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["markets", "Active", "Market metadata, status, pool size, category"],
                      ["bets", "Active", "Bet receipts per user per market"],
                      ["claims", "0", "Claim records for resolved payouts"],
                      ["fee_ledger", "0", "Accumulated protocol fees"],
                      ["indexer_state", "1", "Last indexed block for resume"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white">{row[0]}</td>
                        <td className="py-2 pr-4">{row[1]}</td>
                        <td className="py-2 text-white/40">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">7.2 API Endpoints</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Endpoint</th>
                      <th className="text-left py-2 pr-4 text-white/30">Description</th>
                      <th className="text-left py-2 text-white/30">Params</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["GET /api/markets", "List markets with probabilities", "?status=&category="],
                      ["GET /api/markets/:id", "Single market detail", "UUID or hex ID"],
                      ["GET /api/markets/:id/bets", "Bets for a market", "UUID"],
                      ["GET /api/markets/:id/payout/:addr", "Calculate payout", "UUID + address"],
                      ["GET /api/bets", "Bettor's bet history", "?bettor=0x..."],
                      ["GET /api/simplified-markets", "Lightweight market list", "?category="],
                      ["GET /api/categories", "Categories with counts", "None"],
                      ["GET /health", "Service health", "None"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-purple-400 font-mono text-xs">{row[0]}</td>
                        <td className="py-2 pr-4 text-white/60">{row[1]}</td>
                        <td className="py-2 text-white/40 text-xs">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">7.3 Simplified Markets Format</h3>
              <p>
                The <code className="text-purple-400 font-mono text-xs">/api/simplified-markets</code>{" "}
                endpoint returns a lightweight JSON format designed for frontend tables,
                inspired by Polymarket's API format:
              </p>
              <div className="bg-black rounded-lg p-3 font-mono text-xs my-3">
                <pre className="text-white/50">{`[
  {
    "id": "9a228815-...",
    "question": "BTC exceeds $100k | BTC below $100k",
    "outcomes": ["Yes", "No"],
    "status": "active",
    "category": "crypto",
    "total_pool_avax": "0.0100",
    "volume_avax": "0.0100",
    "probabilities": [55.0, 45.0],
    "created_at": "2026-07-02T00:26:50Z"
  }
]`}</pre>
              </div>
            </div>
          </section>

          {/* ─── Tokenomics ─── */}
          <section id="tokenomics" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">8. Token Economics</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">

              <h3 className="text-base font-heading font-semibold text-white mt-6">8.1 Fee Model</h3>
              <p>
                Parl generates revenue through platform fees on each market.
                Market creators set the fee at creation time, expressed in basis
                points (100–500 bps = 1%–5%). Fees are deducted from the <em>total pool</em>
                before payout distribution.
              </p>

              <h4 className="text-sm font-medium text-white mt-5">Fee Tiers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Tier</th>
                      <th className="text-left py-2 pr-4 text-white/30">Fee (bps)</th>
                      <th className="text-left py-2 pr-4 text-white/30">Requirement</th>
                      <th className="text-left py-2 text-white/30">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["Standard", "200 (2%)", "None", "General markets"],
                      ["Premium", "100 (1%)", "Stake 1,000 $PARL", "Power creators"],
                      ["Zero", "0 (0%)", "Stake 10,000 $PARL", "Bootstrapping"],
                      ["Negative", "−100 (−1%)", "DAO approval + stake", "Subsidized / featured"],
                    ].map(([tier, fee, req, use]) => (
                      <tr key={tier} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white">{tier}</td>
                        <td className="py-2 pr-4 text-purple-400">{fee}</td>
                        <td className="py-2 pr-4 text-white/40">{req}</td>
                        <td className="py-2 text-white/40">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h4 className="text-sm font-medium text-white mb-3">Fee Distribution Flow</h4>
                <div className="space-y-2 text-xs">
                  {[
                    ["Protocol treasury", "50%", "Accumulated, governed by DAO"],
                    ["Market creator", "25%", "Direct incentive for creators"],
                    ["$PARL stakers", "25%", "Distributed pro-rata to stakers"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="flex items-center gap-4 py-1.5 border-b border-white/[0.03] last:border-0">
                      <span className="w-32 text-white/70">{label}</span>
                      <span className="w-20 text-purple-400">{value}</span>
                      <span className="text-white/40">{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                <p className="text-xs text-amber-300/80">
                  💡 <strong>Negative fees</strong> are a powerful bootstrapping tool. A market
                  creator (or third party) can subsidize a market so that winners
                  receive <em>more</em> than the total pool — the difference is
                  covered by a subsidy pool. This lets platforms attract users
                  with &ldquo;boosted odds&rdquo; events.
                </p>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">8.2 $PARL Token Model</h3>
              <p>
                $PARL is the native protocol token, designed to align incentives
                across market creators, bettors, stakers, and the broader
                ecosystem. No token is deployed on testnet; all mechanics below
                are planned for mainnet launch.
              </p>

              <h4 className="text-sm font-medium text-white mt-5">Token Utility</h4>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                {[
                  { title: "Fee Discounts", desc: "Stake $PARL to access lower fee tiers — from 2% down to 0% or even negative fee markets." },
                  { title: "Staking Rewards", desc: "25% of all protocol fees are distributed to $PARL stakers pro-rata. Yield scales with volume." },
                  { title: "Market Creator Bonds", desc: "Creators stake $PARL to signal quality. Higher stakes unlock lower fees and featured placement." },
                  { title: "Governance", desc: "$PARL holders govern fee splits, treasury allocation, oracle whitelists, and protocol parameters." },
                  { title: "Oracle Staking", desc: "Resolvers stake $PARL as a bond against dishonest resolution. Slashed on dispute loss." },
                  { title: "Buyback & Burn", desc: "A portion of treasury fees is used to buy back $PARL from the market, creating deflationary pressure." },
                ].map((util) => (
                  <div key={util.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-medium text-white mb-1">{util.title}</h4>
                    <p className="text-xs text-white/40">{util.desc}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-medium text-white mt-5">Token Supply &amp; Distribution (Proposed)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Allocation</th>
                      <th className="text-left py-2 pr-4 text-white/30">% of Supply</th>
                      <th className="text-left py-2 text-white/30">Vesting</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["Ecosystem & Rewards", "40%", "4-year linear vest"],
                      ["Team & Advisors", "20%", "3-year cliff + 2-year linear"],
                      ["Investors", "15%", "2-year cliff + 1-year linear"],
                      ["Community Sale", "10%", "No lock, TGE available"],
                      ["Treasury", "10%", "DAO-governed"],
                      ["Liquidity Pool", "5%", "Initial DEX listing"],
                    ].map(([alloc, pct, vest]) => (
                      <tr key={alloc} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white">{alloc}</td>
                        <td className="py-2 pr-4 text-purple-400">{pct}</td>
                        <td className="py-2 text-white/40">{vest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-medium text-white mt-5">Token Flywheel</h4>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="text-xs text-white/50 leading-relaxed font-mono">
                  <div className="flex flex-wrap items-center gap-2 justify-center">
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">More Volume</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">More Fees</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Buyback $PARL</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Price Support</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Higher Staking</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Lower Fees</span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">More Volume</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4 mt-4">
                <p className="text-xs text-purple-300/80">
                  💡 Tokenomics is in active design. All figures above are
                  proposals for community discussion. No $PARL token is deployed
                  or available for trading. TGE is not before mainnet.
                </p>
              </div>
            </div>
          </section>

          {/* ─── Value Loops ─── */}
          <section id="valueloops" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">9. Value Loops &amp; Game Design</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <p>
                Prediction markets, at their core, are <strong className="text-white/80">games of
                coordination and prediction</strong>. The parimutuel model unlocks
                game-design primitives that AMM-based markets cannot replicate.
                This section explores the engagement loops, social mechanics, and
                game systems that turn Parl from a financial protocol into a
                platform people <em>want</em> to use.
              </p>

              <h3 className="text-base font-heading font-semibold text-white mt-6">9.1 Pool Boosters (Tipping)</h3>
              <p>
                Anyone can deposit additional funds into a market pool <em>after</em>
                creation. This increases the total payout for winners without
                affecting the distribution of existing bets.
              </p>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h4 className="text-xs font-medium text-white mb-2">Use Cases</h4>
                <div className="space-y-3 text-xs">
                  {[
                    { title: "Community Tipping", desc: "A YouTuber promotes a market and tips the pool to create buzz. Everyone who bets wins more." },
                    { title: "Subsidized Promotions", desc: "A brand sponsors a prediction market about their product launch. The boosted pool attracts bettors." },
                    { title: "Creator Rewards", desc: "Market creators can donate a portion of their fee earnings back into the pool to signal confidence." },
                  ].map((use) => (
                    <div key={use.title} className="flex gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">▸</span>
                      <div>
                        <span className="text-white/70">{use.title}:</span>{' '}
                        <span className="text-white/40">{use.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">9.2 Outcome NFTs (Bets as Collectibles)</h3>
              <p>
                Every bet is minted as an NFT — a non-transferable or
                optionally transferable token representing a position in a
                market. This turns betting into a collecting mechanic.
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                {[
                  { title: "Bet Provenance", desc: "Each NFT tracks when you bet, how much, and at what implied odds. A permanent on-chain record." },
                  { title: "Collector Rarity", desc: "Early bets on long-shot outcomes that win are rare artifacts. A bet on an event at 100:1 odds is a trophy." },
                  { title: "Outcome Badges", desc: "Correctly predicting a series of events earns composite badges (e.g., 'Perfect Week', 'Oracle Tier 3')." },
                  { title: "Secondary Markets", desc: "Transferable bet NFTs enable a secondary market for positions. Sell your winning ticket before resolution." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">9.3 Manager Mode</h3>
              <p>
                Inspired by the engagement systems behind EA Sports, Monopoly Go's
                event loops, and NBA Top Shot's collection mechanics,{" "}
                <strong className="text-white/80">Manager Mode</strong> is a
                gamified layer over Parl markets:
              </p>

              <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🎮</span>
                  <h4 className="text-sm font-heading font-semibold text-white">Manager Mode Mechanics</h4>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { title: "Prediction Streaks", desc: "Consecutive correct predictions earn streak multipliers. A 5-streak doubles your next payout. Streaks reset on a miss — creating tension and comeback narratives." },
                    { title: "Market Quests", desc: "Daily or weekly challenges: 'Bet on 3 crypto markets today', 'Correctly predict an underdog', 'Claim 5 payouts in a week'. Quests reward $PARL or exclusive badges." },
                    { title: "Level & XP System", desc: "Bettors earn XP per bet and per correct prediction. Levels unlock: custom profile themes, priority queue, reduced fees, and early access to curated markets." },
                    { title: "Squad / Syndicate", desc: "Users form prediction syndicates. Combined correct-prediction streaks earn squad bonuses. Leaderboards per squad create social competition." },
                    { title: "Mystery Markets", desc: "Periodic blind markets where the description is hidden until a threshold pool is reached. Creates FOMO and collective discovery." },
                    { title: "Market Crafting", desc: "Combine 3 correct bet NFTs to 'craft' a special prediction ticket with boosted odds on a curated market." },
                  ].map((mech) => (
                    <div key={mech.title} className="flex gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">▸</span>
                      <div>
                        <span className="text-white/70">{mech.title}:</span>{' '}
                        <span className="text-white/40">{mech.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">9.4 Bettor Reputation &amp; Trust Scores</h3>
              <p>
                Every address builds an on-chain reputation based on prediction
                accuracy, volume, and longevity. This reputation feeds into
                market creation trust scores.
              </p>
              <div className="grid md:grid-cols-3 gap-4 my-4">
                {[
                  { title: "Oracle Score", desc: "% of correct predictions over lifetime.", value: "92%" },
                  { title: "Volume Score", desc: "Total AVAX wagered across all markets.", value: "💰" },
                  { title: "Sybil Resistance", desc: "Linked to on-chain identity (ENS, Gitcoin Passport).", value: "✅" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                    <div className="text-lg font-heading font-bold text-purple-400 mb-1">{item.value}</div>
                    <h4 className="text-xs font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">9.5 Social &amp; Viral Mechanics</h3>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                {[
                  { title: "Shareable Prediction Cards", desc: "Auto-generated images of your bet and implied odds. Designed for Twitter, Telegram, and Farcaster." },
                  { title: "Referral Loops", desc: "Refer a friend, earn a % of their first week's fees." },
                  { title: "Market Embeddings", desc: "Any market can be embedded as an iframe or widget." },
                  { title: "Reaction Markets", desc: "Quick one-click prediction on live events. Snackable, shareable." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-8">9.6 The Flywheel</h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="text-xs text-white/50 leading-relaxed font-mono">
                  <div className="flex flex-wrap items-center gap-2 justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Game Mechanics</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Retention</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Referrals</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">More Users</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">More Markets</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Volume</span>
                    <span className="text-white/20 text-lg">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Returns to Game</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Comparison ─── */}
          <section id="comparison" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">10. Comparison with Polymarket</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <p>
                Polymarket is the dominant prediction market platform by volume,
                using a CLOB (Central Limit Order Book) model with AMM-like
                liquidity provision via CTF (Conditional Token Framework).
                Below is a detailed comparison with Parl's parimutuel approach:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-white/30">Dimension</th>
                      <th className="text-left py-2 pr-4 text-white/30">Parl</th>
                      <th className="text-left py-2 text-white/30">Polymarket</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      ["Market Model", "Parimutuel pool", "CLOB + CTF (ERC-1155 tokens)"],
                      ["Liquidity", "Self-funding (bettors = pool)", "Requires LP deposits"],
                      ["Slippage", "Zero", "Concentration-dependent"],
                      ["Gas per bet", "~80k wei", "~200k wei (token mint + swap)"],
                      ["Market Creation", "Permissionless (via Factory)", "Platform-approved / gated"],
                      ["Long-tail Viability", "✅ Any event works day 1", "❌ Needs LP bootstrapping"],
                      ["Oracle Model", "Optimistic + Chainlink", "UMA Optimistic Oracle"],
                      ["Dispute Mechanism", "Bonded challenge window", "UMA DVM (governance vote)"],
                      ["Data API", "Open, 8 endpoints", "Open (Gamma, Data, CLOB APIs)"],
                      ["Frontend", "Open source, customizable", "Proprietary"],
                      ["Token", "$PARL (planned)", "No native token"],
                      ["Game Mechanics", "Built-in (Manager Mode)", "None"],
                      ["Auto-Categorization", "✅", "✅"],
                      ["Implied Probability", "✅ Pool ratio display", "✅ AMM price display"],
                      ["Chains", "Avalanche Fuji (testnet)", "Polygon (mainnet)"],
                      ["Audit Status", "Not yet", "Audited"],
                      ["SDK / API Access", "REST API, open", "REST + WebSocket, gated"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4 text-white/60 whitespace-nowrap">{row[0]}</td>
                        <td className="py-2 pr-4 text-purple-400">{row[1]}</td>
                        <td className="py-2 text-white/50">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-heading font-semibold text-white mt-6">10.1 Key Takeaways</h3>
              <p>
                Polymarket's CLOB model provides deep liquidity for high-volume
                markets (like political events) and enables sophisticated trading
                strategies. However, it suffers from the cold-start problem —
                new markets require LP deposits before any trading can occur.
              </p>
              <p>
                Parl's parimutuel model is fundamentally better suited for{" "}
                <strong className="text-white/80">long-tail markets</strong> —{" "}
                the thousands of niche events where prediction markets create the
                most informational value. A market for "Will it rain in Jakarta
                tomorrow?" can exist with just 0.01 AVAX in the pool and still
                function perfectly.
              </p>
              <p>
                Additionally, Parl's <strong className="text-white/80">permissionless creation</strong>,{" "}
                <strong className="text-white/80">game mechanics</strong>, and{" "}
                <strong className="text-white/80">open-source frontend</strong>{" "}
                make it more accessible for developers and communities to build on
                top of the protocol.
              </p>
            </div>
          </section>

          {/* ─── Roadmap ─── */}
          <section id="roadmap" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">11. Product Roadmap</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              {[
                {
                  phase: "Phase 0 — Testnet", status: "✅ Active (v2)",
                  items: [
                    "PoolEngine v2 deployed (permissionless createMarket)",
                    "MarketFactory live with 0.01 AVAX creation fee",
                    "ParlOracle (Optimistic Oracle) deployed & verified",
                    "ParlAutoResolver compiled (Chainlink Functions)",
                    "Indexer + API + Frontend with categorized markets",
                    "Auto-categorization (sports, crypto, politics, weather, tech, general)",
                    "Probability calculations & implied odds display",
                    "Polymarket-inspired UI with Dune design tokens",
                    "User dashboard with wallet connect, charts, bet history",
                  ],
                },
                {
                  phase: "Phase 1 — Mainnet Alpha", status: "🔜 Q3 2026",
                  items: [
                    "Smart contract audit (third-party)",
                    "Multi-chain deployment (Ethereum, Base, Arbitrum)",
                    "Multisig oracle support (Gnosis Safe)",
                    "Pool boosters (market tipping)",
                    "Creator reputation system",
                    "SDK / API public documentation",
                    "Token generation event ($PARL)",
                  ],
                },
                {
                  phase: "Phase 2 — Gamification", status: "🔜 Q4 2026",
                  items: [
                    "Manager Mode (streaks, XP, quests)",
                    "Outcome NFTs & crafting",
                    "Bettor reputation & trust scores",
                    "Dispute mechanism with bonded challenges",
                    "Leaderboard and squad systems",
                    "Mystery markets",
                  ],
                },
                {
                  phase: "Phase 3 — Social & Ecosystem", status: "🔜 2027",
                  items: [
                    "Referral & syndicate systems",
                    "Shareable prediction cards (OG images)",
                    "Market embeddings / widgets",
                    "Aggregator API for third-party frontends",
                    "Push notifications / webhooks",
                    "Conditional markets (if-this-then-that)",
                    "Permissionless oracle network",
                    "Mobile SDK (React Native)",
                  ],
                },
              ].map((phase) => (
                <div key={phase.phase} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-heading font-semibold text-white">{phase.phase}</h3>
                    <span className="text-xs font-mono text-purple-400">{phase.status}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white/50">
                        <span className="text-purple-400 mt-0.5">›</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Risks ─── */}
          <section id="risks" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">12. Risk Factors</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              {[
                { title: "Smart Contract Risk", desc: "The PoolEngine contract has not been formally audited. Bugs could result in loss of funds. Users should only deposit what they can afford to lose.", severity: "High", color: "text-red-400" },
                { title: "Oracle / Resolver Trust", desc: "The resolver address controls market outcomes. A malicious or compromised resolver can resolve dishonestly. Production systems should use multisig, ParlOracle, or Chainlink.", severity: "High", color: "text-red-400" },
                { title: "MarketFactory Fee Risk", desc: "The creation fee is configurable by the owner. While locked to 0.01 AVAX for testnet, a malicious owner could raise it. Future versions will include fee caps.", severity: "Medium", color: "text-amber-400" },
                { title: "No Dispute Mechanism (v0.1)", desc: "There is no on-chain dispute or challenge mechanism in the current version. Resolved outcomes are final from PoolEngine's perspective. The ParlOracle provides this at the oracle layer.", severity: "Medium", color: "text-amber-400" },
                { title: "Testnet Limitations", desc: "Parl is deployed on Fuji testnet. AVAX on testnet has no real value. The protocol may behave differently on mainnet with real economic stakes.", severity: "Low", color: "text-blue-400" },
                { title: "Regulatory Risk", desc: "Prediction markets operate in a complex regulatory landscape. Operators should seek legal counsel before launching production markets.", severity: "Variable", color: "text-purple-400" },
              ].map((risk) => (
                <div key={risk.title} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-white">{risk.title}</h3>
                    <span className={`text-xs font-mono ${risk.color}`}>{risk.severity}</span>
                  </div>
                  <p className="text-xs text-white/50">{risk.desc}</p>
                </div>
              ))}

              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-5 mt-4">
                <p className="text-xs text-red-300/80">
                  ⚠️ <strong>Disclaimer:</strong> This whitepaper describes a protocol
                  in active development. All specifications are subject to change.
                  Nothing in this document constitutes financial or legal advice.
                </p>
              </div>
            </div>
          </section>

          {/* ─── Conclusion ─── */}
          <section id="conclusion" className="mb-24 scroll-mt-20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">13. Conclusion</h2>
            <div className="text-sm text-white/60 leading-relaxed font-body space-y-4">
              <p>
                Parl introduces a novel approach to on-chain prediction markets by
                leveraging the parimutuel mechanism. By eliminating the need for
                liquidity providers and AMM curves, Parl enables a fundamentally
                different market structure — one where any event, no matter how
                niche, can have a liquid market from the moment of creation.
              </p>
              <p>
                The protocol is live on Avalanche Fuji testnet (v2 contracts) with
                full functionality: permissionless market creation via MarketFactory,
                auto-categorization across six categories, an Optimistic Oracle for
                honest resolution, Chainlink Functions integration for automated
                data-driven resolution, a comprehensive data API, and a
                Polymarket-inspired user dashboard with probability displays.
              </p>
              <p>
                With the inclusion of token economics designed to align incentives
                and game mechanics inspired by the best engagement systems in
                consumer technology, Parl is positioned not just as a financial
                protocol — but as a platform that people genuinely enjoy using.
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/app" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/20 inline-flex items-center gap-2">
                Explore Markets →
              </Link>
              <Link href="/docs" className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-white/80 hover:text-white transition-all inline-flex items-center gap-2">
                Read Documentation
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/[0.06] pt-8 pb-6">
            <div className="flex items-center justify-between text-xs text-white/20">
              <span>Parl Protocol Whitepaper — DRAFT v0.3</span>
              <span>July 2026 · Open source (MIT)</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
