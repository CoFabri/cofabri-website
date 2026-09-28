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
