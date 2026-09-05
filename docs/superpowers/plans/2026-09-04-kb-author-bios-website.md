# KB Author Bios — cofabri-website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a real byline block (photo, name, role, bio, social links) on the public KB
article page when cofabri-api returns a linked author, falling back to today's plain-text sidebar
row when it doesn't.

**Architecture:** Extend `api-client.ts`'s KB article mapping with a new optional `authorProfile`
object (additive — the existing `author` string field is untouched). Add a byline block to the
article page's main column, conditionally rendered.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4 (design-token utilities), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-kb-author-bios-design.md` (cofabri-core repo — this
plan implements section "cofabri-website changes")

## Global Constraints

- This is repo 3 of 3. Do not start until cofabri-api's plan
  (`cofabri-api/docs/superpowers/plans/2026-09-04-kb-author-bios-api.md`) has shipped — the
  `author` field on `GET /web/content/knowledge-base/:slug` must already exist.
- Do not rename or remove the existing `KnowledgeBaseArticle.author` string field — it's still used
  for OG metadata (`page.tsx:50`) and the plain-text fallback.
- No new dedicated author page/route. No blog revival. This is scoped to the KB article page only.
- `src/app/api/knowledge-base/[slug]/route.ts` needs no changes — it's a thin passthrough over
  `getKnowledgeBaseArticle`, which this plan already updates.

---

### Task 1: Extend `api-client.ts` with `authorProfile`

**Files:**
- Modify: `src/lib/api-client.ts`
- Test: `src/lib/api-client.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface AuthorProfile {
    name: string
    role?: string
    bio?: string
    twitterUrl?: string
    linkedinUrl?: string
    headshotUrl?: string
  }
  ```
  added as `authorProfile?: AuthorProfile` on `KnowledgeBaseArticle`. Task 2 reads
  `article.authorProfile`.

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block to `src/lib/api-client.test.ts`, after the existing `describe('getApp', ...)`
block (at the end of the file):

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/api-client.test.ts`
Expected: FAIL — `article.authorProfile` is `undefined` in the first test where it should be
populated (type/field doesn't exist yet).

- [ ] **Step 3: Implement the mapping**

In `src/lib/api-client.ts`, add a new exported interface right after `KnowledgeBaseArticle` (after
line 147):

```ts
export interface AuthorProfile {
  name: string;
  role?: string;
  bio?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  headshotUrl?: string;
}
```

Add `authorProfile?: AuthorProfile;` to `KnowledgeBaseArticle` (after `author: string;` at line 137):

```ts
  author: string;
  authorProfile?: AuthorProfile;
```

Add a new row type right after `KbArticleRow` (after line 165):

```ts
interface KbAuthorRow {
  id: string;
  name: string | null;
  role: string | null;
  bio: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  headshot_url: string | null;
}
```

Add `author?: KbAuthorRow | null;` to `KbArticleRow` (after `related_topic_slugs?: string[];` at
line 164):

```ts
  related_topic_slugs?: string[];
  author?: KbAuthorRow | null;
```

Add a `mapAuthor` helper right before `mapKbArticle` (before line 179):

```ts
function mapAuthor(row: KbAuthorRow): AuthorProfile | undefined {
  if (!row.name) return undefined;
  return {
    name: row.name,
    role: row.role || undefined,
    bio: row.bio || undefined,
    twitterUrl: row.twitter_url || undefined,
    linkedinUrl: row.linkedin_url || undefined,
    headshotUrl: row.headshot_url || undefined,
  };
}
```

Add `authorProfile: row.author ? mapAuthor(row.author) : undefined,` to `mapKbArticle`'s return
(after `author: row.author_name || '',` at line 187):

```ts
    author: row.author_name || '',
    authorProfile: row.author ? mapAuthor(row.author) : undefined,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/api-client.test.ts`
Expected: PASS, all three new tests plus the existing `getAppReleases`/`getApp` tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Typecheck**

This repo has no standalone `typecheck` script (`package.json` only defines `dev`/`build`/`start`/
`lint`/`test`/`test:e2e`). Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api-client.ts src/lib/api-client.test.ts
git commit -m "$(cat <<'EOF'
Map cofabri-api's author object to AuthorProfile

Additive: KnowledgeBaseArticle keeps its existing `author` string field
(still used for OG metadata and the plain-text fallback) and gains an
optional `authorProfile` object when cofabri-api returns a linked
site_authors record. See
cofabri-core/docs/superpowers/specs/2026-09-04-kb-author-bios-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YMaUfytN1RT7368yHhhdNj
EOF
)"
```

