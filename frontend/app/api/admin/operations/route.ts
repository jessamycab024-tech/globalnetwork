import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:4000';

function backendUrl() {
  return process.env.ADMIN_BACKEND_URL || process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || DEFAULT_BACKEND_URL;
}

async function proxyOperations(request: NextRequest, method: 'GET' | 'PATCH') {
  const headers: HeadersInit = {
    cookie: request.headers.get('cookie') || '',
  };

  let body: string | undefined;
  if (method === 'PATCH') {
    headers['content-type'] = 'application/json';
    body = await request.text();
  }

  const response = await fetch(`${backendUrl()}/api/admin/operations`, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({ error: 'Backend returned an invalid response.' }));
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest) {
  return proxyOperations(request, 'GET');
}

export async function PATCH(request: NextRequest) {
  return proxyOperations(request, 'PATCH');
}
