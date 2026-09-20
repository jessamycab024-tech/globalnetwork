'use client';

import { useEffect, useMemo, useState } from 'react';

type Tab = 'home' | 'trade' | 'arbitrage' | 'wallet';
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
type Coin = { id: string; symbol: string; name: string; current_price: number | null; price_change_percentage_24h: number | null; market_cap_rank?: number };
type Candle = [number, number, number, number, number];

declare global { interface Window { ethereum?: EthereumProvider } }

const ADMIN_BACKEND_URL = 'https://www.cryptotrade.agency/admin';
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
        if (!response.ok) throw new Error();
        const liveCoins = (await response.json()) as Coin[];
        if (!cancelled && liveCoins.length) { setCoins(liveCoins); setDataStatus(`Live · ${new Date().toLocaleTimeString()}`); }
      } catch { if (!cancelled) setDataStatus('Live provider unavailable'); }
    }
    loadMarkets(); const interval = window.setInterval(loadMarkets, 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  async function connectWallet() {
    setWalletError('');
    if (!window.ethereum) { setWalletError('No browser wallet detected. Install a supported wallet to continue.'); return; }
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts?.[0]; if (!address) return; setWallet(address);
      const rawBalance = (await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] })) as string;
      const wei = BigInt(rawBalance); const base = BigInt('1000000000000000000'); const whole = wei / base;
      const fraction = (wei % base).toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '');
      setNativeBalance(`${whole}${fraction ? `.${fraction}` : ''} ETH`);
    } catch { setWalletError('Wallet connection was cancelled, rejected, or balance access failed.'); }
  }

  return <main className="app-shell"><header className="topbar"><button className="brand" onClick={() => setActiveTab('home')} aria-label="Go to home"><span className="brand-mark">G</span><span>GlobalNetwork</span></button><div className="topbar-actions"><span className="live-indicator"><i /> {dataStatus}</span><button className="wallet-button" onClick={connectWallet}>{shortWallet || 'Connect wallet'}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">☰</button></div></header>
    {menuOpen && <aside className="account-menu"><div className="menu-title">Account & trust</div>{['KYC Register', 'User ID / Profile', 'About Us', 'Trust & Security', 'Office: New York, USA'].map((item) => <button key={item} onClick={() => setMenuOpen(false)}>{item}</button>)}</aside>}
    <div className="layout"><nav className="sidebar"><div className="nav-label">Workspace</div>{navItems.map((item) => <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}<div className="sidebar-spacer" /><div className="security-note"><span>✓</span><div><strong>Non-custodial</strong><small>You control your keys</small></div></div></nav><section className="content">{walletError && <div className="alert">{walletError}</div>}{activeTab === 'home' && <HomeTab wallet={shortWallet} nativeBalance={nativeBalance} coins={filteredCoins} search={coinSearch} setSearch={setCoinSearch} status={dataStatus} onConnect={connectWallet} />}{activeTab === 'trade' && <TradeTab />}{activeTab === 'arbitrage' && <ArbitrageTab />}{activeTab === 'wallet' && <WalletTab wallet={shortWallet} nativeBalance={nativeBalance} onConnect={connectWallet} />}</section></div><button className="support-fab" onClick={() => window.open(ADMIN_BACKEND_URL, '_blank', 'noopener,noreferrer')} aria-label="Open customer support">✦ <span>Support</span></button></main>;
}

