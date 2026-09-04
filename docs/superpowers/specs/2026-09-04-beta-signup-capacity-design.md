# Beta signup spot capacity

Date: 2026-09-04
Status: Approved for planning

## Problem

Apps with `status = 'beta'` are live for early users, but there is no way to
cap how many people can join. The website already has dead UI for this: the
`/signup` page (`src/app/signup/SignupPageContent.tsx`) renders a "Beta Spots
Remaining" progress bar, but it's gated on `betaSpotsTotal > 0`, and that
field is hardcoded to `0` in `src/app/api/apps/[id]/route.ts` with a comment
saying the data doesn't exist yet. There is no capacity concept anywhere in
the stack: not in the `apps` table, not in `site_beta`, not in any API layer.

This feature spans three repos in the workspace:

- `cofabri-core` — owns the Supabase schema and the admin dashboard used to
  edit apps.
- `cofabri-api` — the Express service that reads/writes Supabase on behalf of
  the public website.
- `cofabri-website` (this repo) — the public site, including `/signup`.

## Scope decisions

These were confirmed with the user before writing this spec:

1. **Applies to `beta`-status apps only.** Not `development` (the existing
   waitlist funnel keeps its current, separately-scoped behavior). Not
   `active`/`paused`/`sunset`/`archived`.
2. **Only dedicated beta signups count toward capacity** — i.e. rows in
   `site_beta` where `type = 'waitlist'` and `app_id` matches. Leads from the
   general Contact form (which also tags `app_id`) do **not** count, even
   though they're a lead source for the same app. They're a separate funnel.
3. **Capacity is a fixed admin-set number per app; "filled" is always
   computed live** from `site_beta`, never manually maintained. This avoids
   drift between the stored count and reality.
4. **"Closed" / no-signups conditions** (spot block shown, form hidden):
   - `beta_capacity` is `null` (admin hasn't opened signups for this app yet)
   - `beta_capacity = 0` (admin explicitly closed signups without deleting
     the number or changing app status)
   - filled count >= capacity (organically full)
   - app `status` is no longer `'beta'` (promoted to live, demoted to
     development, etc. — the page must reflect current status, not stale
     data, if someone has an old link open)
5. **CTA behavior**: on app cards/detail pages, a `beta` app with open spots
   shows "Join the Beta" → `/signup?appId=X` in place of the existing "Visit"
   CTA. Once full/closed/unset, the CTA falls back to today's existing
   default logic (`Visit` if `app_url` is set, otherwise nothing).

## Data model — `cofabri-core`

Add one nullable column via migration:

```sql
alter table apps add column beta_capacity int null;
```

No `filled`/`spots_used` column. Filled count is always a live query:

```sql
select count(*) from site_beta
where app_id = :app_id
  and type = 'waitlist'
  and status in ('new', 'approved');
```

Rationale for `status in ('new', 'approved')`: a spot is "held" once someone
signs up and hasn't been rejected. `denied` frees the spot back up (the admin
rejected them). `draft` never held a spot (incomplete/not a real
submission). This determines whether declining someone re-opens their slot,
which matters for how admins manage a full beta.

**Admin UI**: add a "Beta capacity" number input to the existing app edit
form (`components/applications/application-edit-shared.tsx`), alongside
`ApplicationEditFormState`, `applicationToEditFormState`, and
`applicationEditFormToUpdate`. No new admin page — the existing
`/dashboard/site/beta` table already lists and moderates signups per app.

## API contract — `cofabri-api`

`WebContentService.getAppByAppId()` (`src/services/WebContentService.js`):

- Add `beta_capacity` to `PUBLIC_APP_COLUMNS` (it's a public-safe field, no
  secrets).
- Compute `beta_spots_filled` via the live count query above and attach it to
  the response alongside `beta_capacity`.

`WebFormsService.submitWaitlistSignup()`:

- Add a server-side guard: before inserting, re-check capacity/status and
  reject with `400` if the app is full, closed, or no longer `beta`. This is
  a correctness guard against a race (or a direct API call bypassing the
  UI), not just a UX nicety — the UI hiding the form is not sufficient on its
  own.
- Fix an existing small gap while touching this endpoint: `quote` and
  `statement` are already collected by the website form
  (`SignupPageContent.tsx`) but silently dropped — persist them to
  `site_beta.quote` / `site_beta.statement`.

## Website logic — `cofabri-website`

`src/app/api/apps/[id]/route.ts`: stop hardcoding `betaSpotsTotal` /
`betaSpotsFilled` to `0`/empty; pass through the real `beta_capacity` /
`beta_spots_filled` fields from the `cofabri-api` response. Update
`src/lib/api-client.ts` types (`AppRow`/`App`/`mapApp`) to match.

`src/app/signup/SignupPageContent.tsx`: replace the current always-false
gate with real state handling, evaluated in this priority order:

1. Current app `status !== 'beta'` → contextual message ("this app is now
   live" / "this app is back in development", depending on status), no spot
   data, no form.
2. `beta_capacity == null` → "Beta signups aren't open yet" block, no form.
3. `beta_capacity === 0` → "Beta signups are closed" block, no form.
4. `beta_spots_filled >= beta_capacity` → "All spots are filled" block, no
   form.
5. Otherwise → existing progress bar UI + form, now driven by real numbers.

Approved `betaStatements` (testimonial quotes) continue to render regardless
of spot state — closing signups doesn't mean hiding social proof.

`src/lib/app-display.ts`: extend the CTA logic so `beta`-status apps with
`beta_capacity` set and spots remaining resolve to `actionLabel: "Join the
Beta"` / `actionHref: /signup?appId=X`, in place of `Visit`. This is read by
both `AppPreviewCard.tsx` and the app detail page, so no separate change is
needed there — they inherit it through the shared helper.

## Edge cases covered

| Condition | Behavior |
|---|---|
| `beta_capacity` never set | Block: "not open yet", no form |
| `beta_capacity = 0` | Block: "closed", no form |
| filled >= capacity | Block: "full", no form |
| status flips away from `beta` while page is open | Contextual block reflecting current status, no stale spot data |
| status flips away from `beta` while an admin has capacity set | CTA on cards/detail reverts to default (`Visit`/none); `/signup` link becomes stale but is guarded by (1) above |
| Someone is `denied` after signing up | Their spot frees up (counted out of `beta_spots_filled`) |
| Direct/API submission after the page should be hidden | Rejected server-side with 400 in `submitWaitlistSignup` |
| Approved testimonial quotes for a now-full/closed app | Still shown — capacity gates the form, not social proof |

## Testing

- Unit-level: exercise the 5 signup-page states above with mocked API
  responses (not-beta, null capacity, zero capacity, full, open-with-room).
- Manual/browser verification: one app with room, one at capacity, one with
  `beta_capacity = 0`, one with null capacity, and one whose status is
  flipped away from `beta` — confirm each renders the correct block/CTA and
  the form is genuinely absent (not just visually hidden) when it shouldn't
  be submittable.
- Verify the `cofabri-api` 400 guard directly (e.g. via curl) against a
  full/closed app, independent of the website UI.

## Out of scope

- Contact-form leads counting toward capacity (explicitly decided against).
- A running/manual `beta_spots_filled` column — always computed live.
- New admin page for capacity — reuses the existing app edit form and beta
  moderation table.
- Changes to the `development`-status waitlist funnel's existing (separately
  broken/stubbed) behavior.
