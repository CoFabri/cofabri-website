import { Suspense } from 'react';
import { Metadata } from 'next';
import RoadmapsContent from './RoadmapsContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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

export default function RoadmapsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <RoadmapsContent />
    </Suspense>
  );
}
