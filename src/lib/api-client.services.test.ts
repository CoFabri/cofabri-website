import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A realistic mix: two apps, a live service, a service still in development.
const rows = [
  { app_id: 'cofabri-crm', app_name: 'CoFabri CRM', lifecycle_stage: 'Live', project_type: 'cofabri_product', linked_app_id: null, service: null, checkout: { monthly: 'https://pay.example.com/m', annual: 'https://pay.example.com/a' } },
  { app_id: 'medoura', app_name: 'Medoura', lifecycle_stage: 'Live', project_type: 'cofabri_product', checkout: null },
  { app_id: 'cofabri-marketing', app_name: 'CoFabri Marketing', lifecycle_stage: 'Live', project_type: 'cofabri_service', linked_app_id: 'cofabri-crm', service: { outcome: 'x' }, checkout: null },
  { app_id: 'cofabri-concierge', app_name: 'CoFabri Concierge', lifecycle_stage: 'In Development', project_type: 'cofabri_service', linked_app_id: null, service: null, checkout: null },
  // Older API responses carry no project_type at all: that is an app.
  { app_id: 'legacy', app_name: 'Legacy', lifecycle_stage: 'Live' },
];

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const single = /\/web\/content\/apps\/([^/?]+)$/.exec(url);
      if (single) {
        const row = rows.find((r) => r.app_id === decodeURIComponent(single[1]));
        return row ? new Response(JSON.stringify(row), { status: 200 }) : new Response('{}', { status: 404 });
      }
      return new Response(JSON.stringify(rows), { status: 200 });
    }),
  );
}

beforeEach(() => {
  vi.stubEnv('COFABRI_API_BASE_URL', 'https://api.cofabri.com');
  vi.resetModules();
  stubFetch();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('apps and services filtering', () => {
  it('getApps and getMarketingApps never include a service', async () => {
    const { getApps, getMarketingApps } = await import('./api-client');
    expect((await getApps()).map((a) => a.id)).toEqual(['cofabri-crm', 'medoura', 'legacy']);
    expect((await getMarketingApps()).map((a) => a.id)).toEqual(['cofabri-crm', 'medoura', 'legacy']);
  });

  it('getServices returns only services', async () => {
    const { getServices } = await import('./api-client');
    expect((await getServices()).map((a) => a.id)).toEqual(['cofabri-marketing', 'cofabri-concierge']);
  });

  it('getService finds a service, and refuses an app or an unknown id', async () => {
    const { getService } = await import('./api-client');
    expect((await getService('cofabri-marketing'))?.id).toBe('cofabri-marketing');
    expect(await getService('cofabri-crm')).toBeNull();
    expect(await getService('nope')).toBeNull();
  });

  it('getApp still returns a service (callers decide what to do with it)', async () => {
    const { getApp, isService } = await import('./api-client');
    const app = await getApp('cofabri-marketing');
    expect(app && isService(app)).toBe(true);
  });

  it('maps the service fields and the checkout links', async () => {
    const { getServices, getApps } = await import('./api-client');
    const [marketing] = await getServices();
    expect(marketing.linkedAppId).toBe('cofabri-crm');
    expect(marketing.service).toEqual({ outcome: 'x' });
    expect(marketing.checkout).toBeUndefined();

    const crm = (await getApps()).find((a) => a.id === 'cofabri-crm');
    expect(crm?.checkout).toEqual({ monthly: 'https://pay.example.com/m', annual: 'https://pay.example.com/a' });
  });

  it('treats an app without any checkout link as having no checkout', async () => {
    const { getApps } = await import('./api-client');
    expect((await getApps()).find((a) => a.id === 'medoura')?.checkout).toBeUndefined();
  });
});
