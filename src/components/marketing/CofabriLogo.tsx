import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  pickCofabriCut,
  cofabriPngAsset,
  LOCKUP_RATIO,
  MARK_RATIO,
  CLEAR_SPACE,
  type CofabriLogoTone,
  type CofabriLogoVariant,
} from '@/lib/cofabri-logo';

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

function Placeholder({ width, height }: { width: number; height: number }) {
  return <span role="img" aria-label="CoFabri" style={{ display: 'block', width, height, flex: 'none' }} />;
}

export default function CofabriLogo({
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
  const pad = Math.ceil(height * CLEAR_SPACE * (clearSpace === 'dense' ? 0.5 : 1));

  let art: React.ReactNode;
  if (tone === 'auto') {
    const light = cofabriPngAsset(cut, 'light');
    const dark = cofabriPngAsset(cut, 'dark');
    art =
      light && dark ? (
        <>
          <Image
            src={light.src}
            alt="CoFabri"
            width={light.width}
            height={light.height}
            className="block dark:hidden"
            style={{ width, height, flex: 'none' }}
            priority
          />
          <Image
            src={dark.src}
            alt="CoFabri"
            width={dark.width}
            height={dark.height}
            className="hidden dark:block"
            style={{ width, height, flex: 'none' }}
            priority
          />
        </>
      ) : (
        <Placeholder width={width} height={height} />
      );
  } else {
    const asset = cofabriPngAsset(cut, tone);
    art = asset ? (
      <Image
        src={asset.src}
        alt="CoFabri"
        width={asset.width}
        height={asset.height}
        style={{ display: 'block', width, height, flex: 'none' }}
        priority
      />
    ) : (
      <Placeholder width={width} height={height} />
    );
  }

  const wrapperStyle: React.CSSProperties = { padding: pad, lineHeight: 0 };

  return (
    <span className={className ? `inline-flex ${className}` : 'inline-flex'} style={wrapperStyle}>
      {href ? (
        // No aria-label here — the accessible name comes from the Image's own alt text.
        <Link href={href} className="inline-flex">
          {art}
        </Link>
      ) : (
        art
      )}
    </span>
  );
}
