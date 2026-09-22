import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, readSession } from '@/lib/adminSession';

export async function GET(request: NextRequest) {
  const session = readSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: session.username });
}
