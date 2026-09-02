import React from 'react';

interface SEOChecklistProps {
  pageTitle: string;
  checks: {
    title: string;
    status: 'pass' | 'fail' | 'warning';
    description: string;
  }[];
}

export default function SEOChecklist({ pageTitle, checks }: SEOChecklistProps) {
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't render in production
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <h3 className="font-semibold text-gray-900 mb-3">SEO Checklist: {pageTitle}</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-sm">{getStatusIcon(check.status)}</span>
            <div className="flex-1">
              <div className={`text-xs px-2 py-1 rounded ${getStatusColor(check.status)}`}>
                {check.title}
              </div>
              <p className="text-xs text-gray-600 mt-1">{check.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          This checklist only appears in development mode.
        </p>
      </div>
    </div>
  );
}

// SEO Checklist Data
export const seoChecks = {
  title: {
    title: 'Page Title',
    status: 'pass' as const,
    description: 'Page has a unique, descriptive title under 60 characters'
  },
  description: {
    title: 'Meta Description',
    status: 'pass' as const,
    description: 'Page has a unique meta description between 150-160 characters'
  },
  headings: {
    title: 'Heading Structure',
    status: 'pass' as const,
    description: 'Page uses proper H1, H2, H3 heading hierarchy'
  },
  images: {
    title: 'Image Alt Text',
    status: 'pass' as const,
    description: 'All images have descriptive alt text'
  },
  links: {
    title: 'Internal Links',
    status: 'pass' as const,
    description: 'Page has relevant internal links with descriptive anchor text'
  },
  mobile: {
    title: 'Mobile Friendly',
    status: 'pass' as const,
    description: 'Page is responsive and mobile-friendly'
  },
  speed: {
    title: 'Page Speed',
    status: 'pass' as const,
    description: 'Page loads quickly (under 3 seconds)'
  },
  structured: {
    title: 'Structured Data',
    status: 'pass' as const,
    description: 'Page includes relevant JSON-LD structured data'
  },
  canonical: {
    title: 'Canonical URL',
    status: 'pass' as const,
    description: 'Page has a canonical URL to prevent duplicate content'
  },
  social: {
    title: 'Social Meta Tags',
    status: 'pass' as const,
    description: 'Page has Open Graph and Twitter Card meta tags'
  }
};
