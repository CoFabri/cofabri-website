import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/marketing/Hero', () => ({ default: () => null }));
vi.mock('@/components/marketing/HomepageApps', () => ({ default: () => null }));
vi.mock('@/components/marketing/CoBuildSection', () => ({ default: () => null }));
vi.mock('@/components/marketing/About', () => ({ default: () => null }));
vi.mock('@/components/marketing/CompactRoadmap', () => ({ default: () => null }));
vi.mock('@/components/marketing/FAQ', () => ({ default: () => null }));
vi.mock('@/components/marketing/LiveChat', () => ({ default: () => null }));
vi.mock('@/components/marketing/HomeContent', () => ({ default: () => null }));

import { generateMetadata } from './page';
import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/site-metadata';

describe('home metadata', () => {
  it('has a canonical of / and the descriptive title', async () => {
    const m = await generateMetadata();
    expect(m.alternates?.canonical).toBe('/');
    expect(m.title).toEqual({ absolute: HOME_TITLE });
    expect(HOME_TITLE).toBe('CoFabri | Software Studio and Co-Build Partner for Focused Apps');
  });

  it('describes what CoFabri does within 160 characters', () => {
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(HOME_DESCRIPTION).toMatch(/software studio/i);
    expect(HOME_DESCRIPTION).toMatch(/Co-Build/);
  });
});
