import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getApiHealth', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T12:00:00Z'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.COFABRI_API_BASE_URL;
    else process.env.COFABRI_API_BASE_URL = originalBaseUrl;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const load = async () => (await import('./api-health')).getApiHealth;

  it('is up when the API answers 200, probing the root with a JSON accept header and timeout', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();

    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cofabri.com/',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([401, 403, 404, 429])('is up when the API answers %i (it is alive)', async (status) => {
    global.fetch = vi.fn().mockResolvedValue({ status });
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('up');
  });

  it.each([500, 502, 503, 504])('is down when the API answers %i', async (status) => {
    global.fetch = vi.fn().mockResolvedValue({ status });
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('is down on a network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('is down on a timeout abort', async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('fails open (up) when fetch rejects with an unexpected non-network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('weird'));
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('up');
  });

  it('fails open (up) when AbortSignal.timeout itself is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const original = AbortSignal.timeout;
    (AbortSignal as unknown as { timeout?: unknown }).timeout = undefined;
    try {
      global.fetch = vi.fn().mockResolvedValue({ status: 200 });
      const getApiHealth = await load();
      expect(await getApiHealth()).toBe('up');
    } finally {
      (AbortSignal as unknown as { timeout?: unknown }).timeout = original;
    }
  });

  it('is up when COFABRI_API_BASE_URL is unset, without probing', async () => {
    delete process.env.COFABRI_API_BASE_URL;
    global.fetch = vi.fn();
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not double the slash when the base URL has a trailing slash', async () => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com/';
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/', expect.anything());
  });

  it('caches an up result for 15 seconds', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();

    await getApiHealth();
    vi.advanceTimersByTime(14_000);
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('caches a down result for only 5 seconds so recovery shows quickly', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });
    const getApiHealth = await load();

    expect(await getApiHealth()).toBe('down');
    vi.advanceTimersByTime(4_000);
    expect(await getApiHealth()).toBe('down');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight probe between concurrent callers', async () => {
    let resolveFetch!: (value: { status: number }) => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const getApiHealth = await load();

    const first = getApiHealth();
    const second = getApiHealth();
    resolveFetch({ status: 200 });

    expect(await first).toBe('up');
    expect(await second).toBe('up');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fails open when the health logic itself throws', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await getApiHealth()).toBe('up');
  });
});
