# CoFabri Parent-Brand Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every CoFabri parent-brand logo surface (nav header, footer, favicons/PWA icons, JSON-LD `logo` fields) with a single `<CofabriLogo>` component that resolves the correct cut/tone from the hosted masters at `files.cofabri.com/logos/cofabri/`, and delete the old locally-vendored, off-brand assets.

**Architecture:** `<CofabriLogo>` is an async **Server Component** (`src/components/marketing/CofabriLogo.tsx`) that fetches the needed SVG markup server-side (via `src/lib/cofabri-logo.ts`) and inlines it with `dangerouslySetInnerHTML`, so the page's own loaded Poppins/UnifrakturMaguntia webfonts render the wordmark's live text. When the resolved tone is `auto` (theme-following), it fetches *both* light and dark markup server-side and hands them to a tiny client leaf (`CofabriLogoThemedArt`) that only switches between two already-fetched strings — no network fetch ever happens in the browser. `Navbar.tsx` (a Client Component) receives a pre-rendered `<CofabriLogo>` element via a `logo` prop from `layout.tsx` (a Server Component) rather than importing and rendering it itself, since a Client Component cannot directly render an async Server Component.

**Tech Stack:** Next.js 16 App Router, React 18.3, TypeScript, Tailwind v4, next-themes. No test runner exists in this repo (`package.json` has no test script, no Jest/Vitest/Playwright dependency) — verification steps below are `tsc`/`eslint` plus a manual dev-server visual check, not automated tests. Do not add a test framework as part of this plan; that's a separate decision for the user to make.

**Spec:** The pasted "CoFabri parent brand — implementation brief" (this session's transcript) plus `~/Downloads/CoFabri Brand Guidelines.pdf` (v1.0, Direction 9D, Sept 2026) as the source of truth where they disagree. The reference component the user pasted (`handoff/brand/cofabri-logo.tsx` in the brief's own naming) is NOT committed verbatim — see Deviations below for why.

## Global Constraints

- Ratio locked at 464×200 for the lockup, 100×100 for the mark. Never set both width and height on a call site — only `height` is a prop; width is always derived.
- Shell is `#007BFF` in both themes (baked into the hosted SVGs, not configurable). Wordmark/core is `#36454F` on light, `#D3D3D3` on dark — never `#FFFFFF`. These are baked into the masters; the component never sets fill colors itself.
- Cut selection (lockup / lockup-sm / mark / mark-small) is by **rendered width**, derived from `height * (464/200)`, per the size ladder — a call site never names a file.
- Clear space is 22% of height on all sides by default, 11% (`clearSpace="dense"`) in compact UI, never below.
- Nothing from `files.cofabri.com` is vendored into `public/` — every surface fetches/references the hosted files.
- `aria-label="CoFabri"` + `role="img"` on the rendered artwork; a wrapping link carries `href` and nothing else.
- **Scope for this pass, per explicit user decision:** logo/brand-mark surfaces only. The brief's §4 brand color-token system and §8 typography scale are OUT OF SCOPE — the site's existing "Quiet Utility" token system (`src/app/globals.css`) is left untouched, even though its accent (`#0B6BE6`) doesn't exactly match brand blue (`#007BFF`). Do not touch `--accent`, `--primary`, or any other color token as part of this plan.
- The Core sub-brand (`src/components/ui/core-loader.tsx`, product favicon/manifest under `cofabri-core/`) is a separate system and is NOT touched by this plan, except where a surface was *wrongly* pointing at Core assets instead of the parent brand (see Task 5) — that's a bug fix, not a Core-system change.

## Deviations from the brief (documented per its own §10 "report back" requirement)

