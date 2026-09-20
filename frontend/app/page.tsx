'use client';

import { useMemo, useState } from 'react';

type Tab = 'home' | 'trade' | 'arbitrage' | 'wallet';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'trade', label: 'Trade', icon: '↔' },
  { id: 'arbitrage', label: 'AI Arbitrage', icon: '✦' },
  { id: 'wallet', label: 'Wallet', icon: '◈' },
];

const marketRows = [
  ['BTC / USDT', '$67,842.20', '+2.41%', 'Bullish'],
  ['ETH / USDT', '$3,824.71', '+1.18%', 'Bullish'],
  ['SOL / USDT', '$168.45', '-0.62%', 'Neutral'],
  ['USDC / USDT', '$1.0001', '+0.01%', 'Stable'],
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [wallet, setWallet] = useState('');
  const [walletError, setWalletError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const shortWallet = useMemo(
    () => (wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : ''),
    [wallet],
  );

  async function connectWallet() {
    setWalletError('');
    if (!window.ethereum) {
      setWalletError('No browser wallet detected. Install a supported wallet to continue.');
      return;
    }

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (accounts?.[0]) setWallet(accounts[0]);
    } catch {
      setWalletError('Wallet connection was cancelled or rejected.');
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab('home')} aria-label="Go to home">
          <span className="brand-mark">G</span>
          <span>GlobalNetwork</span>
        </button>
        <div className="topbar-actions">
          <span className="live-indicator"><i /> Live data</span>
          <a className="admin-link" href="/admin">Admin portal</a>
          <button className="wallet-button" onClick={connectWallet}>
            {shortWallet || 'Connect wallet'}
          </button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">☰</button>
        </div>
      </header>

      {menuOpen && (
        <aside className="account-menu">
          <div className="menu-title">Account & trust</div>
          <button onClick={() => setMenuOpen(false)}>KYC Register</button>
          <button onClick={() => setMenuOpen(false)}>User ID / Profile</button>
          <button onClick={() => setMenuOpen(false)}>About Us</button>
          <button onClick={() => setMenuOpen(false)}>Trust & Security</button>
          <button onClick={() => setMenuOpen(false)}>Office: New York, USA</button>
        </aside>
      )}

      <div className="layout">
        <nav className="sidebar" aria-label="Main navigation">
          <div className="nav-label">Workspace</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="sidebar-spacer" />
          <div className="security-note"><span>✓</span><div><strong>Non-custodial</strong><small>You control your keys</small></div></div>
        </nav>

        <section className="content">
          {walletError && <div className="alert">{walletError}</div>}
          {activeTab === 'home' && <HomeTab wallet={shortWallet} onConnect={connectWallet} />}
          {activeTab === 'trade' && <TradeTab />}
          {activeTab === 'arbitrage' && <ArbitrageTab />}
          {activeTab === 'wallet' && <WalletTab wallet={shortWallet} onConnect={connectWallet} />}
        </section>
      </div>

      <button className="support-fab" onClick={() => setSupportOpen(true)} aria-label="Open customer support">✦ <span>Support</span></button>
      {supportOpen && <SupportPanel onClose={() => setSupportOpen(false)} wallet={shortWallet} />}
    </main>
  );
}

function HomeTab({ wallet, onConnect }: { wallet: string; onConnect: () => void }) {
  return <>
    <div className="page-heading"><div><p className="eyebrow">Market overview · updated just now</p><h1>Good morning<span className="accent">.</span></h1><p className="muted">Track your portfolio and the global market from one secure workspace.</p></div><button className="primary-button" onClick={onConnect}>{wallet || 'Connect wallet'}</button></div>
    <div className="metric-grid">
      <Metric label="Portfolio value" value={wallet ? '$24,892.40' : 'Connect wallet'} change={wallet ? '+8.24%' : '—'} />
      <Metric label="24h market volume" value="$48.2B" change="+12.6%" />
      <Metric label="Active opportunities" value="12" change="Live" />
    </div>
    <section className="panel"><div className="panel-heading"><div><h2>Live markets</h2><p className="muted">Prices from verified market-data providers</p></div><span className="fresh-badge">● Fresh</span></div><div className="table-wrap"><table><thead><tr><th>Market</th><th>Price</th><th>24h change</th><th>Signal</th></tr></thead><tbody>{marketRows.map((row) => <tr key={row[0]}><td className="strong">{row[0]}</td><td>{row[1]}</td><td className={row[2].startsWith('+') ? 'positive' : 'negative'}>{row[2]}</td><td><span className="signal">{row[3]}</span></td></tr>)}</tbody></table></div></section>
    <div className="info-grid"><InfoCard title="Secure by design" text="Wallet signatures stay with you. We never request private keys or seed phrases." /><InfoCard title="Global infrastructure" text="Live feeds, provider failover, and stale-data indicators keep information transparent." /></div>
  </>;
}

