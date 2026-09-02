// src/lib/cofabri-logo.ts
//
// Resolution logic for the CoFabri parent-brand logo. Points at pre-rasterized
// PNG masters on the brand-asset CDN — the same masters cofabri-core already
// consumes via next/image (see e.g. its email-signature template, which
// reuses cofabri-lockup-light-sm-1856.png directly). Deliberately NOT the SVG
// masters at the same host: those still carry live <text font-family="...">
// for "Co"/"Fabri" instead of outlined paths, and inlining that text (via a
// server fetch + dangerouslySetInnerHTML) rendered wrong on real iOS Safari —
// the font-family fallback list on the "Fabri" glyph doesn't resolve there,
// even after fixing the dead "Poppins-Bold" alias, and even though the exact
// same markup renders fine in desktop-WebKit and simulated-iPhone testing.
// cofabri-core sidesteps the whole class of bug by never asking the browser
// to shape text inside the logo asset at all; this does the same.

const HOST = 'https://files.cofabri.com/logos/cofabri';

/** Locked by the brand guidelines (464 × 200 box). Do not round. */
export const LOCKUP_RATIO = 464 / 200;
/** Mark masters are square. */
export const MARK_RATIO = 1;
/** Clear space as a fraction of rendered height, all four sides. */
export const CLEAR_SPACE = 0.22;

/** Intrinsic width of every lockup PNG master, for next/image's width/height props. */
const LOCKUP_PNG_WIDTH = 1856;
const LOCKUP_PNG_HEIGHT = 800;
/** Intrinsic size of the square mark PNG master. */
const MARK_PNG_SIZE = 1024;

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

interface PngAsset {
  src: string;
  width: number;
  height: number;
}

// Only combinations backed by a verified-good PNG master on the CDN.
// mark-small has no dedicated master — mark-1024 downscales cleanly at the
// sizes mark-small is ever rendered at, so it reuses the mark entry.
// Mono tones exist only for the lockup cuts (no mono mark master); a caller
// asking for a mark + mono-* combination gets null and the empty-placeholder
// fallback, same as a fetch failure would have produced under the old system.
const LOCKUP_TONE_FILES: Record<ResolvedTone, string | null> = {
  light: 'cofabri-lockup-light-1856.png',
  dark: 'cofabri-lockup-dark-1856.png',
  'mono-ink': 'cofabri-lockup-mono-ink-1856.png',
  'mono-white': 'cofabri-lockup-mono-white-1856.png',
  'mono-black': 'cofabri-lockup-mono-black-1856.png',
};
const LOCKUP_SM_TONE_FILES: Record<ResolvedTone, string | null> = {
  light: 'cofabri-lockup-light-sm-1856.png',
  dark: 'cofabri-lockup-dark-sm-1856.png',
  'mono-ink': 'cofabri-lockup-mono-ink-1856.png',
  'mono-white': 'cofabri-lockup-mono-white-1856.png',
  'mono-black': 'cofabri-lockup-mono-black-1856.png',
};
const MARK_TONE_FILES: Record<ResolvedTone, string | null> = {
  light: 'mark-1024-light.png',
  dark: 'mark-1024-dark.png',
  'mono-ink': null,
  'mono-white': null,
  'mono-black': null,
};

export function cofabriPngAsset(cut: Cut, tone: ResolvedTone): PngAsset | null {
  if (cut === 'mark' || cut === 'mark-small') {
    const file = MARK_TONE_FILES[tone];
    if (!file) return null;
    // mark-1024-*.png lives at the host root, not under /png/.
    return { src: `${HOST}/${file}`, width: MARK_PNG_SIZE, height: MARK_PNG_SIZE };
  }
  const file = (cut === 'lockup' ? LOCKUP_TONE_FILES : LOCKUP_SM_TONE_FILES)[tone];
  if (!file) return null;
  return { src: `${HOST}/png/${file}`, width: LOCKUP_PNG_WIDTH, height: LOCKUP_PNG_HEIGHT };
}
