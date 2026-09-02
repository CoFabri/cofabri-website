'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { App, RoadmapFeature } from '@/lib/api-client';
import type { SystemStatus } from '@/lib/airtable';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import RevealSection from './RevealSection';
import { statusPillClasses, actionLabel, actionHref } from '@/lib/app-display';

const statusDotClasses = (status: string) => {
  switch (status) {
    case 'Live':
    case 'Active':
      return 'bg-success';
    case 'Beta':
      return 'bg-accent-solid';
    case 'In Development':
      return 'bg-ink-faint';
    default:
      return 'bg-ink-disabled';
  }
};

const MARK_PALETTES = [
  'bg-primary/15 text-primary',
  'bg-accent text-accent-foreground',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-danger/15 text-danger',
];

function markPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MARK_PALETTES[hash % MARK_PALETTES.length];
}

// Interim stand-in for a future apps.tagline field: first sentence of the
// long-form description, truncated to a word boundary.
function deriveTagline(app: App): string | null {
  if (!app.description) return null;
  const firstSentence = app.description.trim().split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '');
  if (firstSentence.length <= 72) return firstSentence;
  const truncated = firstSentence.slice(0, 72);
  return `${truncated.slice(0, truncated.lastIndexOf(' '))}…`;
}

const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;

function appMomentum(app: App, roadmap: RoadmapFeature[]): string {
  const now = Date.now();
  const items = roadmap.filter((item) => item.application === app.id);

  const shippedThisQuarter = items.filter(
    (item) => item.status === 'Released' && item.releasedDate && now - new Date(item.releasedDate).getTime() <= QUARTER_MS
  );
  if (shippedThisQuarter.length > 0) {
    return `${shippedThisQuarter.length} shipped this quarter`;
  }

  const upcoming = items.find((item) => item.status === 'In Progress') ?? items.find((item) => item.status === 'Planned');
  if (upcoming) return `Next: ${upcoming.name}`;

  return '—';
}

interface HomepageAppsProps {
  onAppsLoaded?: () => void;
}

