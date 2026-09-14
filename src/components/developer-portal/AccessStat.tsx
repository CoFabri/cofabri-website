// src/components/developer-portal/AccessStat.tsx

import { fetchMyApps } from '@/lib/developer-portal/fetch-my-apps';

export async function AccessStat({ accessToken }: { accessToken: string }) {
  const result = await fetchMyApps(accessToken);
  if (!result.ok) {
    // The grid below renders the real error state; this card just stays quiet.
    return null;
  }

  const total = result.apps.length;
  const withDocs = result.apps.filter((app) => app.apiDocsUrl).length;

  return (
    <div className="w-[300px] shrink-0 rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[.09em] text-muted-foreground">
        Your access
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[32px] font-semibold tracking-tight text-foreground">{total}</span>
        <span className="text-[15px] text-muted-foreground">{total === 1 ? 'app' : 'apps'}</span>
      </div>
      <div className="mt-3.5 border-t border-border/70 pt-3.5 text-sm leading-snug text-muted-foreground">
        {withDocs} {withDocs === 1 ? 'publishes' : 'publish'} API docs today. Access is granted inside each app, not here.
      </div>
    </div>
  );
}
