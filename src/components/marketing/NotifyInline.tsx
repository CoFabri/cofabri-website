'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validateNotifyEmail } from '@/lib/validation/service-forms';

// "Notify Me" for a service that has not launched. The control opens in place:
// a button becomes an email field, then a confirmation. The hero and the
// closing band on a service page share one state (via NotifyProvider), so
// joining in one place shows as done in the other; a ServiceCard has its own.

type Status = 'idle' | 'submitting' | 'done';

export interface NotifyController {
  appId: string;
  open: boolean;
  email: string;
  error: string;
  status: Status;
  setEmail: (value: string) => void;
  /** Opens the field (and focuses it). */
  openField: (targetId?: string) => void;
  submit: () => Promise<void>;
  /** Bumped to ask a field to take focus; `focusTarget` says which one (by its wrapper id). */
  focusTick: number;
  focusTarget: string;
}

export function useNotifyController(appId: string): NotifyController {
  const [open, setOpen] = useState(false);
  const [email, setEmailState] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [focusTick, setFocusTick] = useState(0);
  const [focusTarget, setFocusTarget] = useState('');

  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    // An error clears as soon as the email becomes valid.
    setError((current) => (current && !validateNotifyEmail(value) ? '' : current));
  }, []);

  const openField = useCallback((targetId = '') => {
    setOpen(true);
    setFocusTarget(targetId);
    setFocusTick((tick) => tick + 1);
  }, []);

  const submit = useCallback(async () => {
    const problem = validateNotifyEmail(email);
    if (problem) {
      setError(problem);
      setFocusTick((tick) => tick + 1);
      return;
    }
    setError('');
    setStatus('submitting');
    try {
      const res = await fetch('/api/coming-soon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // hpToken is a honeypot: real visitors never fill it.
        body: JSON.stringify({ email: email.trim(), appId, hpToken: '' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(res.status === 400 && body?.error ? body.error : 'Something went wrong. Please try again.');
        setStatus('idle');
        return;
      }
      setStatus('done');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  }, [email, appId]);

  return { appId, open, email, error, status, setEmail, focusTick, focusTarget, openField, submit };
}

const NotifyContext = createContext<NotifyController | null>(null);

/** Shares one Notify Me state between every NotifyInline inside it. */
export function NotifyProvider({ appId, children }: { appId: string; children: React.ReactNode }) {
  const controller = useNotifyController(appId);
  return <NotifyContext.Provider value={controller}>{children}</NotifyContext.Provider>;
}

export function useSharedNotify(): NotifyController | null {
  return useContext(NotifyContext);
}

interface NotifyInlineProps {
  appId: string;
  /** Stable id for the wrapper, so other controls can scroll to it. */
  id?: string;
  className?: string;
  /** Style of the closed "Notify Me" button: filled (default) or the secondary outline. */
  variant?: 'solid' | 'outline';
  /** Stack the field above its button, for narrow columns. */
  stacked?: boolean;
}

export default function NotifyInline({ appId, id, className = '', variant = 'solid', stacked = false }: NotifyInlineProps) {
  const shared = useContext(NotifyContext);
  const local = useNotifyController(appId);
  const c = shared ?? local;
  const errorId = useId();
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { open, focusTick, focusTarget } = c;

  // Take focus when asked, but only the field that was asked (hero and band can both be open).
  useEffect(() => {
    if (open && focusTick > 0 && focusTarget === (id ?? '')) inputRef.current?.focus();
  }, [open, focusTick, focusTarget, id]);

  if (c.status === 'done') {
    return (
      <p id={id} role="status" className={`m-0 inline-flex items-center gap-2 text-[15px] font-medium text-foreground ${className}`}>
        <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" aria-hidden="true" />
        Done. We&apos;ll email you once, at launch.
      </p>
    );
  }

  if (!c.open) {
    return (
      <div id={id} className={className}>
        <button
          type="button"
          onClick={() => c.openField(id ?? '')}
          aria-expanded="false"
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 ${stacked ? 'w-full' : ''} ${
            variant === 'outline'
              ? 'border border-border-strong bg-transparent text-foreground hover:bg-muted'
              : 'bg-brand text-on-brand hover:bg-brand-hover'
          }`}
        >
          <BellIcon className="h-4 w-4" aria-hidden="true" />
          Notify Me
        </button>
      </div>
    );
  }

  return (
    <form
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void c.submit();
      }}
      className={className}
    >
      <label id={labelId} htmlFor={`${labelId}-input`} className="sr-only">
        Your email
      </label>
      <div className={`flex flex-col gap-2 ${stacked ? '' : 'sm:flex-row'}`}>
        <input
          id={`${labelId}-input`}
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@business.com"
          value={c.email}
          onChange={(e) => c.setEmail(e.target.value)}
          disabled={c.status === 'submitting'}
          aria-invalid={c.error ? true : undefined}
          aria-describedby={c.error ? errorId : undefined}
          className={`h-11 min-w-0 ${stacked ? 'shrink-0' : 'flex-1'} rounded-lg border border-input bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/30 aria-[invalid=true]:border-destructive disabled:opacity-60 ${stacked ? '' : 'sm:min-w-[240px]'}`}
        />
        <button
          type="submit"
          disabled={c.status === 'submitting'}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 disabled:opacity-60"
        >
          {c.status === 'submitting' ? 'Sending…' : 'Notify Me'}
        </button>
      </div>
      {c.error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {c.error}
        </p>
      )}
    </form>
  );
}
