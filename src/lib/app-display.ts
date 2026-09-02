import type { App, RoadmapFeature } from '@/lib/api-client';

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

// Interim stand-in for a future apps.tagline field: first sentence of the
// long-form description, truncated to a word boundary.
export function deriveTagline(app: App): string | null {
  if (!app.description) return null;
  const firstSentence = app.description.trim().split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '');
  if (firstSentence.length <= 72) return firstSentence;
  const truncated = firstSentence.slice(0, 72);
  return `${truncated.slice(0, truncated.lastIndexOf(' '))}…`;
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
