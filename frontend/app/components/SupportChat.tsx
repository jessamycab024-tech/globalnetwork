'use client';

import { useEffect, useRef, useState } from 'react';
import type { SupportThread } from '@/lib/supportTypes';

type ChatData = { thread?: SupportThread | null; threads?: SupportThread[] };

function useChat(admin: boolean) {
  const endpoint = admin ? '/api/admin/support' : '/api/support';
  const [data, setData] = useState<ChatData>({});
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const version = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      const currentVersion = version.current;
      try {
        if (busy.current) return;
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to refresh chat. Retrying automatically.');
        const next = await response.json();
        if (!cancelled && currentVersion === version.current) {
          setData(next);
          setReady(true);
          setError('');
        }
      } catch (cause) {
        if (!cancelled && currentVersion === version.current) setError((cause as Error).message);
      } finally {
        if (!cancelled) timer = setTimeout(load, 3000);
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [endpoint]);

  async function send(payload: Record<string, string>) {
    if (busy.current) return false;
    busy.current = true;
    version.current += 1;
    setPending(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: admin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error || 'Unable to send. Please try again.');
      setData(next);
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { data, error, ready, pending, send };
}

function Messages({ thread }: { thread?: SupportThread | null }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [thread?.id, thread?.messages.length]);
  return <div className="chat-history" role="log" aria-label="Conversation messages" aria-live="polite">
    {!thread?.messages.length && <p className="muted">Send a message to start a conversation with customer service.</p>}
    {thread?.messages.map((message) => <div key={message.id} className={`chat-message ${message.sender}`}>
      <strong>{message.sender === 'admin' ? 'Customer service' : 'Customer'}</strong>
      <div className="chat-text">{message.text}</div>
      <small>{new Date(message.createdAt).toLocaleString()}</small>
    </div>)}
    <div ref={end} />
  </div>;
}

function Composer({ pending, disabled, onSend }: { pending: boolean; disabled: boolean; onSend: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  return <form onSubmit={async (event) => { event.preventDefault(); if (text.trim() && await onSend(text)) setText(''); }}>
    <label>Message<textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={3} required disabled={pending} placeholder="How can we help?" /></label>
    <button className="primary-button" disabled={disabled || pending || !text.trim()}>{pending ? 'Sending…' : 'Send message'}</button>
  </form>;
}

export default function CustomerService({ onClose }: { onClose: () => void }) {
  const { data, error, ready, pending, send } = useChat(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return <main className="customer-service">
    <section className="panel customer-service-panel" aria-labelledby="customer-service-title">
      <div className="panel-heading"><div><p className="eyebrow">GlobalNetwork support</p><h1 id="customer-service-title">Customer service</h1></div><button autoFocus className="secondary-button" onClick={onClose}>Back to app</button></div>
      <p className="muted">Chat with our support team here without leaving the app. Replies refresh automatically.</p>
      <p className="support-warning">Demo chat: messages expire after 7 days and reset on server restart. Never send passwords, private keys, seed phrases, or identity documents. This conversation is available only in this browser.</p>
      {error && <p className="alert" role="alert">{error}</p>}
      {!ready && <p role="status">Connecting to support…</p>}
      {data.thread && <p className="muted">Status: {data.thread.status}{data.thread.status === 'Resolved' && ' · Send a message to reopen.'}</p>}
      <Messages thread={data.thread} />
      <Composer pending={pending} disabled={!ready} onSend={(text) => send({ text })} />
    </section>
  </main>;
}

export function AdminSupportInbox() {
  const { data, error, ready, pending, send } = useChat(true);
  const [selectedId, setSelectedId] = useState('');
  const threads = data.threads ?? [];
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  return <section className="panel">
    <h2>Customer service live chat</h2>
    <p className="muted">All browser conversations, independent of the demo user selector. Refreshes every 3 seconds.</p>
    {error && <p className="alert" role="alert">{error}</p>}
    {!ready ? <p role="status">Loading conversations…</p> : !threads.length ? <p className="muted">No customer conversations yet.</p> : <>
      <label>Conversation<select value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} disabled={pending}>
        {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.status} · {thread.id.slice(0, 8)} · {thread.messages[thread.messages.length - 1]?.text.slice(0, 60)}</option>)}
      </select></label>
      {selected && <>
        <label>Status<select value={selected.status} disabled={pending} onChange={(event) => { void send({ action: 'status', id: selected.id, status: event.target.value }); }}>
          <option>Open</option><option>Pending</option><option>Resolved</option>
        </select></label>
        <Messages thread={selected} />
        <Composer key={selected.id} pending={pending} disabled={!ready} onSend={(text) => send({ action: 'reply', id: selected.id, text })} />
      </>}
    </>}
  </section>;
}
