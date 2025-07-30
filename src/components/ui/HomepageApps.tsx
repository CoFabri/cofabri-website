'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { App } from '@/lib/airtable';
import confetti from 'canvas-confetti';
import AppPreviewCard from './AppPreviewCard';

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
          {apps.map((app) => (
            <AppPreviewCard key={app.id} app={app} />
          ))}
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