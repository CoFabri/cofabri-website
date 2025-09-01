'use client';

import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  maxPullDistance?: number;
  enabled?: boolean;
  className?: string;
}

export default function PullToRefreshWrapper({
  children,
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  maxPullDistance = 200,
  enabled = true,
  className = ''
}: PullToRefreshWrapperProps) {
  const { state, elementRef, isEnabled } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    maxPullDistance,
    enabled
  });

  return (
    <>
      <PullToRefreshIndicator
        isPulling={state.isPulling}
        isRefreshing={state.isRefreshing}
        progress={state.progress}
        pullDistance={state.pullDistance}
      />
      <div
        ref={elementRef}
        className={`${className} ${isEnabled ? 'touch-pan-y' : ''}`}
        style={{
          transform: state.isPulling ? `translateY(${state.pullDistance}px)` : 'translateY(0)',
          transition: state.isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </>
  );
}
