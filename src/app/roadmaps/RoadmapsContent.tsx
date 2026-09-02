'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { App, RoadmapFeature } from '@/lib/api-client';
import ProductRoadmap from '@/components/marketing/ProductRoadmap';
import PageHero from '@/components/marketing/PageHero';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import { displayAppName } from '@/lib/roadmap-display';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}

function Dropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 min-w-[180px] items-center justify-between gap-3 rounded-lg border border-border-strong px-3.5 text-[15px] text-ink-body transition-colors hover:border-ink-faint"
      >
        <span>{selectedLabel}</span>
        <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1.5 max-h-60 w-full min-w-[180px] overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-3.5 py-2 text-left text-[15px] transition-colors hover:bg-muted ${
                  value === option.value ? 'font-semibold text-foreground' : 'text-ink-body'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const STATUSES = ['Released', 'In Progress', 'Delayed', 'Planned', 'Cancelled'];

export default function RoadmapsContent() {
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [applications, setApplications] = useState<string[]>([]);
  const [appNames, setAppNames] = useState<Record<string, string>>({});
  const [allFeatures, setAllFeatures] = useState<RoadmapFeature[]>([]);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [roadmapRes, appsRes] = await Promise.all([
          fetch('/api/roadmaps', { cache: 'no-store' }),
          fetch('/api/apps', { cache: 'no-store' }),
        ]);

        if (roadmapRes.ok) {
          const features = (await roadmapRes.json()) as RoadmapFeature[];
          setAllFeatures(features);
          setApplications(Array.from(new Set(features.map((f) => f.application).filter((a): a is string => !!a))));
        }

        if (appsRes.ok) {
          const apps = (await appsRes.json()) as App[];
          setAppNames(Object.fromEntries(apps.map((a) => [a.id, a.name])));
        }
      } catch (error) {
        console.error('Error fetching roadmap filter data:', error);
      }
    }

    fetchFilterData();
  }, []);

  const counts = useMemo(
    () => ({
      shipped: allFeatures.filter((f) => f.status === 'Released').length,
      inProgress: allFeatures.filter((f) => f.status === 'In Progress').length,
      next: allFeatures.filter((f) => f.status === 'Planned' || f.status === 'Delayed').length,
    }),
    [allFeatures]
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Roadmaps', href: '/roadmaps' }]} />
      </div>

      <PageHero
        eyebrow="Roadmap"
        title="Built in the open."
        subtitle="Shipped, slipping, or still an argument. Everything we're working on, updated as it changes."
        right={
          allFeatures.length > 0 ? (
            <div className="flex gap-6 sm:gap-8">
              <div className="text-right">
                <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-success">{counts.shipped}</div>
                <div className="mt-1.5 text-[13px] text-ink-faint">Shipped</div>
              </div>
              <div className="text-right">
                <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-primary">{counts.inProgress}</div>
                <div className="mt-1.5 text-[13px] text-ink-faint">In progress</div>
              </div>
              <div className="text-right">
                <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-foreground">{counts.next}</div>
                <div className="mt-1.5 text-[13px] text-ink-faint">Up next</div>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="mt-11 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedApp('')}
            className={`rounded-full px-[15px] py-2 text-sm font-medium transition-colors ${
              selectedApp === ''
                ? 'bg-foreground text-background'
                : 'border border-border-strong text-ink-body hover:border-ink-faint'
            }`}
          >
            All apps
          </button>
          {applications.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => setSelectedApp(app)}
              className={`rounded-full px-[15px] py-2 text-sm font-medium transition-colors ${
                selectedApp === app
                  ? 'bg-foreground text-background'
                  : 'border border-border-strong text-ink-body hover:border-ink-faint'
              }`}
            >
              {displayAppName(app, appNames)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/changelog" className="text-sm font-semibold text-ink-muted transition-colors hover:text-foreground">
            Looking for what shipped? Changelog →
          </Link>
          <Dropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="All statuses"
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </div>
      </div>

      <ProductRoadmap selectedApp={selectedApp} selectedStatus={selectedStatus} appNames={appNames} />
    </div>
  );
}
