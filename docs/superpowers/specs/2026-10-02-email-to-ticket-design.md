# Email-to-Ticket: A Support Inbox for Mail to support@cofabri.com

Status: draft for review · 2026-10-02 · Roadmap piece 1 of 5 after [Support Intake v1](2026-10-01-support-intake-v1-design.md) and the [Support Chatbot](2026-10-02-support-chatbot-design.md)

## Goal

People already email support@cofabri.com, and none of that mail becomes a case
today. v1 of this piece puts every message in front of support staff in Core,
lets them turn the real ones into cases with one click, and attaches customer
replies to the case they belong to. Success is that no support email is missed
and spam never creates a case.

## Decisions Already Made (with Noah)

- **Nothing becomes a case automatically.** The address is public, so it gets
  spam. Mail lands in a Support Inbox (pending); a person creates a case,
  dismisses it, or blocks the sender.
- **Receiving path: Resend inbound.** Resend already sends all CoFabri email.
  A new subdomain receives mail for Resend, and one address on it is added to
  the existing support@ Google Group as a member. The group keeps working
  exactly as today.
- **Receive only.** Staff keep replying from Gmail. Sending replies from Core
  belongs to roadmap piece 2 (conversation-style cases).
- **Logic lives in Core**, not cofabri-api: the Inbox UI, case creation,
  ticket numbers and staff notifications are all in Core already.
- **Health information:** the Inbox is visible to support staff only; dismissed
  and blocked mail is purged after 30 days; Create Case keeps the email text,
  as the web form does today.
- Out of scope: sending from Core, attachments (text only), AI involvement.

## Current State (verified in code)

- support@cofabri.com is a Google Group that fans out to several inboxes.
  There is no mailbox of its own, so Core's Gmail service account cannot read it.
- Core: `support_cases` (ticket number is `ticket_submission_id`, shown as
  `CS-<n>` via `lib/support/ticket-number.ts`), page `app/dashboard/support`
  with `components/support/support-page-client.tsx`, intake helper
  `lib/support/intake.ts`, notifications via `lib/push/notify-roles.ts` and
  `sendNotification`. There is no case notes or messages table.
- The confirmation email (cofabri-api) already carries `CS-<n>` in its subject
  and says "Reply to this email to add details", so customer replies arrive
  with the number in the subject.
- Resend is the only email vendor (`resend` in cofabri-api).

## Design

### 1. Receiving

- DNS: a subdomain (`tickets.cofabri.com`) with Resend's inbound MX record. The
  address `support@tickets.cofabri.com` is added to the support@ Google Group
  as an external member. Both steps are done by Noah, after the code is live.
- Resend posts an inbound event to `POST /api/webhooks/resend-inbound` in Core.
  The route verifies the signature (Resend signs webhooks with Svix headers
  `svix-id`, `svix-timestamp`, `svix-signature`) against
  `RESEND_INBOUND_WEBHOOK_SECRET`, rejects stale timestamps, then fetches the
  message from Resend's receiving API using the event's email id. The exact
  event name and fetch endpoint are verified against current Resend docs in
  plan Task 1 before any code is written.
- The route always answers 2xx for events it has handled or deliberately
  ignored, and 5xx only for real failures so Resend retries. Retries are
  idempotent on the Resend email id (unique column).

### 2. What is saved (`support_inbound_emails`)

One new table. Columns: `id`, `resend_email_id` (unique), `message_id`,
`in_reply_to`, `from_email`, `from_name`, `subject`, `body_text` (capped at
20,000 characters; HTML is reduced to text, never stored or rendered),
`received_at`, `status`, `case_id` (nullable), `handled_by`, `handled_at`,
`created_at`.

`status` is one of `pending`, `attached`, `converted`, `dismissed`, `blocked`.
Statuses `dismissed` and `blocked` are purged 30 days after `handled_at` by a
daily cron that already follows the pattern of Core's other crons.
A second table `support_blocked_senders` (`email` unique, `blocked_by`,
`created_at`) holds blocked addresses.

