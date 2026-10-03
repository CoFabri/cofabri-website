# Support Conversations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every support case gets one thread in Core (customer messages, team replies, internal notes); staff reply from inside Core and the customer's answer lands back in the same thread.

**Architecture:** A new `support_case_messages` table holds the thread. Inbound replies that the Inbox attaches also write a customer message (idempotently, self-healing on Resend retries). A new message service saves a team reply first, then sends it through the existing cofabri-api email gateway (as "CoFabri Support", Reply-To `support@cofabri.com`, subject `Re: <subject> (CS-n)`), marking it sent or failed with Retry. The case drawer's "Emails" section is replaced by a Conversation with a Reply / Internal Note composer. All code is in cofabri-core (paths below are relative to that repo).

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (admin client + request client for `current_hr_person_id`), node:test via `tsx` (`pnpm run test:unit`), pnpm.

**Spec:** `docs/superpowers/specs/2026-10-03-support-conversations-design.md` in the cofabri-website repo (branch `docs/email-to-ticket-spec`). Executors read the spec too.

## Global Constraints

- Replies are sent as the team: `from_name` "CoFabri Support", `reply_to` `support@cofabri.com`, signed with the sending teammate's first name.
- Internal notes are never emailed.
- Only people who can see the Support page can reply or add notes (the same access as `withApiAuth("support")`).
- Sending a reply moves an `open` case to `in_progress` and never changes `resolved` or `closed`.
- Only cases with a customer email and `type = 'customer_ticket'` can be replied to; `internal_issue` cases can only receive notes.
- No attachments or CC in v1 (the gateway does not support them).
- All user-visible labels, tabs, chips, buttons, headings and email headings are **Title Case**; body text is sentence case.
- Message bodies are plain text only: never rendered as HTML or markdown; the reply email escapes the text.
- The reply email never includes the case description or any other customer message.
- Text fields stored or sent must pass `cleanText` (strips NUL/control characters, never splits a surrogate pair); the **email subject** must additionally have every control character, including CR/LF/TAB, replaced by a space (header-injection safety).
- A failed send is a real problem: `console.error` with error name/status only (never message bodies or addresses); expected outcomes (400/404/409) are not logged as errors.
- After every UI action the thread reloads from the server (the standing "verify pages actually update" rule).
- The repo uses pnpm: `pnpm run verify` (lint, `next typegen`, typecheck, `check:api-auth`, unit tests, build) must pass before any push. Never push local `main` of cofabri-core; push only this feature branch to `origin/main` after `git log origin/main..<branch>` shows only this feature's commits, and only with Noah's explicit go.
- Never print secret values; env names only.
- Do not commit anything under `docs/superpowers/` or `.superpowers/` in cofabri-core.

## Review Focus

- A double click on Send Reply sends exactly one email (Task 5 test with the same `clientRequestId`).
- A gateway failure leaves a visible `failed` message with a working Retry, never a lost reply, and a message stuck in `sending` after a crash becomes retryable after 2 minutes (Task 5).
- A subject or body containing CR/LF, NUL, `<script>` or a 50,000-character string cannot break email headers or HTML (Tasks 3 and 4).
- A Resend redelivery of an already-saved attached email creates exactly one customer message, even if the first delivery died before creating it (Task 6).
- A reply on a case with no email, or on an `internal_issue` case, is refused with a clear reason, while a note on the same case works (Tasks 5 and 7).

---

## File Structure

New files:
- `supabase/migrations/20261012100000_support_case_messages.sql` — the table, indexes, RLS, backfill.
- `lib/support/conversation/types.ts` — shared types.
- `lib/support/conversation/format.ts` — request parsing, subject builder, first-name helper, stuck-send rule.
- `lib/support/conversation/thread.ts` — thread assembly and reply availability.
- `lib/support/conversation/service.ts` — create/retry service (dependency-injected).
- `lib/support/conversation/store.ts` — Supabase-backed store and default deps.
- `lib/email/support-reply.ts` — reply email builder.
- `app/api/support/cases/[id]/messages/route.ts` — GET thread, POST message.
- `app/api/support/cases/[id]/messages/[messageId]/retry/route.ts` — POST retry.
- `components/support/support-conversation.tsx` — Conversation section and composer.
- Tests next to each lib/component file.

Modified files:
- `lib/email/send-via-gateway.ts` — optional `fromName`, `replyTo`, `metadata`.
- `lib/email/preview-registry.ts` — register "Support Reply".
- `lib/support/inbound/ingest.ts`, `lib/support/inbound/store.ts` — customer message on attach, self-healing.
- `components/support/support-page-client.tsx` — drawer uses Conversation.
- `types/database.ts` — new table types.

Removed files: `components/support/support-case-emails.tsx` (+ its test), `app/api/support/cases/[id]/emails/route.ts`.

---

### Task 1: Worktree, migration, types

**Files:**
- Create: `supabase/migrations/20261012100000_support_case_messages.sql`
- Modify: `types/database.ts`

**Interfaces:**
- Produces: table `support_case_messages` and its Row/Insert types under `Database["public"]["Tables"]["support_case_messages"]`.

- [ ] **Step 1: Create the worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git fetch -q origin
git worktree add -b feat/support-conversations ../cofabri-core-conversations feat/email-to-ticket
cd ../cofabri-core-conversations
cp ../cofabri-core/.env.local .env.local 2>/dev/null || true
pnpm install --frozen-lockfile
git log --oneline -3
```

Expected: install completes; the branch starts at `340af64c` (it includes the unpushed sidebar commit on top of `origin/main` `721a5694`).

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/20261012100000_support_case_messages.sql`:

```sql
-- Support conversations: one thread per case (customer messages, team replies,
-- internal notes). The case's original description is NOT copied here; the
-- screen renders it as the first customer message.

create table if not exists public.support_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  kind text not null check (kind in ('customer', 'team', 'note')),
  body_text text not null check (char_length(body_text) between 1 and 20000),
  author_hr_person_id uuid references public.hr_people(id) on delete set null,
  from_email text,
  source_email_id uuid unique references public.support_inbound_emails(id) on delete set null,
  email_status text check (email_status in ('sending', 'sent', 'failed')),
  email_error text,
  client_request_id text,
  created_at timestamptz not null default now(),
  -- email_status exists exactly for team replies
  constraint support_case_messages_email_status_matches_kind
    check ((kind = 'team') = (email_status is not null))
);

create index if not exists support_case_messages_case_created_idx
  on public.support_case_messages (case_id, created_at);

-- A double click (same client request id) can never create two rows.
create unique index if not exists support_case_messages_client_request_idx
  on public.support_case_messages (case_id, client_request_id)
  where client_request_id is not null;

alter table public.support_case_messages enable row level security;
revoke all on table public.support_case_messages from anon, authenticated;
-- No policies: only Core's server code (service role) reads or writes this table.

comment on table public.support_case_messages is
  'Thread for a support case. kind customer = inbound customer email; team = reply sent from Core (email_status tracks the send); note = internal, never emailed.';

-- Backfill: each inbound email already attached to a case becomes a customer message.
-- (Converted emails are NOT copied: their text is the case description.)
insert into public.support_case_messages (case_id, kind, body_text, from_email, source_email_id, created_at)
select e.case_id, 'customer', left(e.body_text, 20000), e.from_email, e.id, e.received_at
from public.support_inbound_emails e
where e.status = 'attached' and e.case_id is not null and length(e.body_text) > 0
on conflict (source_email_id) do nothing;
```

- [ ] **Step 3: Check there is no later migration and the guard tests still pass**

Run: `ls supabase/migrations | tail -3` — the new file must sort last.
Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/notifications/type-constraint.test.ts`
Expected: PASS (this migration does not touch `notifications_type_check`).

- [ ] **Step 4: Apply the migration live and update types**

This changes the live database. Confirm with Noah first (he must be outside auto mode for Supabase MCP writes). Project ref `iwpgwnapxuhpsdndvsrv`.

1. Apply the file's SQL with the Supabase MCP `apply_migration` (name `support_case_messages`).
2. Verify: `select count(*) from support_case_messages;` returns 0 (no attached emails exist today), RLS is on (`select relrowsecurity from pg_class where oid = 'public.support_case_messages'::regclass`), and `select count(*) from information_schema.role_table_grants where table_name = 'support_case_messages' and grantee in ('anon','authenticated')` returns 0.
3. Generate types with the MCP `generate_typescript_types`, extract ONLY the `support_case_messages` table block and insert it alphabetically into the `Tables` section of `types/database.ts` (the full generated file differs from the repo in unrelated ways; do not overwrite the file). `git diff --stat types/database.ts` must show only additions for this table.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm exec next typegen && pnpm exec tsc --noEmit
git add supabase/migrations/20261012100000_support_case_messages.sql types/database.ts
git commit -m "feat(support): support_case_messages table for case conversations"
```

Expected: typecheck passes.

---

### Task 2: Gateway helper accepts sender name, Reply-To and metadata

**Files:**
- Modify: `lib/email/send-via-gateway.ts`
- Test: `lib/email/send-via-gateway.test.ts` (create if absent)

**Interfaces:**
- Produces: `SendEmailViaGatewayParams` gains optional `fromName?: string`, `replyTo?: string`, `metadata?: Record<string, string | number | boolean>`; the request body gains `from_name`, `reply_to`, `metadata` **only when provided** (existing callers send an identical body).

cofabri-api's `POST /communications/email` already accepts `from_name`, `reply_to`, `tags`, `metadata` (`cofabri-api/src/routes/communications.js`).

- [ ] **Step 1: Write the failing test**

Create `lib/email/send-via-gateway.test.ts` (read the file first; if a test file already exists add these cases to it, using its mocking style):

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { sendEmailViaGateway } from "./send-via-gateway"

function withFetch(handler: (url: string, init: RequestInit) => Response) {
  const original = globalThis.fetch
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) })
    return handler(url, init)
  }) as typeof fetch
  return { calls, restore: () => (globalThis.fetch = original) }
}