function TradeTab() {
  return <><PageTitle eyebrow="Execution workspace" title="Trade with clarity" text="Review every quote, fee, and risk before signing from your wallet." /><div className="two-column"><section className="panel"><div className="panel-heading"><h2>New trade</h2><span className="tag">Testnet safe</span></div><label>Trading pair<select><option>BTC / USDT</option><option>ETH / USDT</option><option>SOL / USDT</option></select></label><div className="segmented"><button className="selected">Buy</button><button>Sell</button></div><label>Amount<input placeholder="0.00 USDT" inputMode="decimal" /></label><label>Strategy level<select><option>Level 1 · 60 seconds</option><option>Level 2 · 120 seconds</option><option>Level 3 · 180 seconds</option><option>Level 4 · 360 seconds</option><option>Level 5 · 720 seconds</option></select></label><button className="primary-button full">Review transaction</button></section><section className="panel chart-panel"><div className="panel-heading"><h2>BTC / USDT</h2><span className="positive">+2.41%</span></div><div className="chart-placeholder"><div className="chart-line" /><span>Live chart will appear after market connection</span></div><div className="quote-list"><span>Network fee <b>Calculated at review</b></span><span>Slippage <b>0.50% max</b></span><span>Price impact <b>—</b></span></div></section></div></>;
}

function ArbitrageTab() {
  return <><PageTitle eyebrow="Decision support" title="AI Arbitrage" text="Find venue spreads with transparent estimates. Every execution requires fresh quotes and your approval." /><div className="level-row">{['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'].map((level, index) => <button className={`level-card ${index === 0 ? 'selected' : ''}`} key={level}><strong>{level}</strong><small>{[1, 30, 50, 100, 500][index].toLocaleString()}k USDT max</small><span>{[1, 1.5, 3, 5, 10][index]}% target</span></button>)}</div><section className="panel"><div className="panel-heading"><div><h2>Verified opportunities</h2><p className="muted">Quotes expire quickly and are never guaranteed returns.</p></div><span className="tag">12 scanned</span></div><div className="opportunity"><div><strong>ETH / USDC → ETH / USDT</strong><p className="muted">Ethereum · Uniswap → Curve · expires in 42s</p></div><div className="opportunity-stats"><span><small>Net estimate</small><b className="positive">+0.84%</b></span><span><small>Confidence</small><b>High</b></span><button className="secondary-button">Review</button></div></div><div className="opportunity"><div><strong>BTC / USDT → BTC / USDC</strong><p className="muted">Multi-venue · updated 8s ago</p></div><div className="opportunity-stats"><span><small>Net estimate</small><b className="positive">+0.41%</b></span><span><small>Confidence</small><b>Medium</b></span><button className="secondary-button">Review</button></div></div></section></>;
}

function WalletTab({ wallet, onConnect }: { wallet: string; onConnect: () => void }) {
  return <><PageTitle eyebrow="Your assets" title="Wallet" text="Connect any supported wallet to view balances and transaction history." /><section className="wallet-hero panel"><div><p className="muted">Total portfolio value</p><div className="balance">{wallet ? '$24,892.40' : '—'}</div><span className="positive">{wallet ? '+$1,842.22 (8.24%)' : 'Wallet not connected'}</span></div>{wallet ? <div className="address-chip">◈ {wallet}</div> : <button className="primary-button" onClick={onConnect}>Connect wallet</button>}</section><section className="panel"><div className="panel-heading"><h2>Assets</h2><span className="muted">{wallet ? 'Synced with wallet' : 'Connect to load live balances'}</span></div><div className="asset-list"><Asset name="Bitcoin" symbol="BTC" amount={wallet ? '0.214' : '—'} value={wallet ? '$14,516.63' : '—'} /><Asset name="Ethereum" symbol="ETH" amount={wallet ? '1.82' : '—'} value={wallet ? '$6,957.97' : '—'} /><Asset name="USD Coin" symbol="USDC" amount={wallet ? '3,417.80' : '—'} value={wallet ? '$3,417.80' : '—'} /></div></section></>;
}

function SupportPanel({ onClose, wallet }: { onClose: () => void; wallet: string }) { return <div className="support-overlay" onClick={onClose}><section className="support-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><h2>Customer support</h2><p className="muted">Direct message · {wallet || 'Connect wallet'}</p></div><button className="icon-button" onClick={onClose}>×</button></div><div className="chat-message">Hi! How can we help today?<small>GlobalNetwork Support · now</small></div><textarea placeholder="Write a message…" /><button className="primary-button full" onClick={onClose}>Send message</button><p className="support-warning">Never share a private key or seed phrase with anyone.</p></section></div>; }
function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <div className="metric-card"><p className="muted">{label}</p><strong>{value}</strong><span className="positive">{change}</span></div>; }
function InfoCard({ title, text }: { title: string; text: string }) { return <article className="info-card"><span className="info-icon">✓</span><div><h3>{title}</h3><p className="muted">{text}</p></div></article>; }
function Asset({ name, symbol, amount, value }: { name: string; symbol: string; amount: string; value: string }) { return <div className="asset-row"><span className="coin-icon">{symbol[0]}</span><div><strong>{name}</strong><small>{symbol}</small></div><div className="asset-amount"><strong>{amount}</strong><small>{value}</small></div></div>; }
function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}<span className="accent">.</span></h1><p className="muted">{text}</p></div></div>; }
