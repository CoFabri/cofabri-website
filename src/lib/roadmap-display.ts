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

export function formatRoadmapWhen(feature: Pick<RoadmapFeature, 'releasedDate' | 'milestone'>): string {
  if (feature.releasedDate) {
    return new Date(feature.releasedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return feature.milestone || 'TBD';
}
