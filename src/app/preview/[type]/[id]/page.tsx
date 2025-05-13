'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppPreviewCard from '@/components/ui/AppPreviewCard';
import RoadmapPreviewCard from '@/components/ui/RoadmapPreviewCard';
import TestimonialPreviewCard from '@/components/ui/TestimonialPreviewCard';
import type { App } from '@/lib/airtable';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface PreviewContent {
  id: string;
  type: string;
  name?: string;
  role?: string;
  company?: string;
  content?: string;
  rating?: number;
  image?: {
    url: string;
    thumbnails?: {
      large: { url: string };
    };
  }[];
  [key: string]: any;
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
  value: any;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoPreview, setSeoPreview] = useState<SeoPreview | null>(null);
  const [isReadyToPost, setIsReadyToPost] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [optionalFields, setOptionalFields] = useState<string[]>([]);
  const [showLoading, setShowLoading] = useState(true);

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
        const title = data.Title || data.title || 'Untitled';
        const description = data.Excerpt || data.excerpt || data.Content?.substring(0, 160) || 'No description available';
        const fullTitle = `${title} | Preview`;
        setSeoPreview({
          title: fullTitle,
          description,
          url: `${window.location.origin}/${params.type}/${data.Slug || data.slug || ''}`,
          titleLength: fullTitle.length,
          descriptionLength: description.length
        });

        // Define required and optional fields
        const requiredFieldsMap = {
          kb: ['Title', 'Content', 'Slug', 'Category'],
          apps: [
            'Name',
            'Description',
            'Application Status',
            'Category',
            'URL'
          ],
          authors: ['Name', 'Role'],
          roadmap: ['Name', 'Description', 'Status'],
          status: ['Title', 'Message', 'Severity'],
          testimonial: ['Name', 'Role/Position', 'Company', 'Content', 'Rating', 'Profile Image']
        };

        const optionalFieldsMap = {
          apps: [
            'Feature 1',
            'Feature 2',
            'Feature 3',
            'Launch Date',
            'Launch Announcement',
            'Launch Countdown',
            'Image URL'
          ],
          testimonial: [
            'Featured',
            'Order',
            'Apps'
          ]
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
    switch (status?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      case 'planned':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'major':
        return 'bg-red-100 text-red-800';
      case 'minor':
        return 'bg-green-100 text-green-800';
      case 'patch':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Preview</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
          <p className="text-gray-600">The requested content could not be found.</p>
        </div>
      </div>
    );
  }

  // Map content to App interface for AppCard
  const appContent: App = {
    id: content.id,
    name: content.Name || content.name || '',
    description: content.Description || content.description || '',
    screenshot: content['Image URL'] || content.imageUrl || '',
    url: content.URL || content.url || '',
    feature1: content['Feature 1'] || content.feature1 || '',
    feature2: content['Feature 2'] || content.feature2 || '',
    feature3: content['Feature 3'] || content.feature3 || '',
    status: content['Application Status'] || content.status || '',
    launchDate: content['Launch Date'] || content.launchDate || content.Launch || '',
    category: content.Category || content.category || ''
  };

  // Map content to Roadmap interface for RoadmapCard
  const roadmapContent: Roadmap = {
    id: content.id,
    name: content.Name || content.name || '',
    description: content.Description || content.description || '',
    status: content.Status || content.status || '',
    category: content.Category || content.category || '',
    launchDate: content['Launch Date'] || content.launchDate || '',
    featuresAndChanges: content['Features & Changes'] || content.featuresAndChanges || '',
    releaseNotes: content['Release Notes'] || content.releaseNotes || '',
    releaseType: content['Release Type'] || content.releaseType || '',
    milestone: content.Milestone || content.milestone || ''
  };

  // Debug logging
  console.log('Content from Airtable:', content);
  console.log('Mapped app content:', appContent);
  console.log('Mapped roadmap content:', roadmapContent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ready to Post Banner */}
      <div className={`w-full mt-16 ${
        isReadyToPost 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
          : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              {isReadyToPost ? (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-green-800">Ready to Post</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-yellow-800">Missing Required Fields</span>
                </>
              )}
            </div>
            {!isReadyToPost && missingFields.length > 0 && (
              <div className="text-center">
                <p className="text-sm font-medium text-yellow-700 mb-2">Required fields that need to be filled:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {missingFields.map(({ field }) => (
                    <span 
                      key={field}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">App Preview</h2>
                <AppPreviewCard app={appContent} />
              </div>
            </div>
          )}

          {/* Roadmap Preview */}
          {content.type === 'roadmap' && (
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 relative flex flex-col">
                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(roadmapContent.status)}
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {roadmapContent.name}
                            </h4>
                            {roadmapContent.category && (
                              <div className="mt-1">
                                <span className="inline-flex text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                                  {roadmapContent.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">
                          {roadmapContent.description}
                        </p>

                        {roadmapContent.featuresAndChanges && (
                          <div className="mb-4 bg-gray-50/80 p-4 rounded-lg">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Features & Changes</h5>
                            <div className="text-sm text-gray-600 space-y-1.5">
                              {roadmapContent.featuresAndChanges.split('\n').map((item: string, index: number) => {
                                const trimmedItem = item.trim();
                                const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');
                                return cleanedItem ? (
                                  <div key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2 mt-[0.2rem]">•</span>
                                    <span className="flex-grow leading-relaxed">{cleanedItem}</span>
                                  </div>
                                ) : null;
                              }).filter(Boolean)}
                            </div>
                          </div>
                        )}

                        {roadmapContent.releaseNotes && (
                          <div className="mb-4 bg-blue-50/80 p-4 rounded-lg">
                            <h5 className="text-sm font-semibold text-blue-900 mb-2">Release Notes</h5>
                            <p className="text-sm text-blue-700">{roadmapContent.releaseNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
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
                          <div className="text-center py-3 px-4 bg-green-50 border-t border-green-100">
                            <div className="text-sm font-medium text-green-800">
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
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src="/images/placeholder.jpg"
                          alt={content.Title || content.title || 'Article'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {content.Category || content.category || 'Uncategorized'}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-gray-900">
                          {content.Title || content.title || 'Untitled'}
                        </h2>
                        <p className="text-gray-600 mb-4">
                          {content.Excerpt || content.excerpt || content.Content?.substring(0, 150) || 'No excerpt available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">⏱️</span>
                            <span>{content.ReadTime || content.readTime || '5'} min read</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">📅</span>
                            <span>{new Date(content.PublishedAt || content.publishedAt || new Date()).toLocaleDateString()}</span>
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
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Preview</h2>
                        <div className="space-y-4">
                          {/* Banner Content */}
                          <div className={`p-4 rounded-lg ${
                            content.Severity?.toLowerCase() === 'error' 
                              ? 'bg-red-50 border border-red-200' 
                              : content.Severity?.toLowerCase() === 'warning'
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              {content.Severity?.toLowerCase() === 'error' ? (
                                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                              ) : content.Severity?.toLowerCase() === 'warning' ? (
                                <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                              ) : (
                                <CheckCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                              )}
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {content.Title || content.title || 'Banner Title'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                  {content.Message || content.message || 'Banner message content'}
                                </p>
                                {content.Action && (
                                  <div className="mt-3">
                                    <a 
                                      href={content.ActionURL || content.actionUrl || '#'}
                                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      {content.Action}
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
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Marketing Content Preview</h2>
                        <div className="space-y-6">
                          {/* Hero Section */}
                          <div className="relative h-64 rounded-xl overflow-hidden">
                            <Image
                              src={content.HeroImage || content.heroImage || '/images/placeholder.jpg'}
                              alt={content.Title || content.title || 'Marketing Hero'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900">
                              {content.Title || content.title || 'Marketing Title'}
                            </h1>
                            <p className="mt-2 text-xl text-gray-600">
                              {content.Subtitle || content.subtitle || 'Marketing subtitle'}
                            </p>
                          </div>
                          <div className="prose prose-lg max-w-none">
                            {content.Content || content.content || 'Marketing content'}
                          </div>
                          {content.CTAText && (
                            <div className="text-center">
                              <a
                                href={content.CTAURL || content.ctaUrl || '#'}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                              >
                                {content.CTAText}
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
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pop-up Preview</h2>
                        <div className="relative">
                          <div className="absolute top-4 right-4">
                            <button className="text-gray-400 hover:text-gray-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {content.Title || content.title || 'Pop-up Title'}
                            </h3>
                            <p className="mt-2 text-gray-600">
                              {content.Message || content.message || 'Pop-up message content'}
                            </p>
                            <div className="mt-4 space-y-2">
                              <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                {content.PrimaryButton || content.primaryButton || 'Primary Action'}
                              </button>
                              <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                {content.SecondaryButton || content.secondaryButton || 'Secondary Action'}
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
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status Preview</h2>
                        <div className="space-y-4">
                          {/* Status Header */}
                          <div className="flex items-center gap-3">
                            {content.Status?.toLowerCase() === 'operational' ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : content.Status?.toLowerCase() === 'degraded' ? (
                              <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                            )}
                            <h3 className="text-xl font-semibold text-gray-900">
                              {content.Title || content.title || 'System Status'}
                            </h3>
                          </div>
                          <p className="text-gray-600">
                            {content.Message || content.message || 'Status message'}
                          </p>
                          {content.Impact && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Impact</h4>
                              <p className="text-sm text-gray-600">{content.Impact}</p>
                            </div>
                          )}
                          {content.Updates && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Updates</h4>
                              <div className="space-y-3">
                                {Array.isArray(content.Updates) ? content.Updates.map((update: any, index: number) => (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                      <ClockIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">{update.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(update.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-sm text-gray-600">No updates available</p>
                                )}
                              </div>
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
          {content.type === 'testimonial' && content.name && content['Role/Position'] && content.company && content.content && content.rating && content.image && (
            <section className="bg-white">
              <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Testimonial Preview</h2>
                        <TestimonialPreviewCard testimonial={{
                          id: content.id,
                          name: content.name,
                          role: content['Role/Position'],
                          company: content.company,
                          content: content.content,
                          rating: content.rating,
                          image: content.image
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Elements Check */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Fields Check</h2>
                  <p className="text-sm text-gray-500 mt-1">Review and verify all required and optional fields</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  isReadyToPost 
                    ? 'bg-green-50 text-green-700 ring-2 ring-green-200' 
                    : 'bg-yellow-50 text-yellow-700 ring-2 ring-yellow-200'
                }`}>
                  {isReadyToPost ? 'All Required Fields Complete' : `${missingFields.length} Required Fields Missing`}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Required Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Required Fields</h3>
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
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
                            ? 'bg-green-50/50 border-green-100 hover:bg-green-50' 
                            : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{field}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isPresent 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {isPresent ? '✓ Present' : 'Missing'}
                            </span>
                          </div>
                          {isPresent ? (
                            <div className="text-sm text-gray-600 bg-white/50 p-2 rounded-md border border-gray-100">
                              {Array.isArray(value) ? value.join(', ') : value.toString()}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">No value provided</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Optional Fields</h3>
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
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
                            ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50' 
                            : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{field}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isPresent 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isPresent ? '✓ Present' : 'Optional'}
                            </span>
                          </div>
                          {isPresent ? (
                            <div className="text-sm text-gray-600 bg-white/50 p-2 rounded-md border border-gray-100">
                              {Array.isArray(value) ? value.join(', ') : value.toString()}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">No value provided</div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Preview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        seoPreview?.titleLength && seoPreview.titleLength > 60 
                          ? 'text-red-600' 
                          : seoPreview?.titleLength && seoPreview.titleLength < 30 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {seoPreview?.titleLength}/60 characters
                      </span>
                      {seoPreview?.titleLength && (
                        <span className={`text-xs font-medium ${
                          seoPreview.titleLength > 60 
                            ? 'text-red-600' 
                            : seoPreview.titleLength < 30 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
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
                  <div className="p-3 bg-gray-50 rounded-md text-gray-900 border border-gray-200">{seoPreview?.title}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        seoPreview?.descriptionLength && seoPreview.descriptionLength > 160 
                          ? 'text-red-600' 
                          : seoPreview?.descriptionLength && seoPreview.descriptionLength < 120 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {seoPreview?.descriptionLength}/160 characters
                      </span>
                      {seoPreview?.descriptionLength && (
                        <span className={`text-xs font-medium ${
                          seoPreview.descriptionLength > 160 
                            ? 'text-red-600' 
                            : seoPreview.descriptionLength < 120 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
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
                  <div className="p-3 bg-gray-50 rounded-md text-gray-900 border border-gray-200">{seoPreview?.description}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <div className="p-3 bg-gray-50 rounded-md text-gray-900 border border-gray-200">{seoPreview?.url}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm border border-gray-200">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-800">Preview Mode</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {params && 'type' in params ? params.type : 'N/A'}/{params && 'id' in params ? params.id : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 