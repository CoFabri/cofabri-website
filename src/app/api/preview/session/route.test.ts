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
