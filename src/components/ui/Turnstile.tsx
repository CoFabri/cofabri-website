'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
    turnstileScriptLoaded?: boolean;
  }
}

// Global script loading state
let scriptLoadingPromise: Promise<void> | null = null;

const loadTurnstileScript = (): Promise<void> => {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-no-preload', 'true');
    
    script.onload = () => {
      window.turnstileScriptLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      scriptLoadingPromise = null;
      console.error('Turnstile: Failed to load script from https://challenges.cloudflare.com/turnstile/v0/api.js');
      reject(new Error('Failed to load Turnstile script'));
    };
    
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

export default function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = ''
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeTurnstile = async () => {
      try {
        // Check if site key is valid
        if (!siteKey || siteKey.trim() === '') {
          console.warn('Turnstile: Empty or invalid site key provided');
          setHasError(true);
          setIsLoading(false);
          // Call onVerify with a dummy token to allow form submission
          onVerify('development-mode');
          return;
        }

        // Log site key for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Turnstile: Using site key:', siteKey.substring(0, 10) + '...');
        }

        // Load script if not already loaded
        await loadTurnstileScript();
        
        if (!mounted || !containerRef.current || isRendered) return;

        // Clear any existing content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        const options = {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
          theme,
          size
        };

        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, options);
          setIsRendered(true);
        } catch (error) {
          setHasError(true);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeTurnstile();

    return () => {
      mounted = false;
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (error) {
          // Silently handle reset errors
        }
      }
    };
  }, [siteKey, theme, size, onVerify, onError, onExpire, isRendered]);

  // If site key is not configured, show a fallback message
  if (hasError) {
    return (
      <div className={`turnstile-container ${className}`}>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border">
          Security verification is not configured. Please contact the administrator.
        </div>
      </div>
    );
  }

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} className="turnstile-widget" />
      {isLoading && !isRendered && (
        <div className="text-sm text-gray-500">Loading security verification...</div>
      )}
    </div>
  );
}
