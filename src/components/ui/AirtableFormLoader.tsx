'use client';

import React, { useState, useEffect } from 'react';
import { startPerformanceTracking, endPerformanceTracking } from '@/lib/performance';

interface AirtableFormLoaderProps {
  src: string;
  height: string;
  title: string;
  className?: string;
  timeout?: number; // Timeout in milliseconds
}

export default function AirtableFormLoader({ 
  src, 
  height, 
  title, 
  className = "",
  timeout = 10000 // 10 seconds default timeout
}: AirtableFormLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [performanceId, setPerformanceId] = useState<string>('');

  useEffect(() => {
    // Start performance tracking
    const id = startPerformanceTracking(src, title);
    setPerformanceId(id);

    // Set a timeout to hide loading state if iframe takes too long
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
        console.warn(`⏰ Timeout reached for ${title} after ${timeout}ms`);
      }
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      if (performanceId) {
        endPerformanceTracking(performanceId);
      }
    };
  }, [src, title, timeout, isLoading, performanceId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (performanceId) {
      endPerformanceTracking(performanceId);
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    if (performanceId) {
      endPerformanceTracking(performanceId);
    }
    console.error(`❌ Failed to load ${title}`);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white rounded-xl flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading {title.toLowerCase()}...</p>
          <div className="mt-6 space-y-3 w-full max-w-md">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-white rounded-xl flex flex-col items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Loading Failed</h3>
            <p className="text-gray-600 mb-4">The {title.toLowerCase()} couldn't be loaded. Please try refreshing the page.</p>
            <button 
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                // Force iframe reload by changing the key
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <iframe
        key={src}
        className="w-full border-0 rounded-lg"
        style={{ height }}
        src={src}
        title={title}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}
