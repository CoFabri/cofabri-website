'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { App, RoadmapFeature } from '@/lib/api-client';
import { actionHref, actionLabel, appMomentum, markPalette, statusPillClasses } from '@/lib/app-display';
import { filterPillClasses } from '@/lib/filter-pill';
import { CoreLoader } from '@/components/ui/core-loader';
import Breadcrumbs from './Breadcrumbs';
import PageHero from './PageHero';
import AppsCelebration from './AppsCelebration';
import AppRow from './AppRow';
import RevealSection from './RevealSection';
import StructuredData from './StructuredData';

const RESOURCES = [
  {
    title: 'Product roadmap',
    body: "See what's shipping next across the suite, and vote on what should be.",
    href: '/roadmaps',
  },
  {
    title: 'Knowledge base',
    body: 'Setup guides, troubleshooting, and the answers support gives most often.',
    href: '/knowledge-base',
  },
  {
    title: 'Support',
    body: "Something broken, or just confused? We're fast, and we're human.",
    href: '/support',
  },
];

interface AppsPageContentProps {
  initialApps: App[];
  initialRoadmap: RoadmapFeature[];
}

export default function AppsPageContent({ initialApps, initialRoadmap }: AppsPageContentProps) {
  const [apps, setApps] = useState<App[]>(initialApps);
  const [roadmap, setRoadmap] = useState<RoadmapFeature[]>(initialRoadmap);
  // Server already fetched this page's data (see apps/page.tsx) so the initial
  // HTML has real content for crawlers — this effect only exists as a
  // client-side recovery path if that server fetch came back empty.
  const [isLoading, setIsLoading] = useState(initialApps.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (initialApps.length > 0) return;

    async function fetchApps() {
      const noCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      };

      try {
        const [appsRes, roadmapRes] = await Promise.all([
          fetch('/api/apps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/roadmaps', { cache: 'no-store', headers: noCacheHeaders }),
        ]);
        if (!appsRes.ok) throw new Error('Failed to fetch apps');
        setApps(await appsRes.json());
        setRoadmap(roadmapRes.ok ? await roadmapRes.json() : []);
      } catch (err) {
        console.error('Error fetching apps:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch apps');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialApps is a mount-time snapshot, not a reactive dependency
  }, []);

  const featured = apps.find((a) => a.featureOnWebsite) ?? apps[0];
  const rows = useMemo(() => apps.filter((a) => a !== featured), [apps, featured]);

  const statuses = useMemo(() => {
    const seen: string[] = [];
    for (const app of rows) {
      if (!seen.includes(app.status)) seen.push(app.status);
    }
    return seen;
  }, [rows]);

  const filteredRows = statusFilter === 'All' ? rows : rows.filter((a) => a.status === statusFilter);

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      {apps.length > 0 && (
        <StructuredData
          type="itemList"
          data={{ items: apps.map((a) => ({ name: a.name, url: `https://cofabri.com/apps/${a.id}` })) }}
        />
      )}
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Apps', href: '/apps' }]} />
      </div>

      <PageHero
        eyebrow="The suite"
        title="Every app we make."
        subtitle={
          apps.length > 0
            ? `${apps.length} app${apps.length === 1 ? '' : 's'}, none of which overlap. Pick the one that matches the problem you actually have.`
            : 'Apps built to solve one problem well. Pick the one that matches the problem you actually have.'
        }
      />

      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <CoreLoader size={40} />
        </div>
      ) : error ? (
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Error</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      ) : apps.length === 0 ? null : (
        <RevealSection>
          {statuses.length > 1 && (
            <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-8">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={filterPillClasses(statusFilter === 'All')}
              >
                All {apps.length}
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={filterPillClasses(statusFilter === status)}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {featured && (
            <div className="mt-10 rounded-2xl border border-border bg-card p-9">
              <div className="flex flex-wrap items-start justify-between gap-7">
                <div className="flex min-w-0 items-center gap-4">
                  {featured.faviconUrl ? (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] border border-border">
                      <Image
                        src={featured.faviconUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold tracking-[-0.02em] ${markPalette(featured.id)}`}
                    >
                      {featured.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                        Featured
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(featured.status)}`}>
                        {featured.status}
                      </span>
                    </div>
                    <h2 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[30px]">
                      {featured.name}
                    </h2>
                  </div>
                </div>
                <div className="mt-1 w-full border-t border-border pt-4 text-left md:mt-0 md:w-auto md:flex-shrink-0 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">Momentum</div>
                  <div className="mt-1 text-[15.5px] font-semibold text-foreground">{appMomentum(featured, roadmap)}</div>
                </div>
              </div>

              {featured.description && (
                <p className="mt-6 max-w-[640px] text-[16px] leading-[1.6] text-ink-muted">{featured.description}</p>
              )}

              <div className="mt-7 flex flex-wrap items-end justify-between gap-7 border-t border-border pt-6">
                <div className="flex flex-wrap gap-8">
                  {[featured.feature1, featured.feature2, featured.feature3]
                    .filter((f): f is string => !!f)
                    .map((f, i) => (
                      <div key={f} className="max-w-[220px]">
                        <span className="block font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                        <span className="mt-1 block text-sm leading-[1.45] text-foreground">{f}</span>
                      </div>
                    ))}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-3">
                  <Link
                    href={actionHref(featured)}
                    target={featured.status !== 'In Development' ? '_blank' : undefined}
                    rel={featured.status !== 'In Development' ? 'noopener noreferrer' : undefined}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-[22px] py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
                  >
                    {actionLabel(featured)} {featured.status !== 'In Development' && <ArrowUpRight className="h-3.5 w-3.5" />}
                  </Link>
                  <Link
                    href={`/apps/${featured.id}`}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border-strong px-[22px] py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          )}

          {filteredRows.length > 0 && (
            <div className="mt-2">
              {filteredRows.map((app) => (
                <AppRow key={app.id} app={app} roadmap={roadmap} href={`/apps/${app.id}`} />
              ))}
            </div>
          )}

          <AppsCelebration apps={apps} />
        </RevealSection>
      )}

      <RevealSection className="mt-24 border-t border-border pt-16">
        <h2 className="m-0 text-[32px] font-semibold tracking-[-0.025em] text-foreground">Before you pick one</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {RESOURCES.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="block rounded-xl border border-border p-6 text-foreground transition-all duration-200 hover:-translate-y-px hover:border-ink-disabled"
            >
              <div className="text-lg font-semibold tracking-[-0.015em]">{r.title}</div>
              <p className="mt-2.5 text-[15px] leading-[1.55] text-ink-muted">{r.body}</p>
              <span className="mt-4 inline-block text-[15px] font-semibold text-primary">Learn more →</span>
            </Link>
          ))}
        </div>
      </RevealSection>
    </div>
  );
}
