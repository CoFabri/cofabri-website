import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rows = ['medoura', 'maven-os', 'gathr'];


function stubApps() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(rows.map((id) => ({ app_id: id, name: id, lifecycle_stage: 'Live' }))), { status: 200 })),
  );
}

beforeEach(() => {
  vi.stubEnv('COFABRI_API_BASE_URL', 'https://api.cofabri.com');
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getMarketingApps', () => {
  it('lists maven-os as developers-only', async () => {
    const { DEVELOPERS_ONLY_APP_IDS } = await import('./api-client');
    expect(DEVELOPERS_ONLY_APP_IDS).toContain('maven-os');
  });

  it('excludes developers-only apps while getApps (used by /developers) keeps them', async () => {
    stubApps();
    const { getApps, getMarketingApps } = await import('./api-client');
    const all = (await getApps()).map((a) => a.id);
    const marketing = (await getMarketingApps()).map((a) => a.id);
    expect(all).toContain('maven-os');
    expect(marketing).not.toContain('maven-os');
    expect(marketing).toEqual(expect.arrayContaining(['medoura', 'gathr']));
  });
});
