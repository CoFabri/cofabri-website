// src/lib/developer-portal/guides/medoura.ts
//
// Hand-written "Getting started" narrative for the Medoura Landing Page API: the conceptual
// material an OpenAPI spec doesn't carry (auth model, server-side-only use, caching, limits,
// errors, versioning). Per-endpoint reference content is NOT here: it is rendered fresh from
// Medoura's own /openapi.json. Verified against the Medoura code (lib/public-api/{auth,
// rate-limit,cache,errors,params,keys,loaders}.ts and app/api/v1/**/route.ts).

import type { AppGuide } from './types';

export const medouraGuide: AppGuide = {
  appId: 'medoura',
  intro:
    'The Medoura Landing Page API is a read-only API for building a custom landing page that shows your own live branding, categories, products, pricing and home-page content, then sends visitors into your Medoura checkout.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Every request is made with an API key that belongs to one practice, so each response contains only that practice\'s data. The API is read-only: it never creates orders or collects patient information. Checkout stays in Medoura.',
        },
        {
          kind: 'paragraph',
          text: 'To send a visitor to checkout, link to your own Medoura `/start` page. Each product carries a `start_url_path` (for example `/start?medication_family=semaglutide`). It is a path, not a full URL: prefix it with your own Medoura domain, such as `https://your-practice-domain.com` + `start_url_path`.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'The Landing Page API is an add-on. Until it is enabled for your account, every data endpoint returns `403 feature_not_enabled`.',
        },
      ],
    },
    {
      id: 'quickstart',
      title: 'Quickstart',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Create a key in Settings > API (`/staff/settings/api`), then call each endpoint from your server. Replace the host with your own Medoura domain.',
        },
        {
          kind: 'code',
          language: 'bash',
          code:
            'export MEDOURA_API_KEY="med_live_..."\nexport MEDOURA_HOST="https://your-practice-domain.com"\n\n# Branding: name, logo, colors\ncurl -H "Authorization: Bearer $MEDOURA_API_KEY" "$MEDOURA_HOST/api/v1/branding"\n\n# Categories: the treatment categories you offer\ncurl -H "Authorization: Bearer $MEDOURA_API_KEY" "$MEDOURA_HOST/api/v1/categories"\n\n# Products, optionally filtered to one category\ncurl -H "Authorization: Bearer $MEDOURA_API_KEY" "$MEDOURA_HOST/api/v1/products?category=weight-loss"\n\n# Pricing, plans and promotions\ncurl -H "Authorization: Bearer $MEDOURA_API_KEY" "$MEDOURA_HOST/api/v1/pricing"\n\n# Published home-page content, in English or Spanish\ncurl -H "Authorization: Bearer $MEDOURA_API_KEY" "$MEDOURA_HOST/api/v1/content/home?locale=en"',
        },
        {
          kind: 'paragraph',
          text: 'Use a `category` value returned by `/api/v1/categories`. The category in the example above is illustrative.',
        },
      ],
    },
    {
      id: 'authentication',
      title: 'Authentication',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Send your API key in the `Authorization` header on every request:',
        },
        { kind: 'code', language: 'http', code: 'Authorization: Bearer med_live_...' },
        {
          kind: 'paragraph',
          text: 'Keys are created in Settings > API at `/staff/settings/api`. A key is shown exactly once, when it is created, so copy it immediately. A practice can have up to 10 active keys.',
        },
        {
          kind: 'paragraph',
          text: 'To rotate a key with no downtime: create a new key, switch your server over to it, then revoke the old one.',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Use your key from your server only. The API does not send CORS headers, so browsers cannot call it directly, and a key shipped in browser code is a leaked key. Fetch on your server (or at build time) and pass the data to your page.',
        },
      ],
    },
    {
      id: 'rate-limits',
      title: 'Rate Limits',
      blocks: [
        {
          kind: 'table',
          table: {
            headers: ['Window', 'Limit per key'],
            rows: [
              ['Per minute', '60 requests'],
              ['Per day', '5,000 requests'],
            ],
          },
        },
        {
          kind: 'paragraph',
          text: 'Over the limit, the API returns `429 rate_limited` with a `Retry-After` header giving the seconds to wait. Combine the caching below with your own server-side cache so a busy landing page does not spend your budget on every visit.',
        },
      ],
    },
    {
      id: 'caching',
      title: 'Caching',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Responses carry `Cache-Control: private, max-age=<seconds>` and a weak `ETag`. Send the ETag back in `If-None-Match` and an unchanged response returns `304 Not Modified` with no body.',
        },
        {
          kind: 'table',
          table: {
            headers: ['Endpoint', 'max-age'],
            rows: [
              ['/api/v1/branding', '600 s'],
              ['/api/v1/categories', '600 s'],
              ['/api/v1/products', '600 s'],
              ['/api/v1/content/{pageKey}', '60 s'],
              ['/api/v1/pricing', '60 s'],
            ],
          },
        },
        {
          kind: 'code',
          language: 'bash',
          code:
            'curl -i -H "Authorization: Bearer $MEDOURA_API_KEY" \\\n  -H \'If-None-Match: W/"<etag from the previous response>"\' \\\n  "$MEDOURA_HOST/api/v1/products"',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Turning the add-on on or off can take up to 5 minutes to take effect.',
        },
      ],
    },
    {
      id: 'errors',
      title: 'Errors',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Every error uses one shape:',
        },
        {
          kind: 'code',
          language: 'json',
          code:
            '{\n  "error": {\n    "code": "validation_failed",\n    "message": "Invalid locale",\n    "details": [{ "field": "locale", "message": "Must be \\"en\\" or \\"es\\"" }]\n  }\n}',
        },
        {
          kind: 'paragraph',
          text: '`details` appears only on validation errors.',
        },
        {
          kind: 'table',
          table: {
            headers: ['Status', 'Code', 'Meaning'],
            rows: [
              ['401', 'invalid_key', 'The key is missing, invalid or revoked.'],
              ['403', 'feature_not_enabled', 'The Landing Page API is not enabled for this account.'],
              ['404', 'not_found', 'Unknown category or page key.'],
              ['422', 'validation_failed', 'A query parameter is invalid, such as an unsupported locale.'],
              ['429', 'rate_limited', 'Too many requests. Wait for `Retry-After` seconds.'],
              ['500', 'internal_error', 'Unexpected server error. Retry with backoff.'],
            ],
          },
        },
      ],
    },
    {
      id: 'categories-filter',
      title: 'Filtering by Category',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Pass `?category=<key>` to `/api/v1/products` or `/api/v1/pricing` to narrow the response to one category. Use a key returned by `/api/v1/categories`; an unknown key returns `404 not_found`.',
        },
        {
          kind: 'paragraph',
          text: 'On `/api/v1/pricing` the filter applies to `products` only. `promos`, `nutritionProducts`, `nutritionBundles` and `stateCoverage` are not category-filtered and are always returned in full.',
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      blocks: [
        {
          kind: 'paragraph',
          text: 'In v1 the only content page is `home`: `GET /api/v1/content/home`. Any other page key returns `404 not_found`. Add `?locale=en` or `?locale=es` to choose the language (default `en`). Only published content is returned; drafts are never exposed.',
        },
      ],
    },
    {
      id: 'versioning',
      title: 'Versioning',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The API is versioned in the path (`/api/v1`). Within v1, changes are additive only: new fields and endpoints may appear, but existing fields are not removed or renamed. Ignore fields you do not recognize.',
        },
      ],
    },
  ],
};
