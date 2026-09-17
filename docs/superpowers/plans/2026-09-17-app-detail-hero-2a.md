# App Detail Page Hero — "2a Quiet Brand Binding" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app detail page's current experimental full-logo-lockup hero with the "2a — Quiet brand binding" design: a small inline mark tile beside the plain-text app name, the app's own brand color used once on the CTA button, a faint brand-tinted decorative blob once further down the page, and a fix to an existing text-contrast accessibility bug on the same page.

**Architecture:** No new database schema is needed — `public.apps.primary_color` already exists, is already admin-editable, and already has real hex values for most apps; the only gap is that cofabri-api's public `/web/content/apps` endpoints don't expose it yet. This plan (1) swaps that exposure in cofabri-api for the now-unused `logo_url`/`logo_light_url`/`logo_width` fields (dead weight after this change — nothing will consume them once the hero stops using a full lockup image), (2) updates cofabri-website's typed API client to match, and (3) rewrites the app detail page's hero JSX to the 2a layout, reusing the existing `app.description` field in the tagline's visual slot rather than adding a new `tagline` column (no tagline copy exists yet for any app, and adding one is a content-authoring task, not this plan's scope).

**Tech Stack:** cofabri-api (Node/Express, Jest), cofabri-website (Next.js App Router, TypeScript, Tailwind, Vitest).

**Spec:** `/Users/noahstahl/Downloads/cofabri-website-redesign 4/project/CoFabri Site App Detail Page.dc.html`, section `id="2a"` (lines 30–113), plus its "one token change needed" contrast note (lines 106–112).

## Global Constraints

