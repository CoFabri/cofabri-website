'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppPreviewCard from '@/components/marketing/AppPreviewCard';
import TestimonialPreviewCard from '@/components/marketing/TestimonialPreviewCard';
import type { App } from '@/lib/api-client';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { roadmapMarkdownToHtml, releaseNotesMarkdownToHtml } from '@/lib/utils';

interface PreviewContent {
  id: string;
  type: string;
  name?: string;
  role?: string;
  company?: string;
  content?: string;
  rating?: number;
  image?: string;
  description?: string;
  excerpt?: string;
  screenshot?: string;
  url?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  status?: string;
  launchDate?: string;
  category?: string;
  milestone?: string;
  releasedDate?: string;
  featuresAndChanges?: string;
  releaseType?: string;
  releaseNotes?: string;
  title?: string;
  publishedAt?: string;
  lastUpdated?: string;
  readTime?: number | string;
  bannerType?: string;
  buttonLink?: string;
  buttonText?: string;
  linkText?: string;
  linkUrl?: string;
  message?: string;
  publicStatus?: string;
  severity?: string;
  updates?: string;
  affectedServices?: string[];
  [key: string]: unknown;
}

interface SeoPreview {
  title: string;
  description: string;
  url: string;
  titleLength: number;
  descriptionLength: number;
}

interface MissingField {
  field: string;
  value: unknown;
}

interface Roadmap {
  id: string;
  name: string;
  description: string;
  status: string;
  category?: string;
  launchDate?: string;
  featuresAndChanges?: string;
  releaseNotes?: string;
  releaseType?: string;
  milestone?: string;
}

