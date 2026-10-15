import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, readSession } from '@/lib/adminSession';
import { appendSupportMessage, findAdminChat, listSupportThreads, validMessage } from '@/lib/supportStore';

export const dynamic = 'force-dynamic';

function isAdmin(request: NextRequest) {
  return Boolean(readSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)?.admin);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return NextResponse.json({ threads: listSupportThreads() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string') return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
  const chat = findAdminChat(body.id);
  if (!chat) return NextResponse.json({ error: 'Conversation not found or expired.' }, { status: 404 });
  if (body.action === 'reply') {
    if (!validMessage(body.text)) return NextResponse.json({ error: 'Enter a message of 1–2000 characters.' }, { status: 400 });
    if (chat.thread.messages.length >= 200) return NextResponse.json({ error: 'This conversation has reached its message limit.' }, { status: 409 });
    appendSupportMessage(chat, 'admin', body.text.trim());
  } else if (body.action === 'status' && ['Open', 'Pending', 'Resolved'].includes(body.status)) {
    chat.thread.status = body.status;
    chat.thread.updatedAt = new Date().toISOString();
  } else {
    return NextResponse.json({ error: 'Invalid support operation.' }, { status: 400 });
  }
  return NextResponse.json({ threads: listSupportThreads() }, { headers: { 'Cache-Control': 'no-store' } });
}
