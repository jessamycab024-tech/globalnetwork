import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE, readSession } from '@/lib/adminSession';

type User = { id: string; name: string; email: string; role: string };
type KycItem = { id: number; userId: string; user: string; email: string; risk: string; status: string; notes: string };
type SupportItem = { id: number; userId: string; user: string; priority: string; status: string; preview: string };
type TradeItem = { id: string; userId: string; user: string; pair: string; side: string; amount: string; status: string };
type WalletItem = { id: number; userId: string; user: string; wallet: string; network: string; points: number; status: string };
type ArbitrageItem = { id: string; userId: string; user: string; level: string; cycle: string; result: string; profit: string; status: string };
type MarketItem = { pair: string; price: number; change: number };
type OperationsState = {
  users: User[];
  kyc: KycItem[];
  support: SupportItem[];
  trades: TradeItem[];
  wallets: WalletItem[];
  arbitrage: ArbitrageItem[];
  markets: MarketItem[];
  updatedAt: string;
};

const globalOperations = globalThis as typeof globalThis & { adminOperationsState?: OperationsState };
const state = globalOperations.adminOperationsState ??= {
  users: [
    { id: 'USR-1001', name: 'Jessamy Cabral', email: 'jessamy@globalnetwork.io', role: 'Verified user' },
    { id: 'USR-1002', name: 'Ava Romero', email: 'ava@globalnetwork.io', role: 'Verified user' },
    { id: 'USR-1003', name: 'Noah Chen', email: 'noah@globalnetwork.io', role: 'Review user' },
  ],
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

function isAdmin(request: NextRequest) {
  return Boolean(readSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)?.admin);
}

function snapshot() {
  return { serverTime: new Date().toISOString(), ...state };
}

function updateById<K extends 'kyc' | 'support' | 'trades'>(
  collection: K,
  id: string | number,
  updater: (item: OperationsState[K][number]) => OperationsState[K][number],
) {
  let found = false;
  state[collection] = state[collection].map((item) => {
    if (String(item.id) !== String(id)) return item;
    found = true;
    return updater(item);
  }) as OperationsState[K];
  return found;
}

function saveUpdate() {
  state.updatedAt = new Date().toISOString();
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return NextResponse.json(snapshot());
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { action, id, userId, status, amount, operation } = body;

  if (action === 'kyc-status') {
    if (!['Approved', 'Rejected'].includes(String(status))) return NextResponse.json({ error: 'Invalid KYC status.' }, { status: 400 });
    if (!updateById('kyc', String(id), (item) => ({ ...item, status: String(status) }))) return NextResponse.json({ error: 'KYC case not found.' }, { status: 404 });
  } else if (action === 'trade-status') {
    if (!['Queued', 'Executed', 'Failed', 'Win', 'Lose'].includes(String(status))) return NextResponse.json({ error: 'Invalid trade status.' }, { status: 400 });
    if (!updateById('trades', String(id), (item) => ({ ...item, status: String(status) }))) return NextResponse.json({ error: 'Trade not found.' }, { status: 404 });
  } else if (action === 'support-status') {
    if (!['Open', 'Pending', 'Resolved'].includes(String(status))) return NextResponse.json({ error: 'Invalid support status.' }, { status: 400 });
    if (!updateById('support', String(id), (item) => ({ ...item, status: String(status) }))) return NextResponse.json({ error: 'Support thread not found.' }, { status: 404 });
  } else if (action === 'wallet-points') {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta <= 0) return NextResponse.json({ error: 'Point amount must be greater than zero.' }, { status: 400 });
    if (operation !== 'add' && operation !== 'deduct') return NextResponse.json({ error: 'Invalid point operation.' }, { status: 400 });
    const wallet = state.wallets.find((item) => item.userId === userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    wallet.points = Math.max(0, wallet.points + (operation === 'add' ? delta : -delta));
  } else {
    return NextResponse.json({ error: 'Unsupported admin operation.' }, { status: 400 });
  }

  saveUpdate();
  return NextResponse.json(snapshot());
}
