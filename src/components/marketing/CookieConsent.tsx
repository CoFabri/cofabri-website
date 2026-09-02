'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('analytics-consent='));
    
    // Only show banner if no consent decision has been made
    if (!consentCookie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- document.cookie is only available client-side; this must run after mount for SSR/hydration safety
      setShowBanner(true);
    }
  }, []);

  const acceptAnalytics = () => {
    document.cookie = 'analytics-consent=accepted; max-age=31536000; path=/; SameSite=Lax';
    setShowBanner(false);
    // Reload the page to trigger analytics loading
    window.location.reload();
  };

  const denyAnalytics = () => {
    document.cookie = 'analytics-consent=denied; max-age=31536000; path=/; SameSite=Lax';
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-sm">
      <div className="rounded-xl border border-border bg-card p-5 shadow-[0_24px_60px_-20px_rgba(16,22,27,.22)]">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          Cookies
        </div>
        <p className="text-[15px] leading-[1.55] text-foreground">
          We use cookies to analyze site traffic and personalize content. This helps us provide a
          better experience for you.{' '}
          <Link
            href="/legal"
            target="_blank"
            className="font-medium text-primary underline underline-offset-2 hover:text-accent-hover"
          >
            Learn more
          </Link>
          .
        </p>
        <div className="mt-4 flex items-center gap-2.5">
          <Button size="sm" onClick={acceptAnalytics}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={denyAnalytics}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}