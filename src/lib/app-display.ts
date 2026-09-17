import { KNOWN_LIFECYCLE_STATUSES, type App, type RoadmapFeature } from './api-client';

// Retired/sunset/anything-else-unrecognized apps shouldn't clutter the public
// roadmap and changelog with commitments for a product that's no longer worked on.
export function hasActiveRoadmap(status: string): boolean {
  return KNOWN_LIFECYCLE_STATUSES.includes(status);
}

export function statusPillClasses(status: string): string {
  switch (status) {
    case 'Live':
    case 'Active':
      return 'bg-success/15 text-success';
    case 'Beta':
      return 'bg-accent text-accent-foreground';
    case 'In Development':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

// Plain-language gloss for the status pill, shown on every app detail page
// regardless of which app it is — status is the one field every app has,
// so this is the one "learn more" hook that never depends on per-app facts.
export function statusExplainer(status: string): string | undefined {
  switch (status) {
    case 'Live':
    case 'Active':
      return 'Live and available today — sign up and start using it now.';
    case 'Beta':
      return 'In beta — live for early users while we refine it from real feedback.';
    case 'In Development':
      return "In development — not open yet. Join the waitlist to get early access when it launches.";
    default:
      return undefined;
  }
}

export function statusDotClasses(status: string): string {
  switch (status) {
    case 'Live':
    case 'Active':
      return 'bg-success';
    case 'Beta':
      return 'bg-accent-solid';
    case 'In Development':
      return 'bg-ink-faint';
    default:
      return 'bg-ink-disabled';
  }
}

const MARK_PALETTES = [
  'bg-primary/15 text-primary',
  'bg-accent text-accent-foreground',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-danger/15 text-danger',
];

export function markPalette(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MARK_PALETTES[hash % MARK_PALETTES.length];
}

// apps.primary_color is stored as a plain "#RRGGBB" hex string (see the
// admin edit form's color picker in cofabri-core). The 2a hero design needs
// it as a low-alpha decorative fill, which CSS can only express as rgba().
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Picks whichever of pure white or pure black gives higher contrast against
// a given brand hex, per the WCAG relative-luminance formula. apps.primary_color
// is an arbitrary per-app value the site doesn't control, so text placed on top
// of it (a CTA button, an initial-letter mark) can't rely on a single fixed
// foreground token the way the rest of the site's fixed-color UI can.
export function pickReadableTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const channel = (start: number) => {
    const c = parseInt(clean.slice(start, start + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? '#FFFFFF' : '#000000';
}

const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;

export function appMomentum(app: App, roadmap: RoadmapFeature[]): string {
  const now = Date.now();
  const items = roadmap.filter((item) => item.apps.some((linkedApp) => linkedApp.id === app.id));

  const shippedThisQuarter = items.filter(
    (item) => item.status === 'Released' && item.releasedDate && now - new Date(item.releasedDate).getTime() <= QUARTER_MS
  );
  if (shippedThisQuarter.length > 0) {
    return `${shippedThisQuarter.length} shipped this quarter`;
  }

  const upcoming = items.find((item) => item.status === 'In Progress') ?? items.find((item) => item.status === 'Planned');
  if (upcoming) return `Next: ${upcoming.name}`;

  return '—';
}

// A beta app only gets the signup CTA while it's genuinely accepting people:
// capacity must be set above zero and not yet fully claimed. Otherwise it
// falls back to the same default a live app gets (Visit, or the apps index).
export function hasOpenBetaSignup(app: App): boolean {
  return (
    app.status === 'Beta' &&
    app.betaCapacity != null &&
    app.betaCapacity > 0 &&
    (app.betaSpotsFilled ?? 0) < app.betaCapacity
  );
}

export function actionLabel(app: App): string {
  if (app.status === 'In Development') return 'Join waitlist';
  if (hasOpenBetaSignup(app)) return 'Join the Beta';
  return 'Visit';
}

export function actionHref(app: App): string {
  if (app.status === 'In Development') return `/signup?appId=${app.id}`;
  if (hasOpenBetaSignup(app)) return `/signup?appId=${app.id}`;
  if (app.url) return app.url.startsWith('http') ? app.url : `https://${app.url}`;
  return '/apps';
}

// True only when actionHref resolves to a genuinely external URL — used to
// decide whether a CTA link needs target="_blank"/rel/an external-link icon.
// Checking the href (not just status) matters because a Beta app with open
// signup spots gets an internal /signup link despite being "live", the same
// way an In-Development app does.
export function isExternalAction(app: App): boolean {
  return !actionHref(app).startsWith('/');
}

// No app currently has featureOnWebsite set in admin, so picking apps[0]
// silently "features" whatever sorts first from the API (alphabetically,
// today: Gathr) -- an accident of list order, not a deliberate choice. Until
// an app is explicitly flagged, fall back to this app id instead.
const DEFAULT_FEATURED_APP_ID = 'medoura';

export function getFeaturedApp(apps: App[]): App {
  return apps.find((a) => a.featureOnWebsite) ?? apps.find((a) => a.id === DEFAULT_FEATURED_APP_ID) ?? apps[0];
}

export function isLaunchingToday(app: App): boolean {
  if (!app.launchDate) return false;
  const today = new Date();
  const launchDate = new Date(app.launchDate);
  return (
    launchDate.getDate() === today.getDate() &&
    launchDate.getMonth() === today.getMonth() &&
    launchDate.getFullYear() === today.getFullYear()
  );
}
