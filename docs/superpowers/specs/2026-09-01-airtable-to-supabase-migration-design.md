# CoFabri Website: Airtable → Supabase Migration

## Context

`cofabri-website` currently pulls all content (apps, knowledge base, roadmap, legal docs, testimonials, banners, marketing popups, status) from Airtable via `src/lib/airtable.ts` (plus duplicated inline fetch logic in `src/app/api/apps/route.ts` and `apps/[id]/route.ts`), and writes form submissions (contact, newsletter, support, waitlist) directly into Airtable. This is the last Airtable dependency in the CoFabri stack that touches the public website.

Two sibling projects share one Supabase instance ("CoFabri Core & API", project `iwpgwnapxuhpsdndvsrv`):

- **cofabri-core** — the admin dashboard. It already has the full Supabase schema for this content (`kb_*`, `site_*`, `app_releases`, `app_roadmaps`, `support_cases`, `apps`, etc., every table carrying an `airtable_record_id` column) and a one-time import script (`scripts/migrate-airtable.mjs`) that already populated most of it from Airtable. Going forward, **content edits happen in cofabri-core**, not Airtable.
- **cofabri-api** — an Express API. It has a `SupabaseDatabaseService`/`SupabaseService` layer, but today it serves a completely different domain (product signup, billing, user accounts) — it has **no existing routes for this website content**. It still writes live to Airtable for that unrelated domain (`AirtableService`) and runs a separate finance/ops Airtable↔Supabase sync (`AirtableSyncService`) — neither is in scope here.

Verified state of the Supabase backfill (via direct DB query + live Airtable comparison):

| Table | Supabase rows | Status |
|---|---|---|
| `kb_articles` | 60 | Non-empty, not cross-verified against current Airtable |
| `site_testimonials` | 6 | Non-empty, not cross-verified |
| `site_banners` | 1 | Non-empty, not cross-verified |
| `support_cases` | 41 | Non-empty, not cross-verified |
| `kb_contracts` | 13 | Non-empty, not cross-verified |
| `apps` | 8 | Non-empty, not cross-verified |
| `app_releases` | 10 | **Verified matching** Airtable "Releases/Roadmap" (Application Core base), 10/10 |
| `site_marketing_popups` | 0 | **Verified correct** — Airtable "Marketing Popups" is also 0 records |
| `app_roadmaps` | 0 | **Verified gap** — Airtable "Roadmap" (Site Management base) has 8 records with "Publish to Website" checked, none imported |
| `app_contracts` | 0 | No corresponding Airtable source table exists; expected to stay empty |

`migrate-airtable.mjs` is a one-time import, not a continuous sync — Airtable and Supabase can drift silently. This migration must not assume existing row counts are current.

## Goals

1. Replace every Airtable read in the website with a Supabase-backed read served through new cofabri-api endpoints.
2. Replace every Airtable write (contact, newsletter, support, waitlist) with a Supabase-backed write through new cofabri-api endpoints.
3. Remove `src/lib/airtable.ts`, the inline Airtable fetch logic, and the `airtable` npm dependency from `cofabri-website` entirely.
4. Rework the Airtable-record-ID-based preview system (`/preview/[type]/[id]`, and the `middleware.ts` `rec`-pattern gate) to work off Supabase identifiers.
5. Backfill the confirmed `app_roadmaps` gap, and reconcile the other content tables against live Airtable, before building each area's read path.

## Non-goals

- Any change to cofabri-api's own Airtable usage for product signup/billing/user accounts (`AirtableService`), or its finance/ops `AirtableSyncService`.
- Any change to cofabri-core beyond what's needed to backfill/reconcile the content tables (no new admin UI work — assume cofabri-core can already edit these tables, or note where it can't).
- Visual/content changes to the website (tracked separately in the visual-refresh spec).
- Making cofabri-api's read endpoints public/versioned API products for third parties — they exist to serve this website.

## Design

### 1. New cofabri-api route group

A new route module (or set of modules, following the existing `web-*.js` naming convention) exposes:

**Reads** (`GET`, unauthenticated, rate-limited via the existing `express-rate-limit` middleware):
- `/web/content/apps` — marketing app listing (`apps` where `display_on_website = true`)
- `/web/content/apps/:slug` — app detail, joined with approved `site_beta` statements (`type = 'statement'`)
- `/web/content/knowledge-base` — published KB articles (`kb_articles` where `status = 'published'`), with query params for category/tag/popular/featured matching current site filtering
- `/web/content/knowledge-base/:slug` — article detail
- `/web/content/roadmap` — `app_roadmaps` where `publish_to_website = true`
- `/web/content/legal` — `kb_contracts` list
- `/web/content/legal/:id` — `kb_contracts` detail
- `/web/content/testimonials` — `site_testimonials` where `active = true`, optional app filter
- `/web/content/banners` — `site_banners` where `is_active = true` and within date range
- `/web/content/marketing-popups` — `site_marketing_popups` where `is_enabled = true` and within date range
- `/web/content/status` — public incident feed from `support_cases`
- `/web/content/status/:app` — same, filtered by app

