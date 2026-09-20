# GlobalNetwork

A crypto wallet dApp for secure portfolio management, trading workflows, and AI-powered arbitrage discovery.

## Overview

GlobalNetwork is designed as a non-custodial crypto wallet experience that combines:

- Wallet access and account management
- Multi-chain balance and transaction visibility
- Trading and execution workflows
- AI-assisted arbitrage detection and risk analysis

This repository is intentionally structured for a future production-ready dApp, with clear separation between frontend UX, backend services, and contract integrations.

## Frontend product structure

The frontend must contain four primary tabs:

### 1. Home tab

The Home tab is the live market overview and application landing page. It should show:

- Live prices for all supported cryptocurrencies
- 24-hour price change and percentage change
- Market capitalization and trading volume
- Trending and recently viewed assets
- Last-updated timestamp and data-provider status
- Loading, stale-data, and provider-error states

Prices must be sourced from validated providers, display their freshness, and avoid presenting stale data as live data.

### 2. Trade tab

The Trade tab is the trading workspace. It should contain:

- All supported coins and trading pairs
- Search and filtering by asset, chain, and liquidity
- Live candlestick charts with selectable intervals
- Current price, bid/ask information, volume, and market statistics
- Token-pair selection and route/quote comparison
- Slippage, price impact, network fee, and protocol fee estimates
- Transaction preview, wallet approval, and transaction status
- A trade-history view with filters for date, pair, side, level, status, amount, fees, and transaction hash
- Trade detail pages showing entry data, exit data, timestamps, execution price, realized result, and failure reason where applicable

#### Five trade levels

The Trade tab must provide five configurable trade levels. The values below are product requirements for the initial configuration and must be presented as target parameters or strategy settings—not guaranteed returns:

| Level | Required capital | Trading time | Target profit |
|---|---:|---:|---:|
| Level 1 | 300–20,000 USDT | 60 seconds | 18% |
| Level 2 | 20,000–30,000 USDT | 120 seconds | 23% |
| Level 3 | 30,000–50,000 USDT | 180 seconds | 27.5% |
| Level 4 | 50,000–100,000 USDT | 360 seconds | 50% |
| Level 5 | 100,000–1,000,000 USDT | 720 seconds | 100% |

The UI must clearly show the selected level, required capital range, configured duration, target profit, fees, risks, and current status before a user proceeds. The system must not represent target profit as guaranteed, hide losses, or execute a trade without explicit user approval.

Trade history must be persisted and displayed per connected wallet and chain. It should support pagination, loading and error states, export where appropriate, and reconciliation with on-chain transaction data. Never fabricate a completed trade when execution data is unavailable.

### 3. AI Arbitrage tab

The AI Arbitrage tab should display opportunities identified by comparing prices and liquidity across supported venues. It must contain five analysis levels and must maintain a dedicated arbitrage history view.

#### Five AI arbitrage levels

| Level | Required capital | Cycle time | Target profit |
|---|---:|---:|---:|
| Level 1 | 1,000 USDT | 2 days | 1% |
| Level 2 | 30,000 USDT | 3 days | 1.5% |
| Level 3 | 50,000 USDT | 5 days | 3% |
| Level 4 | 100,000 USDT | 7 days | 5% |
| Level 5 | 500,000 USDT | 15 days | 10% |

The AI Arbitrage tab must also include:

- opportunity scanning across supported exchanges and chains
- quote freshness and venue comparison
- spread and estimated net-return calculation
- confidence, risk, and latency information
- expiry countdown, final approval status, and execution summary
- arbitrage history with filters for level, cycle, amount, status, venue, timestamp, and profit result

Each opportunity should show its source venues, timestamp, gross spread, net estimated return, trade-size limit, confidence, risks, and expiry time. AI output is advisory and must never silently sign, submit, or custody funds. A fresh quote and explicit wallet confirmation are required before execution.

### 4. Wallet tab

The Wallet tab is the user's portfolio and transaction area. It should show:

- Connected wallet address and selected network
- Total portfolio amount and per-coin balances
- All coins currently held by the user
- Token quantity, estimated value, average price, and profit/loss where available
- Transaction history with type, asset, amount, status, timestamp, network, and transaction hash
- Pending, confirmed, failed, and rejected transaction states
- Token approvals and relevant allowance information
- Copy-address and block-explorer links

The wallet tab must not request or store private keys or seed phrases. Balances and transaction history must be clearly associated with the selected wallet address and chain.

## Core product goals

### Wallet and portfolio

- Connect supported wallets
- View balance, network, and token holdings
- Track transaction history and approval state
- Prepare and review transactions before signing

### Trading system

- Display market pricing and token pair data
- Compare routes and swap opportunities
- Show price impact, slippage, and fees
- Allow explicit user confirmation before execution
- Monitor order and transaction status
- Store and display auditable trade history

### AI Arbitrage system

- Compare market prices across venues and chains
- Estimate spread, gas cost, risk, and execution viability
- Surface opportunities with confidence and risk context
- Require user approval before any action is executed
- Treat AI output as advisory, not guaranteed profit

## Planned repository structure

```text
frontend/        User-facing wallet, dashboard, trading, charts, and AI dashboard UI
backend/         APIs, market data services, execution orchestration, trade history, and analysis jobs
contracts/       Smart contract interfaces, ABIs, deployment metadata, and integrations
docs/            Architecture, product, and risk documentation
.github/         PR automation, issue templates, and workflow files
```

## Recommended architecture

```text
User wallet -> Frontend tabs -> Backend API -> Market Data + AI Analysis -> User decision -> Wallet signature
```

The frontend remains the presentation and signing layer. The backend provides read-only market insights and operational services. No private key or seed phrase should be stored in the app or repository.

## Security and trust model

- Non-custodial by default
- User signs transactions from their own wallet
- Validate chain IDs, token addresses, signatures, and transaction calldata
- Require explicit confirmation before sending or signing any transaction
- Use allowlists, rate limits, and provider validation for external integrations
- Never commit private keys, seed phrases, or `.env` secrets
- Reconcile trade and arbitrage records against trusted execution and on-chain data

## AI arbitrage guardrails

AI arbitrage features should include:

- source exchange or protocol names
- timestamp and freshness of market data
- net estimated return after fees and slippage
- risk and confidence indicators
- user-facing explanation of why the opportunity exists
- expiry time and continued quote validation before execution

These features are for research and decision support only. They do not guarantee profit or guarantee execution success.

## Development direction

1. Define supported wallets, chains, markets, venues, and data providers
2. Build the four-tab frontend navigation and responsive layouts
3. Implement live market prices and resilient data-refresh states
4. Implement trading pairs, live candlestick charts, five trade levels, and transaction review
5. Implement trade-history storage, indexing, filtering, and reconciliation
6. Implement the five-level AI arbitrage analysis pipeline, risk controls, and arbitrage history
7. Implement wallet balances, held-coin views, approvals, and transaction history
8. Validate on testnets and create a production launch checklist

## Contribution expectations

Pull requests should include a clear description of the changes, the risk area, and validation steps. Avoid storing secrets, production RPC credentials, or personal data in commits or pull requests.

## Disclaimer

This project is a software engineering starter for a crypto wallet and trading platform. The trade and arbitrage target percentages are configurable product requirements, not promises or guaranteed returns. Cryptocurrency trading involves risk, market volatility, and potential loss of funds. This repository is not financial advice.
