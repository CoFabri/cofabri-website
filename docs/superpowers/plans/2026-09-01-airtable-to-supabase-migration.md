# Airtable → Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every Airtable read and write in `cofabri-website` with new Supabase-backed endpoints on `cofabri-api`, then delete the website's Airtable dependency entirely.

**Architecture:** `cofabri-api` gains a `WebContentService`/`WebFormsService` pair and two new route files (`web-content.js`, `web-forms.js`) mounted under the existing `/web` router, reading/writing the Supabase tables `cofabri-core` already owns. `cofabri-website` gets a new `src/lib/api-client.ts` that mirrors every exported function name and TypeScript interface in the current `src/lib/airtable.ts`, so the ~25 files that import from it change only their import path. Once every area is verified, `lib/airtable.ts`, the inline Airtable fetch duplicates, and the `airtable` npm dependency are deleted in one cutover.

**Tech Stack:** cofabri-api: Node/Express, `@supabase/supabase-js`, Jest + Supertest. cofabri-website: Next.js 16 App Router, TypeScript, `fetch` (no test framework configured — see Global Constraints). cofabri-core: a standalone Node script (`scripts/migrate-airtable.mjs`) and a plain SQL migration.

**Spec:** `docs/superpowers/specs/2026-09-01-airtable-to-supabase-migration-design.md`

## Global Constraints

