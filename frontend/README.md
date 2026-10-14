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
