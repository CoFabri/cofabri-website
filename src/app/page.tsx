import React from 'react';
import Hero from '@/components/ui/Hero';
import HomepageApps from '@/components/ui/HomepageApps';
import About from '@/components/ui/About';
import Testimonials from '@/components/ui/Testimonials';
import HomepageBlogPreview from '@/components/ui/HomepageBlogPreview';
import CompactRoadmap from '@/components/ui/CompactRoadmap';
import FAQ from '@/components/ui/FAQ';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import LiveChat from '@/components/ui/LiveChat';

export default function Home() {
  return (
    <main>
      <Hero />
      <HomepageApps />
      <About />
      <Testimonials />
      <HomepageBlogPreview />
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
