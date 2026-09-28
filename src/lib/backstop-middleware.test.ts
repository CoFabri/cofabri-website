import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-health', () => ({ getApiHealth: vi.fn() }));

import { getApiHealth } from '@/lib/api-health';
import { handleBackstop, stripBackstopHeaders } from './backstop-middleware';

const mockedHealth = vi.mocked(getApiHealth);
const req = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`https://cofabri.com${path}`, init);

describe('handleBackstop', () => {
  beforeEach(() => {
    mockedHealth.mockResolvedValue('up');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('passes through (null) when the API is up', async () => {
    expect(await handleBackstop(req('/apps'))).toBeNull();
  });

  it('serves the backstop with a 503 and the outage headers when the API is down', async () => {
    mockedHealth.mockResolvedValue('down');
    const res = await handleBackstop(req('/apps?x=1'));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    expect(res!.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
    expect(res!.headers.get('retry-after')).toBe('30');
    expect(res!.headers.get('cache-control')).toBe('no-store');
    expect(res!.headers.get('x-robots-tag')).toBe('noindex');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('outage');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-state')).toBe('idle');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-note')).toBe('0');
  });

  it.each([
    '/api/status',
    '/_next/static/chunks/a.js',
    '/_next/image?url=x',
    '/status-widget.js',
    '/app-status-widget.js',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/images/logo.PNG',
    '/google1234567890abcdef.html',
  ])('never intercepts %s, even when the API is down', async (path) => {
    mockedHealth.mockResolvedValue('down');
    expect(await handleBackstop(req(path))).toBeNull();
    expect(mockedHealth).not.toHaveBeenCalled();
  });

  it('serves the preview with 200, no Retry-After, without probing the API', async () => {
    const res = await handleBackstop(req('/?backstop=preview'));

    expect(res!.status).toBe(200);
    expect(res!.headers.get('retry-after')).toBeNull();
    expect(res!.headers.get('x-robots-tag')).toBe('noindex');
    expect(res!.headers.get('cache-control')).toBe('no-store');
    expect(res!.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('preview');
    expect(mockedHealth).not.toHaveBeenCalled();
  });

  it('forwards preview state and note options', async () => {
    const res = await handleBackstop(req('/apps?backstop=preview&state=retry&note=1'));
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-state')).toBe('retry');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-note')).toBe('1');
  });

  it('requires the password for the preview on production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');

    // Wrong or missing password: the param is ignored and the page behaves normally.
    expect(await handleBackstop(req('/?backstop=preview'))).toBeNull();
    expect(await handleBackstop(req('/?backstop=preview&password=wrong'))).toBeNull();

    const ok = await handleBackstop(req('/?backstop=preview&password=secret'));
    expect(ok!.status).toBe(200);
    expect(ok!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('preview');
  });

  it('a rejected preview on production still shows the real backstop if the API is down', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    mockedHealth.mockResolvedValue('down');
    const res = await handleBackstop(req('/?backstop=preview&password=wrong'));
    expect(res!.status).toBe(503);
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('outage');
  });

  it('redirects direct visits to /backstop to the homepage', async () => {
    const res = await handleBackstop(req('/backstop'));
    expect(res!.status).toBe(307);
    expect(res!.headers.get('location')).toBe('https://cofabri.com/');
  });

  it('redirects /Backstop (any casing) to the homepage', async () => {
    const res = await handleBackstop(req('/Backstop'));
    expect(res!.status).toBe(307);
    expect(res!.headers.get('location')).toBe('https://cofabri.com/');
  });

  it('fails open if the health check throws', async () => {
    mockedHealth.mockRejectedValue(new Error('boom'));
    expect(await handleBackstop(req('/apps'))).toBeNull();
  });
});

describe('stripBackstopHeaders', () => {
  it('removes all backstop headers and keeps the rest', () => {
    const headers = new Headers({
      'x-cofabri-backstop': 'outage',
      'x-cofabri-backstop-state': 'retry',
      'x-cofabri-backstop-note': '1',
      'user-agent': 'test',
    });
    const cleaned = stripBackstopHeaders(headers);

    expect(cleaned.get('x-cofabri-backstop')).toBeNull();
    expect(cleaned.get('x-cofabri-backstop-state')).toBeNull();
    expect(cleaned.get('x-cofabri-backstop-note')).toBeNull();
    expect(cleaned.get('user-agent')).toBe('test');
    // The original is untouched.
    expect(headers.get('x-cofabri-backstop')).toBe('outage');
  });
});
