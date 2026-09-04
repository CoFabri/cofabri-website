import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getSystemStatus', () => {
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

  it('fetches incidents from cofabri-api and fills in defaults for missing fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        incidents: [{ ticketId: 'T-1', publicStatus: 'Investigating' }],
      }),
    });

    const { getSystemStatus } = await import('./airtable');
    const statuses = await getSystemStatus();

    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/web/content/status-feed', expect.anything());
    expect(statuses).toHaveLength(1);
    expect(statuses[0].ticketId).toBe('T-1');
    expect(statuses[0].publicStatus).toBe('Investigating');
    expect(statuses[0].application).toBe('CoFabri System');
  });

  it('returns an empty array when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { getSystemStatus } = await import('./airtable');
    const statuses = await getSystemStatus();

    expect(statuses).toEqual([]);
  });

  it('passes through affectedAppIds and isPlatformWide, defaulting to empty/false when missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        incidents: [
          { ticketId: 'T-1', publicStatus: 'Investigating', affectedAppIds: ['medoura'], isPlatformWide: false },
          { ticketId: 'T-2', publicStatus: 'Investigating' },
        ],
      }),
    });

    const { getSystemStatus } = await import('./airtable');
    const statuses = await getSystemStatus();

    expect(statuses[0].affectedAppIds).toEqual(['medoura']);
    expect(statuses[0].isPlatformWide).toBe(false);
    expect(statuses[1].affectedAppIds).toEqual([]);
    expect(statuses[1].isPlatformWide).toBe(false);
  });
});

describe('getServiceUptimeHistory', () => {
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

  it('fetches services from cofabri-api, filtering out entries missing id/name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        services: [
          { id: 's1', name: 'API', history: [{ date: '2026-01-01', status: 'operational' }] },
          { name: 'Missing id' },
        ],
      }),
    });

    const { getServiceUptimeHistory } = await import('./airtable');
    const services = await getServiceUptimeHistory();

    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/web/content/status-feed', expect.anything());
    expect(services).toEqual([{ id: 's1', name: 'API', history: [{ date: '2026-01-01', status: 'operational' }] }]);
  });

  it('returns an empty array when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { getServiceUptimeHistory } = await import('./airtable');
    const services = await getServiceUptimeHistory();

    expect(services).toEqual([]);
  });
});