---

### Task 2: Render the byline block on the article page

**Files:**
- Modify: `src/app/knowledge-base/[slug]/page.tsx`

**Interfaces:**
- Consumes: `article.authorProfile: AuthorProfile | undefined` (Task 1).

This task has no automated test — `page.tsx` is a Server Component page with no existing test
coverage in this repo (`api-client.test.ts` covers the data layer only), so this follows that same
established pattern. Verified manually per Step 3 below.

- [ ] **Step 1: Add icon imports**

At the top of `src/app/knowledge-base/[slug]/page.tsx`, add to the existing import block:

```tsx
import { Twitter, Linkedin } from 'lucide-react';
```

(Confirm `lucide-react` is already a dependency — it's used elsewhere in this codebase per
cofabri-core's parallel usage; if this repo doesn't already depend on it, add it: `npm install lucide-react`.)

- [ ] **Step 2: Drop the sidebar "Author" row when a rich profile exists**

In the `meta` array (lines 98-107), change the Author row so it's excluded whenever
`authorProfile` is present (the rich block replaces it — no duplicate name):

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

- [ ] **Step 3: Add the byline block**

In the left column, right after the tags block closes (after line 158, before the closing `</div>`
of the left column at line 159), add:

```tsx
            {article.authorProfile && (
              <div className="group mt-8 flex items-center gap-4">
                {article.authorProfile.headshotUrl ? (
                  <Image
                    src={article.authorProfile.headshotUrl}
                    alt={article.authorProfile.name}
                    width={56}
                    height={56}
                    className="hover-image-avatar h-14 w-14 flex-shrink-0 rounded-full object-cover"
                    unoptimized={process.env.NODE_ENV === 'development'}
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg font-semibold text-ink-faint">
                    {article.authorProfile.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{article.authorProfile.name}</p>
                  {article.authorProfile.role && (
                    <p className="text-xs text-ink-faint">{article.authorProfile.role}</p>
                  )}
                  {article.authorProfile.bio && (
                    <p className="mt-1 max-w-[480px] text-xs leading-relaxed text-ink-muted">
                      {article.authorProfile.bio}
                    </p>
                  )}
                  {(article.authorProfile.twitterUrl || article.authorProfile.linkedinUrl) && (
                    <div className="mt-1.5 flex items-center gap-3">
                      {article.authorProfile.twitterUrl && (
                        <a
                          href={article.authorProfile.twitterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink-faint transition-colors hover:text-foreground"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {article.authorProfile.linkedinUrl && (
                        <a
                          href={article.authorProfile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink-faint transition-colors hover:text-foreground"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open a KB article slug that cofabri-api returns a populated `author` for (once
cofabri-core's manual backfill from its own plan Task 6 has happened) — confirm:
- The photo (or initial-letter fallback if no headshot), name, role, bio, and social icons render
  under the title/tags, and hovering the photo shows the `.hover-image-avatar` scale effect.
- The sidebar spec table no longer shows a separate "Author" row.
- Open an article with no linked author — confirm the page looks exactly as it did before this
  change (plain-text "Author" row in the sidebar, no byline block).
- Check both light and dark mode (tokens used here — `ink-faint`/`ink-muted`/`surface-raised` — are
  already theme-aware per `globals.css`, but confirm visually).

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/knowledge-base/\[slug\]/page.tsx
git commit -m "$(cat <<'EOF'
Render author photo/bio/social block on KB article pages

Shows a real byline (headshot, name, role, bio, Twitter/LinkedIn links)
when the article has a linked author. Falls back to today's plain-text
sidebar row when it doesn't -- no article's rendering changes unless
it's been linked to a site_authors record in the admin. Reuses the
previously-unused .hover-image-avatar utility for the photo's hover
state. See
cofabri-core/docs/superpowers/specs/2026-09-04-kb-author-bios-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YMaUfytN1RT7368yHhhdNj
EOF
)"
```

---

### Task 3: Verify on a real published article before promoting

Not a code task — final rollout check once Tasks 1-2 are deployed to a preview environment and
cofabri-core's manual backfill (its plan's Task 6) is done:

- [ ] Open the deployed preview at `/knowledge-base/<a slug linked to Noah>` and confirm the byline
  renders correctly end-to-end (real headshot loads, links work).
- [ ] Spot-check 2-3 other published articles (not yet linked to an author) to confirm they're
  visually unchanged.
- [ ] Only then promote to production.
