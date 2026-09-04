import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import RoadmapsContent from './RoadmapsContent';
import { getApps, getRoadmapFeatures } from '@/lib/api-client';
import { hasActiveRoadmap } from '@/lib/app-display';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: "See what's shipping next across the CoFabri suite, what's in progress, and what's been released — updated as it changes.",
  keywords: ['product roadmap', 'release notes', 'changelog', 'upcoming features'],
  alternates: {
    canonical: '/roadmaps',
  },
  openGraph: {
    title: 'Roadmap | CoFabri',
    description: "See what's shipping next across the CoFabri suite, what's in progress, and what's been released.",
    url: 'https://cofabri.com/roadmaps',
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
    title: 'Roadmap | CoFabri',
    description: "See what's shipping next across the CoFabri suite, what's in progress, and what's been released.",
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

export default async function RoadmapsPage() {
  const [allFeatures, apps] = await Promise.all([getRoadmapFeatures(), getApps()]);
  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  // An app with no row in getApps() (retired apps are dropped from that
  // endpoint entirely) or a recognized-but-inactive status shouldn't clutter
  // the public roadmap with commitments for a product no one's working on.
  const activeAppIds = new Set(apps.filter((a) => hasActiveRoadmap(a.status)).map((a) => a.id));
  const features = allFeatures.filter((f) => !f.application || activeAppIds.has(f.application));

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <CoreLoader size={52} />
        </div>
      }
    >
      <RoadmapsContent initialFeatures={features} initialAppNames={appNames} />
    </Suspense>
  );
}
