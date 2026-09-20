# Backend administration requirements

The backend must provide a secure, server-authorized admin control plane for the single administrator. The admin portal is hosted at:

- https://www.cryptotrade.agency/admin

## Allowed admin capabilities

### User lookup

- Search by internal User ID and linked wallet address.
- Display only the minimum information needed for support, compliance, and risk operations.
- Mask sensitive identity data by default.
- Require an audit reason for every sensitive lookup.
- Enforce retention, export, and deletion policies for personal data.

### Points ledger

Points may be adjusted only through an append-only, double-entry ledger:

- User ID
- signed adjustment amount
- reason code and free-text justification
- actor and timestamp
- correlation/reference ID
- before and after balances
- reversal workflow instead of destructive edits

Points must never represent cash, trading profit, or guaranteed returns unless explicitly defined and legally approved as a separate product balance.

### Trading controls

The administrator may:

- pause or resume execution globally or by supported market
- place a user or strategy into review, restricted, or read-only status
- cancel or reject an unsafe pending request before signing/submission
- review actual execution, settlement, and on-chain transaction results by User ID
- reconcile records and correct display errors using an audited correction entry

The administrator must **not** force, fabricate, or secretly alter a user's trade to win or lose. Trade outcomes must be derived from the actual quote, signed transaction, execution response, settlement result, and on-chain data. Any test outcome must be isolated to a clearly labelled sandbox/test environment and never affect production users.

### KYC review

KYC reviewers may approve, reject, or request more information only based on the configured compliance policy and verification-provider result:

- pending
- additional information required
- approved
- rejected
- expired

Every decision requires a reason code, reviewer identity, timestamp, provider reference, and immutable audit event. Rejected users must receive the permitted appeal or resubmission path. KYC documents and identity data must be encrypted, access-controlled, and never exposed in logs or client-side code.

### Customer service

- Support agents/admin can view authenticated conversations scoped to a user.
- Messages are stored with User ID, wallet context when available, timestamps, delivery status, and audit history.
- Users can open, close, and export their permitted conversation history.
- The system must block requests for private keys, seed phrases, wallet passwords, or MFA codes.
- Support access must be logged and limited by role.

## Security and privacy requirements

- Exactly one production admin account, protected by strong authentication and MFA.
- Server-side authorization for every administrative operation; never trust a client-side role flag.
- Short-lived sessions, CSRF protection, rate limiting, re-authentication for sensitive actions, and secure cookies.
- Role and permission checks even if only one admin exists today, so the system can evolve safely.
- Immutable audit logs for logins, user lookups, points changes, KYC decisions, support access, restrictions, and policy changes.
- Encrypt sensitive data at rest and in transit.
- Do not provide unrestricted access to all user information; use least privilege, masking, purpose limitation, and documented retention rules.
- Separate production data from development/test data.
- Add approval or dual-control workflow for high-risk policy changes.

## Suggested API surface

All routes require server-side admin authorization and audit logging:

- `GET /admin/users/:userId`
- `GET /admin/users/:userId/activity`
- `POST /admin/users/:userId/points-adjustments`
- `POST /admin/users/:userId/trading-restrictions`
- `POST /admin/trading/pause`
- `POST /admin/kyc/:submissionId/decision`
- `GET /admin/support/conversations`
- `POST /admin/support/conversations/:conversationId/messages`
- `GET /admin/audit-events`

No endpoint may provide a control that fabricates trading outcomes or bypasses the source-of-truth execution and settlement process.
