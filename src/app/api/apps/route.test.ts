import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  getMarketingApps: vi.fn(async () => [{ id: 'medoura' }]),
  getApps: vi.fn(async () => [{ id: 'medoura' }, { id: 'maven-os' }]),
}));

import { GET } from './route';

describe('GET /api/apps', () => {
  it('serves the marketing list (no developers-only apps)', async () => {
    const body = await (await GET()).json();
    expect(body.map((a: { id: string }) => a.id)).toEqual(['medoura']);
  });
});
