import { describe, expect, it } from 'vitest';
import type { App } from '@/lib/api-client';
import { placeAfterApp, resolveRunsOn, runsOnIds, servicesRunningOn } from './runs-on';
import { SERVICE_FALLBACKS } from './fallback';
import { parseServiceContent } from './schema';

const svc = (id: string, linkedAppId?: string, service?: unknown): Pick<App, 'id' | 'service' | 'linkedAppId'> => ({ id, linkedAppId, service });
const app = (id: string, name: string, faviconUrl?: string) => ({ id, name, faviconUrl });

const crm = app('cofabri-crm', 'CoFabri CRM');
const medoura = app('medoura', 'Medoura', 'https://files.example.com/medoura.png');

describe('runsOnIds', () => {
  it('uses the list in the service data, primary first', () => {
    expect(runsOnIds(svc('cofabri-marketing', 'cofabri-crm', { outcome: 'x', runsOn: ['cofabri-crm', 'medoura'] }))).toEqual(['cofabri-crm', 'medoura']);
  });

  it('falls back to the linked app, then to the repo copy, then to nothing', () => {
    expect(runsOnIds(svc('a', 'cofabri-crm', { outcome: 'x' }))).toEqual(['cofabri-crm']);
    expect(runsOnIds(svc('cofabri-marketing', undefined, undefined))).toEqual(['cofabri-crm', 'medoura']); // repo copy
    expect(runsOnIds(svc('brand-new'))).toEqual([]);
  });

  it('drops repeats', () => {
    expect(runsOnIds(svc('a', undefined, { outcome: 'x', runsOn: ['medoura', 'medoura', 'cofabri-crm'] }))).toEqual(['medoura', 'cofabri-crm']);
  });

  it('CoFabri Marketing runs on CoFabri CRM and Medoura', () => {
    expect(SERVICE_FALLBACKS['cofabri-marketing'].runsOn).toEqual(['cofabri-crm', 'medoura']);
    expect(SERVICE_FALLBACKS['cofabri-marketing'].meta?.[0]).toMatchObject({ label: 'Runs on', value: 'CoFabri CRM and Medoura', kind: 'app' });
    expect(parseServiceContent(SERVICE_FALLBACKS['cofabri-marketing'])?.runsOn).toHaveLength(2);
  });
});

describe('resolveRunsOn', () => {
  const marketing = svc('cofabri-marketing', 'cofabri-crm', { outcome: 'x', runsOn: ['cofabri-crm', 'medoura'] });

  it('names each app from the listed apps, with its favicon', () => {
    expect(resolveRunsOn(marketing, [crm, medoura])).toEqual([
      { id: 'cofabri-crm', name: 'CoFabri CRM', faviconUrl: undefined },
      { id: 'medoura', name: 'Medoura', faviconUrl: 'https://files.example.com/medoura.png' },
    ]);
  });

  it('names a CoFabri product that is not listed, and leaves out any other unlisted app', () => {
    expect(resolveRunsOn(marketing, [medoura]).map((a) => a.name)).toEqual(['CoFabri CRM', 'Medoura']);
    expect(resolveRunsOn(marketing, [crm]).map((a) => a.name)).toEqual(['CoFabri CRM']);
  });
});

describe('servicesRunningOn and placeAfterApp', () => {
  const marketing = svc('cofabri-marketing', 'cofabri-crm', { outcome: 'x', runsOn: ['cofabri-crm', 'medoura'] });
  const other = svc('other', 'medoura');
  const none = svc('none');

  it('finds the services that run on an app, including a second app', () => {
    expect(servicesRunningOn([marketing, other, none], 'cofabri-crm').map((s) => s.id)).toEqual(['cofabri-marketing']);
    expect(servicesRunningOn([marketing, other, none], 'medoura').map((s) => s.id)).toEqual(['cofabri-marketing', 'other']);
    expect(servicesRunningOn([marketing, other, none], 'gathr')).toEqual([]);
  });

  it('puts the Managed card once, after the first listed app it runs on', () => {
    expect(placeAfterApp(marketing, ['medoura', 'cofabri-crm'])).toBe('cofabri-crm');
    expect(placeAfterApp(marketing, ['medoura'])).toBe('medoura');
    expect(placeAfterApp(marketing, ['gathr'])).toBeUndefined();
    expect(placeAfterApp(none, ['medoura'])).toBeUndefined();
  });
});
