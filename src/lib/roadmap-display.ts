import type { RoadmapFeature } from '@/lib/api-client';

export function roadmapStatusPillClasses(status: string): string {
  switch (status) {
    case 'Released':
      return 'bg-success/15 text-success';
    case 'In Progress':
      return 'bg-accent text-accent-foreground';
    case 'Delayed':
      return 'bg-warning/15 text-warning';
    case 'Cancelled':
      return 'bg-danger/15 text-danger';
    case 'Planned':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function roadmapStatusDotClasses(status: string): string {
  switch (status) {
    case 'Released':
      return 'bg-success';
    case 'In Progress':
      return 'bg-primary';
    case 'Delayed':
      return 'bg-warning';
    case 'Cancelled':
      return 'bg-danger';
    case 'Planned':
    default:
      return 'bg-ink-disabled';
  }
}

export function formatRoadmapWhen(feature: Pick<RoadmapFeature, 'releasedDate' | 'milestone'>): string {
  if (feature.releasedDate) {
    return new Date(feature.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return feature.milestone || 'TBD';
}

// Roadmap items can reference an app_id cofabri-api's /apps endpoint no longer
// (or doesn't yet) return — fall back to a title-cased version of the id
// rather than showing it lowercase next to real app names.
export function displayAppName(id: string, appNames: Record<string, string>): string {
  if (appNames[id]) return appNames[id];
  return id.charAt(0).toUpperCase() + id.slice(1);
}
