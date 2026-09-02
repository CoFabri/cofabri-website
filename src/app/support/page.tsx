import { Suspense } from 'react';
import { Metadata } from 'next';
import { CoreLoader } from '@/components/ui/core-loader';
import SupportPageContent from './SupportPageContent';

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
    title: 'Support | CoFabri',
    description: 'Get help with any CoFabri app. Real people reply within one business day.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <CoreLoader size={52} />
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  );
}