- Supabase project: `iwpgwnapxuhpsdndvsrv` ("CoFabri Core & API"), already the target of cofabri-api's existing `COFABRI_SUPABASE_URL` / `COFABRI_SUPABASE_SERVICE_ROLE_KEY` env vars — reuse them, no new Supabase secrets needed in cofabri-api.
- New cofabri-website env vars: `COFABRI_API_BASE_URL` (e.g. `https://api.cofabri.com`) and `COFABRI_API_KEY` (must equal cofabri-api's `API_KEY_SECRET`, used only for the write endpoints).
- Public image storage: bucket `attachments` (public). Build URLs as `` `${COFABRI_SUPABASE_URL}/storage/v1/object/public/attachments/${storage_path}` ``. (Renamed from `airtable-attachments` on 2026-09-04 — see cofabri-core's `docs/superpowers/specs/2026-09-04-kb-author-bios-design.md` "Bucket rename" section. This plan was never executed, so update the name here before implementing rather than treating this as historical.)
- New read endpoints (`/web/content/*`) are public, unauthenticated — same posture as the existing `/web/*` routes, covered by the app-wide rate limiter already in `src/index.js`.
- New write endpoints (`/web/forms/*`) reuse the existing `authenticateApiKey` middleware (`Authorization: Bearer <API_KEY_SECRET>`) — the same pattern already used by `/signup` and `/checkout` in `src/index.js`.
- `support_cases.public_status` (nullable enum: `investigating`/`identified`/`monitoring`/`resolved`) is the only public-status gate — filter `WHERE public_status IS NOT NULL`. Do **not** filter by `support_cases.type`; verified all 41 existing rows are `type='internal_issue'` with `public_status` correctly `NULL` (Airtable "Private"), so the public feed is legitimately empty today, not a bug. New support-form submissions insert `type='customer_ticket'`, `public_status=NULL`.
- Content-area identifiers move from Airtable record IDs (`rec...`) to natural keys: `apps.app_id` (text slug, e.g. `medoura`) for apps, `kb_articles.site_url_slug` for KB articles, Supabase `id` (uuid) for testimonials/banners/roadmap/legal (no slug column exists there).
- **No test framework exists in cofabri-website** (`package.json` has no `test` script or test dependency) or in cofabri-core beyond Node's built-in `--test` runner used for one unrelated file. Per "follow existing patterns," website and cofabri-core tasks in this plan use manual verification (dev server + `curl`/browser) instead of automated tests. cofabri-api **does** have Jest + Supertest already (`tests/routes/*.test.js`, `tests/services/*.test.js`) — those tasks use real TDD.
- `apps.status` is always `'active'` in Supabase (an operational flag, not a lifecycle stage) — it does **not** map to the website's `App['status']` (`'Live' | 'Beta' | 'Alpha' | ...`). Task 1 adds a real `lifecycle_stage` column to close this gap.

---

## Task 1: cofabri-core — add `apps.lifecycle_stage` column

The website's app cards show a lifecycle badge (Live/Beta/Alpha/Coming Soon) that Airtable's "Application Status" field drove. No Supabase column carries this today. Add one so cofabri-core's admin UI can set it going forward (UI itself is out of scope — this just adds the column and a sane default).

**Files:**
- Create: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/supabase/migrations/20260901000004_add_apps_lifecycle_stage.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 20260901000004_add_apps_lifecycle_stage.sql
alter table public.apps
  add column if not exists lifecycle_stage text;

comment on column public.apps.lifecycle_stage is
  'Marketing lifecycle badge shown on the website (e.g. live, beta, alpha, coming_soon). Null until set by an admin.';
```

- [ ] **Step 2: Apply the migration**

Run from `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core`: `supabase db push` (or, if that requires interactive project linking you don't have locally, apply it directly against project `iwpgwnapxuhpsdndvsrv` via the Supabase MCP `apply_migration` tool with the SQL above and name `add_apps_lifecycle_stage`).

- [ ] **Step 3: Verify**

Query: `select column_name from information_schema.columns where table_name='apps' and column_name='lifecycle_stage';` — expect one row.

- [ ] **Step 4: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add supabase/migrations/20260901000004_add_apps_lifecycle_stage.sql
git commit -m "feat: add apps.lifecycle_stage for website marketing badge"
```

---

## Task 2: cofabri-core — backfill `app_roadmaps` and reconcile other content tables against Airtable

Confirmed gap: Airtable's "Roadmap" table (base `app9KvSkBwix9MnSr`, table `tblgTPDuwDnOceccJ`) has 8 records with "Publish to Website" checked; `app_roadmaps` has 0 rows. Extend `migrate-airtable.mjs` with an importer for this table, following its existing import function conventions.

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/scripts/migrate-airtable.mjs`

- [ ] **Step 1: Read the existing file to find the pattern to follow**

Open `scripts/migrate-airtable.mjs` and locate an existing `import*` function (e.g. `importAppCore` or similar) to copy its shape: Airtable fetch → map fields → `supabase.from(table).upsert(rows, { onConflict: 'airtable_record_id' })`.

- [ ] **Step 2: Add the roadmap importer**

Add a new function in the same file, matching the existing importer style found in Step 1:

```js
async function importRoadmap() {
  const records = await fetchAirtableTable({
    baseId: 'app9KvSkBwix9MnSr',
    tableId: 'tblgTPDuwDnOceccJ', // "Roadmap" table, CoFabri: Site Management base
  });

  const rows = records
    .filter((r) => r.fields['Publish to Website?'] === true)
    .map((r) => ({
      airtable_record_id: r.id,
      roadmap_item_name: r.fields['Name'] ?? null,
      description: r.fields['Description'] ?? null,
      status: mapRoadmapStatus(r.fields['Status']),
      target_date: r.fields['Released Date'] ?? null,
      priority: null,
      target_quarter: r.fields['Milestone'] ?? null,
    }));

  const { error } = await supabase
    .from('app_roadmaps')
    .upsert(rows, { onConflict: 'airtable_record_id' });

  if (error) throw error;
  console.log(`Imported ${rows.length} app_roadmaps rows`);
  return rows.length;
}

function mapRoadmapStatus(airtableStatus) {
  const map = {
    Planned: 'planned',
    'In Progress': 'in_progress',
    Released: 'released',
    Delayed: 'delayed',
    Cancelled: 'cancelled',
  };
  return map[airtableStatus] ?? 'planned';
}
```

Wire `importRoadmap()` into the script's existing top-level runner (wherever the other `import*` functions are invoked in sequence).

- [ ] **Step 3: Run it**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
node scripts/migrate-airtable.mjs --only=roadmap
```

(If the script has no `--only` flag, run it in full — it upserts on `airtable_record_id` so re-running is safe.)

- [ ] **Step 4: Verify**

Query: `select count(*) from app_roadmaps;` — expect 8. Spot-check one row's `roadmap_item_name` matches an Airtable record (e.g. "CertiFi Central").

- [ ] **Step 5: Reconcile the five content tables never directly count-checked against Airtable during planning**

Planning only verified `app_releases` (10/10, matched) and `app_roadmaps` (fixed above) against live Airtable; `kb_articles` (60), `site_testimonials` (6), `site_banners` (1), `kb_contracts` (13), and `apps` (8) were only confirmed non-empty, not cross-checked. Run this count comparison — for each pair, query Airtable's `list_records_for_table` (base/table IDs below) with `pageSize: 1` and read `metadata.totalRecordCount`, then compare to the Supabase count:

| Supabase table (Postgres `select count(*)`) | Airtable base | Airtable table |
|---|---|---|
| `kb_articles` where `status='published'` | `appMlzBsqiq8vNz5X` (CoFabri: Knowledge Base) | `Knowledge Base`, filtered `{Status} = "Published"` |
| `site_testimonials` where `is_active=true` | `app9KvSkBwix9MnSr` (CoFabri: Site Management) | `Testimonials`, filtered `{Active?} = TRUE()` |
| `site_banners` | `app9KvSkBwix9MnSr` | `Sitewide Banners` |
| `kb_contracts` | `app9KvSkBwix9MnSr` | `Contracts & Legal Docs` |
| `apps` where `display_on_website=true` | `appLCRokCHruMDfuB` (CoFabri: Application Core) | `Applications`, filtered `{Display on Website?} = TRUE()` |

If a count matches, no action needed. If Supabase is short (like the roadmap case), extend `migrate-airtable.mjs` with the same upsert-on-`airtable_record_id` pattern used in Step 2 for the missing rows, following whichever existing importer in the script already targets that table (there should already be an importer for each of these five, since their bulk of rows came from somewhere — this step is closing the gap for what changed in Airtable *since* that import ran, not writing a new importer from scratch). If Supabase has *more* rows than Airtable (a row deleted in Airtable after import), leave it — deletions aren't part of this migration's scope, note it in the commit message for the user to address separately.

- [ ] **Step 6: Commit**

```bash
git add scripts/migrate-airtable.mjs
git commit -m "feat: backfill app_roadmaps and reconcile content tables against Airtable"
```

---

## Task 3: cofabri-api — `WebContentService` scaffold + Apps endpoints

Establishes the service/route pattern every later read task follows.

**Files:**
- Create: `src/services/WebContentService.js`
- Create: `src/routes/web-content.js`
- Modify: `src/routes/web.js` (mount the new router)
- Test: `tests/services/WebContentService.test.js`
- Test: `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `WebContentService.getApps(): Promise<Row[]>`, `WebContentService.getAppByAppId(appId: string): Promise<Row|null>`, `WebContentService.buildPublicStorageUrl(bucket, path): string` — later tasks add more methods to this same class.
- Produces: `GET /web/content/apps` → `200 [Row]`, `GET /web/content/apps/:appId` → `200 Row` or `404`.

- [ ] **Step 1: Write the failing service test**

```js
// tests/services/WebContentService.test.js
jest.mock('@supabase/supabase-js');
const { createClient } = require('@supabase/supabase-js');

describe('WebContentService.getApps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns apps flagged for website display, ordered by name', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ app_id: 'medoura', app_name: 'Medoura', display_on_website: true }],
      error: null,
    });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const apps = await service.getApps();

    expect(from).toHaveBeenCalledWith('apps');
    expect(eq).toHaveBeenCalledWith('display_on_website', true);
    expect(apps).toEqual([{ app_id: 'medoura', app_name: 'Medoura', display_on_website: true }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js`
Expected: FAIL — `Cannot find module '../../src/services/WebContentService'`

- [ ] **Step 3: Write the service**

```js
// src/services/WebContentService.js
const { createClient } = require('@supabase/supabase-js');

class WebContentService {
  constructor() {
    this.supabase = createClient(
      process.env.COFABRI_SUPABASE_URL,
      process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY
    );
  }

  buildPublicStorageUrl(bucket, storagePath) {
    if (!storagePath) return null;
    return `${process.env.COFABRI_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  }

  async getApps() {
    const { data, error } = await this.supabase
      .from('apps')
      .select('*')
      .eq('display_on_website', true)
      .order('app_name', { ascending: true });
    if (error) throw error;

    const { data: images } = await this.supabase
      .from('app_featured_images')
      .select('app_id, storage_path');
    const imageByAppId = new Map((images || []).map((i) => [i.app_id, i.storage_path]));

    return (data || []).map((app) => ({
      ...app,
      screenshot_url: this.buildPublicStorageUrl('attachments', imageByAppId.get(app.app_id)),
    }));
  }

  async getAppByAppId(appId) {
    const { data: app, error } = await this.supabase
      .from('apps')
      .select('*')
      .eq('app_id', appId)
      .eq('display_on_website', true)
      .maybeSingle();
    if (error) throw error;
    if (!app) return null;

    const { data: statements } = await this.supabase
      .from('site_beta')
      .select('*')
      .eq('app_id', appId)
      .eq('type', 'statement')
      .eq('status', 'approved')
      .order('order', { ascending: true });

    const { data: images } = await this.supabase
      .from('app_featured_images')
      .select('storage_path')
      .eq('app_id', appId)
      .limit(1);

    return {
      ...app,
      screenshot_url: this.buildPublicStorageUrl('attachments', images?.[0]?.storage_path),
      beta_statements: statements || [],
    };
  }
}

module.exports = WebContentService;
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// tests/routes/web-content.test.js
const request = require('supertest');
const express = require('express');

jest.mock('../../src/services/WebContentService');
const WebContentService = require('../../src/services/WebContentService');

describe('GET /web/content/apps', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns the app list as JSON', async () => {
    WebContentService.mockImplementation(() => ({
      getApps: jest.fn().mockResolvedValue([{ app_id: 'medoura', app_name: 'Medoura' }]),
    }));

    const res = await request(app).get('/web/content/apps');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ app_id: 'medoura', app_name: 'Medoura' }]);
  });

  it('returns 500 with no leaked internals on a service error', async () => {
    WebContentService.mockImplementation(() => ({
      getApps: jest.fn().mockRejectedValue(new Error('connection refused')),
    }));

    const res = await request(app).get('/web/content/apps');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Failed to load apps' });
  });
});

describe('GET /web/content/apps/:appId', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns 404 when the app does not exist', async () => {
    WebContentService.mockImplementation(() => ({
      getAppByAppId: jest.fn().mockResolvedValue(null),
    }));

    const res = await request(app).get('/web/content/apps/nonexistent');

    expect(res.status).toBe(404);
  });

  it('returns the app detail when found', async () => {
    WebContentService.mockImplementation(() => ({
      getAppByAppId: jest.fn().mockResolvedValue({ app_id: 'medoura', app_name: 'Medoura' }),
    }));

    const res = await request(app).get('/web/content/apps/medoura');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ app_id: 'medoura', app_name: 'Medoura' });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js`
Expected: FAIL — `Cannot find module '../../src/routes/web-content'`

- [ ] **Step 7: Write the route**

```js
// src/routes/web-content.js
const express = require('express');
const WebContentService = require('../services/WebContentService');

const router = express.Router();
const service = new WebContentService();

router.get('/apps', async (req, res) => {
  try {
    const apps = await service.getApps();
    res.json(apps);
  } catch (error) {
    console.error('GET /web/content/apps error:', error);
    res.status(500).json({ success: false, message: 'Failed to load apps' });
  }
});

router.get('/apps/:appId', async (req, res) => {
  try {
    const app = await service.getAppByAppId(req.params.appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    res.json(app);
  } catch (error) {
    console.error('GET /web/content/apps/:appId error:', error);
    res.status(500).json({ success: false, message: 'Failed to load app' });
  }
});

module.exports = router;
```

- [ ] **Step 8: Mount the router**

In `src/routes/web.js`, add alongside the existing route imports/mounts:

```js
const contentRoutes = require('./web-content');
// ...
router.use('/content', contentRoutes);
```

- [ ] **Step 9: Run both test files to verify they pass**

Run: `npx jest tests/services/WebContentService.test.js tests/routes/web-content.test.js`
Expected: PASS (4 tests)

- [ ] **Step 10: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js src/routes/web.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add WebContentService and GET /web/content/apps endpoints"
```

---

## Task 4: cofabri-api — Knowledge Base endpoints

**Files:**
- Modify: `src/services/WebContentService.js` (add methods)
- Modify: `src/routes/web-content.js` (add routes)
- Modify: `tests/services/WebContentService.test.js`
- Modify: `tests/routes/web-content.test.js`

**Interfaces:**
- Consumes: `this.supabase` from Task 3's constructor.
- Produces: `getKnowledgeBaseArticles(filters?: { category?, tag?, popular?, featured? })`, `getKnowledgeBaseArticleBySlug(slug)`.
- Produces: `GET /web/content/knowledge-base?category=&tag=&popular=&featured=`, `GET /web/content/knowledge-base/:slug`.

- [ ] **Step 1: Write the failing service test**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getKnowledgeBaseArticles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns only published articles', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: '1', article_title: 'Getting Started', status: 'published' }],
      error: null,
    });
    const eq = jest.fn(() => ({ eq, order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const articles = await service.getKnowledgeBaseArticles();

    expect(from).toHaveBeenCalledWith('kb_articles');
    expect(eq).toHaveBeenCalledWith('status', 'published');
    expect(articles).toEqual([{ id: '1', article_title: 'Getting Started', status: 'published' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebContentService.test.js -t getKnowledgeBaseArticles`
Expected: FAIL — `service.getKnowledgeBaseArticles is not a function`

- [ ] **Step 3: Add the methods to `WebContentService`**

```js
// add inside the WebContentService class, after getAppByAppId
  async getKnowledgeBaseArticles({ category, tag, popular, featured } = {}) {
    let query = this.supabase
      .from('kb_articles')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (category) query = query.eq('category', category);
    if (popular === true) query = query.eq('is_popular', true);
    if (featured === true) query = query.eq('is_featured', true);
    if (tag) query = query.contains('tags', [tag]);

    const { data, error } = await query.order('last_updated', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getKnowledgeBaseArticleBySlug(slug) {
    const { data, error } = await this.supabase
      .from('kb_articles')
      .select('*')
      .eq('site_url_slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/knowledge-base', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('passes query params through as filters', async () => {
    const getKnowledgeBaseArticles = jest.fn().mockResolvedValue([{ id: '1' }]);
    WebContentService.mockImplementation(() => ({ getKnowledgeBaseArticles }));

    const res = await request(app).get('/web/content/knowledge-base?category=faq&popular=true');

    expect(res.status).toBe(200);
    expect(getKnowledgeBaseArticles).toHaveBeenCalledWith({
      category: 'faq',
      tag: undefined,
      popular: true,
      featured: undefined,
    });
  });
});

describe('GET /web/content/knowledge-base/:slug', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns 404 when no article matches the slug', async () => {
    WebContentService.mockImplementation(() => ({
      getKnowledgeBaseArticleBySlug: jest.fn().mockResolvedValue(null),
    }));

    const res = await request(app).get('/web/content/knowledge-base/missing-slug');

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js -t "knowledge-base"`
Expected: FAIL — 404 for both (route doesn't exist yet, falls through to Express default 404, but the "passes query params" test fails since `getKnowledgeBaseArticles` is never called)

- [ ] **Step 7: Add the routes**

```js
// add to src/routes/web-content.js, before module.exports
router.get('/knowledge-base', async (req, res) => {
  try {
    const { category, tag, popular, featured } = req.query;
    const articles = await service.getKnowledgeBaseArticles({
      category,
      tag,
      popular: popular === 'true' ? true : undefined,
      featured: featured === 'true' ? true : undefined,
    });
    res.json(articles);
  } catch (error) {
    console.error('GET /web/content/knowledge-base error:', error);
    res.status(500).json({ success: false, message: 'Failed to load knowledge base articles' });
  }
});

router.get('/knowledge-base/:slug', async (req, res) => {
  try {
    const article = await service.getKnowledgeBaseArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error('GET /web/content/knowledge-base/:slug error:', error);
    res.status(500).json({ success: false, message: 'Failed to load article' });
  }
});
```

- [ ] **Step 8: Run the route tests to verify they pass**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add knowledge base endpoints to WebContentService"
```

---

## Task 5: cofabri-api — Roadmap endpoint

**Files:**
- Modify: `src/services/WebContentService.js`, `src/routes/web-content.js`
- Modify: `tests/services/WebContentService.test.js`, `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `getRoadmapItems()`, `GET /web/content/roadmap`.

- [ ] **Step 1: Write the failing service test**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getRoadmapItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('orders by target_date descending', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: '1', roadmap_item_name: 'X' }], error: null });
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const items = await service.getRoadmapItems();

    expect(from).toHaveBeenCalledWith('app_roadmaps');
    expect(order).toHaveBeenCalledWith('target_date', { ascending: false });
    expect(items).toEqual([{ id: '1', roadmap_item_name: 'X' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebContentService.test.js -t getRoadmapItems`
Expected: FAIL — not a function

- [ ] **Step 3: Add the method**

```js
// add inside the WebContentService class
  async getRoadmapItems() {
    const { data, error } = await this.supabase
      .from('app_roadmaps')
      .select('*')
      .order('target_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/roadmap', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns roadmap items', async () => {
    WebContentService.mockImplementation(() => ({
      getRoadmapItems: jest.fn().mockResolvedValue([{ id: '1' }]),
    }));

    const res = await request(app).get('/web/content/roadmap');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1' }]);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js -t roadmap`
Expected: FAIL — 404

- [ ] **Step 7: Add the route**

```js
// add to src/routes/web-content.js
router.get('/roadmap', async (req, res) => {
  try {
    const items = await service.getRoadmapItems();
    res.json(items);
  } catch (error) {
    console.error('GET /web/content/roadmap error:', error);
    res.status(500).json({ success: false, message: 'Failed to load roadmap' });
  }
});
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add roadmap endpoint to WebContentService"
```

---

## Task 6: cofabri-api — Legal document endpoints

**Files:**
- Modify: `src/services/WebContentService.js`, `src/routes/web-content.js`
- Modify: `tests/services/WebContentService.test.js`, `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `getLegalDocuments()`, `getLegalDocumentById(id)`, `GET /web/content/legal`, `GET /web/content/legal/:id`.

- [ ] **Step 1: Write the failing service test**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getLegalDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns only active, public documents', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: '1', title: 'Terms' }], error: null });
    const eq = jest.fn(() => ({ eq, order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const docs = await service.getLegalDocuments();

    expect(from).toHaveBeenCalledWith('kb_contracts');
    expect(eq).toHaveBeenCalledWith('status', 'active');
    expect(docs).toEqual([{ id: '1', title: 'Terms' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebContentService.test.js -t getLegalDocuments`
Expected: FAIL — not a function

- [ ] **Step 3: Add the methods**

```js
// add inside the WebContentService class
  async getLegalDocuments() {
    const { data, error } = await this.supabase
      .from('kb_contracts')
      .select('*')
      .eq('status', 'active')
      .eq('visibility', 'public')
      .order('effective_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLegalDocumentById(id) {
    const { data, error } = await this.supabase
      .from('kb_contracts')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/legal/:id', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns 404 when the document does not exist', async () => {
    WebContentService.mockImplementation(() => ({
      getLegalDocumentById: jest.fn().mockResolvedValue(null),
    }));

    const res = await request(app).get('/web/content/legal/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js -t "legal"`
Expected: FAIL — 404 route doesn't exist (falls to app-level 404, test still fails because mock not asserted — verify by running; if it accidentally passes because both are 404, this is a weak test — proceed to Step 7 regardless since the service method wiring is what matters)

- [ ] **Step 7: Add the routes**

```js
// add to src/routes/web-content.js
router.get('/legal', async (req, res) => {
  try {
    const docs = await service.getLegalDocuments();
    res.json(docs);
  } catch (error) {
    console.error('GET /web/content/legal error:', error);
    res.status(500).json({ success: false, message: 'Failed to load legal documents' });
  }
});

router.get('/legal/:id', async (req, res) => {
  try {
    const doc = await service.getLegalDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('GET /web/content/legal/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to load document' });
  }
});
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add legal document endpoints to WebContentService"
```

---

## Task 7: cofabri-api — Testimonials endpoint

**Files:**
- Modify: `src/services/WebContentService.js`, `src/routes/web-content.js`
- Modify: `tests/services/WebContentService.test.js`, `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `getTestimonials()`, `GET /web/content/testimonials`.

- [ ] **Step 1: Write the failing service test**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getTestimonials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns only active testimonials', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Jane' }], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const testimonials = await service.getTestimonials();

    expect(from).toHaveBeenCalledWith('site_testimonials');
    expect(eq).toHaveBeenCalledWith('is_active', true);
    expect(testimonials).toEqual([{ id: '1', name: 'Jane' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebContentService.test.js -t getTestimonials`
Expected: FAIL — not a function

- [ ] **Step 3: Add the method**

```js
// add inside the WebContentService class
  async getTestimonials() {
    const { data, error } = await this.supabase
      .from('site_testimonials')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false });
    if (error) throw error;
    return data || [];
  }
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/testimonials', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns testimonials', async () => {
    WebContentService.mockImplementation(() => ({
      getTestimonials: jest.fn().mockResolvedValue([{ id: '1' }]),
    }));

    const res = await request(app).get('/web/content/testimonials');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1' }]);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js -t testimonials`
Expected: FAIL — 404

- [ ] **Step 7: Add the route**

```js
// add to src/routes/web-content.js
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await service.getTestimonials();
    res.json(testimonials);
  } catch (error) {
    console.error('GET /web/content/testimonials error:', error);
    res.status(500).json({ success: false, message: 'Failed to load testimonials' });
  }
});
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add testimonials endpoint to WebContentService"
```

---

## Task 8: cofabri-api — Banners + Marketing Popups endpoints

**Files:**
- Modify: `src/services/WebContentService.js`, `src/routes/web-content.js`
- Modify: `tests/services/WebContentService.test.js`, `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `getActiveBanners()`, `getActiveMarketingPopup()`, `GET /web/content/banners`, `GET /web/content/marketing-popups`.

- [ ] **Step 1: Write the failing service tests**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getActiveBanners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('filters to active banners ordered by priority', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: '1', title: 'Notice' }], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const banners = await service.getActiveBanners();

    expect(from).toHaveBeenCalledWith('site_banners');
    expect(eq).toHaveBeenCalledWith('is_active', true);
    expect(banners).toEqual([{ id: '1', title: 'Notice' }]);
  });
});

describe('WebContentService.getActiveMarketingPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns null when no popup is enabled', async () => {
    const limit = jest.fn().mockResolvedValue({ data: [], error: null });
    const order = jest.fn(() => ({ limit }));
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const popup = await service.getActiveMarketingPopup();

    expect(popup).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest tests/services/WebContentService.test.js -t "getActiveBanners|getActiveMarketingPopup"`
Expected: FAIL — not functions

- [ ] **Step 3: Add the methods**

```js
// add inside the WebContentService class
  async getActiveBanners() {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('site_banners')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getActiveMarketingPopup() {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('site_marketing_popups')
      .select('*')
      .eq('is_enabled', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }
```

- [ ] **Step 4: Run the service tests to verify they pass**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route tests**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/banners', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns active banners', async () => {
    WebContentService.mockImplementation(() => ({
      getActiveBanners: jest.fn().mockResolvedValue([{ id: '1' }]),
    }));

    const res = await request(app).get('/web/content/banners');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1' }]);
  });
});

describe('GET /web/content/marketing-popups', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('returns null when there is no active popup', async () => {
    WebContentService.mockImplementation(() => ({
      getActiveMarketingPopup: jest.fn().mockResolvedValue(null),
    }));

    const res = await request(app).get('/web/content/marketing-popups');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx jest tests/routes/web-content.test.js -t "banners|marketing-popups"`
Expected: FAIL — 404

- [ ] **Step 7: Add the routes**

```js
// add to src/routes/web-content.js
router.get('/banners', async (req, res) => {
  try {
    const banners = await service.getActiveBanners();
    res.json(banners);
  } catch (error) {
    console.error('GET /web/content/banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to load banners' });
  }
});

router.get('/marketing-popups', async (req, res) => {
  try {
    const popup = await service.getActiveMarketingPopup();
    res.json(popup);
  } catch (error) {
    console.error('GET /web/content/marketing-popups error:', error);
    res.status(500).json({ success: false, message: 'Failed to load marketing popup' });
  }
});
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add banners and marketing popup endpoints to WebContentService"
```

---

## Task 9: cofabri-api — Status endpoint

**Files:**
- Modify: `src/services/WebContentService.js`, `src/routes/web-content.js`
- Modify: `tests/services/WebContentService.test.js`, `tests/routes/web-content.test.js`

**Interfaces:**
- Produces: `getPublicStatusFeed(appId?: string)`, `GET /web/content/status`, `GET /web/content/status/:app`.

- [ ] **Step 1: Write the failing service test**

```js
// append to tests/services/WebContentService.test.js
describe('WebContentService.getPublicStatusFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('only returns rows with a non-null public_status', async () => {
    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const not = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ not }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    await service.getPublicStatusFeed();

    expect(from).toHaveBeenCalledWith('support_cases');
    expect(not).toHaveBeenCalledWith('public_status', 'is', null);
  });

  it('filters by app_id when given', async () => {
    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const not = jest.fn(() => ({ eq }));
    const select = jest.fn(() => ({ not }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    await service.getPublicStatusFeed('medoura');

    expect(eq).toHaveBeenCalledWith('app_id', 'medoura');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebContentService.test.js -t getPublicStatusFeed`
Expected: FAIL — not a function

- [ ] **Step 3: Add the method**

```js
// add inside the WebContentService class
  async getPublicStatusFeed(appId) {
    let query = this.supabase
      .from('support_cases')
      .select('*')
      .not('public_status', 'is', null);

    if (appId) query = query.eq('app_id', appId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebContentService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// append to tests/routes/web-content.test.js
describe('GET /web/content/status/:app', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    const webContentRoutes = require('../../src/routes/web-content');
    app = express();
    app.use(express.json());
    app.use('/web/content', webContentRoutes);
  });

  it('passes the app param through to the service', async () => {
    const getPublicStatusFeed = jest.fn().mockResolvedValue([]);
    WebContentService.mockImplementation(() => ({ getPublicStatusFeed }));

    await request(app).get('/web/content/status/medoura');

    expect(getPublicStatusFeed).toHaveBeenCalledWith('medoura');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-content.test.js -t "status/:app"`
Expected: FAIL — 404

- [ ] **Step 7: Add the routes**

```js
// add to src/routes/web-content.js
router.get('/status', async (req, res) => {
  try {
    const feed = await service.getPublicStatusFeed();
    res.json(feed);
  } catch (error) {
    console.error('GET /web/content/status error:', error);
    res.status(500).json({ success: false, message: 'Failed to load status feed' });
  }
});

router.get('/status/:app', async (req, res) => {
  try {
    const feed = await service.getPublicStatusFeed(req.params.app);
    res.json(feed);
  } catch (error) {
    console.error('GET /web/content/status/:app error:', error);
    res.status(500).json({ success: false, message: 'Failed to load status feed' });
  }
});
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/routes/web-content.test.js`
Expected: PASS — full read-side suite green: `npx jest tests/services/WebContentService.test.js tests/routes/web-content.test.js`

- [ ] **Step 9: Commit**

```bash
git add src/services/WebContentService.js src/routes/web-content.js tests/services/WebContentService.test.js tests/routes/web-content.test.js
git commit -m "feat: add public status feed endpoint to WebContentService"
```

---

## Task 10: cofabri-api — `WebFormsService` scaffold + Contact + Newsletter writes

**Files:**
- Create: `src/services/WebFormsService.js`
- Create: `src/routes/web-forms.js`
- Modify: `src/routes/web.js` (mount with `authenticateApiKey`)
- Test: `tests/services/WebFormsService.test.js`
- Test: `tests/routes/web-forms.test.js`

**Interfaces:**
- Produces: `WebFormsService.submitContact(data)`, `WebFormsService.submitNewsletterSignup(data)`.
- Produces: `POST /web/forms/contact` (auth required) → `201`, `POST /web/forms/newsletter` (auth required) → `201` or `200` if already subscribed.

- [ ] **Step 1: Write the failing service test**

```js
// tests/services/WebFormsService.test.js
jest.mock('@supabase/supabase-js');
const { createClient } = require('@supabase/supabase-js');

describe('WebFormsService.submitContact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('inserts into site_contact_submissions', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    const result = await service.submitContact({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      subject: 'Question',
      message: 'Hello',
    });

    expect(from).toHaveBeenCalledWith('site_contact_submissions');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ email: 'jane@example.com', status: 'new' }),
    ]);
    expect(result).toEqual({ id: '1' });
  });
});

describe('WebFormsService.submitNewsletterSignup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns the existing row instead of inserting a duplicate', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'existing', email: 'jane@example.com' }, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    const result = await service.submitNewsletterSignup({ email: 'jane@example.com' });

    expect(result).toEqual({ id: 'existing', email: 'jane@example.com', already_subscribed: true });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/services/WebFormsService.test.js`
Expected: FAIL — `Cannot find module '../../src/services/WebFormsService'`

- [ ] **Step 3: Write the service**

```js
// src/services/WebFormsService.js
const { createClient } = require('@supabase/supabase-js');

class WebFormsService {
  constructor() {
    this.supabase = createClient(
      process.env.COFABRI_SUPABASE_URL,
      process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async submitContact({ first_name, last_name, email, subject, message, language_preference }) {
    const { data, error } = await this.supabase
      .from('site_contact_submissions')
      .insert([{
        first_name,
        last_name,
        email,
        subject,
        message,
        language_preference: language_preference || null,
        status: 'new',
      }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async submitNewsletterSignup({ email, first_name, last_name }) {
    const { data: existing, error: lookupError } = await this.supabase
      .from('site_newsletter_signups')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing) {
      return { ...existing, already_subscribed: true };
    }

    const { data, error } = await this.supabase
      .from('site_newsletter_signups')
      .insert([{
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
        source: 'website',
        status: 'pending',
        email_verification: 'unverified',
        signup_date: new Date().toISOString(),
      }])
      .select();
    if (error) throw error;
    return data[0];
  }
}

module.exports = WebFormsService;
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npx jest tests/services/WebFormsService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route test**

```js
// tests/routes/web-forms.test.js
const request = require('supertest');
const express = require('express');

jest.mock('../../src/services/WebFormsService');
const WebFormsService = require('../../src/services/WebFormsService');
const { authenticateApiKey } = require('../../src/middleware/auth');

describe('POST /web/forms/contact', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY_SECRET = 'test-secret';
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);
  });

  it('rejects requests without a valid API key', async () => {
    const res = await request(app).post('/web/forms/contact').send({ email: 'jane@example.com' });
    expect(res.status).toBe(401);
  });

  it('inserts a valid submission and returns 201', async () => {
    WebFormsService.mockImplementation(() => ({
      submitContact: jest.fn().mockResolvedValue({ id: '1' }),
    }));

    const res = await request(app)
      .post('/web/forms/contact')
      .set('Authorization', 'Bearer test-secret')
      .send({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', subject: 'Hi', message: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: '1' });
  });

  it('rejects a submission missing a required field', async () => {
    const res = await request(app)
      .post('/web/forms/contact')
      .set('Authorization', 'Bearer test-secret')
      .send({ first_name: 'Jane' });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest tests/routes/web-forms.test.js`
Expected: FAIL — `Cannot find module '../../src/routes/web-forms'`

- [ ] **Step 7: Write the route**

```js
// src/routes/web-forms.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const WebFormsService = require('../services/WebFormsService');

const router = express.Router();
const service = new WebFormsService();

router.post(
  '/contact',
  [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('email').isEmail(),
    body('subject').notEmpty(),
    body('message').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const submission = await service.submitContact(req.body);
      res.status(201).json(submission);
    } catch (error) {
      console.error('POST /web/forms/contact error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit contact form' });
    }
  }
);

router.post(
  '/newsletter',
  [body('email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const result = await service.submitNewsletterSignup(req.body);
      res.status(result.already_subscribed ? 200 : 201).json(result);
    } catch (error) {
      console.error('POST /web/forms/newsletter error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit newsletter signup' });
    }
  }
);

module.exports = router;
```

- [ ] **Step 8: Mount the router with auth**

In `src/routes/web.js`:

```js
const formsRoutes = require('./web-forms');
const { authenticateApiKey } = require('../middleware/auth');
// ...
router.use('/forms', authenticateApiKey, formsRoutes);
```

- [ ] **Step 9: Run both test files to verify they pass**

Run: `npx jest tests/services/WebFormsService.test.js tests/routes/web-forms.test.js`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/services/WebFormsService.js src/routes/web-forms.js src/routes/web.js tests/services/WebFormsService.test.js tests/routes/web-forms.test.js
git commit -m "feat: add WebFormsService and contact/newsletter write endpoints"
```

---

## Task 11: cofabri-api — Support + Waitlist write endpoints

**Files:**
- Modify: `src/services/WebFormsService.js`, `src/routes/web-forms.js`
- Modify: `tests/services/WebFormsService.test.js`, `tests/routes/web-forms.test.js`

**Interfaces:**
- Produces: `submitSupportTicket(data)`, `submitWaitlistSignup(data)`, `POST /web/forms/support`, `POST /web/forms/waitlist`.

- [ ] **Step 1: Write the failing service tests**

```js
// append to tests/services/WebFormsService.test.js
describe('WebFormsService.submitSupportTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('inserts a customer_ticket with no public_status', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitSupportTicket({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      subject: 'Ticket subject',
      description: 'Details',
      app_id: 'medoura',
      subject_type: 'support_help',
      preferred_contact_method: 'email',
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'customer_ticket', public_status: null, status: 'new' }),
    ]);
  });
});

