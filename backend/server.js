import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';
const defaultUsername = 'admin';
const defaultPasswordHash = await argon2.hash('adminpass');
const defaultSessionSecret = 'development-admin-session-secret-32chars!!';
let username = process.env.ADMIN_USERNAME || defaultUsername;
let passwordHash = process.env.ADMIN_PASSWORD_HASH || defaultPasswordHash;
let sessionSecret = process.env.ADMIN_SESSION_SECRET || defaultSessionSecret;
const appOrigin = process.env.APP_ORIGIN || `http://localhost:${port}`;
const dataFile = process.env.ADMIN_DATA_FILE || path.join(process.cwd(), 'data', 'admin-operations.json');

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
  if (isProduction) {
    throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and a 32+ character ADMIN_SESSION_SECRET are required.');
  }
  console.warn('Missing admin environment configuration; using local development defaults for the admin backend.');
}

if (!sessionSecret || sessionSecret.length < 32) {
  sessionSecret = defaultSessionSecret;
}

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

const users = [
  { id: 'USR-1001', name: 'Jessamy Cabral', email: 'jessamy@globalnetwork.io', role: 'Verified user' },
  { id: 'USR-1002', name: 'Ava Romero', email: 'ava@globalnetwork.io', role: 'Verified user' },
  { id: 'USR-1003', name: 'Noah Chen', email: 'noah@globalnetwork.io', role: 'Review user' },
];

const defaultState = {
  kyc: [
    { id: 1, userId: 'USR-1001', user: 'Jessamy Cabral', email: 'jessamy@globalnetwork.io', risk: 'Low', status: 'Pending', notes: 'Government ID review in progress.' },
    { id: 2, userId: 'USR-1002', user: 'Ava Romero', email: 'ava@globalnetwork.io', risk: 'Medium', status: 'Approved', notes: 'Sanctions review cleared.' },
    { id: 3, userId: 'USR-1003', user: 'Noah Chen', email: 'noah@globalnetwork.io', risk: 'High', status: 'Rejected', notes: 'Document mismatch on residency proof.' },
  ],
  support: [
    { id: 1, userId: 'USR-1001', user: 'Jessamy Cabral', priority: 'High', status: 'Open', preview: 'Wallet access is blocked after a balance refresh.' },
    { id: 2, userId: 'USR-1002', user: 'Ava Romero', priority: 'Medium', status: 'Pending', preview: 'Request for trade validation details on BTC/USDT.' },
    { id: 3, userId: 'USR-1003', user: 'Noah Chen', priority: 'Low', status: 'Resolved', preview: 'KYC update confirmed and approval email sent.' },
  ],
  trades: [
    { id: 'TR-1048', userId: 'USR-1001', user: 'Jessamy Cabral', pair: 'BTC/USDT', side: 'Buy', amount: '1.42 BTC', status: 'Executed' },
    { id: 'TR-1049', userId: 'USR-1002', user: 'Ava Romero', pair: 'ETH/USDC', side: 'Sell', amount: '8.4 ETH', status: 'Queued' },
    { id: 'TR-1050', userId: 'USR-1003', user: 'Noah Chen', pair: 'SOL/USDC', side: 'Buy', amount: '245 SOL', status: 'Failed' },
  ],
  wallets: [
    { id: 1, userId: 'USR-1001', user: 'Jessamy Cabral', wallet: '0x9F4a...7C2B', network: 'Ethereum', points: 2400, status: 'Active' },
    { id: 2, userId: 'USR-1002', user: 'Ava Romero', wallet: '0x8A2d...1afD', network: 'Polygon', points: 1840, status: 'Review' },
    { id: 3, userId: 'USR-1003', user: 'Noah Chen', wallet: '0x4C1e...2DfA', network: 'BNB', points: 960, status: 'Active' },
  ],
  arbitrage: [
    { id: 'ARB-901', userId: 'USR-1001', user: 'Jessamy Cabral', level: 'Level 2', cycle: '3 days', result: 'Profitable', profit: '+1.8%', status: 'Settled' },
    { id: 'ARB-902', userId: 'USR-1002', user: 'Ava Romero', level: 'Level 1', cycle: '2 days', result: 'Pending', profit: '+0.9%', status: 'Open' },
    { id: 'ARB-903', userId: 'USR-1003', user: 'Noah Chen', level: 'Level 3', cycle: '5 days', result: 'Closed', profit: '-0.2%', status: 'Rejected' },
  ],
  markets: [
    { pair: 'BTC/USDT', price: 64280.12, change: 1.24 },
    { pair: 'ETH/USDC', price: 3188.45, change: -0.32 },
    { pair: 'SOL/USDC', price: 147.82, change: 2.08 },
  ],
  updatedAt: new Date().toISOString(),
};

let state = await loadState();

async function loadState() {
  try {
    const file = await fs.readFile(dataFile, 'utf8');
    const parsed = JSON.parse(file);
    return { ...defaultState, ...parsed, updatedAt: parsed.updatedAt || new Date().toISOString() };
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Unable to read admin data file: ${error.message}`);
    await saveState(defaultState);
    return structuredClone(defaultState);
  }
}

async function saveState(nextState = state) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(nextState, null, 2)}\n`);
}

async function touchState({ persist = false } = {}) {
  state.updatedAt = new Date().toISOString();
  if (persist) await saveState();
}

