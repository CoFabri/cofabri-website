'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { BackstopInitialState } from '@/lib/backstop';

interface BackstopActionsProps {
  supportEmail?: string;
  initialState: BackstopInitialState;
}

// The retry button, the "still not connecting" line and the support link.
// State is React state, applied in effects, so nothing mutates server-rendered
// DOM before hydration (an inline script that did that caused hydration error
// #418). Without JS the button is still a plain ?retry= link.
export default function BackstopActions({ supportEmail, initialState }: BackstopActionsProps) {
  const [state, setState] = useState<BackstopInitialState>(initialState);
  const [at, setAt] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      // Test hook: e2e waits for this to know hydration finished.
      setHydrated(true);
      const retried = new URL(window.location.href).searchParams.has('retry');
      if (initialState === 'loading') {
        setState('loading');
      } else if (retried || initialState === 'retry') {
        setState('retry');
        setAt(' as of ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } else {
        setState('idle');
        setAt('');
      }
    };
    sync();
    // Back/forward cache can restore the page frozen in its loading state.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) sync();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [initialState]);

  const onRetryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const url = new URL(window.location.href);
    url.searchParams.set('retry', String(Date.now()));
    event.currentTarget.href = url.toString();
    setState('loading');
  };

  return (
    <div data-state={state === 'idle' ? undefined : state} data-hydrated={hydrated ? 'true' : undefined}>
      <div className="actions">
        <a id="bs-retry" className="btn" href="?retry=1" onClick={onRetryClick}>
          <span className="spin" aria-hidden="true" />
          <span className="l-idle">Try again</span>
          <span className="l-load">Checking&hellip;</span>
        </a>
        {supportEmail ? (
          <a className="link" href={`mailto:${supportEmail}`}>
            Contact support
          </a>
        ) : null}
      </div>
      <p className="again">
        Still not connecting{at}. Give it a minute and try again.
      </p>
      <p className="sr" aria-live="polite">
        {state === 'loading' ? 'Checking our systems…' : state === 'retry' ? `Still not connecting${at}.` : ''}
      </p>
    </div>
  );
}
