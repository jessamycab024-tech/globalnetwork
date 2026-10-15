import { NextRequest, NextResponse } from 'next/server';
import { appendSupportMessage, createCustomerChat, findCustomerChat, SUPPORT_COOKIE, validMessage } from '@/lib/supportStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const chat = findCustomerChat(request.cookies.get(SUPPORT_COOKIE)?.value);
  return NextResponse.json({ thread: chat?.thread ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') && request.headers.get('origin') !== `${request.nextUrl.protocol}//${request.headers.get('host')}`) {
    return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!validMessage(body?.text)) return NextResponse.json({ error: 'Enter a message of 1–2000 characters.' }, { status: 400 });
  let chat = findCustomerChat(request.cookies.get(SUPPORT_COOKIE)?.value);
  if (chat && Date.now() - chat.lastSentAt < 2000) return NextResponse.json({ error: 'Please wait a moment before sending again.' }, { status: 429 });
  if (chat && chat.thread.messages.length >= 200) return NextResponse.json({ error: 'This conversation has reached its message limit.' }, { status: 409 });
  chat ??= createCustomerChat();
  if (!chat) return NextResponse.json({ error: 'Support is at capacity. Please try again later.' }, { status: 503 });
  appendSupportMessage(chat, 'customer', body.text.trim());
  const response = NextResponse.json({ thread: chat.thread }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(SUPPORT_COOKIE, chat.token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/',
    maxAge: Math.max(0, Math.floor((chat.expiresAt - Date.now()) / 1000)),
  });
  return response;
}
