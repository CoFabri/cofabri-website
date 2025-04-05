'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Banner {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: {
    text: string;
    url: string;
  };
  isActive: boolean;
}

export default function SitewideBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanner() {
      try {
        const response = await fetch('/api/banners');
        if (!response.ok) throw new Error('Failed to fetch banner');
        const data = await response.json();
        if (data && data.isActive) {
          setBanner(data);
        }
      } catch (err) {
        console.error('Error fetching banner:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch banner');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBanner();
  }, []);

  if (isLoading) {
    return null;
  }

  if (error || !banner) {
    return null;
  }

  const getBannerStyles = () => {
    switch (banner.type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`relative ${getBannerStyles()} border-b`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium">{banner.message}</p>
            {banner.link && (
              <a
                href={banner.link.url}
                className="ml-2 text-sm font-medium underline hover:text-opacity-80"
              >
                {banner.link.text}
              </a>
            )}
          </div>
          <button
            type="button"
            className="flex items-center justify-center p-1 rounded-md hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-current focus:ring-white"
            onClick={() => setBanner(null)}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
} 