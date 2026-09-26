// src/lib/developer-portal/guides/praxis.ts
//
// Hand-written "Getting started" narrative for Praxis -- the conceptual material an OpenAPI
// spec's paths/schemas don't carry: auth model, signature verification (with runnable
// examples), the FHIR mapping table, and errors/limits/versioning. Per-endpoint reference
// content is NOT here: it's rendered fresh from Praxis's own /openapi.json instead, so it
// can't drift from the real route code the way a second hand-maintained copy would.
// Verified against docs/superpowers/specs/2026-09-24-praxis-public-api-design.md directly
// (sections 2-6), not summarized from memory.

import type { AppGuide } from './types';

export const praxisGuide: AppGuide = {
  appId: 'praxis',
  intro:
    'The Praxis API lets any EMR connect self-serve: hand patients off, receive clinical updates as signed FHIR R4 webhooks, and pull the same data on demand for backfill and recovery.',
  sections: [
    {
      id: 'quickstart',
      title: 'Quickstart',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Connect an EMR from the Praxis admin dashboard (Admin > EMR Connections, or Platform Admin > EMR Connections for CoFabri staff): name it, give it an HTTPS webhook URL, and choose which events to subscribe to. Connecting issues an API key and a webhook signing secret -- both are shown exactly once, so copy them immediately.',
        },
        {
          kind: 'paragraph',
          text: 'Send your first patient:',
        },
        {
          kind: 'code',
          language: 'bash',
          code:
            'curl -X POST https://praxisnp.co/api/v1/patients \\\n  -H "Authorization: Bearer prx_live_..." \\\n  -H "Content-Type: application/json" \\\n  -H "Idempotency-Key: handoff-1" \\\n  -d \'{\n    "externalPatientId": "your-emr-id-123",\n    "firstName": "Ada",\n    "lastName": "Lovelace",\n    "state": "CA",\n    "treatmentCategory": "weightLoss"\n  }\'',
        },
        {
          kind: 'paragraph',
          text: 'A `201` (or `200` on a repeat hand-off of the same patient) returns `praxisPatientId` and the created visit. From here, subscribe to `visit.status_changed` and `note.signed` to receive the first event once a Praxis provider claims and completes the visit.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Use the same `Idempotency-Key` for a retried request -- Praxis returns the original response with `Idempotent-Replayed: true` instead of processing it twice.',
        },
      ],
    },
    {
      id: 'authentication',
      title: 'Authentication and key rotation',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Every request to `/api/v1` and `/api/fhir/r4` (except the unauthenticated `GET /api/fhir/r4/metadata`) carries a Praxis API key:',
        },
        { kind: 'code', language: 'http', code: 'Authorization: Bearer prx_live_...' },
        {
          kind: 'paragraph',
          text: 'A key resolves to exactly one connection, and therefore one practice -- no request ever names a practice explicitly. Keys can be revoked instantly from the admin dashboard, and a connection can be paused (every call then returns `403 connection_paused` until resumed).',
        },
        {
          kind: 'paragraph',
          text: 'To rotate a key with zero downtime: issue a second key from the dashboard, switch your integration over to it, then revoke the old one. Multiple active keys per connection are supported for exactly this overlap window.',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'A key is shown in full only once, at creation or rotation. Store it in a secrets manager -- Praxis stores only its SHA-256 hash and cannot show it to you again.',
        },
      ],
    },
    {
      id: 'signatures',
      title: 'Verifying webhook signatures',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Every webhook delivery includes `X-Praxis-Signature: t=<unix-seconds>,v1=<hex-hmac>`, an HMAC-SHA256 of `"<t>.<raw-request-body>"` keyed by your connection\'s webhook signing secret (`whsec_...`, shown once at connect time or rotation). Reject any delivery whose `t` is more than 5 minutes from the current time -- this is replay protection.',
        },
        {
          kind: 'code',
          language: 'javascript',
          code:
            "const crypto = require('crypto');\n\nfunction verifyPraxisSignature(rawBody, secret, header, toleranceSeconds = 300) {\n  const match = /^t=(\\d+),v1=([0-9a-f]{64})$/.exec(header || '');\n  if (!match) return false;\n  const [, tStr, signature] = match;\n  const t = Number(tStr);\n  if (Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;\n\n  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');\n  const a = Buffer.from(expected);\n  const b = Buffer.from(signature);\n  return a.length === b.length && crypto.timingSafeEqual(a, b);\n}\n\n// Test your implementation against this fixed example before going live:\n// secret 'whsec_test_0123456789abcdef0123456789abcdef', t=1735689600,\n// body '{\"resourceType\":\"Bundle\",\"type\":\"collection\",\"entry\":[]}' ->\n// t=1735689600,v1=7d24d3d18fdb2d6edc8e528a1887aed5aef421d03dbb93ac97b426775a269549",
        },
        {
          kind: 'code',
          language: 'python',
          code:
            "import hashlib\nimport hmac\nimport re\nimport time\n\ndef verify_praxis_signature(raw_body: bytes, secret: str, header: str, tolerance_seconds: int = 300) -> bool:\n    match = re.match(r'^t=(\\d+),v1=([0-9a-f]{64})$', header or '')\n    if not match:\n        return False\n    t, signature = int(match.group(1)), match.group(2)\n    if abs(time.time() - t) > tolerance_seconds:\n        return False\n\n    expected = hmac.new(secret.encode(), f'{t}.'.encode() + raw_body, hashlib.sha256).hexdigest()\n    return hmac.compare_digest(expected, signature)\n\n# Same fixed example as the Node.js version above -- both must verify it as valid.",
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Compute the signature over the exact raw request body bytes, before any JSON parsing -- re-serializing a parsed body can reorder keys or change whitespace and break the comparison.',
        },
      ],
    },
    {
      id: 'webhooks',
      title: 'Webhook events',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Subscribed per connection at connect time (editable later). Every event fires only for patients your connection handed off. The machine-readable payload shape for each event is in the "webhooks" section of the OpenAPI document above; this table is the conceptual summary.',
        },
        {
          kind: 'table',
          table: {
            headers: ['Event', 'Fires when', 'Primary resource'],
            rows: [
              ['visit.status_changed', 'A visit moves between queued/assigned/in_progress/completed/cancelled.', 'Encounter'],
              ['note.signed', 'A visit is completed via Confirm & Sign. A draft save never fires this.', 'DocumentReference'],
              ['script.created', 'A prescription is written.', 'MedicationRequest'],
              ['script.status_changed', "A script's status changes.", 'MedicationRequest'],
              ['script.shipment_updated', 'Shipping or tracking information updates.', 'MedicationRequest + Task'],
              ['lab_order.created', 'A lab order is created.', 'ServiceRequest'],
              ['lab_order.status_changed', "A lab order's status changes.", 'ServiceRequest'],
            ],
          },
        },
        {
          kind: 'paragraph',
          text: 'Delivery is at-least-once, not strictly ordered. A payload is a FHIR `Bundle` (`type: collection`); `entry[0]` is the primary resource, followed by related `Patient`/`Practitioner`/`Encounter` resources so you never need a follow-up call. Every resource carries `meta.versionId` and `meta.lastUpdated` -- discard a delivery that is older than one you already have for the same resource.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Missed or out-of-order delivery? Use the read-only FHIR API below to pull current state directly instead of waiting for a redelivery.',
        },
      ],
    },
    {
      id: 'fhir-mapping',
      title: 'FHIR mapping and identifier systems',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Every `Patient` carries an identifier so you can match it back to your own record:',
        },
        {
          kind: 'code',
          language: 'json',
          code: '{ "system": "urn:cofabri:praxis:external-patient-id", "value": "<the externalPatientId you sent>" }',
        },
        {
          kind: 'table',
          table: {
            headers: ['Praxis concept', 'FHIR resource', 'Status mapping'],
            rows: [
              ['Visit', 'Encounter', 'queued/assigned -> planned, in_progress -> in-progress, completed -> finished, cancelled -> cancelled'],
              ['Signed SOAP note', 'DocumentReference', 'status: current, docStatus: final. Inline text/plain, base64, labelled S/O/A/P sections. Unsigned (draft) notes have no FHIR representation.'],
              ['Prescription', 'MedicationRequest', 'pending/processing/verified/ready -> active, on_hold_pending_pa/awaiting_payment -> on-hold, completed -> completed, cancelled -> cancelled, rejected -> cancelled (statusReason: rejected). The raw Praxis status always survives in extension `urn:cofabri:praxis:script-status`.'],
              ['Shipment update', 'Task (linked to the MedicationRequest)', 'Carries tracking details alongside the MedicationRequest.'],
              ['Lab order', 'ServiceRequest', 'ordered -> active (see the generated spec for the complete set in use).'],
              ['Prescriber', 'Practitioner', 'Name plus NPI, when on file.'],
            ],
          },
        },
      ],
    },
    {
      id: 'errors-and-limits',
      title: 'Errors, rate limits, retries, idempotency',
      blocks: [
        {
          kind: 'paragraph',
          text: '/api/v1 errors are always `{ "error": { "code", "message", "details"? } }`; /api/fhir/r4 errors are always a FHIR `OperationOutcome`. Branch on `code` (or `issue[].code`), never on the message text -- see the generated schemas above for the full enum of each.',
        },
        {
          kind: 'table',
          table: {
            headers: ['Status', '/api/v1 code', '/api/fhir/r4 issue code'],
            rows: [
              ['401', 'invalid_api_key', 'security'],
              ['403', 'connection_paused', 'forbidden'],
              ['404', 'not_found', 'not-found'],
              ['409', 'conflict', '--'],
              ['413', 'payload_too_large', '--'],
              ['422', 'validation_failed / idempotency_key_reuse', 'invalid'],
              ['429', 'rate_limited', 'throttled'],
            ],
          },
        },
        {
          kind: 'paragraph',
          text: 'Rate limit: 120 requests per 60 seconds per API key, shared across /api/v1 and /api/fhir/r4 (same key). A `429` includes `Retry-After` in seconds.',
        },
        {
          kind: 'paragraph',
          text: 'A webhook delivery retries on any non-2xx response or timeout, with backoff of 1m, 5m, 30m, 2h, 6h, then 24h (7 attempts total) before being marked failed. After 3 consecutive failed *events* (not failed attempts of one event), the connection auto-pauses and stops attempting further deliveries. There is currently no email or push notification when this happens -- check the connection\'s delivery log in the admin dashboard, which also has a Redeliver action to retry a specific failed event by hand. Use `Idempotency-Key` on `POST /api/v1/patients` to make retries of your own requests safe.',
        },
      ],
    },
    {
      id: 'versioning',
      title: 'Versioning policy',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Within `v1`, changes are additive only: new optional request fields, new response fields, new event types, new error codes. A breaking change ships as `/v2` -- your integration keeps working on `/v1` indefinitely once you\'re on it. `/api/fhir/r4` follows the same policy relative to the fixed FHIR R4 resource shapes it already implements.',
        },
      ],
    },
  ],
};
