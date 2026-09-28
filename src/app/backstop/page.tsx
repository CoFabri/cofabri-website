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