function tickMarkets() {
  state.markets = state.markets.map((market) => ({
    ...market,
    price: Number(Math.max(0.01, market.price * (1 + (Math.random() - 0.5) / 1000)).toFixed(2)),
    change: Number((market.change + (Math.random() - 0.5) / 10).toFixed(2)),
  }));
  touchState();
}

setInterval(tickMarkets, 5000).unref();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again later.',
});

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signSession(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function readSession(value) {
  if (!value) return null;
  const [body, signature] = value.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const session = readSession(req.cookies.admin_session);
  if (!session?.admin) return res.status(401).json({ error: 'Authentication required.' });
  req.admin = session;
  next();
}

function operationsSnapshot() {
  return {
    serverTime: new Date().toISOString(),
    updatedAt: state.updatedAt,
    users,
    kyc: state.kyc,
    support: state.support,
    trades: state.trades,
    wallets: state.wallets,
    arbitrage: state.arbitrage,
    markets: state.markets,
  };
}

function updateById(collection, id, updater) {
  let found = false;
  state[collection] = state[collection].map((item) => {
    if (String(item.id) !== String(id)) return item;
    found = true;
    return updater(item);
  });
  return found;
}

function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#070d18;color:#edf4ff;font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:min(420px,calc(100% - 40px));background:#101a2a;border:1px solid #263750;border-radius:16px;padding:32px;box-sizing:border-box}label{display:block;margin:16px 0 6px;color:#9aabc3}input{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #344862;background:#162338;color:#fff}button{margin-top:20px;padding:12px 16px;border:0;border-radius:8px;background:linear-gradient(135deg,#5edcff,#8eafff);font-weight:700;cursor:pointer}.error{color:#ff9ca9;margin-top:16px}</style></head><body><main class="card">${content}</main></body></html>`;
}

app.get('/admin', (req, res) => {
  const session = readSession(req.cookies.admin_session);
  if (session?.admin) return res.redirect('/admin/dashboard');
  res.send(page('Admin sign in', `<h1>GlobalNetwork Admin</h1><p>Restricted server-side access.</p><form method="post" action="/admin/login"><label for="username">Username</label><input id="username" name="username" autocomplete="username" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Sign in</button></form>`));
});

app.post('/admin/login', loginLimiter, async (req, res) => {
  const suppliedUsername = typeof req.body.username === 'string' ? req.body.username : '';
  const suppliedPassword = typeof req.body.password === 'string' ? req.body.password : '';
  const validUsername = safeEqual(suppliedUsername, username);
  const validPassword = suppliedPassword.length > 0 && await argon2.verify(passwordHash, suppliedPassword).catch(() => false);
  if (!validUsername || !validPassword) return res.status(401).send(page('Sign in failed', '<h1>Sign in failed</h1><p class="error">Invalid username or password.</p><p><a href="/admin">Try again</a></p>'));
  res.cookie('admin_session', signSession({ admin: true, username }), { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
  return res.redirect('/admin/dashboard');
});

app.post('/admin/logout', requireAdmin, (req, res) => { res.clearCookie('admin_session', { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' }); res.redirect('/admin'); });
app.get('/admin/dashboard', requireAdmin, (req, res) => res.send(page('Admin dashboard', `<h1>Admin dashboard</h1><p>Signed in as ${req.admin.username}.</p><p>Connect audited user, KYC, points, and support services here.</p><form method="post" action="/admin/logout"><button type="submit">Sign out</button></form>`)));
app.get('/api/admin/operations', requireAdmin, (req, res) => res.json(operationsSnapshot()));
app.patch('/api/admin/operations', requireAdmin, async (req, res) => {
  const { action, id, userId, status, amount, operation } = req.body || {};

  if (action === 'kyc-status') {
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid KYC status.' });
    if (!updateById('kyc', id, (item) => ({ ...item, status }))) return res.status(404).json({ error: 'KYC case not found.' });
    await touchState({ persist: true });
    return res.json(operationsSnapshot());
  }

  if (action === 'trade-status') {
    if (!['Queued', 'Executed', 'Failed', 'Win', 'Lose'].includes(status)) return res.status(400).json({ error: 'Invalid trade status.' });
    if (!updateById('trades', id, (item) => ({ ...item, status }))) return res.status(404).json({ error: 'Trade not found.' });
    await touchState({ persist: true });
    return res.json(operationsSnapshot());
  }

  if (action === 'wallet-points') {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta <= 0) return res.status(400).json({ error: 'Point amount must be greater than zero.' });
    if (!['add', 'deduct'].includes(operation)) return res.status(400).json({ error: 'Invalid point operation.' });
    let found = false;
    state.wallets = state.wallets.map((wallet) => {
      if (wallet.userId !== userId) return wallet;
      found = true;
      return { ...wallet, points: Math.max(0, wallet.points + (operation === 'add' ? delta : -delta)) };
    });
    if (!found) return res.status(404).json({ error: 'Wallet not found.' });
    await touchState({ persist: true });
    return res.json(operationsSnapshot());
  }

  if (action === 'support-status') {
    if (!['Open', 'Pending', 'Resolved'].includes(status)) return res.status(400).json({ error: 'Invalid support status.' });
    if (!updateById('support', id, (item) => ({ ...item, status }))) return res.status(404).json({ error: 'Support thread not found.' });
    await touchState({ persist: true });
    return res.json(operationsSnapshot());
  }

  return res.status(400).json({ error: 'Unsupported admin operation.' });
});
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`Admin backend listening on http://localhost:${port} for ${appOrigin}`));
