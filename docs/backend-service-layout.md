# Backend API in the Next.js app

The frontend and admin API are deployed together as one Next.js application. Admin login, session, logout, and operations endpoints are implemented as route handlers under `frontend/app/api/admin/`.

The operations endpoint currently uses in-memory demo data. It is useful for development only: it resets when the server process restarts and is not shared between instances or regions. Production operations require a durable shared database and real user, execution, and support data sources.

## Direct support

- Authenticated users should send direct messages from the floating frontend panel.
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

Any production admin controls must be audited and backed by verified execution data. The admin must not arbitrarily assign winning or losing outcomes. Results must come from verified execution, fees, slippage, and settlement data.

## Arbitrage settlement

At cycle completion, workers must verify all required executions, calculate actual proceeds after fees and losses, reconcile on-chain or trusted settlement records, and write an auditable settlement. Only verified proceeds may be credited; target profits are not guaranteed.
