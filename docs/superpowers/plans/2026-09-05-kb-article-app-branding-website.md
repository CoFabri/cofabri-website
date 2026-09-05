# KB Article App Branding — cofabri-website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a KB article links to exactly one app, replace the sidebar "Application" row's
plain text with a small clickable branding chip (favicon + app name, linking to the app). For 0 or
2+ linked apps, keep today's exact plain-text behavior.

**Architecture:** Extend `api-client.ts`'s KB article mapping to carry a richer `LinkedApp[]` type
instead of plain name strings. Extend the `meta` array's row shape with an optional `node` override
so the "Application" row can render a rich chip only in the single-app case, with every other row
untouched.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4 (design-token utilities), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-05-kb-article-app-branding-design.md` (cofabri-core repo)

## Global Constraints

- This is repo 3 of 3 for this feature. Do not consider Task 2 done until cofabri-api's plan
  (`cofabri-api/docs/superpowers/plans/2026-09-05-kb-article-app-branding-api.md`) has shipped —
  the `applications` field shape this task consumes doesn't exist until then. Task 1
  (`api-client.ts` mapping) is independently testable via mocked `fetch` and can be built in
  parallel with cofabri-api's implementation, same as was done for the author-bios feature.
- Never emit an `<a>` tag with a missing/undefined `href` — when the single linked app has no
  `appUrl`, render the same chip as a non-clickable `<span>` instead.
- No new prominent block in the main article column — this only touches the existing sidebar
  "Application" row. Every other `meta` row (Category, Author, Published, Last updated, Read time)
  must render exactly as it does today.
- `kb_articles.logo_url` (rendered elsewhere on this page as `article.logoUrl`) is untouched by
  this plan — unrelated field, do not reference it.

---

### Task 1: Extend api-client.ts with `LinkedApp`

**Files:**
- Modify: `src/lib/api-client.ts`
- Test: `src/lib/api-client.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface LinkedApp {
    id: string
    name: string
    faviconUrl?: string
    appUrl?: string
  }
  ```
  `KnowledgeBaseArticle.applications` changes from `string[] | undefined` to `LinkedApp[]`
  (always an array, never undefined — matches today's existing default of `[]`). Task 2 reads
  `article.applications`.

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block to `src/lib/api-client.test.ts`, after the existing
`describe('getKnowledgeBaseArticle', ...)` block (at the end of the file):

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/api-client.test.ts`
Expected: FAIL — `article.applications` is currently `string[] | undefined` mapped from
`row.application_names`, so these new assertions on the object shape mismatch.

- [ ] **Step 3: Implement the mapping**

In `src/lib/api-client.ts`, add a new exported interface right after `AuthorProfile` (after the
`AuthorProfile` interface block):

```ts
export interface LinkedApp {
  id: string;
  name: string;
  faviconUrl?: string;
  appUrl?: string;
}
```

Change `KnowledgeBaseArticle.applications?: string[];` to:

```ts
  applications: LinkedApp[];
```

Add a new row type right after `KbAuthorRow`:

```ts
interface KbApplicationRow {
  app_id: string;
  app_name: string;
  favicon_url: string | null;
  app_url: string | null;
}
```

Change `KbArticleRow.application_names?: string[];` to:

```ts
  applications?: KbApplicationRow[];
```

Add a `mapApplication` helper right after `mapAuthor`:

```ts
function mapApplication(row: KbApplicationRow): LinkedApp {
  return {
    id: row.app_id,
    name: row.app_name,
    faviconUrl: row.favicon_url || undefined,
    appUrl: row.app_url || undefined,
  };
}
```

Change `mapKbArticle`'s `applications: row.application_names || [],` line to:

```ts
    applications: (row.applications || []).map(mapApplication),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/api-client.test.ts`
Expected: PASS, all three new tests plus every existing test in the file (confirms the
`applications?: string[]` → `LinkedApp[]` type change didn't break the author tests or the
`getAppReleases`/`getApp` tests).

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If this surfaces a type error in `src/app/knowledge-base/[slug]/page.tsx` or
`KnowledgeBaseContent.tsx` (both currently reference `article.applications`/`related.applications`
as if it could be `string[]`), that's expected — Task 2 fixes the render site; this task only needs
`api-client.ts` and its own test file to typecheck cleanly. If the typecheck command checks the
whole project and fails on files Task 2 hasn't touched yet, that's fine — just confirm the errors
are confined to files Task 2 will modify (`page.tsx`) and not `api-client.ts`/`api-client.test.ts`
themselves.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api-client.ts src/lib/api-client.test.ts
git commit -m "$(cat <<'EOF'
Map cofabri-api's applications array to LinkedApp objects

KnowledgeBaseArticle.applications changes from string[] to
LinkedApp[] (id, name, faviconUrl, appUrl), matching cofabri-api's
new richer response shape. See
cofabri-core/docs/superpowers/specs/2026-09-05-kb-article-app-branding-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Render the app branding chip on the article page

**Files:**
- Modify: `src/app/knowledge-base/[slug]/page.tsx`

**Interfaces:**
- Consumes: `article.applications: LinkedApp[]` (Task 1).

This task has no automated test — `page.tsx` is a Server Component page with no existing test
coverage in this repo (matches the established pattern from the author-bios feature). Verified via
typecheck, lint, and a static trace, per Step 5.

- [ ] **Step 1: Add the type for the `meta` array's rows**

