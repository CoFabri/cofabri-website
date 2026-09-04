import { KNOWN_LIFECYCLE_STATUSES, type App, type RoadmapFeature } from '@/lib/api-client';

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

const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;

export function appMomentum(app: App, roadmap: RoadmapFeature[]): string {
  const now = Date.now();
  const items = roadmap.filter((item) => item.application === app.id);

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

export function actionLabel(app: App): string {
  return app.status === 'In Development' ? 'Join waitlist' : 'Visit';
}

export function actionHref(app: App): string {
  if (app.status === 'In Development') return `/signup?appId=${app.id}`;
  if (app.url) return app.url.startsWith('http') ? app.url : `https://${app.url}`;
  return '/apps';
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
