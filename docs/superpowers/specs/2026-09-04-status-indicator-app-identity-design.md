# App status indicators: match by declared app identity, not domain/name strings

Date: 2026-09-04
Status: Approved for planning

## Problem

App status indicators (the colored dot widget, the public `/status` page, and
the embeddable `app-status-widget.js`) currently decide which incidents apply
to which app by comparing free-text strings, not a stable identifier:

- `src/components/marketing/StatusPageContent.tsx` (lines 213-234) matches
  each `App.name` against `incident.application` / `incident.affectedServices[]`
  via case-insensitive string equality, with a code comment admitting this is
  "best-effort... not an app_id... no foreign key join."
- `src/app/api/status/[app]/route.ts` (lines 42-71) does the same, plus a
  hardcoded special-case that always includes any incident where
  `application === 'CoFabri API'`.
- `public/app-status-widget.js` (`filterStatusesForApp`, line 118) duplicates
  the same string-matching logic for third-party embeds.

On the `cofabri-core` side, the incidents table (`support_cases`, extended
with monitoring fields — the "incidents" concept has no separate table of its
own) has a nullable `app_id` column that's effectively unpopulated: the manual
incident-report admin UI never writes it, and the automated poller
(`lib/system-status/poll.ts`) only writes human-readable app *names* into a
free-text `affected_services` array, with a comment acknowledging "the public
per-app status widget... fuzzy-matches an app's slug against
affectedServices." A many-to-many join table, `support_case_applications`
(`support_case_id`, `app_id` — already FK'd to `apps.app_id`), exists in the
schema but is entirely unused.

This spans three repos:

- `cofabri-core` — owns the Supabase schema and the incident-authoring admin
  UI (`app/dashboard/system-status/page.tsx`).
- `cofabri-api` — pure passthrough proxy between cofabri-core's public status
  API and the website (`/web/content/status-feed`, `/web/content/status/:app`).
- `cofabri-website` (this repo) — the three consumers listed above.

## Scope decisions

Confirmed with the user before writing this spec:

1. **Implement across all three repos in this pass** — not a website-only
   change with core/api work deferred.
2. **Incidents can be tagged with multiple specific apps.** Use the existing,
   currently-unused `support_case_applications` join table rather than
   widening the single `app_id` column or inventing a new one. This mirrors
   the existing `app_roadmaps.app_id` FK precedent already in the schema.
3. **Platform-wide incidents (e.g. a shared API/infra outage) use an explicit
   `is_platform_wide` boolean**, not "tag every current app." This avoids the
   flag going stale when a new app launches after the incident was created.
4. **Historical incidents get backfilled once, then the old string-matching
   is fully retired** — not left running in parallel indefinitely. A one-time
   script maps existing `affected_services` name strings to `app_id`s via
   `apps.app_name` lookup and populates `support_case_applications`
   retroactively; unmatched rows are logged, not guessed.
5. **The widget's domain-based fallback stays as-is.** `app-status-widget.js`'s
   `getAppSlug()` (hostname fallback when an embedder omits `data-app`) is
   answering "whose widget is this embed," which is orthogonal to "which
   incidents apply to this app" — this spec only replaces the latter.
6. **The dead `domains` field on the website's `App` model** (declared,
   hardcoded to `undefined` in `mapApp`, `src/lib/api-client.ts` line 102) is
   deleted as part of this work — it was the old domain-matching idea and
   nothing will use it once this ships.

## Data model — `cofabri-core`

```sql
alter table support_cases add column is_platform_wide boolean not null default false;
```

No new join table — `support_case_applications(support_case_id, app_id)`
already exists with the right shape and FK. `affected_services` (free-text
infra names like "Supabase") is kept unchanged, but becomes purely display
copy for the incident message; it is no longer read for app-matching once
this ships.

## Population — `cofabri-core`

**Manual admin UI** (`app/dashboard/system-status/page.tsx`):
- Add an app multi-select to the incident form, sourced from the same `apps`
  fetch already used for "Manage Feeds" (`.from("apps").select("app_id, app_name")`,
  line 129).
