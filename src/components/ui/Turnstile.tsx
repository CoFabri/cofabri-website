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

  useEffect(() => {
    let mounted = true;

    const initializeTurnstile = async () => {
      try {
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
          console.error('Failed to render Turnstile:', error);
        }
      } catch (error) {
        console.error('Failed to load Turnstile:', error);
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
          console.error('Failed to reset Turnstile:', error);
        }
      }
    };
  }, [siteKey, theme, size, onVerify, onError, onExpire, isRendered]);

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} className="turnstile-widget" />
      {isLoading && !isRendered && (
        <div className="text-sm text-gray-500">Loading security verification...</div>
      )}
    </div>
  );
}
