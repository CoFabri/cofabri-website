// Full-page Content Security Policy, sent as Report-Only for now. Every
// third-party origin the site's own code loads is listed, but the HighLevel
// chat widget (its URL comes from NEXT_PUBLIC_HIGHLEVEL_WIDGET_URL), Hotjar
// and GA4 load further scripts/frames/sockets of their own that can't be
// enumerated from this repo. Watch /api/csp-report in the Vercel logs on
// production, add anything legitimate, then rename the header to
// Content-Security-Policy to enforce it. 'unsafe-inline' is needed for
// Next's inline bootstrap scripts and the inline gtag/Hotjar snippets until
// the site moves to nonces.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.hotjar.com https://script.hotjar.com https://challenges.cloudflare.com https://widgets.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.leadconnectorhq.com",
  "font-src 'self' data: https://fonts.gstatic.com https://script.hotjar.com https://*.leadconnectorhq.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://www.googletagmanager.com https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com https://challenges.cloudflare.com https://*.leadconnectorhq.com wss://*.leadconnectorhq.com https://*.msgsndr.com https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-src 'self' https://challenges.cloudflare.com https://vars.hotjar.com https://*.leadconnectorhq.com https://vercel.live",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'report-uri /api/csp-report',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only the hosts the site really loads images from: brand assets and app
    // logos on files.cofabri.com, team/author photos in the Core Supabase
    // project's public storage. Anything else 400s at /_next/image instead of
    // turning the optimizer into an open proxy. Add a host here if a new
    // image source shows up broken.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.cofabri.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'iwpgwnapxuhpsdndvsrv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 75 is the default; 90 is used for small avatar photos where softness shows.
    qualities: [75, 90],
    minimumCacheTTL: 60,
    // Off: next/image serves .svg sources as-is (unoptimized) instead of
    // passing them through the optimizer.
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: '/team',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/partners',
        destination: '/co-build',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // No includeSubDomains/preload: other *.cofabri.com hosts are run
          // outside this project. Vercel already sends this for its domains;
          // this makes it explicit on every response.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            // Microphone is left alone so the HighLevel chat widget can
            // keep any voice-message feature it offers.
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
          },
        ],
      },
      {
        // Full-page CSP for HTML pages (see contentSecurityPolicy above).
        // /api is left out: the status widgets send their own strict CSP.
        source: '/((?!api/|api$).*)',
        headers: [{ key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy }],
      },
      {
        // Pages may only be framed by cofabri.com itself. /api (the status
        // widgets are meant to be embedded on other sites) and /preview
        // are left out.
        source: '/((?!api/|api$|preview/|preview$).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/preview/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 