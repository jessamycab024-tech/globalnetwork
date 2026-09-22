'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!response.ok) { if (!cancelled) router.replace('/admin'); return; }
        const data = await response.json();
        if (!cancelled) setUsername(data.username);
      } catch { if (!cancelled) router.replace('/admin'); }
      finally { if (!cancelled) setChecked(true); }
    }
    checkSession();
    return () => { cancelled = true; };
  }, [router]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
  }

  if (!checked) return <main className="admin-shell"><div className="admin-card"><p className="muted">Checking session…</p></div></main>;

  return (
    <main className="admin-shell">
      <div className="admin-card">
        <div className="brand-lockup"><span className="brand-mark">G</span><span>GlobalNetwork</span></div>
        <p className="eyebrow">Admin dashboard</p>
        <h1>Welcome{username ? `, ${username}` : ''}<span className="accent">.</span></h1>
        <p className="muted">Connect audited user lookup, points ledger, KYC review, and support tools to this dashboard.</p>
        <button className="primary-button full" onClick={logout}>Sign out</button>
      </div>
    </main>
  );
}