describe('WebFormsService.submitWaitlistSignup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('inserts into site_beta with type waitlist', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitWaitlistSignup({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      app_id: 'medoura',
      interest_level: 5,
    });

    expect(from).toHaveBeenCalledWith('site_beta');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'waitlist', status: 'new' }),
    ]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest tests/services/WebFormsService.test.js -t "submitSupportTicket|submitWaitlistSignup"`
Expected: FAIL — not functions

- [ ] **Step 3: Add the methods**

```js
// add inside the WebFormsService class
  async submitSupportTicket({
    first_name, last_name, email, subject, description, app_id,
    subject_type, preferred_contact_method, company_organization, language_preference,
  }) {
    const { data, error } = await this.supabase
      .from('support_cases')
      .insert([{
        first_name,
        last_name,
        email,
        subject,
        description,
        app_id: app_id || null,
        subject_type: subject_type || null,
        preferred_contact_method: preferred_contact_method || null,
        company_organization: company_organization || null,
        language_preference: language_preference || null,
        type: 'customer_ticket',
        public_status: null,
        priority: 'medium',
        status: 'new',
      }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async submitWaitlistSignup({ first_name, last_name, email, app_id, interest_level }) {
    const { data, error } = await this.supabase
      .from('site_beta')
      .insert([{
        type: 'waitlist',
        first_name,
        last_name,
        email,
        app_id: app_id || null,
        interest_level: interest_level || null,
        status: 'new',
      }])
      .select();
    if (error) throw error;
    return data[0];
  }
```

- [ ] **Step 4: Run the service tests to verify they pass**

Run: `npx jest tests/services/WebFormsService.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing route tests**

```js
// append to tests/routes/web-forms.test.js
describe('POST /web/forms/support', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY_SECRET = 'test-secret';
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);
  });

  it('inserts a valid ticket and returns 201', async () => {
    WebFormsService.mockImplementation(() => ({
      submitSupportTicket: jest.fn().mockResolvedValue({ id: '1' }),
    }));

    const res = await request(app)
      .post('/web/forms/support')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
        subject: 'Help', description: 'Details',
      });

    expect(res.status).toBe(201);
  });
});

describe('POST /web/forms/waitlist', () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY_SECRET = 'test-secret';
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);
  });

  it('inserts a valid signup and returns 201', async () => {
    WebFormsService.mockImplementation(() => ({
      submitWaitlistSignup: jest.fn().mockResolvedValue({ id: '1' }),
    }));

    const res = await request(app)
      .post('/web/forms/waitlist')
      .set('Authorization', 'Bearer test-secret')
      .send({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' });

    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx jest tests/routes/web-forms.test.js -t "support|waitlist"`
Expected: FAIL — 404

- [ ] **Step 7: Add the routes**

```js
// add to src/routes/web-forms.js, before module.exports
router.post(
  '/support',
  [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('email').isEmail(),
    body('subject').notEmpty(),
    body('description').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const ticket = await service.submitSupportTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('POST /web/forms/support error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit support ticket' });
    }
  }
);

router.post(
  '/waitlist',
  [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('email').isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const signup = await service.submitWaitlistSignup(req.body);
      res.status(201).json(signup);
    } catch (error) {
      console.error('POST /web/forms/waitlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit waitlist signup' });
    }
  }
);
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx jest tests/services/WebFormsService.test.js tests/routes/web-forms.test.js`
Expected: PASS — full write-side suite green

- [ ] **Step 9: Run the full cofabri-api test suite to check for regressions**

Run: `npx jest`
Expected: PASS (all suites, including previously-existing ones)

- [ ] **Step 10: Commit**

```bash
git add src/services/WebFormsService.js src/routes/web-forms.js tests/services/WebFormsService.test.js tests/routes/web-forms.test.js
git commit -m "feat: add support ticket and waitlist write endpoints"
```

---

## Task 12: cofabri-website — `api-client.ts` scaffold + Apps functions

**Files:**
- Create: `src/lib/api-client.ts`
- Modify: `.env.local` (add `COFABRI_API_BASE_URL`, documented — do not commit real secrets)

**Interfaces:**
- Produces: `apiFetch<T>(path, init?)`, `getApps(): Promise<App[]>`, `getApp(appId: string): Promise<App | null>` (new — `airtable.ts` never had a single-app getter; the current `apps/[id]/route.ts` fetched inline).
- Reuses the exact `App` interface shape from `src/lib/airtable.ts` (same field names) so every consumer keeps working unchanged.

- [ ] **Step 1: Add the env var**

Add to `.env.local` (and note in `README.md`'s env section if one exists):

```
COFABRI_API_BASE_URL=http://localhost:3000
```

- [ ] **Step 2: Write `api-client.ts`**

```ts
// src/lib/api-client.ts
const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${COFABRI_API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`cofabri-api error on ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface App {
  id: string;
  name: string;
  description?: string;
  url?: string;
  screenshot?: string;
  faviconUrl?: string;
  status: string;
  category?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  launchDate?: string;
  releaseDate?: string;
  domains?: string;
  featureOnWebsite?: boolean;
}

interface AppRow {
  app_id: string;
  app_name: string;
  high_level_description: string | null;
  app_url: string | null;
  screenshot_url: string | null;
  favicon_url: string | null;
  lifecycle_stage: string | null;
  category: string | null;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  launch_date: string | null;
  latest_release_date: string | null;
  featured_app: boolean;
  beta_statements?: unknown[];
}

function mapApp(row: AppRow): App {
  return {
    id: row.app_id,
    name: row.app_name,
    description: row.high_level_description || 'No description available',
    url: row.app_url || undefined,
    screenshot: row.screenshot_url || '/images/placeholder.jpg',
    faviconUrl: row.favicon_url || undefined,
    status: row.lifecycle_stage || 'Live',
    category: row.category || undefined,
    feature1: row.feature_1 || undefined,
    feature2: row.feature_2 || undefined,
    feature3: row.feature_3 || undefined,
    launchDate: row.launch_date || undefined,
    releaseDate: row.latest_release_date || undefined,
    domains: undefined,
    featureOnWebsite: row.featured_app,
  };
}

export async function getApps(): Promise<App[]> {
  try {
    const rows = await apiFetch<AppRow[]>('/web/content/apps');
    return rows.map(mapApp);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return [];
  }
}

export async function getApp(appId: string): Promise<App | null> {
  try {
    const row = await apiFetch<AppRow>(`/web/content/apps/${encodeURIComponent(appId)}`);
    return mapApp(row);
  } catch (error) {
    console.error(`Error fetching app ${appId}:`, error);
    return null;
  }
}
```

- [ ] **Step 3: Manually verify**

Start cofabri-api locally (`npm run dev` in cofabri-api, default port 3000) and cofabri-website (`npm run dev`, e.g. port 3001) with `COFABRI_API_BASE_URL=http://localhost:3000` set. In a Node REPL or a scratch script in cofabri-website:

```bash
node -e "
process.env.COFABRI_API_BASE_URL = 'http://localhost:3000';
require('ts-node/register');
require('./src/lib/api-client').getApps().then(apps => console.log(apps.length, apps[0]));
"
```

(If `ts-node` isn't installed, instead temporarily add a throwaway `/api/debug-apps` route calling `getApps()` and hit it with `curl`, then delete the route.) Expect a non-empty array with real app names.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-client.ts .env.local.example 2>/dev/null; git add src/lib/api-client.ts
git commit -m "feat: add api-client.ts with apps functions, mirroring airtable.ts App interface"
```

---

## Task 13: cofabri-website — `api-client.ts` Knowledge Base functions

**Files:**
- Modify: `src/lib/api-client.ts`

**Interfaces:**
- Produces: `getKnowledgeBaseArticles()`, `getKnowledgeBaseArticle(slug)`, `getKnowledgeBaseArticlesBySlugs(slugs)`, `getFeaturedKnowledgeBaseArticles()` — same names/shapes as `airtable.ts`.

- [ ] **Step 1: Add the interface, row type, and mapper**

```ts
// add to src/lib/api-client.ts
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  slug: string;
  author: string;
  readTime: number;
  publishedAt: string;
  lastUpdated?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  applications?: string[];
  logoUrl?: string;
  relatedTopics?: string[] | string;
}

interface KbArticleRow {
  id: string;
  article_title: string;
  article_content: string | null;
  excerpt: string | null;
  category: string;
  site_url_slug: string | null;
  author_name: string | null;
  read_time: number | null;
  last_updated: string | null;
  is_popular: boolean | null;
  is_featured: boolean | null;
  tags: string[] | null;
  logo_url: string | null;
}

function mapKbArticle(row: KbArticleRow): KnowledgeBaseArticle {
  return {
    id: row.id,
    title: row.article_title,
    content: row.article_content || '',
    excerpt: row.excerpt || undefined,
    category: row.category,
    slug: row.site_url_slug || row.id,
    author: row.author_name || '',
    readTime: row.read_time || 0,
    publishedAt: row.last_updated || '',
    lastUpdated: row.last_updated || undefined,
    isPopular: row.is_popular || undefined,
    isFeatured: row.is_featured || undefined,
    tags: row.tags || [],
    applications: [],
    logoUrl: row.logo_url || undefined,
  };
}
```

- [ ] **Step 2: Add the functions**

```ts
// add to src/lib/api-client.ts
export async function getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const rows = await apiFetch<KbArticleRow[]>('/web/content/knowledge-base');
    return rows.map(mapKbArticle);
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return [];
  }
}

export async function getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
  try {
    const row = await apiFetch<KbArticleRow>(`/web/content/knowledge-base/${encodeURIComponent(slug)}`);
    return mapKbArticle(row);
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return null;
  }
}

export async function getKnowledgeBaseArticlesBySlugs(slugs: string[]): Promise<KnowledgeBaseArticle[]> {
  if (slugs.length === 0) return [];
  const all = await getKnowledgeBaseArticles();
  const slugSet = new Set(slugs);
  return all.filter((article) => slugSet.has(article.slug));
}

export async function getFeaturedKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const rows = await apiFetch<KbArticleRow[]>('/web/content/knowledge-base?featured=true');
    return rows.slice(0, 6).map(mapKbArticle);
  } catch (error) {
    console.error('Error fetching featured knowledge base articles:', error);
    return [];
  }
}
```

- [ ] **Step 3: Manually verify**

With both dev servers running, `curl http://localhost:3000/web/content/knowledge-base?featured=true` — expect JSON array of published articles. Add a throwaway debug route in the website calling `getKnowledgeBaseArticle('<a-real-site_url_slug-from-the-curl-output>')`, confirm it returns the matching article, then delete the debug route.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add knowledge base functions to api-client.ts"
```

---

## Task 14: cofabri-website — `api-client.ts` Roadmap function

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add the interface, row type, mapper, and function**

```ts
// add to src/lib/api-client.ts
export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
  status: string;
  milestone: string;
  releaseType: string;
  releasedDate?: string;
  application?: string;
  applicationUrl?: string;
  featuresAndChanges?: string;
  releaseNotes?: string;
}

