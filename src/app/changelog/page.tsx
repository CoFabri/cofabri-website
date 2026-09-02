import { Suspense } from 'react';
import { Metadata } from 'next';
import ChangelogContent from './ChangelogContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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
  },
  twitter: {
    title: 'Changelog | CoFabri',
    description: 'Released features across the CoFabri suite, most recent first.',
  },
};

export default function ChangelogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <ChangelogContent />
    </Suspense>
  );
}
