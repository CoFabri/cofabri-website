import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Provides haptic feedback on touch devices
 * @param type - The type of haptic feedback ('light', 'medium', 'heavy', 'success', 'warning', 'error')
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  // Check if the device supports haptic feedback
  if ('navigator' in window && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [20, 50, 20],
      error: [30, 100, 30]
    };
    
    navigator.vibrate(patterns[type]);
  }
  
  // iOS haptic feedback using WebKit
  if ('webkit' in window && 'messageHandlers' in (window as any).webkit) {
    const webkit = (window as any).webkit;
    if (webkit.messageHandlers.hapticFeedback) {
      webkit.messageHandlers.hapticFeedback.postMessage({ type });
    }
  }
}

/**
 * Checks if the device supports touch interactions
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Checks if the device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Checks if the device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Gets the device pixel ratio for high-DPI displays
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Utility function to clear browser caches that might cause hydration issues
export function clearHydrationCaches() {
  if (typeof window !== 'undefined') {
    // Clear localStorage items that might be causing issues
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('about') || 
        key.includes('subtitle') || 
        key.includes('marketing') ||
        key.includes('banner')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force a hard refresh if needed
    if (window.location.search.includes('clear-cache')) {
      window.location.reload();
    }
  }
}

export function isTestMode(): boolean {
  if (typeof window !== 'undefined') {
    // Client-side
    return false;
  }
  // Server-side
  return process.env.TEST_MODE === 'true';
}

export async function isTestModeClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/config');
    const { testMode } = await response.json();
    return testMode;
  } catch (error) {
    console.error('Error checking test mode:', error);
    return false;
  }
} 

/**
 * Converts markdown text to HTML
 * Handles bold text (**text**), bullet points, and line breaks
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';
  
  return text
    // Convert bold text (**text** to <strong>text</strong>)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert single asterisks (*text* to <em>text</em>) - optional
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br>');
}

/**
 * Converts markdown text to HTML for roadmap features
 * Specifically handles the format from Airtable with bullet points and sections
 */
export function roadmapMarkdownToHtml(text: string): string {
  if (!text) return '';
  
  return text
    // Convert bold text (**text** to <strong>text</strong>)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert single asterisks (*text* to <em>text</em>)
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

/**
 * Converts markdown text to HTML for release notes
 * Handles bold, italic, and basic formatting
 */
export function releaseNotesMarkdownToHtml(text: string): string {
  if (!text) return '';
  
  return text
    // Convert bold text (**text** to <strong>text</strong>)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert single asterisks (*text* to <em>text</em>)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br>');
} 