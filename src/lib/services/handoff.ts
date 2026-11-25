// Copy and state for the hand-off scene on /services (HandOffStage, HandOffWindow).
// The scene is page-level copy that is the same for every service, shown here
// with CoFabri Marketing, so it lives in the repo rather than in Core. The window
// shows a demo: an invented business with an invented ad and lead. It is labelled
// "Demo" in the window, and carries no real names, prices, numbers or results.

export const HANDOFF_COPY = {
  eyebrow: 'How services work',
  heading: 'You hand it off. You still see everything.',
  body: 'The same four steps for every service, shown here with CoFabri Marketing. It all starts with a short call.',
} as const;

export const HANDOFF_STEPS = [
  { title: 'We draft it', body: 'Our team prepares the work, like a new ad or a follow-up, inside your CoFabri app.' },
  { title: 'You approve it', body: "Nothing goes out in your business's name until you say so." },
  { title: 'We run it', body: 'We launch it, watch how it does and keep adjusting.' },
  { title: 'You see it land', body: 'Every step, and every lead it brings in, is recorded in your app.' },
] as const;

export const STEP_COUNT = HANDOFF_STEPS.length;

/** What the demo CRM window shows. Invented; keep it free of digits, prices and results. */
export const DEMO = {
  tag: 'Demo',
  business: 'Brightside Home Services',
  channel: 'Facebook · Instagram ad',
  headline: 'Your home, ready for spring',
  lines: ['Licensed local pros, here when you need them.', 'Book a visit in a few taps.'],
  lead: { initials: 'JL', name: 'Jordan Lee' },
} as const;

export type PillTone = 'neutral' | 'accent' | 'success';

export interface WindowState {
  pill: { label: string; tone: PillTone; icon: 'none' | 'check' | 'dot' };
  /** The "Approve this ad before it runs?" bar (step 1 only). */
  approval: boolean;
  /** The new-lead card (step 4 only). */
  lead: boolean;
  /** Activity log, newest first. */
  log: { id: string; text: string; by: string }[];
}

const LOG_ROWS = [
  { id: 'drafted', text: 'Ad drafted', by: 'CoFabri team' },
  { id: 'approved', text: 'Ad approved', by: 'You' },
  { id: 'live', text: 'Ad went live', by: 'CoFabri team' },
  { id: 'lead', text: 'Lead added from the ad', by: 'Automatic' },
] as const;

/** What the CRM window shows at a given step (0-based). Out-of-range steps are clamped. */
export function windowState(step: number): WindowState {
  const i = Math.max(0, Math.min(STEP_COUNT - 1, Math.trunc(step)));
  const pills: WindowState['pill'][] = [
    { label: 'Draft · waiting for you', tone: 'neutral', icon: 'none' },
    { label: 'Approved by you', tone: 'accent', icon: 'check' },
    { label: 'Live', tone: 'success', icon: 'dot' },
    { label: 'Live', tone: 'success', icon: 'dot' },
  ];
  return {
    pill: pills[i],
    approval: i === 0,
    lead: i === 3,
    log: LOG_ROWS.slice(0, i + 1).reverse().map((row) => ({ ...row })),
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * How far through a pinned section the page has scrolled, 0 to 1. `top` is the
 * section's getBoundingClientRect().top; the stage is pinned for
 * (height - viewport) pixels of scrolling.
 */
export function sectionProgress(top: number, height: number, viewportHeight: number): number {
  const travel = height - viewportHeight;
  if (travel <= 0) return 0;
  return clamp01((0 - top) / travel);
}

/** Maps scroll progress to a step: four equal bands, the last one holding to the end. */
export function stepFromProgress(progress: number, count: number = STEP_COUNT): number {
  return Math.min(count - 1, Math.floor(clamp01(progress) * count));
}

export interface StepOverride {
  step: number;
  /** window.scrollY at the moment the step was clicked. */
  scrollY: number;
}

/**
 * Clicking a step sets it directly. It holds only while the page stays where it
 * was; the moment the user scrolls, the scroll position takes over again.
 */
export function resolveStep(scrollStep: number, scrollY: number, override: StepOverride | null): { step: number; override: StepOverride | null } {
  if (override && Math.abs(scrollY - override.scrollY) < 4) return { step: override.step, override };
  return { step: scrollStep, override: null };
}
