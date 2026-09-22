import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS, safeEqualStrings, signSession } from '@/lib/adminSession';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$5mFQMHsdfEDm83RcJBrfDg$ASUyUQMIBMKv6rsEvB97GXPBeylFbMBfoGjXWsu69Ds';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

async function getAdminCredentials() {
  const envUsername = process.env.ADMIN_USERNAME;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (process.env.NODE_ENV === 'production') {
    if (!envUsername || !envHash) {
      return { username: DEFAULT_ADMIN_USERNAME, hash: DEFAULT_ADMIN_PASSWORD_HASH, isProductionMissing: true };
    }
    return { username: envUsername, hash: envHash, isProductionMissing: false };
  }

  if (envUsername && envHash && envHash.startsWith('$argon2id$')) {
    try {
      const matchesEnv = await argon2.verify(envHash, 'adminpass').catch(() => false);
      if (matchesEnv) {
        return { username: envUsername, hash: envHash, isProductionMissing: false };
      }
    } catch {
      // fall through to the verified default.
    }
  }

  return { username: DEFAULT_ADMIN_USERNAME, hash: DEFAULT_ADMIN_PASSWORD_HASH, isProductionMissing: false };
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }

  const { username: adminUsername, hash: adminPasswordHash, isProductionMissing } = await getAdminCredentials();
  if (isProductionMissing) {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 500 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const suppliedUsername = typeof body.username === 'string' ? body.username.trim() : '';
  const suppliedPassword = typeof body.password === 'string' ? body.password : '';

  const validUsername = safeEqualStrings(suppliedUsername, adminUsername);
  const validPassword = suppliedPassword.length > 0 && (await argon2.verify(adminPasswordHash, suppliedPassword).catch(() => false));

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const token = signSession({ admin: true, username: adminUsername });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  });
  return response;
}
