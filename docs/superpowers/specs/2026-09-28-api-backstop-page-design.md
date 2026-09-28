# API Backstop Page: Design

Date: 2026-09-28
Repo: cofabri-website
Status: Draft for review

## Goal

When cofabri-api is unreachable, every page on cofabri.com shows a designed
backstop page instead of blank or broken content. Visitors who arrive to check
"is it us?" get a calm, honest answer. The backstop must work when everything
else is down, so it depends on nothing outside its own HTML.

## Why this is needed (current behavior)

- `src/lib/api-client.ts` catches fetch errors and returns `[]`/`null`, so during
  an outage pages render empty (no apps, no articles) with no explanation.
- `api-client.ts:18` calls `fetch` with no timeout, so a hung API stalls renders.
  Only `status-api.ts` has a 10s abort.
- `src/app/layout.tsx` calls `getAccountIdentity` (an API call) on every request.
- There is no `error.tsx` or `global-error.tsx`.

## Decisions already made

- **Scope: every page.** Any request while the API is down gets the backstop.
  This includes `/status`, whose data comes from cofabri-api and cannot work
  during an outage anyway.
- **Approach: probe before render**, not throw-and-catch in `api-client.ts`
  (too invasive: about 15 call sites rely on swallow-and-return-empty) and not a
  client-side ping (flashes broken content, invisible to crawlers).
- **Visual design:** delivered in Claude Design project
  `27182ef4-ca6e-445b-b857-214abf4c8f61`. The self-contained reference build is
  `backstop/index.html`; the design board is `CoFabri Backstop Page.dc.html`.
  Implementation ports the reference build's markup, CSS and copy faithfully.

## Architecture

### 1. Detection: `src/lib/api-health.ts`

`getApiHealth(): Promise<'up' | 'down'>`

- Probe: `GET ${COFABRI_API_BASE_URL}/` with `Accept: application/json`,
  `cache: 'no-store'`, `AbortSignal.timeout(3000)`. The API's root route returns
  a plain JSON status body for health checks (`cofabri-api/src/index.js`).
- Note: the API root returns static JSON without touching the database, so this
  detects host, network and process outages, not a database-only failure. The
  probe path is one constant if that needs to change.
- `down` = network error, timeout, or HTTP 5xx. Any other status (including 4xx)
  means the API answered, so `up`.
- If `COFABRI_API_BASE_URL` is unset, return `up` (misconfiguration is not an
  outage; existing code already throws its own clear error).
- In-memory result cache per runtime instance: `up` for 15s, `down` for 5s (so
  recovery shows quickly). Concurrent callers share one in-flight probe.
- **Fail open:** any unexpected error inside the health logic returns `up`. A bug
  in the backstop must never take down a healthy site.

### 2. Serving: `src/middleware.ts`

The existing middleware gains a first step, ahead of its current redirects and
preview-password logic. Its matcher already excludes `api/` (and exactly `api`,
so a path such as `/apifoo` is still handled), `_next/static`, `_next/image` and
`favicon.ico`. Static asset paths (extensions png, jpg, jpeg, gif, svg, ico,
webp, avif, woff, woff2, ttf, otf, js, css, json, txt, xml, map, webmanifest,
html), such as `status-widget.js`, `manifest.json`, `robots.txt`, `sitemap.xml`
and Google Search Console verification files (`google….html`), are excluded inside the backstop handler, because a matcher must
be a static literal.

- If `getApiHealth()` is `down`: rewrite the request to internal route
  `/backstop` with status **503**, and set:
  - `Retry-After: 30`
  - `Cache-Control: no-store`
  - `X-Robots-Tag: noindex`
  - request header `x-cofabri-backstop: 1` (forwarded to the rewritten request)
- Direct requests to `/backstop` when not in backstop or preview mode redirect
  to `/`.
- The visitor's requested page never renders, so no API-dependent code runs and
  nothing hangs.

### 3. Root layout: `src/app/layout.tsx`

- Read `x-cofabri-backstop` via `headers()`. When present, return a bare
  `<html lang="en"><body><BackstopPage/></body></html>` and skip everything else:
  `getDeveloperPortalAccessToken`, `getAccountIdentity`, `Navbar`, `ThemeProvider`,
  `Analytics`, `VercelAnalytics`, `CookieConsent`, `MarketingPopupWrapper`,
  `SitewideBanner`, `Footer`, and the external icon `<link>`s.
- The `/backstop` page (`src/app/backstop/page.tsx`) renders nothing of its own in
  this mode; the layout owns the output. It also exports `robots: noindex`.
- `src/app/global-error.tsx` (new) renders the same `BackstopPage` inside its own
  `<html><body>`, as the safety net if the layout or a page crashes. The support
  address is a code constant, so it renders here exactly as in the layout.

