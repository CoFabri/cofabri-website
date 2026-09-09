import { describe, expect, it } from 'vitest';
import { roadmapStatusPillClasses, formatRoadmapWhen, displayAppName, shippedInLastNDays, isRoadmapVisible } from './roadmap-display';
import type { RoadmapFeature } from '@/lib/api-client';

function feature(overrides: Partial<RoadmapFeature> = {}): RoadmapFeature {
  return { id: 'r-1', name: 'Feature', description: '', status: 'Planned', milestone: '', releaseType: '', apps: [], ...overrides };
}

describe('roadmapStatusPillClasses', () => {
  it('defaults unrecognized/Planned statuses to the muted palette', () => {
    expect(roadmapStatusPillClasses('Planned')).toContain('muted');
    expect(roadmapStatusPillClasses('anything-else')).toContain('muted');
  });
});

describe('formatRoadmapWhen', () => {
  it('formats a released date as MM-DD-YYYY', () => {
    expect(formatRoadmapWhen(feature({ releasedDate: '2026-03-05' }))).toBe('03-05-2026');
  });

  it('reads the calendar date straight off a date-only string, ignoring local timezone', () => {
    // A date-only string parses as UTC midnight; naively reading local date parts
    // back off that would roll the date back a day west of UTC. See the same
    // regression covered for ChangelogContent.tsx's parseFeatureDate.
    expect(formatRoadmapWhen(feature({ releasedDate: '2026-09-01' }))).toBe('09-01-2026');
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

describe('isRoadmapVisible', () => {
  it('excludes a Cancelled release regardless of its linked apps', () => {
    const activeAppIds = new Set(['app-1']);
    expect(isRoadmapVisible(feature({ status: 'Cancelled', apps: [{ id: 'app-1', name: 'App 1' }] }), activeAppIds)).toBe(false);
  });

  it('excludes a Released release with no active linked app', () => {
    const activeAppIds = new Set(['app-1']);
    expect(isRoadmapVisible(feature({ status: 'Released', apps: [{ id: 'app-2', name: 'App 2' }] }), activeAppIds)).toBe(false);
  });

  it('includes a non-Released release with no active linked app when it has no linked apps at all', () => {
    const activeAppIds = new Set(['app-1']);
    expect(isRoadmapVisible(feature({ status: 'Planned', apps: [] }), activeAppIds)).toBe(true);
  });

  it('includes a release with at least one active linked app', () => {
    const activeAppIds = new Set(['app-1']);
    expect(
      isRoadmapVisible(feature({ status: 'Released', apps: [{ id: 'app-2', name: 'App 2' }, { id: 'app-1', name: 'App 1' }] }), activeAppIds)
    ).toBe(true);
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
