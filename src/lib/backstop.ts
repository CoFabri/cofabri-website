// Shared vocabulary for the API backstop page. Pure functions only, so the
// middleware, the root layout and the tests all agree on one definition.

export const BACKSTOP_HEADER = 'x-cofabri-backstop';
export const BACKSTOP_STATE_HEADER = 'x-cofabri-backstop-state';
export const BACKSTOP_NOTE_HEADER = 'x-cofabri-backstop-note';
export const BACKSTOP_PATH = '/backstop';

export type BackstopMode = 'outage' | 'preview';
export type BackstopInitialState = 'idle' | 'loading' | 'retry';

export interface BackstopNote {
  time: string;
  body: string;
}

// Shown by /?backstop=preview&note=1 so the live-status slot can be reviewed
// before a real independent status source exists.
export const SAMPLE_BACKSTOP_NOTE: BackstopNote = {
  time: '21:05 UTC',
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
  return params.get('password') === env.previewPassword;
}
