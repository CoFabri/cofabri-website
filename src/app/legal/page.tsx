import { Suspense } from 'react';
import GradientHeading from '@/components/ui/GradientHeading';
import LegalDocumentsContent from './LegalDocumentsContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function LegalDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <GradientHeading
          title="Legal Documents"
          subtitle="Loading..."
        />
      </div>
    }>
      <LegalDocumentsContent />
    </Suspense>
  );
} 