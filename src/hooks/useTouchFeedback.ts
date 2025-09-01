import { useCallback } from 'react';
import { hapticFeedback, isTouchDevice, isIOS } from '@/lib/utils';

interface TouchFeedbackOptions {
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  preventDefault?: boolean;
  stopPropagation?: boolean;
  delay?: number;
}

/**
 * Custom hook for enhanced touch feedback
 * Provides haptic feedback and touch animations for better mobile interactions
 */
export function useTouchFeedback(options: TouchFeedbackOptions = {}) {
  const {
    hapticType = 'light',
    preventDefault = false,
    stopPropagation = false,
    delay = 0
  } = options;

  const handleTouchStart = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }

    // Add touch feedback class to the target element
    const target = event.currentTarget as HTMLElement;
    target.classList.add('touch-active');

    // Provide haptic feedback on touch start
    if (isTouchDevice()) {
      setTimeout(() => {
        hapticFeedback(hapticType);
      }, delay);
    }
  }, [hapticType, preventDefault, stopPropagation, delay]);

  const handleTouchEnd = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }

    // Remove touch feedback class from the target element
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('touch-active');
  }, [preventDefault, stopPropagation]);

  const handleTouchMove = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }
  }, [preventDefault, stopPropagation]);

  const handleTouchCancel = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }

    // Remove touch feedback class from the target element
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('touch-active');
  }, [preventDefault, stopPropagation]);

  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleTouchCancel,
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
    }
  };
}

/**
 * Hook for button-specific touch feedback
 */
export function useButtonTouchFeedback(options: TouchFeedbackOptions = {}) {
  const touchFeedback = useTouchFeedback({
    hapticType: 'light',
    ...options
  });

  const handleClick = useCallback((event: React.MouseEvent) => {
    // Provide haptic feedback on click for touch devices
    if (isTouchDevice()) {
      hapticFeedback(options.hapticType || 'light');
    }
  }, [options.hapticType]);

  return {
    ...touchFeedback,
    handleClick,
    buttonProps: {
      ...touchFeedback.touchProps,
      onClick: handleClick,
    }
  };
}

/**
 * Hook for navigation-specific touch feedback
 */
export function useNavigationTouchFeedback() {
  return useTouchFeedback({
    hapticType: 'light',
    preventDefault: false,
    stopPropagation: false,
  });
}

/**
 * Hook for form input touch feedback
 */
export function useFormTouchFeedback() {
  return useTouchFeedback({
    hapticType: 'light',
    preventDefault: false,
    stopPropagation: false,
  });
}

/**
 * Hook for modal/dialog touch feedback
 */
export function useModalTouchFeedback() {
  return useTouchFeedback({
    hapticType: 'medium',
    preventDefault: true,
    stopPropagation: true,
  });
}
