import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Find answers to common questions and learn how to use our products effectively. Comprehensive guides, tutorials, and troubleshooting resources for all CoFabri applications.',
  keywords: ['knowledge base', 'help center', 'documentation', 'tutorials', 'guides', 'FAQ', 'support', 'how-to'],
  openGraph: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our products effectively.',
    url: 'https://cofabri.com/knowledge-base',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Knowledge Base',
      },
    ],
  },
  twitter: {
    title: 'Knowledge Base | CoFabri',
    description: 'Find answers to common questions and learn how to use our products effectively.',
  },
  alternates: {
    canonical: '/knowledge-base',
  },
};