interface RoadmapRow {
  id: string;
  roadmap_item_name: string;
  description: string | null;
  status: string;
  target_quarter: string | null;
  target_date: string | null;
  app_id: string | null;
}

function mapRoadmapItem(row: RoadmapRow): RoadmapFeature {
  return {
    id: row.id,
    name: row.roadmap_item_name,
    description: row.description || '',
    status: row.status,
    milestone: row.target_quarter || '',
    releaseType: '',
    releasedDate: row.target_date || undefined,
    application: row.app_id || undefined,
    applicationUrl: undefined,
    featuresAndChanges: undefined,
    releaseNotes: undefined,
  };
}

export async function getRoadmapFeatures(): Promise<RoadmapFeature[]> {
  try {
    const rows = await apiFetch<RoadmapRow[]>('/web/content/roadmap');
    return rows.map(mapRoadmapItem);
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    return [];
  }
}
```

- [ ] **Step 2: Manually verify**

`curl http://localhost:3000/web/content/roadmap` after Task 2's backfill — expect 8 items. Confirm `getRoadmapFeatures()` returns 8 mapped objects via a throwaway debug route, then delete it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add roadmap function to api-client.ts"
```

---

## Task 15: cofabri-website — `api-client.ts` Legal document functions

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add the interface, row type, mapper, and functions**

```ts
// add to src/lib/api-client.ts
export interface LegalDocument {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  status: string;
  version: string;
  lastUpdated: string;
  documentUrl?: string;
  associatedApp?: string;
  category?: string;
  isPublic: boolean;
  tags?: string[];
}