### 4. The page: `src/components/backstop/BackstopPage.tsx`

Server component that composes a small client component (`BackstopActions`). Ported from `backstop/index.html`:

- All CSS inlined in a `<style>` tag, using the reference build's tokens and
  `prefers-color-scheme` dark theme. System font stack only. No external images,
  fonts or scripts. All motion stops under `prefers-reduced-motion`.
- Content: status pill ("Temporarily unavailable"), headline "We're not quite
  connecting.", lead paragraph, Try again button, Contact support link,
  "Your data is safe." line, footer "© {year} CoFabri by Maven X LLC".
- Retry: a plain `?retry=` link enhanced by a small `BackstopActions` client
  component (React state applied in effects, so nothing mutates server-rendered
  DOM before hydration; an earlier inline-script version caused hydration error
  #418). It provides the loading ('Checking...') and still-down ('Still not
  connecting as of 9:14 PM') states and resets on back/forward-cache restore.
  Without JS it is still a working reload link.
- Motif: the design's '5a Signal Ripples' (three thin brand-blue rings expanding
  from a still mark every 2.5s; a faint static ring under reduced motion), taken
  from the design project's `backstop/index.html`.
- Live-status slot: rendered only when the component receives a `note` prop
  (`{ time: string; body: string }`). Production passes none. It exists for the
  preview and for a future independent status source.
- **Support address:** the constant `BACKSTOP_SUPPORT_EMAIL` in
  `src/lib/backstop.ts` (`support@cofabri.com`), the default for the Contact
  support link. It is a code constant rather than an env var so every render
  path (layout and `global-error`) shows it identically.
- **Logo:** ships the design's stand-in wordmark (system bold text plus inline SVG
  mark), which is font-independent enough for a fallback. The real lockup is not
  available as SVG in this repo (`CofabriLogo` serves PNGs from
  `files.cofabri.com`, which the backstop cannot rely on). Swapping in an
  outlined-SVG lockup later is a one-component change.

### 5. Preview: seeing it without an outage

`/?backstop=preview` (any path works) forces the backstop.

- Optional params: `&state=retry` (still-not-connecting message), `&state=loading`
  (button frozen in its loading state), `&note=1` (populated live-status slot with
  sample text).
- Returns **200** (not 503), `noindex`, with a small "Preview" tag on the page so
  it is never mistaken for a real outage.
- Access follows the site's existing `PREVIEW_PASSWORD` pattern: on production it
  requires `&password=<PREVIEW_PASSWORD>` (open if the env var is unset, matching
  `/preview/*` behavior); local development and Vercel preview deployments
  (`VERCEL_ENV !== 'production'`) are open. This prevents anyone from producing a
  fake "outage" screenshot on cofabri.com.
- Preview mode uses the same rewrite path and layout branch as a real outage, so
  what you preview is what ships.

## Error handling and edge cases

- Probe slow but succeeding (over 3s) counts as down. Better a short backstop
  than a hung page.
- A flapping API is smoothed by the 5s and 15s cache windows.
- Static assets, `/api/*` routes and the status widget files are never
  intercepted, so embeds in other apps keep their own error handling.
- During an outage the backstop takes precedence over the site's other
  middleware behavior (redirects, the `/preview/*` gate), by design ("every
  page").
- State changes of the health probe (first `down`, and each change after) are
  logged with `console.warn`.
- Cache is per runtime instance, so a fresh serverless instance probes once on
  its first request. That is at most one small request per instance per window.

## Testing

- **Unit (`api-health.test.ts`):** timeout, 5xx, 4xx, network error, unset env,
  cache TTLs for both states, in-flight dedupe, fail-open on internal error.
- **Middleware tests:** down produces 503 with the three headers and the
  rewrite, up passes through, matcher excludes assets and `/api`, preview gating
  (production with and without password, non-production), direct `/backstop`
  redirect, existing redirects still work.
- **Component test:** `BackstopPage` renders with and without `note`, with and
  without support email; contains no external URLs.
- **Playwright:** run against a dev server with `COFABRI_API_BASE_URL` pointing at
  a closed port. Asserts status 503, headline visible, no requests to any host
  other than the origin, and screenshots light and dark at 1440 and 390 widths.
- Before any push: run the repo's full CI gates (lint, typecheck, tests, build)
  per `.github/workflows` and check the CI run after pushing.

## Out of scope

- An independent status source for the live-status slot (the slot is built and
  previewable; wiring real content is a later change).
- Changing `api-client.ts` error semantics.
- Any change to cofabri-api.
- Applying the same backstop to other apps (Medoura, Praxis, Gathr). This design
  is website-only, though `BackstopPage` and `api-health` are written to be liftable.

## Open items

- Optional: supply the outlined-SVG CoFabri lockup to replace the stand-in wordmark.
