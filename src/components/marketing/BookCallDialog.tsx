'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  BOOK_CALL_FIELD_ORDER,
  EMPTY_BOOK_CALL,
  MAX_BOOK_CALL_MESSAGE,
  buildBookCallPayload,
  errorSummary,
  validateBookCall,
  validateBookCallField,
  type BookCallErrors,
  type BookCallField,
  type BookCallValues,
} from '@/lib/validation/service-forms';
import { DEFAULT_COUNTRY, formatPhoneAsYouType, normalizePhone } from '@/lib/validation/phone';
import { FIELD_LIMITS } from '@/lib/validation/schemas';
import FamilyMark from './FamilyMark';
import Turnstile from './Turnstile';

type Phase = 'idle' | 'submitting' | 'success';

interface BookCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: { id: string; name: string };
}

function turnstileSiteKey(): string | undefined {
  if (process.env.NODE_ENV === 'development') return '1x00000000000000000000AA';
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

const fieldClasses =
  'w-full rounded-lg border border-input bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/30 aria-[invalid=true]:border-destructive disabled:opacity-60 md:text-sm';

export default function BookCallDialog({ open, onOpenChange, service }: BookCallDialogProps) {
  const formId = useId();
  const [values, setValues] = useState<BookCallValues>(EMPTY_BOOK_CALL);
  const [errors, setErrors] = useState<BookCallErrors>({});
  const [summaryCount, setSummaryCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [submitError, setSubmitError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileMissing, setTurnstileMissing] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  // The button that opened the dialog. Radix only restores focus to a DialogTrigger, and this dialog is opened from our own button.
  const openerRef = useRef<HTMLElement | null>(null);
  const refs = useRef<Partial<Record<BookCallField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const submitting = phase === 'submitting';

  const reset = useCallback(() => {
    setValues(EMPTY_BOOK_CALL);
    setErrors({});
    setSummaryCount(0);
    setPhase('idle');
    setSubmitError('');
    setTurnstileToken('');
    setTurnstileMissing(false);
    setTurnstileKey((k) => k + 1);
  }, []);

  const handleOpenChange = (next: boolean) => {
    // Escape, the X and a click outside are all ignored while a request is in flight.
    if (!next && submitting) return;
    onOpenChange(next);
    // Start fresh next time, but only once it has fully closed.
    if (!next) window.setTimeout(reset, 200);
  };

  const setField = (field: BookCallField, raw: string) => {
    const value = field === 'phone' ? formatPhoneAsYouType(raw, '', DEFAULT_COUNTRY) : raw;
    const next = { ...values, [field]: value };
    setValues(next);
    // Each error clears the moment its field becomes valid.
    if (errors[field] && !validateBookCallField(field, next)) {
      const rest = { ...errors };
      delete rest[field];
      setErrors(rest);
      setSummaryCount(Object.keys(rest).length + (turnstileMissing ? 1 : 0));
    }
  };

  const onBlurField = (field: BookCallField) => {
    // Show a field's message once the person has left it, never while still typing in it.
    if (!values[field] && field !== 'phone') return;
    const problem = validateBookCallField(field, values);
    setErrors((current) => {
      const next = { ...current };
      if (problem) next[field] = problem;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateBookCall(values);
    const missingToken = !!turnstileSiteKey() && !turnstileToken;
    setErrors(found);
    setTurnstileMissing(missingToken);
    const count = Object.keys(found).length + (missingToken ? 1 : 0);
    setSummaryCount(count);
    if (count > 0) {
      const first = BOOK_CALL_FIELD_ORDER.find((f) => found[f]);
      if (first) refs.current[first]?.focus();
      return;
    }

    setPhase('submitting');
    setSubmitError('');
    try {
      const payload = buildBookCallPayload(values, service, turnstileToken || 'development-mode');
      if (payload.phone) payload.phone = normalizePhone(payload.phone, DEFAULT_COUNTRY) ?? payload.phone;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Something went wrong. Please try again.');
      }
      setSentTo(payload.email);
      setPhase('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('idle');
      // A used Turnstile token cannot be sent again.
      setTurnstileToken('');
      setTurnstileKey((k) => k + 1);
    }
  };

  const fieldProps = (field: BookCallField) => ({
    id: `${formId}-${field}`,
    name: field,
    value: values[field],
    disabled: submitting,
    'aria-invalid': errors[field] ? (true as const) : undefined,
    'aria-describedby': errors[field] ? `${formId}-${field}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field, e.target.value),
    onBlur: () => onBlurField(field),
    ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      refs.current[field] = el;
      if (field === 'firstName') firstNameRef.current = el as HTMLInputElement | null;
    },
  });

  const label = (field: BookCallField, text: string, optional = false) => (
    <label htmlFor={`${formId}-${field}`} className="mb-1.5 block text-sm font-medium text-foreground">
      {text}
      {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
    </label>
  );
  const fieldError = (field: BookCallField) =>
    errors[field] ? (
      <p id={`${formId}-${field}-error`} className="mt-1.5 text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const siteKey = turnstileSiteKey();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        // Phone: a full-screen sheet. Desktop: a centered card. Either way the
        // header and footer stay put and only the body scrolls.
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-h-[min(88dvh,760px)] sm:max-w-[520px] sm:rounded-lg sm:border"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          firstNameRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          openerRef.current?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (submitting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (submitting) e.preventDefault();
        }}
        showCloseButton={!submitting}
      >
        {phase === 'success' ? (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-start justify-center gap-4 px-6 py-10 sm:px-8">
              <CheckCircleIcon className="h-10 w-10 text-success" aria-hidden="true" />
              <DialogTitle className="text-2xl font-semibold leading-tight tracking-[-0.02em]">Request sent</DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-foreground">
                Thanks. We&apos;ll be in touch within one business day.
              </DialogDescription>
              <p className="m-0 text-sm text-muted-foreground">We sent a copy to {sentTo}.</p>
            </div>
            <div className="border-t border-border px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-5 text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border px-6 pt-6 pb-4 pr-12 sm:px-8">
              <DialogTitle className="text-xl font-semibold leading-tight tracking-[-0.02em]">Book a call</DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                Tell us a little about your business and we&apos;ll set up a short call.
              </DialogDescription>
              <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground">
                <span className="text-muted-foreground">About</span>
                <FamilyMark appId={service.id} size={24} />
                <span className="font-medium">{service.name}</span>
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              {summaryCount > 0 && (
                <div role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">
                  {errorSummary(summaryCount)}
                </div>
              )}
              {submitError && (
                <div role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  {label('firstName', 'First name')}
                  <input {...fieldProps('firstName')} type="text" autoComplete="given-name" maxLength={FIELD_LIMITS.firstName} className={`${fieldClasses} h-11`} />
                  {fieldError('firstName')}
                </div>
                <div>
                  {label('lastName', 'Last name')}
                  <input {...fieldProps('lastName')} type="text" autoComplete="family-name" maxLength={FIELD_LIMITS.lastName} className={`${fieldClasses} h-11`} />
                  {fieldError('lastName')}
                </div>
              </div>

              <div className="mt-4">
                {label('email', 'Email')}
                <input {...fieldProps('email')} type="email" inputMode="email" autoComplete="email" placeholder="name@business.com" className={`${fieldClasses} h-11`} />
                {fieldError('email')}
              </div>

              <div className="mt-4">
                {label('phone', 'Phone', true)}
                <input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-5555" className={`${fieldClasses} h-11`} />
                {fieldError('phone')}
              </div>

              <div className="mt-4">
                {label('company', 'Company')}
                <input {...fieldProps('company')} type="text" autoComplete="organization" maxLength={FIELD_LIMITS.companyName} className={`${fieldClasses} h-11`} />
                {fieldError('company')}
              </div>

              <div className="mt-4">
                {label('message', 'Tell us about your business and what you want to advertise')}
                <textarea {...fieldProps('message')} rows={4} maxLength={MAX_BOOK_CALL_MESSAGE} className={`${fieldClasses} min-h-[110px] resize-y py-2.5`} />
                {fieldError('message')}
              </div>

              {siteKey && (
                <div className="mt-5">
                  <Turnstile
                    key={turnstileKey}
                    siteKey={siteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setTurnstileMissing(false);
                    }}
                    onError={() => setTurnstileToken('')}
                    onExpire={() => setTurnstileToken('')}
                    theme="light"
                    size="normal"
                    className="flex justify-start"
                  />
                  {turnstileMissing && <p className="mt-1.5 text-sm text-destructive">Please complete the security check.</p>}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row-reverse sm:justify-start sm:gap-3 sm:px-8">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-6 text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleOpenChange(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong px-6 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
