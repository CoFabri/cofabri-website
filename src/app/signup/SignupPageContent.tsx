'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CoreLoader } from '@/components/ui/core-loader';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import { markPalette, pickReadableTextColor, statusPillClasses, statusDotClasses } from '@/lib/app-display';
import { getSignupState, getSignupCopy, type SignupState } from './signup-state';

interface BetaStatement {
  statement: string;
  order: number;
}

interface AppData {
  betaCapacity: number | null;
  betaSpotsFilled: number;
  status: string;
  name: string;
  primaryColor?: string;
  faviconUrl?: string;
  betaStatements: BetaStatement[];
}

interface Fields {
  firstName: string;
  lastName: string;
  email: string;
  quote: string;
  statement: string;
}

type FieldErrors = Record<'firstName' | 'lastName' | 'email' | 'interest' | 'quote', boolean>;

const LEVEL_WORDS = ['', 'Just curious', 'Interested', 'Keen', 'Very keen', 'Need it now'];

const PERKS = (name: string) => [
  { t: 'In before launch', b: `Use ${name} before it opens to the public.` },
  { t: 'Test the beta', b: 'Try new builds while they’re still changing.' },
  { t: 'Shape what ships', b: 'Your feedback goes straight to the team building it.' },
  { t: 'Launch pricing', b: 'Waitlist members get an offer when it opens.' },
];

const eyebrowClass = 'font-mono text-[11px] uppercase tracking-[0.11em] text-ink-muted';
const inputClass =
  'h-11 w-full rounded-[10px] border bg-background px-3.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-primary focus:ring-[3px] focus:ring-primary/15';

function borderFor(hasError: boolean) {
  return hasError ? 'border-danger/70' : 'border-border-strong';
}

function leadFor(name: string, state: SignupState | null): { lead: string; sublead: string } {
  if (state?.kind === 'unavailable') {
    return state.status === 'Live' || state.status === 'Active'
      ? { lead: `${name} is live.`, sublead: 'The waitlist is closed because the app is open — no need to wait.' }
      : { lead: `${name} isn’t taking signups.`, sublead: 'This page only serves apps that are in development or in beta.' };
  }
  if (state && state.kind !== 'legacy-waitlist') {
    return { lead: `Help shape ${name} in beta.`, sublead: 'A limited number of people get to use it before launch and tell us what to fix.' };
  }
  return { lead: `Get in before ${name} launches.`, sublead: 'It’s still being built. Join the waitlist and we’ll email you the moment it opens.' };
}

function crumbFor(state: SignupState | null): string {
  if (state?.kind === 'unavailable') return 'Signup';
  if (state && state.kind !== 'legacy-waitlist') return 'Beta';
  return 'Waitlist';
}

