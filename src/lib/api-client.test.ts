import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getTeam', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('fetches the team from cofabri-api and maps rows to TeamMember', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'p1',
          first_name: 'Ada',
          last_name: 'Lovelace',
          full_name: 'Ada Lovelace',
          role_title: 'Co-Founder',
          department: 'leadership',
          bio: 'Builds things.',
          profile_image_url: 'https://example.com/ada.jpg',
          is_founder: true,
          sort_order: 1,
          expertise_areas: ['Product'],
        },
      ],
    });

    const { getTeam } = await import('./api-client');
    const team = await getTeam();

    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/web/content/team', expect.anything());
    expect(team).toEqual([
      {
        id: 'p1',
        name: 'Ada Lovelace',
        roleTitle: 'Co-Founder',
        department: 'leadership',
        bio: 'Builds things.',
        photoUrl: 'https://example.com/ada.jpg',
        isFounder: true,
        sortOrder: 1,
        expertiseAreas: ['Product'],
      },
    ]);
  });

  it('falls back to first + last name when full_name is missing, and returns an empty array on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'p2', first_name: 'Grace', last_name: 'Hopper', full_name: null, is_founder: false, sort_order: null },
      ],
    });

    const { getTeam } = await import('./api-client');
    const team = await getTeam();
    expect(team[0].name).toBe('Grace Hopper');

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
    vi.resetModules();
    const { getTeam: getTeamAfterFailure } = await import('./api-client');
    const empty = await getTeamAfterFailure();
    expect(empty).toEqual([]);
  });
});

describe('getAppReleases', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('fetches releases from cofabri-api and maps them to AppRelease', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { release_name: 'v1.2', public_description: 'Bug fixes', released_date: '2026-01-01' },
      ],
    });

    const { getAppReleases } = await import('./api-client');
    const releases = await getAppReleases('medoura');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cofabri.com/web/content/apps/medoura/releases',
      expect.anything()
    );
    expect(releases).toEqual([{ name: 'v1.2', description: 'Bug fixes', releasedDate: '2026-01-01' }]);
  });

  it('returns an empty array when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const { getAppReleases } = await import('./api-client');
    const releases = await getAppReleases('medoura');

    expect(releases).toEqual([]);
  });
});

describe('getRoadmapFeatures', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('fetches public releases from cofabri-api and maps them to RoadmapFeature, deriving `application` from the first linked app', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'rel-1',
          release_name: 'Medoura Redesign',
          public_description: 'A fresh look',
          release_type: 'major',
          milestone: 'Q3 2026',
          target_release_date: '2026-09-11',
          released_date: null,
          status: 'in_progress',
          apps: [{ app_id: 'medoura', app_name: 'Medoura' }],
        },
      ],
    });

    const { getRoadmapFeatures } = await import('./api-client');
    const features = await getRoadmapFeatures();

    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/web/content/releases', expect.anything());
    expect(features).toEqual([
      {
        id: 'rel-1',
        name: 'Medoura Redesign',
        description: 'A fresh look',
        status: 'In Progress',
        milestone: 'Q3 2026',
        releaseType: 'major',
        releasedDate: '2026-09-11',
        apps: [{ id: 'medoura', name: 'Medoura' }],
        application: 'medoura',
        applicationUrl: undefined,
        featuresAndChanges: undefined,
        releaseNotes: undefined,
      },
    ]);
  });

  it('lists every linked app for a multi-app release, keeping `application` as just the first', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'rel-2',
          release_name: 'Shared infra upgrade',
          public_description: null,
          release_type: 'minor',
          milestone: null,
          target_release_date: null,
          released_date: '2026-09-01',
          status: 'released',
          apps: [
            { app_id: 'medoura', app_name: 'Medoura' },
            { app_id: 'praxis', app_name: 'Praxis' },
          ],
        },
      ],
    });

    const { getRoadmapFeatures } = await import('./api-client');
    const [feature] = await getRoadmapFeatures();

    expect(feature.apps).toEqual([
      { id: 'medoura', name: 'Medoura' },
      { id: 'praxis', name: 'Praxis' },
    ]);
    expect(feature.application).toBe('medoura');
  });

  it('returns an empty array when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const { getRoadmapFeatures } = await import('./api-client');
    const features = await getRoadmapFeatures();

    expect(features).toEqual([]);
  });
});

describe('getApp', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('maps beta_capacity and beta_spots_filled onto the App', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        app_id: 'medoura',
        app_name: 'Medoura',
        lifecycle_stage: 'Beta',
        beta_capacity: 10,
        beta_spots_filled: 4,
      }),
    });

    const { getApp } = await import('./api-client');
    const app = await getApp('medoura');

    expect(app?.betaCapacity).toBe(10);
    expect(app?.betaSpotsFilled).toBe(4);
  });

  it('passes through a null beta_capacity and a missing beta_spots_filled as-is', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        app_id: 'reprisma',
        app_name: 'Reprisma',
        lifecycle_stage: 'Beta',
        beta_capacity: null,
      }),
    });

    const { getApp } = await import('./api-client');
    const app = await getApp('reprisma');

    expect(app?.betaCapacity).toBeNull();
    expect(app?.betaSpotsFilled).toBeUndefined();
  });
});

describe('getKnowledgeBaseArticle', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('maps a populated author object to authorProfile', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
        author_name: 'Jane Doe',
        author: {
          id: 'author-1',
          name: 'Jane Doe',
          role: 'Support Lead',
          bio: 'Short bio.',
          twitter_url: 'https://x.com/jane',
          linkedin_url: 'https://linkedin.com/in/jane',
          headshot_url: 'https://files.cofabri.com/authors/jane.jpg',
        },
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.author).toBe('Jane Doe');
    expect(article?.authorProfile).toEqual({
      name: 'Jane Doe',
      role: 'Support Lead',
      bio: 'Short bio.',
      twitterUrl: 'https://x.com/jane',
      linkedinUrl: 'https://linkedin.com/in/jane',
      headshotUrl: 'https://files.cofabri.com/authors/jane.jpg',
    });
  });

  it('leaves authorProfile undefined when author is null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
        author_name: 'Jane Doe',
        author: null,
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.author).toBe('Jane Doe');
    expect(article?.authorProfile).toBeUndefined();
  });

  it('leaves authorProfile undefined when author is absent from the response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
        author_name: 'Jane Doe',
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.authorProfile).toBeUndefined();
  });
});

describe('getKnowledgeBaseArticle applications mapping', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('maps a populated applications array to LinkedApp objects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
        applications: [
          { app_id: 'medoura', app_name: 'Medoura', favicon_url: 'https://files.cofabri.com/medoura-favicon.jpg', app_url: 'https://medoura.com' },
        ],
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.applications).toEqual([
      { id: 'medoura', name: 'Medoura', faviconUrl: 'https://files.cofabri.com/medoura-favicon.jpg', appUrl: 'https://medoura.com' },
    ]);
  });

  it('maps null favicon_url/app_url to undefined, not null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
        applications: [
          { app_id: 'medoura', app_name: 'Medoura', favicon_url: null, app_url: null },
        ],
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.applications).toEqual([{ id: 'medoura', name: 'Medoura' }]);
  });

  it('returns an empty array when applications is absent from the response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        article_title: 'Getting Started',
        article_content: 'Content',
        category: 'how_to_guide',
        site_url_slug: 'getting-started',
      }),
    });

    const { getKnowledgeBaseArticle } = await import('./api-client');
    const article = await getKnowledgeBaseArticle('getting-started');

    expect(article?.applications).toEqual([]);
  });
});
