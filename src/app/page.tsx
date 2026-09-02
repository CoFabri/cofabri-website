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

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Generate metadata for the homepage
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CoFabri — We don\'t build platforms. We build answers.',
    description: 'CoFabri is a software studio building a portfolio of focused apps — each one solves a single problem and stays out of your way.',
    alternates: {
      canonical: 'https://cofabri.com/',
    },
    openGraph: {
      title: 'CoFabri — We don\'t build platforms. We build answers.',
      description: 'A software studio building a portfolio of focused apps, each solving a single problem.',
      url: 'https://cofabri.com/',
    },
    twitter: {
      title: 'CoFabri — We don\'t build platforms. We build answers.',
      description: 'A software studio building a portfolio of focused apps, each solving a single problem.',
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
