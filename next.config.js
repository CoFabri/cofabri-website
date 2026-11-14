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
        ],
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