1. **No client-side fetch.** `files.cofabri.com` does not currently send `Access-Control-Allow-Origin` (verified via `curl -I`), so a browser `fetch()` from `cofabri.com` would fail for every visitor. Per explicit user instruction, this plan redesigns around that instead of waiting on a CDN header fix: all fetching happens server-side (Node `fetch`, not subject to CORS), and the client only ever switches between already-fetched strings. If CORS is added to the host later, this remains correct — it just becomes unnecessary defensiveness, not a bug.
2. **Header height.** The brief's §6 says "Site header — full lockup, `height={32}`–`40`." At height 40, rendered width is `40 * 2.32 ≈ 93px`, which is *under* the ladder's own 120px floor — the component would render the mark alone, which §7 explicitly forbids on a site header ("Not allowed alone: ... site header"). This plan uses `height={56}` with `clearSpace="dense"` instead (rendered width ≈130px, in the small-cut lockup range; total box height with dense clear space ≈68px, matching the navbar's existing `h-[68px]` row) so the header actually renders a lockup, not a mark, and fits the existing nav bar height. Flagging for design sign-off rather than silently picking a number.
3. **Footer tone.** The brief's example says footer uses "ink or mono-ink" — that assumes a light footer background. This site's footer is `bg-[#232E36]` (dark), so `tone="dark"` is used instead (shell `#007BFF` + wordmark `#D3D3D3`), which is legible on a dark ground; `mono-ink` (`#36454F`-ish ink) would be nearly invisible there.
4. **OG image not built.** The brief's §6 OG guidance needs "an outlined or rasterized master" — none exists yet (`§2` confirms no outlined masters exist, and there's no full-lockup raster, only `mark-1024-*.png`). Rebuilding the wordmark with a text-rendering library (e.g. `@vercel/og`) would mean re-drawing the mark, which rule 1 forbids. This plan leaves the existing `/images/placeholder.jpg` OG image as-is and flags this as blocked on a new asset from design.
5. **Auth/full-screen gate not touched.** No such surface exists in this repo (checked `/signup` — it's a per-app query-param signup form, not a CoFabri-branded gate). Nothing to change here.
6. **`handoff/brand/cofabri-logo.tsx` is not committed.** The user-provided reference file documents the client-fetch architecture this plan deliberately replaces (see #1). Committing it verbatim would leave a misleading, non-functional example in the repo. Its contract (props, size ladder, clear-space math, sanitize/namespace logic) is preserved in the real implementation; the file itself is not carried over.

---

## File Structure

- **Create** `src/lib/cofabri-logo.ts` — server-only pure logic + fetch: asset map, `pickCofabriCut`, `cofabriAssetUrl`, `sanitize`, `namespaceIds`, `loadCofabriSvg`.
- **Create** `src/components/marketing/CofabriLogo.tsx` — async Server Component, the public entry point (`<CofabriLogo height variant tone clearSpace href className />`).
- **Create** `src/components/marketing/CofabriLogoThemedArt.tsx` — tiny Client Component leaf, only used internally by `CofabriLogo.tsx` when `tone="auto"`.
- **Modify** `src/components/marketing/Navbar.tsx` — accept a `logo: React.ReactNode` prop instead of importing `Logo`.
- **Modify** `src/app/layout.tsx` — render `<Navbar logo={<CofabriLogo .../>} />`; update favicon/PWA `metadata.icons` and `<head>` `<link>` tags to the parent-brand host paths.
- **Modify** `src/components/marketing/Footer.tsx` — drop `'use client'` (no hooks used), replace the hardcoded Core-icon `<Image>` with `<CofabriLogo variant="mark" tone="dark" />`.
- **Modify** `public/manifest.json` — icons array points at `cofabri/` (parent brand) instead of `cofabri-core/`, add the maskable variant with `purpose: "maskable"`.
- **Modify** `src/components/marketing/StructuredData.tsx` — both `https://cofabri.com/logo.png` references → `https://files.cofabri.com/logos/cofabri/icon-512.png`.
- **Modify** `src/app/globals.css` — add Poppins 700 + UnifrakturMaguntia to the existing Google Fonts `@import`, so the inlined SVG `<text>` actually renders in-brand instead of falling back to a system font.
- **Delete** `src/components/marketing/Logo.tsx`, `public/images/logo.svg`, `public/images/logo-inverted.svg`, `public/logo.png`.

---

## Task 1: Server-side asset resolution module

**Files:**
- Create: `src/lib/cofabri-logo.ts`

**Interfaces:**
- Produces: `CofabriLogoTone` (`'auto'|'light'|'dark'|'mono-ink'|'mono-white'|'mono-black'`), `CofabriLogoVariant` (`'auto'|'mark'`), `pickCofabriCut(height: number, variant: CofabriLogoVariant): Cut`, `cofabriAssetUrl(cut: Cut, tone: ResolvedTone): string`, `loadCofabriSvg(url: string): Promise<string>`, `LOCKUP_RATIO`, `MARK_RATIO`, `CLEAR_SPACE`.
- Consumes: nothing (leaf module).

- [ ] **Step 1: Write the module**

```ts
// src/lib/cofabri-logo.ts
//
// Server-only resolution + fetch logic for the CoFabri parent-brand logo.
// Never imported from a 'use client' file — the fetch here relies on
// running in Node (no CORS restriction), which is the whole reason this
// exists instead of fetching from the browser. See CofabriLogo.tsx for why.

const HOST = 'https://files.cofabri.com/logos/cofabri';

/** Locked by the brand guidelines (464 × 200 box). Do not round. */
export const LOCKUP_RATIO = 464 / 200;
/** Mark masters are square, native viewBox 100 × 100. */
export const MARK_RATIO = 1;
/** Clear space as a fraction of rendered height, all four sides. */
export const CLEAR_SPACE = 0.22;

export type CofabriLogoTone =
  | 'auto'
  | 'light'
  | 'dark'
  | 'mono-ink'
  | 'mono-white'
  | 'mono-black';
export type CofabriLogoVariant = 'auto' | 'mark';
export type Cut = 'lockup' | 'lockup-sm' | 'mark' | 'mark-small';
export type ResolvedTone = Exclude<CofabriLogoTone, 'auto'>;

const ASSETS: Record<Cut, Record<ResolvedTone, string>> = {
  lockup: {
    light: 'cofabri-lockup-light.svg',
    dark: 'cofabri-lockup-dark.svg',
    'mono-ink': 'cofabri-lockup-mono-ink.svg',
    'mono-white': 'cofabri-lockup-mono-white.svg',
    'mono-black': 'cofabri-lockup-mono-black.svg',
  },
  'lockup-sm': {
    light: 'cofabri-lockup-light-sm.svg',
    dark: 'cofabri-lockup-dark-sm.svg',
    'mono-ink': 'cofabri-lockup-mono-ink.svg',
    'mono-white': 'cofabri-lockup-mono-white.svg',
    'mono-black': 'cofabri-lockup-mono-black.svg',
  },
  mark: {
    light: 'cofabri-mark-light.svg',
    dark: 'cofabri-mark-dark.svg',
    'mono-ink': 'cofabri-mark-mono-ink.svg',
    'mono-white': 'cofabri-mark-mono-white.svg',
    'mono-black': 'cofabri-mark-mono-ink.svg', // no mono-black mark master
  },
  'mark-small': {
    light: 'cofabri-mark-small.svg',
    dark: 'cofabri-mark-small.svg', // two-layer cut has no light/dark split
    'mono-ink': 'cofabri-mark-mono-ink.svg',
    'mono-white': 'cofabri-mark-mono-white.svg',
    'mono-black': 'cofabri-mark-mono-ink.svg',
  },
};

/**
 * The size ladder lives here and nowhere else. Selection is by RENDERED
 * WIDTH: the wordmark stops being legible below 120px wide, and the
 * three-layer core turns to mud below 280px wide.
 */
export function pickCofabriCut(height: number, variant: CofabriLogoVariant): Cut {
  if (variant === 'mark') return height < 40 ? 'mark-small' : 'mark';
  const width = height * LOCKUP_RATIO;
  if (width >= 280) return 'lockup';
  if (width >= 120) return 'lockup-sm';
  return height < 40 ? 'mark-small' : 'mark';
}

export function cofabriAssetUrl(cut: Cut, tone: ResolvedTone): string {
  return `${HOST}/${ASSETS[cut][tone]}`;
}

/**
 * Strip the XML prolog/doctype/comments/<title> (the caller supplies the
 * accessible name via aria-label, so a nested <title> would duplicate it),
 * and drop the intrinsic width/height so the wrapper owns sizing. Fills and
 * fill-rule="evenodd" are never touched — the gap between shell and core is
 * a real knockout, and rewriting fills would defeat it.
 */
function sanitize(svg: string): string {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<title[\s\S]*?<\/title>/gi, '')
    .replace(/<svg\b([^>]*)>/i, (_m, attrs: string) =>
      `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/gi, '')} style="display:block;width:100%;height:100%">`,
    )
    .trim();
}

/**
 * Namespace every id in the fragment. Two logos on one page is a brand
 * misuse, but header + footer both mounted is the normal case, and
 * duplicate ids make clipPath/mask/gradient references resolve to whichever
 * copy the browser saw first — one logo silently loses its knockout.
 */
export function namespaceIds(svg: string, prefix: string): string {
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  let out = svg;
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`(\\sid=")${esc}(")`, 'g'), `$1${prefix}-${id}$2`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#${prefix}-${id})`)
      .replace(new RegExp(`(\\s(?:xlink:)?href=")#${esc}(")`, 'g'), `$1#${prefix}-${id}$2`);
  }
  return out;
}

