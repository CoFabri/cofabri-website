import { describe, expect, it } from 'vitest';
import type { App } from '@/lib/api-client';
import { MAX_COMPOSITION_TILES, buildComposition, servicesLayout } from './composition';

const service = (id: string, name: string, status = 'Live', linkedAppId?: string): App => ({ id, name, status, projectType: 'cofabri_service', linkedAppId });

const marketing = service('cofabri-marketing', 'CoFabri Marketing', 'Live', 'cofabri-crm');
const concierge = service('cofabri-concierge', 'CoFabri Concierge', 'In Development');

describe('buildComposition', () => {
  it('shows the services only: an app is never a tile, even one a service runs on', () => {
    const c = buildComposition([marketing, concierge]);
    expect(c.tiles.map((t) => t.id)).toEqual(['cofabri-marketing', 'cofabri-concierge']);
    expect(c.tiles.every((t) => t.kind === 'service')).toBe(true);
    expect(c.tiles.some((t) => t.id === 'cofabri-crm')).toBe(false);
  });

  it('labels each tile from its Core status: Live or Coming soon', () => {
    expect(buildComposition([marketing, concierge]).tiles.map((t) => t.sublabel)).toEqual(['Service · Live', 'Service · Coming soon']);
    expect(buildComposition([marketing]).tiles[0].name).toBe('CoFabri Marketing');
  });

  it('uses the designed arrangement for exactly two services', () => {
    expect(buildComposition([marketing, concierge]).arranged).toBe(true);
  });

  it('falls back to a simple row for any other count', () => {
    expect(buildComposition([marketing]).arranged).toBe(false);
    expect(buildComposition([marketing, concierge, service('s3', 'Three')]).arranged).toBe(false);
    expect(buildComposition([]).arranged).toBe(false);
    expect(buildComposition([]).tiles).toEqual([]);
  });

  it('caps the tiles at six', () => {
    const many = Array.from({ length: 9 }, (_, i) => service(`s${i}`, `S${i}`));
    expect(buildComposition(many).tiles).toHaveLength(MAX_COMPOSITION_TILES);
  });
});

describe('servicesLayout', () => {
  it('uses panels for one to four services, the grid from five, and an empty state for none', () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(servicesLayout)).toEqual(['empty', 'panels', 'panels', 'panels', 'panels', 'grid', 'grid']);
  });
});
