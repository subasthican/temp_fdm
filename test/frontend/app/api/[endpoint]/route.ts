import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  const allowed: Record<string, string> = { health: 'GET', model: 'GET', predict: 'POST' };
  if (!allowed[endpoint]) return NextResponse.json({ error: 'Endpoint not found.' }, { status: 404 });
  if (request.method !== allowed[endpoint]) {
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: allowed[endpoint] } });
  }
  try {
    const response = await fetch(`${process.env.FLASK_API_URL || 'http://127.0.0.1:5000'}/api/${endpoint}`, {
      method: request.method,
      headers: request.method === 'POST' ? { 'Content-Type': request.headers.get('content-type') || 'application/octet-stream' } : {},
      body: request.method === 'POST' ? await request.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'The prediction service is unavailable. Start the Python backend and try again.' }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
