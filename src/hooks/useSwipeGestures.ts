import { useEffect, useRef, useState, useCallback } from 'react';

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefault?: boolean;
  enableHapticFeedback?: boolean;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (event: TouchEvent) => void;
  onSwipeMove?: (event: TouchEvent) => void;
  onSwipeEnd?: (event: TouchEvent) => void;
}

interface SwipeState {
  isSwiping: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefault = true,
    enableHapticFeedback = true,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    direction: null,
  });

  const startTimeRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback) return;
    
    if ('vibrate' in navigator) {
      const vibrationPatterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(vibrationPatterns[type]);
    }
  }, [enableHapticFeedback]);

  // Determine swipe direction
  const getSwipeDirection = useCallback((deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const startTime = Date.now();
    
    setSwipeState(prev => ({
      ...prev,
      isSwiping: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
    }));
    
    startTimeRef.current = startTime;
    isScrollingRef.current = false;
    
    callbacks.onSwipeStart?.(event);
  }, [callbacks]);

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length !== 1 || !swipeState.isSwiping) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    // Check if we're scrolling (vertical movement > horizontal)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      isScrollingRef.current = true;
    }
    
    // Prevent default if we're swiping and not scrolling
    if (preventDefault && !isScrollingRef.current && Math.abs(deltaX) > 10) {
      event.preventDefault();
    }
    
    const direction = getSwipeDirection(deltaX, deltaY);
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction,
    }));
    
    callbacks.onSwipeMove?.(event);
  }, [swipeState.isSwiping, swipeState.startX, swipeState.startY, preventDefault, getSwipeDirection, callbacks]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!swipeState.isSwiping) return;
    
    const endTime = Date.now();
    const swipeTime = endTime - startTimeRef.current;
    const { deltaX, deltaY, direction } = swipeState;
    
    // Check if swipe meets criteria
    const isSwipeValid = 
      !isScrollingRef.current &&
      Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= minSwipeDistance &&
      swipeTime <= maxSwipeTime;
    
    if (isSwipeValid && direction) {
      // Trigger haptic feedback
      triggerHapticFeedback('light');
      
      // Call appropriate callback
      switch (direction) {
        case 'left':
          callbacks.onSwipeLeft?.();
          break;
        case 'right':
          callbacks.onSwipeRight?.();
          break;
        case 'up':
          callbacks.onSwipeUp?.();
          break;
        case 'down':
          callbacks.onSwipeDown?.();
          break;
      }
    }
    
    // Reset state
    setSwipeState(prev => ({
      ...prev,
      isSwiping: false,
      deltaX: 0,
      deltaY: 0,
      direction: null,
    }));
    
    callbacks.onSwipeEnd?.(event);
  }, [swipeState, minSwipeDistance, maxSwipeTime, triggerHapticFeedback, callbacks]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    swipeState,
    isSwiping: swipeState.isSwiping,
    direction: swipeState.direction,
    deltaX: swipeState.deltaX,
    deltaY: swipeState.deltaY,
  };
}

// Specialized hook for mobile menu swipe
export function useMobileMenuSwipe(
  elementRef: React.RefObject<HTMLElement>,
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void
) {
  return useSwipeGestures(elementRef, {
    onSwipeRight: () => {
      if (!isOpen) onOpen();
    },
    onSwipeLeft: () => {
      if (isOpen) onClose();
    },
  }, {
    minSwipeDistance: 60,
    maxSwipeTime: 400,
    enableHapticFeedback: true,
  });
}

// Specialized hook for modal dismissal
export function useModalSwipe(
  elementRef: React.RefObject<HTMLElement>,
  onClose: () => void
) {
  return useSwipeGestures(elementRef, {
    onSwipeDown: onClose,
    onSwipeUp: onClose,
  }, {
    minSwipeDistance: 80,
    maxSwipeTime: 500,
    enableHapticFeedback: true,
  });
}

// Specialized hook for carousel navigation
export function useCarouselSwipe(
  elementRef: React.RefObject<HTMLElement>,
  onNext: () => void,
  onPrevious: () => void
) {
  return useSwipeGestures(elementRef, {
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
  }, {
    minSwipeDistance: 50,
    maxSwipeTime: 300,
    enableHapticFeedback: true,
  });
}
