'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { RoadmapFeature } from '@/lib/api-client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AnimatedGradient from '@/components/marketing/AnimatedGradient';
import { roadmapMarkdownToHtml, releaseNotesMarkdownToHtml } from '@/lib/utils';
import RoadmapOverlay from './RoadmapOverlay';

// Demo content for test mode
const DEMO_ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    id: '1',
    name: 'Advanced Analytics Dashboard',
    description: 'A completely redesigned analytics dashboard with customizable widgets, real-time data, and advanced filtering options.',
    application: 'Analytics Pro',
    releaseType: 'Major',
    status: 'In Progress',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Customizable dashboard layout\nReal-time data visualization\nAdvanced filtering capabilities\nExport options for reports\nDark mode support',
    applicationUrl: 'analyticsapp.cofabri.com',
  },
  {
    id: '2',
    name: 'Mobile App Launch',
    description: 'Launch of our native mobile applications for iOS and Android with core functionality and offline capabilities.',
    application: 'Task Manager',
    releaseType: 'Major',
    status: 'Planned',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Native iOS and Android apps\nOffline mode\nPush notifications\nTouch ID/Face ID login\nMobile-optimized interface',
  },
  {
    id: '3',
    name: 'Team Collaboration Features',
    description: 'New collaboration tools including shared workspaces, real-time editing, and improved commenting system.',
    application: 'Task Manager',
    releaseType: 'Minor',
    status: 'Planned',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Shared workspaces\nReal-time document editing\nImproved commenting system\n@mentions and notifications\nActivity history log',
  },
  {
    id: '4',
    name: 'Security Enhancements',
    description: 'Major security updates including two-factor authentication, enhanced encryption, and compliance with latest standards.',
    application: 'All Apps',
    releaseType: 'Minor',
    status: 'Released',
    milestone: 'Q4 2023',
    featuresAndChanges: 'Two-factor authentication\nEnhanced data encryption\nImproved password policies\nSecurity audit logging\nGDPR compliance updates',
    releasedDate: new Date('2023-11-15').toISOString(),
    releaseNotes: 'This release significantly improves the security posture of all our applications with industry-standard protections.',
  },
  {
    id: '5',
    name: 'Integration Marketplace',
    description: 'A new marketplace featuring integrations with popular third-party tools and services.',
    application: 'All Apps',
    releaseType: 'Major',
    status: 'In Progress',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Marketplace UI\nOne-click integrations\nAPI connection wizard\nExtensible plugin system\nDeveloper documentation',
  },
  {
    id: '6',
    name: 'AI-Powered Document Processing',
    description: 'Intelligent document processing using AI to extract data, categorize content, and suggest actions.',
    application: 'Document Hub',
    releaseType: 'Major',
    status: 'Planned',
    milestone: 'Q2 2024',
    featuresAndChanges: 'OCR text extraction\nAutomatic document categorization\nContent summarization\nInsight generation\nAction recommendations',
  },
  {
    id: '7',
    name: 'Performance Optimization',
    description: 'Major performance improvements to enhance page load times and system responsiveness.',
    application: 'All Apps',
    releaseType: 'Patch',
    status: 'Released',
    milestone: 'Q4 2023',
    featuresAndChanges: 'Reduced page load times\nOptimized database queries\nImproved caching\nReducing API latency\nCode splitting and lazy loading',
    releasedDate: new Date('2023-12-01').toISOString(),
    releaseNotes: 'This update delivers significant performance improvements across all applications, with average page load times decreased by 40%.',
  },
  {
    id: '8',
    name: 'Custom Reporting Tools',
    description: 'Advanced reporting tools with custom templates, scheduled exports, and data visualization options.',
    application: 'Analytics Pro',
    releaseType: 'Minor',
    status: 'In Progress',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Custom report templates\nScheduled email reports\nExport to multiple formats\nAdvanced data visualization\nDrilldown capabilities',
  },
  {
    id: '9',
    name: 'User Interface Refresh',
    description: 'A complete visual refresh with improved accessibility, consistent styling, and a more modern look.',
    application: 'Customer Portal',
    releaseType: 'Minor',
    status: 'Delayed',
    milestone: 'Q2 2024',
    featuresAndChanges: 'Modern UI components\nImproved accessibility\nResponsive design enhancements\nDark mode support\nCustomizable themes',
  },
  {
    id: '10',
    name: 'Automated Workflow Builder',
    description: 'Visual workflow builder to create automated processes without coding knowledge.',
    application: 'Process Automator',
    releaseType: 'Major',
    status: 'Planned',
    milestone: 'Q2 2024',
    featuresAndChanges: 'Drag-and-drop interface\nPre-built workflow templates\nConditional logic support\nIntegration with external services\nWorkflow analytics',
  },
  {
    id: '11',
    name: 'Legacy Feature Deprecation',
    description: 'Removal of outdated features and tools to streamline the application and improve performance.',
    application: 'Task Manager',
    releaseType: 'Patch',
    status: 'Cancelled',
    milestone: 'Q1 2024',
    featuresAndChanges: 'Removal of legacy Gantt chart\nDeprecation of old comment system\nMigration of data to new structures\nRetirement of Flash-based components',
  },
  {
    id: '12',
    name: 'Enterprise SSO Integration',
    description: 'Support for enterprise single sign-on solutions including SAML, OAuth, and Active Directory.',
    application: 'All Apps',
    releaseType: 'Minor',
    status: 'Released',
    milestone: 'Q4 2023',
    featuresAndChanges: 'SAML 2.0 support\nOAuth 2.0 integration\nActive Directory connectivity\nMFA compatibility\nCustom identity provider options',
    releasedDate: new Date('2023-10-20').toISOString(),
    releaseNotes: 'This release adds comprehensive support for enterprise identity providers, making it easier to integrate our platform with your existing security infrastructure.',
  },
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Released':
      return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300';
    case 'Delayed':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300';
    case 'Planned':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Released':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'In Progress':
      return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin-slow" />;
    case 'Delayed':
      return <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />;
    case 'Planned':
      return <ClockIcon className="w-5 h-5 text-gray-500" />;
    case 'Cancelled':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <ClockIcon className="w-5 h-5 text-gray-500" />;
  }
};

