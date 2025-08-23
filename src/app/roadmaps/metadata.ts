import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Roadmaps & Changelog',
  description: 'See what\'s coming next and track our progress in making our apps even better. Stay updated with our latest features, improvements, and development roadmap.',
  keywords: ['product roadmap', 'changelog', 'updates', 'new features', 'development progress', 'release notes', 'future updates'],
  openGraph: {
    title: 'Product Roadmaps & Changelog | CoFabri',
    description: 'See what\'s coming next and track our progress in making our apps even better.',
    url: 'https://cofabri.com/roadmaps',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Product Roadmap',
      },
    ],
  },
  twitter: {
    title: 'Product Roadmaps & Changelog | CoFabri',
    description: 'See what\'s coming next and track our progress in making our apps even better.',
  },
  alternates: {
    canonical: '/roadmaps',
  },
};
