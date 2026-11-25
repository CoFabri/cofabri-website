import { describe, expect, it } from 'vitest';
import { allServicesLabel, homeCardsGridClass, homeServicesLayout, homeServicesView } from './home-layout';

describe('homeServicesLayout', () => {
  it('has nothing to show for zero services', () => {
    expect(homeServicesLayout(0)).toBe('none');
  });

  it('one service is a single horizontal card', () => {
    expect(homeServicesLayout(1)).toBe('solo');
  });

  it('two to four services are cards', () => {
    for (const n of [2, 3, 4]) expect(homeServicesLayout(n)).toBe('cards');
  });

  it('five or more services leave out the cards: the link only', () => {
    for (const n of [5, 6, 12]) expect(homeServicesLayout(n)).toBe('link-only');
  });
});

describe('homeCardsGridClass', () => {
  it('two: one column, two from 768', () => {
    expect(homeCardsGridClass(2)).toBe('grid grid-cols-1 gap-6 md:grid-cols-2');
  });

  it('three: one column, two from 768, three from 1024', () => {
    expect(homeCardsGridClass(3)).toBe('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3');
  });

  it('four: two by two, never four across', () => {
    const cls = homeCardsGridClass(4);
    expect(cls).toBe('grid grid-cols-1 gap-6 md:grid-cols-2');
    expect(cls).not.toContain('lg:grid-cols-4');
  });
});

describe('allServicesLabel', () => {
  it('reads "All Services" while the cards are shown', () => {
    for (const n of [1, 2, 3, 4]) expect(allServicesLabel(n)).toBe('All Services');
  });

  it('carries the count when the cards are left out', () => {
    expect(allServicesLabel(5)).toBe('All 5 Services');
    expect(allServicesLabel(9)).toBe('All 9 Services');
  });
});

describe('homeServicesView', () => {
  it('shows a skeleton while loading', () => {
    expect(homeServicesView({ status: 'loading' })).toBe('skeleton');
  });

  it('is hidden on an error', () => {
    expect(homeServicesView({ status: 'error' })).toBe('hidden');
  });

  it('is hidden with zero services', () => {
    expect(homeServicesView({ status: 'ready', count: 0 })).toBe('hidden');
  });

  it('shows the section once there is at least one service', () => {
    expect(homeServicesView({ status: 'ready', count: 1 })).toBe('section');
    expect(homeServicesView({ status: 'ready', count: 7 })).toBe('section');
  });
});
