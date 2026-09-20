# GlobalNetwork admin backend

This directory contains a minimal server-side admin sign-in service. It is separate from the Next.js frontend and must be deployed as its own Node.js service at `https://www.cryptotrade.agency`.

## Local setup

```bash
cd backend
cp .env.example .env
npm install
```

Generate a password hash:

```bash
ADMIN_PASSWORD='use-a-long-unique-password' node --input-type=module -e "import argon2 from 'argon2'; console.log(await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id }))"
```

Generate a session secret:

```bash
openssl rand -base64 48
```

Put both generated values in `.env`, then run:

```bash
npm start
```

Open `http://localhost:3000/admin` and sign in. The service exposes `GET /health` for deployment checks.

## Production deployment

Deploy the `backend` directory as the service root. Set these production environment variables in the backend host, not in the frontend project:

- `NODE_ENV=production`
- `PORT` supplied by the host
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET` (at least 32 random characters)
- `APP_ORIGIN=https://www.cryptotrade.agency`

Use HTTPS and configure the custom domain so `/admin` points to this Node service. The frontend `/admin` redirect already targets that URL.

## Security notes

- Passwords are verified with Argon2id and are never stored in plaintext.
- Sessions are signed, short-lived, HTTP-only cookies.
- Login attempts are rate-limited.
- Helmet adds baseline security headers.
- This starter intentionally does not fake user records, KYC decisions, points, balances, or trading outcomes. Add those features behind authenticated, audited server routes and a real database.
