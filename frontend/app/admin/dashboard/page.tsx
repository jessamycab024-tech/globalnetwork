'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'overview' | 'kyc' | 'support' | 'trades' | 'wallet' | 'arbitrage';

type KycItem = {
  id: number;
  userId: string;
  user: string;
  email: string;
  risk: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Approved' | 'Rejected';
  notes: string;
};

type SupportItem = {
  id: number;
  userId: string;
  user: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Pending' | 'Resolved';
  preview: string;
};

type TradeItem = {
  id: string;
  userId: string;
  user: string;
  pair: string;
  side: 'Buy' | 'Sell';
  amount: string;
  status: 'Queued' | 'Executed' | 'Failed' | 'Win' | 'Lose';
};

type WalletItem = {
  id: number;
  userId: string;
  user: string;
  wallet: string;
  network: string;
  points: number;
  status: 'Active' | 'Review';
};

type ArbitrageItem = {
  id: string;
  userId: string;
  user: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  cycle: string;
  result: 'Profitable' | 'Pending' | 'Closed';
  profit: string;
  status: 'Open' | 'Settled' | 'Rejected';
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type MarketItem = {
  pair: string;
  price: number;
  change: number;
};

type OperationsData = {
  serverTime: string;
  updatedAt: string;
  users: UserItem[];
  kyc: KycItem[];
  support: SupportItem[];
  trades: TradeItem[];
  wallets: WalletItem[];
  arbitrage: ArbitrageItem[];
  markets: MarketItem[];
};

const emptyOperations: OperationsData = {
  serverTime: '',
  updatedAt: '',
  users: [],
  kyc: [],
  support: [],
  trades: [],
  wallets: [],
  arbitrage: [],
  markets: [],
};

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'User detail' },
  { id: 'kyc', label: 'KYC' },
  { id: 'support', label: 'Support' },
  { id: 'trades', label: 'Trade control' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'arbitrage', label: 'AI arbitrage' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [kycRows, setKycRows] = useState<KycItem[]>(emptyOperations.kyc);
  const [supportThreads, setSupportThreads] = useState<SupportItem[]>(emptyOperations.support);
  const [tradeRows, setTradeRows] = useState<TradeItem[]>(emptyOperations.trades);
  const [walletRows, setWalletRows] = useState<WalletItem[]>(emptyOperations.wallets);
  const [arbitrageRows, setArbitrageRows] = useState<ArbitrageItem[]>(emptyOperations.arbitrage);
  const [users, setUsers] = useState<UserItem[]>(emptyOperations.users);
  const [markets, setMarkets] = useState<MarketItem[]>(emptyOperations.markets);
  const [lastSync, setLastSync] = useState('Waiting for backend data');
  const [dataError, setDataError] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [pointDelta, setPointDelta] = useState('100');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const selectedWallet = useMemo(
    () => walletRows.find((wallet) => wallet.userId === selectedUserId) ?? walletRows[0] ?? { id: 0, userId: '', user: 'No wallet selected', wallet: '—', network: '—', points: 0, status: 'Active' },
    [selectedUserId, walletRows],
  );

  const visibleKycRows = useMemo(
    () => kycRows.filter((row) => row.userId === selectedUserId),
    [kycRows, selectedUserId],
  );

  const visibleSupportThreads = useMemo(
    () => supportThreads.filter((thread) => thread.userId === selectedUserId),
    [selectedUserId, supportThreads],
  );

  const visibleTradeRows = useMemo(
    () => tradeRows.filter((trade) => trade.userId === selectedUserId),
    [selectedUserId, tradeRows],
  );

  const visibleArbitrageRows = useMemo(
    () => arbitrageRows.filter((row) => row.userId === selectedUserId),
    [arbitrageRows, selectedUserId],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users],
  );

  function applyOperationsData(data: OperationsData) {
    setUsers(data.users);
    setKycRows(data.kyc);
    setSupportThreads(data.support);
    setTradeRows(data.trades);
    setWalletRows(data.wallets);
    setArbitrageRows(data.arbitrage);
    setMarkets(data.markets);
    setLastSync(new Date(data.serverTime || data.updatedAt).toLocaleTimeString());
    setSelectedUserId((current) => data.wallets.some((wallet) => wallet.userId === current) ? current : data.wallets[0]?.userId ?? '');
    setDataError('');
  }

  async function loadOperations() {
    const response = await fetch('/api/admin/operations', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load backend operations data.');
    applyOperationsData(await response.json());
  }

  async function sendOperation(payload: Record<string, string | number>) {
    setActionPending(true);
    try {
      const response = await fetch('/api/admin/operations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Admin operation failed.');
      }
      applyOperationsData(await response.json());
    } finally {
      setActionPending(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) router.replace('/admin');
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setUsername(data.username);
          await loadOperations();
        }
      } catch {
        if (!cancelled) setDataError('Backend data is unavailable. Start the backend service on port 4000.');
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    checkSession();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    const interval = window.setInterval(() => {
      if (actionPending) return;
      loadOperations().catch(() => setDataError('Live backend refresh failed. Showing last known data.'));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [checked, actionPending]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
  }

  function handleKycUpdate(id: number, status: 'Approved' | 'Rejected') {
    sendOperation({ action: 'kyc-status', id, status }).catch((error) => setDataError(error.message));
  }

  function adjustPoints(operation: 'add' | 'deduct') {
    const amount = Number(pointDelta) || 0;
    if (!amount) return;

    sendOperation({ action: 'wallet-points', userId: selectedWallet.userId, operation, amount }).catch((error) => setDataError(error.message));
  }

  function handleTradeAction(id: string, status: 'Executed' | 'Failed' | 'Queued' | 'Win' | 'Lose') {
    sendOperation({ action: 'trade-status', id, status }).catch((error) => setDataError(error.message));
  }

  function handleSupportResolve(id: number) {
    sendOperation({ action: 'support-status', id, status: 'Resolved' }).catch((error) => setDataError(error.message));
  }

  if (!checked) {
    return (
      <main className="admin-shell admin-dashboard-shell">
        <div className="admin-card admin-dashboard-card">
          <p className="muted">Checking session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-dashboard-shell">
      <div className="admin-card admin-dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Welcome{username ? `, ${username}` : ''}<span className="accent">.</span></h1>
            <p className="muted">Live backend sync · {lastSync}</p>
            {dataError && <p className="admin-error">{dataError}</p>}
          </div>
          <div className="dashboard-controls">
            <label className="inline-select">
              User ID
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} disabled={actionPending || walletRows.length === 0}>
                {walletRows.map((wallet) => (
                  <option key={wallet.userId} value={wallet.userId}>{wallet.userId} · {wallet.user}</option>
                ))}
              </select>
            </label>
            <button className="primary-button" onClick={logout}>Sign out</button>
          </div>
        </div>

        <div className="admin-tab-list" role="tablist" aria-label="Admin sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <section className="admin-section">
            <div className="summary-grid">
              <div className="summary-card">
                <span className="summary-label">Accounts monitored</span>
                <strong>{walletRows.length}</strong>
                <small>Active profiles</small>
              </div>
              <div className="summary-card">
                <span className="summary-label">Open KYC checks</span>
                <strong>{kycRows.filter((row) => row.status === 'Pending').length}</strong>
                <small>Pending review</small>
              </div>
              <div className="summary-card">
                <span className="summary-label">Open support threads</span>
                <strong>{supportThreads.filter((row) => row.status !== 'Resolved').length}</strong>
                <small>Customer care</small>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-panel">
                <h2>User account detail</h2>
                <div className="detail-row"><span>User ID</span><strong>{selectedWallet.userId}</strong></div>
                <div className="detail-row"><span>Name</span><strong>{selectedWallet.user}</strong></div>
                <div className="detail-row"><span>Email</span><strong>{selectedUser?.email ?? 'N/A'}</strong></div>
                <div className="detail-row"><span>Wallet</span><strong>{selectedWallet.wallet}</strong></div>
                <div className="detail-row"><span>Network</span><strong>{selectedWallet.network}</strong></div>
                <div className="detail-row"><span>KYC</span><strong>{kycRows.find((row) => row.userId === selectedWallet.userId)?.status ?? 'N/A'}</strong></div>
                <div className="detail-row"><span>Role</span><strong>{selectedUser?.role ?? 'User'}</strong></div>
              </div>

              <div className="detail-panel">
                <h2>Real-time market data</h2>
                <ul className="activity-list">
                  {markets.map((market) => (
                    <li key={market.pair}>{market.pair}: ${market.price.toLocaleString()} ({market.change > 0 ? '+' : ''}{market.change}%)</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'kyc' && (
          <section className="admin-section">
            <h2>KYC handling</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleKycRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.userId}</td>
                      <td>{row.user}</td>
                      <td>{row.email}</td>
                      <td><span className={`status-chip ${row.risk.toLowerCase()}`}>{row.risk}</span></td>
                      <td><span className={`status-chip ${row.status.toLowerCase()}`}>{row.status}</span></td>
                      <td>{row.notes}</td>
                      <td>
                        {row.status === 'Pending' && (
                          <div className="inline-actions">
                            <button className="mini-button success" onClick={() => handleKycUpdate(row.id, 'Approved')} disabled={actionPending}>Approve</button>
                            <button className="mini-button danger" onClick={() => handleKycUpdate(row.id, 'Rejected')} disabled={actionPending}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className="admin-section">
            <h2>Customer service</h2>
            <div className="support-stack">
              {visibleSupportThreads.map((thread) => (
                <div key={thread.id} className="support-card">
                  <div className="support-header">
                    <div>
                      <strong>{thread.user}</strong>
                      <small>{thread.userId} · {thread.priority} priority</small>
                    </div>
                    <span className={`status-chip ${thread.status.toLowerCase()}`}>{thread.status}</span>
                  </div>
                  <p>{thread.preview}</p>
                  <button className="secondary-button" onClick={() => handleSupportResolve(thread.id)} disabled={actionPending || thread.status === 'Resolved'}>Mark resolved</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'trades' && (
          <section className="admin-section">
            <h2>Trade control</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>User ID</th>
                    <th>User</th>
                    <th>Pair</th>
                    <th>Side</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTradeRows.map((trade) => (
                    <tr key={trade.id}>
                      <td>{trade.id}</td>
                      <td>{trade.userId}</td>
                      <td>{trade.user}</td>
                      <td>{trade.pair}</td>
                      <td>{trade.side}</td>
                      <td>{trade.amount}</td>
                      <td><span className={`status-chip ${trade.status.toLowerCase()}`}>{trade.status}</span></td>
                      <td>
                        <div className="inline-actions">
                          <button className="mini-button success" onClick={() => handleTradeAction(trade.id, 'Win')} disabled={actionPending}>Win</button>
                          <button className="mini-button danger" onClick={() => handleTradeAction(trade.id, 'Lose')} disabled={actionPending}>Lose</button>
                          <button className="secondary-button" onClick={() => handleTradeAction(trade.id, 'Executed')} disabled={actionPending}>Execute</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'wallet' && (
          <section className="admin-section">
            <h2>User wallet</h2>
            <div className="wallet-panel">
              <div className="wallet-details">
                <div className="detail-row"><span>User ID</span><strong>{selectedWallet.userId}</strong></div>
                <div className="detail-row"><span>User</span><strong>{selectedWallet.user}</strong></div>
                <div className="detail-row"><span>Wallet</span><strong>{selectedWallet.wallet}</strong></div>
                <div className="detail-row"><span>Network</span><strong>{selectedWallet.network}</strong></div>
                <div className="detail-row"><span>Points</span><strong>{selectedWallet.points}</strong></div>
              </div>

              <div className="wallet-controls">
                <label>
                  Points amount
                  <input value={pointDelta} onChange={(event) => setPointDelta(event.target.value)} inputMode="numeric" />
                </label>
                <div className="inline-actions wallet-buttons">
                  <button className="primary-button" onClick={() => adjustPoints('add')} disabled={actionPending || !selectedWallet.userId}>Add points</button>
                  <button className="secondary-button" onClick={() => adjustPoints('deduct')} disabled={actionPending || !selectedWallet.userId}>Deduct points</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'arbitrage' && (
          <section className="admin-section">
            <h2>AI arbitrage history</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>User ID</th>
                    <th>User</th>
                    <th>Level</th>
                    <th>Cycle</th>
                    <th>Result</th>
                    <th>Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleArbitrageRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.userId}</td>
                      <td>{row.user}</td>
                      <td>{row.level}</td>
                      <td>{row.cycle}</td>
                      <td>{row.result}</td>
                      <td>{row.profit}</td>
                      <td><span className={`status-chip ${row.status.toLowerCase()}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
