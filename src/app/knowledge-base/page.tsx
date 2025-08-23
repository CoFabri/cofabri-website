import { Suspense } from 'react';
import GradientHeading from '@/components/ui/GradientHeading';
import KnowledgeBaseContent from './KnowledgeBaseContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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