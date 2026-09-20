'use client';

import { useEffect, useMemo, useState } from 'react';

type Tab = 'home' | 'trade' | 'arbitrage' | 'wallet';
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
type Coin = { id: string; symbol: string; name: string; current_price: number | null; price_change_percentage_24h: number | null; market_cap_rank?: number; image?: string };

declare global { interface Window { ethereum?: EthereumProvider } }

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' }, { id: 'trade', label: 'Trade', icon: '↔' },
  { id: 'arbitrage', label: 'AI Arbitrage', icon: '✦' }, { id: 'wallet', label: 'Wallet', icon: '◈' },
];

const fallbackCoins: Coin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: null, price_change_percentage_24h: null },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: null, price_change_percentage_24h: null },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: null, price_change_percentage_24h: null },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: null, price_change_percentage_24h: null },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: null, price_change_percentage_24h: null },
  { id: 'usd-coin', symbol: 'usdc', name: 'USDC', current_price: null, price_change_percentage_24h: null },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [wallet, setWallet] = useState('');
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [walletError, setWalletError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coins, setCoins] = useState<Coin[]>(fallbackCoins);
  const [coinSearch, setCoinSearch] = useState('');
  const [dataStatus, setDataStatus] = useState('Loading live data');

  const shortWallet = useMemo(() => wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '', [wallet]);
  const filteredCoins = useMemo(() => coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(coinSearch.toLowerCase())), [coins, coinSearch]);

  useEffect(() => {
    let cancelled = false;
    async function loadMarkets() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false', { cache: 'no-store' });
        if (!response.ok) throw new Error('Market provider unavailable');
        const liveCoins = (await response.json()) as Coin[];
        if (!cancelled && liveCoins.length) { setCoins(liveCoins); setDataStatus(`Live · ${new Date().toLocaleTimeString()}`); }
      } catch { if (!cancelled) setDataStatus('Live provider unavailable'); }
    }
    loadMarkets();
    const interval = window.setInterval(loadMarkets, 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  async function connectWallet() {
    setWalletError('');
    if (!window.ethereum) { setWalletError('No browser wallet detected. Install a supported wallet to continue.'); return; }
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts?.[0];
      if (!address) return;
      setWallet(address);
      const rawBalance = (await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] })) as string;
      const wei = BigInt(rawBalance);
      const whole = wei / 1000000000000000000n;
      const fraction = (wei % 1000000000000000000n).toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '');
      setNativeBalance(`${whole}${fraction ? `.${fraction}` : ''} ETH`);
    } catch { setWalletError('Wallet connection was cancelled, rejected, or balance access failed.'); }
  }

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setActiveTab('home')} aria-label="Go to home"><span className="brand-mark">G</span><span>GlobalNetwork</span></button><div className="topbar-actions"><span className="live-indicator"><i /> {dataStatus}</span><a className="admin-link" href="/admin">Admin portal</a><button className="wallet-button" onClick={connectWallet}>{shortWallet || 'Connect wallet'}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">☰</button></div></header>
    {menuOpen && <aside className="account-menu"><div className="menu-title">Account & trust</div>{['KYC Register', 'User ID / Profile', 'About Us', 'Trust & Security', 'Office: New York, USA'].map((item) => <button key={item} onClick={() => setMenuOpen(false)}>{item}</button>)}</aside>}
    <div className="layout"><nav className="sidebar" aria-label="Main navigation"><div className="nav-label">Workspace</div>{navItems.map((item) => <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}<div className="sidebar-spacer" /><div className="security-note"><span>✓</span><div><strong>Non-custodial</strong><small>You control your keys</small></div></div></nav>
      <section className="content">{walletError && <div className="alert">{walletError}</div>}{activeTab === 'home' && <HomeTab wallet={shortWallet} nativeBalance={nativeBalance} coins={filteredCoins} search={coinSearch} setSearch={setCoinSearch} status={dataStatus} onConnect={connectWallet} />}{activeTab === 'trade' && <TradeTab />}{activeTab === 'arbitrage' && <ArbitrageTab />}{activeTab === 'wallet' && <WalletTab wallet={shortWallet} nativeBalance={nativeBalance} onConnect={connectWallet} />}</section></div>
    <button className="support-fab" onClick={() => setSupportOpen(true)} aria-label="Open customer support">✦ <span>Support</span></button>{supportOpen && <SupportPanel onClose={() => setSupportOpen(false)} wallet={shortWallet} />}
  </main>;
}

