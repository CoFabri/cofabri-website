// src/components/developer-portal/AppCard.tsx

import type { DeveloperPortalApp } from '@/lib/developer-portal/types';
import { AppMonogram } from './AppMonogram';

function hostFor(appUrl: string | null): string | null {
  if (!appUrl) return null;
  try {
    return new URL(appUrl).hostname;
  } catch {
    return null;
  }
}

export function AppCard({ app }: { app: DeveloperPortalApp }) {
  const host = hostFor(app.appUrl);
  const hasDocs = Boolean(app.apiDocsUrl);

  return (
    <div
      className={`flex min-h-[234px] flex-col rounded-2xl border p-6 ${
        hasDocs ? 'border-border bg-card' : 'border-border/60 bg-muted/40'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <AppMonogram appId={app.appId} appName={app.appName} logoUrl={app.logoUrl} faviconUrl={app.faviconUrl} />
        <div className="min-w-0">
          <div className="text-[19px] font-semibold tracking-tight text-foreground">{app.appName}</div>
          {host ? <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{host}</div> : null}
        </div>
      </div>

      {app.description ? (
        <p className={`mt-4 text-[15px] leading-snug ${hasDocs ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
          {app.description}
        </p>
      ) : null}

      <div className="flex-1 min-h-[18px]" />

      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        {hasDocs ? (
          <a
            href={app.apiDocsUrl!}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
          >
            View API Docs
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-border-strong" aria-hidden="true" />
            No API docs yet
          </span>
        )}
      </div>
    </div>
  );
}
