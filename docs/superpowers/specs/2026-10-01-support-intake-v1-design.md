# Support Intake v1: Easier Ticket Submission From Every App

Status: draft for review · 2026-10-01

## Goal

Get more people to file support tickets. Today almost nobody does. Gathr and
Medoura link out to `cofabri.com/support`, Praxis and RxBridge have no link
at all, and the form itself is long and blocks submission without a phone
number that is never even stored.

v1 is deliberately small: remove friction, put a help entry in every app,
confirm receipt, and measure whether it worked. It is **not** a support
platform. The larger roadmap (below) is deferred until v1 shows usage.

## Decisions Already Made

- Patient PHI must stay out of `support_cases`. Patient-facing flows route
  care questions to the clinic and accept product issues only.
- No clinic-run support queues. Cases stay CoFabri-owned.
- Slack is not a channel. "My tickets" is handled by email for now.
- No signed tokens or identity handoff in v1. The form already prefills from
  query params and is a public form, so verified identity adds nothing yet.
- The chatbot, email-to-ticket and everything else in the roadmap come after
  v1 ships.

## Current State (verified in code)

- Website `/support` (`SupportForm.tsx`) reads `app`, `subject`, `firstName`,
  `lastName`, `email`, `phone`, `language` from the URL. It ignores
  `referrer` and `tenant`, which Medoura already sends.
- The form requires phone client-side; `api/support/route.ts` does not
  forward it and cofabri-api has no column for it.
- Submission: website `POST /api/support` (Turnstile) then cofabri-api
  `POST /web/forms/support` (`WebFormsService.submitSupportTicket`), which
  inserts into `support_cases` and `support_case_screenshots`. No
  confirmation email to the submitter was found.
- Apps: Medoura has `lib/support-urls.ts` (tenant-tagged for patient
  surfaces), a Settings "Help" card, and a patient-portal mailto. Gathr has
  `src/lib/support.ts`. Praxis and RxBridge have Help Center pages with no
  support link.

## Design

### 1. Shorter form (cofabri-website)

- Phone becomes optional. Phone is stored if given (see section 5).
- When `firstName`, `lastName` and `email` arrive in the URL, collapse the
  identity fields into one line, "Submitting as Name (email)", with a
  Change control. Prefill company from `tenant` when present.
- When `app` is a known app, hide the app picker and show the app as a
  label, with Change.
- Contact method defaults to Email and moves under "More options". Language
  keeps its URL prefill.
- Direct visitors with no params get the same form as today minus the phone
  requirement.
- Screenshots stay optional for staff and direct visitors.

### 2. URL contract (documented once, used by every app)

Existing, unchanged: `app`, `subject` (`support` | `feature`), `firstName`,
`lastName`, `email`, `phone`, `language`.

New:
- `from`: entry point, one of `website` (default when absent), `help-menu`, `error-page`, `settings`,
  `patient-account`, `help-center`, `landing`. Unknown values are stored as
  `other`. Free text is never stored.
- `tenant`: tenant display name (Medoura already sends this). Now read and
  stored.
- `audience`: `staff` (default) or `patient`.
- `referrer` is ignored. Medoura currently sends `referrer=Medoura`; its helper
  drops it when it adds `from`.

All values are length-capped and sanitized server-side. They are prefill and
analytics only; nothing is trusted for authorization.

### 3. Patient mode (`audience=patient`)

Enforced by the website page, not by each app:
- Banner at the top: questions about care, orders or prescriptions should go
  to the clinic (clinic name shown when `tenant` is known).
- Identity params are ignored; the form asks for name and email.
- Screenshot upload is hidden (a screenshot can itself contain PHI).
- The description is labelled for product problems only.

### 4. PHI notice (all audiences)

A short, non-blocking notice under the description field: "Please don't
include health information. We can help without it." No detection or
redaction in v1.

### 5. Data changes (additive, nullable)

On `support_cases`: `entry_point text`, `tenant_name text`, `phone text`,
`audience text`. cofabri-api `submitSupportTicket` writes them. The existing
`source` column is left alone because other flows (monitoring) use it.
Core's `types/database.ts` is regenerated and the case detail view shows
entry point, tenant and phone. Migration ownership (Core vs cofabri-api
`supabase/` dir) is decided in the plan.

### 6. Confirmation email (cofabri-api)

After a successful insert, email the submitter:
- Subject (Title Case): "We Received Your Support Request (CS-<ticket number>)".
- Body (sentence case): confirms receipt, the ticket number, the one
  business day reply expectation, and "Reply to this email to add details".
  It does **not** echo the description. Reply-to is the support mailbox.
- A send failure is logged as a warning and never fails the submission.
- Registered in Core's Email Templates catalog like the other emails.
- This is the "My tickets by email" mechanism: replies go to the mailbox and
  are handled manually as today.

### 7. Entry points in every app

One help entry plus an error-state link, using each app's own URL helper
that follows section 2. No shared package yet.

| App | Add / change |
|---|---|
| Medoura | Existing entry points get `from`: staff Help page `help-center`, Settings Help card `settings`, QuickActionsHub `help-menu`, patient footer/dialog `patient-account` (`audience=patient`), `global-error` `error-page`. Fix the staff error toast, which links to the cofabri.com home page instead of `/support`. |
| Praxis | New "Still Need Help?" card at the bottom of the Help Center page (`from=help-center`). The sidebar already has a Help item. |
| RxBridge | Same as Praxis. |
| Gathr | Existing links get `from`: sidebar `help-menu`, footer and landing header `landing`, advertise shell `landing`. |

A visible support email address appears on `/support` and in the Help
Centers. Mail sent there does not create a case in v1 (known gap, covered
by email-to-ticket in the roadmap).

### 8. Measuring adoption

- Before launch, record the trailing 90-day case count by `app_id`.
- After launch, compare using `entry_point`, `tenant_name` and `audience`
  (a SQL query or a simple list in Core; no new dashboard in v1).

## Error Handling

- Unknown or oversized params are dropped, not errors.
- Confirmation email failure never blocks the ticket.
- If cofabri-api is down, the existing 502/503 behavior stays.
- Direct visits with no params keep working.

## Testing

- Unit: URL param parsing and sanitization; per-app URL builders;
  confirmation email builder (Title Case subject, no description echo).
- Website e2e (extend `tests/e2e/support/stub-api.mjs`): prefilled
  collapse, patient mode (banner, no screenshots, identity ignored), phone
  optional, new fields reach the API.
- Browser pass in Chrome on a preview for staff, patient and direct
  visitors; verify the case appears in Core with the new fields (check the
  UI actually updates, not just that the save succeeded).
- Each repo: read `ci.yml` and run lint, typecheck, tests and build before
  pushing, then check the CI run.

## Rollout

1. Core migration and types, then cofabri-api (new fields plus email).
   Backward compatible; nothing changes for users yet.
2. Website form and patient mode.
3. Apps, one at a time. Commit locally and push once per finished piece to
   limit deploys.

## Out of Scope (Roadmap, After v1)

Website chatbot grounded in the KB that can file cases; email-to-ticket;
the ⌘K assistant, public API and MCP channels; a conversation-style case
model with tenant ownership; signed identity and auto-captured context;
in-app widget; PHI detection and redaction; rules engine, SLA, macros,
AI-drafted replies; CSAT, incident banner, KB deflection, My Tickets
in-app; SMS and voicemail.

## Open Questions

- Which repo owns the `support_cases` migration (Core vs cofabri-api)?
- Is Praxis/RxBridge's user menu the right home for Help, or the sidebar
  footer? Decide per app in the plan after looking at each layout.
