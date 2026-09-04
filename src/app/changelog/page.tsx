import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import ChangelogContent from './ChangelogContent';
import { getApps, getRoadmapFeatures } from '@/lib/api-client';
import { hasActiveRoadmap } from '@/lib/app-display';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Released features across the CoFabri suite, most recent first.',
  keywords: ['changelog', 'release notes', "what's new", 'product updates'],
  alternates: {
    canonical: '/changelog',
  },
  openGraph: {
    title: 'Changelog | CoFabri',
    description: 'Released features across the CoFabri suite, most recent first.',
    url: 'https://cofabri.com/changelog',
    images: [
      {
        url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoFabri',
      },
    ],
  },
  twitter: {
    title: 'Changelog | CoFabri',
    description: 'Released features across the CoFabri suite, most recent first.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

export default async function ChangelogPage() {
  const [allFeatures, apps] = await Promise.all([getRoadmapFeatures(), getApps()]);
  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  // An app with no row in getApps() (retired apps are dropped from that
  // endpoint entirely) or a recognized-but-inactive status shouldn't clutter
  // the public changelog with releases for a product no one's working on.
  const activeAppIds = new Set(apps.filter((a) => hasActiveRoadmap(a.status)).map((a) => a.id));
  const shipped = allFeatures.filter(
    (f) => f.status === 'Released' && (!f.application || activeAppIds.has(f.application))
  );

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <CoreLoader size={52} />
        </div>
      }
    >
      <ChangelogContent initialShipped={shipped} initialAppNames={appNames} />
    </Suspense>
  );
}