/**
 * Module-level promise cache, keyed by URL. Runs only on the server (Node
 * fetch, not subject to browser CORS) — Next's fetch cache also dedupes
 * this across requests, but this cache additionally dedupes within a single
 * render when a header + footer both request the same URL in one pass.
 * `revalidate: 3600` means a design-team asset update shows up within an
 * hour without a redeploy.
 */
const svgCache = new Map<string, Promise<string>>();

export function loadCofabriSvg(url: string): Promise<string> {
  let pending = svgCache.get(url);
  if (!pending) {
    pending = fetch(url, { next: { revalidate: 3600 } })
      .then((res) => {
        if (!res.ok) throw new Error(`CofabriLogo: ${url} -> ${res.status}`);
        return res.text();
      })
      .then(sanitize)
      .catch((err) => {
        svgCache.delete(url);
        throw err;
      });
    svgCache.set(url, pending);
  }
  return pending;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (it has no imports yet from anywhere else, so this should be clean in isolation).

- [ ] **Step 3: Commit**

```bash
git add src/lib/cofabri-logo.ts
git commit -m "$(cat <<'EOF'
feat: add server-side CoFabri logo asset resolution

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PMoiGiZRgCeY3po4FY8vxS
EOF
)"
```

---

## Task 2: `CofabriLogo` Server Component + themed client leaf

**Files:**
- Create: `src/components/marketing/CofabriLogo.tsx`
- Create: `src/components/marketing/CofabriLogoThemedArt.tsx`

**Interfaces:**
- Consumes: everything from Task 1's `src/lib/cofabri-logo.ts` (`pickCofabriCut`, `cofabriAssetUrl`, `loadCofabriSvg`, `namespaceIds`, `LOCKUP_RATIO`, `MARK_RATIO`, `CLEAR_SPACE`, and the exported types).
- Produces: `export default function CofabriLogo(props: CofabriLogoProps)` — the only import every other task needs:
  ```ts
  interface CofabriLogoProps {
    height: number;
    variant?: 'auto' | 'mark';       // default 'auto'
    tone?: CofabriLogoTone;           // default 'auto'
    clearSpace?: 'default' | 'dense'; // default 'default'
    href?: string;
    className?: string;
  }
  ```
  Also produces `CofabriLogoThemedArt` (internal, but exported for the rare case a caller needs the raw art without the wrapper — not expected to be used elsewhere in this plan).

- [ ] **Step 1: Write the themed client leaf**

```tsx
// src/components/marketing/CofabriLogoThemedArt.tsx
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

interface CofabriLogoThemedArtProps {
  lightHtml: string;
  darkHtml: string;
  width: number;
  height: number;
}

/**
 * Switches between two ALREADY-FETCHED markup strings based on the resolved
 * theme. Never fetches anything itself — see CofabriLogo.tsx for why the
 * fetch happens server-side instead of here.
 */
export default function CofabriLogoThemedArt({
  lightHtml,
  darkHtml,
  width,
  height,
}: CofabriLogoThemedArtProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Render the light cut until next-themes has resolved on the client, so
  // SSR output and first paint never mismatch.
  const html = mounted && resolvedTheme === 'dark' ? darkHtml : lightHtml;

  return (
    <span
      role="img"
      aria-label="CoFabri"
      style={{ display: 'block', width, height, flex: 'none' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 2: Write the Server Component entry point**

```tsx
// src/components/marketing/CofabriLogo.tsx
import * as React from 'react';
import Link from 'next/link';
import {
  pickCofabriCut,
  cofabriAssetUrl,
  loadCofabriSvg,
  namespaceIds,
  LOCKUP_RATIO,
  MARK_RATIO,
  CLEAR_SPACE,
  type CofabriLogoTone,
  type CofabriLogoVariant,
} from '@/lib/cofabri-logo';
import CofabriLogoThemedArt from './CofabriLogoThemedArt';

export interface CofabriLogoProps {
  /** Rendered height of the artwork in px, excluding clear space. Width derives from it. */
  height: number;
  /** `auto` follows the size ladder. `mark` forces the mark alone at this height. */
  variant?: CofabriLogoVariant;
  /** `auto` follows the site theme; mono tones are one-color, theme-independent masters. */
  tone?: CofabriLogoTone;
  /** `default` = 22% of height on all sides. `dense` = 11%. There is no zero. */
  clearSpace?: 'default' | 'dense';
  /** Wraps the logo in a next/link carrying this href and nothing else. */
  href?: string;
  /** Applied to the outermost wrapper only. */
  className?: string;
}

let instanceCounter = 0;

export default async function CofabriLogo({
  height,
  variant = 'auto',
  tone = 'auto',
  clearSpace = 'default',
  href,
  className,
}: CofabriLogoProps) {
  const cut = pickCofabriCut(height, variant);
  const ratio = cut.startsWith('mark') ? MARK_RATIO : LOCKUP_RATIO;
  const width = Math.round(height * ratio);
  const pad = Math.round(height * CLEAR_SPACE * (clearSpace === 'dense' ? 0.5 : 1));
  // Scoped per render, not per request — fine, since it only has to be
  // unique across logos mounted in the same document, not across requests.
  const scope = `cofabri-${(instanceCounter++).toString(36)}`;

  let art: React.ReactNode;
  if (tone === 'auto') {
    const [lightRaw, darkRaw] = await Promise.all([
      loadCofabriSvg(cofabriAssetUrl(cut, 'light')),
      loadCofabriSvg(cofabriAssetUrl(cut, 'dark')),
    ]);
    art = (
      <CofabriLogoThemedArt
        lightHtml={namespaceIds(lightRaw, `${scope}-light`)}
        darkHtml={namespaceIds(darkRaw, `${scope}-dark`)}
        width={width}
        height={height}
      />
    );
  } else {
    const raw = await loadCofabriSvg(cofabriAssetUrl(cut, tone));
    const html = namespaceIds(raw, scope);
    art = (
      <span
        role="img"
        aria-label="CoFabri"
        style={{ display: 'block', width, height, flex: 'none' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const wrapperStyle: React.CSSProperties = { padding: pad, lineHeight: 0 };

  // The link carries the href and nothing else — no aria-label, so the
  // accessible name still resolves to "CoFabri" from the artwork itself.
  return (
    <span className={className ? `inline-flex ${className}` : 'inline-flex'} style={wrapperStyle}>
      {href ? (
        <Link href={href} className="inline-flex">
          {art}
        </Link>
      ) : (
        art
      )}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `next-themes`'s `useTheme` type or `@/lib/cofabri-logo` path resolution fails, fix the import path (check `tsconfig.json`'s `paths` for the `@/*` alias) before moving on.

- [ ] **Step 4: Manual smoke test in isolation**

Temporarily add `<CofabriLogo height={56} href="/" />` to the top of `src/app/page.tsx`'s returned JSX, run `npm run dev`, load `http://localhost:3000`, and confirm in the browser:
- The wordmark renders in the blackletter + Poppins faces, not a fallback serif/sans (this will still be wrong until Task 6 adds the font imports — that's expected at this step; just confirm the SVG itself is present in the DOM via devtools, sized correctly, and doesn't 404).
- No console errors.
- Remove the temporary JSX before continuing (do not commit it).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/CofabriLogo.tsx src/components/marketing/CofabriLogoThemedArt.tsx
git commit -m "$(cat <<'EOF'
feat: add CofabriLogo server component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PMoiGiZRgCeY3po4FY8vxS
EOF
)"
```

---

## Task 3: Load the wordmark's webfonts

**Files:**
- Modify: `src/app/globals.css:1`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this makes Task 2's inlined `<text font-family="Poppins-Bold, Poppins">` and `<text font-family="UnifrakturMaguntia">` actually render correctly instead of falling back to a system font.

- [ ] **Step 1: Extend the existing Google Fonts import**

Current line 1:
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap');
```

Change to add Poppins (weight 700 only — the wordmark's only weight; the broader §8 typography rollout that would load 300–600 is explicitly out of scope for this pass) and UnifrakturMaguntia (single weight, logo-only):

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@700&family=UnifrakturMaguntia&display=swap');
```

- [ ] **Step 2: Verify the fonts actually load**

With `npm run dev` running, temporarily re-add `<CofabriLogo height={56} href="/" />` to `page.tsx` (same as Task 2 Step 4), reload, and open devtools → Network → Font, confirm `Poppins` (weight 700) and `UnifrakturMaguntia` requests return 200. Then inspect the rendered `<text>` elements and confirm `font-family` is actually applying (not falling back — compare the rendered glyph shapes against the reference screenshot in `~/Downloads/CoFabri Brand Guidelines.pdf` page 2). Remove the temporary JSX again.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: load Poppins 700 and UnifrakturMaguntia for the CoFabri wordmark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PMoiGiZRgCeY3po4FY8vxS
EOF
)"
```

---

## Task 4: Wire into the site header

**Files:**
- Modify: `src/components/marketing/Navbar.tsx:1-77`
- Modify: `src/app/layout.tsx:1-138`
- Delete: `src/components/marketing/Logo.tsx`

**Interfaces:**
- Consumes: `CofabriLogo` from Task 2.
- Produces: `Navbar`'s new prop shape: `interface NavbarProps { logo: React.ReactNode }` — no other task depends on this.

- [ ] **Step 1: Give `Navbar` a `logo` slot instead of importing `Logo`**

In `src/components/marketing/Navbar.tsx`, remove `import Logo from './Logo';` (line 14) and change the component signature and the header markup:

```tsx
// was: const Navbar = () => {
const Navbar = ({ logo }: { logo: React.ReactNode }) => {
```

```tsx
// was:
//   <Link href="/" className="flex items-center flex-shrink-0">
//     <Logo size="nav" noLink />
//   </Link>
// now — CofabriLogo owns its own href, so it is not re-wrapped in another Link:
<div className="flex items-center flex-shrink-0">{logo}</div>
```

- [ ] **Step 2: Render `CofabriLogo` from `layout.tsx` and pass it down**

In `src/app/layout.tsx`, add the import:

```tsx
import CofabriLogo from "@/components/marketing/CofabriLogo";
```

Change the `<Navbar />` usage:

```tsx
// was: <Navbar />
<Navbar logo={<CofabriLogo height={56} clearSpace="dense" href="/" />} />
```

(This is the deviation documented above: height 56 + dense clear space, not the brief's literal 32–40, because 32–40 would trigger the mark-alone cut, which is disallowed on a site header.)

- [ ] **Step 3: Update favicon/PWA metadata to the parent-brand host paths**

In `src/app/layout.tsx`, replace the `icons` block inside `metadata`:

```tsx
// was:
//   icons: {
//     icon: [
//       { url: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png', sizes: '512x512', type: 'image/png' },
//     ],
//     apple: [
//       { url: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png', sizes: '512x512' },
//     ],
//     shortcut: 'https://files.cofabri.com/logos/cofabri-core/icon-512.png',
//   },
icons: {
  icon: [
    { url: 'https://files.cofabri.com/logos/cofabri/favicon.svg', type: 'image/svg+xml' },
    { url: 'https://files.cofabri.com/logos/cofabri/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: 'https://files.cofabri.com/logos/cofabri/favicon-64.png', sizes: '64x64', type: 'image/png' },
    { url: 'https://files.cofabri.com/logos/cofabri/icon-192.png', sizes: '192x192', type: 'image/png' },
    { url: 'https://files.cofabri.com/logos/cofabri/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  apple: [
    { url: 'https://files.cofabri.com/logos/cofabri/apple-touch-icon-180.png', sizes: '180x180' },
  ],
  shortcut: 'https://files.cofabri.com/logos/cofabri/favicon-32.png',
},
```

And the two `<head>` `<link>` tags:

```tsx
// was:
// <link rel="icon" href="https://files.cofabri.com/logos/cofabri-core/icon-512.png" sizes="any" />
// <link rel="apple-touch-icon" href="https://files.cofabri.com/logos/cofabri-core/icon-512.png" />
<link rel="icon" href="https://files.cofabri.com/logos/cofabri/favicon.svg" sizes="any" type="image/svg+xml" />
<link rel="apple-touch-icon" href="https://files.cofabri.com/logos/cofabri/apple-touch-icon-180.png" />
```

- [ ] **Step 4: Delete the old Logo component**

```bash
rm src/components/marketing/Logo.tsx
```

Grep to confirm nothing else imports it: `grep -rn "from './Logo'\|marketing/Logo'" src` should return no results after this task.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. `Navbar`'s prop type change means anywhere else that renders `<Navbar />` without a `logo` prop will now fail to typecheck — confirm `layout.tsx` is the only call site (`grep -rn "<Navbar" src`).

- [ ] **Step 6: Visual check**

`npm run dev`, load `http://localhost:3000`, confirm:
- The header shows the full CoFabri wordmark + mark (not just the mark alone), roughly 130px wide, vertically centered in the nav bar with no layout shift on load.
- Toggle the theme (sun/moon/monitor button) and confirm the logo switches between the light and dark cut with no flash of the wrong one and no network request in the Network tab (both markups were already fetched server-side).
- Check the browser tab: the favicon should now be the CoFabri mark (blue four-point star), not whatever the Core icon looked like.

- [ ] **Step 7: Commit**

```bash
git add src/components/marketing/Navbar.tsx src/app/layout.tsx
git rm src/components/marketing/Logo.tsx
git commit -m "$(cat <<'EOF'
feat: wire CofabriLogo into the site header and favicons

Replaces the old macSVG-exported logo.svg/logo-inverted.svg (live-text
fonts loaded via next/image, so the wordmark silently rendered in a
fallback font) and the Core product favicon (wrong sub-brand for this
site) with the parent-brand CofabriLogo component and hosted icon set.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PMoiGiZRgCeY3po4FY8vxS
EOF
)"
```

---

## Task 5: Wire into the footer, manifest, and structured data; delete old local assets

**Files:**
- Modify: `src/components/marketing/Footer.tsx:1-56`
- Modify: `public/manifest.json`
- Modify: `src/components/marketing/StructuredData.tsx:17,66`
- Delete: `public/images/logo.svg`, `public/images/logo-inverted.svg`, `public/logo.png`

**Interfaces:**
- Consumes: `CofabriLogo` from Task 2.
- Produces: nothing new.

- [ ] **Step 1: Replace the footer's hardcoded Core icon**

In `src/components/marketing/Footer.tsx`, remove the `'use client'` directive (line 1 — the component uses no hooks or browser APIs, so it can be a Server Component) and the now-unused `Image` import, then replace:

```tsx
// was:
// <Link href="/" className="flex items-center flex-shrink-0">
//   <Image
//     src="https://files.cofabri.com/logos/cofabri-core/icon-512.png"
//     alt="CoFabri"
//     width={40}
//     height={40}
//     className="h-9 w-9"
//   />
// </Link>
<CofabriLogo variant="mark" tone="dark" height={40} href="/" />
```

Add the import at the top: `import CofabriLogo from './CofabriLogo';`

(This is the footer tone deviation documented above: `tone="dark"` rather than the brief's example "ink", because this footer's background — `bg-[#232E36]` — is dark, and the ink tone would be unreadable on it. It's also no longer the wrong sub-brand: this was rendering the Core product's app icon, not the CoFabri parent mark.)

- [ ] **Step 2: Update the manifest icons**

In `public/manifest.json`, replace the `icons` array:

```json
"icons": [
  {
    "src": "https://files.cofabri.com/logos/cofabri/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "https://files.cofabri.com/logos/cofabri/icon-512.png",
    "sizes": "512x512",
    "type": "image/png"
  },
  {
    "src": "https://files.cofabri.com/logos/cofabri/icon-512-maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

Leave `theme_color`/`background_color` untouched — those are color-token decisions, out of scope for this pass per the Global Constraints above.

- [ ] **Step 3: Update the JSON-LD `logo` fields**

In `src/components/marketing/StructuredData.tsx`, replace both occurrences of `"https://cofabri.com/logo.png"` (lines 17 and 66) with `"https://files.cofabri.com/logos/cofabri/icon-512.png"`.

- [ ] **Step 4: Delete the old local assets**

```bash
rm public/images/logo.svg public/images/logo-inverted.svg public/logo.png
```

Grep to confirm nothing else references them: `grep -rn "logo\.png\|logo\.svg\|logo-inverted" src public` should return no results.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Visual + structural check**

`npm run dev`, scroll to the footer, confirm the CoFabri mark (not the old Core icon, not a broken image) renders at the bottom-left of the footer's link bar, legible against the dark background. Then:
- `curl -s http://localhost:3000/manifest.json | python3 -m json.tool` — confirm the icons array resolves to `cofabri/` paths.
- View source or use devtools to find the organization JSON-LD `<script>` tag and confirm its `logo` field is the new URL.

- [ ] **Step 7: Commit**

```bash
git add src/components/marketing/Footer.tsx public/manifest.json src/components/marketing/StructuredData.tsx
git rm public/images/logo.svg public/images/logo-inverted.svg public/logo.png
git commit -m "$(cat <<'EOF'
feat: wire CofabriLogo into footer, manifest, and structured data

Footer was rendering the Core product's app icon instead of the parent
CoFabri mark. Also removes the last locally-vendored logo files —
public/logo.png and public/images/logo{,-inverted}.svg — now that every
surface resolves through the hosted files.cofabri.com/logos/cofabri/ set.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PMoiGiZRgCeY3po4FY8vxS
EOF
)"
```

---

## Task 6: Full-site verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 2: Grep for leftover hand-drawn or off-brand references**

```bash
grep -rn "cofabri-core/icon" src public
grep -rn "from './Logo'\|marketing/Logo'" src
grep -rn "logo\.png\|logo\.svg\|logo-inverted" src public
```
Expected: no output from any of the three (the first should only ever match `core-loader.tsx`'s unrelated Core-mark internals if it matches at all — confirm any hit is genuinely about the Core product, not a missed parent-brand surface).

- [ ] **Step 3: Full visual pass**

`npm run dev`, and for each of: `/`, `/apps`, `/roadmaps`, `/knowledge-base`, `/support`, `/contact`, `/legal`, `/status`, `/changelog`, `/partners` — confirm the header logo renders correctly and the footer mark renders correctly, in both light and dark theme (toggle via the header control). Confirm no layout shift on load (compare header height before/after the SVG's fetch resolves — should be zero, since width/height are set synchronously from the `height` prop, not after the fetch).

- [ ] **Step 4: Confirm no browser-side fetch to files.cofabri.com**

With devtools Network tab open and "Disable cache" on, hard-reload `/`. Confirm there is no request to `files.cofabri.com` in the browser's network log at all — all fetching happened server-side. This is the concrete proof the CORS redesign (Deviation 1) actually holds.

- [ ] **Step 5: Report back to the user**

Summarize, matching the brief's own §10 format:
- What was replaced (list each surface).
- What was deleted (the four old local asset files).
- The six documented deviations above, and which of them need a decision from the user or design team before they can be closed out (CORS header on the host; header-height sign-off; OG image asset request).

No commit for this task — it's verification only. If Step 3 or 4 surfaces a real bug, fix it as part of whichever earlier task it belongs to and amend that task's commit scope going forward (a new commit, not `--amend`, per this repo's normal git workflow), not as a new ad-hoc task.
