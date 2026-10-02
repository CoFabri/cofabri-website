import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { CHAT_COOKIE, signChatToken } from '@/lib/chat/session';

const SECRET = 'chat-secret';

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9, 10.0.0.1', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const messages = [{ role: 'user', content: 'hi' }];

beforeEach(() => {
  vi.stubEnv('CHAT_SESSION_SECRET', SECRET);
  vi.stubEnv('COFABRI_API_BASE_URL', 'https://api.example.test');
  vi.stubEnv('COFABRI_API_KEY', 'api-key');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'ts-secret');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubUpstream(status = 200, body = '{"type":"done"}\n') {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('POST /api/chat', () => {
  it('is unavailable when not configured', async () => {
    vi.stubEnv('CHAT_SESSION_SECRET', '');
    const res = await POST(req({ messages }));
    expect(res.status).toBe(503);
  });

  it('rejects invalid JSON', async () => {
    const res = await POST(req('{not json'));
    expect(res.status).toBe(400);
  });

  it('asks for verification when there is no cookie and no token', async () => {
    const res = await POST(req({ messages }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'verification_required' });
  });

  it('rejects a bad Turnstile token', async () => {
    stubUpstream(200, JSON.stringify({ success: false }));
    const res = await POST(req({ messages, turnstileToken: 'bad' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'verification_failed' });
  });

  it('verifies Turnstile, sets the chat cookie and streams the upstream body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(new Response('{"type":"text","delta":"Hello"}\n{"type":"done"}\n'));
    vi.stubGlobal('fetch', fetchMock);
    const res = await POST(req({ messages, appId: 'medoura', turnstileToken: 'good' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/x-ndjson/);
    expect(res.headers.get('set-cookie')).toContain(`${CHAT_COOKIE}=`);
    expect(await res.text()).toContain('"Hello"');

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://api.example.test/web/chat');
    expect(init.headers.Authorization).toBe('Bearer api-key');
    expect(init.headers['x-chat-visitor']).toBe('203.0.113.9');
    expect(JSON.parse(init.body)).toEqual({ messages, appId: 'medoura' });
  });

  it('accepts a valid chat cookie without a token and does not set a new cookie', async () => {
    const fetchMock = stubUpstream();
    const cookie = `${CHAT_COOKIE}=${signChatToken(SECRET)}`;
    const res = await POST(req({ messages }, { cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an expired cookie', async () => {
    const cookie = `${CHAT_COOKIE}=${signChatToken(SECRET, Date.now() - 3 * 60 * 60 * 1000)}`;
    const res = await POST(req({ messages }, { cookie }));
    expect(res.status).toBe(401);
  });

  it('forwards only messages and appId, never the Turnstile token', async () => {
    const fetchMock = stubUpstream();
    const cookie = `${CHAT_COOKIE}=${signChatToken(SECRET)}`;
    await POST(req({ messages, turnstileToken: 'leak', evil: 'x' }, { cookie }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ messages });
  });

  it('maps an upstream 400 to 400 and any other failure to 503', async () => {
    const cookie = `${CHAT_COOKIE}=${signChatToken(SECRET)}`;
    stubUpstream(400, '{"success":false}');
    expect((await POST(req({ messages }, { cookie }))).status).toBe(400);
    stubUpstream(500, 'oops');
    expect((await POST(req({ messages }, { cookie }))).status).toBe(503);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect((await POST(req({ messages }, { cookie }))).status).toBe(503);
  });
});
