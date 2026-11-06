import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAppSpec, publicAppUrl } from './fetch-app-spec';

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

  const spec = (servers?: { url: string }[]) => ({ openapi: '3.1.0', info: { title: 'X', version: '1' }, paths: {}, servers });

  it('maven-os uses its own absolute spec source, whatever the Core record points at', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(spec()), { status: 200 }));
    vi.stubGlobal('fetch', f);
    for (const recordUrl of ['https://mavenx.co/mavenos', undefined, 'https://elsewhere.example/app']) {
      const mos = await fetchAppSpec(recordUrl, 'maven-os');
      expect(f).toHaveBeenLastCalledWith('https://os.mavenx.co/api/v2/openapi.json', expect.anything());
      expect(mos).toMatchObject({ ok: true, specUrl: 'https://os.mavenx.co/api/v2/openapi.json', llmsTxtUrl: null });
    }
  });

  it('other apps keep the default path and an llms.txt link', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(spec()), { status: 200 }));
    vi.stubGlobal('fetch', f);
    const r = await fetchAppSpec('https://meetgathr.co', 'gathr');
    expect(f).toHaveBeenLastCalledWith('https://meetgathr.co/openapi.json', expect.anything());
    expect(r).toMatchObject({ llmsTxtUrl: 'https://meetgathr.co/llms.txt' });
    await fetchAppSpec('https://meetgathr.co');
    expect(f).toHaveBeenLastCalledWith('https://meetgathr.co/openapi.json', expect.anything());
  });

  it('publicAppUrl gives maven-os its own origin and leaves other apps alone', () => {
    expect(publicAppUrl('maven-os', 'https://mavenx.co/mavenos')).toBe('https://os.mavenx.co');
    expect(publicAppUrl('gathr', 'https://meetgathr.co')).toBe('https://meetgathr.co');
    expect(publicAppUrl('gathr', undefined)).toBeUndefined();
  });

  it('resolves a relative servers[0].url against the app origin', async () => {
    mockFetch(async () => new Response(JSON.stringify(spec([{ url: '/' }])), { status: 200 }));
    const r = await fetchAppSpec('https://mavenx.co/mavenos', 'maven-os');
    expect(r.ok && r.spec.servers?.[0].url).toBe('https://os.mavenx.co/');
  });

  it('leaves an absolute servers[0].url untouched', async () => {
    mockFetch(async () => new Response(JSON.stringify(spec([{ url: 'https://api.other.com/v1' }])), { status: 200 }));
    const r = await fetchAppSpec('https://mavenos.example', 'maven-os');
    expect(r.ok && r.spec.servers?.[0].url).toBe('https://api.other.com/v1');
  });
});
