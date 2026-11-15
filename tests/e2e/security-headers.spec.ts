import { test, expect } from '@playwright/test';

// Uses the healthy-API server (port 3101) so pages render normally.
test.use({ baseURL: 'http://localhost:3101' });

test('pages send the security headers and a report-only CSP', async ({ request }) => {
  const response = await request.get('/about');
  const headers = response.headers();

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['strict-transport-security']).toBe('max-age=63072000');
  expect(headers['permissions-policy']).toContain('camera=()');

  const csp = headers['content-security-policy-report-only'];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain('https://challenges.cloudflare.com');
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain('report-uri /api/csp-report');
});

test('the embeddable status widget keeps its own CSP and no report-only page CSP', async ({ request }) => {
  const response = await request.get('/api/status-widget');
  const headers = response.headers();

  expect(headers['content-security-policy-report-only']).toBeUndefined();
  expect(headers['x-frame-options']).toBeUndefined();
  expect(headers['x-content-type-options']).toBe('nosniff');
});

test('the CSP report endpoint accepts a report', async ({ request }) => {
  const response = await request.post('/api/csp-report', {
    headers: { 'Content-Type': 'application/csp-report' },
    data: JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'inline' } }),
  });
  expect(response.status()).toBe(204);
});
