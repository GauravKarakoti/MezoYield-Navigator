# MezoYield Navigator 🧭

**The cross-chain autopilot for your Bitcoin-backed stablecoin yield.**

MezoYield Navigator is a non-custodial yield optimizer for **MUSD** on the Mezo network. It automatically routes user deposits across the highest-yielding strategies in the Mezo ecosystem—including the native MUSD Savings Vault, third-party managed vaults (like Ditto), and DEX LP gauges—while maximizing **MEZO** token utility through automated veMEZO boosting.

## 🚀 The Problem

The Mezo ecosystem offers multiple yield sources for MUSD, but managing them manually is fragmented and gas-intensive:
- **Fragmentation:** Users must constantly compare APYs between the native `sMUSD` vault and external vaults like `dMUSD`.
- **Inefficiency:** Idle capital during asynchronous redemptions earns nothing.
- **MEZO Utility Gap:** Accrued MEZO emissions are often left unstaked, missing out on veMEZO boosts that could multiply veBTC voting power and fee capture.

## 💡 The Solution

MezoYield Navigator solves this by providing a **single, automated vault** that:
1. **Aggregates Yield:** Automatically allocates MUSD to the best available strategy (sMUSD, dMUSD, or LP gauges).
2. **Optimizes MEZO:** Automatically stakes accrued MEZO into `veMEZO` and directs votes to maximize user boost.
3. **Simplifies UX:** Users deposit MUSD, receive `nyMUSD` (a receipt token), and watch their yield compound—no manual rebalancing required.

## ✨ Key Features

- **Auto-Rebalancing:** A permissioned bot monitors strategy APYs and moves funds when the yield differential exceeds a gas-adjusted threshold.
- **Asynchronous Redemption Handling:** Safely manages pending withdrawals from external vaults (e.g., Ditto) without locking user funds indefinitely.
- **Multi-strategy routing** — `YieldRouter` now routes across `SMusdStrategy`
  and `DittoStrategy`, honouring per-strategy caps and a global TVL cap.
- **Async Ditto integration** — `DittoStrategy` handles Ditto's request/claim
  redemption model without double-counting assets.
- **MEZO boost loop** — `BoostManager` claims MEZO, locks it into veMEZO on
  behalf of opted-in users, and tracks per-user boost.
- **Gauge voting** — `GaugeVoteModule` lets users select gauges; a keeper
  executes their vote each epoch.
- **Keeper bot** — `keeper/` runs a dry-run-first rebalancer with APY threshold,
  cooldown, and alerting.
- **Subgraph** — `subgraph/` indexes deposits, withdrawals, rebalances, and
  MEZO credit events.
- **Security** — Foundry fuzz + invariant tests, pause/emergency exit,
  access-control separation (admin / strategist / keeper).
- **Transparent Dashboard:** Real-time APY tracking, strategy breakdown, and emission history.

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity, Foundry
- **Frontend:** Next.js, TypeScript, wagmi, viem
- **Automation:** Chainlink Automation / Gelato
- **Data:** Mezo Subgraphs (Goldsky)

## 📦 Repository Structure
```plaintext
mezo-yield-navigator/
├── contracts/ # Solidity smart contracts (YieldRouter, BoostManager, Strategies)
├── test/ # Foundry tests
├── script/ # Deployment scripts
├── frontend/ # Next.js application
└── README.md
```

## 🚦 Getting Started (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/GauravKarakoti/mezo-yield-navigator.git
   cd mezoyield-navigator
   ```
2. **Install dependencies**
```bash
forge install
cd frontend && npm install
```
3. **Configure environment**
```
cp .env.example .env
```
4. **Run tests**
```bash
forge test -vvv
```
5. **Deploy to Mezo Testnet**
```bash
forge script script/Deploy.s.sol --rpc-url $MEZO_TESTNET_RPC --broadcast
```
6. **Run Keeper**
```bash
cd keeper && npm i
DRY_RUN=1 npm run start         # observe, no txs
npm run start                   # live
```
7. **Subgraph**
```
cd subgraph && graph deploy --node https://api.goldsky.com --ipfs <ipfs> mezo-yield-navigator
```

## 🔗 Deployed Contracts (Mezo Testnet)
| Contract | Address |
|----------|---------|
| nyMUSD | 0x119F1C92DB209Be928aaD48185CC997B9E442261 |
| YieldRouter | 0x48Ffd77Fa2ff1316484c58DD1268eC8e58cF5C0F |
| SMusdStrategy | 0x0C5Ef19B5Aeb0a32F1d0bff2891EaD538D0ed245 |
| DittoStrategy | 0xD90ee969c17Dd1f513586a72a8CE08a74c9292F2 |
| BoostManager | 0xF9A12943C704661451A67E4346ABF298e2009352 |
| GaugeVoteModule | 0x751cE5d771Fac1dA6D44Ad00cCba49f312d8A322 |

## Architecture
```plaintext
                ┌──────────────────┐
                │   User Wallet    │
                └────────┬─────────┘
                         │ MUSD
                         ▼
                ┌──────────────────┐
                │   YieldRouter    │ ◄── keeper (rebalance)
                │   (mints nyMUSD) │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌─────────────┐ ┌──────────────┐
   │ sMUSD      │ │ Ditto       │ │ (future)     │
   │ Strategy   │ │ Strategy    │ │ LP Strategy  │
   └─────┬──────┘ └──────┬──────┘ └──────────────┘
         │               │
         ▼               ▼
    sMUSD Vault     dMUSD Vault
         │               │
         └──────┬────────┘
                ▼
        ┌───────────────┐
        │ BoostManager  │ ◄── claims MEZO
        │  → veMEZO     │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ GaugeVoteModule│ → veBTC boost
        └───────────────┘
```

## 📚 Documentation & Resources
- [Mezo Developer Docs](https://mezo.org/docs/developers/)
- [MUSD Development Guide](https://mezo.org/docs/developers/musd/overview)
- [Mezo Earn & Voting Overview](https://mezo.org/docs/users/mezo-earn/vote)

## 🗺️ Roadmap
- [x] Wave 1: Testnet deployment, core routing logic, sMUSD integration.
- [ ] Q1 2027: Mezo Mainnet launch.
- [ ] Q2 2027: Cross-chain expansion (Base, BNB Chain).
