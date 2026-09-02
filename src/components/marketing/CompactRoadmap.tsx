'use client';

import React, { useEffect, useState } from 'react';
import { RoadmapFeature } from '@/lib/api-client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import RevealSection from './RevealSection';

interface Column {
  title: string;
  dotClassName: string;
  items: RoadmapFeature[];
}

function formatWhen(feature: RoadmapFeature) {
  if (feature.releasedDate) {
    return new Date(feature.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return feature.milestone;
}

export default function CompactRoadmap() {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/roadmaps');
        if (!response.ok) throw new Error('Failed to fetch roadmap features');
        const data = await response.json();
        setFeatures(data);
      } catch (err) {
        console.error('Error fetching roadmap features:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatures();
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 bg-muted">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (features.length === 0) return null;

  const columns: Column[] = [
    {
      title: 'Shipped',
      dotClassName: 'bg-success',
      items: features
        .filter((f) => f.status === 'Released')
        .sort((a, b) => (b.releasedDate ?? '').localeCompare(a.releasedDate ?? ''))
        .slice(0, 4),
    },
    {
      title: 'In progress',
      dotClassName: 'bg-primary',
      items: features.filter((f) => f.status === 'In Progress').slice(0, 4),
    },
    {
      title: 'Next',
      dotClassName: 'bg-ink-disabled',
      items: features.filter((f) => f.status === 'Planned' || f.status === 'Delayed').slice(0, 4),
    },
  ];

  return (
    <RevealSection className="py-24 md:py-28 bg-muted border-y border-border">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="mb-11 flex items-end justify-between gap-10">
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Roadmap
            </div>
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              Built in the open.
            </h2>
            <p className="mt-3.5 max-w-[520px] text-lg text-muted-foreground">
              Every release, every delay, every reprioritisation. Published as it happens.
            </p>
          </div>
          <Link
            href="/roadmaps"
            className="hidden sm:inline-flex items-center gap-1.5 flex-shrink-0 border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Full roadmap
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2.5 border-b border-border pb-4.5">
                <span className={`block h-[7px] w-[7px] rounded-full ${col.dotClassName}`} />
                <span className="text-sm font-semibold text-foreground">{col.title}</span>
                <span className="ml-auto font-mono text-xs text-ink-faint">{col.items.length}</span>
              </div>
              {col.items.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">Nothing here yet.</p>
              ) : (
                col.items.map((item) => (
                  <div key={item.id} className="border-b border-border py-4 last:border-b-0">
                    <div className="text-[15px] font-medium leading-[1.4] text-foreground">{item.name}</div>
                    <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                      {item.application && <span>{item.application}</span>}
                      {item.application && <span>·</span>}
                      <span>{formatWhen(item)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/roadmaps" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
            Full roadmap
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </RevealSection>
  );
}
