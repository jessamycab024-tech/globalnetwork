import { randomBytes, randomUUID } from 'node:crypto';
import type { SupportThread } from './supportTypes';

export const SUPPORT_COOKIE = 'support_session';
export const SUPPORT_TTL = 7 * 24 * 60 * 60;

type StoredThread = { token: string; thread: SupportThread; expiresAt: number; lastSentAt: number };
const globalSupport = globalThis as typeof globalThis & { supportChats?: Map<string, StoredThread> };
const chats = globalSupport.supportChats ??= new Map<string, StoredThread>();

function prune() {
  for (const [id, chat] of chats) {
    if (chat.expiresAt <= Date.now()) chats.delete(id);
  }
}

export function listSupportThreads() {
  prune();
  return Array.from(chats.values(), ({ thread }) => thread).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findCustomerChat(token?: string) {
  prune();
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
  return Array.from(chats.values()).find((chat) => chat.token === token);
}

export function findAdminChat(id: string) {
  prune();
  return chats.get(id);
}

export function createCustomerChat() {
  prune();
  if (chats.size >= 500) return undefined;
  const chat: StoredThread = {
    token: randomBytes(32).toString('hex'),
    expiresAt: Date.now() + SUPPORT_TTL * 1000,
    lastSentAt: 0,
    thread: { id: randomUUID(), status: 'Open', messages: [], updatedAt: new Date().toISOString() },
  };
  chats.set(chat.thread.id, chat);
  return chat;
}

export function appendSupportMessage(chat: StoredThread, sender: 'customer' | 'admin', text: string) {
  const createdAt = new Date().toISOString();
  chat.thread.messages.push({ id: randomUUID(), sender, text, createdAt });
  chat.thread.updatedAt = createdAt;
  chat.thread.status = sender === 'customer' ? 'Open' : 'Pending';
  if (sender === 'customer') chat.lastSentAt = Date.now();
}

export function validMessage(text: unknown): text is string {
  return typeof text === 'string' && text.trim().length > 0 && text.length <= 2000;
}
