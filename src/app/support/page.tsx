import { Suspense } from 'react';
import { Metadata } from 'next';
import SupportPageContent from './SupportPageContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with any CoFabri app. Real people reply within one business day.',
  keywords: ['support', 'help', 'contact support', 'submit a ticket'],
  alternates: {
    canonical: '/support',
  },
  openGraph: {
    title: 'Support | CoFabri',
    description: 'Get help with any CoFabri app. Real people reply within one business day.',
    url: 'https://cofabri.com/support',
  },
  twitter: {
    title: 'Support | CoFabri',
    description: 'Get help with any CoFabri app. Real people reply within one business day.',
  },
};

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  );
}
