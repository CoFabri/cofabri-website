import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  maxPullDistance = 200,
  enabled = true
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    progress: 0
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const isAtTop = useRef<boolean>(false);

  const updatePullDistance = useCallback((distance: number) => {
    const clampedDistance = Math.max(0, Math.min(distance, maxPullDistance));
    const progress = Math.min((clampedDistance / threshold) * 100, 100);
    
    setState(prev => ({
      ...prev,
      pullDistance: clampedDistance,
      progress
    }));
  }, [threshold, maxPullDistance]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;

    const element = elementRef.current;
    if (!element) return;

    // Check if we're at the top of the scrollable area
    isAtTop.current = element.scrollTop === 0;
    
    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      setState(prev => ({ ...prev, isPulling: true }));
    }
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !state.isPulling || state.isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0 && isAtTop.current) {
      e.preventDefault();
      const pullDistance = deltaY / resistance;
      updatePullDistance(pullDistance);
    }
  }, [enabled, state.isPulling, state.isRefreshing, resistance, updatePullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !state.isPulling || state.isRefreshing) return;

    if (state.pullDistance >= threshold) {
      setState(prev => ({ ...prev, isRefreshing: true }));
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh failed:', error);
      } finally {
        setState(prev => ({ ...prev, isRefreshing: false }));
      }
    }

    // Reset state
    setState(prev => ({
      ...prev,
      isPulling: false,
      pullDistance: 0,
      progress: 0
    }));
  }, [enabled, state.isPulling, state.isRefreshing, state.pullDistance, threshold, onRefresh]);

  const handleScroll = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      isAtTop.current = element.scrollTop === 0;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll]);

  return {
    state,
    elementRef,
    isEnabled: enabled
  };
}