interface LegalDocRow {
  id: string;
  document_name: string | null;
  title: string;
  document_type: string;
  status: string;
  version: number | null;
  last_updated: string | null;
  effective_date: string | null;
}

function mapLegalDocument(row: LegalDocRow): LegalDocument {
  return {
    id: row.id,
    title: row.title || row.document_name || 'Untitled Document',
    description: undefined,
    documentType: row.document_type,
    status: row.status,
    version: String(row.version ?? '1.0'),
    lastUpdated: row.last_updated || row.effective_date || new Date().toISOString(),
    documentUrl: undefined,
    associatedApp: undefined,
    category: undefined,
    isPublic: true,
    tags: [],
  };
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const rows = await apiFetch<LegalDocRow[]>('/web/content/legal');
    return rows.map(mapLegalDocument);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return [];
  }
}

export async function getLegalDocument(id: string): Promise<LegalDocument | null> {
  try {
    const row = await apiFetch<LegalDocRow>(`/web/content/legal/${encodeURIComponent(id)}`);
    return mapLegalDocument(row);
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return null;
  }
}
```

Note: `documentUrl` (the attachment link) is intentionally left `undefined` here — the source `kb_contracts` row has no direct file URL (attachments live in `kb_contract_attachments` as Supabase Storage paths). If the legal page needs the actual document download, that's follow-up work: extend `WebContentService.getLegalDocumentById` to join `kb_contract_attachments` and build a public/signed URL the same way Task 3 does for app screenshots, then set `documentUrl` here. Flagging rather than guessing since `kb_contract_attachments.storage_path` bucket/visibility wasn't confirmed during planning.

- [ ] **Step 2: Manually verify**

`curl http://localhost:3000/web/content/legal` — expect 13 documents. Verify `getLegalDocuments()` maps them via a throwaway debug route, then delete it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add legal document functions to api-client.ts"
```

---

## Task 16: cofabri-website — `api-client.ts` Testimonials function

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add the interface, row type, mapper, and function**

```ts
// add to src/lib/api-client.ts
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  image: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  apps: string[];
  featured: boolean;
}

