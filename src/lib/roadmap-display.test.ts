import { describe, expect, it } from 'vitest';
import { roadmapStatusPillClasses, formatRoadmapWhen, displayAppName, shippedInLastNDays } from './roadmap-display';
import type { RoadmapFeature } from '@/lib/api-client';

function feature(overrides: Partial<RoadmapFeature> = {}): RoadmapFeature {
  return { id: 'r-1', name: 'Feature', description: '', status: 'Planned', milestone: '', releaseType: '', ...overrides };
}

describe('roadmapStatusPillClasses', () => {
  it('defaults unrecognized/Planned statuses to the muted palette', () => {
    expect(roadmapStatusPillClasses('Planned')).toContain('muted');
    expect(roadmapStatusPillClasses('anything-else')).toContain('muted');
  });
});

describe('formatRoadmapWhen', () => {
  it('formats a released date as short month + day', () => {
    expect(formatRoadmapWhen(feature({ releasedDate: '2026-03-05' }))).toBe('Mar 5');
  });

  it('falls back to the milestone, then "TBD", when there is no released date', () => {
    expect(formatRoadmapWhen(feature({ milestone: 'Q3 2026' }))).toBe('Q3 2026');
    expect(formatRoadmapWhen(feature({ milestone: '' }))).toBe('TBD');
  });
});

describe('displayAppName', () => {
  it('uses the known app name when available', () => {
    expect(displayAppName('medoura', { medoura: 'Medoura' })).toBe('Medoura');
  });

  it('title-cases the raw id as a fallback for an unknown app', () => {
    expect(displayAppName('unknown-app', {})).toBe('Unknown-app');
  });
});

describe('shippedInLastNDays', () => {
  it('counts only Released items with a releasedDate inside the window', () => {
    const now = Date.now();
    const recent = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const old = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
    const roadmap: RoadmapFeature[] = [
      feature({ status: 'Released', releasedDate: recent }),
      feature({ status: 'Released', releasedDate: old }),
      feature({ status: 'Planned', releasedDate: recent }),
      feature({ status: 'Released', releasedDate: undefined }),
    ];

    expect(shippedInLastNDays(roadmap, 30)).toBe(1);
  });
});