export default function HomepageApps({ onAppsLoaded }: HomepageAppsProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapFeature[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    };

    async function fetchApps() {
      try {
        const [appsRes, roadmapRes, statusRes] = await Promise.all([
          fetch('/api/apps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/roadmaps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/status', { cache: 'no-store', headers: noCacheHeaders }),
        ]);
        if (!appsRes.ok) throw new Error('Failed to fetch apps');
        const data = await appsRes.json();
        setApps(data.filter((app: App) => app.category !== 'Customer Facing'));
        setRoadmap(roadmapRes.ok ? await roadmapRes.json() : []);
        setSystemStatus(statusRes.ok ? await statusRes.json() : []);
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
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (apps.length === 0) return null;

  const featured = apps.find((a) => a.featureOnWebsite) ?? apps[0];
  const rest = apps.filter((a) => a !== featured);

  const openIncidents = systemStatus.filter((s) => s.publicStatus !== 'Resolved');
  const allOperational = openIncidents.length === 0;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const shippedLast30Days = roadmap.filter(
    (item) => item.status === 'Released' && item.releasedDate && Date.now() - new Date(item.releasedDate).getTime() <= THIRTY_DAYS_MS
  ).length;

  return (
    <RevealSection ref={sectionRef} className="py-24 md:py-28 bg-background">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="flex items-end justify-between gap-10 pb-9">
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              The suite
            </div>
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              Five apps. One standard.
            </h2>
          </div>
          <Link
            href="/apps"
            className="hidden sm:inline-flex items-center gap-1.5 flex-shrink-0 border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View all apps
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border md:grid-cols-2">
          <div className="flex flex-col justify-between gap-9 border-b border-border p-9 md:border-b-0 md:border-r">
            <div>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  Featured
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(featured.status)}`}>
                  {featured.status}
                </span>
              </div>
              <h3 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[30px]">
                {featured.name}
              </h3>
              {featured.description && (
                <p className="mt-3 max-w-[420px] text-[17px] leading-[1.6] text-muted-foreground">
                  {featured.description}
                </p>
              )}
              <ul className="mt-7 flex flex-col">
                {[featured.feature1, featured.feature2, featured.feature3]
                  .filter((f): f is string => !!f)
                  .map((f, i) => (
                    <li
                      key={f}
                      className="flex gap-3.5 border-t border-border py-3.5 text-[15px] text-foreground first:border-t-0"
                    >
                      <span className="pt-0.5 font-mono text-xs text-ink-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <Link
              href={actionHref(featured)}
              target={featured.status !== 'In Development' ? '_blank' : undefined}
              rel={featured.status !== 'In Development' ? 'noopener noreferrer' : undefined}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-[22px] py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
            >
              {actionLabel(featured)} {featured.status !== 'In Development' && <ArrowUpRight className="h-3.5 w-3.5" />}
            </Link>
          </div>

          <div className="flex items-center justify-center bg-muted p-9">
            {featured.screenshot ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] border border-border">
                <Image src={featured.screenshot} alt={featured.name} fill className="object-cover" unoptimized={process.env.NODE_ENV === 'development'} />
              </div>
            ) : (
              <div
                className="flex aspect-[4/3] w-full items-center justify-center rounded-[10px] border border-border"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, var(--surface) 0 9px, var(--surface-hover) 9px 18px)' }}
              >
                <span className="font-mono text-xs tracking-[0.04em] text-ink-faint">product shot — {featured.name}</span>
              </div>
            )}
          </div>
        </div>

        {rest.length > 0 && (
          <div className="mt-2">
            {rest.map((app) => {
              const tagline = deriveTagline(app);
              const momentum = appMomentum(app, roadmap);
              const mark = app.faviconUrl ? (
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[9px] border border-border">
                  <Image src={app.faviconUrl} alt="" fill className="object-cover" unoptimized={process.env.NODE_ENV === 'development'} />
                </div>
              ) : (
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] text-[17px] font-semibold tracking-[-0.02em] ${markPalette(app.id)}`}>
                  {app.name.charAt(0).toUpperCase()}
                </div>
              );
              const nameAndTagline = (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tracking-[-0.015em]">{app.name}</span>
                    <span className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDotClasses(app.status)}`} />
                  </div>
                  {tagline && <div className="mt-1 text-[15px] text-muted-foreground">{tagline}</div>}
                </div>
              );
              const statusPill = (
                <div className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(app.status)}`}>
                  {app.status}
                </div>
              );
              const momentumBlock = (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-faint">Momentum</div>
                  <div className="mt-1 text-sm leading-snug text-ink-body">{momentum}</div>
                </div>
              );

              return (
                <Link
                  key={app.id}
                  href={`/apps#${app.id}`}
                  className="block rounded-[10px] border-b border-border px-6 py-6 text-foreground transition-colors hover:bg-muted md:grid md:grid-cols-[40px_1fr_112px_200px_20px] md:items-center md:gap-6"
                >
                  <div className="flex items-center gap-4 md:contents">
                    {mark}
                    {nameAndTagline}
                  </div>
                  <div className="mt-3 flex items-center gap-3 md:contents">
                    {statusPill}
                    <div className="md:border-l md:border-border md:pl-6">{momentumBlock}</div>
                  </div>
                  <ArrowRight className="hidden h-[17px] w-[17px] justify-self-end text-ink-disabled md:block" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full ${allOperational ? 'bg-success' : 'bg-danger'}`} />
          <span>
            {allOperational
              ? 'All systems operational'
              : `${openIncidents.length} active ${openIncidents.length === 1 ? 'incident' : 'incidents'}`}
          </span>
          <span className="text-border">·</span>
          <span>
            {shippedLast30Days > 0
              ? `${shippedLast30Days} feature${shippedLast30Days === 1 ? '' : 's'} shipped in the last 30 days`
              : 'No features shipped in the last 30 days'}
          </span>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/apps" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
            View all apps
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </RevealSection>
  );
}
