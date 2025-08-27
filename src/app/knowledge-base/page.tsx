import { Suspense } from 'react';
import { Metadata } from 'next';
import GradientHeading from '@/components/ui/GradientHeading';
import KnowledgeBaseContent from './KnowledgeBaseContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Find answers to common questions and learn how to use our products. Comprehensive documentation and guides for all CoFabri applications.',
  keywords: ['knowledge base', 'help', 'documentation', 'guides', 'FAQ', 'support', 'tutorials'],
  alternates: {
    canonical: 'https://cofabri.com/knowledge-base',
  },
  openGraph: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our products.',
    url: 'https://cofabri.com/knowledge-base',
  },
  twitter: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our products.',
  },
};

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <KnowledgeBaseContent />
    </Suspense>
  );
} 