- Add an "affects all apps" checkbox that sets `is_platform_wide = true`
  (mutually exclusive with picking specific apps — a platform-wide incident
  doesn't also need per-app rows).
- On save (`supabase.from("support_cases").insert/update`, lines 337-363),
  write `is_platform_wide` on the `support_cases` row and upsert rows into
  `support_case_applications` for the selected apps.
- The existing "Affected Services" checkbox list (infra services like
  Supabase/Vercel/GoHighLevel) is unchanged — it still drives the
  human-readable `affected_services` message text, just no longer drives
  app-matching.

**Automated poller** (`lib/system-status/poll.ts`, lines ~150-160):
- It already joins `monitored_service_apps` → `apps.app_name` to build the
  `affected_services` name array. Reuse that same join's `app_id`s to also
  insert `support_case_applications` rows, instead of only writing name
  strings.

## Public feed shaping — `cofabri-core`

`lib/system-status/public-feed.ts`:
- Add `affectedAppIds: string[]` (from `support_case_applications`) and
  `isPlatformWide: boolean` to each shaped status entry.
- Keep `application` and `affectedServices` in the response, unchanged, as
  display-only text — do not remove them, since incident messages still need
  human-readable copy.
- `getPublicStatusFeed(appId)` (used by `/web/content/status/:app`) switches
  its filter from `.eq('app_id', appId)` (the old, effectively-dead single
  column) to `affectedAppIds.includes(appId) || isPlatformWide`.

## cofabri-api

Pure passthrough — `/web/content/status-feed` and `/web/content/status/:app`
forward the new `affectedAppIds` / `isPlatformWide` fields unchanged. No
matching logic lives in this repo; no other changes needed.

## cofabri-website consumers

- **`StatusPageContent.tsx`** (lines 213-234): replace the `App.name` vs
  `incident.application`/`affectedServices` string comparison with
  `incident.isPlatformWide || incident.affectedAppIds.includes(app.id)`.
  Delete the "best-effort... not an app_id" comment along with the logic it
  was excusing.
- **`src/app/api/status/[app]/route.ts`** (lines 42-71): same swap — drop the
  hardcoded `'CoFabri API'` special case and the normalized-name substring
  matching in favor of `affectedAppIds`/`isPlatformWide`.
- **`public/app-status-widget.js`** (`filterStatusesForApp`, line 118): same
  swap. `getAppSlug()`'s domain fallback is untouched (see scope decision 5).
- **`src/components/marketing/StatusIndicator.tsx`**: unaffected — it already
  only shows the platform-wide worst incident and does no app-matching.
- **`src/lib/api-client.ts`**: delete the dead `domains` field from the `App`
  interface, `AppRow`, and `mapApp` (line 102).

## Backfill (one-time script, run once against cofabri-core)

For each `support_cases` row with a non-empty `affected_services` and no
existing `support_case_applications` rows:
- Normalize each name string the same way the current website code does
  (lowercase, strip non-alphanumerics) and look it up against `apps.app_name`.
- Insert matched `app_id`s into `support_case_applications`.
- Rows where `application === 'CoFabri API'` get `is_platform_wide = true`.
- Anything that doesn't confidently match an app name is logged and left
  unmatched — no guessing.

This is a throwaway script (run once, not committed as a tracked migration),
since it depends on today's free-text data shape.

## Rollout order

Each step is independently deployable; nothing breaks mid-rollout until step 6:

1. `cofabri-core`: ship the `is_platform_wide` column addition (additive,
   nothing reads it yet).
2. Run the backfill script.
3. `cofabri-core`: update the poller + manual admin UI to populate
   `support_case_applications` / `is_platform_wide` going forward.
4. `cofabri-core`: update `public-feed.ts` to emit the new fields alongside
   the existing ones.
5. `cofabri-api`: pass through the new fields.
6. `cofabri-website`: switch the three consumers to match on the new fields
   and delete the old string-matching logic and the dead `domains` field.

## Testing

- `cofabri-core`: unit tests for `public-feed.ts` shaping (already has
  `lib/system-status/public-feed.test.ts` to extend) covering
  `affectedAppIds`/`isPlatformWide` output, and for the backfill script's
  name-matching logic on representative fixture data.
- `cofabri-website`: update any existing tests around `StatusPageContent`,
  `/api/status/[app]`, and `app-status-widget.js` filtering to assert against
  `affectedAppIds`/`isPlatformWide` instead of string matching; add a
  platform-wide-incident case and a specific-app-only case.
- Manual verification: create one platform-wide and one single-app incident
  via the updated admin UI, confirm the correct app dots go red on `/status`
  and via the embeddable widget, and confirm an unrelated app's dot stays
  green.
