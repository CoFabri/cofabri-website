import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import PartnersPageContent from '@/components/marketing/PartnersPageContent';
import { getKnowledgeBaseArticles } from '@/lib/api-client';
import { pickCoBuildComparisons } from '@/lib/kb-links';

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
    canonical: '/co-build',
  },
  openGraph: {
    title: 'Co-Build | CoFabri',
    description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
    url: 'https://cofabri.com/co-build',
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

export default async function CoBuildPage() {
  const comparisons = pickCoBuildComparisons(await getKnowledgeBaseArticles());

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
          </div>
        }
      >
        <PartnersPageContent />
      </Suspense>
      {comparisons.length > 0 && (
        <nav aria-label="Knowledge base" className="mx-auto max-w-[1200px] px-6 pb-24 sm:px-10">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {comparisons.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/knowledge-base/${article.slug}`}
                  className="border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {article.title} →
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
