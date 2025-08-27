import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Hero from '@/components/ui/Hero';
import HomepageApps from '@/components/ui/HomepageApps';
import About from '@/components/ui/About';
import Testimonials from '@/components/ui/Testimonials';
import CompactRoadmap from '@/components/ui/CompactRoadmap';
import FAQ from '@/components/ui/FAQ';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import LiveChat from '@/components/ui/LiveChat';
import HomeContent from '@/components/ui/HomeContent';

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
        <About />
        <Testimonials />
        <CompactRoadmap />
        <FAQ />
        <section className="py-20 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="container mx-auto px-4">
            <NewsletterSignup />
          </div>
        </section>
        <LiveChat />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
