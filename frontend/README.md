# GlobalNetwork application

The Next.js app in this directory serves both the frontend and its admin API routes. Deploy this directory as one Node.js/Next.js application; there is no separate backend service.

## Run locally

```bash
npm install
npm run dev
```

Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` in the application environment. Production requires all three values, and the session secret must be at least 32 characters. The admin login and operations APIs are served by this same application.

Build and run the production app with `npm run build` and `npm start`.

Admin operations currently use in-memory demo data. It resets when the server process restarts and is not suitable for persistent, multi-region production data.

## Customer service

The customer Support button opens only the customer service view in the current page, preserving the surrounding app state when returning. It never opens the admin login. Guests can send messages without connecting a wallet; an opaque, HTTP-only browser cookie restricts access to their own conversation. Clearing cookies or using a different browser loses access.

Administrators use the **Customer service live chat** tab to view all guest conversations, reply, and set Open, Pending, or Resolved status. The existing demo-user support cases remain separate. Both sides refresh every three seconds; sending a customer message reopens a resolved conversation.

Chat uses the same single-process, in-memory demo deployment model: it resets on restart, expires conversations after seven days, and limits storage to 500 conversations with 200 messages each (2,000 characters per message). Customer messages are throttled per conversation. Do not send sensitive information. Before production use, add persistent storage, verified customer accounts, and infrastructure-level abuse protection.

The admin trade outcome, arbitrage auto-approval, cycle, and balance controls operate only on this fictional demo data. Arbitrage demo cycles use the documented level durations and targets; generated demo credits do not represent real execution, profit, or wallet balances.
