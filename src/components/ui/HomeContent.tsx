'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '@/components/ui/Hero';
import HomepageApps from '@/components/ui/HomepageApps';
import About from '@/components/ui/About';
import Testimonials from '@/components/ui/Testimonials';
import CompactRoadmap from '@/components/ui/CompactRoadmap';
import FAQ from '@/components/ui/FAQ';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import LiveChat from '@/components/ui/LiveChat';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  const [appsLoaded, setAppsLoaded] = useState(false);

  useEffect(() => {
    if (searchParams?.get('cache-cleared') === 'true') {
      setShowCacheCleared(true);
      setTimeout(() => setShowCacheCleared(false), 5000);
    }
  }, [searchParams]);

  // Handle anchor links after apps are loaded
  useEffect(() => {
    if (appsLoaded && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#about') {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
          const element = document.getElementById('about');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [appsLoaded]);

  return (
    <main>
      {showCacheCleared && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">✅ Cache cleared successfully! Hydration issues should be resolved.</p>
        </div>
      )}
      <Hero />
      <HomepageApps onAppsLoaded={() => setAppsLoaded(true)} />
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
  );
}
