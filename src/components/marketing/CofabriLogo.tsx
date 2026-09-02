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
    try {
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
    } catch (error) {
      console.error(
        `Failed to load CoFabri logo (cut: ${cut}):`,
        error instanceof Error ? error.message : String(error)
      );
      // Render empty placeholder to prevent layout shift without showing broken logo
      art = <span style={{ display: 'block', width, height, flex: 'none' }} />;
    }
  } else {
    try {
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
    } catch (error) {
      console.error(
        `Failed to load CoFabri logo (cut: ${cut}, tone: ${tone}):`,
        error instanceof Error ? error.message : String(error)
      );
      // Render empty placeholder to prevent layout shift without showing broken logo
      art = <span style={{ display: 'block', width, height, flex: 'none' }} />;
    }
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
