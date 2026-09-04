'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RoadmapFeature } from '@/lib/api-client';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { roadmapStatusPillClasses, roadmapStatusDotClasses, formatRoadmapWhen } from '@/lib/roadmap-display';
import { CoreLoader } from '@/components/ui/core-loader';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import RoadmapOverlay from './RoadmapOverlay';

// Helper function to parse quarter and year from milestone string
export const parseMilestone = (milestone: string) => {
  const match = milestone.match(/Q(\d)\s*(\d{4})/i);
  if (!match) return { quarter: 0, year: 0 };
  return {
    quarter: parseInt(match[1]),
    year: parseInt(match[2]),
  };
};

// Compare function for milestone sorting (most recent first)
export const compareMilestones = (a: string, b: string) => {
  const milestoneA = parseMilestone(a);
  const milestoneB = parseMilestone(b);

  if (milestoneA.year !== milestoneB.year) {
    return milestoneB.year - milestoneA.year;
  }
  return milestoneB.quarter - milestoneA.quarter;
};

// A feature tied to an app that isn't in appNames belongs to a retired app
// (retired apps are dropped from getApps() entirely) -- keep it out of the
// public roadmap regardless of which filters are active.
function isVisibleFeature(feature: RoadmapFeature, appNames: Record<string, string>): boolean {
  return !feature.application || !!appNames[feature.application];
}

function groupByMilestone(
  features: RoadmapFeature[],
  selectedApp: string,
  selectedStatus: string,
  appNames: Record<string, string>
): { title: string; features: RoadmapFeature[] }[] {
  const groups = features.reduce((acc: { title: string; features: RoadmapFeature[] }[], feature) => {
    if (!isVisibleFeature(feature, appNames)) return acc;
    if (selectedApp && feature.application !== selectedApp) return acc;
    if (selectedStatus && feature.status !== selectedStatus) return acc;

    const milestone = acc.find((m) => m.title === feature.milestone);
    if (milestone) {
      milestone.features.push(feature);
    } else {
      acc.push({ title: feature.milestone, features: [feature] });
    }
    return acc;
  }, []);

  groups.sort((a, b) => compareMilestones(a.title, b.title));
  return groups;
}

interface ProductRoadmapProps {
  selectedApp: string;
  selectedStatus: string;
  appNames: Record<string, string>;
  initialFeatures: RoadmapFeature[];
  onClearFilters?: () => void;
}

export default function ProductRoadmap({ selectedApp, selectedStatus, appNames, initialFeatures, onClearFilters }: ProductRoadmapProps) {
  const searchParams = useSearchParams();
  const [features, setFeatures] = useState<RoadmapFeature[]>(initialFeatures);
  const [milestones, setMilestones] = useState<{ title: string; features: RoadmapFeature[] }[]>(() =>
    groupByMilestone(initialFeatures, selectedApp, selectedStatus, appNames)
  );
  // Server already fetched this page's data (see roadmaps/page.tsx) so the
  // initial HTML has real content for crawlers — this only stays "loading"
  // if that server fetch came back empty, as a client-side recovery path.
  const [isLoading, setIsLoading] = useState(initialFeatures.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Handle expand query parameter (deep link to a single item's details)
  useEffect(() => {
    const expandId = searchParams?.get('expand');
    if (expandId && !isOverlayOpen) {
      const featureToExpand = features.find((f) => f.id === expandId);
      if (featureToExpand) {
        setSelectedFeature(featureToExpand);
        setIsOverlayOpen(true);
        setTimeout(() => {
          document.getElementById(`roadmap-feature-${expandId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, [searchParams, features, isOverlayOpen]);

  const fetchRoadmap = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/roadmaps', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch roadmap features');

      const roadmapFeatures = (await response.json()) as RoadmapFeature[];
      const visibleFeatures = roadmapFeatures.filter((f) => isVisibleFeature(f, appNames));
      setFeatures(visibleFeatures);
      setMilestones(groupByMilestone(visibleFeatures, selectedApp, selectedStatus, appNames));
    } catch (err) {
      console.error('Error fetching roadmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roadmap');
    } finally {
      setIsLoading(false);
    }
  }, [selectedApp, selectedStatus, appNames]);

  useEffect(() => {
    if (isOverlayOpen) {
      setIsOverlayOpen(false);
      setSelectedFeature(null);
    }
    fetchRoadmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isOverlayOpen intentionally excluded: it's written by this effect, not read to decide when to refetch
  }, [fetchRoadmap]);

  const openFeature = (feature: RoadmapFeature) => {
    setSelectedFeature(feature);
    setIsOverlayOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <CoreLoader size={40} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Couldn't load the roadmap" description={error} onRetry={fetchRoadmap} />;
  }

  if (milestones.length === 0) {
    return (
      <EmptyState
        icon={<MagnifyingGlassIcon className="h-5 w-5" />}
        title="Nothing matches those filters"
        description="Try a different app or status filter."
        action={
          onClearFilters && (selectedApp || selectedStatus)
            ? { label: 'Clear Filters', onClick: onClearFilters }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div>
        {milestones.map((milestone) => (
          <div key={milestone.title} className="mt-14">
            <div className="mb-2 flex items-center gap-3.5">
              <h2 className="m-0 text-[26px] font-semibold tracking-[-0.025em] text-foreground">{milestone.title}</h2>
              <span className="font-mono text-xs text-ink-faint">
                {milestone.features.length} {milestone.features.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {milestone.features.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`roadmap-feature-${item.id}`}
                onClick={() => openFeature(item)}
                className="group flex w-full items-start gap-4 border-t border-border py-[22px] text-left transition-colors duration-200 hover:bg-muted sm:items-center sm:gap-6 sm:rounded-lg sm:px-3 sm:-mx-3"
              >
                <span className={`mt-1.5 block h-[9px] w-[9px] flex-shrink-0 rounded-full sm:mt-0 ${roadmapStatusDotClasses(item.status)}`} />
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-6">
                  <div className="min-w-0 sm:w-[260px] sm:flex-shrink-0">
                    <div className="text-lg font-semibold tracking-[-0.015em] text-foreground">{item.name}</div>
                    {item.application && (
                      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                        {appNames[item.application] || item.application}
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1.5 text-[15px] leading-[1.5] text-ink-muted sm:mt-0 sm:min-w-0 sm:flex-1">{item.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 sm:mt-0 sm:flex-shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roadmapStatusPillClasses(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="font-mono text-xs text-ink-faint sm:hidden">{formatRoadmapWhen(item)}</span>
                  </div>
                  <span className="hidden text-sm font-semibold text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 sm:block sm:flex-shrink-0">
                    Details →
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {selectedFeature && (
        <RoadmapOverlay
          isOpen={isOverlayOpen}
          onClose={() => {
            setIsOverlayOpen(false);
            setSelectedFeature(null);
            if (searchParams?.get('expand')) {
              const url = new URL(window.location.href);
              url.searchParams.delete('expand');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          roadmap={selectedFeature}
        />
      )}
    </>
  );
}
