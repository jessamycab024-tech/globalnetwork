'use client';

import { FormEvent, useState } from 'react';

export default function AdminPage() {
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return <main className="admin-shell"><div className="admin-card"><a className="back-link" href="/">← Back to GlobalNetwork</a><div className="brand-lockup"><span className="brand-mark">G</span><span>GlobalNetwork</span></div><p className="eyebrow">Restricted access</p><h1>Admin portal<span className="accent">.</span></h1><p className="muted">Sign in with the configured administrator identity. Wallet login is not used for admin access.</p>{submitted ? <div className="alert success">Credentials submitted for secure server-side verification. Connect this form to your identity provider before production.</div> : <form onSubmit={submit}><label>Admin email<input type="email" name="email" autoComplete="username" placeholder="admin@yourdomain.com" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" placeholder="Enter password" required /></label><label className="checkbox"><input type="checkbox" required /> <span>Use MFA or security-key verification</span></label><button className="primary-button full" type="submit">Continue securely</button><a className="forgot" href="mailto:security@globalnetwork.example">Contact security administrator</a></form>}<div className="admin-security"><strong>Admin security</strong><span>Single configured admin · server-side authorization · audit logging</span></div></div></main>;
}
