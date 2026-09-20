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

Every trade must require explicit user confirmation in the connected wallet. The interface must handle rejected, pending, failed, expired, and replaced transactions.

### 3. AI Arbitrage tab

The AI Arbitrage tab should display opportunities identified by comparing prices and liquidity across supported venues. It must contain five analysis levels:

1. **Level 1 — Market scan:** discover price differences between supported venues and chains.
2. **Level 2 — Opportunity validation:** confirm quote freshness, liquidity, volume, and executable trade size.
3. **Level 3 — Cost analysis:** calculate estimated gas, protocol fees, slippage, bridge costs, and net return.
4. **Level 4 — Risk analysis:** evaluate contract, liquidity, latency, bridge, provider, execution, and market risks.
5. **Level 5 — Execution readiness:** show confidence, expiry, final quote, transaction simulation, and the user's approval action.

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

### AI Arbitrage system

- Compare market prices across venues and chains
- Estimate spread, gas cost, risk, and execution viability
- Surface opportunities with confidence and risk context
- Require user approval before any action is executed
- Treat AI output as advisory, not guaranteed profit

## Planned repository structure

```text
frontend/        User-facing wallet, dashboard, trading, charts, and AI dashboard UI
backend/         APIs, market data services, execution orchestration, and analysis jobs
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
4. Implement trading pairs, live candlestick charts, quotes, and transaction review
5. Implement the five-level AI arbitrage analysis pipeline and risk controls
6. Implement wallet balances, held-coin views, approvals, and transaction history
7. Validate on testnets and create a production launch checklist

## Contribution expectations

Pull requests should include a clear description of the changes, the risk area, and validation steps. Avoid storing secrets, production RPC credentials, or personal data in commits or pull requests.

## Disclaimer

This project is a software engineering starter for a crypto wallet and trading platform. Cryptocurrency trading involves risk, market volatility, and potential loss of funds. This repository is not financial advice.
