import type { App } from '@/lib/api-client';
import { serviceStatus } from './index';

// The tiles in the /services hero: every visible service, from Core. Apps are not shown
// here: CoFabri CRM and the other apps are apps, and live on /apps; a service's "Runs on"
// line says which app it runs on.

export interface CompositionTile {
  id: string;
  name: string;
  /** Mono sublabel under the name. */
  sublabel: string;
  kind: 'service';
}

export interface Composition {
  tiles: CompositionTile[];
  /** The designed arrangement: exactly two services, one large and one smaller. Anything else is a simple row. */
  arranged: boolean;
}

export const MAX_COMPOSITION_TILES = 6;

export function buildComposition(services: App[]): Composition {
  const tiles: CompositionTile[] = services.slice(0, MAX_COMPOSITION_TILES).map((service) => ({
    id: service.id,
    name: service.name,
    sublabel: `Service · ${serviceStatus(service)}`,
    kind: 'service',
  }));
  return { tiles, arranged: services.length === 2 };
}

export type ServicesLayout = 'empty' | 'panels' | 'grid';

/** Panels for one to four services, the card grid from five up. */
export function servicesLayout(count: number): ServicesLayout {
  if (count <= 0) return 'empty';
  return count <= 4 ? 'panels' : 'grid';
}
