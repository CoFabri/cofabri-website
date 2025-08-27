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
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Legal Documents',
      },
    ],
  },
  twitter: {
    title: 'Legal Documents | CoFabri',
    description: 'Access our comprehensive collection of legal documents including privacy policies, terms of service, and cookie policies.',
  },
  alternates: {
    canonical: 'https://cofabri.com/legal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
