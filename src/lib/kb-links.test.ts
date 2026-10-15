import { describe, expect, it } from 'vitest';
import { pickAppIntroArticles, pickCoBuildComparisons } from './kb-links';

const art = (slug: string, apps: string[] = []) => ({
  slug,
  title: slug,
  applications: apps.map((id) => ({ id, name: id })),
});

describe('pickAppIntroArticles', () => {
  it('returns only what-is / getting-started articles linked to the app', () => {
    const all = [
      art('getting-started-with-praxis', ['praxis']),
      art('what-is-praxis', ['praxis']),
      art('praxis-billing', ['praxis']),
      art('getting-started-with-medoura', ['medoura']),
    ];
    expect(pickAppIntroArticles('praxis', all).map((a) => a.slug)).toEqual([
      'getting-started-with-praxis',
      'what-is-praxis',
    ]);
  });

  it('returns nothing when none exist', () => {
    expect(pickAppIntroArticles('gathr', [art('other', ['gathr'])])).toEqual([]);
  });
});

describe('pickCoBuildComparisons', () => {
  it('picks co-build comparison articles, capped at two', () => {
    const all = [
      art('co-build-vs-finding-a-technical-co-founder'),
      art('co-build-vs-a-venture-studio'),
      art('co-build-vs-an-agency'),
      art('praxis-vs-other'),
      art('how-co-build-works'),
    ];
    expect(pickCoBuildComparisons(all).map((a) => a.slug)).toEqual([
      'co-build-vs-finding-a-technical-co-founder',
      'co-build-vs-a-venture-studio',
    ]);
  });
});