In `src/app/knowledge-base/[slug]/page.tsx`, the `meta` array is currently typed inline as `{ k:
string; v: string | undefined }[]`. Change its type (and the `.filter` callback's return type) to
add an optional `node`:

Find:
```tsx
  const meta = (
    [
      { k: 'Category', v: article.category },
      { k: 'Application', v: article.applications && article.applications.length > 0 ? article.applications.join(', ') : undefined },
      { k: 'Author', v: article.authorProfile ? undefined : article.author || undefined },
      { k: 'Published', v: formatDate(article.publishedAt) },
      { k: 'Last updated', v: formatDate(article.lastUpdated) },
      { k: 'Read time', v: article.readTime > 0 ? `${article.readTime} min` : undefined },
    ] as { k: string; v: string | undefined }[]
  ).filter((row): row is { k: string; v: string } => !!row.v);
```

Replace with:

```tsx
  const singleApp = article.applications.length === 1 ? article.applications[0] : null;
  const applicationNames = article.applications.map((a) => a.name);

  const meta = (
    [
      { k: 'Category', v: article.category },
      {
        k: 'Application',
        v: singleApp ? singleApp.name : applicationNames.length > 0 ? applicationNames.join(', ') : undefined,
        node: singleApp ? (
          singleApp.appUrl ? (
            <a
              href={singleApp.appUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-[13px] text-ink-body transition-colors hover:text-foreground"
            >
              {singleApp.faviconUrl && (
                <Image src={singleApp.faviconUrl} alt="" width={16} height={16} className="h-4 w-4 flex-shrink-0 rounded-sm object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
              )}
              {singleApp.name}
            </a>
          ) : (
            <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink-body">
              {singleApp.faviconUrl && (
                <Image src={singleApp.faviconUrl} alt="" width={16} height={16} className="h-4 w-4 flex-shrink-0 rounded-sm object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
              )}
              {singleApp.name}
            </span>
          )
        ) : undefined,
      },
      { k: 'Author', v: article.authorProfile ? undefined : article.author || undefined },
      { k: 'Published', v: formatDate(article.publishedAt) },
      { k: 'Last updated', v: formatDate(article.lastUpdated) },
      { k: 'Read time', v: article.readTime > 0 ? `${article.readTime} min` : undefined },
    ] as { k: string; v: string | undefined; node?: React.ReactNode }[]
  ).filter((row): row is { k: string; v: string; node?: React.ReactNode } => !!row.v);
```

- [ ] **Step 2: Update the row-rendering loop to use `node` when present**

Find:
```tsx
          {meta.length > 0 && (
            <div className="w-full overflow-hidden rounded-xl border border-border">
              {meta.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0"
                >
                  <span className="text-sm text-ink-faint">{row.k}</span>
                  <span className="font-mono text-[13px] text-ink-body">{row.v}</span>
                </div>
              ))}
            </div>
          )}
```

Replace the value cell's line with a conditional on `row.node`:

```tsx
          {meta.length > 0 && (
            <div className="w-full overflow-hidden rounded-xl border border-border">
              {meta.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0"
                >
                  <span className="text-sm text-ink-faint">{row.k}</span>
                  {row.node ?? <span className="font-mono text-[13px] text-ink-body">{row.v}</span>}
                </div>
              ))}
            </div>
          )}
```

- [ ] **Step 3: Confirm the `Image` import already exists**

`page.tsx` already imports `Image` from `next/image` (used for `article.logoUrl` and the author
headshot). No new import needed for Step 1's `<Image>` usage.

- [ ] **Step 4: Confirm no other file needs a shape fix**

Verified during plan-writing: `.applications` is referenced exactly once in this whole repo — the
line replaced in Step 1 above. `src/app/knowledge-base/KnowledgeBaseContent.tsx` (the KB listing
page) references `.logoUrl` but never `.applications`. No other file needs a change for the
`string[]` → `LinkedApp[]` type change. This step is a no-op — just run the verification in Step 5
to confirm the repo-wide typecheck agrees.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors, including in `KnowledgeBaseContent.tsx` if Step 4 required a fix there.

Run: `npm run lint`
Expected: clean.

Static trace (no dev server, no browser — matches this repo's established verification approach
for untested page components):
- Confirm `singleApp` is `null` whenever `article.applications.length !== 1` (0 or 2+), and in that
  case `node` is `undefined` for the Application row, so the row falls back to the plain-text
  `<span>{row.v}</span>` exactly as before Task 1/2 existed.
- Confirm when `singleApp.appUrl` is falsy, the chip renders as a `<span>`, never an `<a>` with an
  empty/undefined `href`.
- Confirm every other `meta` row (Category, Author, Published, Last updated, Read time) has no
  `node` key at all, so `row.node ?? <span>...` always falls through to the original plain-text
  rendering for those rows — unchanged behavior.

- [ ] **Step 6: Commit**

```bash
git add src/app/knowledge-base/\[slug\]/page.tsx src/app/knowledge-base/KnowledgeBaseContent.tsx
git commit -m "$(cat <<'EOF'
Render app branding chip for single-linked-app KB articles

The sidebar "Application" row now shows a clickable favicon+name chip
when the article links to exactly one app, falling back to today's
plain-text behavior for 0 or 2+ apps. Never emits a link with a
missing href -- renders a non-clickable chip when the app has no
app_url. See
cofabri-core/docs/superpowers/specs/2026-09-05-kb-article-app-branding-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Verify on a real linked article before considering done

Not a code task — final check once all three repos are deployed and cofabri-core's manual app-link
step has happened:

- [ ] Open a real published article linked to exactly one app in production and confirm the
  favicon+name chip renders and links out correctly.
- [ ] Spot-check an article with 0 linked apps to confirm the sidebar row is unchanged (nothing
  shown, or exactly as before).
