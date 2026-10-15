import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import HomepageApps from '@/components/marketing/HomepageApps';
import CoBuildSection from '@/components/marketing/CoBuildSection';
import About from '@/components/marketing/About';
import CompactRoadmap from '@/components/marketing/CompactRoadmap';
import FAQ from '@/components/marketing/FAQ';
import LiveChat from '@/components/marketing/LiveChat';
import HomeContent from '@/components/marketing/HomeContent';
import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/site-metadata';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Generate metadata for the homepage
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: 'https://cofabri.com/',
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
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
    },
  };
}

export default function Home() {
  return (
    <Suspense fallback={
      <main>
        <Hero />
        <HomepageApps />
        <CoBuildSection />
        <About />
        <CompactRoadmap />
        <FAQ />
        <LiveChat />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
