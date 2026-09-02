import { Suspense } from 'react';
import { CoreLoader } from '@/components/ui/core-loader';
import LegalDocumentsContent from './LegalDocumentsContent';
import { metadata } from './metadata';

// Export metadata
export { metadata };

export default function LegalDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CoreLoader size={52} />
      </div>
    }>
      <LegalDocumentsContent />
    </Suspense>
  );
} 