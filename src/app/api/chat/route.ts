import { NextResponse } from 'next/server';
import { chatCookieHeader, readChatCookie, signChatToken, verifyChatToken } from '@/lib/chat/session';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const secret = process.env.CHAT_SESSION_SECRET;
  const apiBase = process.env.COFABRI_API_BASE_URL;
  const apiKey = process.env.COFABRI_API_KEY;
  if (!secret || !apiBase || !apiKey) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  let body: { messages?: unknown; appId?: unknown; turnstileToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const ip = clientIp(request);
  let setCookie: string | null = null;

  if (!verifyChatToken(secret, readChatCookie(request.headers.get('cookie')))) {
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
    if (!token) {
      return NextResponse.json({ error: 'verification_required' }, { status: 401 });
    }
    if (!(await verifyTurnstile(token, ip))) {
      return NextResponse.json({ error: 'verification_failed' }, { status: 401 });
    }
    setCookie = chatCookieHeader(signChatToken(secret), process.env.NODE_ENV === 'production');
  }

  const forward: { messages: unknown; appId?: unknown } = { messages: body.messages };
  if (body.appId !== undefined) forward.appId = body.appId;

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/web/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-chat-visitor': ip,
      },
      body: JSON.stringify(forward),
    });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  if (upstream.status === 400) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(upstream.body, { status: 200, headers });
}
