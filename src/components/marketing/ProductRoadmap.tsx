'use client';

import React, { useEffect, useState } from 'react';
import { RoadmapFeature } from '@/lib/api-client';
import { useSearchParams } from 'next/navigation';
import { roadmapStatusPillClasses, roadmapStatusDotClasses, formatRoadmapWhen } from '@/lib/roadmap-display';
import { CoreLoader } from '@/components/ui/core-loader';
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

function groupByMilestone(
  features: RoadmapFeature[],
  selectedApp: string,
  selectedStatus: string
): { title: string; features: RoadmapFeature[] }[] {
  const groups = features.reduce((acc: { title: string; features: RoadmapFeature[] }[], feature) => {
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
}

export default function ProductRoadmap({ selectedApp, selectedStatus, appNames, initialFeatures }: ProductRoadmapProps) {
  const searchParams = useSearchParams();
  const [features, setFeatures] = useState<RoadmapFeature[]>(initialFeatures);
  const [milestones, setMilestones] = useState<{ title: string; features: RoadmapFeature[] }[]>(() =>
    groupByMilestone(initialFeatures, selectedApp, selectedStatus)
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

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        if (isOverlayOpen) {
          setIsOverlayOpen(false);
          setSelectedFeature(null);
        }

        const response = await fetch('/api/roadmaps', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch roadmap features');

        const roadmapFeatures = (await response.json()) as RoadmapFeature[];
        setFeatures(roadmapFeatures);
        setMilestones(groupByMilestone(roadmapFeatures, selectedApp, selectedStatus));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roadmap');
        setIsLoading(false);
      }
    }

    fetchRoadmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isOverlayOpen intentionally excluded: it's written by this effect, not read to decide when to refetch
  }, [selectedApp, selectedStatus]);

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
    return (
      <div className="py-16 text-center">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">Nothing matches those filters yet.</div>
    );
  }

  return (
    <>
      <div>
        {milestones.map((milestone) => (
          <div key={milestone.title} className="mt-14 first:mt-0">
            <div className="mb-2 flex items-baseline gap-3.5">
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
