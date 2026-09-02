'use client';

import React, { useEffect, useState } from 'react';
import { RoadmapFeature } from '@/lib/airtable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getStatusColor, getStatusIcon } from './ProductRoadmap';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CompactRoadmap() {
  const router = useRouter();
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
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  // Helper function to get dynamic grid classes based on feature count
  const getDynamicGridClasses = (featureCount: number) => {
    if (featureCount === 1) {
      return 'grid-cols-1 lg:grid-cols-1'; // Single feature takes full width
    } else if (featureCount === 2) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'; // Two features, 50% each
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // Three or more, max 3 per row
    }
  };

  // Helper function to group features into rows of 3
  const groupFeaturesIntoRows = (features: RoadmapFeature[]) => {
    const rows: RoadmapFeature[][] = [];
    for (let i = 0; i < features.length; i += 3) {
      rows.push(features.slice(i, i + 3));
    }
    return rows;
  };

  return (
    <RevealSection className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Roadmap"
          title="Product Roadmaps & Changelog"
          subtitle="See what's coming next and track our progress"
        />

        <div className="space-y-8 mb-12">
          <div className="relative">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 mb-6">
              <h3 className="text-2xl font-semibold text-foreground">
                {nextQuarter}
              </h3>
            </div>

            <div className="space-y-6">
              {groupFeaturesIntoRows(nextQuarterFeatures).map((row, rowIndex) => (
                <div key={rowIndex} className={`grid ${getDynamicGridClasses(row.length)} gap-6`}>
                  {row.map((feature) => (
                    <Card
                      key={feature.id}
                      onClick={() => router.push(`/roadmaps?expand=${feature.id}`)}
                      className="overflow-hidden gap-0 py-0 flex flex-col cursor-pointer group hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(feature.status)}
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-base font-semibold text-foreground">
                              {feature.name}
                            </h4>
                            {feature.application && (
                              <div className="mt-1">
                                <span className="inline-flex text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                  {feature.application}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="px-5 py-3 border-t border-border bg-muted/50">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="outline" className={getStatusColor(feature.status)}>
                              {feature.status}
                            </Badge>
                            <span className="text-xs text-primary group-hover:text-primary/80 transition-colors">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/roadmaps">
              View All Roadmaps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}
