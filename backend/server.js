import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const username = process.env.ADMIN_USERNAME;
const passwordHash = process.env.ADMIN_PASSWORD_HASH;
const sessionSecret = process.env.ADMIN_SESSION_SECRET;
const appOrigin = process.env.APP_ORIGIN || `http://localhost:${port}`;

if (!username || !passwordHash || !sessionSecret || sessionSecret.length < 32) {
  throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and a 32+ character ADMIN_SESSION_SECRET are required.');
}

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

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
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`Admin backend listening on ${appOrigin}`));