function HomeTab({ wallet, nativeBalance, coins, search, setSearch, status, onConnect }: { wallet: string; nativeBalance: string | null; coins: Coin[]; search: string; setSearch: (value: string) => void; status: string; onConnect: () => void }) { return <><PageTitle eyebrow={`Market overview · ${status}`} title="Market overview" text="Live cryptocurrency prices and your verified wallet balance." /><button className="primary-button" onClick={onConnect}>{wallet || 'Connect wallet'}</button><div className="metric-grid"><Metric label="Connected wallet" value={wallet || 'Not connected'} change={nativeBalance || '—'} /><Metric label="Tracked coins" value={`${coins.length}`} change="Live market data" /><Metric label="Data status" value={status.startsWith('Live') ? 'Live' : 'Unavailable'} change="Provider timestamp shown" /></div><section className="panel"><div className="panel-heading"><div><h2>All crypto markets</h2><p className="muted">Live prices from the market-data provider.</p></div><span className="fresh-badge">● {status.startsWith('Live') ? 'Fresh' : 'Stale'}</span></div><input aria-label="Search crypto coins" placeholder="Search all crypto coins…" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="table-wrap"><table><thead><tr><th>#</th><th>Coin</th><th>Price</th><th>24h change</th><th>Rank</th></tr></thead><tbody>{coins.map((coin, index) => <tr key={coin.id}><td>{coin.market_cap_rank || index + 1}</td><td className="strong">{coin.name} <small className="muted">{coin.symbol.toUpperCase()}</small></td><td>{coin.current_price == null ? 'Unavailable' : `$${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 8 })}`}</td><td className={coin.price_change_percentage_24h == null ? '' : coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>{coin.price_change_percentage_24h == null ? 'Unavailable' : `${coin.price_change_percentage_24h.toFixed(2)}%`}</td><td>{coin.market_cap_rank || '—'}</td></tr>)}</tbody></table></div></section></>; }

function TradeTab() { const [pair, setPair] = useState('bitcoin'); const [candles, setCandles] = useState<Candle[]>([]); const [status, setStatus] = useState('Loading live candles'); const label = pair === 'ethereum' ? 'ETH / USDT' : pair === 'solana' ? 'SOL / USDT' : 'BTC / USDT';
  useEffect(() => { let cancelled = false; async function load() { setStatus('Loading live candles'); try { const response = await fetch(`https://api.coingecko.com/api/v3/coins/${pair}/ohlc?vs_currency=usd&days=1`, { cache: 'no-store' }); if (!response.ok) throw new Error(); const data = (await response.json()) as Candle[]; if (!cancelled) { setCandles(data); setStatus(`Live · ${new Date().toLocaleTimeString()}`); } } catch { if (!cancelled) { setCandles([]); setStatus('Live candle data unavailable'); } } } load(); const interval = window.setInterval(load, 60_000); return () => { cancelled = true; window.clearInterval(interval); }; }, [pair]);
  return <><PageTitle eyebrow="Execution workspace" title="Trade with clarity" text="Review every quote, fee, and risk before signing from your wallet." /><div className="two-column"><section className="panel"><div className="panel-heading"><h2>New trade</h2><span className="tag">Testnet safe</span></div><label>Trading pair<select value={pair} onChange={(event) => setPair(event.target.value)}><option value="bitcoin">BTC / USDT</option><option value="ethereum">ETH / USDT</option><option value="solana">SOL / USDT</option></select></label><div className="segmented"><button className="selected">Buy</button><button>Sell</button></div><label>Amount<input placeholder="0.00 USDT" inputMode="decimal" /></label><label>Strategy level<select><option>Level 1 · 60 seconds</option><option>Level 2 · 120 seconds</option><option>Level 3 · 180 seconds</option></select></label><button className="primary-button full">Review transaction</button></section><section className="panel chart-panel"><div className="panel-heading"><div><h2>{label}</h2><p className="muted">{status}</p></div><span className="tag">1 day · OHLC</span></div><CandleChart candles={candles} /></section></div></>; }

function CandleChart({ candles }: { candles: Candle[] }) { if (candles.length < 2) return <div className="chart-placeholder"><span>Waiting for verified live candle data…</span></div>; const visible = candles.slice(-48); const values = visible.flatMap((c) => [c[2], c[3]]); const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1; const y = (price: number) => 100 - ((price - min) / range) * 88 - 6; const width = 100 / visible.length; return <div className="candle-chart" aria-label="Live OHLC candlestick chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">{visible.map((candle, index) => { const [time, open, high, low, close] = candle; const x = index * width + width / 2; const top = Math.min(y(open), y(close)); const height = Math.max(Math.abs(y(open) - y(close)), 1.2); const bullish = close >= open; return <g key={time} className={bullish ? 'candle bullish' : 'candle bearish'}><line x1={x} x2={x} y1={y(high)} y2={y(low)} /><rect x={x - width * .28} y={top} width={width * .56} height={height} /></g>; })}</svg><div className="chart-axis"><span>${max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span>${min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div><small>Source: CoinGecko OHLC · last 24 hours · refreshed every 60s</small></div>; }

function ArbitrageTab() { return <><PageTitle eyebrow="Decision support" title="AI Arbitrage" text="Find venue spreads with transparent estimates. Every execution requires fresh quotes and your approval." /><section className="panel"><h2>Verified opportunities</h2><p className="muted">Live venue quotes are required before an opportunity can be executed.</p></section></>; }
function WalletTab({ wallet, nativeBalance, onConnect }: { wallet: string; nativeBalance: string | null; onConnect: () => void }) { return <><PageTitle eyebrow="Your assets" title="Wallet" text="Connect any supported wallet to view on-chain balances and transactions." /><section className="wallet-hero panel"><div><p className="muted">Verified native balance</p><div className="balance">{nativeBalance || '—'}</div><span className="positive">{wallet ? 'Read from connected wallet' : 'Wallet not connected'}</span></div>{wallet ? <div className="address-chip">◈ {wallet}</div> : <button className="primary-button" onClick={onConnect}>Connect wallet</button>}</section></>; }
function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <div className="metric-card"><p className="muted">{label}</p><strong>{value}</strong><span className="positive">{change}</span></div>; }
function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}<span className="accent">.</span></h1><p className="muted">{text}</p></div></div>; }
