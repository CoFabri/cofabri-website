import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAppSpec } from './fetch-app-spec';

function mockFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAppSpec', () => {
  it('returns no-spec when the app has no URL', async () => {
    expect(await fetchAppSpec(undefined)).toEqual({ ok: false, reason: 'no-spec' });
    expect(await fetchAppSpec('not a url')).toEqual({ ok: false, reason: 'no-spec' });
  });

  it('fetches the spec from the app origin and returns it', async () => {
    const spec = { openapi: '3.1.0', info: { title: 'X', version: '1' }, paths: {} };
    mockFetch(async () => new Response(JSON.stringify(spec), { status: 200 }));
    const result = await fetchAppSpec('https://meetgathr.co/some/path');
    expect(result).toMatchObject({
      ok: true,
      specUrl: 'https://meetgathr.co/openapi.json',
      llmsTxtUrl: 'https://meetgathr.co/llms.txt',
    });
  });

  it('treats a 404 as no-spec', async () => {
    mockFetch(async () => new Response('nope', { status: 404 }));
    expect(await fetchAppSpec('https://medoura.co')).toEqual({ ok: false, reason: 'no-spec' });
  });

  it('treats a 200 that is not JSON or not OpenAPI as no-spec', async () => {
    mockFetch(async () => new Response('<html></html>', { status: 200 }));
    expect(await fetchAppSpec('https://medoura.co')).toEqual({ ok: false, reason: 'no-spec' });
    mockFetch(async () => new Response('{"hello":1}', { status: 200 }));
    expect(await fetchAppSpec('https://medoura.co')).toEqual({ ok: false, reason: 'no-spec' });
  });

  it('treats 5xx and network errors as unreachable, not as "no docs"', async () => {
    mockFetch(async () => new Response('oops', { status: 503 }));
    expect(await fetchAppSpec('https://meetgathr.co')).toEqual({ ok: false, reason: 'unreachable' });
    mockFetch(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await fetchAppSpec('https://meetgathr.co')).toEqual({ ok: false, reason: 'unreachable' });
  });
});
