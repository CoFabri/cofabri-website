// Shared vocabulary for the API backstop page. Pure functions only, so the
// middleware, the root layout and the tests all agree on one definition.

export const BACKSTOP_HEADER = 'x-cofabri-backstop';
export const BACKSTOP_STATE_HEADER = 'x-cofabri-backstop-state';
export const BACKSTOP_NOTE_HEADER = 'x-cofabri-backstop-note';
export const BACKSTOP_PATH = '/backstop';

// Shown on the outage page as "Contact support". A constant rather than an env
// var so every render path (layout, global-error) shows it identically.
export const BACKSTOP_SUPPORT_EMAIL = 'support@cofabri.com';

export type BackstopMode = 'outage' | 'preview';
export type BackstopInitialState = 'idle' | 'loading' | 'retry';

export interface BackstopNote {
  time: string;
  /** Machine-readable form of `time` for the <time> element (valid HTML time-with-offset). */
  datetime?: string;
  body: string;
}

// Shown by /?backstop=preview&note=1 so the live-status slot can be reviewed
// before a real independent status source exists.
export const SAMPLE_BACKSTOP_NOTE: BackstopNote = {
  time: '21:05 UTC',
  datetime: '21:05Z',
  body: "We've traced this to our hosting provider and are working with them on it. Some apps may load slowly or not at all until it's resolved.",
};

export function parseBackstopMode(value: string | null): BackstopMode | null {
  return value === 'outage' || value === 'preview' ? value : null;
}

export function parseInitialState(value: string | null): BackstopInitialState {
  return value === 'retry' || value === 'loading' ? value : 'idle';
}

export function isBackstopPreviewRequested(params: URLSearchParams): boolean {
  return params.get('backstop') === 'preview';
}

export function previewOptions(params: URLSearchParams): { state: BackstopInitialState; note: boolean } {
  return {
    state: parseInitialState(params.get('state')),
    note: params.get('note') === '1',
  };
}

// Mirrors the /preview/* gate in middleware.ts: open when no password is
// configured, otherwise the password param must match. Non-production
// deployments (local dev, Vercel previews) are always open.
export function isPreviewAllowed(
  params: URLSearchParams,
  env: { vercelEnv?: string; previewPassword?: string },
): boolean {
  if (env.vercelEnv !== 'production') return true;
  if (!env.previewPassword) return true;
  return timingSafeEqual(params.get('password'), env.previewPassword);
}

// Constant-time string compare (no early exit on the first mismatch or on a
// length difference). Runtime-agnostic on purpose: middleware may run on the
// edge runtime, where node:crypto is unavailable.
export function timingSafeEqual(a: string | null, b: string): boolean {
  if (a === null) return false;
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
