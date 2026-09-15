// src/app/developers/page.tsx

import { Suspense } from 'react';
import { Metadata } from 'next';
import { getDeveloperPortalAccessToken } from '@/lib/developer-portal/session';
import { getDeveloperPortalSigninUrl } from '@/lib/developer-portal/signin-url';
import { AccessStat } from '@/components/developer-portal/AccessStat';
import { AppGrid } from '@/components/developer-portal/AppGrid';
import { AccessStatSkeleton, DirectorySkeleton } from '@/components/developer-portal/DirectorySkeleton';
import { SignedOutHero } from '@/components/developer-portal/SignedOutHero';

export const metadata: Metadata = {
  title: 'Developers',
  description: "API docs for the CoFabri apps you have access to, all in one place.",
  alternates: {
    canonical: '/developers',
  },
};

export default async function DevelopersPage() {
  const accessToken = await getDeveloperPortalAccessToken();

  if (!accessToken) {
    let signinUrl: string | null = null;
    try {
      signinUrl = getDeveloperPortalSigninUrl();
    } catch {
      signinUrl = null;
    }
    return <SignedOutHero signinUrl={signinUrl} />;
  }

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
          <Suspense fallback={<AccessStatSkeleton />}>
            <AccessStat accessToken={accessToken} />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10">
        <Suspense fallback={<DirectorySkeleton />}>
          <AppGrid accessToken={accessToken} />
        </Suspense>
      </div>
    </>
  );
}
