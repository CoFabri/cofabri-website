import React from 'react';
import { Metadata } from 'next';
import AppsPageContent from '@/components/marketing/AppsPageContent';

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

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppsPageContent />
    </div>
  );
}
