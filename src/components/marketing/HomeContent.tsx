'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '@/components/marketing/Hero';
import HomepageApps from '@/components/marketing/HomepageApps';
import CoBuildSection from '@/components/marketing/CoBuildSection';
import About from '@/components/marketing/About';
import CompactRoadmap from '@/components/marketing/CompactRoadmap';
import FAQ from '@/components/marketing/FAQ';
import LiveChat from '@/components/marketing/LiveChat';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [showCacheCleared, setShowCacheCleared] = useState(false);

  useEffect(() => {
    if (searchParams?.get('cache-cleared') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- transient banner driven by a query param plus a timed auto-dismiss, not derivable during render
      setShowCacheCleared(true);
      setTimeout(() => setShowCacheCleared(false), 5000);
    }
  }, [searchParams]);

  return (
    <main>
      {showCacheCleared && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">✅ Cache cleared successfully! Hydration issues should be resolved.</p>
        </div>
      )}
      <Hero />
      <HomepageApps />
      <CoBuildSection />
      <About />
      <CompactRoadmap />
      <FAQ />
      <LiveChat />
    </main>
  );
}
