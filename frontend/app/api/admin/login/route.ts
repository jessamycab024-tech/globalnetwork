import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS, safeEqualStrings, signSession } from '@/lib/adminSession';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

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

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminUsername || !adminPasswordHash) {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 500 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const suppliedUsername = typeof body.username === 'string' ? body.username : '';
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
