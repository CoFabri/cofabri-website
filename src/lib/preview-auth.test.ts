import { describe, expect, it } from 'vitest';
import { issuePreviewToken, PREVIEW_COOKIE_MAX_AGE, verifyPreviewToken } from './preview-auth';

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

describe('preview tokens', () => {
  it('verifies a fresh token and does not contain the password', async () => {
    const token = await issuePreviewToken('secret', undefined, NOW);
    expect(token).toMatch(/^v2\.\d+\.[0-9a-f]{64}$/);
    expect(token).not.toContain('secret');
    expect(await verifyPreviewToken(token, 'secret', undefined, NOW)).toBe(true);
  });

  it('expires after 8 hours, checked on the server', async () => {
    const token = await issuePreviewToken('secret', undefined, NOW);
    const later = NOW + PREVIEW_COOKIE_MAX_AGE * 1000;
    expect(await verifyPreviewToken(token, 'secret', undefined, later - 1000)).toBe(true);
    expect(await verifyPreviewToken(token, 'secret', undefined, later)).toBe(false);
  });

  it('is invalidated by rotating the password or the secret', async () => {
    const token = await issuePreviewToken('secret', 'k1', NOW);
    expect(await verifyPreviewToken(token, 'secret', 'k1', NOW)).toBe(true);
    expect(await verifyPreviewToken(token, 'rotated', 'k1', NOW)).toBe(false);
    expect(await verifyPreviewToken(token, 'secret', 'k2', NOW)).toBe(false);
    expect(await verifyPreviewToken(token, 'secret', undefined, NOW)).toBe(false);
  });

  it('rejects tampered, extended or malformed tokens', async () => {
    const token = await issuePreviewToken('secret', undefined, NOW);
    const [v, exp, sig] = token.split('.');
    const farFuture = Math.floor(NOW / 1000) + 365 * 24 * 3600;
    expect(await verifyPreviewToken(`${v}.${Number(exp) + 3600}.${sig}`, 'secret', undefined, NOW)).toBe(false);
    expect(await verifyPreviewToken(`${v}.${farFuture}.${sig}`, 'secret', undefined, NOW)).toBe(false);
    expect(await verifyPreviewToken(`${v}.${exp}.${'0'.repeat(64)}`, 'secret', undefined, NOW)).toBe(false);
    for (const bad of ['', 'abc', 'v1.1.2', `v2.${exp}`, `v2.x.${sig}`]) {
      expect(await verifyPreviewToken(bad, 'secret', undefined, NOW)).toBe(false);
    }
  });
});
