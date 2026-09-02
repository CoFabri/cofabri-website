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
