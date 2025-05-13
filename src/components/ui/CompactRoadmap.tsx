'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { RoadmapFeature } from '@/lib/airtable';
import Link from 'next/link';
import { getStatusColor, getStatusIcon, getReleaseTypeColor } from './ProductRoadmap';
import { getRoadmapFeatures } from '@/lib/airtable';
import SectionHeading from './SectionHeading';

export default function CompactRoadmap() {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/roadmaps');
        if (!response.ok) throw new Error('Failed to fetch roadmap features');
        const data = await response.json();
        setFeatures(data);
      } catch (err) {
        console.error('Error fetching roadmap features:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roadmap features');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatures();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (features.length === 0) {
    return null;
  }

  // Get the next quarter's milestone and its features
  const nextQuarter = features[0].milestone;
  const nextQuarterFeatures = features.filter(feature => feature.milestone === nextQuarter);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Product Roadmaps"
          subtitle="See what's coming next and track our progress"
        />

        <div className="space-y-8 mb-12">
          <div className="relative">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-4 mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {nextQuarter}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextQuarterFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md 
                  transition-all duration-200 border border-gray-100 relative flex flex-col
                  hover:border-blue-100 hover:shadow-blue-50"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(feature.status)}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-base font-semibold text-gray-900">
                          {feature.name}
                        </h4>
                        {feature.application && (
                          <div className="mt-1">
                            <span className="inline-flex text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
                              {feature.application}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {feature.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/roadmaps"
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-duration-150 ease-in-out"
          >
            View All Roadmaps
            <ChevronRightIcon className="ml-2 -mr-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
} 