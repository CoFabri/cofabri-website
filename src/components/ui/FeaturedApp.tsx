'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { App } from '@/lib/airtable';

export default function FeaturedApp() {
  const [featuredApp, setFeaturedApp] = useState<App | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApps() {
      try {
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error('Failed to fetch apps');
        const data = await response.json();
        const featured = data.find((app: App) => app.featureOnWebsite);
        setFeaturedApp(featured || null);
      } catch (err) {
        console.error('Error fetching featured app:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured app');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApps();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
          <div className="relative bg-white rounded-3xl p-8 md:p-12">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-full bg-gray-200 rounded mb-6"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !featuredApp) {
    return null;
  }

  return (
    <div className="mb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
        <div className="relative bg-white rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-500">Featured App</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {featuredApp.name}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {featuredApp.description}
              </p>
              <Link
                href={featuredApp.url || '#'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors duration-200"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                Learn More
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                {featuredApp.screenshot && (
                  <img
                    src={typeof featuredApp.screenshot === 'string' ? featuredApp.screenshot : featuredApp.screenshot[0]?.url}
                    alt={featuredApp.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 