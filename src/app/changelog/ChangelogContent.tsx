'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { App, RoadmapFeature } from '@/lib/api-client';
import { CoreLoader } from '@/components/ui/core-loader';
import PageHero from '@/components/marketing/PageHero';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import RoadmapOverlay from '@/components/marketing/RoadmapOverlay';
import UpdatesTabs from '@/components/marketing/UpdatesTabs';
import { EmptyState } from '@/components/marketing/EmptyState';
import { ErrorState } from '@/components/marketing/ErrorState';
import { displayAppName } from '@/lib/roadmap-display';
import { filterPillClasses } from '@/lib/filter-pill';

interface MonthGroup {
  key: string;
  label: string;
  features: RoadmapFeature[];
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function groupByMonth(features: RoadmapFeature[]): MonthGroup[] {
  const dated = features.filter((f) => f.releasedDate);
  const undated = features.filter((f) => !f.releasedDate);

  const groups = new Map<string, MonthGroup>();
  for (const feature of dated) {
    const key = monthKey(feature.releasedDate!);
    const group = groups.get(key);
    if (group) {
      group.features.push(feature);
    } else {
      groups.set(key, { key, label: monthLabel(feature.releasedDate!), features: [feature] });
    }
  }

  const sorted = Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  for (const group of sorted) {
    group.features.sort((a, b) => new Date(b.releasedDate!).getTime() - new Date(a.releasedDate!).getTime());
  }

  if (undated.length > 0) {
    sorted.push({ key: 'undated', label: 'Undated', features: undated });
  }

  return sorted;
}

interface ChangelogContentProps {
  initialShipped: RoadmapFeature[];
  initialAppNames: Record<string, string>;
}

export default function ChangelogContent({ initialShipped, initialAppNames }: ChangelogContentProps) {
  const searchParams = useSearchParams();
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [appNames, setAppNames] = useState<Record<string, string>>(initialAppNames);
  const [shipped, setShipped] = useState<RoadmapFeature[]>(initialShipped);
  // Server already fetched this page's data (see changelog/page.tsx) so the
  // initial HTML has real content for crawlers — this only stays "loading"
  // if that server fetch came back empty, as a client-side recovery path.
  const [isLoading, setIsLoading] = useState(initialShipped.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const applications = useMemo(
    () => Array.from(new Set(shipped.map((f) => f.application).filter((a): a is string => !!a))),
    [shipped]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roadmapRes, appsRes] = await Promise.all([
        fetch('/api/roadmaps', { cache: 'no-store' }),
        fetch('/api/apps', { cache: 'no-store' }),
      ]);

      if (roadmapRes.ok) {
        const features = (await roadmapRes.json()) as RoadmapFeature[];
        setShipped(features.filter((f) => f.status === 'Released'));
      }

      if (appsRes.ok) {
        const apps = (await appsRes.json()) as App[];
        setAppNames(Object.fromEntries(apps.map((a) => [a.id, a.name])));
      }
    } catch (err) {
      console.error('Error fetching changelog data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load the changelog');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialShipped.length > 0) return;
    fetchData();
  }, [fetchData, initialShipped.length]);

  // Deep link to a single entry via ?expand=<id>
  useEffect(() => {
    const expandId = searchParams?.get('expand');
    if (expandId && !isOverlayOpen) {
      const feature = shipped.find((f) => f.id === expandId);
      if (feature) {
        setSelectedFeature(feature);
        setIsOverlayOpen(true);
        setTimeout(() => {
          document.getElementById(`changelog-entry-${expandId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, [searchParams, shipped, isOverlayOpen]);

  const filtered = useMemo(
    () => (selectedApp ? shipped.filter((f) => f.application === selectedApp) : shipped),
    [shipped, selectedApp]
  );

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const openFeature = (feature: RoadmapFeature) => {
    setSelectedFeature(feature);
    setIsOverlayOpen(true);
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setSelectedFeature(null);
    if (searchParams?.get('expand')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('expand');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Changelog', href: '/changelog' }]} />
      </div>

      <UpdatesTabs active="changelog" />

      <PageHero
        eyebrow="Changelog"
        title="What shipped."
        subtitle="Released features across the CoFabri suite, most recent first."
        right={
          shipped.length > 0 ? (
            <div className="text-right">
              <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-success">{shipped.length}</div>
              <div className="mt-1.5 text-[13px] text-ink-faint">Shipped</div>
            </div>
          ) : undefined
        }
      />

      <div className="mt-11 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedApp('')} className={filterPillClasses(selectedApp === '')}>
            All apps
          </button>
          {applications.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => setSelectedApp(app)}
              className={filterPillClasses(selectedApp === app)}
            >
              {displayAppName(app, appNames)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <CoreLoader size={40} />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load the changelog" description={error} onRetry={fetchData} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          title={selectedApp ? 'Nothing matches that filter' : 'Nothing has shipped yet'}
          description={selectedApp ? 'Try a different app filter.' : 'Check back once the first release lands.'}
          action={selectedApp ? { label: 'Clear Filters', onClick: () => setSelectedApp('') } : undefined}
        />
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.key} className="mt-14 first:mt-0">
              <div className="mb-2 flex items-baseline gap-3.5">
                <h2 className="m-0 text-[26px] font-semibold tracking-[-0.025em] text-foreground">{group.label}</h2>
                <span className="font-mono text-xs text-ink-faint">
                  {group.features.length} {group.features.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              {group.features.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  id={`changelog-entry-${item.id}`}
                  onClick={() => openFeature(item)}
                  className="flex w-full items-start gap-4 border-t border-border py-[22px] text-left transition-colors hover:bg-muted sm:items-center sm:gap-6 sm:rounded-lg sm:px-3 sm:-mx-3"
                >
                  <span className="mt-1.5 block h-[9px] w-[9px] flex-shrink-0 rounded-full bg-success sm:mt-0" />
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-6">
                    <div className="min-w-0 sm:w-[260px] sm:flex-shrink-0">
                      <div className="text-lg font-semibold tracking-[-0.015em] text-foreground">{item.name}</div>
                      {item.application && (
                        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                          {displayAppName(item.application, appNames)}
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1.5 text-[15px] leading-[1.5] text-ink-muted sm:mt-0 sm:min-w-0 sm:flex-1">{item.description}</p>
                    )}
                    {item.releasedDate && (
                      <span className="mt-3 block font-mono text-xs text-ink-faint sm:mt-0 sm:flex-shrink-0">
                        {new Date(item.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <span className="hidden text-sm font-semibold text-ink-muted sm:block sm:flex-shrink-0">Details →</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedFeature && (
        <RoadmapOverlay isOpen={isOverlayOpen} onClose={closeOverlay} roadmap={selectedFeature} />
      )}
    </div>
  );
}
