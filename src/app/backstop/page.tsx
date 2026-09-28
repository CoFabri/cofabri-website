import type { Metadata } from 'next';

// Internal rewrite target for middleware. RootLayout sees the backstop header
// and renders the backstop itself, so this page renders nothing of its own; it
// exists so the route resolves and carries the title and robots metadata.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'CoFabri · Temporarily unavailable' },
  robots: { index: false, follow: false },
  // Clear the root layout's metadata so the outage document links to nothing
  // outside itself (the icons, manifest and share images are on files.cofabri.com).
  icons: null,
  manifest: null,
  openGraph: null,
  twitter: null,
};

export default function BackstopRoutePage() {
  return null;
}
