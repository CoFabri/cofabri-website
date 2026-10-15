import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  getApps: vi.fn(),
  getApp: vi.fn(async () => ({
    id: 'medoura',
    name: 'Medoura',
    description: 'Short app summary.',
    feature1: 'Online intake forms for every patient visit',
    feature2: 'Automated appointment reminders',
    feature3: 'Secure messaging between staff and patients',
    status: 'Live',
  })),
  getAppReleases: vi.fn(),
  getRoadmapFeatures: vi.fn(),
  getTeam: vi.fn(),
  getPolicies: vi.fn(),
  getKnowledgeBaseArticles: vi.fn(),
  getKnowledgeBaseArticle: vi.fn(async () => ({
    title: 'Co-Build vs Finding a Technical Co-Founder',
    excerpt: 'Short excerpt.',
    content: 'Choosing between a co-build partnership and a technical co-founder depends on what you already bring to the table.',
    publishedAt: '2026-01-01',
    applications: [],
  })),
  getKnowledgeBaseArticlesBySlugs: vi.fn(),
}));
vi.mock('@/lib/status-api', () => ({ getSystemStatus: vi.fn() }));
vi.mock('./legal/LegalDocumentsContent', () => ({ default: () => null }));
vi.mock('./changelog/ChangelogContent', () => ({ default: () => null }));
vi.mock('@/components/marketing/AboutPageContent', () => ({ default: () => null }));
vi.mock('@/components/marketing/AppsPageContent', () => ({ default: () => null }));

import { metadata as aboutMetadata } from './about/page';
import { metadata as appsMetadata } from './apps/page';
import { metadata as changelogMetadata } from './changelog/page';
import { metadata as legalMetadata } from './legal/page';
import { generateMetadata as appMetadata } from './apps/[id]/page';
import { generateMetadata as articleMetadata } from './knowledge-base/[slug]/page';

const inRange = (s: unknown) => typeof s === 'string' && s.length >= 100 && s.length <= 160;

describe('metadata polish', () => {
  it('has 100-160 character descriptions on /about, /changelog and short app and article summaries', async () => {
    expect(inRange(aboutMetadata.description)).toBe(true);
    expect(inRange(changelogMetadata.description)).toBe(true);
    expect(inRange((await appMetadata({ params: Promise.resolve({ id: 'medoura' }) })).description)).toBe(true);
    expect(inRange((await articleMetadata({ params: Promise.resolve({ slug: 'x' }) })).description)).toBe(true);
  });

  it('keeps article titles short (title plus the layout template suffix <= 60)', async () => {
    const m = await articleMetadata({ params: Promise.resolve({ slug: 'x' }) });
    expect(m.title).toBe('Co-Build vs Finding a Technical Co-Founder');
    expect(`${m.title} | CoFabri`.length).toBeLessThanOrEqual(60);
  });

  it('uses summary_large_image on /apps, /about and /legal', () => {
    for (const m of [appsMetadata, aboutMetadata, legalMetadata]) {
      expect((m.twitter as { card?: string }).card).toBe('summary_large_image');
    }
  });
});
