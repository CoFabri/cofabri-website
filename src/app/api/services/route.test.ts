import { describe, expect, it, vi, beforeEach } from 'vitest';

const getServices = vi.fn();
vi.mock('@/lib/api-client', () => ({ getServices: () => getServices() }));

describe('GET /api/services', () => {
  beforeEach(() => {
    vi.resetModules();
    getServices.mockReset();
  });

  it('returns the visible services', async () => {
    getServices.mockResolvedValue([{ id: 'cofabri-marketing', name: 'CoFabri Marketing' }]);
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'cofabri-marketing', name: 'CoFabri Marketing' }]);
  });

  it('answers 500 without leaking the error', async () => {
    getServices.mockRejectedValue(new Error('secret detail'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
