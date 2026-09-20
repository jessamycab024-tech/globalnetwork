'use client';

import { useEffect } from 'react';

const ADMIN_BACKEND_URL = 'https://www.cryptotrade.agency/admin';

export default function AdminPage() {
  useEffect(() => {
    window.location.replace(ADMIN_BACKEND_URL);
  }, []);

  return (
    <main className="admin-shell">
      <div className="admin-card">
        <div className="brand-lockup">
          <span className="brand-mark">G</span>
          <span>GlobalNetwork</span>
        </div>
        <p className="eyebrow">Restricted access</p>
        <h1>Admin portal<span className="accent">.</span></h1>
        <p className="muted">Redirecting to the secure administrator sign-in.</p>
        <a className="primary-button full admin-redirect" href={ADMIN_BACKEND_URL}>
          Continue to secure admin login
        </a>
        <p className="admin-security">
          Credentials are handled by the backend only. Never enter administrator credentials on the public frontend.
        </p>
      </div>
    </main>
  );
}