function HomeTab({ wallet, nativeBalance, coins, search, setSearch, status, onConnect }: { wallet: string; nativeBalance: string | null; coins: Coin[]; search: string; setSearch: (value: string) => void; status: string; onConnect: () => void }) {
  return <><div className="page-heading"><div><p className="eyebrow">Market overview · {status}</p><h1>Market overview<span className="accent">.</span></h1><p className="muted">Live cryptocurrency prices and your verified wallet balance.</p></div><button className="primary-button" onClick={onConnect}>{wallet || 'Connect wallet'}</button></div>
    <div className="metric-grid"><Metric label="Connected wallet" value={wallet || 'Not connected'} change={nativeBalance || '—'} /><Metric label="Tracked coins" value={`${coins.length}`} change="Live market data" /><Metric label="Data status" value={status.startsWith('Live') ? 'Live' : 'Unavailable'} change="Provider timestamp shown" /></div>
    <section className="panel"><div className="panel-heading"><div><h2>All crypto markets</h2><p className="muted">Live prices from the market-data provider. Values are not fabricated.</p></div><span className="fresh-badge">● {status.startsWith('Live') ? 'Fresh' : 'Stale'}</span></div><input aria-label="Search crypto coins" placeholder="Search all crypto coins…" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="table-wrap"><table><thead><tr><th>#</th><th>Coin</th><th>Price</th><th>24h change</th><th>Market cap rank</th></tr></thead><tbody>{coins.map((coin, index) => <tr key={coin.id}><td>{coin.market_cap_rank || index + 1}</td><td className="strong">{coin.name} <small className="muted">{coin.symbol.toUpperCase()}</small></td><td>{coin.current_price == null ? 'Unavailable' : `$${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 8 })}`}</td><td className={coin.price_change_percentage_24h == null ? '' : coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>{coin.price_change_percentage_24h == null ? 'Unavailable' : `${coin.price_change_percentage_24h.toFixed(2)}%`}</td><td>{coin.market_cap_rank || '—'}</td></tr>)}</tbody></table></div></section>
    <div className="info-grid"><InfoCard title="Real wallet data" text={wallet ? `Connected ${wallet}. The displayed balance is read from the wallet provider.` : 'Connect your wallet to read your current on-chain balance.'} /><InfoCard title="Live provider data" text="Market values are refreshed periodically and marked unavailable when the provider cannot be reached." /></div></>;
}

function TradeTab() { return <><PageTitle eyebrow="Execution workspace" title="Trade with clarity" text="Review every quote, fee, and risk before signing from your wallet." /><div className="two-column"><section className="panel"><div className="panel-heading"><h2>New trade</h2><span className="tag">Testnet safe</span></div><label>Trading pair<select><option>BTC / USDT</option><option>ETH / USDT</option><option>SOL / USDT</option></select></label><div className="segmented"><button className="selected">Buy</button><button>Sell</button></div><label>Amount<input placeholder="0.00 USDT" inputMode="decimal" /></label><label>Strategy level<select><option>Level 1 · 60 seconds</option><option>Level 2 · 120 seconds</option><option>Level 3 · 180 seconds</option><option>Level 4 · 360 seconds</option><option>Level 5 · 720 seconds</option></select></label><button className="primary-button full">Review transaction</button></section><section className="panel chart-panel"><div className="panel-heading"><h2>Live chart</h2><span className="tag">Provider required</span></div><div className="chart-placeholder"><span>Connect a live chart provider to display candles</span></div></section></div></>; }
function ArbitrageTab() { return <><PageTitle eyebrow="Decision support" title="AI Arbitrage" text="Find venue spreads with transparent estimates. Every execution requires fresh quotes and your approval." /><div className="level-row">{['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'].map((level, index) => <button className={`level-card ${index === 0 ? 'selected' : ''}`} key={level}><strong>{level}</strong><small>{[1, 30, 50, 100, 500][index].toLocaleString()}k USDT max</small><span>{[1, 1.5, 3, 5, 10][index]}% target</span></button>)}</div><section className="panel"><div className="panel-heading"><div><h2>Verified opportunities</h2><p className="muted">Live venue quotes are required before an opportunity can be executed.</p></div><span className="tag">Awaiting provider</span></div><p className="muted">No executable opportunity is displayed until fresh market and liquidity data is available.</p></section></>; }
function WalletTab({ wallet, nativeBalance, onConnect }: { wallet: string; nativeBalance: string | null; onConnect: () => void }) { return <><PageTitle eyebrow="Your assets" title="Wallet" text="Connect any supported wallet to view on-chain balances and transactions." /><section className="wallet-hero panel"><div><p className="muted">Verified native balance</p><div className="balance">{nativeBalance || '—'}</div><span className="positive">{wallet ? 'Read from connected wallet' : 'Wallet not connected'}</span></div>{wallet ? <div className="address-chip">◈ {wallet}</div> : <button className="primary-button" onClick={onConnect}>Connect wallet</button>}</section><section className="panel"><div className="panel-heading"><h2>Token balances</h2><span className="muted">Requires chain indexer for ERC-20 assets</span></div><p className="muted">No token amount is shown until a supported indexer returns verified wallet data. This prevents placeholder amounts from being mistaken for real funds.</p></section></>; }
function SupportPanel({ onClose, wallet }: { onClose: () => void; wallet: string }) { return <div className="support-overlay" onClick={onClose}><section className="support-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><h2>Customer support</h2><p className="muted">Direct message · {wallet || 'Connect wallet'}</p></div><button className="icon-button" onClick={onClose}>×</button></div><div className="chat-message">Hi! How can we help today?<small>GlobalNetwork Support · now</small></div><textarea placeholder="Write a message…" /><button className="primary-button full" onClick={onClose}>Send message</button><p className="support-warning">Never share a private key or seed phrase with anyone.</p></section></div>; }
function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <div className="metric-card"><p className="muted">{label}</p><strong>{value}</strong><span className="positive">{change}</span></div>; }
function InfoCard({ title, text }: { title: string; text: string }) { return <article className="info-card"><span className="info-icon">✓</span><div><h3>{title}</h3><p className="muted">{text}</p></div></article>; }
function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}<span className="accent">.</span></h1><p className="muted">{text}</p></div></div>; }
