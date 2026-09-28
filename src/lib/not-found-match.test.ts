import { describe, it, expect } from 'vitest';
import { findClosestMatch, lastSegment, pickSuggestedArticles, searchSuggestions } from './not-found-match';
import type { App, KnowledgeBaseArticle } from './api-client';

const app = (id: string, name = id): App => ({ id, name, status: 'Live' });
const article = (slug: string, over: Partial<KnowledgeBaseArticle> = {}): KnowledgeBaseArticle =>
  ({
    id: slug,
    slug,
    title: slug.replace(/-/g, ' '),
    content: '',
    category: 'How-To Guide',
    author: '',
    readTime: 1,
    publishedAt: '2026-01-01T00:00:00Z',
    applications: [],
    ...over,
  }) as KnowledgeBaseArticle;

const apps = [app('relay', 'Relay'), app('threshold', 'Threshold')];
const articles = [article('setting-up-webhooks-in-relay'), article('billing-basics')];

describe('lastSegment', () => {
  it('returns the final path segment, ignoring query and hash', () => {
    expect(lastSegment('/apps/rellay?x=1#top')).toBe('rellay');
    expect(lastSegment('/')).toBe('');
  });
});

describe('findClosestMatch', () => {
  it('matches a typo within edit distance 2', () => {
    const m = findClosestMatch('/apps/rellay', apps, articles);
    expect(m).toMatchObject({ kind: 'app', app: { id: 'relay' } });
  });

  it('matches a truncated slug by prefix', () => {
    const m = findClosestMatch('/knowledge-base/setting-up-webhooks', apps, articles);
    expect(m).toMatchObject({ kind: 'article', article: { slug: 'setting-up-webhooks-in-relay' } });
  });

  it('returns null when nothing is close', () => {
    expect(findClosestMatch('/pricing/team-2024', apps, articles)).toBeNull();
  });

  it('ignores very short prefixes', () => {
    expect(findClosestMatch('/r', apps, articles)).toBeNull();
  });

  it('only considers apps under /apps and articles under /knowledge-base', () => {
    expect(findClosestMatch('/apps/billing-basic', apps, articles)).toBeNull();
    expect(findClosestMatch('/knowledge-base/relay', apps, articles)).toBeNull();
  });
});

describe('pickSuggestedArticles', () => {
  it('ranks by shared words for a broken knowledge-base link', () => {
    const r = pickSuggestedArticles('/knowledge-base/relay-webhook-setup', articles);
    expect(r.related).toBe(true);
    expect(r.articles[0].slug).toBe('setting-up-webhooks-in-relay');
  });

  it('falls back to featured then newest elsewhere', () => {
    const list = [article('a'), article('b', { isFeatured: true })];
    const r = pickSuggestedArticles('/nope', list);
    expect(r.related).toBe(false);
    expect(r.articles.map((a) => a.slug)).toEqual(['b', 'a']);
  });

  it('excludes the matched article', () => {
    const r = pickSuggestedArticles('/nope', articles, 'billing-basics');
    expect(r.articles.map((a) => a.slug)).toEqual(['setting-up-webhooks-in-relay']);
  });
});

describe('searchSuggestions', () => {
  it('returns nothing for an empty query', () => {
    expect(searchSuggestions('  ', apps, articles)).toEqual({ apps: [], articles: [] });
  });

  it('matches apps and articles case-insensitively', () => {
    const r = searchSuggestions('RELAY', apps, articles);
    expect(r.apps.map((a) => a.id)).toEqual(['relay']);
    expect(r.articles.map((a) => a.slug)).toEqual(['setting-up-webhooks-in-relay']);
  });
});
