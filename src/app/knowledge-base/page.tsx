import { Suspense } from 'react';
import { Metadata } from 'next';
import KnowledgeBaseContent from './KnowledgeBaseContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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
  },
  twitter: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our apps.',
  },
};

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <KnowledgeBaseContent />
    </Suspense>
  );
} 