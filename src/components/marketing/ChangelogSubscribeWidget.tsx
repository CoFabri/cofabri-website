'use client';

import { useState } from 'react';
import Turnstile from './Turnstile';

interface ChangelogSubscribeWidgetProps {
  appId: string;
}

export default function ChangelogSubscribeWidget({ appId }: ChangelogSubscribeWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Get Turnstile site key based on environment. Mirrors the identical helper
  // already duplicated in ContactForm.tsx/SupportForm.tsx/PartnerForm.tsx —
  // there is no shared `@/lib/turnstile` module in this codebase to import
  // from instead, so this keeps the existing (copy-per-form) convention.
  const getTurnstileSiteKey = () => {
    if (process.env.NODE_ENV === 'development') {
      // Use Cloudflare's test keys for development
      return '1x00000000000000000000AA';
    }

    // Use environment variable for production
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setStatus('error');
      setErrorMessage('Please complete the security verification.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/changelog-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, email, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
        // The Turnstile token is single-use — after a failed submit it's dead even if
        // the widget still shows it as verified, so clear it to force a fresh challenge.
        setTurnstileToken('');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to subscribe. Please try again.');
      setTurnstileToken('');
    }
  };

  const handleTurnstileError = () => {
    setTurnstileToken('');
    setStatus('error');
    setErrorMessage('Security verification failed. Please try again.');
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken('');
    setStatus('error');
    setErrorMessage('Security verification expired. Please try again.');
  };

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="text-xs font-medium text-primary hover:underline">
        Notify me about updates
      </button>
    );
  }

  if (status === 'success') {
    return <p className="text-xs text-success">Check your email to confirm your subscription.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded border border-border px-2 py-1 text-xs"
        />
        <button type="submit" disabled={status === 'submitting'} className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          {status === 'submitting' ? 'Submitting...' : 'Subscribe'}
        </button>
      </div>
      {getTurnstileSiteKey() && (
        <Turnstile
          siteKey={getTurnstileSiteKey()!}
          onVerify={setTurnstileToken}
          onError={handleTurnstileError}
          onExpire={handleTurnstileExpire}
          theme="light"
          size="normal"
        />
      )}
      {status === 'error' && <p className="text-xs text-danger">{errorMessage}</p>}
    </form>
  );
}