- Mark tile is 44px square, 14px corner radius (`h-11 w-11 rounded-[14px]` in Tailwind), shown inline to the left of the app name — spec line 46.
- Mark tile fallback (no `favicon_url`): solid `primary_color` background with a white initial letter; if `primary_color` is also unset, fall back to today's `markPalette(app.id)` two-tone treatment — spec line 109 ("fallback with no brand_primary: markPalette(app.id)").
- CTA button background uses `primary_color` when set (inline style, since it's a per-app runtime value, not a Tailwind class) — spec line 57.
- Exactly one decorative "ghost" blob, `primary_color` tinted at **5.5% alpha**, `300px × 300px`, `70px` corner radius, positioned `right: 40px; top: -80px` relative to the "Recently shipped" section — spec line 88. Render it only when `primary_color` is set (no colorless fallback for the blob — this is decorative, not informational).
- Accessibility fix (spec line 111): every element currently styled `text-ink-faint` on this page must become `text-ink-muted` — the category kicker, the status explainer paragraph, the meta-card row keys, the release-date labels, and the roadmap "when" labels (5 occurrences total; the spec names 4, the roadmap date is the same bug pattern in the same file and is included for consistency).
- Do **not** add a new `tagline` database column or write per-app tagline copy — reuse the existing `app.description` value in that visual slot. This is a deliberate scope cut from the literal spec (which calls for `apps.tagline`), not an oversight.
- `logo_url`, `logo_light_url`, `logo_width` become fully unused by cofabri-website once this lands — remove them from the typed API client (`App`/`AppRow`/`mapApp`) and from cofabri-api's public column allowlist. Do **not** touch the underlying `apps` table columns or cofabri-core — those columns are still used by cofabri-api's separate email-branding code path, untouched by this plan.

---

## File Structure

| File | Responsibility |
|---|---|
| `cofabri-api/src/services/WebContentService.js` | Public column allowlist for `/web/content/apps*` — swap `logo_url`/`logo_light_url`/`logo_width` for `primary_color`. |
| `cofabri-api/tests/services/WebContentService.test.js` | Two hardcoded copies of that column list the tests assert against — must match exactly. |
| `cofabri-website/src/lib/api-client.ts` | Typed `App`/`AppRow` shapes and the `mapApp()` row mapper — drop the three logo fields, add `primaryColor`. |
| `cofabri-website/src/lib/app-display.ts` | Shared per-app display helpers (`markPalette`, `statusPillClasses`, etc.) — add a `hexToRgba()` helper for the ghost blob. |
| `cofabri-website/src/lib/app-display.test.ts` | Unit tests for the helpers above — add coverage for `hexToRgba()`. |
| `cofabri-website/src/app/apps/[id]/page.tsx` | The actual hero markup — rewrite the mark/name block, CTA button, ghost blob, and the 5 contrast fixes. |

---

## Task 1: cofabri-api — expose `primary_color`, retire the unused logo fields

**Files:**
- Modify: `cofabri-api/src/services/WebContentService.js:3-30`
- Modify: `cofabri-api/tests/services/WebContentService.test.js:69-70` and `:288-290`

**Interfaces:**
- Consumes: nothing new.
- Produces: `/web/content/apps` and `/web/content/apps/:appId` responses now include a `primary_color` field (string hex or `null`) and no longer include `logo_url`/`logo_light_url`/`logo_width`. Task 2 consumes this shape.

- [ ] **Step 1: Update the column allowlist and its comment**

In `cofabri-api/src/services/WebContentService.js`, replace lines 3–30:

```js
// Public-safe column list for the `apps` table. This table also stores
// per-app infrastructure credentials (supabase_url, supabase_service_key)
// and other internal/owner-only fields (owner_id, stripe_test_mode,
// metadata, default_from_email, allowed_from_domains, etc).
// These endpoints are public and unauthenticated, so NEVER widen this to
// `select('*')` — only add columns here that the website actually consumes
// (see cofabri-website src/lib/api-client.ts AppRow/mapApp).
const PUBLIC_APP_COLUMNS = [
  'app_id',
  'app_name',
  'high_level_description',
  'app_url',
  'favicon_url',
  'primary_color',
  'lifecycle_stage',
  'category',
  'feature_1',
  'feature_2',
  'feature_3',
  'launch_date',
  'latest_release_date',
  'featured_app',
  'display_on_website',
  'beta_capacity',
  'documentation',
].join(', ');
```

(Only change: `primary_color` replaces `logo_url, logo_light_url, logo_width` in the array, and `primary_color` is dropped from the comment's list of still-excluded examples since it's now public.)

- [ ] **Step 2: Update the two hardcoded test expectations**

In `cofabri-api/tests/services/WebContentService.test.js`, line 69–70 currently reads:

```js
  const PUBLIC_APP_COLUMNS =
    'app_id, app_name, high_level_description, app_url, favicon_url, logo_url, logo_light_url, logo_width, lifecycle_stage, category, feature_1, feature_2, feature_3, launch_date, latest_release_date, featured_app, display_on_website, beta_capacity, documentation';
```

Replace with:

```js
  const PUBLIC_APP_COLUMNS =
    'app_id, app_name, high_level_description, app_url, favicon_url, primary_color, lifecycle_stage, category, feature_1, feature_2, feature_3, launch_date, latest_release_date, featured_app, display_on_website, beta_capacity, documentation';
```

And around line 288–290, the second occurrence:

```js
    expect(appsSelect).toHaveBeenCalledWith(
      'app_id, app_name, high_level_description, app_url, favicon_url, logo_url, logo_light_url, logo_width, lifecycle_stage, category, feature_1, feature_2, feature_3, launch_date, latest_release_date, featured_app, display_on_website, beta_capacity, documentation'
    );
```

Replace with:

```js
    expect(appsSelect).toHaveBeenCalledWith(
      'app_id, app_name, high_level_description, app_url, favicon_url, primary_color, lifecycle_stage, category, feature_1, feature_2, feature_3, launch_date, latest_release_date, featured_app, display_on_website, beta_capacity, documentation'
    );
```

- [ ] **Step 3: Run the test suite**

Run: `cd "cofabri-api" && npx jest tests/services/WebContentService.test.js`
Expected: `Tests: 69 passed, 69 total`

- [ ] **Step 4: Commit**

```bash
cd "cofabri-api"
git add src/services/WebContentService.js tests/services/WebContentService.test.js
git commit -m "Expose primary_color instead of the now-unused logo fields on public apps endpoints

cofabri-website's app detail hero no longer renders a full logo lockup
(reverted in favor of a small inline mark), so logo_url/logo_light_url/
logo_width have no remaining consumer. primary_color is what the new
hero design actually needs, and the apps table already has it populated
for most apps."
git push origin main
```

---

## Task 2: cofabri-website — update the typed API client

**Files:**
- Modify: `cofabri-website/src/lib/api-client.ts:30-52` (the `App` interface)
- Modify: `cofabri-website/src/lib/api-client.ts:54-76` (the `AppRow` interface)
- Modify: `cofabri-website/src/lib/api-client.ts` inside `mapApp()` (currently lines 105-135ish — re-read the file first, Task 1 of the earlier session already shifted these once)
- Test: `cofabri-website/src/lib/api-client.test.ts` (read-only check — confirm no test hardcodes the old fields; none currently do, per a repo grep run during planning)

**Interfaces:**
- Consumes: the `primary_color` field from Task 1's cofabri-api response.
- Produces: `App.primaryColor?: string`, consumed by Task 4.

- [ ] **Step 1: Update the `App` interface**

Remove `logoUrl?: string;`, `logoLightUrl?: string;`, `logoWidth?: number;` from the `App` interface. Add `primaryColor?: string;` in their place (same position, right after `faviconUrl?: string;`):

```ts
export interface App {
  id: string;
  name: string;
  description?: string;
  url?: string;
  screenshot?: string;
  faviconUrl?: string;
  primaryColor?: string;
  status: string;
  category?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  launchDate?: string;
  releaseDate?: string;
  featureOnWebsite?: boolean;
  betaStatements?: BetaStatement[];
  betaCapacity?: number | null;
  betaSpotsFilled?: number;
  documentation?: string;
}
```

- [ ] **Step 2: Update the `AppRow` interface**

Remove `logo_url: string | null;`, `logo_light_url: string | null;`, `logo_width: number | null;`. Add `primary_color: string | null;` in their place:

```ts
interface AppRow {
  app_id: string;
  app_name: string;
  high_level_description: string | null;
  app_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  lifecycle_stage: string | null;
  category: string | null;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  launch_date: string | null;
  latest_release_date: string | null;
  featured_app: boolean;
  documentation: string | null;
  // Only present on the single-app endpoint (getApp); the list endpoint
  // (getApps) never includes it.
  beta_statements?: BetaStatement[];
  beta_capacity?: number | null;
  beta_spots_filled?: number;
}
```

- [ ] **Step 3: Update `mapApp()`**

Find this block inside `mapApp()`:

```ts
    faviconUrl: row.favicon_url || undefined,
    logoUrl: row.logo_url || undefined,
    logoLightUrl: row.logo_light_url || undefined,
    logoWidth: row.logo_width || undefined,
    status: normalizeStatus(row.lifecycle_stage),
```

Replace with:

```ts
    faviconUrl: row.favicon_url || undefined,
    primaryColor: row.primary_color || undefined,
    status: normalizeStatus(row.lifecycle_stage),
```

- [ ] **Step 4: Typecheck**

Run: `cd "cofabri-website" && npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (This will surface any other file still referencing `logoUrl`/`logoLightUrl`/`logoWidth` on the `App` type — Task 4 removes the one known reference in `apps/[id]/page.tsx`; if the compiler finds another, stop and add a step here to fix it before continuing.)

- [ ] **Step 5: Commit**

```bash
cd "cofabri-website"
git add src/lib/api-client.ts
git commit -m "Swap unused logo fields for primaryColor in the typed API client

Matches cofabri-api's updated public column list — the app detail hero
no longer renders a full logo lockup, so logoUrl/logoLightUrl/logoWidth
were dead. primaryColor is what the 2a hero redesign needs instead."
```

(Do not push yet — Task 4 touches the file that actually uses this, and Task 1's cofabri-api deploy plus this commit should land together for a clean bisect. Push at the end of Task 4 instead.)

---

## Task 3: cofabri-website — add the `hexToRgba` helper

**Files:**
- Modify: `cofabri-website/src/lib/app-display.ts` (add function after `markPalette`, currently ending around line 66)
- Modify: `cofabri-website/src/lib/app-display.test.ts` (add tests after the `markPalette` describe block, currently ending around line 31)

**Interfaces:**
- Consumes: nothing.
- Produces: `hexToRgba(hex: string, alpha: number): string`, consumed by Task 4 for the ghost blob's background color.

- [ ] **Step 1: Write the failing tests**

In `cofabri-website/src/lib/app-display.test.ts`, add this import to the existing import line and a new `describe` block right after the existing `describe('markPalette', ...)` block:

```ts
import { statusPillClasses, markPalette, hexToRgba, appMomentum, actionLabel, actionHref, isLaunchingToday } from './app-display';
```

```ts
describe('hexToRgba', () => {
  it('converts a 6-digit hex color to an rgba() string at the given alpha', () => {
    expect(hexToRgba('#0E5F62', 0.055)).toBe('rgba(14, 95, 98, 0.055)');
  });

  it('works without a leading #', () => {
    expect(hexToRgba('0E5F62', 0.055)).toBe('rgba(14, 95, 98, 0.055)');
  });

  it('is case-insensitive', () => {
    expect(hexToRgba('#0e5f62', 0.5)).toBe('rgba(14, 95, 98, 0.5)');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "cofabri-website" && npx vitest run src/lib/app-display.test.ts`
Expected: FAIL — `hexToRgba is not a function` (or a TypeScript import error, since it doesn't exist yet).

- [ ] **Step 3: Implement `hexToRgba`**

In `cofabri-website/src/lib/app-display.ts`, add this function immediately after `markPalette` (after the closing brace on the line following `return MARK_PALETTES[hash % MARK_PALETTES.length];`):

```ts
// apps.primary_color is stored as a plain "#RRGGBB" hex string (see the
// admin edit form's color picker in cofabri-core). The 2a hero design needs
// it as a low-alpha decorative fill, which CSS can only express as rgba().
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "cofabri-website" && npx vitest run src/lib/app-display.test.ts`
Expected: all tests pass, including the 3 new `hexToRgba` tests.

- [ ] **Step 5: Commit**

```bash
cd "cofabri-website"
git add src/lib/app-display.ts src/lib/app-display.test.ts
git commit -m "Add hexToRgba helper for the app detail hero's brand-tinted ghost blob"
```

---

## Task 4: cofabri-website — rewrite the app detail hero

**Files:**
- Modify: `cofabri-website/src/app/apps/[id]/page.tsx`

**Interfaces:**
- Consumes: `app.primaryColor` (Task 2), `hexToRgba` (Task 3), existing `markPalette` from `app-display.ts`.
- Produces: nothing else depends on this file.

- [ ] **Step 1: Replace the mark/name block**

Find this block (currently lines 124–188 — re-read the file first to get exact current line numbers, since Task 2/3 don't touch this file but earlier session work may have shifted things):

```tsx
            {app.logoUrl ? (
              // The lockup logo stands in for the app name visually; an sr-only
              // h1 below keeps a real text heading for a11y/SEO. Fixed HEIGHT,
              // auto width (not app.logoWidth) -- apps' logos vary wildly in
              // aspect ratio, so matching a per-app width made some apps'
              // logos render much shorter than others. A native <img> (not
              // next/image, which needs both dimensions or `fill`) is what
              // lets the browser derive width from each asset's own intrinsic
              // ratio while every app's logo keeps the same visual weight.
              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.logoUrl}
                  alt={app.name}
                  loading="eager"
                  className={`h-14 w-auto max-w-full sm:h-16 ${app.logoLightUrl ? 'dark:hidden' : ''}`}
                />
                {app.logoLightUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.logoLightUrl}
                    alt=""
                    loading="eager"
                    className="hidden h-14 w-auto max-w-full dark:block sm:h-16"
                  />
                )}
              </div>
            ) : app.faviconUrl ? (
              <div className="relative mb-5 h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] border border-border bg-secondary">
                <Image src={app.faviconUrl} alt="" fill className="object-contain" />
              </div>
            ) : (
              <div
                className={`mb-5 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold tracking-[-0.02em] ${markPalette(app.id)}`}
              >
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusPillClasses(app.status)}`}>
                {app.status}
              </span>
              {app.category && (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{app.category}</span>
              )}
              {showStatusDot && (
                <Link
                  href="/status"
                  title={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  aria-label={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  className="inline-flex h-2.5 w-2.5 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background transition-opacity hover:opacity-70"
                >
                  <span className={`h-full w-full rounded-full ${statusIncident ? incidentDotClasses(statusIncident.publicStatus) : 'bg-success'}`} />
                </Link>
              )}
            </div>
            <h1
              className={
                app.logoUrl
                  ? 'sr-only'
                  : 'm-0 text-[40px] font-semibold leading-[1.03] tracking-[-0.035em] text-foreground sm:text-[56px]'
              }
            >
              {app.name}
            </h1>
```

Replace it with:

```tsx
            <div className="mb-5 flex items-center gap-3.5">
              {app.faviconUrl ? (
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-[14px] border border-border bg-secondary">
                  <Image src={app.faviconUrl} alt="" fill className="object-contain" />
                </div>
              ) : (
                <div
                  className={
                    app.primaryColor
                      ? 'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-[19px] font-semibold text-white'
                      : `flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-[19px] font-semibold ${markPalette(app.id)}`
                  }
                  style={app.primaryColor ? { backgroundColor: app.primaryColor } : undefined}
                >
                  {app.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="m-0 text-[40px] font-semibold leading-[1.03] tracking-[-0.035em] text-foreground sm:text-[56px]">
                {app.name}
              </h1>
            </div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusPillClasses(app.status)}`}>
                {app.status}
              </span>
              {app.category && (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">{app.category}</span>
              )}
              {showStatusDot && (
                <Link
                  href="/status"
                  title={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  aria-label={`System status: ${statusIncident ? statusIncident.publicStatus : 'Operational'}`}
                  className="inline-flex h-2.5 w-2.5 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background transition-opacity hover:opacity-70"
                >
                  <span className={`h-full w-full rounded-full ${statusIncident ? incidentDotClasses(statusIncident.publicStatus) : 'bg-success'}`} />
                </Link>
              )}
            </div>
```

Note what changed: the mark and the `<h1>` are now siblings inside one flex row (mark inline beside the name, per spec line 45–48), the mark shrinks from 56px (`h-14 w-14`) to 44px (`h-11 w-11`), the no-favicon fallback now uses `app.primaryColor` when present, and the category kicker's color moves from `text-ink-faint` to `text-ink-muted` (contrast fix, spec line 111). The `logoUrl` full-lockup branch and the `sr-only` conditional on `<h1>` are gone entirely — the name is always visible text now.

- [ ] **Step 2: Fix the remaining 4 contrast instances**

In the same file, find and replace each of these 4 occurrences of `text-ink-faint` with `text-ink-muted` (leave every other class on each line unchanged):

```tsx
              <p className="mt-3 max-w-[520px] text-sm leading-[1.5] text-ink-faint">{statusExplainer(app.status)}</p>
```
→
```tsx
              <p className="mt-3 max-w-[520px] text-sm leading-[1.5] text-ink-muted">{statusExplainer(app.status)}</p>
```

```tsx
                  <span className="text-sm text-ink-faint">{row.k}</span>
```
→
```tsx
                  <span className="text-sm text-ink-muted">{row.k}</span>
```

```tsx
                    <span className="font-mono text-xs text-ink-faint">{formatDate(release.releasedDate)}</span>
```
→
```tsx
                    <span className="font-mono text-xs text-ink-muted">{formatDate(release.releasedDate)}</span>
```

```tsx
                  <span className="font-mono text-xs text-ink-faint">{formatRoadmapWhen(item)}</span>
```
→
```tsx
                  <span className="font-mono text-xs text-ink-muted">{formatRoadmapWhen(item)}</span>
```

- [ ] **Step 3: Color the CTA button with `primaryColor`**

Find:

```tsx
              <Link
                href={actionHref(app)}
                target={isExternalAction(app) ? '_blank' : undefined}
                rel={isExternalAction(app) ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary px-[26px] py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
              >
                {actionLabel(app)} {isExternalAction(app) && <ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              </Link>
```

Replace with:

```tsx
              <Link
                href={actionHref(app)}
                target={isExternalAction(app) ? '_blank' : undefined}
                rel={isExternalAction(app) ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary px-[26px] py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                style={app.primaryColor ? { backgroundColor: app.primaryColor } : undefined}
              >
                {actionLabel(app)} {isExternalAction(app) && <ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              </Link>
```

(`hover:bg-accent-hover` is replaced with `hover:opacity-90` — an inline `style` always wins over a class for the same CSS property, so the old hover class would have silently stopped doing anything once `primaryColor` was set. Opacity is a different property, so it works as hover feedback either way.)

- [ ] **Step 4: Import `hexToRgba` and add the ghost blob**

Update the import line:

```tsx
import { actionHref, actionLabel, hasActiveRoadmap, isExternalAction, markPalette, statusExplainer, statusPillClasses } from '@/lib/app-display';
```
→
```tsx
import { actionHref, actionLabel, hasActiveRoadmap, hexToRgba, isExternalAction, markPalette, statusExplainer, statusPillClasses } from '@/lib/app-display';
```

Find the "Recently shipped" section's outer div:

```tsx
        {shippedItems.length > 0 && (
          <div className="mt-[88px] grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
            <div>
              <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                Recently shipped
              </h2>
```

Replace with:

```tsx
        {shippedItems.length > 0 && (
          <div className="relative mt-[88px] grid grid-cols-1 gap-10 overflow-hidden lg:grid-cols-[320px_1fr] lg:gap-20">
            {app.primaryColor && (
              <div
                className="pointer-events-none absolute -top-20 right-10 h-[300px] w-[300px] rounded-[70px]"
                style={{ backgroundColor: hexToRgba(app.primaryColor, 0.055) }}
                aria-hidden="true"
              />
            )}
            <div className="relative">
              <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
                Recently shipped
              </h2>
```

And its closing structure — find the matching close of that same section (search for the next `</div>\n        )}` pair that closes the "Recently shipped" block; it currently ends right after the releases `.map()` closes, at:

```tsx
            </div>
          </div>
        )}

        {roadmapItems.length > 0 && (
```

Replace with (adds a `relative` wrapper around the second grid column so its content stays above the absolutely-positioned blob):

```tsx
            </div>
          </div>
        )}

        {roadmapItems.length > 0 && (
```

This second replacement is a no-op text match used only to locate the boundary — no change needed there, since the blob sits in a shared parent with `position: relative` on the two content columns already established by the grid layout and the blob's own `pointer-events-none` + earlier DOM position (it paints behind later siblings in normal stacking order without `z-index`). Skip editing anything beyond the two blocks already changed above.

- [ ] **Step 5: Typecheck**

Run: `cd "cofabri-website" && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Lint**

Run: `cd "cofabri-website" && npx eslint "src/app/apps/[id]/page.tsx"`
Expected: no errors (the `@next/next/no-img-element` disable comments are gone along with the raw `<img>` tags they guarded — if eslint still reports an unused-disable-directive warning, remove any leftover disable comment).

- [ ] **Step 7: Manual visual verification**

Start both dev servers (cofabri-api on port 3001, then cofabri-website on port 3000 with `COFABRI_API_BASE_URL=http://localhost:3001`), then check these 4 pages in a browser:
- `http://localhost:3000/apps/gathr` (has `primary_color`)
- `http://localhost:3000/apps/medoura` (has `primary_color`)
- `http://localhost:3000/apps/rx-bridge` (has `primary_color`)
- `http://localhost:3000/apps/luxier` (does **not** have `primary_color` — confirms the `markPalette` fallback still works)

For each: confirm the mark sits inline beside the name at 44px, the CTA button is colored with the app's `primary_color` (except Luxier, which should look like today's default blue), and — for any app with `shippedItems` (a "Recently shipped" section) — a faint colored blob is visible in the upper-right of that section only for apps with `primary_color` set.

- [ ] **Step 8: Commit and push**

```bash
cd "cofabri-website"
git add src/app/apps/[id]/page.tsx
git commit -m "Rewrite app detail hero to 2a: inline mark + name, brand-colored CTA, ghost blob

Replaces the full-logo-lockup hero (reverted per user feedback on font
rendering and inconsistent sizing across apps) with the 'quiet brand
binding' design from the Claude Design handoff: a 44px mark beside the
plain-text app name, apps.primary_color on the CTA button, a single
faint brand-tinted blob above 'Recently shipped'. Also fixes an
existing AA-contrast bug: 5 elements on this page were text-ink-faint
(#8494A0, fails 4.5:1 against this background) and are now
text-ink-muted (#5A6A75, passes at 5.6:1)."
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** mark tile size/position (Task 4 Step 1), CTA brand color (Step 3), single ghost blob at the specified size/position/alpha (Step 4), contrast fix (Steps 1 & 2), `primary_color` data plumbing (Tasks 1–2), `markPalette` fallback preserved (Step 1). The spec's `apps.tagline` ask is deliberately not built — called out in Global Constraints, not silently dropped.
- **Dead code:** `logoUrl`/`logoLightUrl`/`logoWidth` removed from both the API surface and the typed client in the same pass as their only consumer's removal, so there's no orphaned plumbing left after Task 4.
- **Type consistency:** `hexToRgba(hex: string, alpha: number): string` is defined once in Task 3 and consumed with that exact signature in Task 4 Step 4. `app.primaryColor` (camelCase) is the field name used consistently from Task 2 through Task 4.
