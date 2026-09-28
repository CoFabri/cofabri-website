import NotFoundContent, { type NotFoundIncident } from '@/components/marketing/NotFoundContent';
import { getApps, getKnowledgeBaseArticles } from '@/lib/api-client';
import { hasActiveRoadmap } from '@/lib/app-display';
import { matchAppIncident, mostSevereIncident } from '@/lib/incident-display';
import { getSystemStatus } from '@/lib/status-api';

// A 404 should never fail for want of data: each fetch already resolves to []
// on error, so a down API just yields the plain page without lists.
export default async function NotFound() {
  const [allApps, allArticles, statuses] = await Promise.all([
    getApps(),
    getKnowledgeBaseArticles(),
    getSystemStatus(),
  ]);

  const apps = allApps.filter((a) => hasActiveRoadmap(a.status));
  // The client component ships to the browser, and article bodies are large.
  const articles = allArticles.map((a) => ({ ...a, content: '' }));

  const degradedAppIds = apps.filter((a) => matchAppIncident(a.id, statuses)).map((a) => a.id);
  // Degraded apps sort first so they survive the client's cap on the visible list.
  apps.sort((a, b) => Number(degradedAppIds.includes(b.id)) - Number(degradedAppIds.includes(a.id)));

  // Only say something when it plausibly explains the broken link: a
  // platform-wide incident, or one tied to specific apps. A vendor blip that
  // touches no app isn't worth a line on a 404.
  const open = mostSevereIncident(statuses);
  const appNames = open ? apps.filter((a) => open.affectedAppIds.includes(a.id)).map((a) => a.name) : [];
  const incident: NotFoundIncident | null =
    open && (open.isPlatformWide || appNames.length > 0)
      ? { appNames: open.isPlatformWide ? [] : appNames }
      : null;

  return <NotFoundContent apps={apps} articles={articles} degradedAppIds={degradedAppIds} incident={incident} />;
}
