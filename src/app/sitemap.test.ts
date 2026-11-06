import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({ getMarketingApps: vi.fn(), getKnowledgeBaseArticles: vi.fn() }));

import { getMarketingApps, getKnowledgeBaseArticles } from '@/lib/api-client';
import sitemap from './sitemap';

const mockedApps = vi.mocked(getMarketingApps);
const mockedArticles = vi.mocked(getKnowledgeBaseArticles);

beforeEach(() => {
  mockedApps.mockResolvedValue([
    { id: 'medoura', name: 'Medoura', status: 'live', releaseDate: '2026-03-01' },
    { id: 'future', name: 'Future', status: 'beta', launchDate: '2999-10-19' },
  ] as Awaited<ReturnType<typeof getMarketingApps>>);
  mockedArticles.mockResolvedValue([
    { slug: 'a-guide', lastUpdated: '2026-05-01', publishedAt: '2026-04-01' },
    { slug: 'undated', publishedAt: '' },
  ] as Awaited<ReturnType<typeof getKnowledgeBaseArticles>>);
});

describe('sitemap', () => {
  it('includes /developers and the dynamic pages', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://cofabri.com/developers');
    expect(urls).toContain('https://cofabri.com/developers/maven-os');
    expect(urls).toContain('https://cofabri.com/apps/medoura');
    expect(urls).toContain('https://cofabri.com/knowledge-base/a-guide');
  });

  it('reads app pages from the marketing list only', async () => {
    await sitemap();
    expect(mockedApps).toHaveBeenCalled();
  });

  it('leaves out noindex pages and legal documents', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const path of ['/support', '/status', '/legal']) {
      expect(urls).not.toContain(`https://cofabri.com${path}`);
    }
    expect(urls.some((u) => u.includes('/legal'))).toBe(false);
  });

  it('never emits a future or invented lastmod', async () => {
    const entries = await sitemap();
    const now = Date.now();
    for (const e of entries) {
      if (e.lastModified) expect(new Date(e.lastModified).getTime()).toBeLessThanOrEqual(now);
    }
    expect(entries.find((e) => e.url.endsWith('/apps/future'))?.lastModified).toBeUndefined();
    expect(entries.find((e) => e.url.endsWith('/knowledge-base/undated'))?.lastModified).toBeUndefined();
    expect(entries.find((e) => e.url.endsWith('/apps/medoura'))?.lastModified).toEqual(new Date('2026-03-01'));
  });
});
