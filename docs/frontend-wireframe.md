# Frontend wireframe

## Application shell

```text
Header: GlobalNetwork | network status | wallet connect | hamburger menu
Main: Home | Trade | AI Arbitrage | Wallet
Floating customer service button: direct message panel
```

The app must be responsive and accessible, and must show clear loading, stale-data, disconnected-wallet, rejected-transaction, and provider-error states.

## Home

- Live market table: asset, price, 24-hour change, volume, and updated time.
- Hamburger menu: KYC Register, User ID/Profile, About Us, Trust & Security, and New York, USA office information.
- Floating customer-service button opens an in-app direct-message panel without navigating to a ticket page or form.

## Trade

- Pair selector, buy/sell controls, amount, and five-level selector.
- Live candlestick chart, liquidity, route comparison, fees, slippage, and price impact.
- Review transaction, explicit wallet confirmation, and status tracking.
- Trade history with filters and transaction details.

## AI Arbitrage

- Five-level selector, capital, cycle time, target setting, and risk summary.
- Venue comparison, spread, net estimate, confidence, liquidity, gas, slippage, expiry, and explanation.
- Refresh quote, simulate, and explicit user approval actions.
- Arbitrage history with level, venue, status, cycle, timestamp, and result filters.

## Wallet

- Connected address and network.
- Total portfolio value and held-coin balances.
- Approvals and allowance warnings.
- Transaction history with type, amount, status, timestamp, and hash.

Customer support must never request private keys, seed phrases, or wallet passwords. The support panel is linked to the authenticated user and backend admin messaging controls.
