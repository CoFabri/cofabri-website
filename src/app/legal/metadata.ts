import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Documents',
  description: 'Access our comprehensive collection of legal documents including privacy policies, terms of service, and cookie policies. All documents are regularly updated to ensure compliance.',
  keywords: ['legal documents', 'privacy policy', 'terms of service', 'cookie policy', 'legal compliance', 'terms and conditions'],
  openGraph: {
    title: 'Legal Documents | CoFabri',
    description: 'Access our comprehensive collection of legal documents including privacy policies, terms of service, and cookie policies.',
    url: 'https://cofabri.com/legal',
    images: [
      {
        url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoFabri Legal Documents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Documents | CoFabri',
    description: 'Access our comprehensive collection of legal documents including privacy policies, terms of service, and cookie policies.',
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
  alternates: {
    canonical: 'https://cofabri.com/legal',
  },
  // Policy text is reference material, not a search landing page: reachable, not indexed.
  robots: { index: false, follow: true },
};