test("sends from_name, reply_to and metadata only when provided", async () => {
  process.env.COFABRI_API_KEY = "test-key"
  const f = withFetch(() => new Response("{}", { status: 200 }))
  try {
    await sendEmailViaGateway({ to: "a@b.com", subject: "S", html: "<p>h</p>", text: "t" })
    await sendEmailViaGateway({
      to: "a@b.com", subject: "S", html: "<p>h</p>", text: "t",
      fromName: "CoFabri Support", replyTo: "support@cofabri.com", metadata: { case_id: "c1" },
    })
  } finally {
    f.restore()
  }
  assert.equal("from_name" in f.calls[0].body, false)
  assert.equal("reply_to" in f.calls[0].body, false)
  assert.equal("metadata" in f.calls[0].body, false)
  assert.equal(f.calls[1].body.from_name, "CoFabri Support")
  assert.equal(f.calls[1].body.reply_to, "support@cofabri.com")
  assert.deepEqual(f.calls[1].body.metadata, { case_id: "c1" })
})

test("a rejected send throws an error that never contains the API key", async () => {
  process.env.COFABRI_API_KEY = "super-secret-key"
  const f = withFetch(() => new Response(JSON.stringify({ message: "Invalid API key" }), { status: 401 }))
  try {
    await assert.rejects(
      () => sendEmailViaGateway({ to: "a@b.com", subject: "S", html: "h", text: "t" }),
      (err: Error) => /401/.test(err.message) && !err.message.includes("super-secret-key")
    )
  } finally {
    f.restore()
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/email/send-via-gateway.test.ts`
Expected: FAIL (first test: `from_name` missing).

- [ ] **Step 3: Implement**

In `lib/email/send-via-gateway.ts` add the three optional fields to `SendEmailViaGatewayParams` and build the body with conditional spreads:

```ts
export interface SendEmailViaGatewayParams {
  to: string
  subject: string
  html: string
  text: string
  tags?: string[]
  /** Display name for the From address (the gateway keeps the verified sending address). */
  fromName?: string
  /** Where the recipient's reply goes. */
  replyTo?: string
  metadata?: Record<string, string | number | boolean>
}
```

and in the `JSON.stringify({...})` call add after `tags: params.tags,`:

```ts
      ...(params.fromName ? { from_name: params.fromName } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
```

- [ ] **Step 4: Run to verify it passes, then the neighbours**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/email/send-via-gateway.test.ts`
Run: `pnpm exec tsc --noEmit` (existing callers must still type-check).
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/send-via-gateway.ts lib/email/send-via-gateway.test.ts
git commit -m "feat(email): let the gateway helper set the sender name, Reply-To and metadata"
```

---

### Task 3: Conversation types, parsing, subject and thread helpers

**Files:**
- Create: `lib/support/conversation/types.ts`, `lib/support/conversation/format.ts`, `lib/support/conversation/thread.ts`
- Test: `lib/support/conversation/format.test.ts`, `lib/support/conversation/thread.test.ts`

**Interfaces:**
- Consumes: `cleanText(value: string, max: number): string` from `lib/support/inbound/parse.ts`.
- Produces (exact):
  - `types.ts`: `MessageKind = "customer" | "team" | "note"`, `EmailStatus = "sending" | "sent" | "failed"`, `MessageRow` (all table columns), `ThreadItem`, `CaseForThread`, `ReplyAvailability`.
  - `format.ts`: `MAX_REPLY_CHARS = 10000`, `MAX_NOTE_CHARS = 20000`, `STUCK_SENDING_MS = 120000`, `parseMessageRequest(body: unknown): ParsedMessageRequest | { ok: false; error: string }`, `buildReplySubject(caseSubject: string, ticketNumber: number): string`, `firstNameOf(name: string | null | undefined): string`, `effectiveEmailStatus(row: Pick<MessageRow, "email_status" | "created_at">, now: Date): EmailStatus | null`.
  - `thread.ts`: `assembleThread(input): ThreadItem[]`, `replyAvailability(c: { email: string | null; type: string | null }): ReplyAvailability`.

- [ ] **Step 1: Write `types.ts`**

```ts
export type MessageKind = "customer" | "team" | "note"
export type EmailStatus = "sending" | "sent" | "failed"

export interface MessageRow {
  id: string
  case_id: string
  kind: MessageKind
  body_text: string
  author_hr_person_id: string | null
  from_email: string | null
  source_email_id: string | null
  email_status: EmailStatus | null
  email_error: string | null
  client_request_id: string | null
  created_at: string
}

/** One entry of a case's rendered thread. */
export interface ThreadItem {
  id: string
  kind: MessageKind
  body: string
  at: string
  /** Staff name for team/note; the customer's name for customer messages; null if unknown. */
  authorName: string | null
  fromEmail: string | null
  /** For team replies only; a stuck "sending" older than STUCK_SENDING_MS is reported as "failed". */
  emailStatus: EmailStatus | null
  emailError: string | null
  /** True only for the first customer message synthesized from the case description. */
  synthesized: boolean
}

export interface CaseForThread {
  description: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface ReplyAvailability {
  canReply: boolean
  /** Sentence-case reason shown in the composer when canReply is false. */
  reason: string | null
}
```

- [ ] **Step 2: Write the failing tests for `format.ts`**

Create `lib/support/conversation/format.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import {
  MAX_NOTE_CHARS,
  MAX_REPLY_CHARS,
  STUCK_SENDING_MS,
  buildReplySubject,
  effectiveEmailStatus,
  firstNameOf,
  parseMessageRequest,
} from "./format"

const ID = "req_12345678"

test("parseMessageRequest accepts a reply and a note and trims the text", () => {
  assert.deepEqual(parseMessageRequest({ kind: "reply", body: "  Hello  ", clientRequestId: ID }), {
    ok: true, kind: "reply", text: "Hello", clientRequestId: ID,
  })
  assert.deepEqual(parseMessageRequest({ kind: "note", body: "x", clientRequestId: ID }), {
    ok: true, kind: "note", text: "x", clientRequestId: ID,
  })
})

test("parseMessageRequest rejects bad shapes with fixed messages", () => {
  for (const bad of [null, undefined, "x", 5, [], {}, { kind: "other", body: "x", clientRequestId: ID }]) {
    const r = parseMessageRequest(bad)
    assert.equal(r.ok, false)
  }
  assert.equal(parseMessageRequest({ kind: "reply", body: "   ", clientRequestId: ID }).ok, false)
  assert.equal(parseMessageRequest({ kind: "reply", body: "x", clientRequestId: "short" }).ok, false)
  assert.equal(parseMessageRequest({ kind: "reply", body: "x", clientRequestId: "bad id with spaces!" }).ok, false)
  assert.equal(parseMessageRequest({ kind: "reply", body: "x", clientRequestId: "a".repeat(65) }).ok, false)
  assert.equal(parseMessageRequest({ kind: "reply", body: "x", clientRequestId: 12345678 }).ok, false)
})

test("parseMessageRequest enforces different caps for replies and notes after cleaning", () => {
  assert.equal(parseMessageRequest({ kind: "reply", body: "a".repeat(MAX_REPLY_CHARS), clientRequestId: ID }).ok, true)
  assert.equal(parseMessageRequest({ kind: "reply", body: "a".repeat(MAX_REPLY_CHARS + 1), clientRequestId: ID }).ok, false)
  assert.equal(parseMessageRequest({ kind: "note", body: "a".repeat(MAX_NOTE_CHARS), clientRequestId: ID }).ok, true)
  assert.equal(parseMessageRequest({ kind: "note", body: "a".repeat(MAX_NOTE_CHARS + 1), clientRequestId: ID }).ok, false)
})

test("parseMessageRequest strips NUL and control characters but keeps line breaks", () => {
  const r = parseMessageRequest({ kind: "reply", body: "a\u0000b\u0007c\nd\te", clientRequestId: ID })
  assert.equal(r.ok && r.text, "abc\nd\te")
  // a body that is only control characters is empty after cleaning
  assert.equal(parseMessageRequest({ kind: "note", body: "\u0000\u0001", clientRequestId: ID }).ok, false)
})

test("buildReplySubject adds Re: and the ticket number once", () => {
  assert.equal(buildReplySubject("Login broken", 1042), "Re: Login broken (CS-1042)")
  assert.equal(buildReplySubject("Re: Login broken", 1042), "Re: Login broken (CS-1042)")
  assert.equal(buildReplySubject("RE: re: Login broken (CS-1042)", 1042), "Re: Login broken (CS-1042)")
  assert.equal(buildReplySubject("   ", 7), "Re: Your Support Request (CS-7)")
})

test("buildReplySubject can never contain a line break or other control character", () => {
  const s = buildReplySubject("Hi\r\nBcc: evil@example.com\u0000\ttab", 5)
  assert.equal(/[\u0000-\u001f\u007f]/.test(s), false)
  assert.ok(s.endsWith("(CS-5)"))
})

test("buildReplySubject caps the case subject at 200 characters", () => {
  const s = buildReplySubject("x".repeat(5000), 9)
  assert.ok(s.length <= 200 + "Re:  (CS-9)".length)
  assert.ok(s.endsWith("(CS-9)"))
})

test("firstNameOf handles full names, blanks and odd input", () => {
  assert.equal(firstNameOf("Alfonso Perez"), "Alfonso")
  assert.equal(firstNameOf("  Dana  "), "Dana")
  assert.equal(firstNameOf(""), "The Team")
  assert.equal(firstNameOf(null), "The Team")
  assert.equal(firstNameOf(undefined), "The Team")
})

test("effectiveEmailStatus reports a stuck sending message as failed", () => {
  const now = new Date("2026-10-12T12:00:00Z")
  const fresh = { email_status: "sending" as const, created_at: new Date(now.getTime() - 5_000).toISOString() }
  const stuck = { email_status: "sending" as const, created_at: new Date(now.getTime() - STUCK_SENDING_MS - 1).toISOString() }
  assert.equal(effectiveEmailStatus(fresh, now), "sending")
  assert.equal(effectiveEmailStatus(stuck, now), "failed")
  assert.equal(effectiveEmailStatus({ email_status: "sent", created_at: stuck.created_at }, now), "sent")
  assert.equal(effectiveEmailStatus({ email_status: "failed", created_at: fresh.created_at }, now), "failed")
  assert.equal(effectiveEmailStatus({ email_status: null, created_at: fresh.created_at }, now), null)
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/format.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `format.ts`**

```ts
import { cleanText } from "@/lib/support/inbound/parse"
import type { EmailStatus, MessageRow } from "./types"

export const MAX_REPLY_CHARS = 10000
export const MAX_NOTE_CHARS = 20000
/** A team reply still "sending" after this long was almost certainly lost (function timeout); it is shown as failed and can be retried. */
export const STUCK_SENDING_MS = 120_000

const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/
const MAX_SUBJECT_CHARS = 200

export type ParsedMessageRequest =
  | { ok: true; kind: "reply" | "note"; text: string; clientRequestId: string }
  | { ok: false; error: string }

export function parseMessageRequest(body: unknown): ParsedMessageRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Invalid request" }
  const record = body as Record<string, unknown>
  const kind = record.kind
  if (kind !== "reply" && kind !== "note") return { ok: false, error: "Invalid message type" }
  const clientRequestId = record.clientRequestId
  if (typeof clientRequestId !== "string" || !REQUEST_ID.test(clientRequestId)) return { ok: false, error: "Invalid request id" }
  if (typeof record.body !== "string") return { ok: false, error: "Message is required" }

  const max = kind === "reply" ? MAX_REPLY_CHARS : MAX_NOTE_CHARS
  // Clean first, then check the limit on what would actually be stored.
  const text = cleanText(record.body, max + 1).trim()
  if (!text) return { ok: false, error: "Message is required" }
  if (text.length > max) return { ok: false, error: "Message is too long" }
  return { ok: true, kind, text, clientRequestId }
}

/** `Re: <case subject> (CS-<n>)`. Single line, control characters removed, subject capped. */
export function buildReplySubject(caseSubject: string, ticketNumber: number): string {
  const singleLine = cleanText(caseSubject, 2000)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const withoutPrefix = singleLine.replace(/^(?:re:\s*)+/i, "").replace(/\s*\(CS-\d+\)\s*$/i, "").trim()
  const base = (withoutPrefix || "Your Support Request").slice(0, MAX_SUBJECT_CHARS).trim()
  return `Re: ${base} (CS-${ticketNumber})`
}

export function firstNameOf(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0]
  return first || "The Team"
}

export function effectiveEmailStatus(
  row: Pick<MessageRow, "email_status" | "created_at">,
  now: Date
): EmailStatus | null {
  if (row.email_status === "sending" && now.getTime() - new Date(row.created_at).getTime() > STUCK_SENDING_MS) return "failed"
  return row.email_status
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/format.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing tests for `thread.ts`**

Create `lib/support/conversation/thread.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { assembleThread, replyAvailability } from "./thread"
import type { MessageRow } from "./types"

const NOW = new Date("2026-10-12T12:00:00Z")
const CASE = {
  description: "I cannot sign in", created_at: "2026-10-12T09:00:00Z",
  first_name: "Pat", last_name: "Lee", email: "pat@example.com",
}

function msg(over: Partial<MessageRow> & Pick<MessageRow, "id" | "kind" | "created_at">): MessageRow {
  return {
    case_id: "c1", body_text: "body", author_hr_person_id: null, from_email: null, source_email_id: null,
    email_status: null, email_error: null, client_request_id: null, ...over,
  }
}

test("the case description becomes the first customer message", () => {
  const t = assembleThread({ caseRow: CASE, messages: [], authors: new Map(), now: NOW })
  assert.equal(t.length, 1)
  assert.equal(t[0].kind, "customer")
  assert.equal(t[0].synthesized, true)
  assert.equal(t[0].body, "I cannot sign in")
  assert.equal(t[0].authorName, "Pat Lee")
  assert.equal(t[0].fromEmail, "pat@example.com")
})

test("an empty description adds no synthesized message", () => {
  const t = assembleThread({ caseRow: { ...CASE, description: "  " }, messages: [], authors: new Map(), now: NOW })
  assert.equal(t.length, 0)
})

test("messages are ordered oldest first with ids as the tie-breaker, authors resolved", () => {
  const messages = [
    msg({ id: "b", kind: "note", created_at: "2026-10-12T10:00:00Z", author_hr_person_id: "h1", body_text: "called back" }),
    msg({ id: "a", kind: "team", created_at: "2026-10-12T10:00:00Z", author_hr_person_id: "h1", email_status: "sent" }),
    msg({ id: "c", kind: "customer", created_at: "2026-10-12T11:00:00Z", from_email: "pat@example.com", body_text: "thanks" }),
  ]
  const t = assembleThread({ caseRow: CASE, messages, authors: new Map([["h1", "Dana Cruz"]]), now: NOW })
  assert.deepEqual(t.map((i) => i.id).slice(1), ["a", "b", "c"])
  assert.equal(t.find((i) => i.id === "a")?.authorName, "Dana Cruz")
  assert.equal(t.find((i) => i.id === "c")?.authorName, "Pat Lee")
})

test("an unknown author falls back to null and a stuck sending reply shows as failed", () => {
  const stuck = msg({ id: "s", kind: "team", created_at: "2026-10-12T11:50:00Z", author_hr_person_id: "gone", email_status: "sending" })
  const t = assembleThread({ caseRow: CASE, messages: [stuck], authors: new Map(), now: NOW })
  const item = t.find((i) => i.id === "s")!
  assert.equal(item.authorName, null)
  assert.equal(item.emailStatus, "failed")
})

test("replyAvailability explains why a reply is not possible", () => {
  assert.deepEqual(replyAvailability({ email: "a@b.com", type: "customer_ticket" }), { canReply: true, reason: null })
  const noEmail = replyAvailability({ email: null, type: "customer_ticket" })
  assert.equal(noEmail.canReply, false)
  assert.match(noEmail.reason ?? "", /email/i)
  const internal = replyAvailability({ email: "a@b.com", type: "internal_issue" })
  assert.equal(internal.canReply, false)
  assert.match(internal.reason ?? "", /internal/i)
  assert.equal(replyAvailability({ email: "   ", type: "customer_ticket" }).canReply, false)
})
```

- [ ] **Step 7: Run to verify it fails, implement `thread.ts`**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/thread.test.ts` — Expected: FAIL (module not found). Then create `lib/support/conversation/thread.ts`:

```ts
import { effectiveEmailStatus } from "./format"
import type { CaseForThread, MessageRow, ReplyAvailability, ThreadItem } from "./types"

export function replyAvailability(c: { email: string | null; type: string | null }): ReplyAvailability {
  if (c.type !== "customer_ticket") {
    return { canReply: false, reason: "This is an internal issue, so replies are not available. You can still add notes." }
  }
  if (!c.email || !c.email.trim()) {
    return { canReply: false, reason: "This case has no customer email, so replies are not available. You can still add notes." }
  }
  return { canReply: true, reason: null }
}

function customerName(c: CaseForThread): string | null {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim()
  return name || null
}

export function assembleThread(input: {
  caseRow: CaseForThread
  messages: MessageRow[]
  /** hr_people id -> display name */
  authors: Map<string, string>
  now: Date
}): ThreadItem[] {
  const { caseRow, messages, authors, now } = input
  const customer = customerName(caseRow)
  const items: ThreadItem[] = []

  if (caseRow.description && caseRow.description.trim()) {
    items.push({
      id: "case-description",
      kind: "customer",
      body: caseRow.description,
      at: caseRow.created_at,
      authorName: customer,
      fromEmail: caseRow.email,
      emailStatus: null,
      emailError: null,
      synthesized: true,
    })
  }

  const sorted = [...messages].sort((a, b) => {
    const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return d !== 0 ? d : a.id.localeCompare(b.id)
  })

  for (const m of sorted) {
    items.push({
      id: m.id,
      kind: m.kind,
      body: m.body_text,
      at: m.created_at,
      authorName: m.kind === "customer" ? customer : m.author_hr_person_id ? authors.get(m.author_hr_person_id) ?? null : null,
      fromEmail: m.from_email,
      emailStatus: effectiveEmailStatus(m, now),
      emailError: m.email_error,
      synthesized: false,
    })
  }
  return items
}
```

- [ ] **Step 8: Run all three files, lint, commit**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/format.test.ts lib/support/conversation/thread.test.ts && pnpm exec eslint lib/support/conversation && pnpm exec next typegen && pnpm exec tsc --noEmit`
Expected: PASS, clean.

```bash
git add lib/support/conversation
git commit -m "feat(support): conversation types, request parsing, reply subject and thread assembly"
```

---

### Task 4: Support Reply email

**Files:**
- Create: `lib/email/support-reply.ts`
- Modify: `lib/email/preview-registry.ts`
- Test: `lib/email/support-reply.test.ts`

**Interfaces:**
- Consumes: `renderEmailShell`, `escapeHtml`, `paragraph` (from `./layout`, `./components`), `getCofabriBranding` (from `./branding`), `RenderedEmail`-shaped result `{ subject, html, text }` like `buildSupportCaseNotifyEmail`.
- Produces: `buildSupportReplyEmail(p: { replyText: string; senderFirstName: string; subject: string }): Promise<{ subject: string; html: string; text: string }>` where `subject` is passed through unchanged (the caller builds it with `buildReplySubject`).

Read `lib/email/support-case-notify.ts` and `lib/email/preview-registry.ts` first and copy their conventions exactly (heading with trailing period, `title`, `eyebrow`, `previewText`, how entries are shaped in the registry).

- [ ] **Step 1: Write the failing tests**

Create `lib/email/support-reply.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { buildSupportReplyEmail } from "./support-reply"

test("the reply text is escaped and keeps line breaks", async () => {
  const mail = await buildSupportReplyEmail({
    replyText: "Hi Pat,\n<script>alert(1)</script> & <b>bold</b>\n\nWe fixed it.",
    senderFirstName: "Dana",
    subject: "Re: Login broken (CS-12)",
  })
  assert.ok(!mail.html.includes("<script>"))
  assert.ok(!mail.html.includes("<b>bold</b>"))
  assert.ok(mail.html.includes("&lt;script&gt;"))
  assert.ok(mail.html.includes("&amp;"))
  assert.ok(mail.html.includes("We fixed it."))
  assert.match(mail.text, /We fixed it\./)
  assert.ok(mail.text.includes("<script>alert(1)</script>")) // plain text part is not HTML
})

test("signs with the sender's first name and invites a reply", async () => {
  const mail = await buildSupportReplyEmail({ replyText: "Done.", senderFirstName: "Dana", subject: "Re: X (CS-1)" })
  assert.match(mail.text, /Dana, CoFabri Support/)
  assert.match(mail.html, /Dana, CoFabri Support/)
  assert.match(mail.text, /Reply to this email to add more details/)
})

test("the subject is passed through unchanged and the heading is Title Case", async () => {
  const mail = await buildSupportReplyEmail({ replyText: "Hi", senderFirstName: "Dana", subject: "Re: Login broken (CS-12)" })
  assert.equal(mail.subject, "Re: Login broken (CS-12)")
  assert.match(mail.html, /Support Reply\./)
})

test("a very long reply does not break the template", async () => {
  const mail = await buildSupportReplyEmail({ replyText: "word ".repeat(5000), senderFirstName: "Dana", subject: "Re: X (CS-1)" })
  assert.ok(mail.html.length > 1000)
  assert.ok(mail.html.includes("</html>") || mail.html.includes("</body>"))
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/email/support-reply.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `lib/email/support-reply.ts`:

```ts
// Server-only — never import from client components.
// The customer-facing email for a reply written in Core's case conversation.
// It carries ONLY the reply text: never the case description or other messages.

import { getCofabriBranding } from "./branding"
import { renderEmailShell } from "./layout"
import { escapeHtml, paragraph } from "./components"

export interface SupportReplyParams {
  replyText: string
  senderFirstName: string
  /** Built by the caller with buildReplySubject (single line, ends with (CS-n)). */
  subject: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export async function buildSupportReplyEmail(p: SupportReplyParams): Promise<RenderedEmail> {
  const branding = await getCofabriBranding()
  const signature = `${p.senderFirstName}, CoFabri Support`

  // One paragraph per blank-line-separated block; single line breaks inside a block become <br>.
  const blocks = p.replyText.replace(/\r\n?/g, "\n").split(/\n{2,}/)
  const replyHtml = blocks
    .map((block) => paragraph(escapeHtml(block).replace(/\n/g, "<br>")))
    .join("")

  const bodyHtml =
    replyHtml +
    paragraph(escapeHtml(signature)) +
    paragraph("Reply to this email to add more details.")

  const html = renderEmailShell({
    bodyHtml,
    branding,
    heading: "Support Reply.",
    title: "Support Reply",
    eyebrow: "CoFabri Support",
    previewText: escapeHtml(p.replyText.replace(/\s+/g, " ").slice(0, 90)),
  })

  const text = [p.replyText, "", signature, "", "Reply to this email to add more details."].join("\n")

  return { subject: p.subject, html, text }
}
```

If `renderEmailShell` requires `ctaHtml` (check its type), pass an empty string or make the field optional in the same commit without changing other callers' output.

- [ ] **Step 4: Register in the preview registry**

In `lib/email/preview-registry.ts` add `import { buildSupportReplyEmail } from "./support-reply"` next to the other imports and a new entry next to the support-case entry, copying that entry's exact shape (id, label "Support Reply", category/section as the neighbours use, `render: () => buildSupportReplyEmail({ replyText: "Hi Pat,\n\nWe reset your account. Try signing in again.", senderFirstName: "Dana", subject: "Re: Password Reset Not Working (CS-1042)" })`). Run the registry's own test if one exists (`lib/email/email-catalog.test.ts`, any registry test) and update any hard-coded count of registered emails.

- [ ] **Step 5: Run to verify, then commit**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/email/support-reply.test.ts lib/email/email-catalog.test.ts && pnpm exec eslint lib/email && pnpm exec tsc --noEmit`
Expected: PASS.

```bash
git add lib/email/support-reply.ts lib/email/support-reply.test.ts lib/email/preview-registry.ts
git commit -m "feat(email): Support Reply email for case conversations"
```

---

### Task 5: Message service (create, send, retry) and store

**Files:**
- Create: `lib/support/conversation/service.ts`, `lib/support/conversation/store.ts`
- Test: `lib/support/conversation/service.test.ts`

**Interfaces:**
- Consumes: `parseMessageRequest` result type, `buildReplySubject`, `firstNameOf`, `MessageRow`, `buildSupportReplyEmail`, `sendEmailViaGateway`.
- Produces (exact):

```ts
export type CaseForSend = {
  id: string; subject: string; email: string | null; type: string | null
  status: string; ticket_submission_id: number | null
}
export class DuplicateRequestError extends Error {}
export type ConversationStore = {
  getCase(caseId: string): Promise<CaseForSend | null>
  findByRequestId(caseId: string, clientRequestId: string): Promise<MessageRow | null>
  getMessage(caseId: string, messageId: string): Promise<MessageRow | null>
  /** Throws DuplicateRequestError when (case_id, client_request_id) already exists. */
  insertMessage(row: NewMessage): Promise<MessageRow>
  /** Atomic: failed -> sending, or sending older than staleBeforeIso -> sending. Returns the claimed row or null. */
  claimForSend(messageId: string, staleBeforeIso: string): Promise<MessageRow | null>
  markSent(messageId: string): Promise<void>
  markFailed(messageId: string, reason: string): Promise<void>
  setCaseInProgressIfOpen(caseId: string): Promise<void>
}
export type NewMessage = {
  case_id: string; kind: "team" | "note"; body_text: string; author_hr_person_id: string
  email_status: "sending" | null; client_request_id: string
}
export type SendEmail = (p: { to: string; subject: string; html: string; text: string; fromName: string; replyTo: string; tags: string[] }) => Promise<void>
export type ConversationDeps = { store: ConversationStore; send: SendEmail; now: () => Date }
export type Author = { hrPersonId: string; firstName: string }
export type CreateResult =
  | { ok: true; message: MessageRow }
  | { ok: false; reason: "not-found" | "no-customer-email" | "not-customer-ticket" }
export function createMessage(input: { caseId: string; author: Author; kind: "reply" | "note"; text: string; clientRequestId: string }, deps: ConversationDeps): Promise<CreateResult>
export type RetryResult = CreateResult | { ok: false; reason: "not-retryable" }
export function retryMessage(input: { caseId: string; messageId: string; author: Author }, deps: ConversationDeps): Promise<RetryResult>
export const SUPPORT_REPLY_TO = "support@cofabri.com"
export const SUPPORT_FROM_NAME = "CoFabri Support"
```

Behaviour: notes work on any case; replies need `type === "customer_ticket"` (else `not-customer-ticket`) and a non-blank email (else `no-customer-email`) and `ticket_submission_id` not null (treat null as `not-found`... no: use `not-customer-ticket`). A reply is saved as `team`/`sending` first; the same `clientRequestId` returns the existing row without sending again; a unique violation race returns the winner's row. After saving: build the subject/email, call `send`; success -> `markSent` and `setCaseInProgressIfOpen`; failure -> `markFailed` with `err.name`/status text only (max 200 chars, never the body) and `console.error`; either way return the latest row (`getMessage`). `retryMessage` claims atomically (`claimForSend`, stale cutoff = `now - STUCK_SENDING_MS`); null claim -> `not-retryable`; then re-sends using the CURRENT case subject/email.

- [ ] **Step 1: Write the failing tests**

Create `lib/support/conversation/service.test.ts` with a fake store that has real atomic semantics (a Map; `claimForSend` checks and writes synchronously) and a recording `send`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import {
  DuplicateRequestError,
  createMessage,
  retryMessage,
  type CaseForSend,
  type ConversationDeps,
  type ConversationStore,
  type NewMessage,
} from "./service"
import type { MessageRow } from "./types"

const NOW = new Date("2026-10-12T12:00:00Z")
const AUTHOR = { hrPersonId: "hr-1", firstName: "Dana" }

function harness(over: { caseRow?: Partial<CaseForSend> | null; sendError?: Error } = {}) {
  const rows = new Map<string, MessageRow>()
  const sends: Array<Record<string, unknown>> = []
  let counter = 0
  const caseRow: CaseForSend | null =
    over.caseRow === null
      ? null
      : { id: "c1", subject: "Login broken", email: "pat@example.com", type: "customer_ticket", status: "open", ticket_submission_id: 1042, ...over.caseRow }
  const caseStatus = { value: caseRow?.status ?? "open" }
  const store: ConversationStore = {
    getCase: async () => (caseRow ? { ...caseRow, status: caseStatus.value } : null),
    findByRequestId: async (caseId, rid) => [...rows.values()].find((r) => r.case_id === caseId && r.client_request_id === rid) ?? null,
    getMessage: async (_c, id) => rows.get(id) ?? null,
    insertMessage: async (m: NewMessage) => {
      if ([...rows.values()].some((r) => r.case_id === m.case_id && r.client_request_id === m.client_request_id)) throw new DuplicateRequestError()
      const row: MessageRow = {
        id: `m${++counter}`, case_id: m.case_id, kind: m.kind, body_text: m.body_text, author_hr_person_id: m.author_hr_person_id,
        from_email: null, source_email_id: null, email_status: m.email_status, email_error: null,
        client_request_id: m.client_request_id, created_at: NOW.toISOString(),
      }
      rows.set(row.id, row)
      return { ...row }
    },
    claimForSend: async (id, staleBeforeIso) => {
      const r = rows.get(id)
      if (!r) return null
      const stuck = r.email_status === "sending" && r.created_at < staleBeforeIso
      if (r.email_status !== "failed" && !stuck) return null
      r.email_status = "sending"
      return { ...r }
    },
    markSent: async (id) => { const r = rows.get(id)!; r.email_status = "sent"; r.email_error = null },
    markFailed: async (id, reason) => { const r = rows.get(id)!; r.email_status = "failed"; r.email_error = reason },
    setCaseInProgressIfOpen: async () => { if (caseStatus.value === "open") caseStatus.value = "in_progress" },
  }
  const deps: ConversationDeps = {
    store,
    now: () => NOW,
    send: async (p) => {
      sends.push(p)
      if (over.sendError) throw over.sendError
    },
  }
  return { deps, rows, sends, caseStatus }
}

test("a reply is saved, emailed as the team, marked sent and moves an open case to in_progress", async () => {
  const h = harness()
  const r = await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "We fixed it.", clientRequestId: "req-00000001" }, h.deps)
  assert.equal(r.ok && r.message.email_status, "sent")
  assert.equal(h.sends.length, 1)
  assert.equal(h.sends[0].to, "pat@example.com")
  assert.equal(h.sends[0].subject, "Re: Login broken (CS-1042)")
  assert.equal(h.sends[0].fromName, "CoFabri Support")
  assert.equal(h.sends[0].replyTo, "support@cofabri.com")
  assert.equal(h.caseStatus.value, "in_progress")
})

test("a resolved or closed case keeps its status after a reply", async () => {
  for (const status of ["resolved", "closed"]) {
    const h = harness({ caseRow: { status } })
    h.deps.store.setCaseInProgressIfOpen = async () => {
      if (h.caseStatus.value === "open") h.caseStatus.value = "in_progress"
    }
    await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "Hello", clientRequestId: "req-00000002" }, h.deps)
    assert.equal(h.caseStatus.value, status)
  }
})

test("a double click with the same client request id sends exactly one email", async () => {
  const h = harness()
  const input = { caseId: "c1", author: AUTHOR, kind: "reply" as const, text: "Once", clientRequestId: "req-00000003" }
  const [a, b] = await Promise.all([createMessage(input, h.deps), createMessage(input, h.deps)])
  assert.equal(h.sends.length, 1)
  assert.equal(h.rows.size, 1)
  assert.ok(a.ok && b.ok)
})

test("a gateway failure keeps the message as failed with a short reason and no body text", async () => {
  const err = Object.assign(new Error("[send-via-gateway] cofabri-api rejected email: 401 Invalid API key"), { name: "Error" })
  const h = harness({ sendError: err })
  const r = await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "SECRET BODY", clientRequestId: "req-00000004" }, h.deps)
  assert.ok(r.ok)
  assert.equal(r.ok && r.message.email_status, "failed")
  assert.match((r.ok && r.message.email_error) || "", /401/)
  assert.ok(!((r.ok && r.message.email_error) || "").includes("SECRET BODY"))
  assert.equal(h.caseStatus.value, "open") // a failed send does not move the case
})

test("retry re-sends a failed message once and a second retry is refused", async () => {
  const h = harness({ sendError: new Error("boom") })
  const created = await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "Hi", clientRequestId: "req-00000005" }, h.deps)
  assert.ok(created.ok)
  const id = created.ok ? created.message.id : ""
  h.deps.send = async (p) => { h.sends.push(p) } // gateway recovered
  const [r1, r2] = await Promise.all([
    retryMessage({ caseId: "c1", messageId: id, author: AUTHOR }, h.deps),
    retryMessage({ caseId: "c1", messageId: id, author: AUTHOR }, h.deps),
  ])
  const oks = [r1, r2].filter((r) => r.ok).length
  assert.equal(oks, 1)
  assert.ok([r1, r2].some((r) => !r.ok && r.reason === "not-retryable"))
  assert.equal(h.sends.length, 2) // original failed attempt + one retry
  assert.equal(h.rows.get(id)?.email_status, "sent")
})

test("a message stuck in sending for over 2 minutes can be retried but a fresh one cannot", async () => {
  const h = harness()
  const created = await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "Hi", clientRequestId: "req-00000006" }, h.deps)
  const id = created.ok ? created.message.id : ""
  const row = h.rows.get(id)!
  row.email_status = "sending"
  row.created_at = new Date(NOW.getTime() - 10_000).toISOString()
  assert.deepEqual(await retryMessage({ caseId: "c1", messageId: id, author: AUTHOR }, h.deps), { ok: false, reason: "not-retryable" })
  row.created_at = new Date(NOW.getTime() - 130_000).toISOString()
  const r = await retryMessage({ caseId: "c1", messageId: id, author: AUTHOR }, h.deps)
  assert.ok(r.ok)
})

test("notes are saved without sending anything, on any case", async () => {
  const h = harness({ caseRow: { email: null, type: "internal_issue" } })
  const r = await createMessage({ caseId: "c1", author: AUTHOR, kind: "note", text: "called back", clientRequestId: "req-00000007" }, h.deps)
  assert.ok(r.ok)
  assert.equal(r.ok && r.message.kind, "note")
  assert.equal(r.ok && r.message.email_status, null)
  assert.equal(h.sends.length, 0)
})

test("a reply is refused on a case with no email or an internal issue, and nothing is saved or sent", async () => {
  const noEmail = harness({ caseRow: { email: "  " } })
  assert.deepEqual(await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "x", clientRequestId: "req-00000008" }, noEmail.deps), { ok: false, reason: "no-customer-email" })
  const internal = harness({ caseRow: { type: "internal_issue" } })
  assert.deepEqual(await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "x", clientRequestId: "req-00000009" }, internal.deps), { ok: false, reason: "not-customer-ticket" })
  for (const h of [noEmail, internal]) {
    assert.equal(h.rows.size, 0)
    assert.equal(h.sends.length, 0)
  }
})

test("an unknown case returns not-found", async () => {
  const h = harness({ caseRow: null })
  assert.deepEqual(await createMessage({ caseId: "c1", author: AUTHOR, kind: "note", text: "x", clientRequestId: "req-00000010" }, h.deps), { ok: false, reason: "not-found" })
})

test("the email subject cannot carry a line break from the case subject", async () => {
  const h = harness({ caseRow: { subject: "Hi\r\nBcc: evil@example.com" } })
  await createMessage({ caseId: "c1", author: AUTHOR, kind: "reply", text: "x", clientRequestId: "req-00000011" }, h.deps)
  assert.equal(/[\r\n]/.test(String(h.sends[0].subject)), false)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/service.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `service.ts`**

```ts
import { buildSupportReplyEmail } from "@/lib/email/support-reply"
import { STUCK_SENDING_MS, buildReplySubject } from "./format"
import type { MessageRow } from "./types"

export const SUPPORT_REPLY_TO = "support@cofabri.com"
export const SUPPORT_FROM_NAME = "CoFabri Support"

export type CaseForSend = {
  id: string
  subject: string
  email: string | null
  type: string | null
  status: string
  ticket_submission_id: number | null
}

export class DuplicateRequestError extends Error {
  constructor() {
    super("duplicate client request")
    this.name = "DuplicateRequestError"
  }
}

export type NewMessage = {
  case_id: string
  kind: "team" | "note"
  body_text: string
  author_hr_person_id: string
  email_status: "sending" | null
  client_request_id: string
}

export type ConversationStore = {
  getCase(caseId: string): Promise<CaseForSend | null>
  findByRequestId(caseId: string, clientRequestId: string): Promise<MessageRow | null>
  getMessage(caseId: string, messageId: string): Promise<MessageRow | null>
  insertMessage(row: NewMessage): Promise<MessageRow>
  claimForSend(messageId: string, staleBeforeIso: string): Promise<MessageRow | null>
  markSent(messageId: string): Promise<void>
  markFailed(messageId: string, reason: string): Promise<void>
  setCaseInProgressIfOpen(caseId: string): Promise<void>
}

export type SendEmail = (p: {
  to: string
  subject: string
  html: string
  text: string
  fromName: string
  replyTo: string
  tags: string[]
}) => Promise<void>

export type ConversationDeps = { store: ConversationStore; send: SendEmail; now: () => Date }
export type Author = { hrPersonId: string; firstName: string }
export type CreateResult =
  | { ok: true; message: MessageRow }
  | { ok: false; reason: "not-found" | "no-customer-email" | "not-customer-ticket" }
export type RetryResult = CreateResult | { ok: false; reason: "not-retryable" }

function failureReason(err: unknown): string {
  // Name and gateway status text only: never the message body or addresses.
  const text = err instanceof Error ? `${err.name}: ${err.message}` : "Unknown error"
  return text.slice(0, 200)
}

async function deliver(
  message: MessageRow,
  caseRow: CaseForSend,
  author: Author,
  deps: ConversationDeps
): Promise<MessageRow> {
  const { store } = deps
  try {
    const subject = buildReplySubject(caseRow.subject, caseRow.ticket_submission_id as number)
    const mail = await buildSupportReplyEmail({
      replyText: message.body_text,
      senderFirstName: author.firstName,
      subject,
    })
    await deps.send({
      to: (caseRow.email as string).trim(),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: SUPPORT_FROM_NAME,
      replyTo: SUPPORT_REPLY_TO,
      tags: ["support-reply"],
    })
    await store.markSent(message.id)
    await store.setCaseInProgressIfOpen(caseRow.id)
  } catch (err) {
    console.error("[support-conversation] reply send failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown")
    await store.markFailed(message.id, failureReason(err))
  }
  return (await store.getMessage(caseRow.id, message.id)) ?? message
}

function replyBlockReason(c: CaseForSend): "no-customer-email" | "not-customer-ticket" | null {
  if (c.type !== "customer_ticket" || c.ticket_submission_id == null) return "not-customer-ticket"
  if (!c.email || !c.email.trim()) return "no-customer-email"
  return null
}

export async function createMessage(
  input: { caseId: string; author: Author; kind: "reply" | "note"; text: string; clientRequestId: string },
  deps: ConversationDeps
): Promise<CreateResult> {
  const { store } = deps
  const caseRow = await store.getCase(input.caseId)
  if (!caseRow) return { ok: false, reason: "not-found" }

  if (input.kind === "reply") {
    const blocked = replyBlockReason(caseRow)
    if (blocked) return { ok: false, reason: blocked }
  }

  const existing = await store.findByRequestId(input.caseId, input.clientRequestId)
  if (existing) return { ok: true, message: existing }

  let saved: MessageRow
  try {
    saved = await store.insertMessage({
      case_id: input.caseId,
      kind: input.kind === "reply" ? "team" : "note",
      body_text: input.text,
      author_hr_person_id: input.author.hrPersonId,
      email_status: input.kind === "reply" ? "sending" : null,
      client_request_id: input.clientRequestId,
    })
  } catch (err) {
    if (err instanceof DuplicateRequestError) {
      // A concurrent double click won the race: it owns the send.
      const winner = await store.findByRequestId(input.caseId, input.clientRequestId)
      if (winner) return { ok: true, message: winner }
    }
    throw err
  }

  if (input.kind === "note") return { ok: true, message: saved }
  return { ok: true, message: await deliver(saved, caseRow, input.author, deps) }
}

export async function retryMessage(
  input: { caseId: string; messageId: string; author: Author },
  deps: ConversationDeps
): Promise<RetryResult> {
  const { store } = deps
  const caseRow = await store.getCase(input.caseId)
  if (!caseRow) return { ok: false, reason: "not-found" }
  const blocked = replyBlockReason(caseRow)
  if (blocked) return { ok: false, reason: blocked }

  const staleBeforeIso = new Date(deps.now().getTime() - STUCK_SENDING_MS).toISOString()
  const claimed = await store.claimForSend(input.messageId, staleBeforeIso)
  if (!claimed || claimed.case_id !== input.caseId || claimed.kind !== "team") return { ok: false, reason: "not-retryable" }
  return { ok: true, message: await deliver(claimed, caseRow, input.author, deps) }
}
```

Note: `claimForSend` in the real store must also verify `case_id` and `kind = 'team'` in its WHERE clause so a foreign id cannot be claimed (the service also checks, defence in depth).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/service.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Implement the Supabase store and default deps**

Create `lib/support/conversation/store.ts`:

```ts
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmailViaGateway } from "@/lib/email/send-via-gateway"
import { DuplicateRequestError, type CaseForSend, type ConversationDeps, type ConversationStore, type NewMessage } from "./service"
import type { MessageRow } from "./types"

const MESSAGE_COLUMNS =
  "id, case_id, kind, body_text, author_hr_person_id, from_email, source_email_id, email_status, email_error, client_request_id, created_at"

export function createSupabaseConversationStore(): ConversationStore {
  const supabase = createAdminClient()
  return {
    async getCase(caseId) {
      const { data, error } = await supabase
        .from("support_cases")
        .select("id, subject, email, type, status, ticket_submission_id")
        .eq("id", caseId)
        .limit(1)
      if (error) throw new Error(error.message)
      return (data?.[0] as CaseForSend | undefined) ?? null
    },
    async findByRequestId(caseId, clientRequestId) {
      const { data, error } = await supabase
        .from("support_case_messages")
        .select(MESSAGE_COLUMNS)
        .eq("case_id", caseId)
        .eq("client_request_id", clientRequestId)
        .limit(1)
      if (error) throw new Error(error.message)
      return (data?.[0] as MessageRow | undefined) ?? null
    },
    async getMessage(caseId, messageId) {
      const { data, error } = await supabase
        .from("support_case_messages")
        .select(MESSAGE_COLUMNS)
        .eq("case_id", caseId)
        .eq("id", messageId)
        .limit(1)
      if (error) throw new Error(error.message)
      return (data?.[0] as MessageRow | undefined) ?? null
    },
    async insertMessage(row: NewMessage) {
      const { data, error } = await supabase.from("support_case_messages").insert(row).select(MESSAGE_COLUMNS).single()
      if (error) {
        if (error.code === "23505") throw new DuplicateRequestError()
        throw new Error(error.message)
      }
      return data as MessageRow
    },
    async claimForSend(messageId, staleBeforeIso) {
      // One guarded UPDATE decides the single winner: failed -> sending, or a stuck sending -> sending.
      const { data, error } = await supabase
        .from("support_case_messages")
        .update({ email_status: "sending", email_error: null })
        .eq("id", messageId)
        .eq("kind", "team")
        .or(`email_status.eq.failed,and(email_status.eq.sending,created_at.lt.${staleBeforeIso})`)
        .select(MESSAGE_COLUMNS)
        .limit(1)
      if (error) throw new Error(error.message)
      return (data?.[0] as MessageRow | undefined) ?? null
    },
    async markSent(messageId) {
      const { error } = await supabase.from("support_case_messages").update({ email_status: "sent", email_error: null }).eq("id", messageId)
      if (error) throw new Error(error.message)
    },
    async markFailed(messageId, reason) {
      const { error } = await supabase
        .from("support_case_messages")
        .update({ email_status: "failed", email_error: reason.slice(0, 200) })
        .eq("id", messageId)
      if (error) throw new Error(error.message)
    },
    async setCaseInProgressIfOpen(caseId) {
      const { error } = await supabase.from("support_cases").update({ status: "in_progress" }).eq("id", caseId).eq("status", "open")
      if (error) throw new Error(error.message)
    },
  }
}

export function createDefaultConversationDeps(): ConversationDeps {
  return {
    store: createSupabaseConversationStore(),
    now: () => new Date(),
    send: (p) =>
      sendEmailViaGateway({
        to: p.to,
        subject: p.subject,
        html: p.html,
        text: p.text,
        fromName: p.fromName,
        replyTo: p.replyTo,
        tags: p.tags,
      }),
  }
}
```

Check, before relying on the `.or(...)` string, that the staleBeforeIso timestamp contains characters PostgREST accepts in a filter value (ISO strings with `:` and `.` are fine; if the repo's PostgREST rejects the unquoted colon, wrap the value in double quotes). Add a small test with a fake builder that records the `.or` argument if the implementation changes its shape. A guard test for `claimForSend` against a real database is not possible in unit tests; the guarded-update shape is covered by the review.

- [ ] **Step 6: Typecheck, lint, commit**

Run: `pnpm exec eslint lib/support/conversation && pnpm exec next typegen && pnpm exec tsc --noEmit`
Expected: clean.

```bash
git add lib/support/conversation/service.ts lib/support/conversation/service.test.ts lib/support/conversation/store.ts
git commit -m "feat(support): send team replies and notes from a case conversation"
```

---

### Task 6: Inbound attach writes the customer message (self-healing)

**Files:**
- Modify: `lib/support/inbound/ingest.ts`, `lib/support/inbound/store.ts`
- Test: `lib/support/inbound/ingest.test.ts` (extend), `lib/support/inbound/store.test.ts` (extend)

**Interfaces:**
- Produces: `IngestStore` gains `ensureCustomerMessageForEmail(resendEmailId: string): Promise<void>` — idempotent: if the inbound row with that `resend_email_id` has `status = 'attached'` and a `case_id`, upsert one `support_case_messages` row (`kind = 'customer'`, `body_text` = the inbound row's `body_text` truncated to 20,000 non-empty, `from_email`, `source_email_id` = the inbound row id, `created_at` = the inbound `received_at`) with `ON CONFLICT (source_email_id) DO NOTHING`; otherwise do nothing.

Ruling (differs from the spec text, deliberately): the spec said a failed message insert should fail the ingest. That would lose the message, because Resend's retry hits the "already saved" short-circuit. Instead message creation is an idempotent *ensure* that runs (a) right after an attached row is saved and (b) on the duplicate short-circuit for an already-saved email, so any retry heals it.

- [ ] **Step 1: Write the failing tests**

In `lib/support/inbound/ingest.test.ts` extend the existing harness: add `ensured: string[]` recorded by a fake `ensureCustomerMessageForEmail` on the store, and add `ensureError?: Error` / `seenIds` options. Add these tests (adapting names to the file's existing `harness` and `event()` helpers; read the file first):

```ts
test("an attached reply ensures a customer message for its email id", async () => {
  const h = harness({
    email: email({ subject: "Re: We Received Your Support Request (CS-1042)" }),
    cases: { 1042: { id: "case-1", email: "pat@example.com", assignee_id: null, subject: "Login broken", app_id: null } },
  })
  const r = await ingestInboundEvent(event(), h.deps)
  assert.equal(r.outcome === "saved" && r.status, "attached")
  assert.deepEqual(h.ensured, ["e1"])
})

test("a pending email does not create a message", async () => {
  const h = harness()
  await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(h.ensured, [])
})

test("a redelivery of an already-saved email heals a missing message and then reports duplicate", async () => {
  const h = harness({ seenIds: ["e1"] })
  const r = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(r, { outcome: "ignored", reason: "duplicate" })
  assert.deepEqual(h.ensured, ["e1"])
})

test("if ensuring the message fails the ingest fails so Resend retries, and the retry ensures it again", async () => {
  const h = harness({
    email: email({ subject: "Re: (CS-1042)" }),
    cases: { 1042: { id: "case-1", email: "pat@example.com", assignee_id: null, subject: "S", app_id: null } },
    ensureError: new Error("db down"),
  })
  await assert.rejects(() => ingestInboundEvent(event(), h.deps), /db down/)
  // retry: the row now exists (hasEmail true) and the message is ensured again, this time successfully
  h.setSeen("e1")
  h.clearEnsureError()
  const retry = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(retry, { outcome: "ignored", reason: "duplicate" })
  assert.deepEqual(h.ensured, ["e1", "e1"])
})

test("a concurrent duplicate insert also ensures the message", async () => {
  const h = harness({ insertError: new DuplicateInboundError() })
  const r = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(r, { outcome: "ignored", reason: "duplicate" })
  assert.deepEqual(h.ensured, ["e1"])
})
```

Extend the harness with `ensured`, `ensureError`, `setSeen(id)`, `clearEnsureError()` and make the fake `ensureCustomerMessageForEmail` push the id and throw `ensureError` when set. In `lib/support/inbound/store.test.ts` (read it for its fake-Supabase style) add a test that `ensureCustomerMessageForEmail` does nothing for a pending row and, for an attached row with a case, upserts one row with `onConflict: 'source_email_id'` and `ignoreDuplicates: true` and the cut body (a 30,000-char body is stored as 20,000).

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/inbound/ingest.test.ts lib/support/inbound/store.test.ts`
Expected: FAIL (the new store method does not exist; `ensured` stays empty).

- [ ] **Step 3: Implement in `ingest.ts`**

Add to `IngestStore`: `ensureCustomerMessageForEmail(resendEmailId: string): Promise<void>`. Then:

1. Replace the early duplicate line with:

```ts
  if (await store.hasEmail(emailId)) {
    // A retry of a delivery that was saved earlier: make sure its thread message exists too.
    await store.ensureCustomerMessageForEmail(emailId)
    return { outcome: "ignored", reason: "duplicate" }
  }
```

2. In the `DuplicateInboundError` catch inside the insert try/catch:

```ts
    if (err instanceof DuplicateInboundError) {
      await store.ensureCustomerMessageForEmail(emailId)
      return { outcome: "ignored", reason: "duplicate" }
    }
```

3. Immediately after the insert succeeds (before the notification try/catch), and only for attached mail:

```ts
  if (status === "attached") await store.ensureCustomerMessageForEmail(emailId)
```

(An error here propagates: the route answers 500, Resend retries, and step 1 heals it.)

- [ ] **Step 4: Implement in `store.ts`**

Add to `createSupabaseIngestStore()`:

```ts
    async ensureCustomerMessageForEmail(resendEmailId) {
      const { data, error } = await supabase
        .from("support_inbound_emails")
        .select("id, status, case_id, body_text, from_email, received_at")
        .eq("resend_email_id", resendEmailId)
        .limit(1)
      if (error) throw new Error(error.message)
      const row = data?.[0]
      if (!row || row.status !== "attached" || !row.case_id || !row.body_text) return
      const { error: upsertError } = await supabase.from("support_case_messages").upsert(
        {
          case_id: row.case_id,
          kind: "customer",
          body_text: row.body_text.slice(0, 20000),
          from_email: row.from_email,
          source_email_id: row.id,
          created_at: row.received_at,
        },
        { onConflict: "source_email_id", ignoreDuplicates: true }
      )
      if (upsertError) throw new Error(upsertError.message)
    },
```

(If the stored body is empty the check above skips it, because the table requires a non-empty body.)

- [ ] **Step 5: Run to verify they pass, lint, typecheck, commit**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/inbound/*.test.ts && pnpm exec eslint lib/support && pnpm exec next typegen && pnpm exec tsc --noEmit`
Expected: PASS (all inbound tests, including the pre-existing ones, which may need the new store method added to their fake stores).

```bash
git add lib/support/inbound
git commit -m "feat(support): attached inbound replies become customer messages in the thread"
```

---

### Task 7: API routes

**Files:**
- Create: `app/api/support/cases/[id]/messages/route.ts`, `app/api/support/cases/[id]/messages/[messageId]/retry/route.ts`, `lib/support/conversation/handlers.ts`
- Delete: `app/api/support/cases/[id]/emails/route.ts`
- Test: `lib/support/conversation/handlers.test.ts`

**Interfaces:**
- Consumes: `createMessage`, `retryMessage`, `createDefaultConversationDeps`, `parseMessageRequest`, `assembleThread`, `replyAvailability`, `firstNameOf`; `isUuid` from `lib/support/inbound/handlers.ts` (read it for the exact exported name; if it is not exported, export it).
- Produces:
  - `GET /api/support/cases/[id]/messages` -> `{ thread: ThreadItem[], canReply: boolean, replyDisabledReason: string | null }`; 400 invalid id; 404 unknown case.
  - `POST /api/support/cases/[id]/messages` body `{ kind, body, clientRequestId }` -> `{ message: ThreadItem-like row fields }`: 200 with `{ ok: true, id, emailStatus }`; 400 invalid input; 403 `{ error: "No staff profile for this account" }`; 404; 409 `{ error: <fixed reason text> }`.
  - `POST .../messages/[messageId]/retry` -> same success shape; 409 when not retryable.
  - `handlers.ts` exports pure `mapCreateResult(result): { status: number; body: Record<string, unknown> }` and `mapRetryResult(result)`.

Author resolution in the route: `const supabase = await createClient()` from `@/lib/supabase/server`; `const { data: hrId } = await supabase.rpc("current_hr_person_id")`; if falsy return 403. Then read the staff member's name with the admin client: `admin.from("hr_people").select("first_name, last_name").eq("id", hrId).limit(1)`; `firstName = firstNameOf(first_name)`. Wrap the handlers with `withApiAuth("support")` exactly as the sibling inbox routes do (read `app/api/support/inbox/[id]/route.ts` first and mirror its params handling and error logging).

- [ ] **Step 1: Write the failing tests**

Create `lib/support/conversation/handlers.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { mapCreateResult, mapRetryResult } from "./handlers"
import type { MessageRow } from "./types"

const ROW: MessageRow = {
  id: "m1", case_id: "c1", kind: "team", body_text: "hi", author_hr_person_id: "h1", from_email: null,
  source_email_id: null, email_status: "sent", email_error: null, client_request_id: "req-00000001", created_at: "2026-10-12T12:00:00Z",
}

test("mapCreateResult maps outcomes to status codes with fixed messages", () => {
  assert.deepEqual(mapCreateResult({ ok: true, message: ROW }), { status: 200, body: { ok: true, id: "m1", kind: "team", emailStatus: "sent" } })
  assert.equal(mapCreateResult({ ok: false, reason: "not-found" }).status, 404)
  const noEmail = mapCreateResult({ ok: false, reason: "no-customer-email" })
  assert.equal(noEmail.status, 409)
  assert.match(String(noEmail.body.error), /email/i)
  assert.equal(mapCreateResult({ ok: false, reason: "not-customer-ticket" }).status, 409)
})

test("a failed send is still a 200 so the screen can show the failed message", () => {
  const r = mapCreateResult({ ok: true, message: { ...ROW, email_status: "failed", email_error: "Error: 401" } })
  assert.equal(r.status, 200)
  assert.equal(r.body.emailStatus, "failed")
  assert.ok(!("emailError" in r.body)) // the detail stays server-side; the thread endpoint carries it
})

test("mapRetryResult adds the not-retryable case", () => {
  assert.equal(mapRetryResult({ ok: false, reason: "not-retryable" }).status, 409)
  assert.equal(mapRetryResult({ ok: true, message: ROW }).status, 200)
})
```

- [ ] **Step 2: Run to verify it fails, then implement `handlers.ts`**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/handlers.test.ts` — Expected: FAIL. Then create `lib/support/conversation/handlers.ts`:

```ts
import type { CreateResult, RetryResult } from "./service"

type Mapped = { status: number; body: Record<string, unknown> }

const MESSAGES: Record<string, string> = {
  "no-customer-email": "This case has no customer email, so a reply can't be sent.",
  "not-customer-ticket": "Replies are only available on customer tickets.",
  "not-retryable": "This reply can't be retried right now.",
}

export function mapCreateResult(result: CreateResult | RetryResult): Mapped {
  if (result.ok) {
    return { status: 200, body: { ok: true, id: result.message.id, kind: result.message.kind, emailStatus: result.message.email_status } }
  }
  if (result.reason === "not-found") return { status: 404, body: { error: "Case not found" } }
  return { status: 409, body: { error: MESSAGES[result.reason] ?? "Not allowed" } }
}

export const mapRetryResult = mapCreateResult
```

Run the test again — Expected: PASS.

- [ ] **Step 3: Implement the routes**

`app/api/support/cases/[id]/messages/route.ts` (read `app/api/support/inbox/[id]/route.ts` and `app/api/support/cases/[id]/emails/route.ts` for the exact `withApiAuth`/`params` pattern and error-logging helper, and follow them):

```ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withApiAuth } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/support/inbound/handlers"
import { parseMessageRequest, firstNameOf } from "@/lib/support/conversation/format"
import { assembleThread, replyAvailability } from "@/lib/support/conversation/thread"
import { createMessage } from "@/lib/support/conversation/service"
import { createDefaultConversationDeps } from "@/lib/support/conversation/store"
import { mapCreateResult } from "@/lib/support/conversation/handlers"
import type { MessageRow } from "@/lib/support/conversation/types"

const MESSAGE_COLUMNS =
  "id, case_id, kind, body_text, author_hr_person_id, from_email, source_email_id, email_status, email_error, client_request_id, created_at"

export const GET = withApiAuth("support")(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid case id" }, { status: 400 })
  try {
    const admin = createAdminClient()
    const { data: caseRows, error: caseError } = await admin
      .from("support_cases")
      .select("description, created_at, first_name, last_name, email, type")
      .eq("id", id)
      .limit(1)
    if (caseError) throw new Error(caseError.message)
    const caseRow = caseRows?.[0]
    if (!caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 })

    const { data: messages, error: messagesError } = await admin
      .from("support_case_messages")
      .select(MESSAGE_COLUMNS)
      .eq("case_id", id)
      .order("created_at", { ascending: true })
      .limit(500)
    if (messagesError) throw new Error(messagesError.message)

    const authorIds = [...new Set((messages ?? []).map((m) => m.author_hr_person_id).filter((v): v is string => Boolean(v)))]
    const authors = new Map<string, string>()
    if (authorIds.length > 0) {
      const { data: people, error: peopleError } = await admin.from("hr_people").select("id, first_name, last_name").in("id", authorIds)
      if (peopleError) throw new Error(peopleError.message)
      for (const p of people ?? []) authors.set(p.id, [p.first_name, p.last_name].filter(Boolean).join(" "))
    }

    const availability = replyAvailability(caseRow)
    return NextResponse.json({
      thread: assembleThread({ caseRow, messages: (messages ?? []) as MessageRow[], authors, now: new Date() }),
      canReply: availability.canReply,
      replyDisabledReason: availability.reason,
    })
  } catch (error) {
    console.error("[support-conversation] load failed:", error instanceof Error ? `${error.name}: ${error.message}` : "unknown")
    return NextResponse.json({ error: "Could not load the conversation" }, { status: 500 })
  }
})

export const POST = withApiAuth("support")(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid case id" }, { status: 400 })
  const parsed = parseMessageRequest(await request.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data: hrId } = await supabase.rpc("current_hr_person_id")
    if (!hrId) return NextResponse.json({ error: "No staff profile for this account" }, { status: 403 })
    const admin = createAdminClient()
    const { data: people, error: personError } = await admin.from("hr_people").select("first_name").eq("id", hrId).limit(1)
    if (personError) throw new Error(personError.message)

    const result = await createMessage(
      { caseId: id, author: { hrPersonId: hrId as string, firstName: firstNameOf(people?.[0]?.first_name) }, kind: parsed.kind, text: parsed.text, clientRequestId: parsed.clientRequestId },
      createDefaultConversationDeps()
    )
    const mapped = mapCreateResult(result)
    return NextResponse.json(mapped.body, { status: mapped.status })
  } catch (error) {
    console.error("[support-conversation] create failed:", error instanceof Error ? `${error.name}: ${error.message}` : "unknown")
    return NextResponse.json({ error: "Could not save the message" }, { status: 500 })
  }
})
```

The retry route follows the same shape: validate both ids as UUIDs, resolve the author the same way (extract the shared author lookup into a small helper in the same file or `lib/support/conversation/author.ts` so both routes use it), call `retryMessage`, map with `mapRetryResult`.

Delete `app/api/support/cases/[id]/emails/route.ts` (the Conversation replaces it).

- [ ] **Step 4: Gates and commit**

Run: `pnpm exec eslint app/api/support lib/support && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm run check:api-auth`
Expected: clean; `check:api-auth` passes for the new routes (they use `withApiAuth("support")`).

```bash
git add app/api/support lib/support/conversation/handlers.ts lib/support/conversation/handlers.test.ts
git commit -m "feat(support): API for the case conversation"
```

---

### Task 8: Conversation screen

**Files:**
- Create: `components/support/support-conversation.tsx`, `lib/support/conversation/composer.ts`, `lib/support/conversation/composer.test.ts`
- Modify: `components/support/support-page-client.tsx`
- Delete: `components/support/support-case-emails.tsx` and its test file if one exists

**Interfaces:**
- Consumes: the Task 7 routes (shapes above), `ThreadItem` from `lib/support/conversation/types.ts`.
- Produces: `<SupportConversation caseId={string} />`; `composer.ts` exports pure `makeClientRequestId(): string` (matches `/^[A-Za-z0-9_-]{8,64}$/`), `statusLabel(status: EmailStatus | null): string | null` ("Sending" | "Sent" | "Failed"), `canSubmit(input: { text: string; busy: boolean; kind: "reply" | "note"; canReply: boolean }): boolean`.

Read `components/support/support-inbox.tsx` and the old `support-case-emails.tsx` first: reuse the Inbox's patterns for stale-response guards, `useToast`, request sequencing, plain-text rendering and Title Case.

- [ ] **Step 1: Write the failing tests for `composer.ts`**

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { canSubmit, makeClientRequestId, statusLabel } from "./composer"

test("makeClientRequestId matches the server's accepted shape and is unique", () => {
  const a = makeClientRequestId()
  const b = makeClientRequestId()
  assert.match(a, /^[A-Za-z0-9_-]{8,64}$/)
  assert.notEqual(a, b)
})

test("statusLabel is Title Case", () => {
  assert.equal(statusLabel("sending"), "Sending")
  assert.equal(statusLabel("sent"), "Sent")
  assert.equal(statusLabel("failed"), "Failed")
  assert.equal(statusLabel(null), null)
})

test("canSubmit needs text, no request in flight, and reply permission for replies", () => {
  assert.equal(canSubmit({ text: "hi", busy: false, kind: "reply", canReply: true }), true)
  assert.equal(canSubmit({ text: "   ", busy: false, kind: "reply", canReply: true }), false)
  assert.equal(canSubmit({ text: "hi", busy: true, kind: "reply", canReply: true }), false)
  assert.equal(canSubmit({ text: "hi", busy: false, kind: "reply", canReply: false }), false)
  assert.equal(canSubmit({ text: "hi", busy: false, kind: "note", canReply: false }), true)
})
```

- [ ] **Step 2: Run to verify it fails, then implement `composer.ts`**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/composer.test.ts` — Expected: FAIL. Create `lib/support/conversation/composer.ts`:

```ts
import type { EmailStatus } from "./types"

export function makeClientRequestId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  return `req_${random}`.slice(0, 64)
}

export function statusLabel(status: EmailStatus | null): string | null {
  if (status === "sending") return "Sending"
  if (status === "sent") return "Sent"
  if (status === "failed") return "Failed"
  return null
}

export function canSubmit(input: { text: string; busy: boolean; kind: "reply" | "note"; canReply: boolean }): boolean {
  if (input.busy || !input.text.trim()) return false
  if (input.kind === "reply" && !input.canReply) return false
  return true
}
```

Run the test again — Expected: PASS.

- [ ] **Step 3: Implement `support-conversation.tsx`**

Behaviour (all required; write the component to satisfy them, reusing the Inbox component's guards):

- Props `{ caseId: string }`. State: `thread`, `canReply`, `replyDisabledReason`, `loading`, `loadError`, `kind` (`"reply" | "note"`, default `"reply"`), `text`, `busy`, `pendingRequestId` (a `clientRequestId` created when the user starts a submit and kept until the request finishes so a retry of the SAME unsent text reuses it; a new one is created after success or when the text changes).
- `load()` fetches `GET /api/support/cases/${caseId}/messages` with `cache: "no-store"`, sequenced with a counter so an older response never overwrites a newer one; ignore results after unmount or after `caseId` changed (the page also remounts it with `key={caseId}`); on failure set `loadError` and render "Could not load the conversation." (sentence case) with a "Try Again" button; never render an empty state after a failure.
- Heading: `Conversation` (Title Case). Messages in order, each a block: customer messages left with the name (or "Customer") and time; team replies right with "CoFabri Support" plus the teammate's name, time, and a status chip from `statusLabel`; a `failed` reply shows the sentence-case reason "The email didn't send." and a "Retry" button; internal notes in a tinted box labelled `Internal Note` with author and time. Times formatted with `date-fns` `format(new Date(at), "MMM d, yyyy h:mm a")`.
- Message text is rendered ONLY as plain text in an element with `whitespace-pre-wrap break-words` (no `dangerouslySetInnerHTML`, no markdown).
- Composer: two tab buttons `Reply` and `Internal Note` (`role="tablist"`/`role="tab"`, `aria-selected`); the Reply tab is disabled when `!canReply` and, when selected-disabled, the composer falls back to the Note tab and shows `replyDisabledReason` in sentence case. A `<textarea>` (rows 4, `maxLength` 10000 for replies and 20000 for notes), under it a reminder line for the Reply tab: "Please don't include health information in replies." A submit button labelled `Send Reply` or `Add Note`, disabled by `canSubmit`.
- Submit: `POST /api/support/cases/${caseId}/messages` with `{ kind, body: text, clientRequestId }`; while in flight `busy` is true. On any response (including a 200 with `emailStatus: "failed"`) clear the text only on `ok` responses, always reload the thread from the server, and toast: success "Reply Sent" / "Note Added"; a failed send "Reply Saved But Not Sent" with description "Use Retry on the message."; errors show the server's fixed `error` string as the description under "Action Failed". A fetch rejection shows "Action Failed" and keeps the text so the user can try again with the same request id.
- Retry: `POST .../messages/${id}/retry`; disable the Retry button while in flight; reload afterwards.
- Auto-scroll the thread container to the bottom after a reload that added items (use a ref; do not scroll the page).
- If a poll/refresh is desirable keep it simple: reload only after user actions and when the component mounts.

Wire it into `components/support/support-page-client.tsx`: replace the import and the `{editing && <SupportCaseEmails key={editing.id} caseId={editing.id} />}` line with `{editing && <SupportConversation key={editing.id} caseId={editing.id} />}`. Delete `components/support/support-case-emails.tsx` (and its test).

- [ ] **Step 4: Gates**

Run: `pnpm exec tsx --experimental-test-module-mocks --test lib/support/conversation/composer.test.ts && pnpm exec eslint components/support lib/support && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm run check:api-auth`
Expected: PASS, clean. (The component is verified in a browser by the controller after review; list in the report exactly what to click through.)

- [ ] **Step 5: Commit**

```bash
git add components/support lib/support/conversation/composer.ts lib/support/conversation/composer.test.ts
git commit -m "feat(support): Conversation section with a Reply and Internal Note composer"
```

---

### Task 9: Rollout (controller, with Noah)

**Files:** none. Stop and ask Noah before steps 1, 3 and 5.

- [ ] **Step 1: Make the gateway key work (blocking)**

Core's production logs show `cofabri-api rejected email: 401 Invalid API key`. Diagnose read-only first: (a) in Vercel Core Production check that `COFABRI_API_KEY` and `COFABRI_API_BASE_URL` exist (names only); (b) in cofabri-api's database inspect the active key row for app `cofabri-core` (columns that do not contain the secret: status/expiry/scopes/last used; never select or print the key itself); (c) compare with cofabri-api's own rejected-key log lines. Then fix the smallest thing: usually issue a new key through the existing admin mechanism, set it as `COFABRI_API_KEY` in Core Production (Sensitive, via stdin pipe, never printed), redeploy. Prove it with one real send (a "Support Reply" to Noah's own address through the app once deployed, or an ad-hoc compose in Core).

- [ ] **Step 2: Gates**

Run `pnpm run verify` in the worktree; expected exit 0. Fix only failures caused by this branch.

- [ ] **Step 3: Apply the migration live and push**

(The migration may already be applied from Task 1 Step 4.) With Noah's go: `git log origin/main..feat/support-conversations` must show only this feature's commits plus the already-reviewed unpushed sidebar commit `340af64c`; then `git push origin feat/support-conversations:main`; watch CI and the Core deploy to READY.

- [ ] **Step 4: Production browser pass (Chrome)**

Using a test case created from the public form with Noah's own address:
1. Open the case: Conversation shows the original request as the first message; Reply tab enabled.
2. Send a reply: the chip goes Sending -> Sent, the case moves to In Progress, the email arrives at the test address from "CoFabri Support" with subject `Re: <subject> (CS-n)` and Reply-To `support@cofabri.com`.
3. Reply from that address: within a minute the answer appears in the thread as a customer message (it also goes to the group inboxes).
4. Add an internal note: it appears tinted and no email is sent.
5. Force a failure if feasible and test Retry; check double-click safety by clicking Send twice quickly.
6. Open a case without an email (or an internal issue): Reply tab disabled with a reason, Note still works.
7. Phone width: no horizontal overflow.

- [ ] **Step 5: Clean up test data and record**

Delete the test case, its messages (cascade), any auto-created staff task and notification, and inbound rows from the test (SQL with exact ids; list the rows first). Remove worktrees and branches once everything is pushed, and update project memory.
