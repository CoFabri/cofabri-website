import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the CoFabri team for any questions, support, or partnership opportunities. We\'re here to help you succeed with our SaaS applications.',
  keywords: ['contact', 'support', 'help', 'customer service', 'business inquiry', 'partnership'],
  openGraph: {
    title: 'Contact Us | CoFabri',
    description: 'Get in touch with the CoFabri team for any questions, support, or partnership opportunities.',
    url: 'https://cofabri.com/contact',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact CoFabri Team',
      },
    ],
  },
  twitter: {
    title: 'Contact Us | CoFabri',
    description: 'Get in touch with the CoFabri team for any questions, support, or partnership opportunities.',
  },
  alternates: {
    canonical: '/contact',
  },
};
