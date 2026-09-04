import React from 'react';
import { Metadata } from 'next';
import TeamPageContent from '@/components/marketing/TeamPageContent';
import { getTeam } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Our Team',
  description: 'The people building CoFabri — one studio, every industry.',
  openGraph: {
    title: 'Our Team | CoFabri',
    description: 'The people building CoFabri — one studio, every industry.',
    url: 'https://cofabri.com/team',
    images: [
      {
        url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoFabri Team',
      },
    ],
  },
  twitter: {
    title: 'Our Team | CoFabri',
    description: 'The people building CoFabri — one studio, every industry.',
  },
  alternates: {
    canonical: '/team',
  },
};

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div className="min-h-screen bg-background">
      <TeamPageContent team={team} />
    </div>
  );
}
