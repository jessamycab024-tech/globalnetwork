'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Sign in failed.');
        return;
      }
      router.push('/admin/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-shell">
      <div className="admin-card">
        <a className="back-link" href="/">← Back to GlobalNetwork</a>
        <div className="brand-lockup">
          <span className="brand-mark">G</span>
          <span>GlobalNetwork</span>
        </div>
        <p className="eyebrow">Restricted access</p>
        <h1>Admin portal<span className="accent">.</span></h1>
        <p className="muted">Sign in with the configured administrator identity.</p>
        <form onSubmit={submit}>
          <label>Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="primary-button full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="admin-security">Admin security · Single configured admin · server-side authorization · audit logging</p>
      </div>
    </main>
  );
}
