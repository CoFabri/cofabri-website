import React from 'react';
import { Metadata } from 'next';
import AboutPageContent from '@/components/marketing/AboutPageContent';
import { getTeam } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'About',
  description: 'The name, the mark, and the people behind CoFabri — one studio, every industry.',
  openGraph: {
    title: 'About | CoFabri',
    description: 'The name, the mark, and the people behind CoFabri — one studio, every industry.',
    url: 'https://cofabri.com/about',
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
    title: 'About | CoFabri',
    description: 'The name, the mark, and the people behind CoFabri — one studio, every industry.',
  },
  alternates: {
    canonical: '/about',
  },
};

export default async function AboutPage() {
  const team = await getTeam();

  return (
    <div className="min-h-screen bg-background">
      <AboutPageContent team={team} />
    </div>
  );
}
