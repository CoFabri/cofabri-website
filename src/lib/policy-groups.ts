import type { PolicySummary } from './api-client';

export interface PolicyGroup {
  appId: string;
  appName: string;
  policies: PolicySummary[];
}

const titleCaseId = (id: string) =>
  id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export function groupPoliciesByApp(policies: PolicySummary[], appNames: Record<string, string>): PolicyGroup[] {
  const byApp = new Map<string, PolicySummary[]>();
  for (const policy of policies) {
    for (const appId of policy.apps) {
      byApp.set(appId, [...(byApp.get(appId) ?? []), policy]);
    }
  }
  return [...byApp.entries()]
    .map(([appId, list]) => ({
      appId,
      appName: appNames[appId] ?? titleCaseId(appId),
      policies: [...list].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.appName.localeCompare(b.appName));
}
