import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preview - Not for Indexing',
  description: 'This is a preview page and should not be indexed by search engines.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  other: {
    'googlebot': 'noindex, nofollow',
  },
};
