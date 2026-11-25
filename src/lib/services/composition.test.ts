import { describe, expect, it } from 'vitest';
import type { App } from '@/lib/api-client';
import { MAX_COMPOSITION_TILES, buildComposition, servicesLayout } from './composition';

const app = (id: string, name: string): App => ({ id, name, status: 'Live' });
const service = (id: string, name: string, status = 'Live', linkedAppId?: string): App => ({ id, name, status, projectType: 'cofabri_service', linkedAppId });

const crm = app('cofabri-crm', 'CoFabri CRM');
const marketing = service('cofabri-marketing', 'CoFabri Marketing', 'Live', 'cofabri-crm');
const concierge = service('cofabri-concierge', 'CoFabri Concierge', 'In Development');

describe('buildComposition', () => {
  it('arranges one app and two services: the app first, then the services', () => {
    const c = buildComposition([marketing, concierge], [crm]);
    expect(c.arranged).toBe(true);
    expect(c.tiles.map((t) => t.id)).toEqual(['cofabri-crm', 'cofabri-marketing', 'cofabri-concierge']);
  });

  it('labels tiles from Core: app, live service, coming-soon service', () => {
    const c = buildComposition([marketing, concierge], [crm]);
    expect(c.tiles.map((t) => t.sublabel)).toEqual(['App · you run it', 'Service · Live', 'Service · Coming soon']);
    expect(c.tiles[0].name).toBe('CoFabri CRM');
  });

  it('falls back to a simple row for any other count', () => {
    expect(buildComposition([marketing], [crm]).arranged).toBe(false);
    expect(buildComposition([marketing, concierge, service('s3', 'Three')], [crm]).arranged).toBe(false);
    expect(buildComposition([concierge], []).arranged).toBe(false);
  });

  it('is not arranged when the two services run on different apps', () => {
    const other = service('other', 'Other', 'Live', 'medoura');
    expect(buildComposition([marketing, other], [crm, app('medoura', 'Medoura')]).arranged).toBe(false);
  });

  it('names an app that is not visible from its tile, and shows no app when nothing links', () => {
    expect(buildComposition([marketing], []).tiles[0].name).toBe('CoFabri CRM');
    expect(buildComposition([concierge], []).tiles.map((t) => t.id)).toEqual(['cofabri-concierge']);
  });

  it('caps the tiles at six', () => {
    const many = Array.from({ length: 9 }, (_, i) => service(`s${i}`, `S${i}`));
    expect(buildComposition(many, []).tiles).toHaveLength(MAX_COMPOSITION_TILES);
  });
});

describe('servicesLayout', () => {
  it('uses panels for one to four services, the grid from five, and an empty state for none', () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(servicesLayout)).toEqual(['empty', 'panels', 'panels', 'panels', 'panels', 'grid', 'grid']);
  });
});
