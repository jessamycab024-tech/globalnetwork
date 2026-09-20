# Backend service layout

```text
backend/
├── api/{auth,users,markets,trades,arbitrage,wallets,support,admin}
├── domain/          validation, policies, and business rules
├── providers/       RPC, indexer, market-data, and KYC adapters
├── workers/         refresh, indexing, settlement, and reconciliation jobs
├── persistence/     models, migrations, and repositories
├── security/        sessions, rate limits, audit events, and secrets
└── observability/   logs, metrics, tracing, and alerts
```

## Direct support

- Authenticated users send direct messages from the floating frontend panel.
- Messages are stored with user ID, wallet context, timestamps, read state, and retention policy.
- The admin can view and reply to conversations from the admin control surface.
- No ticket form is required, and support must never request private keys or seed phrases.

## Single-admin policy

- Exactly one administrator account is configured at deployment.
- No public admin registration, invitation, or second-admin creation flow.
- Admin identity is checked server-side against a protected identity-provider subject or deployment secret.
- Require MFA or equivalent strong authentication.
- Never authorize admin access from client-provided roles, email fields, cookies, or local storage.
- Audit every admin action with actor, action, target, timestamp, reason, and result.

The admin may pause trading or arbitrage, review execution and support data, manage risk limits, and respond to users. The admin must not arbitrarily assign winning or losing outcomes. Results must come from verified execution, fees, slippage, and settlement data.

## Arbitrage settlement

At cycle completion, workers must verify all required executions, calculate actual proceeds after fees and losses, reconcile on-chain or trusted settlement records, and write an auditable settlement. Only verified proceeds may be credited; target profits are not guaranteed.
