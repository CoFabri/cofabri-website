'use client';

import { useState, useEffect } from 'react';
import ProductRoadmap from '@/components/marketing/ProductRoadmap';
import GradientHeading from '@/components/marketing/GradientHeading';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { RoadmapFeature } from '@/lib/api-client';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

function Dropdown({ value, onChange, options, placeholder, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border-2 border-border
          bg-card text-foreground font-medium hover:border-primary/60 focus:border-primary focus:ring-2
          focus:ring-primary/20 focus:outline-none transition-all duration-200 cursor-pointer
          shadow-sm hover:shadow-md flex items-center justify-between"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{selectedOption}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-ink-faint transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[1001] w-full mt-1 bg-card rounded-xl shadow-lg border border-border
          max-h-60 overflow-auto py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground
                transition-colors duration-200 flex items-center justify-between
                ${value === option.value ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground'}`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoadmapsContent() {
  const [selectedApp, setSelectedApp] = useState<string>('');
  // Release type filtering is disabled: RoadmapFeature.releaseType has no backing
  // column in cofabri-api (a known, separately-tracked schema gap) and is always
  // an empty string, so a "Release Type" filter would only ever return zero
  // results. selectedReleaseType stays '' and is passed through to ProductRoadmap
  // unused so its filtering logic remains a harmless no-op.
  const [selectedReleaseType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [applications, setApplications] = useState<string[]>([]);
  const [statuses] = useState<string[]>(['Released', 'In Progress', 'Delayed', 'Planned', 'Cancelled']);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch('/api/roadmaps', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch roadmap features');
        }
        
        const features = await response.json() as RoadmapFeature[];
        const uniqueApps = Array.from(new Set(features.map(f => f.application).filter((app): app is string => !!app)));
        setApplications(uniqueApps);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    }

    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen">
      <GradientHeading
        title="Product Roadmaps & Changelog"
        subtitle="See what's coming next and track our progress in making our apps even better"
        extraContent={
          <div className="relative z-[2] w-full max-w-4xl mx-auto mt-12">
            <div className="flex flex-wrap justify-center gap-6">
              <Dropdown
                value={selectedApp}
                onChange={setSelectedApp}
                options={[
                  { value: '', label: 'All Applications' },
                  ...applications.map(app => ({ value: app, label: app }))
                ]}
                placeholder="All Applications"
                className="w-56"
              />

              <Dropdown
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: '', label: 'All Statuses' },
                  ...statuses.map(status => ({ value: status, label: status }))
                ]}
                placeholder="All Statuses"
                className="w-56"
              />
            </div>
          </div>
        }
      />
      <div className="container mx-auto px-4">
        <ProductRoadmap 
          selectedApp={selectedApp}
          selectedReleaseType={selectedReleaseType}
          selectedStatus={selectedStatus}
        />
      </div>
    </div>
  );
}
