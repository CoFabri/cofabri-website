'use client';

import { useState, useEffect } from 'react';
import ProductRoadmap from '@/components/ui/ProductRoadmap';
import GradientHeading from '@/components/ui/GradientHeading';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { RoadmapFeature } from '@/lib/airtable';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
          text-gray-700 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 
          focus:ring-blue-200 focus:outline-none transition-all duration-200 cursor-pointer
          shadow-sm hover:shadow-md flex items-center justify-between"
      >
        <span className={value ? 'text-gray-700' : 'text-gray-500'}>{selectedOption}</span>
        <ChevronDownIcon 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-[1001] w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 
          max-h-60 overflow-auto py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-700 
                transition-colors duration-200 flex items-center justify-between
                ${value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function RoadmapsPage() {
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedReleaseType, setSelectedReleaseType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [applications, setApplications] = useState<string[]>([]);
  const [releaseTypes] = useState<string[]>(['Major', 'Minor', 'Patch']);
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
                value={selectedReleaseType}
                onChange={setSelectedReleaseType}
                options={[
                  { value: '', label: 'All Release Types' },
                  ...releaseTypes.map(type => ({ value: type, label: type }))
                ]}
                placeholder="All Release Types"
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