import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getAppReleases', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('fetches releases from cofabri-api and maps them to AppRelease', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { release_name: 'v1.2', public_description: 'Bug fixes', released_date: '2026-01-01' },
      ],
    });

    const { getAppReleases } = await import('./api-client');
    const releases = await getAppReleases('medoura');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cofabri.com/web/content/apps/medoura/releases',
      expect.anything()
    );
    expect(releases).toEqual([{ name: 'v1.2', description: 'Bug fixes', releasedDate: '2026-01-01' }]);
  });

  it('returns an empty array when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const { getAppReleases } = await import('./api-client');
    const releases = await getAppReleases('medoura');

    expect(releases).toEqual([]);
  });
});
