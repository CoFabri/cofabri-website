'use client';

import React, { useEffect, useState } from 'react';
import { App } from '@/lib/airtable';
import AppPreviewCard from './AppPreviewCard';
import AppsCelebration from './AppsCelebration';

const MAX_APPS = 6;

export default function Apps() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApps() {
      try {
        const response = await fetch('/api/apps', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch apps');
        const data = await response.json();
        // Limit the number of apps to MAX_APPS
        setApps(data.slice(0, MAX_APPS));
      } catch (err) {
        console.error('Error fetching apps:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch apps');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApps();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Error</h2>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  // Determine grid columns based on number of apps
  const getGridCols = () => {
    if (apps.length === 1) return 'grid-cols-1';
    if (apps.length === 2) return 'md:grid-cols-2';
    return 'md:grid-cols-2 lg:grid-cols-3';
  };

  // Determine max width based on number of apps
  const getMaxWidth = () => {
    // Remove max-width constraints to match FeaturedApp width
    return '';
  };

  return (
    <>
      <div className={`grid ${getGridCols()} gap-8 ${getMaxWidth()} mx-auto`}>
        {/* Airtable Apps */}
        {apps.map((app) => (
          <AppPreviewCard key={app.id} app={app} />
        ))}
      </div>
      <AppsCelebration apps={apps} />
    </>
  );
} 