**Writes** (`POST`, Turnstile-verified server-side, matching the pattern already used in cofabri-api's `signup.js`):
- `/web/forms/contact` → `site_contact_submissions`
- `/web/forms/newsletter` → `site_newsletter_signups` (check existing email first, matching current Airtable behavior)
- `/web/forms/support` → `support_cases` (ticket-shaped insert — see open item below)
- `/web/forms/waitlist` → `site_beta` (`type = 'waitlist'`)

A new `WebContentService` (alongside the existing `SupabaseDatabaseService`) encapsulates these queries. Exact route prefixes should be reconciled with cofabri-api's existing `/web/*` mount conventions (`web.js`, `web-apps.js`) during implementation rather than assumed here.

**Open item to verify during implementation:** `support_cases` is the write target for both customer-submitted support tickets and the public status-incident feed. There must be a column that distinguishes the two (e.g. a `case_type`/`source` column) so `/web/content/status` never surfaces a customer's support ticket. Confirm the actual schema before wiring the status read endpoint.

### 2. Website data-access layer

`src/lib/airtable.ts` is replaced by `src/lib/api-client.ts`, keeping the same exported function names/signatures (`getApps()`, `getTestimonials()`, `getKnowledgeBaseArticle(slug)`, etc.) so the ~25 consuming files (components and route handlers) change only their import, not their call sites. The inline `fetchFromAirtable` duplicated in the apps routes is folded into this client rather than kept as a separate path.

Form-submitting routes (`src/app/api/contact/route.ts`, `newsletter/route.ts`, `support/route.ts`, `signup/route.ts`) become thin proxies that POST to the corresponding cofabri-api `/web/forms/*` endpoint instead of writing to Airtable directly.

### 3. Preview system rework

`src/app/api/preview/[type]/[id]/route.ts` and `src/app/preview/[type]/[id]/page.tsx` currently key off Airtable record IDs (`rec...`), and `middleware.ts` specifically pattern-matches and gates that `rec` prefix. Replace the identifier with:
- Slug, where the content type already has one (KB articles, legal docs once given a slug if they lack one).
- Supabase UUID (`id` column), for content types with no natural slug (apps, testimonials, banners, roadmap items).

`middleware.ts`'s Airtable-ID-specific gating logic is removed/generalized to whatever the new identifier scheme requires (still password-gated, just not `rec`-pattern-specific).

### 4. Pre-flight data reconciliation (blocking, before building each read path)

Before wiring a content area's read endpoint, reconcile that area's Supabase table against the live Airtable table it came from:
- **`app_roadmaps`**: import the 8 "Publish to Website" records from Airtable's "Roadmap" table (Site Management base) — extend `migrate-airtable.mjs`'s existing import pattern rather than writing a one-off script.
- **`kb_articles`, `site_testimonials`, `site_banners`, `support_cases`, `kb_contracts`, `apps`**: row-count and spot-content diff against their Airtable sources; re-run/extend the relevant `migrate-airtable.mjs` importer for any area found stale.
- **`site_marketing_popups`, `app_contracts`**: no action — confirmed genuinely empty at the source.

This reconciliation happens per content area as that area is built, not as one giant upfront pass — it's a checklist item in each area's implementation task, not a separate project phase.

### 5. Rollout

Big-bang cutover, per your direction: build every new cofabri-api endpoint and the new website `api-client.ts` on a branch, verify the full site locally against the new data layer side-by-side with the live Airtable-backed site (diff rendered content per page), then ship in one deploy that also removes `lib/airtable.ts`, the inline Airtable fetch code, the `airtable` npm dependency, and the `rec`-pattern middleware logic.

### 6. Error handling

- Read endpoints: on a Supabase error, cofabri-api returns a clean 5xx with no leaked internals; the website's existing empty-state/error handling per page (already built for "Airtable returned nothing") stays as the fallback UI — no new error-UI work needed, just confirm each page's existing empty/error states still fire correctly against the new client.
- Write endpoints: validation errors return 4xx with field-level messages (matching current form UX); Turnstile failures return 4xx distinctly so the website can show its existing "verification failed" state.
- No dual-write or fallback-to-Airtable path during/after cutover — once an area is verified, Airtable is fully removed for it. Big-bang means this happens for everything at once, not gradually.

## Testing / Verification

- Per content area, before cutover: manually diff the rendered page (or API JSON) against the current Airtable-backed production site.
- Contract-level check on each new cofabri-api endpoint: correct shape, correct filtering (e.g. `display_on_website`, `is_active`, `status = 'published'`), correct empty-state behavior.
- Form writes: submit a real test record through each form in a staging environment, confirm it lands correctly in Supabase with the right shape (and, for support/status, confirm it does **not** cross-contaminate the other feed).
- Preview route: verify slug/UUID-based preview links work for every content type before removing the old `rec`-based path.
- Final check before merge: `grep -ri airtable` across `cofabri-website/src` returns nothing except historical docs (`AIRTABLE_FORM_PERFORMANCE.md`, etc., which can stay as historical record or be removed at your discretion), and `airtable` is gone from `package.json`.

## Out of scope / open items carried into implementation planning

- Exact `/web/*` route prefixes and file layout in cofabri-api (reconcile with existing `web-apps.js`/`web.js` conventions).
- The `support_cases` discriminator column between tickets and public incidents (verify schema).
- Whether legal docs need a new `slug` column added via migration, or already have one usable for preview.
- Whether cofabri-core's admin UI already supports editing every one of these tables, or needs additive UI work to fully replace Airtable as the editing surface (flagged for the user to confirm — this spec assumes cofabri-core is the editing surface going forward but doesn't verify every table has an edit UI).
