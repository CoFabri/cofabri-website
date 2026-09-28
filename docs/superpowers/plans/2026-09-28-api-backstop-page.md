# API Backstop Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When cofabri-api is unreachable, every cofabri.com page serves a self-contained, designed backstop page with a real 503, and the page can be previewed on demand with a URL param.

**Architecture:** `src/middleware.ts` probes cofabri-api (cached, 3s timeout, fail-open) before any page renders. On failure it rewrites to an internal `/backstop` route with status 503 and forwards `x-cofabri-backstop*` request headers; `RootLayout` sees the header and returns a bare shell containing only `BackstopPage`, skipping every API-dependent component. `/?backstop=preview` takes the same path with status 200 and is gated like the existing `/preview/*` routes. `global-error.tsx` renders the same component as a crash safety net.

**Tech Stack:** Next.js 16.1.7 (App Router, `middleware.ts`), React 18, TypeScript, Vitest (node env), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-api-backstop-page-design.md`. Visual reference (self-contained build): Claude Design project `27182ef4-ca6e-445b-b857-214abf4c8f61`, file `backstop/index.html`.

## Global Constraints

- Probe: `GET ${COFABRI_API_BASE_URL}/` with `Accept: application/json`, `cache: 'no-store'`, `AbortSignal.timeout(3000)`.
- Down = network error, timeout, or HTTP status >= 500. Any other status (including 4xx) = up.
- Unset `COFABRI_API_BASE_URL` = up. Any unexpected error inside health logic = up (fail open).
- Cache: `up` for 15s, `down` for 5s, per runtime instance; concurrent callers share one in-flight probe.
- Backstop outage response: status 503, `Retry-After: 30`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- Preview: `/?backstop=preview`, optional `&state=retry|loading`, `&note=1`; status 200, noindex, visible "Preview" tag. Allowed when `VERCEL_ENV !== 'production'`; on production requires `&password=<PREVIEW_PASSWORD>` (open if `PREVIEW_PASSWORD` unset).
- Middleware never intercepts `/api/*`, `_next/*`, or static asset paths (extensions: png, jpg, jpeg, gif, svg, ico, webp, avif, woff, woff2, ttf, otf, js, css, json, txt, xml, map, webmanifest).
- The backstop page has no external URLs, no external fonts/images/scripts, system font stack only, and stops all motion under `prefers-reduced-motion`.
- Support address comes from `BACKSTOP_SUPPORT_EMAIL`; when unset the "Contact support" link is omitted (no placeholder address).
- Copy is verbatim from the design: pill "Temporarily unavailable"; headline "We're not quite connecting."; lead "Parts of CoFabri aren't loading right now, and that may include the app that sent you here. Our team has been alerted, so there's nothing you need to do."; buttons "Try again" / "Checking…"; link "Contact support"; still-down line "Still not connecting as of <time>. Give it a minute and try again."; reassurance "**Your data is safe.** We'll have things running again as soon as we can."; footer "© <year> CoFabri by Maven X LLC".
- Repo commands: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test`, `npm run test:e2e` (CI runs exactly these, see `.github/workflows/ci.yml`).
- Commit messages end with these two trailers, as separate `-m` paragraphs:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn`.
- Work on branch `feat/backstop-page` (already checked out, spec committed).

## Review Focus

1. API answers with a 4xx (for example 401 or 404 on `/`): treated as up; the site renders normally, never the backstop (Task 2).
2. A client sending a forged `x-cofabri-backstop: outage` header on a normal request must not get the backstop shell; middleware strips it (Task 4).
3. `?backstop=preview` on production with a wrong or missing password must behave like a normal page, ignoring the param; direct `/backstop` visits redirect to `/` (Tasks 1 and 4).
4. `COFABRI_API_BASE_URL` set with a trailing slash must probe `.../`, not `...//` (Task 2).
5. `BACKSTOP_SUPPORT_EMAIL` unset omits the link; an email containing quotes or angle brackets renders escaped, never as markup (Task 3).

Known limitation (documented, not tested): the API root returns static JSON without touching the database, so the probe detects host, network and process outages, not a database-only failure. The probe URL is one constant in `api-health.ts` if that ever needs to change.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/backstop.ts` (new) | Header names, mode/state parsing, preview-allowed rule, sample note. Pure functions. |
| `src/lib/backstop.test.ts` (new) | Tests for the above. |
| `src/lib/api-health.ts` (new) | `getApiHealth()` probe with cache, dedupe, fail-open. |
| `src/lib/api-health.test.ts` (new) | Tests for the above. |
| `src/components/backstop/backstop-assets.ts` (new) | `BACKSTOP_CSS` and `BACKSTOP_RETRY_SCRIPT` string constants. |
| `src/components/backstop/BackstopPage.tsx` (new) | The page component. |
| `src/components/backstop/BackstopPage.test.tsx` (new) | Renders to static markup and asserts. |
| `src/lib/backstop-middleware.ts` (new) | `handleBackstop(request)` and `stripBackstopHeaders(headers)`. |
| `src/lib/backstop-middleware.test.ts` (new) | Tests for the above. |
| `src/middleware.ts` (modify) | Call `handleBackstop` first; sanitize forwarded headers. |
| `src/middleware.test.ts` (new) | Existing redirects still work; header stripping end to end. |
| `src/app/layout.tsx` (modify) | Backstop branch at the top of `RootLayout`. |
| `src/app/backstop/page.tsx` (new) | Route target for the rewrite; metadata only. |
| `src/app/global-error.tsx` (new) | Crash safety net. |
| `tests/e2e/backstop.spec.ts` (new) | Real-outage and preview end-to-end tests. |
| `playwright.config.ts` (modify) | Second web server on port 3100 with a dead API URL. |
| `README.md` (modify) | Document `BACKSTOP_SUPPORT_EMAIL` and the preview URL. |
| `docs/superpowers/specs/2026-09-28-api-backstop-page-design.md` (modify) | Three small corrections found while planning. |

---

### Task 1: Backstop helpers (`src/lib/backstop.ts`)

**Files:**
- Create: `src/lib/backstop.ts`
- Test: `src/lib/backstop.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Tasks 3, 4, 5):
  - `BACKSTOP_HEADER = 'x-cofabri-backstop'`, `BACKSTOP_STATE_HEADER = 'x-cofabri-backstop-state'`, `BACKSTOP_NOTE_HEADER = 'x-cofabri-backstop-note'`, `BACKSTOP_PATH = '/backstop'`
  - `type BackstopMode = 'outage' | 'preview'`
  - `type BackstopInitialState = 'idle' | 'loading' | 'retry'`
  - `interface BackstopNote { time: string; body: string }`
  - `SAMPLE_BACKSTOP_NOTE: BackstopNote`
  - `parseBackstopMode(value: string | null): BackstopMode | null`
  - `parseInitialState(value: string | null): BackstopInitialState`
  - `isBackstopPreviewRequested(params: URLSearchParams): boolean`
  - `previewOptions(params: URLSearchParams): { state: BackstopInitialState; note: boolean }`
  - `isPreviewAllowed(params: URLSearchParams, env: { vercelEnv?: string; previewPassword?: string }): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/lib/backstop.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  BACKSTOP_HEADER,
  BACKSTOP_PATH,
  SAMPLE_BACKSTOP_NOTE,
  isBackstopPreviewRequested,
  isPreviewAllowed,
  parseBackstopMode,
  parseInitialState,
  previewOptions,
} from './backstop';

describe('constants', () => {
  it('exposes the header name and route path', () => {
    expect(BACKSTOP_HEADER).toBe('x-cofabri-backstop');
    expect(BACKSTOP_PATH).toBe('/backstop');
    expect(SAMPLE_BACKSTOP_NOTE.body.length).toBeGreaterThan(0);
  });
});

describe('parseBackstopMode', () => {
  it('accepts only the two known modes', () => {
    expect(parseBackstopMode('outage')).toBe('outage');
    expect(parseBackstopMode('preview')).toBe('preview');
    expect(parseBackstopMode('1')).toBeNull();
    expect(parseBackstopMode('')).toBeNull();
    expect(parseBackstopMode(null)).toBeNull();
  });
});

describe('parseInitialState', () => {
  it('maps unknown values to idle', () => {
    expect(parseInitialState('retry')).toBe('retry');
    expect(parseInitialState('loading')).toBe('loading');
    expect(parseInitialState('idle')).toBe('idle');
    expect(parseInitialState('<script>')).toBe('idle');
    expect(parseInitialState(null)).toBe('idle');
  });
});

describe('isBackstopPreviewRequested', () => {
  it('requires backstop=preview exactly', () => {
    expect(isBackstopPreviewRequested(new URLSearchParams('backstop=preview'))).toBe(true);
    expect(isBackstopPreviewRequested(new URLSearchParams('backstop=1'))).toBe(false);
    expect(isBackstopPreviewRequested(new URLSearchParams(''))).toBe(false);
  });
});

describe('previewOptions', () => {
  it('reads state and note, defaulting safely', () => {
    expect(previewOptions(new URLSearchParams('backstop=preview'))).toEqual({ state: 'idle', note: false });
    expect(previewOptions(new URLSearchParams('state=retry&note=1'))).toEqual({ state: 'retry', note: true });
    expect(previewOptions(new URLSearchParams('state=loading'))).toEqual({ state: 'loading', note: false });
    expect(previewOptions(new URLSearchParams('state=bogus&note=yes'))).toEqual({ state: 'idle', note: false });
  });
});

describe('isPreviewAllowed', () => {
  const params = (q: string) => new URLSearchParams(q);

  it('is open outside production', () => {
    expect(isPreviewAllowed(params(''), { vercelEnv: undefined, previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'preview', previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'development', previewPassword: 'secret' })).toBe(true);
  });

  it('on production, requires the preview password', () => {
    expect(isPreviewAllowed(params('password=secret'), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params('password=wrong'), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(false);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(false);
  });

  it('on production, is open when no password is configured (matches /preview/*)', () => {
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: undefined })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: '' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/backstop.test.ts`
Expected: FAIL, "Failed to resolve import './backstop'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/backstop.ts`:

```ts
// Shared vocabulary for the API backstop page. Pure functions only, so the
// middleware, the root layout and the tests all agree on one definition.

export const BACKSTOP_HEADER = 'x-cofabri-backstop';
export const BACKSTOP_STATE_HEADER = 'x-cofabri-backstop-state';
export const BACKSTOP_NOTE_HEADER = 'x-cofabri-backstop-note';
export const BACKSTOP_PATH = '/backstop';

export type BackstopMode = 'outage' | 'preview';
export type BackstopInitialState = 'idle' | 'loading' | 'retry';

export interface BackstopNote {
  time: string;
  body: string;
}

// Shown by /?backstop=preview&note=1 so the live-status slot can be reviewed
// before a real independent status source exists.
export const SAMPLE_BACKSTOP_NOTE: BackstopNote = {
  time: '21:05 UTC',
  body: "We've traced this to our hosting provider and are working with them on it. Some apps may load slowly or not at all until it's resolved.",
};

export function parseBackstopMode(value: string | null): BackstopMode | null {
  return value === 'outage' || value === 'preview' ? value : null;
}

export function parseInitialState(value: string | null): BackstopInitialState {
  return value === 'retry' || value === 'loading' ? value : 'idle';
}

export function isBackstopPreviewRequested(params: URLSearchParams): boolean {
  return params.get('backstop') === 'preview';
}

export function previewOptions(params: URLSearchParams): { state: BackstopInitialState; note: boolean } {
  return {
    state: parseInitialState(params.get('state')),
    note: params.get('note') === '1',
  };
}

// Mirrors the /preview/* gate in middleware.ts: open when no password is
// configured, otherwise the password param must match. Non-production
// deployments (local dev, Vercel previews) are always open.
export function isPreviewAllowed(
  params: URLSearchParams,
  env: { vercelEnv?: string; previewPassword?: string },
): boolean {
  if (env.vercelEnv !== 'production') return true;
  if (!env.previewPassword) return true;
  return params.get('password') === env.previewPassword;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/backstop.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/backstop.ts src/lib/backstop.test.ts
git commit -m "feat(backstop): shared helpers for modes, preview gating and headers" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 2: API health probe (`src/lib/api-health.ts`)

**Files:**
- Create: `src/lib/api-health.ts`
- Test: `src/lib/api-health.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (used by Task 4): `type ApiHealth = 'up' | 'down'`; `getApiHealth(): Promise<ApiHealth>`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/api-health.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getApiHealth', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T12:00:00Z'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.COFABRI_API_BASE_URL;
    else process.env.COFABRI_API_BASE_URL = originalBaseUrl;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const load = async () => (await import('./api-health')).getApiHealth;

  it('is up when the API answers 200, probing the root with a JSON accept header and timeout', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();

    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cofabri.com/',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([401, 403, 404, 429])('is up when the API answers %i (it is alive)', async (status) => {
    global.fetch = vi.fn().mockResolvedValue({ status });
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('up');
  });

  it.each([500, 502, 503, 504])('is down when the API answers %i', async (status) => {
    global.fetch = vi.fn().mockResolvedValue({ status });
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('is down on a network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('is down on a timeout abort', async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('down');
  });

  it('is up when COFABRI_API_BASE_URL is unset, without probing', async () => {
    delete process.env.COFABRI_API_BASE_URL;
    global.fetch = vi.fn();
    const getApiHealth = await load();
    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not double the slash when the base URL has a trailing slash', async () => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com/';
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledWith('https://api.cofabri.com/', expect.anything());
  });

  it('caches an up result for 15 seconds', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();

    await getApiHealth();
    vi.advanceTimersByTime(14_000);
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    await getApiHealth();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('caches a down result for only 5 seconds so recovery shows quickly', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });
    const getApiHealth = await load();

    expect(await getApiHealth()).toBe('down');
    vi.advanceTimersByTime(4_000);
    expect(await getApiHealth()).toBe('down');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    expect(await getApiHealth()).toBe('up');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight probe between concurrent callers', async () => {
    let resolveFetch!: (value: { status: number }) => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const getApiHealth = await load();

    const first = getApiHealth();
    const second = getApiHealth();
    resolveFetch({ status: 200 });

    expect(await first).toBe('up');
    expect(await second).toBe('up');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fails open when the health logic itself throws', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const getApiHealth = await load();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await getApiHealth()).toBe('up');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/api-health.test.ts`
Expected: FAIL, "Failed to resolve import './api-health'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/api-health.ts`:

```ts
// Is cofabri-api answering at all? Used by middleware to decide whether to
// serve the backstop page. Deliberately conservative: only a network error,
// a timeout or a 5xx counts as down, and any unexpected failure inside this
// module counts as up, so a bug here can never take down a healthy site.
//
// The root route returns static JSON without touching the database, so this
// detects host/network/process outages, not a database-only failure. To probe
// something deeper, change PROBE_PATH.

export type ApiHealth = 'up' | 'down';

const PROBE_PATH = '/';
const PROBE_TIMEOUT_MS = 3_000;
const UP_TTL_MS = 15_000;
// Short, so the backstop clears quickly once the API recovers.
const DOWN_TTL_MS = 5_000;

let cached: { health: ApiHealth; expiresAt: number } | null = null;
let inFlight: Promise<ApiHealth> | null = null;

async function probe(baseUrl: string): Promise<ApiHealth> {
  try {
    const response = await fetch(`${baseUrl}${PROBE_PATH}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.status >= 500 ? 'down' : 'up';
  } catch {
    return 'down';
  }
}

export async function getApiHealth(): Promise<ApiHealth> {
  try {
    const rawBaseUrl = process.env.COFABRI_API_BASE_URL;
    if (!rawBaseUrl) return 'up';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    const now = Date.now();
    if (cached && now < cached.expiresAt) return cached.health;

    if (!inFlight) {
      inFlight = probe(baseUrl)
        .then((health) => {
          cached = { health, expiresAt: Date.now() + (health === 'up' ? UP_TTL_MS : DOWN_TTL_MS) };
          return health;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return await inFlight;
  } catch (error) {
    console.error('api-health check failed internally; treating API as up:', error);
    return 'up';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/api-health.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-health.ts src/lib/api-health.test.ts
git commit -m "feat(backstop): cached, fail-open cofabri-api health probe" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 3: The page (`BackstopPage` and its assets)

**Files:**
- Create: `src/components/backstop/backstop-assets.ts`
- Create: `src/components/backstop/BackstopPage.tsx`
- Test: `src/components/backstop/BackstopPage.test.tsx`

**Interfaces:**
- Consumes (Task 1): `BackstopInitialState`, `BackstopNote` from `@/lib/backstop`.
- Produces (used by Task 5):
  `default function BackstopPage(props: BackstopPageProps): JSX.Element` where
  `interface BackstopPageProps { supportEmail?: string; note?: BackstopNote; initialState?: BackstopInitialState; preview?: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/backstop/BackstopPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BackstopPage from './BackstopPage';
import { SAMPLE_BACKSTOP_NOTE } from '@/lib/backstop';

const render = (props: Parameters<typeof BackstopPage>[0] = {}) => renderToStaticMarkup(<BackstopPage {...props} />);

describe('BackstopPage', () => {
  it('renders the core content', () => {
    const html = render();
    expect(html).toContain('Temporarily unavailable');
    expect(html).toContain('not quite connecting.');
    expect(html).toContain('Try again');
    expect(html).toContain('Your data is safe.');
    expect(html).toContain('CoFabri by Maven X LLC');
  });

  it('is self-contained: no external URLs, no external assets', () => {
    const html = render({ supportEmail: 'help@example.com', note: SAMPLE_BACKSTOP_NOTE });
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/url\(/);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<script[^>]*\ssrc=/i);
    expect(html).not.toMatch(/<link/i);
    expect(html).not.toMatch(/@import/);
  });

  it('honors reduced motion', () => {
    expect(render()).toContain('prefers-reduced-motion:reduce');
  });

  it('omits the Contact support link when no support email is configured', () => {
    expect(render()).not.toContain('Contact support');
    expect(render()).not.toContain('mailto:');
  });

  it('renders a mailto Contact support link when configured', () => {
    const html = render({ supportEmail: 'help@cofabri.com' });
    expect(html).toContain('href="mailto:help@cofabri.com"');
    expect(html).toContain('Contact support');
  });

  it('escapes a hostile support email instead of emitting markup', () => {
    const html = render({ supportEmail: '"><script>alert(1)</script>@x.com' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('hides the live-status slot without a note and shows it with one', () => {
    expect(render()).not.toContain('Latest update');
    const html = render({ note: SAMPLE_BACKSTOP_NOTE });
    expect(html).toContain('Latest update');
    expect(html).toContain('21:05 UTC');
    expect(html).toContain('hosting provider');
  });

  it('shows the Preview tag only in preview mode', () => {
    expect(render()).not.toContain('>Preview<');
    expect(render({ preview: true })).toContain('>Preview<');
  });

  it('carries the requested initial state on the root element', () => {
    expect(render()).not.toContain('data-state=');
    expect(render({ initialState: 'retry' })).toContain('data-state="retry"');
    expect(render({ initialState: 'loading' })).toContain('data-state="loading"');
  });

  it('keeps the retry link working without JavaScript', () => {
    expect(render()).toContain('id="bs-retry"');
    expect(render()).toContain('href="?retry=1"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/backstop/BackstopPage.test.tsx`
Expected: FAIL, "Failed to resolve import './BackstopPage'".

- [ ] **Step 3: Write the implementation**

Create `src/components/backstop/backstop-assets.ts` (CSS and script ported from the design's `backstop/index.html`; the body-level rules moved onto the `.bs` wrapper so the component can live inside any document):

```ts
// Everything the backstop page needs, as plain strings inlined into the
// document. No external requests: this renders when nothing else can load.

export const BACKSTOP_CSS = `
:root{--surface:#FFFFFF;--hairline:#E9ECEF;--ghost:#D9DFE3;--ink:#232E36;--ink-body:#36454F;--ink-muted:#5A6A75;--accent:#0B6BE6;--accent-hover:#0857BE;--on-accent:#FFFFFF;--brand:#3B82F6;--mark-core:#36454F;--status:#D98212;--status-halo:rgba(217,130,18,.14);
--font:"Instrument Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--gutter:clamp(20px,4vw,40px)}
@media (prefers-color-scheme:dark){:root{--surface:#171D22;--hairline:#2B353D;--ghost:#3A464F;--ink:#F1F4F6;--ink-body:#C9D2D8;--ink-muted:#9AA8B2;--accent:#5AA0F5;--accent-hover:#83B8F8;--on-accent:#0B1B2B;--mark-core:#E4EAEE;--status:#E9A33D;--status-halo:rgba(233,163,61,.16)}}
html,body{margin:0;background:var(--surface);color:var(--ink)}
.bs,.bs *{box-sizing:border-box}
.bs{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--surface);color:var(--ink);font:400 16px/1.6 var(--font);-webkit-font-smoothing:antialiased;overflow-wrap:break-word}
.bs .wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 var(--gutter)}
.bs header{border-bottom:1px solid var(--hairline)}
.bs header .wrap{height:68px;display:flex;align-items:center}
.bs .logo{display:inline-flex;align-items:flex-end;gap:3px;font-weight:700;font-size:21px;letter-spacing:-.03em;line-height:1;color:var(--mark-core)}
.bs .logo svg{display:block;margin-bottom:1px}
.bs main{flex:1;display:flex;align-items:center;padding:64px 0}
.bs main .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:80px;align-items:center}
.bs .copy{max-width:620px}
.bs .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 10px;border:1px solid var(--hairline);border-radius:999px;font-size:13px;font-weight:500;line-height:1.4;color:var(--ink-body)}
.bs .dot{width:8px;height:8px;border-radius:50%;background:var(--status);box-shadow:0 0 0 4px var(--status-halo);animation:bs-pulse 2.4s ease-in-out infinite}
.bs .float{animation:bs-drift 10s ease-in-out infinite}
.bs .ghost{animation:bs-dash 24s linear infinite}
.bs h1{margin:28px 0 0;font-size:clamp(2.125rem,1.2rem + 3.9vw,3.5rem);line-height:1.06;letter-spacing:-.03em;font-weight:600;text-wrap:balance}
.bs .lead{margin:20px 0 0;max-width:520px;font-size:clamp(1.0625rem,1rem + .3vw,1.1875rem);color:var(--ink-muted);text-wrap:pretty}
.bs .actions{margin-top:36px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}
.bs .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;min-width:152px;padding:0 24px;border-radius:9px;background:var(--accent);color:var(--on-accent);font-size:16px;font-weight:600;text-decoration:none;transition:background .18s cubic-bezier(.2,.7,.3,1)}
.bs .btn:hover{background:var(--accent-hover)}
.bs .link{padding:12px 2px;color:var(--accent);font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.bs .link:hover{color:var(--accent-hover)}
.bs a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:9px}
.bs .spin{display:none;width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;border-bottom-color:transparent;animation:bs-spin .8s linear infinite}
.bs .l-load{display:none}
.bs[data-state=loading] .spin,.bs[data-state=loading] .l-load{display:block}
.bs[data-state=loading] .l-idle{display:none}
.bs[data-state=loading] .btn{cursor:progress}
.bs .again{display:none;margin:14px 0 0;font-size:14px;color:var(--ink-body)}
.bs[data-state=retry] .again{display:block}
.bs .safe{margin:36px 0 0;max-width:520px;font-size:15px;color:var(--ink-muted)}
.bs .safe strong{color:var(--ink-body);font-weight:600}
.bs .note{margin-top:32px;padding-top:20px;border-top:1px solid var(--hairline);max-width:520px}
.bs .eyebrow{display:flex;gap:12px;font:500 12px/1.4 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}
.bs .note p{margin:8px 0 0;font-size:15px;color:var(--ink-body)}
.bs .motif{justify-self:end;width:100%;max-width:400px;height:auto}
.bs footer{border-top:1px solid var(--hairline)}
.bs footer .wrap{padding-top:24px;padding-bottom:24px;font-size:13px;color:var(--ink-muted)}
.bs .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.bs .tag{position:fixed;top:12px;right:12px;padding:4px 10px;border:1px dashed var(--ink-muted);border-radius:6px;font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);background:var(--surface)}
@keyframes bs-pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes bs-spin{to{transform:rotate(360deg)}}
@keyframes bs-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(-3.5px,3px)}}
@keyframes bs-dash{to{stroke-dashoffset:-48}}
@media (max-width:760px){
.bs header .wrap{height:56px}
.bs main{align-items:flex-start;padding:40px 0 56px}
.bs main .wrap{grid-template-columns:minmax(0,1fr);gap:0}
.bs .motif{order:-1;justify-self:start;width:104px;margin-bottom:28px}
.bs h1{margin-top:24px}
.bs .btn{flex:1 1 100%}
}
@media (prefers-reduced-motion:reduce){.bs .dot,.bs .spin,.bs .float,.bs .ghost{animation:none}.bs .btn{transition:none}}
`.trim();

// Retry button behavior. Works as a plain ?retry= link without JS; with JS it
// adds the loading state and the "still not connecting as of <time>" line.
export const BACKSTOP_RETRY_SCRIPT = `
(function(){var r=document.getElementById('bs'),b=document.getElementById('bs-retry');if(!r||!b)return;
var u=new URL(location.href);
if(u.searchParams.has('retry')||r.getAttribute('data-state')==='retry'){
if(r.getAttribute('data-state')!=='loading'){r.setAttribute('data-state','retry');}
var at=document.getElementById('bs-at');if(at){at.textContent=' as of '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}}
b.addEventListener('click',function(){u.searchParams.set('retry',String(Date.now()));b.href=u.toString();r.setAttribute('data-state','loading');var l=document.getElementById('bs-live');if(l){l.textContent='Checking our systems\\u2026';}});
})();
`.trim();
```

Create `src/components/backstop/BackstopPage.tsx`:

```tsx
import type { BackstopInitialState, BackstopNote } from '@/lib/backstop';
import { BACKSTOP_CSS, BACKSTOP_RETRY_SCRIPT } from './backstop-assets';

export interface BackstopPageProps {
  /** From BACKSTOP_SUPPORT_EMAIL. When absent, the Contact support link is omitted. */
  supportEmail?: string;
  /** Live-status slot content. When absent, the slot is not rendered. */
  note?: BackstopNote;
  initialState?: BackstopInitialState;
  /** Shows the "Preview" tag so a preview is never mistaken for a real outage. */
  preview?: boolean;
}

