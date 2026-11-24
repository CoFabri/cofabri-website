import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  getApps: vi.fn(), getMarketingApps: vi.fn(), getServices: vi.fn(),
  isService: (app: { projectType?: string }) => app?.projectType === 'cofabri_service',
  getService: vi.fn(async (id: string) =>
    id === 'cofabri-marketing'
      ? { id, name: 'CoFabri Marketing', description: 'Ads.', status: 'Live', projectType: 'cofabri_service', linkedAppId: 'cofabri-crm' }
      : null,
  ),
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
import { metadata as servicesMetadata } from './services/page';
import { generateMetadata as serviceMetadata } from './services/[slug]/page';
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

  it('has 100-160 character descriptions on /services and a service page, with a canonical URL', async () => {
    expect(inRange(servicesMetadata.description)).toBe(true);
    const m = await serviceMetadata({ params: Promise.resolve({ slug: 'cofabri-marketing' }) });
    expect(inRange(m.description)).toBe(true);
    expect(m.title).toBe('CoFabri Marketing');
    expect(m.alternates?.canonical).toBe('/services/cofabri-marketing');
    expect(servicesMetadata.alternates?.canonical).toBe('/services');
  });

  it('answers a missing service page with a not-found title', async () => {
    const m = await serviceMetadata({ params: Promise.resolve({ slug: 'nope' }) });
    expect(m.title).toBe('Service Not Found');
  });

  it('never puts a price in service metadata', async () => {
    const m = await serviceMetadata({ params: Promise.resolve({ slug: 'cofabri-marketing' }) });
    expect(JSON.stringify([servicesMetadata, m])).not.toMatch(/\$\s?\d|per month|\/mo\b/i);
  });

  it('uses summary_large_image on /apps, /about, /legal and /services', () => {
    for (const m of [appsMetadata, aboutMetadata, legalMetadata, servicesMetadata]) {
      expect((m.twitter as { card?: string }).card).toBe('summary_large_image');
    }
  });
});
