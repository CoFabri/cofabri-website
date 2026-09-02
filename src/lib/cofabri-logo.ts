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
 * Strip the XML prolog/doctype/comments/<title>/<metadata> (the caller
 * supplies the accessible name via aria-label, so a nested <title> would
 * duplicate it; <metadata> carries C2PA provenance data that serves no
 * purpose once inlined and is pure dead weight in every page's HTML), and
 * drop the intrinsic width/height so the wrapper owns sizing. Also strips
 * <script> tags and inline event handler attributes as defense-in-depth —
 * the source is the organization's own asset CDN, so this isn't guarding
 * against an active threat, but the cost is near zero. Fills and
 * fill-rule="evenodd" are never touched — the gap between shell and core
 * is a real knockout, and rewriting fills would defeat it.
 *
 * The master SVGs set the "Fabri" glyph's font-family to
 * `"Poppins-Bold, Poppins"` — "Poppins-Bold" is never registered by the
 * page's @font-face (only "Poppins" weight 700 is imported), so it's a dead
 * alias. On iOS Safari specifically, an SVG <text> font-family list whose
 * first entry never resolves fails to fall through to the second, valid
 * entry (unlike ordinary CSS text, where the same list falls back
 * correctly) — the wordmark's second glyph silently renders in the system
 * fallback serif instead of Poppins, while "Co" (a single-name font-family)
 * is unaffected. Dropping the dead alias here fixes it at the one place
 * every cut/tone passes through, without touching the hosted masters.
 */
function normalizeSvg(svg: string): string {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<title[\s\S]*?<\/title>/gi, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/font-family="Poppins-Bold,\s*Poppins"/gi, 'font-family="Poppins"')
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
 * Note: this in-memory cache never expires once a fetch succeeds, so a
 * long-lived warm server instance keeps serving the first version it ever
 * fetched until the process restarts — `revalidate: 3600` governs Next's
 * own fetch cache, which a warm instance with an already-resolved promise
 * here never re-consults. A design-team asset update reaches NEW server
 * instances within the hour; an existing warm instance needs a restart.
 */
const svgCache = new Map<string, Promise<string>>();
const failedAt = new Map<string, number>();
const FAILURE_COOLDOWN_MS = 30_000;

export function loadCofabriSvg(url: string): Promise<string> {
  const lastFailure = failedAt.get(url);
  if (lastFailure && Date.now() - lastFailure < FAILURE_COOLDOWN_MS) {
    return Promise.reject(new Error(`CofabriLogo: ${url} recently failed, cooling down`));
  }
  let pending = svgCache.get(url);
  if (!pending) {
    pending = fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) })
      .then((res) => {
        if (!res.ok) throw new Error(`CofabriLogo: ${url} -> ${res.status}`);
        return res.text();
      })
      .then(normalizeSvg)
      .catch((err) => {
        svgCache.delete(url);
        failedAt.set(url, Date.now());
        throw err;
      });
    svgCache.set(url, pending);
  }
  return pending;
}
