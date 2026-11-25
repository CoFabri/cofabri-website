import type { App } from '@/lib/api-client';
import { FAMILY_MARKS } from '@/lib/family-marks';
import { resolveServiceContent } from './index';

// Which apps a service runs on. A service can run on several (CoFabri Marketing runs on CoFabri CRM
// and Medoura). The list lives in the service's page data (apps.metadata.service.runsOn), because
// apps.linked_app_id holds a single app; that one stays the primary and is the fallback.

export interface RunsOnApp {
  id: string;
  name: string;
  faviconUrl?: string;
}

/** The app_ids a service runs on, primary first, without repeats. */
export function runsOnIds(service: Pick<App, 'id' | 'service' | 'linkedAppId'>): string[] {
  const fromContent = resolveServiceContent(service)?.runsOn ?? [];
  const ids = fromContent.length > 0 ? fromContent : service.linkedAppId ? [service.linkedAppId] : [];
  return ids.filter((id, i) => ids.indexOf(id) === i);
}

/**
 * The apps to show on a "Runs on" line: names and favicons from the apps Core lists, falling back
 * to a CoFabri product's own name. An app that is neither listed nor a CoFabri product is left out
 * rather than shown by its raw id.
 */
export function resolveRunsOn(service: Pick<App, 'id' | 'service' | 'linkedAppId'>, apps: Pick<App, 'id' | 'name' | 'faviconUrl'>[]): RunsOnApp[] {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const out: RunsOnApp[] = [];
  for (const id of runsOnIds(service)) {
    const app = byId.get(id);
    if (app) out.push({ id, name: app.name, faviconUrl: app.faviconUrl });
    else if (FAMILY_MARKS[id]) out.push({ id, name: FAMILY_MARKS[id].label });
  }
  return out;
}

/** The services that run on an app, in the order given. */
export function servicesRunningOn<T extends Pick<App, 'id' | 'service' | 'linkedAppId'>>(services: T[], appId: string): T[] {
  return services.filter((service) => runsOnIds(service).includes(appId));
}

/**
 * Where a service's Managed card goes on /apps: right after the first app it runs on that is
 * listed there, once (not under every app it runs on). Undefined if none of them is listed.
 */
export function placeAfterApp(service: Pick<App, 'id' | 'service' | 'linkedAppId'>, listedAppIds: string[]): string | undefined {
  return runsOnIds(service).find((id) => listedAppIds.includes(id));
}
