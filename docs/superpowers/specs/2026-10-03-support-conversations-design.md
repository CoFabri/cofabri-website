# Support Conversations: Reply to Customers From Inside Core

Status: draft for review · 2026-10-03 · Roadmap piece 2 of 5, follows [Email-to-Ticket](2026-10-02-email-to-ticket-design.md)

## Goal

Today a case holds one description, customer replies sit as read-only
"Emails" under it, and staff answer from Gmail, so Core cannot show what the
team said back. This piece gives every case one thread in Core: the customer's
messages, the team's replies and internal notes. Staff reply from inside Core,
the customer receives a normal email, and the customer's answer lands back in
the same thread. Success: anyone on the team can open a case and read the whole
conversation without checking anyone's Gmail.

## Decisions Already Made (with Noah)

- **Replies come from the team, not a person.** Sender name "CoFabri Support",
  Reply-To `support@cofabri.com` (the Google Group), signed with the sending
  teammate's first name. Customers always reply to the shared address; their
  answer returns through the group and the Inbox address (already built) and
  attaches to the case.
- **Reply from inside Core** is the point; no Gmail "send as" setup.
- **Internal notes** live in the same thread: visually distinct, never emailed.
- **Defaults accepted:** only people who can see the Support page can reply or
  add notes; sending a reply moves an `open` case to `in_progress` and never
  changes `resolved` or `closed`; a customer reply that attaches to a case keeps
  notifying the assignee as it does today; no attachments or CC in v1 (the email
  gateway does not support them); only cases with a customer email can be
  replied to (monitoring-created `internal_issue` cases cannot); existing
  attached/converted inbox emails become messages in the thread.
- **Approach:** one new table holds the whole thread (not a second table merged
  at read time, and the Inbox queue table is not widened).

## Current State (verified in code)

- Core: `support_cases` (statuses `open`, `in_progress`, `resolved`, `closed`;
  `ticket_submission_id` shown as `CS-<n>`; `email`, `first_name`, `last_name`,
  `assignee_id`, `description`), page `components/support/support-page-client.tsx`
  with a drawer that renders `SupportCaseSubmissionDetails` and
  `SupportCaseEmails` (`components/support/support-case-emails.tsx`, reads
  `GET /api/support/cases/[id]/emails`).
- Inbound email (built): `support_inbound_emails` (statuses `pending`,
  `attached`, `converted`, `dismissed`, `blocked`), `lib/support/inbound/*`,
  Inbox view, purge cron. A reply is `attached` when its subject has `CS-<n>`
  and the sender equals the case's email; ingest then calls
  `deps.notifyAttached`.
- Sending: `lib/email/send-via-gateway.ts` posts to cofabri-api
  `POST /communications/email` as app `cofabri-core`. The gateway accepts
  `from_name`, `reply_to`, `tags`, `metadata` but not custom headers, CC or
  attachments. Core currently drops `from_name`/`reply_to` (the helper does not
  pass them).
- Core's code-defined emails are rendered by builders in `lib/email/*` using
  `renderEmailShell` and registered in `lib/email/preview-registry.ts` so the
  Email Templates page lists them.
- **Blocking dependency:** production logs show Core's overdue-task emails
  failing with `cofabri-api rejected email: 401 Invalid API key`. If that is
  Core's gateway key, every reply sent from Core would fail until it is fixed.

## Design

### 1. Data (`support_case_messages`)

One new table, additive, RLS enabled with no policies (server code only, like
the inbound tables):

| Column | Notes |
|---|---|
| `id uuid pk` | |
| `case_id uuid not null` | FK to `support_cases(id)` **on delete cascade** |
| `kind text not null` | check in (`customer`, `team`, `note`) |
| `body_text text not null` | plain text, 1 to 20,000 characters |
| `author_hr_person_id uuid null` | the staff author for `team` and `note`; null for `customer` |
| `from_email text null` | the customer's address for `customer` messages |
| `source_email_id uuid null unique` | FK to `support_inbound_emails(id)` on delete set null; set for messages created from an inbound email (idempotency) |
| `email_status text null` | for `team` only: check in (`sending`, `sent`, `failed`); null for others |
| `email_error text null` | short failure reason (no body text) |
| `client_request_id text null` | per-case unique with `case_id` (partial unique index where not null); makes a double click idempotent |
| `created_at timestamptz default now()` | |

Index `(case_id, created_at)`. The case's original description is **not**
copied: the thread renders it as the first customer message from
`support_cases.description` with the case's created time.

Backfill (in the same migration): one `customer` message per existing
`attached` or `converted` inbox email that has a `case_id`, using
`source_email_id` so it cannot run twice. Production has none today.

Case deletion deletes its messages. (The inbound rows keep `case_id = null` and
are already purged by the daily job.)

### 2. Receiving

When ingest saves an inbound email as `attached`, it also inserts a `customer`
message (`source_email_id` = the inbound row, `from_email`, body). If the message
insert fails the whole ingest fails (500, Resend retries); a duplicate
(`source_email_id` unique violation) is treated as already handled. Create Case
does not add a message (the email body already becomes the case description).
The existing assignee notification is unchanged. A reply on a `resolved` or
`closed` case does not reopen it (unchanged from Email-to-Ticket; reopening
belongs to the rules/SLA piece).

### 3. Sending a reply

`POST /api/support/cases/[id]/messages` with
`{ kind: 'reply' | 'note', body, clientRequestId }`:

