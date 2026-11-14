import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/status-api', () => ({
  getSystemStatusOrThrow: vi.fn(async () => []),
}));

import { GET } from './route';

function call(app: string) {
  const req = new NextRequest(`https://cofabri.com/api/status/${encodeURIComponent(app)}`);
  return GET(req, { params: Promise.resolve({ app }) });
}

describe('GET /api/status/[app]', () => {
  it('rejects an app id carrying markup instead of reflecting it', async () => {
    const res = await call('</title><script>alert(1)</script>');
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).not.toContain('<script>alert(1)');
  });

  it('renders the widget for a real app id with security headers', async () => {
    const res = await call('medoura');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<title>medoura System Status</title>');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