const MARK_PATH = 'M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z';

// Self-contained on purpose: inline CSS and SVG, system fonts, no imports from
// the rest of the site. It renders when cofabri-api (and anything that talks to
// it) is down, so it must not depend on any of it. Design source: Claude Design
// project 27182ef4-ca6e-445b-b857-214abf4c8f61, file backstop/index.html.
export default function BackstopPage({ supportEmail, note, initialState = 'idle', preview = false }: BackstopPageProps) {
  return (
    <div className="bs" id="bs" data-state={initialState === 'idle' ? undefined : initialState}>
      <style dangerouslySetInnerHTML={{ __html: BACKSTOP_CSS }} />
      {preview ? <div className="tag">Preview</div> : null}
      <header>
        <div className="wrap">
          <span className="logo" role="img" aria-label="CoFabri">
            CoFabri
            <svg width="10" height="10" viewBox="0 0 100 100" aria-hidden="true">
              <path d={MARK_PATH} fill="var(--brand)" />
            </svg>
          </span>
        </div>
      </header>
      <main>
        <div className="wrap">
          <div className="copy">
            <div className="pill">
              <span className="dot" aria-hidden="true" />
              Temporarily unavailable
            </div>
            <h1>We&rsquo;re not quite connecting.</h1>
            <p className="lead">
              Parts of CoFabri aren&rsquo;t loading right now, and that may include the app that sent you here. Our team has been
              alerted, so there&rsquo;s nothing you need to do.
            </p>
            <div className="actions">
              <a id="bs-retry" className="btn" href="?retry=1">
                <span className="spin" aria-hidden="true" />
                <span className="l-idle">Try again</span>
                <span className="l-load">Checking&hellip;</span>
              </a>
              {supportEmail ? (
                <a className="link" href={`mailto:${supportEmail}`}>
                  Contact support
                </a>
              ) : null}
            </div>
            <p className="again" role="status">
              Still not connecting<span id="bs-at" />. Give it a minute and try again.
            </p>
            <p className="safe">
              <strong>Your data is safe.</strong> We&rsquo;ll have things running again as soon as we can.
            </p>
            {note ? (
              <section className="note" aria-labelledby="bs-note-h">
                <div className="eyebrow">
                  <span id="bs-note-h">Latest update</span>
                  <time>{note.time}</time>
                </div>
                <p>{note.body}</p>
              </section>
            ) : null}
          </div>
          <svg className="motif" viewBox="-12 -12 124 124" aria-hidden="true">
            <path d={MARK_PATH} className="ghost" fill="none" stroke="var(--ghost)" strokeWidth=".45" strokeDasharray="1.6 1.6" />
            <g transform="translate(7 -6)">
              <g className="float">
                <path d={MARK_PATH} fill="var(--brand)" />
                <path d={MARK_PATH} fill="var(--surface)" transform="translate(15 15) scale(.7)" />
                <path d={MARK_PATH} fill="var(--mark-core)" transform="translate(32 32) scale(.36)" />
              </g>
            </g>
          </svg>
        </div>
      </main>
      <footer>
        <div className="wrap">&copy; {new Date().getFullYear()} CoFabri by Maven X LLC</div>
      </footer>
      <p id="bs-live" className="sr" aria-live="polite" />
      <script dangerouslySetInnerHTML={{ __html: BACKSTOP_RETRY_SCRIPT }} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/backstop/BackstopPage.test.tsx`
Expected: PASS. If vitest reports it cannot parse JSX, `tsconfig.json` uses `"jsx": "react-jsx"`, which Vite's esbuild honors; check that the file is named `.test.tsx` and that `vitest.config.mts` includes `src/**/*.test.tsx` (it does).

- [ ] **Step 5: Commit**

```bash
git add src/components/backstop
git commit -m "feat(backstop): self-contained backstop page component" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 4: Middleware integration

**Files:**
- Create: `src/lib/backstop-middleware.ts`
- Test: `src/lib/backstop-middleware.test.ts`
- Modify: `src/middleware.ts` (function signature; the single `NextResponse.next()` call)
- Test: `src/middleware.test.ts`

**Interfaces:**
- Consumes: Task 1 (all of `@/lib/backstop`), Task 2 (`getApiHealth` from `@/lib/api-health`).
- Produces (used by Task 5): forwarded request headers `x-cofabri-backstop` (`'outage' | 'preview'`), `x-cofabri-backstop-state` (`'idle' | 'loading' | 'retry'`), `x-cofabri-backstop-note` (`'1' | '0'`) on the rewrite to `/backstop`.
  `handleBackstop(request: NextRequest): Promise<NextResponse | null>`; `stripBackstopHeaders(headers: Headers): Headers`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/backstop-middleware.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-health', () => ({ getApiHealth: vi.fn() }));

import { getApiHealth } from '@/lib/api-health';
import { handleBackstop, stripBackstopHeaders } from './backstop-middleware';

const mockedHealth = vi.mocked(getApiHealth);
const req = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`https://cofabri.com${path}`, init);

describe('handleBackstop', () => {
  beforeEach(() => {
    mockedHealth.mockResolvedValue('up');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('passes through (null) when the API is up', async () => {
    expect(await handleBackstop(req('/apps'))).toBeNull();
  });

  it('serves the backstop with a 503 and the outage headers when the API is down', async () => {
    mockedHealth.mockResolvedValue('down');
    const res = await handleBackstop(req('/apps?x=1'));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    expect(res!.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
    expect(res!.headers.get('retry-after')).toBe('30');
    expect(res!.headers.get('cache-control')).toBe('no-store');
    expect(res!.headers.get('x-robots-tag')).toBe('noindex');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('outage');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-state')).toBe('idle');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-note')).toBe('0');
  });

  it.each([
    '/api/status',
    '/_next/static/chunks/a.js',
    '/_next/image?url=x',
    '/status-widget.js',
    '/app-status-widget.js',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/images/logo.PNG',
  ])('never intercepts %s, even when the API is down', async (path) => {
    mockedHealth.mockResolvedValue('down');
    expect(await handleBackstop(req(path))).toBeNull();
    expect(mockedHealth).not.toHaveBeenCalled();
  });

  it('serves the preview with 200, no Retry-After, without probing the API', async () => {
    const res = await handleBackstop(req('/?backstop=preview'));

    expect(res!.status).toBe(200);
    expect(res!.headers.get('retry-after')).toBeNull();
    expect(res!.headers.get('x-robots-tag')).toBe('noindex');
    expect(res!.headers.get('cache-control')).toBe('no-store');
    expect(res!.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('preview');
    expect(mockedHealth).not.toHaveBeenCalled();
  });

  it('forwards preview state and note options', async () => {
    const res = await handleBackstop(req('/apps?backstop=preview&state=retry&note=1'));
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-state')).toBe('retry');
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop-note')).toBe('1');
  });

  it('requires the password for the preview on production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');

    // Wrong or missing password: the param is ignored and the page behaves normally.
    expect(await handleBackstop(req('/?backstop=preview'))).toBeNull();
    expect(await handleBackstop(req('/?backstop=preview&password=wrong'))).toBeNull();

    const ok = await handleBackstop(req('/?backstop=preview&password=secret'));
    expect(ok!.status).toBe(200);
    expect(ok!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('preview');
  });

  it('a rejected preview on production still shows the real backstop if the API is down', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('PREVIEW_PASSWORD', 'secret');
    mockedHealth.mockResolvedValue('down');
    const res = await handleBackstop(req('/?backstop=preview&password=wrong'));
    expect(res!.status).toBe(503);
    expect(res!.headers.get('x-middleware-request-x-cofabri-backstop')).toBe('outage');
  });

  it('redirects direct visits to /backstop to the homepage', async () => {
    const res = await handleBackstop(req('/backstop'));
    expect(res!.status).toBe(307);
    expect(res!.headers.get('location')).toBe('https://cofabri.com/');
  });

  it('fails open if the health check throws', async () => {
    mockedHealth.mockRejectedValue(new Error('boom'));
    expect(await handleBackstop(req('/apps'))).toBeNull();
  });
});

describe('stripBackstopHeaders', () => {
  it('removes all backstop headers and keeps the rest', () => {
    const headers = new Headers({
      'x-cofabri-backstop': 'outage',
      'x-cofabri-backstop-state': 'retry',
      'x-cofabri-backstop-note': '1',
      'user-agent': 'test',
    });
    const cleaned = stripBackstopHeaders(headers);

    expect(cleaned.get('x-cofabri-backstop')).toBeNull();
    expect(cleaned.get('x-cofabri-backstop-state')).toBeNull();
    expect(cleaned.get('x-cofabri-backstop-note')).toBeNull();
    expect(cleaned.get('user-agent')).toBe('test');
    // The original is untouched.
    expect(headers.get('x-cofabri-backstop')).toBe('outage');
  });
});
```

Create `src/middleware.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-health', () => ({ getApiHealth: vi.fn() }));

import { getApiHealth } from '@/lib/api-health';
import { middleware } from './middleware';

const mockedHealth = vi.mocked(getApiHealth);
const req = (path: string, headers?: Record<string, string>) => new NextRequest(`https://cofabri.com${path}`, { headers });

describe('middleware', () => {
  beforeEach(() => {
    mockedHealth.mockResolvedValue('up');
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('still redirects /privacy to /legal', async () => {
    const res = await middleware(req('/privacy'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://cofabri.com/legal');
  });

  it('still redirects known-missing KB articles to the KB index', async () => {
    const res = await middleware(req('/knowledge-base/faq'));
    expect(res.headers.get('location')).toBe('https://cofabri.com/knowledge-base');
  });

  it('passes a normal request through', async () => {
    const res = await middleware(req('/apps'));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('serves the backstop when the API is down', async () => {
    mockedHealth.mockResolvedValue('down');
    const res = await middleware(req('/apps'));
    expect(res.status).toBe(503);
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://cofabri.com/backstop');
  });

  it('does not let a client force the backstop shell with forged headers', async () => {
    const res = await middleware(
      req('/apps', {
        'x-cofabri-backstop': 'outage',
        'x-cofabri-backstop-state': 'retry',
        'x-cofabri-backstop-note': '1',
      }),
    );
    expect(res.headers.get('x-middleware-request-x-cofabri-backstop')).toBeNull();
    const overridden = (res.headers.get('x-middleware-override-headers') ?? '').split(',');
    expect(overridden).not.toContain('x-cofabri-backstop');
    expect(overridden).not.toContain('x-cofabri-backstop-state');
    expect(overridden).not.toContain('x-cofabri-backstop-note');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/backstop-middleware.test.ts src/middleware.test.ts`
Expected: FAIL, "Failed to resolve import './backstop-middleware'" (first file) and the `middleware` tests fail on the missing backstop behavior.

- [ ] **Step 3: Write the implementation**

Create `src/lib/backstop-middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getApiHealth } from '@/lib/api-health';
import {
  BACKSTOP_HEADER,
  BACKSTOP_NOTE_HEADER,
  BACKSTOP_PATH,
  BACKSTOP_STATE_HEADER,
  isBackstopPreviewRequested,
  isPreviewAllowed,
  previewOptions,
  type BackstopInitialState,
  type BackstopMode,
} from '@/lib/backstop';

// Files served as-is that other sites and crawlers fetch directly; a 503 HTML
// page here would break embeds (status widgets) and SEO files.
const STATIC_ASSET = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf|js|css|json|txt|xml|map|webmanifest)$/i;

const BACKSTOP_HEADERS = [BACKSTOP_HEADER, BACKSTOP_STATE_HEADER, BACKSTOP_NOTE_HEADER];

// The layout trusts these request headers to switch into backstop mode, so a
// client-supplied copy must never reach it. Call this on every passthrough.
export function stripBackstopHeaders(headers: Headers): Headers {
  const cleaned = new Headers(headers);
  for (const name of BACKSTOP_HEADERS) cleaned.delete(name);
  return cleaned;
}

function rewriteToBackstop(
  request: NextRequest,
  mode: BackstopMode,
  status: number,
  options: { state: BackstopInitialState; note: boolean } = { state: 'idle', note: false },
): NextResponse {
  const headers = stripBackstopHeaders(request.headers);
  headers.set(BACKSTOP_HEADER, mode);
  headers.set(BACKSTOP_STATE_HEADER, options.state);
  headers.set(BACKSTOP_NOTE_HEADER, options.note ? '1' : '0');

  const response = NextResponse.rewrite(new URL(BACKSTOP_PATH, request.url), { status, request: { headers } });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');
  if (mode === 'outage') response.headers.set('Retry-After', '30');
  return response;
}

// Returns a response when this request should be handled by the backstop
// (outage, preview, or a direct /backstop visit), or null to carry on with the
// normal middleware. Fails open: any error here returns null.
export async function handleBackstop(request: NextRequest): Promise<NextResponse | null> {
  try {
    const { pathname, searchParams } = request.nextUrl;
    if (STATIC_ASSET.test(pathname)) return null;

    if (
      isBackstopPreviewRequested(searchParams) &&
      isPreviewAllowed(searchParams, {
        vercelEnv: process.env.VERCEL_ENV,
        previewPassword: process.env.PREVIEW_PASSWORD,
      })
    ) {
      return rewriteToBackstop(request, 'preview', 200, previewOptions(searchParams));
    }

    if (pathname === BACKSTOP_PATH) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if ((await getApiHealth()) === 'down') {
      return rewriteToBackstop(request, 'outage', 503);
    }

    return null;
  } catch (error) {
    console.error('Backstop handling failed; continuing normally:', error);
    return null;
  }
}
```

Modify `src/middleware.ts`. Add the imports at the top:

```ts
import { handleBackstop, stripBackstopHeaders } from '@/lib/backstop-middleware';
```

Change the function signature and add the backstop check as the first statements of the function. Replace:

```ts
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
```

with:

```ts
export async function middleware(request: NextRequest) {
  // First: if cofabri-api is down (or a backstop preview was requested), serve
  // the self-contained backstop page instead of any real page.
  const backstopResponse = await handleBackstop(request);
  if (backstopResponse) return backstopResponse;

  const { pathname, searchParams } = request.nextUrl;
```

Then replace the single line `const response = NextResponse.next();` with:

```ts
  // Strip any client-supplied backstop headers so only this middleware can
  // put the root layout into backstop mode.
  const response = NextResponse.next({ request: { headers: stripBackstopHeaders(request.headers) } });
```

Leave the `config.matcher` unchanged: static assets are excluded inside `handleBackstop`, because a matcher must be a static literal and the existing exclusions already cover `/api` and `_next`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/backstop-middleware.test.ts src/middleware.test.ts`
Expected: PASS. If the `x-middleware-request-...` header assertions fail because Next's header names differ in this version, print `[...res.headers.entries()]` in a scratch test to see the actual names, then adjust the assertions (the behavior under test is unchanged: forwarded on outage, absent after stripping).

- [ ] **Step 5: Commit**

```bash
git add src/lib/backstop-middleware.ts src/lib/backstop-middleware.test.ts src/middleware.ts src/middleware.test.ts
git commit -m "feat(backstop): middleware serves the backstop on outage or preview" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 5: Layout branch, `/backstop` route, `global-error`

**Files:**
- Modify: `src/app/layout.tsx` (imports; top of `RootLayout`)
- Create: `src/app/backstop/page.tsx`
- Create: `src/app/global-error.tsx`
- Test: `src/app/global-error.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`BACKSTOP_HEADER`, `BACKSTOP_STATE_HEADER`, `BACKSTOP_NOTE_HEADER`, `parseBackstopMode`, `parseInitialState`, `SAMPLE_BACKSTOP_NOTE`), Task 3 (`BackstopPage`), Task 4 (the forwarded headers).
- Produces: nothing later tasks import; Task 6 exercises the result over HTTP.

- [ ] **Step 1: Write the failing test**

Create `src/app/global-error.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from './global-error';

describe('GlobalError', () => {
  it('renders a complete document containing the backstop page', () => {
    const html = renderToStaticMarkup(<GlobalError />);
    expect(html).toContain('<html');
    expect(html).toContain('<title>Temporarily unavailable</title>');
    expect(html).toContain('not quite connecting.');
    expect(html).not.toMatch(/https?:\/\//);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/global-error.test.tsx`
Expected: FAIL, "Failed to resolve import './global-error'".

- [ ] **Step 3: Write the implementation**

Create `src/app/global-error.tsx`:

```tsx
'use client';

import BackstopPage from '@/components/backstop/BackstopPage';

// Last-resort safety net: if the root layout or a page crashes, show the same
// self-contained backstop instead of Next's bare error page. It omits the
// support link on purpose: BACKSTOP_SUPPORT_EMAIL is a server-only variable and
// this component also runs in the browser.
export default function GlobalError() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="robots" content="noindex" />
        <title>Temporarily unavailable</title>
      </head>
      <body>
        <BackstopPage />
      </body>
    </html>
  );
}
```

Create `src/app/backstop/page.tsx`:

```tsx
import type { Metadata } from 'next';

// Internal rewrite target for middleware. RootLayout sees the backstop header
// and renders the backstop itself, so this page renders nothing of its own; it
// exists so the route resolves and carries the title and robots metadata.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Temporarily unavailable',
  robots: { index: false, follow: false },
};

export default function BackstopRoutePage() {
  return null;
}
```

Modify `src/app/layout.tsx`. Add imports after the existing import block:

```tsx
import { headers } from "next/headers";
import BackstopPage from "@/components/backstop/BackstopPage";
import {
  BACKSTOP_HEADER,
  BACKSTOP_NOTE_HEADER,
  BACKSTOP_STATE_HEADER,
  SAMPLE_BACKSTOP_NOTE,
  parseBackstopMode,
  parseInitialState,
} from "@/lib/backstop";
```

Insert this block at the very top of the body of `RootLayout`, before `const accessToken = ...`:

```tsx
  // Backstop mode (set only by middleware): render a bare shell containing
  // just the self-contained backstop page. Everything below talks to
  // cofabri-api or external hosts, which is exactly what may be down.
  const requestHeaders = await headers();
  const backstopMode = parseBackstopMode(requestHeaders.get(BACKSTOP_HEADER));
  if (backstopMode) {
    return (
      <html lang="en">
        <head>
          <meta name="color-scheme" content="light dark" />
        </head>
        <body>
          <BackstopPage
            supportEmail={process.env.BACKSTOP_SUPPORT_EMAIL || undefined}
            initialState={parseInitialState(requestHeaders.get(BACKSTOP_STATE_HEADER))}
            preview={backstopMode === 'preview'}
            note={requestHeaders.get(BACKSTOP_NOTE_HEADER) === '1' ? SAMPLE_BACKSTOP_NOTE : undefined}
          />
        </body>
      </html>
    );
  }

```

- [ ] **Step 4: Run tests and static checks**

Run: `npx vitest run src/app/global-error.test.tsx && npx tsc --noEmit`
Expected: test PASS; `tsc` reports no errors.

Then a quick manual check against a dev server:

Run: `npm run dev` (background), then `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/?backstop=preview"`
Expected: `200`, and `curl -s "http://localhost:3000/?backstop=preview" | grep -c "not quite connecting"` prints `1`. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/backstop/page.tsx src/app/global-error.tsx src/app/global-error.test.tsx
git commit -m "feat(backstop): root layout backstop mode, /backstop route, global-error net" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 6: End-to-end tests (real outage and preview)

**Files:**
- Modify: `playwright.config.ts` (`webServer` becomes an array)
- Create: `tests/e2e/backstop.spec.ts`

**Interfaces:**
- Consumes: everything above, over HTTP.
- Produces: screenshots in `test-results/backstop/` for human review.

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/backstop.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

// Runs against a second server (port 3100) whose cofabri-api URL points at a
// closed port, so every page request sees a genuine outage. See
// playwright.config.ts.
test.use({ baseURL: 'http://localhost:3100' });

test.describe('real outage', () => {
  test('any page returns a 503 backstop with the outage headers', async ({ page }) => {
    const response = await page.goto('/apps');

    expect(response!.status()).toBe(503);
    expect(response!.headers()['retry-after']).toBe('30');
    expect(response!.headers()['x-robots-tag']).toBe('noindex');
    expect(response!.headers()['cache-control']).toBe('no-store');

    await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
    await expect(page.getByText('Temporarily unavailable')).toBeVisible();
    await expect(page.getByText('Your data is safe.')).toBeVisible();
    // Bare shell: none of the site chrome that talks to the API.
    await expect(page.locator('nav')).toHaveCount(0);
    await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
  });

  test('makes no requests to any other host', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://localhost:3100') && !url.startsWith('data:')) foreign.push(url);
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(foreign).toEqual([]);
  });

  test('the retry button reloads with ?retry= and shows the still-down message', async ({ page }) => {
    await page.goto('/apps');
    await page.getByRole('link', { name: 'Try again' }).click();
    await page.waitForURL(/retry=/);
    await expect(page.getByText(/Still not connecting as of/)).toBeVisible();
  });

  test('a forged backstop header from a client does not affect a normal path', async ({ request }) => {
    // /api/* is never intercepted, so this must not be the backstop HTML even
    // with the API down and a forged header.
    const response = await request.get('/api/status', { headers: { 'x-cofabri-backstop': 'outage' } });
    expect(await response.text()).not.toContain('not quite connecting');
  });

  test('direct /backstop visits redirect home', async ({ page }) => {
    // Home is itself the backstop during this outage, so assert on the URL.
    await page.goto('/backstop');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  for (const scheme of ['light', 'dark'] as const) {
    for (const [name, size] of [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ] as const) {
      test(`screenshot ${scheme} ${name}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.setViewportSize(size);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
        // No horizontal scroll at any width.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `test-results/backstop/${scheme}-${name}.png`, fullPage: true });
      });
    }
  }
});

test.describe('preview', () => {
  test('forces the backstop with a 200 and a Preview tag', async ({ page }) => {
    const response = await page.goto('/?backstop=preview');
    expect(response!.status()).toBe(200);
    expect(response!.headers()['retry-after']).toBeUndefined();
    await expect(page.getByText('Preview', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
  });

  test('state=retry shows the still-not-connecting line', async ({ page }) => {
    await page.goto('/?backstop=preview&state=retry');
    await expect(page.getByText(/Still not connecting as of/)).toBeVisible();
  });

  test('state=loading freezes the button in its loading state', async ({ page }) => {
    await page.goto('/?backstop=preview&state=loading');
    await expect(page.getByText('Checking…')).toBeVisible();
  });

  test('note=1 shows the populated live-status slot', async ({ page }) => {
    await page.goto('/?backstop=preview&note=1');
    await expect(page.getByText('Latest update')).toBeVisible();
    await expect(page.getByText(/hosting provider/)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/backstop.spec.ts --project=chromium`
Expected: FAIL, connection refused on `localhost:3100` (the second server does not exist yet).

- [ ] **Step 3: Add the second web server**

In `playwright.config.ts`, replace the `webServer` block:

```ts
  webServer: {
    command: 'npm run build && npm run start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: TURNSTILE_TEST_ENV,
  },
```

with an array (servers start in order, so the build finishes before the second `next start`):

```ts
  webServer: [
    {
      command: 'npm run build && npm run start',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: TURNSTILE_TEST_ENV,
    },
    {
      // Same build, but cofabri-api points at a closed port so every request
      // sees a genuine outage. Used only by tests/e2e/backstop.spec.ts. The
      // readiness URL is the preview form, which returns 200 (a real outage
      // returns 503, which Playwright would not treat as ready).
      command: 'npx next start -p 3100',
      url: 'http://localhost:3100/?backstop=preview',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...TURNSTILE_TEST_ENV, COFABRI_API_BASE_URL: 'http://127.0.0.1:9' },
    },
  ],
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/backstop.spec.ts --project=chromium`
Expected: PASS (all tests). If the 503 status assertion fails because the rewrite dropped the custom status, that means `NextResponse.rewrite(..., { status })` is not honored by this Next version: report it instead of working around it, since the spec requires a real 503.

Then run the whole e2e suite to confirm nothing else broke:

Run: `npm run test:e2e`
Expected: PASS.

Then view the four screenshots in `test-results/backstop/` (`light-desktop.png`, `dark-desktop.png`, `light-mobile.png`, `dark-mobile.png`) and compare them against the design board.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/backstop.spec.ts
git commit -m "test(backstop): e2e coverage for real outage and preview" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
```

---

### Task 7: Docs, spec corrections, CI gates, PR

**Files:**
- Modify: `README.md` (env section near line 118)
- Modify: `docs/superpowers/specs/2026-09-28-api-backstop-page-design.md`

**Interfaces:**
- Consumes: the finished implementation.
- Produces: a pushed branch and PR.

- [ ] **Step 1: Document the env var and preview URL**

Run: `sed -n 105,160p README.md` to see the env-var section, then add, right after the `COFABRI_API_BASE_URL=...` line (line 118), this line in the same style as its neighbors:

```
   BACKSTOP_SUPPORT_EMAIL=support_email_shown_on_the_outage_page   # optional; the "Contact support" link is omitted when unset
```

And add a short section at the end of the README:

```markdown
## Outage backstop page

When cofabri-api is unreachable, every page is replaced by a self-contained
backstop page (HTTP 503). To see it without an outage, open
`/?backstop=preview` (options: `&state=retry`, `&state=loading`, `&note=1`).
On production it requires `&password=<PREVIEW_PASSWORD>`; local development and
Vercel preview deployments are open. Design and rationale:
`docs/superpowers/specs/2026-09-28-api-backstop-page-design.md`.
```

- [ ] **Step 2: Correct the spec where the plan refined it**

In `docs/superpowers/specs/2026-09-28-api-backstop-page-design.md`:

1. In section "2. Serving", replace the sentence beginning "Its matcher already excludes" through the end of that paragraph with: "Its matcher already excludes `/api`, `_next/static`, `_next/image` and `favicon.ico`. Static asset paths (extensions png, jpg, jpeg, gif, svg, ico, webp, avif, woff, woff2, ttf, otf, js, css, json, txt, xml, map, webmanifest), such as `status-widget.js`, `manifest.json`, `robots.txt` and `sitemap.xml`, are excluded inside the backstop handler, because a matcher must be a static literal."
2. In section "3. Root layout", change the `global-error.tsx` bullet's final clause to: "renders the same `BackstopPage` inside its own `<html><body>`, as the safety net if the layout or a page crashes. It omits the support link, because `BACKSTOP_SUPPORT_EMAIL` is server-only and this component also runs in the browser."
3. In section "1. Detection", after the probe bullet add: "Note: the API root returns static JSON without touching the database, so this detects host, network and process outages, not a database-only failure. The probe path is one constant if that needs to change."

- [ ] **Step 3: Run the full CI gates locally**

Run each, in this order, and confirm each passes before moving on:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test
npm run test:e2e
```

Expected: all pass. Fix anything that fails before continuing. (Your notes from a past Praxis miss: vitest and tsc alone are not enough; lint and build must run too.)

- [ ] **Step 4: Commit and push**

```bash
git add README.md docs/superpowers/specs/2026-09-28-api-backstop-page-design.md
git commit -m "docs(backstop): README env var and preview URL; spec corrections" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SwEubPCkuWMN2Nd52AaqJn"
git push -u origin feat/backstop-page
```

Only run the push after the user has approved pushing this branch.

- [ ] **Step 5: Open the PR and check CI**

Run: `gh pr create --title "API backstop page" --body "<summary of the spec, the preview URL, and the BACKSTOP_SUPPORT_EMAIL env var to set in Vercel>"`, ending the body with the two attribution lines for pull requests (`🤖 Generated with [Claude Code](https://claude.com/claude-code)` and the session URL).
Then run `gh pr checks --watch` and confirm both CI jobs (`checks`, `e2e`) pass. Report the result faithfully, including any failure output.

---

## Self-Review

**Spec coverage**
- Detection (probe, down rules, unset env, cache windows, dedupe, fail-open): Task 2.
- Serving (503 rewrite, `Retry-After`, `no-store`, `noindex`, forwarded header, asset/`/api` bypass, direct `/backstop` redirect): Task 4.
- Root layout branch, `/backstop` route, `global-error`: Task 5.
- Page (inline CSS/SVG, themes, reduced motion, retry states, live-status slot, support email env var, stand-in logo): Task 3.
- Preview (params, 200, noindex, Preview tag, password gating): Tasks 1, 3, 4, verified in Task 6.
- Testing section (unit, middleware, component, Playwright, full CI gates): Tasks 1-7.
- Out of scope items: nothing implemented for them.
- Spec corrections found while planning are applied in Task 7 Step 2.

**Placeholder scan:** none. The PR body in Task 7 Step 5 is described by required content, not code; everything else has complete code and commands.

**Type consistency:** `BackstopMode`, `BackstopInitialState`, `BackstopNote`, header constants and `BACKSTOP_PATH` are defined once in Task 1 and used unchanged in Tasks 3-5. `BackstopPageProps` matches the layout call in Task 5. `handleBackstop`/`stripBackstopHeaders` signatures match their uses in `src/middleware.ts`. The element ids used by the script (`bs`, `bs-retry`, `bs-at`, `bs-live`) match the component.

**Review Focus:** items 1-5 map to tests in Tasks 2, 4, 1+4, 2 and 3 respectively.
