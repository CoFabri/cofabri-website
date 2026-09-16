// src/lib/developer-portal/guides/rx-bridge.ts
//
// Ported from rx-bridge's own app/docs/api/page.tsx (the narrative
// "Getting started" content -- auth model, scopes, sandbox mode, rate
// limits, pagination, CORS, naming conventions, error handling). Verified
// against that page directly, not summarized from memory.
//
// Deliberately excludes any mention of POST /provision (server-to-server
// organization provisioning, gated by a separate high-privilege key) --
// that endpoint isn't part of the public partner surface and was kept out
// of rx-bridge's own /openapi.json for the same reason (see that repo's
// lib/openapi/build-spec.ts). The old docs page's "Provision" rate-limit
// tier row and its "Provision" naming-conventions row are omitted here for
// the same reason.

import type { AppGuide } from './types';

export const rxBridgeGuide: AppGuide = {
  appId: 'rx-bridge',
  intro:
    'The RxBridge REST API lets you integrate prescription management into your application. Send scripts, track fulfillment, manage contracts, and receive real-time webhook notifications.',
  sections: [
    {
      id: 'authentication',
      title: 'Authentication',
      blocks: [
        {
          kind: 'paragraph',
          text: 'All API endpoints require authentication via an API key. Include it in one of these headers:',
        },
        {
          kind: 'code',
          language: 'http',
          code: 'Authorization: Bearer rxb_your_api_key_here\n\n# or\n\nx-api-key: rxb_your_api_key_here',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'API keys are shown only once when created. Store them in a secrets manager. Never expose them in client-side code or version control.',
        },
      ],
    },
    {
      id: 'scopes',
      title: 'API Key Scopes',
      blocks: [
        {
          kind: 'paragraph',
          text: 'API keys can be scoped to limit what actions they can perform. An unscoped key (or one with no scopes set) has full access. When creating a key, you can restrict it to specific scopes:',
        },
        {
          kind: 'table',
          table: {
            headers: ['Scope', 'Allows'],
            rows: [
              ['scripts:read', 'List and get script details'],
              ['scripts:write', 'Create scripts'],
              ['pharmacies:read', 'Search pharmacies'],
              ['contracts:read', 'List and get contracts'],
              ['contracts:write', 'Create and update contracts'],
              ['webhooks:manage', 'Register, update, and delete webhooks'],
              ['onboarding:manage', 'Complete prescriber onboarding and update licenses'],
              ['*', 'Full access (all scopes)'],
            ],
          },
        },
        {
          kind: 'paragraph',
          text: 'If a key with limited scopes attempts a forbidden action, the API returns 403 Insufficient scope.',
        },
      ],
    },
    {
      id: 'sandbox',
      title: 'Sandbox / Test Mode',
      blocks: [
        {
          kind: 'paragraph',
          text: 'You can create test API keys for development without affecting production data. Test keys are flagged with isTestKey: true and behave identically to production keys but are visually distinguishable in audit logs and dashboards.',
        },
        {
          kind: 'paragraph',
          text: 'To create a test key, set is_test_key: true when generating a key via the API Keys settings page.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Use test keys during development to verify your integration is working correctly before switching to production keys.',
        },
      ],
    },
    {
      id: 'rate-limits',
      title: 'Rate Limits',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The API enforces per-organization rate limits using a sliding window. Every response includes rate limit headers so you can monitor your usage: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.',
        },
        {
          kind: 'table',
          table: {
            headers: ['Tier', 'Limit', 'Applies to'],
            rows: [
              ['Standard', '100 / minute', 'GET endpoints (list, search, details)'],
              ['Write', '30 / minute', 'POST/PATCH (create scripts, update status)'],
              ['Webhook', '20 / minute', 'Webhook management endpoints'],
            ],
          },
        },
        {
          kind: 'paragraph',
          text: 'If you exceed the limit, the API returns 429 Too Many Requests. Use the X-RateLimit-Reset header to know when to retry.',
        },
      ],
    },
    {
      id: 'pagination',
      title: 'Pagination',
      blocks: [
        {
          kind: 'paragraph',
          text: 'List endpoints return paginated results. Use the page and limit query parameters to control pagination (page defaults to 1, limit defaults to 25 and maxes out at 100).',
        },
        {
          kind: 'code',
          language: 'json',
          code: '{\n  "data": [ ... ],\n  "pagination": {\n    "page": 2,\n    "limit": 10,\n    "total": 47,\n    "total_pages": 5,\n    "has_more": true\n  }\n}',
        },
      ],
    },
    {
      id: 'cors',
      title: 'CORS',
      blocks: [
        {
          kind: 'paragraph',
          text: 'All /api/v1/* endpoints include CORS headers, allowing browser-based integrations to call the API directly. Preflight OPTIONS requests are handled automatically.',
        },
        {
          kind: 'code',
          language: 'http',
          code: 'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS\nAccess-Control-Allow-Headers: Content-Type, Authorization, x-api-key\nAccess-Control-Max-Age: 86400',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Even though CORS allows any origin, API keys should never be exposed in client-side code. Browser-based integrations should proxy API calls through your own backend server.',
        },
      ],
    },
    {
      id: 'naming',
      title: 'Naming Conventions',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The API uses two naming conventions depending on the resource:',
        },
        {
          kind: 'table',
          table: {
            headers: ['Resource', 'Request fields', 'Response fields'],
            rows: [
              ['Scripts', 'camelCase (pharmacyOrgId, patientName)', 'camelCase (medicationName, createdAt)'],
              ['Contracts', 'snake_case (pharmacy_org_id)', 'snake_case (provider_org_name, created_at)'],
              ['Webhooks', 'snake_case (is_active)', 'snake_case (created_at, is_active)'],
              ['Onboarding', 'snake_case (full_legal_name)', 'snake_case (prescriber_id, is_active)'],
              ['Pagination', '—', 'snake_case (total_pages, has_more)'],
            ],
          },
        },
      ],
    },
    {
      id: 'errors',
      title: 'Error Handling',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The API uses standard HTTP status codes. Error responses include a JSON body:',
        },
        {
          kind: 'code',
          language: 'json',
          code: '{\n  "error": "Human-readable error message",\n  "details": { "field": ["Validation error"] }\n}',
        },
        {
          kind: 'table',
          table: {
            headers: ['Status', 'Meaning'],
            rows: [
              ['200', 'Success'],
              ['201', 'Created'],
              ['400', 'Bad request / validation error'],
              ['401', 'Invalid or missing API key'],
              ['403', 'Forbidden (wrong org type, insufficient scope, expired license)'],
              ['404', 'Resource not found'],
              ['429', 'Rate limit exceeded — check X-RateLimit-Reset header'],
              ['500', 'Server error — retry with backoff'],
              ['502', 'Upstream lookup failed (e.g. NPI registry unavailable during prescriber onboarding) — safe to retry'],
            ],
          },
        },
      ],
    },
  ],
};
