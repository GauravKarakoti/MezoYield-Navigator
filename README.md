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
- **Asynchronous Redemption Handling:** Safely manages pending withdrawals from external vaults (e.g., Ditto) without locking user funds indefinitely[reference:17].
- **MEZO Boost Flywheel:** Opt-in to have MEZO emissions auto-locked into veMEZO to boost your veBTC gauge weight[reference:18].
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
forge test
```
5. **Deploy to Mezo Testnet**
```bash
forge script script/Deploy.s.sol --rpc-url $MEZO_TESTNET_RPC --broadcast
```

## 🔗 Deployed Contracts (Mezo Testnet)
- YieldRouter: 0x...
- BoostManager: 0x...
- MUSD Savings Vault (sMUSD): 0x... (integrated)
- Ditto MUSD Vault (dMUSD): 0x... (integrated)

## 📚 Documentation & Resources
- [Mezo Developer Docs](https://mezo.org/docs/developers/)
- [MUSD Development Guide](https://mezo.org/docs/developers/musd/overview)
- [Mezo Earn & Voting Overview](https://mezo.org/docs/users/mezo-earn/vote)

## 🗺️ Roadmap
- [x] Wave 1: Testnet deployment, core routing logic, sMUSD integration.
- [ ] Q1 2027: Mezo Mainnet launch.
- [ ] Q2 2027: Cross-chain expansion (Base, BNB Chain).
