import React from 'react';
import Hero from '@/components/ui/Hero';
import Services from '@/components/ui/Services';
import Testimonials from '@/components/ui/Testimonials';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import FAQ from '@/components/ui/FAQ';
import LiveChat from '@/components/ui/LiveChat';
import Blog from '@/components/ui/Blog';
import KnowledgeBase from '@/components/ui/KnowledgeBase';
import Roadmap from '@/components/ui/Roadmap';
import SocialFeeds from '@/components/ui/SocialFeeds';

export default function Home() {
  return (
    <main className="pt-16">
      <Hero />
      <Services />
      <Testimonials />
      <KnowledgeBase />
      <FAQ />
      <Blog />
      <Roadmap />
      <SocialFeeds />
      <NewsletterSignup />
      <LiveChat />
    </main>
  );
}
