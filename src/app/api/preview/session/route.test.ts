import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { PREVIEW_COOKIE, previewCookieValue } from '@/lib/preview-auth';

const login = (password: unknown) =>
  POST(new Request('https://cofabri.com/api/preview/session', { method: 'POST', body: JSON.stringify({ password }) }));

afterEach(() => vi.unstubAllEnvs());

describe('POST /api/preview/session', () => {
  it('sets the HttpOnly preview cookie for the right password', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    const res = await login('secret');
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${PREVIEW_COOKIE}=${await previewCookieValue('secret')}`);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  it('rejects a wrong password without a cookie', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    const res = await login('nope');
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('refuses in production when PREVIEW_PASSWORD is unset', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', '');
    vi.stubEnv('VERCEL_ENV', 'production');
    const res = await login('anything');
    expect(res.status).toBe(403);
  });
});

describe('POST /api/preview/session attempt limit', () => {
  it('locks an IP out after 10 wrong passwords, even for the right one', async () => {
    const { resetPreviewLoginLimiter } = await import('@/lib/preview-login-limiter');
    resetPreviewLoginLimiter();
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    const attempt = (password: string, ip = '203.0.113.7') =>
      POST(
        new Request('https://cofabri.com/api/preview/session', {
          method: 'POST',
          headers: { 'x-forwarded-for': ip },
          body: JSON.stringify({ password }),
        })
      );
    for (let i = 0; i < 10; i++) expect((await attempt('nope')).status).toBe(401);
    expect((await attempt('secret')).status).toBe(429);
    expect((await attempt('secret', '198.51.100.1')).status).toBe(200);
    resetPreviewLoginLimiter();
  });

  it('caps a parallel burst at 10 password checks', async () => {
    const { resetPreviewLoginLimiter } = await import('@/lib/preview-login-limiter');
    resetPreviewLoginLimiter();
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    const burst = await Promise.all(
      Array.from({ length: 25 }, () =>
        POST(
          new Request('https://cofabri.com/api/preview/session', {
            method: 'POST',
            headers: { 'x-forwarded-for': '203.0.113.9' },
            body: JSON.stringify({ password: 'nope' }),
          })
        )
      )
    );
    const statuses = burst.map((r) => r.status);
    expect(statuses.filter((s) => s === 401)).toHaveLength(10);
    expect(statuses.filter((s) => s === 429)).toHaveLength(15);
    resetPreviewLoginLimiter();
  });

  it('does not count correct passwords against the limit', async () => {
    const { resetPreviewLoginLimiter } = await import('@/lib/preview-login-limiter');
    resetPreviewLoginLimiter();
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    const attempt = (password: string) =>
      POST(
        new Request('https://cofabri.com/api/preview/session', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.10' },
          body: JSON.stringify({ password }),
        })
      );
    for (let i = 0; i < 15; i++) expect((await attempt('secret')).status).toBe(200);
    for (let i = 0; i < 10; i++) expect((await attempt('nope')).status).toBe(401);
    expect((await attempt('nope')).status).toBe(429);
    resetPreviewLoginLimiter();
  });
});