RLS on both tables: enabled, no policies for anon or authenticated; reads and
writes happen through Core's server code with the admin client behind the
existing support-section access check.

### 3. Filtering before saving

Dropped silently (counted in a log line, not saved), because they are never a
person writing in:
- Messages with `Auto-Submitted` other than `no`, `Precedence: bulk/junk/list`,
  or a `Return-Path` of `<>` (bounces and out-of-office replies).
- Senders in `support_blocked_senders`.
- Messages from CoFabri's own sending addresses (loop protection), and any
  message whose `Message-ID` was already seen.

Everything else is saved as `pending` or `attached` (below).

### 4. Replies to existing cases

If the subject contains a ticket number matching `CS-<n>` (case-insensitive),
and the sender address equals the case's submitter email, the message is saved
as `attached` with `case_id` set, and the case's staff are notified. If either
test fails, it is saved as `pending` like any other mail, so a stranger who
guesses a number cannot write onto a case. A reply to a closed case does not
reopen it; staff see the notification.

### 5. The Support Inbox in Core

- A new "Inbox" tab on the Support page with a count of pending items, newest
  first, showing sender, subject and a text preview. Opening a row shows the
  full text (rendered as plain text).
- **Create Case:** creates a `customer_ticket` case with entry point `email`,
  subject from the email subject, description from the body, contact from the
  sender, and links the email (`status = converted`, `case_id`). The case
  drawer opens afterwards. Uses the existing case-creation path in
  `lib/support/intake.ts` and its task rule.
- **Dismiss:** `status = dismissed`.
- **Block Sender:** `status = blocked`, adds the address to
  `support_blocked_senders`, and also dismisses the other pending mail from the
  same address.
- All labels Title Case; body text sentence case.
- Attached replies appear in the case drawer under an "Emails" section, oldest
  first.

### 6. Notifications

A new notification type `support_inbound_email` (registered in the push
types and the per-type preferences list). New pending mail notifies the
support roles through `notifyRoles`, with a dedup key per email. Attached
replies notify the case's assignee, or the support roles when unassigned.
Notifications are batched by the existing dedup so a flood of spam produces at
most one notification per sender per hour.

## Error Handling

- Signature failure: 401, nothing saved, logged as a warning.
- Resend fetch failure: 5xx so Resend retries; after retries are exhausted the
  failure logs as an error task (a real problem, per the error-task rule).
- Oversized or malformed bodies are truncated, never rejected.
- A DB failure returns 5xx; idempotency makes the retry safe.

## Testing

- Unit: signature verification (valid, wrong secret, stale timestamp), the
  filter rules (each header case), ticket-number and sender matching (match,
  wrong sender, unknown number, lower-case, closed case), body-to-text
  reduction, idempotency on a repeated email id.
- Integration with a fake signed webhook against a local Core: pending row,
  attached row, dropped bounce, blocked sender.
- Component/browser: Inbox tab count, each of the three actions, the case
  drawer "Emails" section, and that the page actually refreshes after each
  action.
- Production check after DNS: one real email to the group, one real reply to a
  confirmation email.
- Run Core's full CI gates before pushing.

## Rollout

1. Core migration (two tables, notification type), then Core code. Nothing
   changes for anyone until the webhook is configured.
2. Resend: add the inbound domain and webhook (needs Noah for DNS), set
   `RESEND_INBOUND_WEBHOOK_SECRET` in Core.
3. Send a test email to the new address directly, check the Inbox.
4. Add the address to the support@ Google Group (Noah). Watch the Inbox.
5. Update the confirmation email text only if staff want customers to see a
   different reply address; not required.

## Out of Scope (v1)

Sending replies from Core, attachments, AI summaries or drafts, automatic
case creation, per-sender rules beyond block, spam scoring, multiple
mailboxes, and a customer "My Tickets" view. These belong to later roadmap
pieces (conversation-style cases, rules and SLA).

## Open Questions

- Does the current Resend plan include inbound email? Confirmed in plan Task 1.
- Which roles should be notified for new pending mail: the same roles that
  receive new-case notifications today? Plan assumes yes.
