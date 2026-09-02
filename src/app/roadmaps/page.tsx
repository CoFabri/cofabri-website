import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import RoadmapsContent from './RoadmapsContent';
import { getApps, getRoadmapFeatures } from '@/lib/api-client';

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
  },
  twitter: {
    title: 'Roadmap | CoFabri',
    description: "See what's shipping next across the CoFabri suite, what's in progress, and what's been released.",
  },
};

export default async function RoadmapsPage() {
  const [features, apps] = await Promise.all([getRoadmapFeatures(), getApps()]);
  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));

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
