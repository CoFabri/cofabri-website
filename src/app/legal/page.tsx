import { Suspense } from 'react';
import { Metadata } from 'next';
import LegalDocumentsContent from './LegalDocumentsContent';
import { metadata } from './metadata';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Export metadata
export { metadata };

export default function LegalDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <LegalDocumentsContent />
    </Suspense>
  );
} 