// src/app/developers/page.tsx
//
// Public, no sign-in required. The old gate here (central session cookie,
// SignedOutHero) protected the index page, but not the actual content --
// every app that publishes real docs wants them found (that's the point of
// a partner API), so once a doc is public at its own domain, gating this
// index in front of it was security through obscurity, not real access
// control (real access control is each app's own API keys). Uses the same
// public content API the marketing /apps page reads (getApps), now that
// apps.documentation is exposed on it.
import { Metadata } from 'next';
import { getApps } from '@/lib/api-client';
import { AppCard } from '@/components/developer-portal/AppCard';
import type { DeveloperPortalApp } from '@/lib/developer-portal/types';

export const metadata: Metadata = {
  title: 'Developers',
  description: "API docs for CoFabri's apps, all in one place.",
  alternates: {
    canonical: '/developers',
  },
};

function toDirectoryApp(app: Awaited<ReturnType<typeof getApps>>[number]): DeveloperPortalApp {
  return {
    appId: app.id,
    appName: app.name,
    logoUrl: null,
    faviconUrl: app.faviconUrl ?? null,
    appUrl: app.url ?? null,
    description: app.description ?? null,
    apiDocsUrl: app.documentation ?? null,
  };
}

export default async function DevelopersPage() {
  const apps = (await getApps()).map(toDirectoryApp);
  const withDocs = apps.filter((a) => a.apiDocsUrl).length;

  return (
    <>
      <div className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-10 px-6 pt-20 pb-14 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[660px]">
            <div className="mb-5.5 flex items-center gap-2.5">
              <span className="h-px w-5.5 bg-border-strong" aria-hidden="true" />
              <span className="font-mono text-xs font-medium uppercase tracking-[.1em] text-muted-foreground">
                Developer portal
              </span>
            </div>
            <h1 className="text-[34px] font-semibold leading-[1.06] tracking-tight text-balance sm:text-[48px]">
              Every app&apos;s API reference, in one place.
            </h1>
            <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-muted-foreground">
              Each CoFabri app publishes its own API docs. This is the index — pick an app and we&apos;ll send you
              straight to its reference.
            </p>
          </div>
          <div className="w-[300px] shrink-0 rounded-xl border border-border bg-card p-5">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[.09em] text-muted-foreground">
              CoFabri apps
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold tracking-tight text-foreground">{apps.length}</span>
              <span className="text-[15px] text-muted-foreground">{apps.length === 1 ? 'app' : 'apps'}</span>
            </div>
            <div className="mt-3.5 border-t border-border/70 pt-3.5 text-sm leading-snug text-muted-foreground">
              {withDocs} {withDocs === 1 ? 'publishes' : 'publish'} API docs today.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-16 sm:px-10 sm:pt-14">
        <div className="flex items-center justify-between gap-6 border-b border-border pb-5">
          <div className="font-mono text-xs uppercase tracking-[.06em] text-muted-foreground">
            Apps <span className="text-muted-foreground/70">/</span> {apps.length}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.appId} app={app} />
          ))}
        </div>
        <div className="mt-6.5 flex items-center gap-2.5 border-t border-border/70 pt-4 text-sm text-muted-foreground">
          <span className="font-mono text-[11px] uppercase tracking-[.08em]">Note</span>
          <span>Docs open on the app&apos;s own site. Using an API requires that app&apos;s own credentials.</span>
        </div>
      </div>
    </>
  );
}
