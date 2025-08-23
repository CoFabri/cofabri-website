import React from 'react';
import { Metadata } from 'next';
import Apps from '@/components/ui/Apps';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import GradientHeading from '@/components/ui/GradientHeading';
import Link from 'next/link';
import Testimonials from '@/components/ui/Testimonials';
import FeaturedApp from '@/components/ui/FeaturedApp';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Apps',
  description: 'Explore our full collection of SaaS applications designed to enhance your productivity. From productivity tools to AI-powered solutions, find the perfect app for your business needs.',
  keywords: ['SaaS apps', 'productivity tools', 'business software', 'web applications', 'AI tools', 'cloud software'],
  openGraph: {
    title: 'Our Apps | CoFabri',
    description: 'Explore our full collection of SaaS applications designed to enhance your productivity.',
    url: 'https://cofabri.com/apps',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Apps Collection',
      },
    ],
  },
  twitter: {
    title: 'Our Apps | CoFabri',
    description: 'Explore our full collection of SaaS applications designed to enhance your productivity.',
  },
  alternates: {
    canonical: '/apps',
  },
};

// Define app categories
const categories = [
  { id: 'all', name: 'All Apps' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'design', name: 'Design' },
  { id: 'development', name: 'Development' },
  { id: 'analytics', name: 'Analytics' }
];

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs items={[{ name: 'Apps', href: '/apps' }]} />
      </div>
      <GradientHeading
        title="Our Apps"
        subtitle="Explore our full collection of applications designed to enhance your productivity."
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">
        {/* Featured App Spotlight */}
        <FeaturedApp />

        {/* Apps Grid */}
        <div className="relative">
          <Apps />
        </div>
      </div>

      {/* Resources & Support Section */}
      <div className="w-full bg-gray-50">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold animated-gradient-text">Resources & Support</h2>
              <p className="mt-4 text-lg text-gray-600">Everything you need to get started and succeed with our apps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <Link href="/roadmaps" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Product Roadmap</h3>
                      <p className="text-gray-600 mt-1">See what's coming next and vote on future features</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/knowledge-base" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-100">
                      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Knowledge Base</h3>
                      <p className="text-gray-600 mt-1">Find guides, tutorials, and answers to common questions</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Testimonials Section */}
      {/* To filter testimonials by app, pass appId: <Testimonials appId={appId} /> */}
      <Testimonials />

      {/* Newsletter Section */}
      <div className="container mx-auto px-4">
        <section className="mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 py-20">
            <div className="container mx-auto px-4">
              <NewsletterSignup />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 