'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';
import { usePathname } from 'next/navigation';

interface Banner {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: {
    text: string;
    url: string;
  };
  isActive: boolean;
  position?: 'Top' | 'Bottom';
  priority?: number;
  backgroundColor?: string;
  textColor?: string;
}

// Track number of requests
let requestCount = 0;
const fetcher = async (url: string) => {
  requestCount++;
  console.log(`Banner request #${requestCount}`);
  const res = await fetch(url);
  return res.json();
};

export default function SitewideBanner() {
  const { data: banners, error, isLoading } = useSWR<Banner[]>('/api/banners', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // 5 minutes
  });

  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isVisible, setIsVisible] = React.useState(!isHomePage);
  const [dismissedBanners, setDismissedBanners] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Load dismissed banners from localStorage
    const dismissed = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('banner-') && key.endsWith('-dismissed')) {
        dismissed.add(key.replace('banner-', '').replace('-dismissed', ''));
      }
    }
    setDismissedBanners(dismissed);
  }, []);

  React.useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8;
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  if (isLoading || error || !banners || !Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  // Find the most appropriate banner that hasn't been dismissed
  const activeBanners = banners.filter(banner => 
    banner.isActive && 
    banner.position === 'Top' && 
    !dismissedBanners.has(banner.id)
  );
  
  if (activeBanners.length === 0) {
    return null;
  }

  // Sort by priority (highest first) and take the first one
  const banner = activeBanners.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

  const getBannerStyles = () => {
    const type = (banner.type || '').toLowerCase();
    const bgColor = banner.backgroundColor?.toLowerCase() || 'blue';
    const textColor = banner.textColor?.toLowerCase() || 'white';

    // Map background colors
    const bgColorMap: { [key: string]: string } = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-500',
      red: 'bg-red-600',
      purple: 'bg-purple-600',
      gray: 'bg-gray-600',
    };

    // Map text colors
    const textColorMap: { [key: string]: string } = {
      white: 'text-white',
      black: 'text-gray-900',
    };

    return `${bgColorMap[bgColor] || 'bg-blue-600'} ${textColorMap[textColor] || 'text-white'}`;
  };

  return (
    <div 
      className={`fixed top-16 left-0 right-0 ${getBannerStyles()} border-b transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ zIndex: 40 }}
    >
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold tracking-tight">{banner.title}</h3>
              <p className="text-sm font-medium opacity-90">{banner.message}</p>
            </div>
            {banner.link && (
              <a
                href={banner.link.url}
                className="ml-2 text-sm font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              >
                {banner.link.text}
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
          <button
            type="button"
            className="flex items-center justify-center p-1.5 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
            onClick={() => {
              localStorage.setItem(`banner-${banner.id}-dismissed`, 'true');
              setDismissedBanners(prev => new Set([...prev, banner.id]));
            }}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
} 