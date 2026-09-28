import { describe, it, expect } from 'vitest';
import { pickFallbackRelated } from './kb-related';
import type { KnowledgeBaseArticle } from './api-client';

let n = 0;
function article(over: Partial<KnowledgeBaseArticle> & { apps?: string[] }): KnowledgeBaseArticle {
  n += 1;
  const { apps = [], ...rest } = over;
  return {
    id: `id-${n}`,
    slug: `slug-${n}`,
    title: `Article ${n}`,
    content: '',
    category: 'How-To Guide',
    author: '',
    readTime: 1,
    publishedAt: '2026-01-01T00:00:00Z',
    applications: apps.map((id) => ({ id, name: id })),
    ...rest,
  } as KnowledgeBaseArticle;
}

describe('pickFallbackRelated', () => {
  it('excludes the current article', () => {
    const current = article({ apps: ['praxis'] });
    const other = article({ apps: ['praxis'] });
    expect(pickFallbackRelated(current, [current, other])).toEqual([other]);
  });

  it('prefers articles sharing an app over category-only matches', () => {
    const current = article({ apps: ['praxis'], category: 'FAQ' });
    const sameCategory = article({ apps: ['gathr'], category: 'FAQ' });
    const sameApp = article({ apps: ['praxis'], category: 'Troubleshooting' });
    expect(pickFallbackRelated(current, [sameCategory, sameApp])).toEqual([sameApp, sameCategory]);
  });

  it('fills remaining slots with same-category articles and never with unrelated ones', () => {
    const current = article({ apps: ['praxis'], category: 'FAQ' });
    const sameApp = article({ apps: ['praxis'] });
    const sameCategory = article({ apps: [], category: 'FAQ' });
    const unrelated = article({ apps: ['gathr'], category: 'Best Practices' });
    expect(pickFallbackRelated(current, [unrelated, sameCategory, sameApp])).toEqual([sameApp, sameCategory]);
  });

  it('orders each tier by most recently updated and caps at the limit', () => {
    const current = article({ apps: ['praxis'] });
    const old = article({ apps: ['praxis'], lastUpdated: '2026-01-01T00:00:00Z' });
    const newest = article({ apps: ['praxis'], lastUpdated: '2026-09-01T00:00:00Z' });
    const mid = article({ apps: ['praxis'], lastUpdated: '2026-05-01T00:00:00Z' });
    const extra = article({ apps: ['praxis'], lastUpdated: '2026-03-01T00:00:00Z' });
    expect(pickFallbackRelated(current, [old, newest, mid, extra], 3)).toEqual([newest, mid, extra]);
  });

  it('returns an empty list when nothing is related', () => {
    const current = article({ apps: ['praxis'], category: 'FAQ' });
    const unrelated = article({ apps: ['gathr'], category: 'Best Practices' });
    expect(pickFallbackRelated(current, [current, unrelated])).toEqual([]);
  });
});
