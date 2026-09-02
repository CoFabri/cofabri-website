import React from 'react';
import { Metadata } from 'next';
import AppsPageContent from '@/components/marketing/AppsPageContent';
import { getApps, getRoadmapFeatures } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Our Apps',
  description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
  openGraph: {
    title: 'Our Apps | CoFabri',
    description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
    url: 'https://cofabri.com/apps',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Apps Collection',
      },
    ],
  },
  twitter: {
    title: 'Our Apps | CoFabri',
    description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
  },
  alternates: {
    canonical: '/apps',
  },
};

export default async function AppsPage() {
  const [apps, roadmap] = await Promise.all([getApps(), getRoadmapFeatures()]);

  return (
    <div className="min-h-screen bg-background">
      <AppsPageContent initialApps={apps} initialRoadmap={roadmap} />
    </div>
  );
}