- Auth: the same support access as the other support routes.
- Validation: UUID case id; body trimmed, 1 to 10,000 characters for replies,
  1 to 20,000 for notes; `clientRequestId` 8 to 64 chars `[A-Za-z0-9_-]`.
- A reply requires `support_cases.email` to be present, `type = 'customer_ticket'`;
  otherwise 409 with a fixed reason. A note works on any case.
- Idempotency: if a message with the same `(case_id, client_request_id)` already
  exists, return it (no second send).
- Notes: insert and return (`kind = 'note'`, `email_status` null).
- Replies: insert `kind = 'team'`, `email_status = 'sending'`, then send through
  the gateway with subject `Re: <case subject> (CS-<n>)` (the case subject is
  cleaned of control characters and capped at 200 characters; a subject that
  already starts with `Re:` is not prefixed twice), `from_name` "CoFabri
  Support", `reply_to` `support@cofabri.com`, and a body built by a new email
  builder. On success set `email_status = 'sent'` and, if the case is `open`,
  set it to `in_progress`. On failure set `email_status = 'failed'` with a short
  `email_error` (status code and the gateway's message, never the body) and
  return the message with that status (HTTP 200 for the request, the failure is
  data) so the screen can show it. `POST .../messages/[messageId]/retry` re-sends
  a `failed` team message (only `failed` rows are retryable; the update is a
  guarded `failed -> sending` claim so two clicks cannot double-send).
- `sendEmailViaGateway` gains optional `fromName`, `replyTo` and `metadata`
  parameters passed through to the gateway; existing callers are unaffected.
- The new email is "Support Reply" with a code-defined builder
  (`lib/email/support-reply.ts`) using the standard shell, registered in
  `lib/email/preview-registry.ts`. Heading and button-style text are Title Case,
  body text sentence case. The body shows the reply text as escaped paragraphs
  (line breaks kept), a line "Reply to this email to add more details", and the
  signature "<First name>, CoFabri Support". The email never includes the case
  description or any other customer message.
- Health information: the reply text is staff-written; the composer shows a short
  sentence-case reminder under the box, "Please don't include health
  information in replies." (the website form carries the same reminder).

### 4. Reading the thread

`GET /api/support/cases/[id]/messages` returns the case's messages oldest
first, plus the synthesized first customer message from the description, with
author display names resolved from `hr_people`. `team`/`note` rows include the
author's name; `customer` rows include the customer's name from the case. The
existing `GET .../emails` route and `SupportCaseEmails` component are retired in
the same change (the Conversation replaces them).

### 5. Screen (case drawer)

The "Emails" section becomes **Conversation**:

- Messages in order. Customer messages left-aligned with the customer's name;
  team replies right-aligned with "CoFabri Support" and the teammate's name and
  an email status chip (Sending, Sent, Failed); internal notes in a distinct
  tinted box labelled "Internal Note" with the author.
- A composer at the bottom with two tabs, **Reply** and **Internal Note**, a
  textarea, and a **Send Reply** / **Add Note** button. The Reply tab is
  disabled with a sentence-case explanation when the case has no customer email
  or is not a customer ticket.
- After every action the thread reloads from the server (the standing rule: the
  page must actually reflect the change); a failed message shows a **Retry**
  button; the button is disabled while sending; stale responses are ignored.
- Plain text only: message bodies render as text, never HTML or markdown.
- Title Case for labels, tabs, chips and buttons; body text sentence case.

### 6. Failure handling

- Gateway unreachable or rejects: message saved as `failed`, visible with Retry;
  nothing is lost and nothing is silently dropped. This is logged with
  `console.error` (name and status only), since a failed send is a real problem.
- Invalid input or missing customer email: 400/409 with fixed messages.
- A case deleted while the drawer is open: the routes return 404 and the screen
  shows a fixed message.

## Out of Scope (v1)

Attachments and CC, personal sender addresses, customer-facing "My Tickets",
templates/canned replies, scheduled or bulk sends, read receipts, @mentions,
editing or deleting messages, reopening on customer reply, SLA/rules, AI
drafts.

## Testing

- Unit: the message validators, the subject builder (Re: handling, cleaning,
  cap), the reply email builder (escaping, no description echo, Title Case
  heading, signature), the send flow with a fake gateway (success, failure, double
  click, retry claim), ingest writing the customer message (and treating a
  duplicate as handled), the backfill statement logic where testable.
- Component/logic: the thread assembly (synthesized first message, ordering,
  authors) and the composer state (disabled reasons, sending, failed).
- Production browser pass after deploy: open a case, send a reply to a test
  address, receive it, reply from that address, see the answer attach, add a
  note, retry a forced failure if possible; delete test data afterwards.
- Run the repo's full gate set (`pnpm run verify`) before any push; check the CI
  run after.

## Rollout

1. Fix the gateway key (the 401) so replies can send; confirm with one real
   overdue-task email or a test send.
2. Migration (additive, applied live with Noah's go), then Core code.
3. Production browser pass, then enable for everyone (no flag: it only adds a
   composer to the drawer).

## Open Questions

- Is the `401 Invalid API key` Core's own `COFABRI_API_KEY` (rotated or revoked)
  or a gateway-side problem? Resolved in rollout step 1.
- Does the gateway's default From address suit replies (it will say "CoFabri
  Support" via `from_name`)? Confirmed with the first test send.
