import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('POST /api/coming-soon', () => {
  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.test.cofabri.com';
    process.env.COFABRI_API_KEY = 'test-key';
    vi.resetModules();
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // A fresh client IP per request so the per-IP limiter only matters where a test is about it.
  let ipCounter = 0;
  function request(body: Record<string, unknown> = {}, ip = `198.51.100.${++ipCounter}`) {
    return new Request('http://localhost/api/coming-soon', {
      method: 'POST',
      headers: { 'x-real-ip': ip },
      body: JSON.stringify({ email: 'jane@business.com', appId: 'cofabri-concierge', ...body }),
    });
  }
  async function post(req: Request) {
    const { POST } = await import('./route');
    return POST(req);
  }

  it('forwards a valid signup to cofabri-api with the interested app', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await post(request({ email: ' Jane@Business.COM ', firstName: 'Jane' }));

    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test.cofabri.com/web/forms/coming-soon');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body)).toEqual({ email: 'jane@business.com', first_name: 'Jane', app_id: 'cofabri-concierge' });
  });

  it('rejects an invalid email without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await post(request({ email: 'nope' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Enter an email like name@business.com.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or malformed app id', async () => {
    vi.stubGlobal('fetch', vi.fn());
    expect((await post(request({ appId: '' }))).status).toBe(400);
    expect((await post(request({ appId: 'x/../y' }))).status).toBe(400);
  });

  it('answers a filled honeypot as a success but does not forward it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await post(request({ hpToken: 'bot' }));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limits repeated requests from one IP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 201 })));
    const ip = '198.51.100.250';
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await post(request({}, ip))).status);
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('reports a 502 without leaking the upstream body when cofabri-api rejects it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: [{ value: 'jane@business.com' }] }), { status: 400 })));
    const res = await post(request());
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('jane@business.com');
  });

  it('reports a 502 when cofabri-api is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    expect((await post(request())).status).toBe(502);
  });

  it('reports a 503 when credentials are not configured', async () => {
    delete process.env.COFABRI_API_KEY;
    vi.stubGlobal('fetch', vi.fn());
    expect((await post(request())).status).toBe(503);
  });
});
