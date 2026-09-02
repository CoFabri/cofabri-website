'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { App } from '@/lib/api-client';
import confetti from 'canvas-confetti';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import AppPreviewCard from './AppPreviewCard';

interface HomepageAppsProps {
  onAppsLoaded?: () => void;
}

export default function HomepageApps({ onAppsLoaded }: HomepageAppsProps) {
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
        if (onAppsLoaded) {
          onAppsLoaded();
        }
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
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevealSection ref={sectionRef} className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Our Apps"
          title="Latest Apps"
          subtitle="Discover our suite of powerful applications designed to streamline your workflow"
        />

        <div className={`grid gap-8 mx-auto ${
          apps.length === 1
            ? 'grid-cols-1'
            : apps.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {apps.map((app) => (
            <AppPreviewCard key={app.id} app={app} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/apps">
              View All Apps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}