interface TestimonialRow {
  id: string;
  name: string;
  role_position: string | null;
  company: string | null;
  content: string | null;
  rating: number | null;
  profile_image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

function mapTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role_position || '',
    company: row.company || '',
    content: row.content || '',
    rating: row.rating || 0,
    image: row.profile_image_url || '/images/placeholder.jpg',
    isActive: row.is_active,
    order: 0,
    createdAt: row.created_at,
    apps: [],
    featured: row.is_featured,
  };
}

export async function getTestimonials(randomCount?: number): Promise<Testimonial[]> {
  try {
    const rows = await apiFetch<TestimonialRow[]>('/web/content/testimonials');
    const testimonials = rows.map(mapTestimonial);

    if (randomCount && randomCount > 0) {
      const featured = testimonials.filter((t) => t.featured);
      const nonFeatured = testimonials.filter((t) => !t.featured);
      const shuffle = (arr: Testimonial[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      const shuffledFeatured = shuffle([...featured]);
      const shuffledNonFeatured = shuffle([...nonFeatured]);
      if (shuffledFeatured.length >= randomCount) {
        return shuffledFeatured.slice(0, randomCount);
      }
      return [...shuffledFeatured, ...shuffledNonFeatured].slice(0, randomCount);
    }

    return testimonials;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}
```

- [ ] **Step 2: Manually verify**

`curl http://localhost:3000/web/content/testimonials` — expect 6 active testimonials. Verify via throwaway debug route, delete it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add testimonials function to api-client.ts"
```

---

## Task 17: cofabri-website — `api-client.ts` Banners + Marketing Popup functions

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add interfaces, row types, mappers, and functions**

```ts
// add to src/lib/api-client.ts
export interface Banner {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  linkText?: string;
  backgroundColor: string;
  textColor: string;
  priority: number;
}

interface BannerRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  priority: number;
}

function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    message: row.message || '',
    type: row.type,
    linkUrl: row.link_url || undefined,
    linkText: row.link_text || undefined,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    priority: row.priority,
  };
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const rows = await apiFetch<BannerRow[]>('/web/content/banners');
    return rows.map(mapBanner);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

export interface MarketingPopupConfig {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  position: 'Center' | 'Bottom Right' | 'Bottom Left';
  delay: number;
  isEnabled: boolean;
}

interface MarketingPopupRow {
  title: string;
  content: string | null;
  button_text: string | null;
  button_link: string | null;
  background_color: string;
  text_color: string;
  button_color: string;
  position: 'center' | 'bottom_right' | 'bottom_left';
  delay: number;
}

const POSITION_MAP: Record<MarketingPopupRow['position'], MarketingPopupConfig['position']> = {
  center: 'Center',
  bottom_right: 'Bottom Right',
  bottom_left: 'Bottom Left',
};

export async function getMarketingPopupConfig(): Promise<MarketingPopupConfig | null> {
  try {
    const row = await apiFetch<MarketingPopupRow | null>('/web/content/marketing-popups');
    if (!row) return null;
    return {
      title: row.title,
      content: row.content || '',
      buttonText: row.button_text || '',
      buttonLink: row.button_link || '/',
      backgroundColor: row.background_color,
      textColor: row.text_color,
      buttonColor: row.button_color,
      position: POSITION_MAP[row.position] || 'Center',
      delay: (row.delay || 0) * 1000,
      isEnabled: true,
    };
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return null;
  }
}
```

- [ ] **Step 2: Manually verify**

`curl http://localhost:3000/web/content/banners` and `curl http://localhost:3000/web/content/marketing-popups` — expect 1 banner, `null` popup (confirmed empty). Verify both functions via a throwaway debug route, delete it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add banners and marketing popup functions to api-client.ts"
```

---

## Task 18: cofabri-website — `api-client.ts` Status function

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add the interface, row type, mapper, and function**

```ts
// add to src/lib/api-client.ts
export interface SystemStatus {
  ticketId: string;
  title: string;
  publicStatus: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  'Created Date': string;
  'Updated At': string;
  'Resolved Date': string;
  affectedServices: string[];
  application?: string;
  updates?: string;
}

interface SupportCaseRow {
  issue_ticket_id: string | null;
  subject: string;
  public_status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string | null;
  created_at: string;
  updated_at: string;
  resolved_date: string | null;
  affected_services: string[] | null;
  app_id: string | null;
  updates: string | null;
}

const PUBLIC_STATUS_MAP: Record<SupportCaseRow['public_status'], SystemStatus['publicStatus']> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

const SEVERITY_MAP: Record<SupportCaseRow['severity'], SystemStatus['severity']> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function mapSystemStatus(row: SupportCaseRow): SystemStatus {
  const publicStatus = PUBLIC_STATUS_MAP[row.public_status] || 'Monitoring';
  return {
    ticketId: row.issue_ticket_id || `TICKET-${Date.now()}`,
    title: row.subject,
    publicStatus,
    severity: SEVERITY_MAP[row.severity] || 'Medium',
    message: row.message || `We are currently ${publicStatus.toLowerCase()} a system issue.`,
    'Created Date': row.created_at,
    'Updated At': row.updated_at,
    'Resolved Date': row.resolved_date || '',
    affectedServices: row.affected_services || [],
    application: row.app_id || 'CoFabri System',
    updates: row.updates || '',
  };
}

export async function getSystemStatus(appId?: string): Promise<SystemStatus[]> {
  try {
    const path = appId ? `/web/content/status/${encodeURIComponent(appId)}` : '/web/content/status';
    const rows = await apiFetch<SupportCaseRow[]>(path);
    return rows.map(mapSystemStatus);
  } catch (error) {
    console.error('Error fetching system status:', error);
    return [];
  }
}
```

- [ ] **Step 2: Manually verify**

`curl http://localhost:3000/web/content/status` — expect `[]` (confirmed no active public incidents today). Verify `getSystemStatus()` returns `[]` without throwing, via a throwaway debug route, then delete it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add status function to api-client.ts"
```

---

## Task 19: cofabri-website — wire every consumer to `api-client.ts`, delete `lib/airtable.ts`

Mechanical pass: every file below currently imports from `@/lib/airtable`. Since `api-client.ts` exports the same function names and interfaces, each file needs only its import line changed — no other code changes. The two apps routes have inline `fetchFromAirtable` duplication that gets replaced with real calls instead.

**Files (modify import only, verify each still renders correctly):**
- `src/app/api/apps/route.ts` — replace inline Airtable fetch with `import { getApps } from '@/lib/api-client'`
- `src/app/api/apps/[id]/route.ts` — replace inline Airtable fetch with `import { getApp } from '@/lib/api-client'`
- `src/app/api/banners/route.ts` — `import { getBanners } from '@/lib/api-client'`
- `src/app/api/knowledge-base/route.ts` — swap import
- `src/app/api/knowledge-base/[slug]/route.ts` — swap import
- `src/app/api/legal/route.ts` — swap import
- `src/app/api/legal/[id]/route.ts` — swap import
- `src/app/api/marketing-popup/route.ts` — swap import
- `src/app/api/roadmaps/route.ts` — swap import
- `src/app/api/status-widget/route.ts` — swap import
- `src/app/api/status/[app]/route.ts` — swap import
- `src/app/api/status/route.ts` — swap import
- `src/app/api/testimonials/route.ts` — swap import
- `src/app/knowledge-base/KnowledgeBaseContent.tsx` — swap import
- `src/app/knowledge-base/[slug]/ArticleContent.tsx` — swap import
- `src/app/knowledge-base/[slug]/metadata.ts` — swap import
- `src/app/knowledge-base/[slug]/page.tsx` — swap import
- `src/app/legal/LegalDocumentsContent.tsx` — swap import
- `src/app/roadmaps/RoadmapsContent.tsx` — swap import
- `src/app/status/page.tsx` — swap import
- `src/components/MarketingPopupWrapper.tsx` — swap import
- `src/components/ui/AppCard.tsx` — swap import (type-only import likely; verify)
- `src/components/ui/AppPreviewCard.tsx` — swap import
- `src/components/ui/Apps.tsx` — swap import
- `src/components/ui/AppsCelebration.tsx` — swap import
- `src/components/ui/AppsScrollCelebration.tsx` — swap import
- `src/components/ui/CompactRoadmap.tsx` — swap import
- `src/components/ui/FeaturedApp.tsx` — swap import
- `src/components/ui/HomepageApps.tsx` — swap import
- `src/components/ui/KnowledgeBase.tsx` — swap import
- `src/components/ui/KnowledgeBaseContent.tsx` — swap import
- `src/components/ui/KnowledgeBaseSearch.tsx` — swap import
- `src/components/ui/ProductRoadmap.tsx` — swap import
- `src/components/ui/StatusIndicator.tsx` — swap import
- `src/components/ui/StatusPageContent.tsx` — swap import
- `src/components/ui/Testimonials.tsx` — swap import
- `src/components/ui/AirtableFormLoader.tsx` — **do not touch** (this loads an embedded Airtable *form widget* for something unrelated to content reads/writes — check its content in Step 1 before deciding; if it really is an unrelated embedded-form component, leave it and flag to the user rather than guessing it's in scope)
- Delete: `src/lib/airtable.ts`

- [ ] **Step 1: Read `AirtableFormLoader.tsx` and confirm it's out of scope**

Read the file. If it embeds an Airtable form (e.g. via iframe/script for a specific one-off form, not the general Knowledge Base/Apps/etc. content), leave it untouched and note it in the final report as a deliberate exception. If it turns out to actually call `lib/airtable.ts` for the content types this plan covers, treat it like the other files below instead.

- [ ] **Step 2: For each file in the list, replace the import**

For files with `import { X, Y } from '@/lib/airtable'` or `from '@/lib/airtable'`, change to `from '@/lib/api-client'` (same named imports — no other line changes needed since names match). For `src/app/api/apps/route.ts` and `apps/[id]/route.ts`, delete the inline `fetchFromAirtable` block and replace the handler body's data-fetching call with `getApps()` / `getApp(params.id)` from the new client, keeping the rest of the response-shaping logic (headers, status codes) as-is.

Do this one file at a time; after each file, run `npm run build` (or at minimum `npx tsc --noEmit`) to catch a broken import immediately rather than batching all 25 changes before checking.

- [ ] **Step 3: Delete `src/lib/airtable.ts`**

```bash
rm src/lib/airtable.ts
```

- [ ] **Step 4: Full type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `@/lib/airtable` or missing exports.

- [ ] **Step 5: Start the dev server and manually walk every affected page**

Run: `npm run dev`, then visit and visually verify each renders real content (not empty/error states): `/`, `/apps`, `/apps/<a-real-app_id>`, `/knowledge-base`, `/knowledge-base/<a-real-slug>`, `/legal`, `/roadmaps`, `/status`, and confirm the marketing popup and any active banner still render site-wide.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: point all content consumers at api-client.ts, remove lib/airtable.ts"
```

---

## Task 20: cofabri-website — form routes proxy to cofabri-api

**Files:**
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/api/newsletter/route.ts`
- Modify: `src/app/api/support/route.ts`
- Modify: `src/app/api/signup/route.ts` (the marketing waitlist form — confirm in Step 1 it's the waitlist, not account provisioning, before changing it)
- Modify: `.env.local` (add `COFABRI_API_KEY`)

**Interfaces:**
- Consumes: `POST {COFABRI_API_BASE_URL}/web/forms/{contact,newsletter,support,waitlist}` with `Authorization: Bearer {COFABRI_API_KEY}`.

- [ ] **Step 1: Read each existing route file**

Read `src/app/api/contact/route.ts`, `newsletter/route.ts`, `support/route.ts`, `signup/route.ts` in full. Note: (a) what Turnstile/validation logic each already has — **keep that logic unchanged**, only replace the final "write to Airtable" call; (b) the exact request body shape the frontend form already sends, so the proxy forwards the right fields.

- [ ] **Step 2: Add the env var**

Add to `.env.local`:

```
COFABRI_API_KEY=<value matching cofabri-api's API_KEY_SECRET>
```

- [ ] **Step 3: Replace the Airtable write in each route with a proxy call**

In each of the four files, after existing Turnstile verification and request validation succeed, replace the Airtable write with:

```ts
const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/contact`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
  },
  body: JSON.stringify({
    first_name: firstName,
    last_name: lastName,
    email,
    subject,
    message,
  }),
});

if (!apiRes.ok) {
  const errorBody = await apiRes.json().catch(() => null);
  console.error('cofabri-api contact submission failed:', apiRes.status, errorBody);
  return NextResponse.json({ error: 'Failed to submit form' }, { status: 502 });
}
```

(Adjust the URL path — `/web/forms/contact`, `/web/forms/newsletter`, `/web/forms/support`, `/web/forms/waitlist` — and the body fields to match each route's actual variable names from Step 1, and each corresponding write endpoint's expected fields from Tasks 10–11.)

- [ ] **Step 4: Manually verify each form end-to-end**

With both dev servers running and real Turnstile test keys configured, submit each of the 4 forms through the actual UI. After each submission, query Supabase directly to confirm the row landed:

```sql
select * from site_contact_submissions order by created_at desc limit 1;
select * from site_newsletter_signups order by created_at desc limit 1;
select * from support_cases where type = 'customer_ticket' order by created_at desc limit 1;
select * from site_beta where type = 'waitlist' order by created_at desc limit 1;
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/contact/route.ts src/app/api/newsletter/route.ts src/app/api/support/route.ts src/app/api/signup/route.ts .env.local
git commit -m "refactor: proxy contact/newsletter/support/waitlist forms to cofabri-api"
```

---

## Task 21: cofabri-website — preview route rework (slug/UUID, not Airtable record IDs)

**Files:**
- Modify: `src/app/api/preview/[type]/[id]/route.ts`
- Modify: `src/app/preview/[type]/[id]/page.tsx`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Read all three files in full**

Understand the current `rec`-ID-keyed lookup per `type` (`kb`, `apps`, `roadmap`, `status`, `marketing`/`popup`, `banner`, `testimonial`, `legal`), and exactly how `middleware.ts` special-cases `/preview/*rec*`.

- [ ] **Step 2: Update the preview route's lookup to use `api-client.ts` functions**

Replace each `type`'s Airtable-record-ID lookup with the matching `api-client.ts` function and identifier:
- `kb` → `getKnowledgeBaseArticle(slug)` (slug, not UUID)
- `apps` → `getApp(appId)` (app_id slug, not UUID)
- `roadmap` → fetch via `getRoadmapFeatures()` and find by `id` (UUID) — no single-item getter exists; filter client-side since roadmap has no dedicated single-item endpoint (data volume is small — 8 items)
- `legal` → `getLegalDocument(id)` (UUID)
- `testimonial` → fetch via `getTestimonials()` and find by `id` (UUID)
- `banner` → fetch via `getBanners()` and find by `id` (UUID)
- `marketing`/`popup` → `getMarketingPopupConfig()` (singleton, no ID needed)

Keep the existing password-gate/session logic in this file untouched — only the data-lookup-by-id logic changes.

- [ ] **Step 3: Update `middleware.ts`**

Remove the `rec`-pattern-specific matching for `/preview/*` paths; the route now accepts slugs and UUIDs, so the middleware's gate should apply to all `/preview/[type]/[id]` paths generically rather than pattern-matching an Airtable ID shape.

- [ ] **Step 4: Manually verify**

Start the dev server, visit `/preview/kb/<a-real-site_url_slug>`, `/preview/apps/<a-real-app_id>`, and one UUID-keyed type (e.g. `/preview/testimonial/<a-real-testimonial-uuid>`, found via `curl http://localhost:3000/web/content/testimonials`). Confirm the password gate still triggers and, once passed, the correct content renders.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preview/\[type\]/\[id\]/route.ts src/app/preview/\[type\]/\[id\]/page.tsx src/middleware.ts
git commit -m "refactor: rework preview system to use slugs/UUIDs instead of Airtable record IDs"
```

---

## Task 22: cofabri-website — final cleanup and Airtable removal

**Files:**
- Modify: `package.json` (remove `airtable` dependency)
- Modify: `AIRTABLE_FORM_PERFORMANCE.md` (either delete or add a note that it's historical — user's call, don't delete without asking)

- [ ] **Step 1: Remove the npm dependency**

```bash
npm uninstall airtable
```

- [ ] **Step 2: Grep for any remaining Airtable references**

```bash
grep -ril "airtable" src/
```

Expected: no results. If `AirtableFormLoader.tsx` still exists (kept deliberately per Task 19 Step 1), confirm it's the only hit and it's the intentional exception — do not delete it without the user's confirmation that it's safe to remove.

- [ ] **Step 3: Full build**

```bash
npm run build
```

Expected: succeeds with no errors.

- [ ] **Step 4: Remove the now-unused Airtable env vars from `.env.local`**

Remove `AIRTABLE_PERSONAL_ACCESS_TOKEN` and `AIRTABLE_BASE_ID` if nothing else in the repo still reads them (confirmed by Step 2's grep).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: remove airtable dependency now that the website is fully Supabase-backed"
```

- [ ] **Step 6: Report to the user**

Summarize what shipped, and explicitly flag the two items this plan deferred rather than guessed at:
1. `LegalDocument.documentUrl` is currently always `undefined` (Task 15) — the actual PDF/file link needs `kb_contract_attachments` wired in as a follow-up.
2. `apps.lifecycle_stage` (Task 1) is a new, empty column — every app will show as "Live" by default (api-client.ts's fallback) until someone sets real values per app, either directly in Supabase or once cofabri-core grows an edit UI for it.
