import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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