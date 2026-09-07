'use client';

import { useCallback, useId, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Turnstile from './Turnstile';

interface NotifyMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: { id: string; name: string }[];
  defaultKind: 'updates' | 'incidents';
}

function getTurnstileSiteKey(): string | undefined {
  if (process.env.NODE_ENV === 'development') {
    return '1x00000000000000000000AA';
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export default function NotifyMeModal({ open, onOpenChange, apps, defaultKind }: NotifyMeModalProps) {
  const emailInputId = useId();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [notifyUpdates, setNotifyUpdates] = useState(defaultKind === 'updates');
  const [notifyIncidents, setNotifyIncidents] = useState(defaultKind === 'incidents');
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleApp = (id: string) => {
    setSelectedAppIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSubmit = selectedAppIds.length > 0 && (notifyUpdates || notifyIncidents) && email.length > 0 && !!turnstileToken;

  // Stable identity required: Turnstile.tsx's effect depends on onError/onExpire,
  // so an inline arrow function here would reset the widget on every re-render
  // (e.g. every keystroke in the email field below), not just on a real error.
  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    setStatus('error');
    setErrorMessage('Security verification failed. Please try again.');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('');
    setStatus('error');
    setErrorMessage('Security verification expired. Please try again.');
  }, []);

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
        body: JSON.stringify({ appIds: selectedAppIds, email, notifyUpdates, notifyIncidents, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
        // Turnstile tokens are single-use -- a failed submit leaves the widget
        // showing "verified" even though the token is now dead, so clear it
        // to force a fresh challenge (same convention ChangelogSubscribeWidget used).
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

  const resetAndClose = () => {
    onOpenChange(false);
    // Reset after the close animation would otherwise show a flash of the
    // pristine form; a short delay isn't worth the complexity here since the
    // dialog unmounts its content anyway on next open in most Radix setups --
    // if a flash is visible in manual testing, revisit with a delayed reset.
    setStatus('idle');
    setSelectedAppIds([]);
    setNotifyUpdates(defaultKind === 'updates');
    setNotifyIncidents(defaultKind === 'incidents');
    setEmail('');
    setTurnstileToken('');
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get notified</DialogTitle>
          <DialogDescription>Pick which apps and what kind of updates you want in your inbox.</DialogDescription>
        </DialogHeader>
        {status === 'success' ? (
          <p className="text-sm text-success" role="status" aria-live="polite">
            Check your email to confirm your subscription.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Apps</p>
              <div className="space-y-1">
                {apps.map((app) => (
                  <label key={app.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedAppIds.includes(app.id)} onChange={() => toggleApp(app.id)} />
                    {app.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Notify me about</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyUpdates} onChange={(e) => setNotifyUpdates(e.target.checked)} />
                Product updates
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyIncidents} onChange={(e) => setNotifyIncidents(e.target.checked)} />
                Incident &amp; status alerts
              </label>
            </div>
            <div className="space-y-2">
              <label htmlFor={emailInputId} className="text-sm font-medium">
                Email address
              </label>
              <input
                id={emailInputId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-border px-3 py-2 text-sm"
              />
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
            {status === 'error' && (
              <p className="text-sm text-danger" role="status" aria-live="polite">
                {errorMessage}
              </p>
            )}
            <Button type="submit" disabled={!canSubmit || status === 'submitting'}>
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
