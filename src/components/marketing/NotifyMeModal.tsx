'use client';

import { useCallback, useId, useState } from 'react';
import { MagnifyingGlassIcon, Squares2X2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Turnstile from './Turnstile';

export type NotifyKind = 'updates' | 'incidents' | 'both';

interface NotifyMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: { id: string; name: string }[];
  defaultKind: NotifyKind;
}

const NOTIFY_KIND_OPTIONS: { value: NotifyKind; label: string }[] = [
  { value: 'updates', label: 'Updates' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'both', label: 'Both' },
];

function getTurnstileSiteKey(): string | undefined {
  if (process.env.NODE_ENV === 'development') {
    return '1x00000000000000000000AA';
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

function AppsMultiSelectField({
  apps,
  selectedIds,
  onChange,
}: {
  apps: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedApps = apps.filter((a) => selectedIds.includes(a.id));
  const filtered = apps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Apps</p>
      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen((o) => !o)}>
        <Squares2X2Icon className="h-4 w-4" />
        Select apps
      </Button>
      {selectedApps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedApps.map((a) => (
            <Badge key={a.id} variant="outline" className="gap-1 pr-1">
              {a.name}
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${a.name}`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {pickerOpen && (
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-40 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">No apps found.</p>
            ) : (
              filtered.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggle(a.id)} />
                  {a.name}
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end border-t border-border px-2 py-1.5">
            <Button type="button" size="sm" onClick={() => setPickerOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotifyMeModal({ open, onOpenChange, apps, defaultKind }: NotifyMeModalProps) {
  const emailInputId = useId();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [notifyKind, setNotifyKind] = useState<NotifyKind>(defaultKind);
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = selectedAppIds.length > 0 && email.length > 0 && !!turnstileToken;

  // Stable identity required: Turnstile.tsx's effect depends on onError/onExpire,
  // so an inline arrow function here would reset the widget on every re-render
  // (e.g. every keystroke in the email field below), not just on a real error.
  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1);
    setStatus('error');
    setErrorMessage('Security verification failed. Please try again.');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1);
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
      const notifyUpdates = notifyKind === 'updates' || notifyKind === 'both';
      const notifyIncidents = notifyKind === 'incidents' || notifyKind === 'both';
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
        // and bump turnstileKey to force the widget to remount and issue a
        // fresh challenge (see Turnstile.tsx: it only resets on unmount).
        setTurnstileToken('');
        setTurnstileKey((k) => k + 1);
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to subscribe. Please try again.');
      setTurnstileToken('');
      setTurnstileKey((k) => k + 1);
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
    setNotifyKind(defaultKind);
    setEmail('');
    setTurnstileToken('');
    setTurnstileKey(0);
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
            <AppsMultiSelectField apps={apps} selectedIds={selectedAppIds} onChange={setSelectedAppIds} />
            <div className="space-y-2">
              <p className="text-sm font-medium">Notify me about</p>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {NOTIFY_KIND_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={notifyKind === value}
                    onClick={() => setNotifyKind(value)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                      notifyKind === value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                key={turnstileKey}
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
