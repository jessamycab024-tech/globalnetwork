# GlobalNetwork

A crypto wallet dApp for secure portfolio management, trading workflows, and AI-powered arbitrage discovery.

## Overview

GlobalNetwork is designed as a non-custodial crypto wallet experience that combines:

- Wallet access and account management
- Multi-chain balance and transaction visibility
- Trading and execution workflows
- AI-assisted arbitrage detection and risk analysis
- Direct customer support and secure support messaging

This repository is intentionally structured for a future production-ready dApp, with clear separation between frontend UX, backend services, and contract integrations.

## Authentication model

### User authentication via wallet connection

Users must be able to login using any supported wallet by connecting their wallet to the dApp.

Requirements:

- Wallet connection must support multiple wallet providers and supported chains.
- A login flow must verify ownership of the wallet address through a signature challenge.
- The backend must bind the authenticated session to the connected wallet address and selected network.
- User sessions are wallet-linked and require secure wallet-address validation on each request.
- Users may reconnect, switch wallets, and disconnect without exposing private keys or seed phrases.
- Wallet authentication must not be treated as custody or permission to move funds automatically.
- The app must display wallet connection status clearly to the user.

### Admin authentication via web login

The admin account must authenticate through a dedicated web interface, separate from the wallet-login flow for end users.

Requirements:

- There is exactly one admin account in the system.
- The admin logs in through a web admin portal, not through a wallet connection.
- Admin authentication must be server-side and protected by strong authentication, preferably MFA.
- Admin identity must be validated against a secure identity-provider subject or deployment credential.
- The admin login flow must be separate from user wallet authentication and must not share the same session or authorization model.
- No client-side role, wallet address, cookie value, or local-storage value may be used to authorize admin access.
- Every admin action must be logged with actor, timestamp, target, reason, and outcome.

This separation ensures that ordinary users can sign in via wallet and the single admin can sign in via a secure web login mechanism.

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
- A hamburger menu in the top navigation for account and company information

#### Home tab hamburger menu

The Home tab hamburger menu must contain the following sections:

- KYC Register
- User ID / Account Profile
- About Us
- Trust & Security
- Office: New York, USA

The KYC section must include:

- onboarding and verification status
- identity verification flow
- status badges for pending, approved, and rejected user verification
- compliance notice and privacy policy link

The User ID section must include:

- unique user identifier
- account status and authentication state
- profile details and verification level
- secure access controls and session management

The About Us section must include:

- the company purpose and vision
- trust and safety messaging
- product transparency and risk disclosure
- company location and office details in New York, USA

The trust section must explain:

- wallet is non-custodial and user-controlled
- no private keys or seed phrases are stored by the app
- AI arbitrage and trade results are advisory, not guaranteed returns
- operations are designed with security, compliance, and transparency in mind

The office-location section must clearly state:

- Headquarters / office location: New York, USA
- This information is displayed for transparency and user trust
- The exact legal or registered office details should be verified before launch and updated in the product UI

#### Floating customer service

The frontend must contain a floating customer-service button that remains visible on all major screens while the user is inside the app. The button should open a lightweight direct-message panel without sending the user to a separate ticket page or support form.

Customer support requirements:

- direct-message chat interface
- support conversation history visible in the panel
- quick support access and response status
- connection to admin-side support controls in the backend
- no ticket form required
- no request for private keys, wallet phrases, or passphrases
- all support messages must be scoped to the authenticated user and wallet context

This customer-service panel should always be available for wallet, trading, AI arbitrage, and account support questions.

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

The AI arbitrage engine may auto-populate settlement amounts only after the cycle is complete and the required data is verified. The backend must calculate final results from actual execution and settlement data, not from a user-visible target alone.

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

## Backend admin and support control

The backend must include a single administrative account to manage support and operational controls.

Requirements:

- exactly one admin account exists in the system
- the admin is configured at deployment through a secure, immutable identity or secret
- the admin is allowed to monitor customer support messages, review support history, and manage operational controls
- the admin may pause or resume trading, arbitrage, or support features if needed
- the admin may review risk events and execution data
- the admin may not arbitrarily assign winning or losing outcomes to users
- all admin actions must be logged with actor, timestamp, target, reason, and result
- user support should remain linked to the authenticated user and wallet context

The admin dashboard should let the admin:

- view customer support chats
- review active/inactive support conversations
- identify suspicious or risky users and activity
- review arbitrage and trade execution history
- freeze or limit risky operations based on policy
- resume operations only after risk review and approval

Customer support and admin controls should be clearly separated from wallet custody and should never allow arbitrary credential or wallet access.

## Planned repository structure

```text
frontend/        User-facing wallet, dashboard, trading, charts, AI dashboard, and floating support UI
backend/         APIs, market data services, execution orchestration, trade history, arbitrage jobs, support control, and admin policy
contracts/       Smart contract interfaces, ABIs, deployment metadata, and integrations
docs/            Architecture, product, and risk documentation
.github/         PR automation, issue templates, and workflow files
```

## Recommended architecture

```text
Wallet user login -> Frontend tabs -> Backend API -> Market Data + AI Analysis -> User decision -> Wallet signature
Admin web login -> Admin portal -> Admin controls -> Support, policies, risk review, and system operations
```

The frontend remains the presentation and signing layer. The backend provides read-only market insights and operational services. No private key or seed phrase should be stored in the app or repository.

## Security and trust model

- Non-custodial by default
- User signs transactions from their own wallet
- Admin login is separate and web-based with strong auth
- Validate chain IDs, token addresses, signatures, and transaction calldata
- Require explicit confirmation before sending or signing any transaction
- Use allowlists, rate limits, and provider validation for external integrations
- Never commit private keys, seed phrases, or `.env` secrets
- Reconcile trade and arbitrage records against trusted execution and on-chain data
- Protect KYC, support, and user profile information in compliance with privacy and trust requirements
- Limit admin access to a single account and enforce MFA or equivalent strong authentication

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
3. Add the floating direct-message customer-service panel
4. Implement wallet login and wallet-linking flow for any supported wallet
5. Implement a separate web-based admin login flow for the single admin
6. Implement live market prices and resilient data-refresh states
7. Implement trading pairs, live candlestick charts, five trade levels, and transaction review
8. Implement trade-history storage, indexing, filtering, and reconciliation
9. Implement the five-level AI arbitrage analysis pipeline, risk controls, settlement verification, and arbitrage history
10. Implement wallet balances, held-coin views, approvals, transaction history, KYC onboarding, and trust/privacy sections in the Home menu
11. Validate on testnets and create a production launch checklist

## Contribution expectations

Pull requests should include a clear description of the changes, the risk area, and validation steps. Avoid storing secrets, production RPC credentials, or personal data in commits or pull requests.

## Disclaimer

This project is a software engineering starter for a crypto wallet and trading platform. The trade and arbitrage target percentages are configurable product requirements, not promises or guaranteed returns. Cryptocurrency trading involves risk, market volatility, and potential loss of funds. This repository is not financial advice.
