import type { App } from '@/lib/api-client';
import { FAMILY_MARKS } from '@/lib/family-marks';
import { serviceStatus } from './index';

// The tiles in the /services hero: the app(s) the visible services run on, then
// every visible service, all taken from Core rather than hard-coded.

export interface CompositionTile {
  id: string;
  name: string;
  /** Mono sublabel under the name. */
  sublabel: string;
  kind: 'app' | 'service';
}

export interface Composition {
  tiles: CompositionTile[];
  /** The designed arrangement: one app and two services. Anything else is a simple row. */
  arranged: boolean;
}

export const MAX_COMPOSITION_TILES = 6;

export function buildComposition(services: App[], apps: App[]): Composition {
  const appById = new Map(apps.map((a) => [a.id, a]));
  const linkedIds: string[] = [];
  for (const service of services) {
    if (service.linkedAppId && !linkedIds.includes(service.linkedAppId)) linkedIds.push(service.linkedAppId);
  }
  const appTiles: CompositionTile[] = linkedIds.map((id) => ({
    id,
    name: appById.get(id)?.name ?? FAMILY_MARKS[id]?.label ?? id,
    sublabel: 'App · you run it',
    kind: 'app',
  }));
  const serviceTiles: CompositionTile[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    sublabel: `Service · ${serviceStatus(service)}`,
    kind: 'service',
  }));
  const all = [...appTiles, ...serviceTiles];
  const arranged = appTiles.length === 1 && serviceTiles.length === 2;
  return { tiles: all.slice(0, MAX_COMPOSITION_TILES), arranged };
}

export type ServicesLayout = 'empty' | 'panels' | 'grid';

/** Panels for one to four services, the card grid from five up. */
export function servicesLayout(count: number): ServicesLayout {
  if (count <= 0) return 'empty';
  return count <= 4 ? 'panels' : 'grid';
}