export default function PreviewPage() {
  const params = useParams();
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoPreview, setSeoPreview] = useState<SeoPreview | null>(null);
  const [isReadyToPost, setIsReadyToPost] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [optionalFields, setOptionalFields] = useState<string[]>([]);
  const [showLoading, setShowLoading] = useState(true);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [isReleaseNotesExpanded, setIsReleaseNotesExpanded] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (!params || typeof params !== 'object' || !('type' in params) || !('id' in params)) {
          setError('Invalid preview parameters.');
          setIsLoading(false);
          setShowLoading(false);
          return;
        }
        const response = await fetch(`/api/preview/${params.type}/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch preview content');
        }
        const data = await response.json();
        setContent(data);
        
        // Generate SEO preview
        const title = data.title || 'Untitled';
        const description = data.excerpt || data.content?.substring(0, 160) || 'No description available';
        const fullTitle = `${title} | Preview`;
        setSeoPreview({
          title: fullTitle,
          description,
          url: `${window.location.origin}/${params.type}/${data.slug || ''}`,
          titleLength: fullTitle.length,
          descriptionLength: description.length
        });

        // Define required and optional fields.
        // Field names match the properties returned by /api/preview/[type]/[id]
        // (which mirror the api-client.ts interfaces), not the old Airtable
        // field names.
        const requiredFieldsMap = {
          kb: ['title', 'content', 'slug', 'category'],
          apps: ['name', 'description', 'status', 'category', 'url'],
          roadmap: ['name', 'description', 'status'],
          legal: ['title', 'documentType', 'status'],
          testimonial: ['name', 'role', 'company', 'content', 'rating', 'image'],
          banner: ['title', 'message', 'bannerType'],
          marketing: ['title', 'content', 'buttonText', 'buttonLink'],
          popup: ['title', 'content', 'buttonText', 'buttonLink'],
          status: ['title', 'message', 'severity']
        };

        const optionalFieldsMap = {
          kb: ['author', 'readTime', 'publishedAt', 'lastUpdated', 'isPopular', 'isFeatured', 'tags', 'applications', 'logoUrl', 'relatedTopics'],
          apps: [
            'feature1',
            'feature2',
            'feature3',
            'launchDate',
            'releaseDate',
            'screenshot',
            'faviconUrl',
            'domains',
            'featureOnWebsite'
          ],
          roadmap: ['milestone', 'releaseType', 'releasedDate', 'application', 'applicationUrl', 'featuresAndChanges', 'releaseNotes'],
          legal: ['description', 'version', 'lastUpdated', 'documentUrl', 'associatedApp', 'category', 'isPublic', 'tags'],
          testimonial: [
            'featured',
            'order',
            'apps',
            'isActive',
            'createdAt'
          ],
          banner: ['linkUrl', 'linkText', 'backgroundColor', 'textColor', 'priority'],
          marketing: ['backgroundColor', 'textColor', 'buttonColor', 'position', 'delay', 'isEnabled'],
          popup: ['backgroundColor', 'textColor', 'buttonColor', 'position', 'delay', 'isEnabled'],
          status: ['publicStatus', 'affectedServices', 'application', 'updates']
        };

        const fields = requiredFieldsMap[params.type as keyof typeof requiredFieldsMap] || [];
        const optionalFieldsList = optionalFieldsMap[params.type as keyof typeof optionalFieldsMap] || [];
        const missing: MissingField[] = [];
        const allFields = Object.keys(data);
        
        // Use all required fields, don't filter them
        const required = fields;
        
        const optional = allFields.filter(field => 
          !required.some(r => r.toLowerCase() === field.toLowerCase()) && 
          (optionalFieldsList.length === 0 || optionalFieldsList.some(o => o.toLowerCase() === field.toLowerCase()))
        );
        
        setRequiredFields(required);
        setOptionalFields(optional);
        
        required.forEach(field => {
          // Find the actual field name in the data (case-insensitive)
          const actualField = allFields.find(f => f.toLowerCase() === field.toLowerCase()) || field;
          const value = data[actualField];
          
          if (
            value === undefined || 
            value === null || 
            value === '' || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && value.trim() === '')
          ) {
            missing.push({ field: actualField, value: value });
          }
        });

        setMissingFields(missing);
        setIsReadyToPost(missing.length === 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        // Add a minimum display time for the loading state
        setTimeout(() => {
          setIsLoading(false);
          setShowLoading(false);
        }, 500);
      }
    };

    fetchContent();
  }, [params && 'type' in params ? params.type : undefined, params && 'id' in params ? params.id : undefined]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase().replace(/_/g, ' ')) {
      case 'released':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in progress':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin-slow" />;
      case 'delayed':
        return <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />;
      case 'planned':
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case 'cancelled':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase().replace(/_/g, ' ')) {
      case 'released':
        return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300';
      case 'delayed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300';
      case 'planned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'major':
        return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300';
      case 'minor':
        return 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300';
      case 'patch':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300';
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Error Loading Preview</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Type:</span>
            <span className="font-medium">{params && 'type' in params ? params.type : 'N/A'}</span>
            <span>•</span>
            <span>ID:</span>
            <span className="font-medium">{params && 'id' in params ? params.id : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Content Not Found</h1>
          <p className="text-muted-foreground">The requested content could not be found.</p>
        </div>
      </div>
    );
  }

  // Map content to App interface for AppCard
  const appContent: App = {
    id: content.id,
    name: content.name || '',
    description: content.description || '',
    screenshot: content.screenshot || '',
    url: content.url || '',
    feature1: content.feature1 || '',
    feature2: content.feature2 || '',
    feature3: content.feature3 || '',
    status: content.status || '',
    launchDate: content.launchDate || '',
    category: content.category || ''
  };

  // Map content to Roadmap interface for RoadmapCard.
  // RoadmapFeature (api-client.ts) has no `category`/`launchDate` fields —
  // `milestone` (e.g. a target quarter) and `releasedDate` are the closest
  // equivalents, so they're reused for those display slots.
  const roadmapContent: Roadmap = {
    id: content.id,
    name: content.name || '',
    description: content.description || '',
    status: content.status || '',
    category: content.milestone || '',
    launchDate: content.releasedDate || '',
    featuresAndChanges: content.featuresAndChanges || '',
    releaseNotes: content.releaseNotes || '',
    releaseType: content.releaseType || '',
    milestone: content.milestone || ''
  };

  // Debug logging
  console.log('Content from cofabri-api:', content);
  console.log('Mapped app content:', appContent);
  console.log('Mapped roadmap content:', roadmapContent);

  return (
    <div className="min-h-screen bg-background">
        {/* Ready to Post Banner */}
      <div className={`w-full mt-16 ${
        isReadyToPost
          ? 'bg-success/10 border border-success/20'
          : 'bg-warning/10 border border-warning/20'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              {isReadyToPost ? (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/15">
                    <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-success">Ready to Post</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/15">
                    <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-warning">Missing Required Fields</span>
                </>
              )}
            </div>
            {!isReadyToPost && missingFields.length > 0 && (
              <div className="text-center">
                <p className="text-sm font-medium text-warning mb-2">Required fields that need to be filled:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {missingFields.map(({ field }) => (
                    <span
                      key={field}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/15 text-warning ring-1 ring-warning/30"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* App Preview */}
          {content.type === 'apps' && (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">App Preview</h2>
                <AppPreviewCard app={appContent} />
              </div>
            </div>
          )}

          {/* Roadmap Preview */}
          {content.type === 'roadmap' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border relative flex flex-col">
                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(roadmapContent.status)}
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-lg font-semibold text-foreground">
                              {roadmapContent.name}
                            </h4>
                            {roadmapContent.category && (
                              <div className="mt-1">
                                <span className="inline-flex text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                  {roadmapContent.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">
                          {roadmapContent.description}
                        </p>

                        {roadmapContent.featuresAndChanges && (
                          <div className="mb-4 bg-muted/80 p-4 rounded-lg border border-border">
                            <h5 className="text-sm font-semibold text-foreground mb-2">Features & Changes</h5>
                            <div className="text-sm text-muted-foreground space-y-1.5">
                              {roadmapContent.featuresAndChanges.split('\n').slice(0, isFeaturesExpanded ? undefined : 8).map((item: string, index: number) => {
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
                            {roadmapContent.featuresAndChanges.split('\n').filter(line => line.trim()).length > 8 && (
                              <button
                                onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                                className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-3"
                              >
                                {isFeaturesExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            )}
                          </div>
                        )}

                        {roadmapContent.releaseNotes && (
                          <div className="mb-4 bg-accent/80 p-4 rounded-lg border border-accent">
                            <h5 className="text-sm font-semibold text-accent-foreground mb-2">Release Notes</h5>
                            <div className="text-sm text-accent-foreground">
                              <div
                                className={isReleaseNotesExpanded ? '' : 'line-clamp-3'}
                                dangerouslySetInnerHTML={{
                                  __html: releaseNotesMarkdownToHtml(roadmapContent.releaseNotes)
                                }}
                              />
                              {roadmapContent.releaseNotes.length > 200 && (
                                <button
                                  onClick={() => setIsReleaseNotesExpanded(!isReleaseNotesExpanded)}
                                  className="text-primary hover:text-accent-hover text-sm font-medium transition-colors duration-200 mt-2"
                                >
                                  {isReleaseNotesExpanded ? 'Show Less' : 'Read More'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="p-4 border-t border-border bg-muted/50">
                          <div className="flex flex-wrap items-center gap-2">
                            {roadmapContent.releaseType && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReleaseTypeColor(roadmapContent.releaseType)}`}>
                                {roadmapContent.releaseType}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(roadmapContent.status)}`}>
                              {roadmapContent.status || 'Unknown Status'}
                            </span>
                          </div>
                        </div>

                        {roadmapContent.launchDate && (
                          <div className="text-center py-3 px-4 bg-success/10 border-t border-success/20">
                            <div className="text-sm font-medium text-success">
                              Released {new Date(roadmapContent.launchDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Knowledge Base Preview */}
          {content.type === 'kb' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src="/images/placeholder.jpg"
                          alt={content.title || 'Article'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                            {content.category || 'Uncategorized'}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-foreground">
                          {content.title || 'Untitled'}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                          {content.excerpt || content.content?.substring(0, 150) || 'No excerpt available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-primary">⏱️</span>
                            <span>{content.readTime || '5'} min read</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-primary">📅</span>
                            <span>{new Date(content.publishedAt || content.lastUpdated || new Date()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Site-wide Banner Preview */}
          {content.type === 'banner' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Banner Preview</h2>
                        <div className="space-y-4">
                          {/* Banner Content */}
                          <div className={`p-4 rounded-lg ${
                            content.bannerType?.toLowerCase() === 'error'
                              ? 'bg-danger/10 border border-danger/20'
                              : content.bannerType?.toLowerCase() === 'warning'
                                ? 'bg-warning/10 border border-warning/20'
                                : 'bg-accent border border-accent'
                          }`}>
                            <div className="flex items-start gap-3">
                              {content.bannerType?.toLowerCase() === 'error' ? (
                                <ExclamationCircleIcon className="w-5 h-5 text-danger mt-0.5" />
                              ) : content.bannerType?.toLowerCase() === 'warning' ? (
                                <ExclamationCircleIcon className="w-5 h-5 text-warning mt-0.5" />
                              ) : (
                                <CheckCircleIcon className="w-5 h-5 text-accent-foreground mt-0.5" />
                              )}
                              <div>
                                <h3 className="font-medium text-foreground">
                                  {content.title || 'Banner Title'}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {content.message || 'Banner message content'}
                                </p>
                                {content.linkText && (
                                  <div className="mt-3">
                                    <a
                                      href={content.linkUrl || '#'}
                                      className="inline-flex items-center text-sm font-medium text-primary hover:text-accent-hover"
                                    >
                                      {content.linkText}
                                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Marketing Content Preview */}
          {content.type === 'marketing' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Marketing Content Preview</h2>
                        <div className="space-y-6">
                          <div className="text-center">
                            <h1 className="text-3xl font-bold text-foreground">
                              {content.title || 'Marketing Title'}
                            </h1>
                          </div>
                          <div className="prose prose-lg max-w-none">
                            {content.content || 'Marketing content'}
                          </div>
                          {content.buttonText && (
                            <div className="text-center">
                              <a
                                href={content.buttonLink || '#'}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-accent-hover"
                              >
                                {content.buttonText}
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Pop-up Preview */}
          {content.type === 'popup' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Pop-up Preview</h2>
                        <div className="relative">
                          <div className="absolute top-4 right-4">
                            <button className="text-ink-faint hover:text-muted-foreground">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-center">
                            <h3 className="text-xl font-semibold text-foreground">
                              {content.title || 'Pop-up Title'}
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                              {content.content || 'Pop-up message content'}
                            </p>
                            <div className="mt-4 space-y-2">
                              <button className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-accent-hover">
                                {content.buttonText || 'Primary Action'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* System Status Preview */}
          {content.type === 'status' && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">System Status Preview</h2>
                        <div className="space-y-4">
                          {/* Status Header */}
                          <div className="flex items-center gap-3">
                            {content.publicStatus === 'Resolved' ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : content.severity === 'Critical' || content.severity === 'High' ? (
                              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
                            )}
                            <h3 className="text-xl font-semibold text-foreground">
                              {content.title || 'System Status'}
                            </h3>
                          </div>
                          <p className="text-muted-foreground">
                            {content.message || 'Status message'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {content.publicStatus && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground">
                                {content.publicStatus}
                              </span>
                            )}
                            {content.severity && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground">
                                {content.severity} severity
                              </span>
                            )}
                          </div>
                          {Array.isArray(content.affectedServices) && content.affectedServices.length > 0 && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <h4 className="text-sm font-medium text-foreground mb-2">Affected Services</h4>
                              <p className="text-sm text-muted-foreground">{content.affectedServices.join(', ')}</p>
                            </div>
                          )}
                          {content.updates && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-foreground mb-2">Updates</h4>
                              <p className="text-sm text-muted-foreground">{content.updates}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Testimonial Preview */}
          {content.type === 'testimonial' && content.name && content.role && content.company && content.content && content.rating && content.image && (
            <section className="bg-background">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Testimonial Preview</h2>
                        <TestimonialPreviewCard testimonial={{
                          id: content.id,
                          name: content.name,
                          role: content.role,
                          company: content.company,
                          content: content.content,
                          rating: content.rating,
                          image: typeof content.image === 'string' && content.image
                            ? content.image
                            : '/images/placeholder.jpg'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Elements Check */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Fields Check</h2>
                  <p className="text-sm text-muted-foreground mt-1">Review and verify all required and optional fields</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  isReadyToPost
                    ? 'bg-success/10 text-success ring-2 ring-success/30'
                    : 'bg-warning/10 text-warning ring-2 ring-warning/30'
                }`}>
                  {isReadyToPost ? 'All Required Fields Complete' : `${missingFields.length} Required Fields Missing`}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Required Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Required Fields</h3>
                    <span className="text-xs text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                      {missingFields.length} missing
                    </span>
                  </div>
                  <div className="space-y-3">
                    {requiredFields.map((field) => {
                      // Find the actual field name in the data (case-insensitive)
                      const actualField = Object.keys(content).find(f => f.toLowerCase() === field.toLowerCase()) || field;
                      const value = content[actualField];
                      const isPresent = value !== undefined &&
                        value !== null &&
                        value !== '' &&
                        !(Array.isArray(value) && value.length === 0) &&
                        !(typeof value === 'string' && value.trim() === '');

                      return (
                        <div key={field} className={`flex flex-col p-3 rounded-lg border transition-colors ${
                          isPresent
                            ? 'bg-success/10 border-success/20 hover:bg-success/15'
                            : 'bg-danger/10 border-danger/20 hover:bg-danger/15'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{field}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isPresent
                                ? 'bg-success/15 text-success'
                                : 'bg-danger/15 text-danger'
                            }`}>
                              {isPresent ? '✓ Present' : 'Missing'}
                            </span>
                          </div>
                          {isPresent ? (
                            <div className="text-sm text-muted-foreground bg-card/50 p-2 rounded-md border border-border">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </div>
                          ) : (
                            <div className="text-sm text-ink-faint italic">No value provided</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Optional Fields</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {optionalFields.length} available
                    </span>
                  </div>
                  <div className="space-y-3">
                    {optionalFields.map((field) => {
                      const value = content[field];
                      const isPresent = value !== undefined &&
                        value !== null &&
                        value !== '' &&
                        !(Array.isArray(value) && value.length === 0) &&
                        !(typeof value === 'string' && value.trim() === '');
                      return (
                        <div key={field} className={`flex flex-col p-3 rounded-lg border transition-colors ${
                          isPresent
                            ? 'bg-accent/50 border-accent/30 hover:bg-accent'
                            : 'bg-muted/50 border-border hover:bg-muted'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{field}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isPresent
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {isPresent ? '✓ Present' : 'Optional'}
                            </span>
                          </div>
                          {isPresent ? (
                            <div className="text-sm text-muted-foreground bg-card/50 p-2 rounded-md border border-border">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </div>
                          ) : (
                            <div className="text-sm text-ink-faint italic">No value provided</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">SEO Preview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">Title</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        seoPreview?.titleLength && seoPreview.titleLength > 60
                          ? 'text-danger'
                          : seoPreview?.titleLength && seoPreview.titleLength < 30
                            ? 'text-warning'
                            : 'text-success'
                      }`}>
                        {seoPreview?.titleLength}/60 characters
                      </span>
                      {seoPreview?.titleLength && (
                        <span className={`text-xs font-medium ${
                          seoPreview.titleLength > 60
                            ? 'text-danger'
                            : seoPreview.titleLength < 30
                              ? 'text-warning'
                              : 'text-success'
                        }`}>
                          {seoPreview.titleLength > 60
                            ? 'Too long (max 60)'
                            : seoPreview.titleLength < 30
                              ? 'Too short (min 30)'
                              : 'Optimal length'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-foreground border border-border">{seoPreview?.title}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">Description</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        seoPreview?.descriptionLength && seoPreview.descriptionLength > 160
                          ? 'text-danger'
                          : seoPreview?.descriptionLength && seoPreview.descriptionLength < 120
                            ? 'text-warning'
                            : 'text-success'
                      }`}>
                        {seoPreview?.descriptionLength}/160 characters
                      </span>
                      {seoPreview?.descriptionLength && (
                        <span className={`text-xs font-medium ${
                          seoPreview.descriptionLength > 160
                            ? 'text-danger'
                            : seoPreview.descriptionLength < 120
                              ? 'text-warning'
                              : 'text-success'
                        }`}>
                          {seoPreview.descriptionLength > 160
                            ? 'Too long (max 160)'
                            : seoPreview.descriptionLength < 120
                              ? 'Too short (min 120)'
                              : 'Optimal length'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-foreground border border-border">{seoPreview?.description}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">URL</label>
                  <div className="p-3 bg-muted rounded-md text-foreground border border-border">{seoPreview?.url}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Raw Data</h2>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm border border-border">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-accent border-t border-accent">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-hover/15">
                <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-accent-foreground">Preview Mode</span>
            </div>
            <span className="text-xs text-accent-foreground bg-accent-hover/15 px-2 py-1 rounded-full">
              {params && 'type' in params ? params.type : 'N/A'}/{params && 'id' in params ? params.id : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 