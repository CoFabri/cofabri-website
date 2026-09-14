// src/components/developer-portal/AppGrid.tsx

import Link from 'next/link';
import { fetchMyApps } from '@/lib/developer-portal/fetch-my-apps';
import { AppCard } from './AppCard';

function EmptyState() {
  return (
    <div className="mt-5 rounded-2xl border border-border py-13 text-center">
      <div className="mx-auto mb-4.5 flex size-11 items-center justify-center rounded-[10px] border border-border font-mono text-base text-muted-foreground">
        {'{ }'}
      </div>
      <div className="text-[17px] font-semibold text-foreground">No app access yet</div>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-snug text-muted-foreground">
        Your account isn&apos;t attached to any CoFabri app. Once someone adds you, the app shows up here with its API
        docs.
      </p>
      <Link
        href="/apps"
        className="mt-4.5 inline-block rounded-lg border border-border-strong px-5 py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:border-muted-foreground"
      >
        Browse the apps
      </Link>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/5 py-13 text-center">
      <div className="mx-auto mb-4.5 flex size-11 items-center justify-center rounded-[10px] border border-destructive/25 bg-card text-lg font-semibold text-destructive">
        !
      </div>
      <div className="text-[17px] font-semibold text-destructive">Couldn&apos;t load your app list</div>
      <p className="mx-auto mt-2 max-w-[440px] text-[15px] leading-snug text-destructive/80">
        This one&apos;s on us, not your account — nothing about your access has changed. Try again in a moment.
      </p>
      <Link
        href="/developers"
        className="mt-4.5 inline-block rounded-lg bg-destructive px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-destructive/90"
      >
        Try again
      </Link>
      <div className="mt-3.5 text-sm text-destructive/80">
        Still stuck?{' '}
        <Link href="/support" className="font-semibold underline">
          Contact support
        </Link>
        .
      </div>
    </div>
  );
}

export async function AppGrid({ accessToken }: { accessToken: string }) {
  const result = await fetchMyApps(accessToken);

  if (!result.ok) {
    return (
      <div className="mt-8.5">
        <div className="flex min-h-11 items-center justify-between gap-6 border-b border-border pb-5">
          <div className="font-mono text-xs uppercase tracking-[.06em] text-muted-foreground">
            Apps you can access
          </div>
        </div>
        <ErrorState />
      </div>
    );
  }

  const { apps } = result;

  return (
    <div className="mt-8.5">
      <div className="flex min-h-11 items-center justify-between gap-6 border-b border-border pb-5">
        <div className="font-mono text-xs uppercase tracking-[.06em] text-muted-foreground">
          Apps you can access <span className="text-muted-foreground/70">/</span> {apps.length}
        </div>
      </div>

      {apps.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppCard key={app.appId} app={app} />
            ))}
          </div>
          <div className="mt-6.5 flex items-center gap-2.5 border-t border-border/70 pt-4 text-sm text-muted-foreground">
            <span className="font-mono text-[11px] uppercase tracking-[.08em]">Note</span>
            <span>Docs open on the app&apos;s own site. If an app turns you away there, request access from inside that app.</span>
          </div>
        </>
      )}
    </div>
  );
}
