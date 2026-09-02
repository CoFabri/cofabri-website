import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import KnowledgeBaseContent from './KnowledgeBaseContent';
import { getKnowledgeBaseArticles } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Find answers to common questions and learn how to use our apps. Comprehensive documentation and guides for everything CoFabri builds.',
  keywords: ['knowledge base', 'help', 'documentation', 'guides', 'FAQ', 'support', 'tutorials'],
  alternates: {
    canonical: 'https://cofabri.com/knowledge-base',
  },
  openGraph: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our apps.',
    url: 'https://cofabri.com/knowledge-base',
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
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our apps.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

export default async function KnowledgeBasePage() {
  const articles = await getKnowledgeBaseArticles();

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <CoreLoader size={52} />
      </div>
    }>
      <KnowledgeBaseContent initialArticles={articles} />
    </Suspense>
  );
} 