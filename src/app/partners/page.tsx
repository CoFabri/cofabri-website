import { Suspense } from 'react';
import { Metadata } from 'next';
import PartnersPageContent from '@/components/marketing/PartnersPageContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Co-Build',
  description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
  // Keywords chosen against the venture-studio / technical-co-founder search
  // space, not generic "partnership" terms — see the 2026-09-02 SEO strategy
  // doc's Co-Build section for the full reasoning and competitive framing.
  keywords: [
    'co-build a SaaS product',
    'software development partnership',
    'equity partnership software',
    'partner with a software studio',
    'technical co-founder alternative',
    'industry partner',
  ],
  alternates: {
    canonical: '/partners',
  },
  openGraph: {
    title: 'Co-Build | CoFabri',
    description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
    url: 'https://cofabri.com/partners',
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
    title: 'Co-Build | CoFabri',
    description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <PartnersPageContent />
    </Suspense>
  );
}
