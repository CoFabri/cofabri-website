import type { App } from '@/lib/api-client';
import { isService } from '@/lib/api-client';
import { SERVICE_FALLBACKS } from './fallback';
import { parseServiceContent, type ServiceContent } from './schema';

export { parseServiceContent, type ServiceContent } from './schema';
export { isService };

export type ServiceStatus = 'Live' | 'Coming soon';

// Core writes "In Development" to lifecycle_stage for status = development.
// On the public site a service in development reads "Coming soon"; anything
// else (Live, Active, Beta, or an unrecognised value) reads "Live".
export function serviceStatus(app: Pick<App, 'status'>): ServiceStatus {
  return app.status === 'In Development' ? 'Coming soon' : 'Live';
}

export function isComingSoon(app: Pick<App, 'status'>): boolean {
  return serviceStatus(app) === 'Coming soon';
}

/**
 * The copy for a service page: Core's metadata when it parses, otherwise the
 * repo fallback for that app id, otherwise null (the page then shows only the
 * hero built from the app's own description).
 */
export function resolveServiceContent(app: Pick<App, 'id' | 'service'>): ServiceContent | null {
  return parseServiceContent(app.service) ?? SERVICE_FALLBACKS[app.id] ?? null;
}

/** One-line card text: the content's cardLine, else its outcome, else the app description. */
export function serviceCardLine(app: Pick<App, 'id' | 'service' | 'description'>): string {
  const content = resolveServiceContent(app);
  return content?.cardLine ?? content?.outcome ?? app.description ?? '';
}

// Wrapper class that sets the per-page brand accent (see globals.css). Pages
// for any other app get no class and keep the site accent.
const BRAND_CLASS: Record<string, string> = {
  'cofabri-crm': 'br-crm',
  'cofabri-marketing': 'br-marketing',
  'cofabri-concierge': 'br-concierge',
};

export function brandClass(appId: string | undefined): string {
  return (appId && BRAND_CLASS[appId]) || '';
}
