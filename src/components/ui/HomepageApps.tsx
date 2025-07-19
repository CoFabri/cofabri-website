'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { App } from '@/lib/airtable';
import confetti from 'canvas-confetti';

export default function HomepageApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
        setApps(data.filter((app: App) => app.category !== 'Customer Facing'));
      } catch (err) {
        console.error('Error fetching apps:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch apps');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApps();
  }, []);

  useEffect(() => {
    if (!sectionRef.current || hasTriggeredConfetti || !apps.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredConfetti) {
          // Check if any app launches today
          const today = new Date();
          const hasLaunchToday = apps.some(app => {
            if (!app.launchDate) return false;
            const launchDate = new Date(app.launchDate);
            return (
              launchDate.getDate() === today.getDate() &&
              launchDate.getMonth() === today.getMonth() &&
              launchDate.getFullYear() === today.getFullYear()
            );
          });

          if (hasLaunchToday) {
            // Fire confetti from multiple angles
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                clearInterval(interval);
                return;
              }

              const particleCount = 50 * (timeLeft / duration);

              // Since particles fall down, start a bit higher than random
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
              });
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
              });
            }, 250);
          }
          setHasTriggeredConfetti(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasTriggeredConfetti, apps.length]); // Use apps.length instead of apps array to prevent infinite re-renders

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Latest Apps</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our suite of powerful applications designed to streamline your workflow
          </p>
        </div>

        <div className={`grid gap-8 max-w-6xl mx-auto ${
          apps.length === 1 
            ? 'grid-cols-1 max-w-xl' 
            : apps.length === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {apps.map((app) => {
            const launchDate = app.launchDate ? new Date(app.launchDate) : null;
            const today = new Date();
            const isLaunchingToday = launchDate && (
              launchDate.getDate() === today.getDate() &&
              launchDate.getMonth() === today.getMonth() &&
              launchDate.getFullYear() === today.getFullYear()
            );
            
            return (
              <Link
                key={app.id}
                href={app.url || '#'}
                className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                  isLaunchingToday ? 'ring-2 ring-blue-500 ring-offset-2 animate-pulse' : ''
                }`}
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={app.screenshot || '/images/placeholder.jpg'}
                    alt={app.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      console.error(`Error loading image for ${app.name}:`, e);
                      // Fallback to placeholder
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = '/images/placeholder.jpg';
                    }}
                  />
                  {isLaunchingToday && (
                    <div className="absolute top-0 right-0 mt-4 mr-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white animate-bounce">
                        <span className="mr-1">🚀</span> Launching Today!
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      app.status === 'Live' ? 'text-green-700 bg-green-100' :
                      app.status === 'Beta' ? 'text-purple-700 bg-purple-100' :
                      app.status === 'Alpha' ? 'text-orange-700 bg-orange-100' :
                      app.status === 'Coming Soon' ? 'text-blue-700 bg-blue-100' :
                      'text-gray-700 bg-gray-100'
                    }`}>
                      {app.status}
                    </span>
                    {launchDate && !isLaunchingToday && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        new Date(launchDate) > today
                          ? 'text-yellow-700 bg-yellow-100'
                          : 'text-green-700 bg-green-100'
                      }`}>
                        {new Date(launchDate) > today
                          ? `Launching ${launchDate.toLocaleDateString()}`
                          : `Launched ${launchDate.toLocaleDateString()}`
                        }
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                    {app.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {app.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {app.feature1 && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        {app.feature1}
                      </span>
                    )}
                    {app.feature2 && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        {app.feature2}
                      </span>
                    )}
                    {app.feature3 && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        {app.feature3}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Apps Button */}
        <div className="mt-12 text-center">
          <Link
            href="/apps"
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            View All Apps
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
} 