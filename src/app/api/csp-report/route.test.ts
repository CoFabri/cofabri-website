import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { summarizeCspReports } from '@/lib/csp-report';

afterEach(() => {
  vi.restoreAllMocks();
});

function post(body: string) {
  return POST(
    new Request('https://cofabri.com/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body,
    })
  );
}

describe('POST /api/csp-report', () => {
  it('logs a summary without query strings and answers 204', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await post(
      JSON.stringify({
        'csp-report': {
          'document-uri': 'https://cofabri.com/contact?email=ada@example.com',
          'effective-directive': 'script-src-elem',
          'blocked-uri': 'https://evil.test/x.js?token=abc',
        },
      })
    );

    expect(res.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = String(warn.mock.calls[0][1]);
    expect(logged).toContain('script-src-elem');
    expect(logged).toContain('https://evil.test/x.js');
    expect(logged).not.toContain('token=abc');
    expect(logged).not.toContain('ada@example.com');
  });

  it('rejects bodies that are too large or not JSON', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await post('x'.repeat(20_000))).status).toBe(413);
    expect((await post('not json')).status).toBe(400);
  });
});

describe('summarizeCspReports', () => {
  it('reads Reporting API batches and caps how many it returns', () => {
    const batch = Array.from({ length: 25 }, () => ({
      type: 'csp-violation',
      body: { effectiveDirective: 'connect-src', blockedURL: 'wss://ws.hotjar.com/api', documentURL: 'https://cofabri.com/' },
    }));
    const out = summarizeCspReports(batch);
    expect(out).toHaveLength(10);
    expect(out[0]).toMatchObject({ directive: 'connect-src', blocked: 'wss://ws.hotjar.com/api' });
  });

  it('ignores junk', () => {
    expect(summarizeCspReports(null)).toEqual([]);
    expect(summarizeCspReports({ 'csp-report': 'x' })).toEqual([]);
    expect(summarizeCspReports([1, null, { body: 5 }])).toEqual([]);
  });
});
