import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('verifyTurnstile', () => {
  it('returns false without a token or secret', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(await verifyTurnstile('', '1.1.1.1')).toBe(false);
    expect(await verifyTurnstile('tok', '1.1.1.1')).toBe(false);
  });
  it('posts the token to Cloudflare and returns its verdict', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyTurnstile('tok', '1.1.1.1')).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(String(init.body)).toContain('secret=secret');
    expect(String(init.body)).toContain('response=tok');
  });
  it('returns false when Cloudflare rejects or errors', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
    expect(await verifyTurnstile('tok', '1.1.1.1')).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await verifyTurnstile('tok', '1.1.1.1')).toBe(false);
  });
  it('returns false on a timeout and passes an abort signal', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyTurnstile('tok', '1.1.1.1')).toBe(false);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