function BetaMeter({ capacity, filled }: { capacity: number; filled: number }) {
  const left = Math.max(capacity - filled, 0);
  return (
    <div className="flex flex-col gap-2.5 border-b border-border bg-muted px-7 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className={eyebrowClass}>Beta spots</span>
        <span className="text-[15px] font-semibold text-foreground">
          {left === 0 ? `All ${capacity} taken` : `${left} of ${capacity} left`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${left === 0 ? 'bg-ink-faint' : 'bg-primary'}`}
          style={{ width: `${Math.min((filled / capacity) * 100, 100)}%` }}
        />
      </div>
      <span className="text-[13px] text-ink-muted">
        {left === 0 ? 'Every spot has been claimed.' : `${filled} people have joined so far.`}
      </span>
    </div>
  );
}

function AppMark({ appId, name, appData }: { appId: string; name: string; appData: AppData | null }) {
  if (appData?.faviconUrl) {
    return (
      <div className="relative h-11 w-11 flex-none overflow-hidden rounded-[14px] border border-border bg-secondary">
        <Image src={appData.faviconUrl} alt="" fill className="object-contain" />
      </div>
    );
  }
  const color = appData?.primaryColor;
  return (
    <div
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-[14px] text-[19px] font-semibold tracking-[-0.02em] ${color ? '' : markPalette(appId)}`}
      style={color ? { backgroundColor: color, color: pickReadableTextColor(color) } : undefined}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function SignupPageContent() {
  const searchParams = useSearchParams();
  const appId = searchParams?.get('appId') ?? '';

  const [fields, setFields] = useState<Fields>({ firstName: '', lastName: '', email: '', quote: '', statement: '' });
  const [interestLevel, setInterestLevel] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(appId));

  useEffect(() => {
    if (!appId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const response = await fetch(`/api/apps/${appId}`);
        if (!response.ok) throw new Error('Failed to fetch app data');
        const data = await response.json();
        if (!cancelled) setAppData(data);
      } catch (error) {
        console.error('Error fetching app data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const state = appData ? getSignupState(appData) : null;
  const name = appData?.name ?? '';
  const isBetaForm = state?.kind === 'open';
  const showForm = !submitted && (isLoading || state?.kind === 'legacy-waitlist' || state?.kind === 'open');
  const showSpots = (state?.kind === 'open' || state?.kind === 'full') && !isLoading;
  const blockedCopy = state && !showForm && !submitted ? getSignupCopy(state, name, appId) : null;

  const errors: FieldErrors = {
    firstName: !fields.firstName.trim(),
    lastName: !fields.lastName.trim(),
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()),
    interest: !interestLevel,
    quote: fields.quote === '' || Number(fields.quote) < 0,
  };
  const show = (k: keyof FieldErrors) => attempted && errors[k];

  const setField = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setAttempted(true);
    if (Object.values(errors).some(Boolean)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim(),
          appId,
          interestLevel,
          quote: Number(fields.quote),
          statement: fields.statement.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to submit form');
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(
        error instanceof Error && error.message !== 'Failed to submit form' && error.message !== 'Failed to create record'
          ? error.message
          : 'We couldn’t save your spot. Nothing was submitted — try again in a moment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkProblem = (title: string, body: string) => (
    <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-6 py-24 sm:px-10">
      <span className={eyebrowClass}>Link problem</span>
      <h1 className="m-0 text-[32px] font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
      <p className="m-0 max-w-[480px] text-base leading-relaxed text-ink-muted">{body}</p>
      <Button asChild>
        <Link href="/apps">Explore apps</Link>
      </Button>
    </div>
  );

  if (!appId) {
    return linkProblem(
      'This signup link is missing its app',
      'Open the waitlist from the app’s page and it’ll take you to the right form.'
    );
  }
  if (!isLoading && !appData) {
    return linkProblem('We couldn’t load this page', 'Please try again in a moment, or find the app from our apps page.');
  }

  const { lead, sublead } = leadFor(name, state);
  const pillLabel = appData?.status === 'Active' ? 'Live' : appData?.status;
  const statements = (appData?.betaStatements ?? []).slice().sort((a, b) => a.order - b.order);
  const levelHint = interestLevel ? `${interestLevel} · ${LEVEL_WORDS[interestLevel]}` : '';

  return (
    <div className="bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-3.5 sm:px-10">
          <Breadcrumbs
            items={[
              { name: 'Apps', href: '/apps' },
              { name: name || 'App', href: `/apps/${appId}` },
              { name: crumbFor(state), href: `/signup?appId=${encodeURIComponent(appId)}` },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-14 px-6 pt-12 pb-24 sm:px-10 lg:grid-cols-[minmax(0,1fr)_468px] lg:gap-[72px] lg:pt-16">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <AppMark appId={appId} name={name || appId} appData={appData} />
              {isLoading ? (
                <div className="h-12 w-56 animate-pulse rounded-lg bg-muted" />
              ) : (
                <h1 className="m-0 text-[40px] font-semibold leading-none tracking-[-0.042em] text-foreground sm:text-[50px]">
                  {name}
                </h1>
              )}
            </div>
            {appData && (
              <div className="flex flex-wrap items-center gap-[11px]">
                <span className={`inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px] text-xs font-semibold ${statusPillClasses(appData.status)}`}>
                  <span className={`block h-1.5 w-1.5 rounded-full ${statusDotClasses(appData.status)}`} />
                  {pillLabel}
                </span>
                <span className={eyebrowClass}>Business software</span>
              </div>
            )}
            {!isLoading && (
              <>
                <p className="m-0 mt-1 max-w-[520px] text-[22px] leading-[1.45] tracking-[-0.01em] text-foreground [text-wrap:pretty]">{lead}</p>
                <p className="m-0 max-w-[500px] text-base leading-relaxed text-ink-muted [text-wrap:pretty]">{sublead}</p>
              </>
            )}
          </div>

          <div>
            <h2 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-foreground">What early access gets you</h2>
            <div className="mt-3.5 h-[3px] w-8 bg-primary" />
            <div className="mt-6">
              {PERKS(name || 'the app').map((perk, i) => (
                <div key={perk.t} className="grid grid-cols-[48px_minmax(0,1fr)] gap-5 border-t border-border py-5">
                  <span className="pt-[3px] font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">{perk.t}</span>
                    <span className="max-w-[460px] text-[15px] leading-relaxed text-ink-muted">{perk.b}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {statements.length > 0 && state?.kind !== 'unavailable' && (
            <div>
              <h2 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-foreground">From the waitlist</h2>
              <div className="mt-6 flex flex-col">
                {statements.map((entry, index) => (
                  <div key={index} className="grid grid-cols-[48px_minmax(0,1fr)] gap-5 border-t border-border py-[22px]">
                    <span className="text-[34px] font-medium leading-[0.9] text-ink-disabled" aria-hidden="true">“</span>
                    <p className="m-0 max-w-[480px] text-lg leading-[1.55] text-ink-body [text-wrap:pretty]">{entry.statement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgba(35,46,54,0.04),0_12px_32px_-18px_rgba(35,46,54,0.18)] lg:sticky lg:top-24">
          {showSpots && state && (state.kind === 'open' || state.kind === 'full') && (
            <BetaMeter capacity={state.capacity} filled={state.filled} />
          )}

          {showForm && (
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[22px] px-7 pt-8 pb-7">
              <div className="flex flex-col gap-2">
                <span className={eyebrowClass}>{isBetaForm ? 'Beta signup' : 'Waitlist'}</span>
                <h2 className="m-0 text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
                  {isBetaForm ? `Claim a ${name} beta spot` : name ? `Join the ${name} waitlist` : 'Join the waitlist'}
                </h2>
                <p className="m-0 text-[15px] leading-relaxed text-ink-muted [text-wrap:pretty]">
                  {isBetaForm
                    ? 'Spots are first come, first served. We’ll email you how to get in.'
                    : 'Five questions. We’ll email you when it’s ready.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-[7px]">
                  <span className="text-sm font-semibold text-foreground">First name</span>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    value={fields.firstName}
                    onChange={setField('firstName')}
                    className={`${inputClass} ${borderFor(show('firstName'))}`}
                  />
                  {show('firstName') && <span className="text-[13px] text-danger">Add your first name</span>}
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className="text-sm font-semibold text-foreground">Last name</span>
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    value={fields.lastName}
                    onChange={setField('lastName')}
                    className={`${inputClass} ${borderFor(show('lastName'))}`}
                  />
                  {show('lastName') && <span className="text-[13px] text-danger">Add your last name</span>}
                </label>
              </div>

              <label className="flex flex-col gap-[7px]">
                <span className="text-sm font-semibold text-foreground">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={fields.email}
                  onChange={setField('email')}
                  className={`${inputClass} ${borderFor(show('email'))}`}
                />
                {show('email') && <span className="text-[13px] text-danger">Enter an email we can reach you at</span>}
              </label>

              <div className="flex flex-col gap-[9px]">
                <span className="text-sm font-semibold text-foreground" id="interest-label">How much do you want this?</span>
                <div role="radiogroup" aria-labelledby="interest-label" className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const on = interestLevel === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${n} — ${LEVEL_WORDS[n]}`}
                        onClick={() => setInterestLevel(n)}
                        className={`h-11 cursor-pointer rounded-[10px] border text-[15px] font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/30 ${
                          on
                            ? 'border-foreground bg-foreground text-background'
                            : `bg-background text-foreground hover:border-ink-faint ${borderFor(show('interest'))}`
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[13px] text-ink-muted">
                  <span>Just curious</span>
                  <span>{levelHint}</span>
                  <span>Need it now</span>
                </div>
                {show('interest') && <span className="text-[13px] text-danger">Pick a number from 1 to 5</span>}
              </div>

              <label className="flex flex-col gap-[7px]">
                <span className="text-sm font-semibold text-foreground">What would you pay for it each month?</span>
                <span
                  className={`flex h-11 items-center overflow-hidden rounded-[10px] border bg-background focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 ${borderFor(show('quote'))}`}
                >
                  <span className="pr-1 pl-3.5 text-[15px] text-ink-muted">$</span>
                  <input
                    type="number"
                    name="quote"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={fields.quote}
                    onChange={setField('quote')}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-1.5 text-[15px] text-foreground outline-none placeholder:text-ink-faint"
                  />
                  <span className="px-3.5 font-mono text-xs text-ink-muted">USD / month</span>
                </span>
                <span className="text-[13px] text-ink-muted">A rough number is fine — it helps us price it.</span>
                {show('quote') && <span className="text-[13px] text-danger">Enter an amount — 0 is a fine answer</span>}
              </label>

              <label className="flex flex-col gap-[7px]">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">Why do you want early access?</span>
                  <span className="text-[13px] text-ink-muted">Optional</span>
                </span>
                <textarea
                  name="statement"
                  rows={3}
                  value={fields.statement}
                  onChange={setField('statement')}
                  placeholder="What would you use it for?"
                  className={`min-h-24 resize-y rounded-[10px] border bg-background px-3.5 py-3 text-[15px] leading-normal text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-primary focus:ring-[3px] focus:ring-primary/15 border-border-strong`}
                />
                <span className="text-[13px] text-ink-muted">If we approve it, your note may appear on this page.</span>
              </label>

              <div className="mt-0.5 flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || isLoading} className="h-12 w-full rounded-[9px] text-base font-semibold">
                  {isSubmitting ? (
                    <>
                      <CoreLoader size={16} tone="inverted" />
                      Saving your spot…
                    </>
                  ) : isBetaForm ? (
                    'Claim my spot'
                  ) : (
                    'Join the waitlist'
                  )}
                </Button>
                {submitError && (
                  <div role="alert" className="rounded-[10px] border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm leading-normal text-danger">
                    {submitError}
                  </div>
                )}
              </div>
            </form>
          )}

          {submitted && (
            <div className="flex flex-col gap-5 px-7 pt-9 pb-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-success/15 text-xl font-semibold text-success">✓</div>
              <div className="flex flex-col gap-2">
                <h2 className="m-0 text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
                  {isBetaForm ? 'Your beta spot is saved' : 'You’re on the list'}
                </h2>
                <p className="m-0 text-[15px] leading-relaxed text-ink-muted [text-wrap:pretty]">
                  We’ll email {fields.email.trim()} when {name} is ready for you.
                </p>
              </div>
              <div className="flex flex-col gap-px overflow-hidden rounded-[11px] border border-border bg-border">
                {[
                  { k: 'Interest', v: `${interestLevel} / 5` },
                  { k: 'Would pay', v: `$${fields.quote} / month` },
                  { k: 'Statement', v: fields.statement.trim() ? 'Sent for review' : 'None' },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between gap-5 bg-card px-4 py-[13px]">
                    <span className="text-sm text-ink-muted">{row.k}</span>
                    <span className="font-mono text-[13px] text-ink-body">{row.v}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/apps"
                className="self-start border-b border-border-strong pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Explore other apps →
              </Link>
            </div>
          )}

          {blockedCopy && (
            <div className="flex flex-col gap-5 px-7 pt-9 pb-7">
              <div className="flex flex-col gap-2">
                <span className={eyebrowClass}>{blockedCopy.eyebrow}</span>
                <h2 className="m-0 text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground [text-wrap:pretty]">
                  {blockedCopy.title}
                </h2>
                <p className="m-0 text-[15px] leading-relaxed text-ink-muted [text-wrap:pretty]">{blockedCopy.body}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button asChild className="h-auto rounded-[9px] px-[22px] py-[13px] text-[15px] font-semibold">
                  <Link href={blockedCopy.cta.href}>{blockedCopy.cta.label}</Link>
                </Button>
                <Button asChild variant="outline" className="h-auto rounded-[9px] px-[22px] py-[13px] text-[15px] font-semibold">
                  <Link href={blockedCopy.cta2.href}>{blockedCopy.cta2.label}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
