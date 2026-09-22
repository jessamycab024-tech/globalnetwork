import crypto from 'node:crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signSession(payload: { admin: true; username: string }): string {
  const secret = getSecret();
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function readSession(value: string | undefined | null): { admin: true; username: string } | null {
  if (!value) return null;
  const secret = getSecret();
  const [body, signature] = value.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof session.exp !== 'number' || session.exp <= Date.now()) return null;
    return { admin: true, username: session.username };
  } catch {
    return null;
  }
}

export function safeEqualStrings(left: string, right: string): boolean {
  return safeEqual(left, right);
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
export const ADMIN_SESSION_TTL_MS = SESSION_TTL_MS;
