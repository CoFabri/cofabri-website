import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-health', () => ({ getApiHealth: vi.fn() }));

import { getApiHealth } from '@/lib/api-health';
import { middleware } from './middleware';

const mockedHealth = vi.mocked(getApiHealth);
const req = (path: string, headers?: Record<string, string>) => new NextRequest(`https://cofabri.com${path}`, { headers });

describe('middleware', () => {
  beforeEach(() => {
    mockedHealth.mockResolvedValue('up');
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('still redirects /privacy to /legal', async () => {
    const res = await middleware(req('/privacy'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://cofabri.com/legal');
  });

  it('still redirects known-missing KB articles to the KB index', async () => {
    const res = await middleware(req('/knowledge-base/faq'));
    expect(res.headers.get('location')).toBe('https://cofabri.com/knowledge-base');
  });

  it('passes a normal request through', async () => {
    const res = await middleware(req('/apps'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('serves the backstop when the API is down', async () => {
    mockedHealth.mockResolvedValue('down');
    const res = await middleware(req('/apps'));
    expect(res.status).toBe(503);
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
  });

  it('does not let a client force the backstop shell with forged headers', async () => {
    const res = await middleware(
      req('/apps', {
        'x-cofabri-backstop': 'outage',
        'x-cofabri-backstop-state': 'retry',
        'x-cofabri-backstop-note': '1',
        'user-agent': 'test',
      }),
    );
    expect(res.headers.get('x-middleware-request-x-cofabri-backstop')).toBeNull();
    // The override list must exist (proves headers were explicitly forwarded, i.e. stripped copy)
    // and carry the benign header, otherwise a plain NextResponse.next() would pass vacuously.
    expect(res.headers.get('x-middleware-override-headers')).not.toBeNull();
    const overridden = res.headers.get('x-middleware-override-headers')!.split(',');
    expect(overridden).toContain('user-agent');
    expect(overridden).not.toContain('x-cofabri-backstop');
    expect(overridden).not.toContain('x-cofabri-backstop-state');
    expect(overridden).not.toContain('x-cofabri-backstop-note');
  });
});