export const getStatusText = (status: string) => {
  return status;
};

export const getReleaseTypeColor = (type: string) => {
  switch (type) {
    case 'Major':
      return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300';
    case 'Minor':
      return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300';
    case 'Patch':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
  }
};

// Helper function to parse quarter and year from milestone string
export const parseMilestone = (milestone: string) => {
  const match = milestone.match(/Q(\d)\s*(\d{4})/i);
  if (!match) return { quarter: 0, year: 0 };
  return {
    quarter: parseInt(match[1]),
    year: parseInt(match[2])
  };
};

// Compare function for milestone sorting
export const compareMilestones = (a: string, b: string) => {
  const milestoneA = parseMilestone(a);
  const milestoneB = parseMilestone(b);
  
  if (milestoneA.year !== milestoneB.year) {
    return milestoneA.year - milestoneB.year;
  }
  return milestoneA.quarter - milestoneB.quarter;
};

interface ProductRoadmapProps {
  selectedApp: string;
  selectedReleaseType: string;
  selectedStatus: string;
}

export default function ProductRoadmap({ selectedApp, selectedReleaseType, selectedStatus }: ProductRoadmapProps) {
  const searchParams = useSearchParams();
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [milestones, setMilestones] = useState<{ title: string; features: RoadmapFeature[] }[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releaseTypes] = useState<string[]>(['Major', 'Minor', 'Patch']);
  const [statuses] = useState<string[]>(['Released', 'In Progress', 'Delayed', 'Planned', 'Cancelled']);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

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

  // Helper function to separate released and non-released features
  const separateFeaturesByReleaseStatus = (features: RoadmapFeature[]) => {
    const released = features.filter(f => f.releasedDate);
    const nonReleased = features.filter(f => !f.releasedDate);
    return { released, nonReleased };
  };

  // Handle expand query parameter
  useEffect(() => {
    const expandId = searchParams?.get('expand');
    if (expandId && !isOverlayOpen) {
      // Find the feature to expand
      const featureToExpand = features.find(f => f.id === expandId);
      if (featureToExpand) {
        setSelectedFeature(featureToExpand);
        setIsOverlayOpen(true);
        // Scroll to the feature after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(`roadmap-feature-${expandId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [searchParams, features, isOverlayOpen]);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        console.log('ProductRoadmap: Starting to fetch data...');
        
        // Close overlay when filters change
        if (isOverlayOpen) {
          setIsOverlayOpen(false);
          setSelectedFeature(null);
        }
        
        // Fetch real content from API
        const response = await fetch('/api/roadmaps');
        console.log('ProductRoadmap: API response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch roadmap features');
        }
        
        const roadmapFeatures = (await response.json()) as RoadmapFeature[];
        console.log('ProductRoadmap: Fetched features:', JSON.stringify(roadmapFeatures, null, 2));

        // Extract unique applications
        const uniqueApps = Array.from(new Set(roadmapFeatures.map(f => f.application).filter((app): app is string => !!app)));
        setApplications(uniqueApps);
        setFeatures(roadmapFeatures);

        // Group features by milestone
        const groupedMilestones = roadmapFeatures.reduce((acc: { title: string; features: RoadmapFeature[] }[], feature: RoadmapFeature) => {
          // Apply filters
          if (selectedApp && feature.application !== selectedApp) return acc;
          if (selectedReleaseType && feature.releaseType !== selectedReleaseType) return acc;
          if (selectedStatus && feature.status !== selectedStatus) return acc;

          const milestone = acc.find((m: { title: string }) => m.title === feature.milestone);
          if (milestone) {
            milestone.features.push(feature);
          } else {
            acc.push({
              title: feature.milestone,
              features: [feature]
            });
          }
          return acc;
        }, []);

        // Sort milestones
        groupedMilestones.sort((a, b) => compareMilestones(a.title, b.title));
        setMilestones(groupedMilestones);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch roadmap');
        
        // Fallback to demo content in case of error
        const roadmapFeatures = DEMO_ROADMAP_FEATURES;
        setFeatures(roadmapFeatures);
        
        // Extract unique applications
        const uniqueApps = Array.from(new Set(roadmapFeatures.map(f => f.application).filter((app): app is string => !!app)));
        setApplications(uniqueApps);
        
        // Group features by milestone with filters
        const groupedMilestones = roadmapFeatures.reduce((acc: { title: string; features: RoadmapFeature[] }[], feature: RoadmapFeature) => {
          // Apply filters
          if (selectedApp && feature.application !== selectedApp) return acc;
          if (selectedReleaseType && feature.releaseType !== selectedReleaseType) return acc;
          if (selectedStatus && feature.status !== selectedStatus) return acc;

          const milestone = acc.find((m: { title: string }) => m.title === feature.milestone);
          if (milestone) {
            milestone.features.push(feature);
          } else {
            acc.push({
              title: feature.milestone,
              features: [feature]
            });
          }
          return acc;
        }, []);

        // Sort milestones
        groupedMilestones.sort((a, b) => compareMilestones(a.title, b.title));
        setMilestones(groupedMilestones);
        
        setIsLoading(false);
      }
    }

    fetchRoadmap();
  }, [selectedApp, selectedReleaseType, selectedStatus]);

  return (
    <section className="bg-background">
      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-danger">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {milestones.map((milestone) => (
              <div key={milestone.title} className="relative">
                <div className="sticky top-0 z-[1] bg-background/95 backdrop-blur-sm py-4 mb-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    {milestone.title}
                  </h3>
                </div>

                <div className="space-y-8">
                  {(() => {
                    const { released, nonReleased } = separateFeaturesByReleaseStatus(milestone.features);
                    
                    return (
                      <>
                        {/* Non-Released Features */}
                        {nonReleased.length > 0 && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <h4 className="text-lg font-semibold text-foreground">Coming Soon</h4>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            {groupFeaturesIntoRows(nonReleased).map((row, rowIndex) => (
                              <div key={rowIndex} className={`grid ${getDynamicGridClasses(row.length)} gap-6`}>
                                {row.map((feature) => (
                                  <div
                                    key={feature.id}
                                    id={`roadmap-feature-${feature.id}`}
                                    className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg
                                    transition-all duration-300 border border-border relative flex flex-col
                                    hover:border-primary/30"
                                  >
                                    <div className="p-6">
                                      <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-shrink-0 mt-1">
                                          {getStatusIcon(feature.status)}
                                        </div>
                                        <div className="flex-grow">
                                          <h4 className="text-lg font-semibold text-foreground">
                                            {feature.name}
                                          </h4>
                                          {feature.application && (
                                            <div className="mt-1">
                                              {feature.applicationUrl ? (
                                                <Link
                                                  href={feature.applicationUrl.startsWith('http') ? feature.applicationUrl : `https://${feature.applicationUrl}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center text-sm text-accent-foreground hover:text-accent-hover
                                                  bg-accent hover:bg-accent/70 px-2.5 py-1 rounded-md transition-colors duration-200"
                                                >
                                                  {feature.application}
                                                  <svg className="ml-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </Link>
                                              ) : (
                                                <span className="inline-flex text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                                                  {feature.application}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <p className="text-muted-foreground mb-4">
                                        {feature.description}
                                      </p>

                                      {feature.featuresAndChanges && (
                                        <div className="mb-4 bg-muted/80 p-4 rounded-lg border border-border">
                                          <h5 className="text-sm font-semibold text-foreground mb-2">Features & Changes</h5>
                                          <div className="text-sm text-muted-foreground space-y-1.5">
                                            {feature.featuresAndChanges.split('\n').slice(0, 6).map((item: string, index: number) => {
                                              const trimmedItem = item.trim();
                                              if (!trimmedItem) return null;

                                              // Check for indentation (sub-bullets)
                                              const originalIndentation = item.length - item.trimStart().length;
                                              const isSubBullet = originalIndentation > 0;

                                              // Remove bullet points and clean up
                                              const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');

                                              return (
                                                <div key={index} className={`flex items-start ${isSubBullet ? 'ml-4' : ''}`}>
                                                  <span className={`mr-2 mt-[0.2rem] ${isSubBullet ? 'text-ink-faint' : 'text-primary'}`}>•</span>
                                                  <span
                                                    className="flex-grow leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                      __html: roadmapMarkdownToHtml(cleanedItem)
                                                    }}
                                                  />
                                                </div>
                                              );
                                            }).filter(Boolean)}
                                          </div>
                                          {feature.featuresAndChanges.split('\n').filter(line => line.trim()).length > 6 && (
                                            <button
                                              onClick={() => {
                                                setSelectedFeature(feature);
                                                setIsOverlayOpen(true);
                                              }}
                                              className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-3"
                                            >
                                              Read More
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {feature.releaseNotes && (
                                        <div className="mb-4 bg-accent/80 p-4 rounded-lg border border-accent">
                                          <h5 className="text-sm font-semibold text-accent-foreground mb-2">Release Notes</h5>
                                          <div className="text-sm text-accent-foreground">
                                            <div
                                              className="line-clamp-3"
                                              dangerouslySetInnerHTML={{
                                                __html: releaseNotesMarkdownToHtml(feature.releaseNotes)
                                              }}
                                            />
                                            {feature.releaseNotes.length > 150 && (
                                              <button
                                                onClick={() => {
                                                  setSelectedFeature(feature);
                                                  setIsOverlayOpen(true);
                                                }}
                                                className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-2"
                                              >
                                                Read More
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-auto">
                                      <div className="p-4 border-t border-border bg-muted/50">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReleaseTypeColor(feature.releaseType)}`}>
                                            {feature.releaseType}
                                          </span>
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feature.status)}`}>
                                            {feature.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Released Features */}
                        {released.length > 0 && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <h4 className="text-lg font-semibold text-foreground">Recently Released</h4>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            {groupFeaturesIntoRows(released).map((row, rowIndex) => (
                              <div key={rowIndex} className={`grid ${getDynamicGridClasses(row.length)} gap-6`}>
                                {row.map((feature) => (
                                  <div
                                    key={feature.id}
                                    id={`roadmap-feature-${feature.id}`}
                                    className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg
                                    transition-all duration-300 border border-success/30 relative flex flex-col
                                    hover:border-success/50"
                                  >
                                    <div className="p-6">
                                      <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-shrink-0 mt-1">
                                          {getStatusIcon(feature.status)}
                                        </div>
                                        <div className="flex-grow">
                                          <h4 className="text-lg font-semibold text-foreground">
                                            {feature.name}
                                          </h4>
                                          {feature.application && (
                                            <div className="mt-1">
                                              {feature.applicationUrl ? (
                                                <Link
                                                  href={feature.applicationUrl.startsWith('http') ? feature.applicationUrl : `https://${feature.applicationUrl}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center text-sm text-accent-foreground hover:text-accent-hover
                                                  bg-accent hover:bg-accent/70 px-2.5 py-1 rounded-md transition-colors duration-200"
                                                >
                                                  {feature.application}
                                                  <svg className="ml-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </Link>
                                              ) : (
                                                <span className="inline-flex text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                                                  {feature.application}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <p className="text-muted-foreground mb-4">
                                        {feature.description}
                                      </p>

                                      {feature.featuresAndChanges && (
                                        <div className="mb-4 bg-muted/80 p-4 rounded-lg border border-border">
                                          <h5 className="text-sm font-semibold text-foreground mb-2">Features & Changes</h5>
                                          <div className="text-sm text-muted-foreground space-y-1.5">
                                            {feature.featuresAndChanges.split('\n').slice(0, 6).map((item: string, index: number) => {
                                              const trimmedItem = item.trim();
                                              if (!trimmedItem) return null;

                                              // Check for indentation (sub-bullets)
                                              const originalIndentation = item.length - item.trimStart().length;
                                              const isSubBullet = originalIndentation > 0;

                                              // Remove bullet points and clean up
                                              const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');

                                              return (
                                                <div key={index} className={`flex items-start ${isSubBullet ? 'ml-4' : ''}`}>
                                                  <span className={`mr-2 mt-[0.2rem] ${isSubBullet ? 'text-ink-faint' : 'text-primary'}`}>•</span>
                                                  <span
                                                    className="flex-grow leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                      __html: roadmapMarkdownToHtml(cleanedItem)
                                                    }}
                                                  />
                                                </div>
                                              );
                                            }).filter(Boolean)}
                                          </div>
                                          {feature.featuresAndChanges.split('\n').filter(line => line.trim()).length > 6 && (
                                            <button
                                              onClick={() => {
                                                setSelectedFeature(feature);
                                                setIsOverlayOpen(true);
                                              }}
                                              className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-3"
                                            >
                                              Read More
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {feature.releaseNotes && (
                                        <div className="mb-4 bg-accent/80 p-4 rounded-lg border border-accent">
                                          <h5 className="text-sm font-semibold text-accent-foreground mb-2">Release Notes</h5>
                                          <div className="text-sm text-accent-foreground">
                                            <div
                                              className="line-clamp-3"
                                              dangerouslySetInnerHTML={{
                                                __html: releaseNotesMarkdownToHtml(feature.releaseNotes)
                                              }}
                                            />
                                            {feature.releaseNotes.length > 150 && (
                                              <button
                                                onClick={() => {
                                                  setSelectedFeature(feature);
                                                  setIsOverlayOpen(true);
                                                }}
                                                className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-2"
                                              >
                                                Read More
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-auto">
                                      <div className="p-4 border-t border-success/20 bg-success/10">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReleaseTypeColor(feature.releaseType)}`}>
                                            {feature.releaseType}
                                          </span>
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feature.status)}`}>
                                            {feature.status}
                                          </span>
                                        </div>
                                      </div>

                                      {feature.releasedDate && (
                                        <div className="text-center py-3 px-4 bg-success/10 border-t border-success/20">
                                          <div className="text-sm font-medium text-success">
                                            Released {new Date(feature.releasedDate).toLocaleDateString()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Overlay */}
      {selectedFeature && (
        <RoadmapOverlay 
          isOpen={isOverlayOpen}
          onClose={() => {
            setIsOverlayOpen(false);
            setSelectedFeature(null);
            // Clear the expand parameter from URL when overlay is closed
            if (searchParams?.get('expand')) {
              const url = new URL(window.location.href);
              url.searchParams.delete('expand');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          roadmap={selectedFeature}
        />
      )}
    </section>
  );
} 