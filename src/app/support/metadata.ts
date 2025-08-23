import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center',
  description: 'Get help and support for all CoFabri products and services. Access our knowledge base, check system status, and contact our support team.',
  keywords: ['support', 'help', 'customer service', 'technical support', 'troubleshooting', 'documentation', 'contact support'],
  openGraph: {
    title: 'Support Center | CoFabri',
    description: 'Get help and support for all CoFabri products and services.',
    url: 'https://cofabri.com/support',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Support Center',
      },
    ],
  },
  twitter: {
    title: 'Support Center | CoFabri',
    description: 'Get help and support for all CoFabri products and services.',
  },
  alternates: {
    canonical: '/support',
  },
};
