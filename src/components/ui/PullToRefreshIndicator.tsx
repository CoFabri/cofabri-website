'use client';

import { useEffect, useState } from 'react';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  progress: number;
  pullDistance: number;
}

export default function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  progress,
  pullDistance
}: PullToRefreshIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    setShowIndicator(isPulling || isRefreshing);
  }, [isPulling, isRefreshing]);

  if (!showIndicator) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm border-b border-gray-200 transition-all duration-300"
      style={{
        height: `${Math.min(pullDistance, 80)}px`,
        opacity: isRefreshing ? 1 : Math.min(progress / 100, 1)
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        {isRefreshing ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium text-gray-700">Refreshing...</span>
          </>
        ) : (
          <>
            <div 
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full transition-transform duration-200"
              style={{
                transform: `rotate(${Math.min(progress * 3.6, 360)}deg)`
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {progress >= 100 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
