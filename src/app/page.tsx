import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import HomepageApps from '@/components/marketing/HomepageApps';
import CompactRoadmap from '@/components/marketing/CompactRoadmap';
import FAQ from '@/components/marketing/FAQ';
import LiveChat from '@/components/marketing/LiveChat';
import HomeContent from '@/components/marketing/HomeContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Generate metadata for the homepage
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CoFabri - SaaS Apps for Modern Businesses',
    description: 'Discover our suite of powerful SaaS applications designed to help your business grow and succeed. From productivity tools to AI-powered solutions, we build software that works.',
    alternates: {
      canonical: 'https://cofabri.com/',
    },
    openGraph: {
      title: 'CoFabri - SaaS Apps for Modern Businesses',
      description: 'Discover our suite of powerful SaaS applications designed to help your business grow and succeed.',
      url: 'https://cofabri.com/',
    },
    twitter: {
      title: 'CoFabri - SaaS Apps for Modern Businesses',
      description: 'Discover our suite of powerful SaaS applications designed to help your business grow and succeed.',
    },
  };
}

export default function Home() {
  return (
    <Suspense fallback={
      <main>
        <Hero />
        <HomepageApps />
        <CompactRoadmap />
        <FAQ />
        <LiveChat />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
