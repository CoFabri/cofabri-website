import { describe, expect, it, vi, afterEach } from 'vitest';
import { statusPillClasses, markPalette, appMomentum, actionLabel, actionHref, isLaunchingToday } from './app-display';
import type { App, RoadmapFeature } from '@/lib/api-client';

function app(overrides: Partial<App> = {}): App {
  return { id: 'app-1', name: 'App', status: 'Live', ...overrides };
}

function roadmapItem(overrides: Partial<RoadmapFeature> = {}): RoadmapFeature {
  return { id: 'r-1', name: 'Feature', description: '', status: 'Planned', milestone: '', releaseType: '', ...overrides };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('statusPillClasses', () => {
  it('treats Live and Active the same', () => {
    expect(statusPillClasses('Live')).toBe(statusPillClasses('Active'));
  });
});

describe('markPalette', () => {
  it('is deterministic for the same id', () => {
    expect(markPalette('medoura')).toBe(markPalette('medoura'));
  });

  it('can produce different palettes for different ids', () => {
    expect(markPalette('a')).not.toBe(markPalette('bb'));
  });
});

describe('actionLabel / actionHref', () => {
  it('offers a waitlist link for apps still in development', () => {
    const a = app({ status: 'In Development' });
    expect(actionLabel(a)).toBe('Join waitlist');
    expect(actionHref(a)).toBe('/signup?appId=app-1');
  });

  it('links straight to the app URL when live, adding https:// if missing', () => {
    const a = app({ status: 'Live', url: 'app.example.com' });
    expect(actionLabel(a)).toBe('Visit');
    expect(actionHref(a)).toBe('https://app.example.com');
  });

  it('falls back to the apps index when a live app has no url', () => {
    expect(actionHref(app({ status: 'Live' }))).toBe('/apps');
  });
});

describe('appMomentum', () => {
  it('reports items shipped in the current quarter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T00:00:00Z'));
    const roadmap: RoadmapFeature[] = [
      roadmapItem({ application: 'app-1', status: 'Released', releasedDate: '2026-08-01' }),
      roadmapItem({ application: 'app-1', status: 'Released', releasedDate: '2026-08-15' }),
      roadmapItem({ application: 'other-app', status: 'Released', releasedDate: '2026-08-15' }),
    ];
    expect(appMomentum(app(), roadmap)).toBe('2 shipped this quarter');
  });

  it('falls back to the next in-progress or planned item', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T00:00:00Z'));
    const roadmap: RoadmapFeature[] = [roadmapItem({ application: 'app-1', status: 'Planned', name: 'Next feature' })];
    expect(appMomentum(app(), roadmap)).toBe('Next: Next feature');
  });

  it('returns an em dash when there is nothing to report', () => {
    expect(appMomentum(app(), [])).toBe('—');
  });
});

describe('isLaunchingToday', () => {
  it('is false when the app has no launch date', () => {
    expect(isLaunchingToday(app())).toBe(false);
  });

  it('is true only when the launch date matches today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00Z'));
    expect(isLaunchingToday(app({ launchDate: '2026-09-02' }))).toBe(true);
    expect(isLaunchingToday(app({ launchDate: '2026-09-01' }))).toBe(false);
  });
});
