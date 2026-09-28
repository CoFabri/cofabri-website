'use client';

import BackstopPage from '@/components/backstop/BackstopPage';

// Last-resort safety net: if the root layout or a page crashes, show the same
// self-contained backstop instead of Next's bare error page. The support
// address is a code constant, so it renders here exactly as it does in the
// layout.
export default function GlobalError() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="robots" content="noindex" />
        <title>CoFabri · Temporarily unavailable</title>
      </head>
      <body>
        <BackstopPage />
      </body>
    </html>
  );
}
