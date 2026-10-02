# Email-to-Ticket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mail to support@cofabri.com arrives in a Support Inbox in Core where staff create a case, dismiss it, or block the sender; customer replies to an existing case attach to it automatically.

**Architecture:** Resend receives mail on a subdomain and POSTs a signed `email.received` webhook to a new Core route. Core verifies the signature, fetches the message from Resend, filters junk, and saves it in `support_inbound_emails`. A reply whose subject has `CS-<n>` and whose sender matches that case's email is saved as `attached`; everything else is `pending`. Staff act on pending mail from a new Inbox view on the Support page. All code is in cofabri-core (all paths below are relative to that repo).

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (admin client), `svix` (new dependency, webhook verification), node:test via `tsx` (`npm run test:unit`), Resend receiving API (plain `fetch`).

**Spec:** `docs/superpowers/specs/2026-10-02-email-to-ticket-design.md` in the cofabri-website repo.

## Global Constraints

- Nothing becomes a case automatically; only a person (Create Case) or a matching reply (attached note) acts on mail.
- Labels, buttons, headings and notification titles are **Title Case**; body text is sentence case.
- Email HTML is never stored or rendered; only plain text is stored, capped at 20,000 characters.
- Dismissed and blocked mail is purged 30 days after `handled_at`.
- Notification roles for new pending mail: `["admin", "engineering"]` (same as `support_case_new`).
- Expected conditions (bad signature, dropped bounce, duplicate) log as `console.warn`, never `console.error`; only real failures (Resend fetch failed after a valid signature, DB error) use `console.error`.
- Use `createAdminClient()` from `@/lib/supabase/admin` for all inbound table access. The new tables have RLS enabled and no policies.
- Test runner: `npm run test:unit` (node:test + tsx). Run the repo's full CI gates (`npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`) before pushing; read `.github/workflows/ci.yml` first to confirm the list.
- Do not push `main` wholesale: the local main of cofabri-core may hold other sessions' unpushed work. Work in a worktree off `origin/main` and push with `git push origin <branch>:main` only after `git log origin/main..<branch>` shows only this feature's commits.
- Never print secret values. Env names only.

## Review Focus

- A forged `CS-<n>` subject from a stranger must land in `pending`, never `attached` (Task 4 test).
- A repeated delivery of the same Resend email id must not create a second row or a second notification (Task 4 test).
- An email with only an HTML body (`text` null) must still produce readable plain text, and a `<script>` tag must never survive (Task 2 test).
- A spam flood from one sender must produce at most one notification per sender per hour (Task 4 test).
- Create Case on an email that was already converted or dismissed must not create a second case (Task 6 test).

---

## File Structure

New files:
- `supabase/migrations/20261011100000_support_inbound_emails.sql` — tables, notification type.
- `lib/support/inbound/parse.ts` — pure helpers: ticket number, auto-generated detection, HTML to text, address normalisation.
- `lib/support/inbound/resend.ts` — webhook verification and received-email fetch.
- `lib/support/inbound/ingest.ts` — the ingest service (dependency-injected).
- `lib/support/inbound/store.ts` — Supabase-backed implementation of the ingest store.
- `lib/support/inbound/actions.ts` — Create Case, Dismiss, Block Sender.
- `app/api/webhooks/resend-inbound/route.ts` — webhook route.
- `app/api/support/inbox/route.ts` — list pending and count.
- `app/api/support/inbox/[id]/route.ts` — action endpoint.
- `app/api/support/cases/[id]/emails/route.ts` — attached emails for a case.
- `app/api/cron/purge-support-inbox/route.ts` — daily purge.
- `components/support/support-inbox.tsx` — Inbox view.
- `components/support/support-case-emails.tsx` — case drawer section.
- Tests next to each lib file (`*.test.ts`).

Modified files:
- `lib/push/send.ts`, `lib/notifications/preferences.ts` — new notification type.
- `lib/support/intake.ts` — optional `entryPoint` and `skipNotify`.
- `components/support/support-page-client.tsx` — view switch and drawer section.
- `types/database.ts` — regenerated.
- `vercel.json` — cron entry.
- `package.json` / lockfile — `svix`.

---

### Task 1: Worktree, dependency, migration, notification type

**Files:**
- Create: `supabase/migrations/20261011100000_support_inbound_emails.sql`
- Modify: `lib/push/send.ts` (the `NotificationType` union), `lib/notifications/preferences.ts` (`ALL_NOTIFICATION_TYPES`, `NOTIFICATION_LABELS`), `package.json`, `types/database.ts`

**Interfaces:**
- Produces: tables `support_inbound_emails`, `support_blocked_senders`; notification type `"support_inbound_email"`; `Database["public"]["Tables"]["support_inbound_emails"]` row/insert types.

- [ ] **Step 1: Create the worktree and install**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git fetch -q origin
git worktree add -b feat/email-to-ticket ../cofabri-core-email-ticket origin/main
cd ../cofabri-core-email-ticket
cp ../cofabri-core/.env.local .env.local 2>/dev/null || true
npm ci
npm install svix
```

Expected: install completes; `git status` shows `package.json` and the lockfile changed.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/20261011100000_support_inbound_emails.sql`:

```sql
-- Email-to-ticket: mail sent to support@cofabri.com lands here (via a Resend
-- inbound webhook) and waits for a person. Nothing becomes a case on its own.

create table if not exists public.support_inbound_emails (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null unique,
  message_id text,
  in_reply_to text,
  from_email text not null,
  from_name text,
  subject text not null default '',
  body_text text not null default '',
  received_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'attached', 'converted', 'dismissed', 'blocked')),
  case_id uuid references public.support_cases(id) on delete set null,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_inbound_emails_status_received_idx
  on public.support_inbound_emails (status, received_at desc);
create index if not exists support_inbound_emails_case_idx
  on public.support_inbound_emails (case_id) where case_id is not null;
create index if not exists support_inbound_emails_sender_idx
  on public.support_inbound_emails (from_email, created_at desc);
create index if not exists support_inbound_emails_message_id_idx
  on public.support_inbound_emails (message_id) where message_id is not null;

create table if not exists public.support_blocked_senders (
  email text primary key,
  blocked_by uuid,
  created_at timestamptz not null default now()
);

alter table public.support_inbound_emails enable row level security;
alter table public.support_blocked_senders enable row level security;
revoke all on table public.support_inbound_emails, public.support_blocked_senders from anon, authenticated;
-- No policies: only Core's server code (service role) reads or writes these tables.

comment on table public.support_inbound_emails is
  'Mail received at the support address. pending = waiting for a person; attached = reply added to its case; converted = turned into a case; dismissed/blocked = purged 30 days after handled_at.';

-- Widen notifications_type_check to add support_inbound_email. Rebuilt from the
-- live definition so types added by other branches are not dropped.
do $$
declare
  def text;
begin
  select pg_get_constraintdef(c.oid) into def
  from pg_constraint c
  where c.conrelid = 'public.notifications'::regclass and c.conname = 'notifications_type_check';

  if def is null then
    raise exception 'notifications_type_check not found';
  end if;

  if def like '%support_inbound_email%' then
    return;
  end if;

  -- def looks like: CHECK ((type = ANY (ARRAY['a'::text, 'b'::text, ...])))
  def := regexp_replace(def, '\]\)\)\)\s*$', ', ''support_inbound_email''::text])))');

  if def not like '%support_inbound_email%' then
    raise exception 'could not extend notifications_type_check: %', def;
  end if;

  alter table public.notifications drop constraint notifications_type_check;
  execute 'alter table public.notifications add constraint notifications_type_check ' || def;
end
$$;
```

- [ ] **Step 3: Register the notification type**

In `lib/push/send.ts`, add `| "support_inbound_email"` after `| "support_case_assigned"` in the `NotificationType` union.

In `lib/notifications/preferences.ts`, add `"support_inbound_email",` after `"support_case_assigned",` in `ALL_NOTIFICATION_TYPES`, and add this line after the `support_case_assigned:` label in `NOTIFICATION_LABELS`:

```ts
  support_inbound_email: "New support email",
```

- [ ] **Step 4: Run the existing preference and type tests**

Run: `npx tsx --experimental-test-module-mocks --test lib/notifications/preferences.test.ts lib/push/send.test.ts`
Expected: PASS. If a test enumerates the live `notifications_type_check` list and fails, add `support_inbound_email` to the expectation it checks.

- [ ] **Step 5: Apply the migration live and regenerate types**

This step changes the live database. Confirm with Noah first, and he must be outside auto mode (Supabase MCP writes). Project ref `iwpgwnapxuhpsdndvsrv`.

1. Apply the file's SQL with the Supabase MCP `apply_migration` (name `support_inbound_emails`).
2. Verify: `select count(*) from support_inbound_emails;` returns 0 and `select pg_get_constraintdef(oid) from pg_constraint where conname = 'notifications_type_check';` contains `support_inbound_email`.
3. Regenerate types with the MCP `generate_typescript_types` and write the result to `types/database.ts`. Then `git diff --stat types/database.ts` must show only additions for the two new tables (any other diff means another branch's tables were merged; keep only the additions).

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add supabase/migrations/20261011100000_support_inbound_emails.sql lib/push/send.ts lib/notifications/preferences.ts types/database.ts package.json package-lock.json
git commit -m "feat(support): inbound email tables and notification type"
```

Expected: typecheck passes.

---

### Task 2: Pure helpers

**Files:**
- Create: `lib/support/inbound/parse.ts`
- Test: `lib/support/inbound/parse.test.ts`

**Interfaces:**
- Produces:
  - `extractTicketNumber(subject: string): number | null`
  - `normalizeAddress(value: string): string` (lower-case bare address from `Name <a@b.com>` or `a@b.com`)
  - `displayName(value: string): string | null`
  - `isAutoGenerated(headers: Record<string, string> | undefined): boolean`
  - `htmlToText(html: string): string`
  - `toPlainBody(input: { text?: string | null; html?: string | null }): string` (prefers text, falls back to HTML, caps at 20,000 chars)
  - `MAX_BODY_CHARS = 20000`

- [ ] **Step 1: Write the failing tests**

Create `lib/support/inbound/parse.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import {
  MAX_BODY_CHARS,
  displayName,
  extractTicketNumber,
  htmlToText,
  isAutoGenerated,
  normalizeAddress,
  toPlainBody,
} from "./parse"

test("extractTicketNumber finds CS-<n> anywhere in the subject, case-insensitively", () => {
  assert.equal(extractTicketNumber("Re: We Received Your Support Request (CS-1042)"), 1042)
  assert.equal(extractTicketNumber("fwd: cs-7 help"), 7)
  assert.equal(extractTicketNumber("CS1042 broken"), 1042)
})

test("extractTicketNumber ignores text with no ticket number or a silly one", () => {
  assert.equal(extractTicketNumber("Hello there"), null)
  assert.equal(extractTicketNumber("ABCS-12"), null)
  assert.equal(extractTicketNumber("CS-0"), null)
  assert.equal(extractTicketNumber("CS-99999999999"), null)
})

test("normalizeAddress and displayName handle both header shapes", () => {
  assert.equal(normalizeAddress("Pat Lee <Pat.Lee@Example.com>"), "pat.lee@example.com")
  assert.equal(normalizeAddress("  A@B.COM "), "a@b.com")
  assert.equal(displayName("Pat Lee <pat@example.com>"), "Pat Lee")
  assert.equal(displayName('"Lee, Pat" <pat@example.com>'), "Lee, Pat")
  assert.equal(displayName("pat@example.com"), null)
})

test("isAutoGenerated flags bounces, out-of-office and bulk mail", () => {
  assert.equal(isAutoGenerated({ "auto-submitted": "auto-replied" }), true)
  assert.equal(isAutoGenerated({ "Auto-Submitted": "auto-generated" }), true)
  assert.equal(isAutoGenerated({ precedence: "bulk" }), true)
  assert.equal(isAutoGenerated({ precedence: "junk" }), true)
  assert.equal(isAutoGenerated({ precedence: "list" }), true)
  assert.equal(isAutoGenerated({ "return-path": "<>" }), true)
  assert.equal(isAutoGenerated({ "x-autoreply": "yes" }), true)
})

test("isAutoGenerated lets ordinary mail through", () => {
  assert.equal(isAutoGenerated({ "auto-submitted": "no" }), false)
  assert.equal(isAutoGenerated({ "return-path": "pat@example.com" }), false)
  assert.equal(isAutoGenerated({}), false)
  assert.equal(isAutoGenerated(undefined), false)
})

test("htmlToText drops scripts and styles, keeps line breaks and decodes entities", () => {
  const out = htmlToText(
    "<style>p{color:red}</style><p>Hello&nbsp;<b>there</b> &amp; welcome</p><script>alert(1)</script><p>Second</p><br>Third"
  )
  assert.ok(!out.includes("<"))
  assert.ok(!out.includes("alert"))
  assert.ok(!out.includes("color:red"))
  assert.match(out, /Hello there & welcome/)
  assert.match(out, /Second/)
  assert.match(out, /Third/)
})

test("toPlainBody prefers text, falls back to html, and caps length", () => {
  assert.equal(toPlainBody({ text: "plain", html: "<p>html</p>" }), "plain")
  assert.equal(toPlainBody({ text: null, html: "<p>html</p>" }), "html")
  assert.equal(toPlainBody({ text: "  ", html: "<p>html</p>" }), "html")
  assert.equal(toPlainBody({ text: null, html: null }), "")
  assert.equal(toPlainBody({ text: "x".repeat(MAX_BODY_CHARS + 500) }).length, MAX_BODY_CHARS)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/parse.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `lib/support/inbound/parse.ts`:

```ts
// Pure helpers for inbound support email. No I/O.

export const MAX_BODY_CHARS = 20000
const INT4_MAX = 2147483647

/** "Re: ... (CS-1042)" -> 1042. Matches "CS-1042", "cs1042"; ignores words that merely end in "cs". */
export function extractTicketNumber(subject: string): number | null {
  const m = /(?:^|[^a-z0-9])cs-?(\d{1,10})(?![0-9])/i.exec(subject)
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 && n <= INT4_MAX ? n : null
}

export function normalizeAddress(value: string): string {
  const angle = /<([^<>]+)>/.exec(value)
  return (angle ? angle[1] : value).trim().toLowerCase()
}

export function displayName(value: string): string | null {
  const angle = value.indexOf("<")
  if (angle <= 0) return null
  const name = value.slice(0, angle).trim().replace(/^"(.*)"$/, "$1").trim()
  return name || null
}

/** True for bounces, out-of-office replies and bulk mail: never a person writing in. */
export function isAutoGenerated(headers: Record<string, string> | undefined): boolean {
  if (!headers) return false
  const h: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) h[key.toLowerCase()] = String(value).trim().toLowerCase()

  if (h["auto-submitted"] && h["auto-submitted"] !== "no") return true
  if (h["precedence"] && ["bulk", "junk", "list", "auto_reply"].includes(h["precedence"])) return true
  if (h["return-path"] === "<>") return true
  if (h["x-autoreply"] || h["x-autorespond"]) return true
  return false
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" }

/** Reduces HTML to readable plain text. Never returns markup. */
export function htmlToText(html: string): string {
  const withoutBlocks = html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
  const withBreaks = withoutBlocks
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
  const stripped = withBreaks.replace(/<[^>]*>/g, "")
  const decoded = stripped.replace(/&(?:nbsp|amp|lt|gt|quot|#39|apos);/g, (e) => ENTITIES[e] ?? e)
  return decoded
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function toPlainBody(input: { text?: string | null; html?: string | null }): string {
  const text = typeof input.text === "string" ? input.text.trim() : ""
  const body = text || (typeof input.html === "string" ? htmlToText(input.html) : "")
  return body.slice(0, MAX_BODY_CHARS)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/parse.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/support/inbound/parse.ts lib/support/inbound/parse.test.ts
git commit -m "feat(support): pure helpers for inbound email"
```

---

### Task 3: Resend client (verify and fetch)

**Files:**
- Create: `lib/support/inbound/resend.ts`
- Test: `lib/support/inbound/resend.test.ts`

**Interfaces:**
- Consumes: `svix` `Webhook`.
- Produces:
  - `type InboundEvent = { type: string; data: { email_id: string; from: string; to: string[]; subject?: string; message_id?: string } }`
  - `verifyInboundWebhook(rawBody: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, secret: string): InboundEvent` (throws on any failure)
  - `type ReceivedEmail = { id: string; from: string; to: string[]; subject: string; text: string | null; html: string | null; headers: Record<string, string>; messageId: string | null; inReplyTo: string | null }`
  - `fetchReceivedEmail(emailId: string, apiKey: string, fetchImpl?: typeof fetch): Promise<ReceivedEmail>` (throws on non-2xx)

- [ ] **Step 1: Write the failing tests**

Create `lib/support/inbound/resend.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { Webhook } from "svix"
import { fetchReceivedEmail, verifyInboundWebhook } from "./resend"

const SECRET = "whsec_" + Buffer.from("test-secret-test-secret-1234").toString("base64")

function signed(body: string, ts = Math.floor(Date.now() / 1000)) {
  const id = "msg_1"
  const signature = new Webhook(SECRET).sign(id, new Date(ts * 1000), body)
  return { id, timestamp: String(ts), signature }
}

const BODY = JSON.stringify({
  type: "email.received",
  data: { email_id: "e1", from: "a@b.com", to: ["support@tickets.cofabri.com"], subject: "Hi", message_id: "<m@x>" },
})

test("verifyInboundWebhook accepts a correctly signed body", () => {
  const event = verifyInboundWebhook(BODY, signed(BODY), SECRET)
  assert.equal(event.type, "email.received")
  assert.equal(event.data.email_id, "e1")
})

test("verifyInboundWebhook rejects a wrong secret, a tampered body and a stale timestamp", () => {
  const other = "whsec_" + Buffer.from("another-secret-another-secret").toString("base64")
  assert.throws(() => verifyInboundWebhook(BODY, signed(BODY), other))
  assert.throws(() => verifyInboundWebhook(BODY + " ", signed(BODY), SECRET))
  const stale = Math.floor(Date.now() / 1000) - 60 * 60
  assert.throws(() => verifyInboundWebhook(BODY, signed(BODY, stale), SECRET))
})

test("verifyInboundWebhook rejects missing headers", () => {
  assert.throws(() => verifyInboundWebhook(BODY, { id: null, timestamp: null, signature: null }, SECRET))
})

test("fetchReceivedEmail maps the Resend response", async () => {
  let calledUrl = ""
  let auth = ""
  const fakeFetch = (async (url: string, init: { headers: Record<string, string> }) => {
    calledUrl = url
    auth = init.headers.Authorization
    return new Response(
      JSON.stringify({
        id: "e1",
        from: "Pat <pat@example.com>",
        to: ["support@tickets.cofabri.com"],
        subject: "Help",
        text: "body",
        html: null,
        headers: { "In-Reply-To": "<prev@x>", "auto-submitted": "no" },
        message_id: "<m@x>",
      }),
      { status: 200 }
    )
  }) as unknown as typeof fetch
  const email = await fetchReceivedEmail("e1", "re_key", fakeFetch)
  assert.equal(calledUrl, "https://api.resend.com/emails/receiving/e1")
  assert.equal(auth, "Bearer re_key")
  assert.equal(email.subject, "Help")
  assert.equal(email.messageId, "<m@x>")
  assert.equal(email.inReplyTo, "<prev@x>")
  assert.equal(email.from, "Pat <pat@example.com>")
})

test("fetchReceivedEmail throws on a non-2xx response", async () => {
  const fakeFetch = (async () => new Response("nope", { status: 404 })) as unknown as typeof fetch
  await assert.rejects(() => fetchReceivedEmail("e1", "re_key", fakeFetch), /404/)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/resend.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `lib/support/inbound/resend.ts`:

```ts
import { Webhook } from "svix"

export type InboundEvent = {
  type: string
  data: { email_id: string; from: string; to: string[]; subject?: string; message_id?: string }
}

export type ReceivedEmail = {
  id: string
  from: string
  to: string[]
  subject: string
  text: string | null
  html: string | null
  headers: Record<string, string>
  messageId: string | null
  inReplyTo: string | null
}

type SvixHeaders = { id: string | null; timestamp: string | null; signature: string | null }

/** Throws unless the body was signed by Resend (Svix) with this secret and the timestamp is fresh. */
export function verifyInboundWebhook(rawBody: string, headers: SvixHeaders, secret: string): InboundEvent {
  if (!headers.id || !headers.timestamp || !headers.signature) throw new Error("missing signature headers")
  const verified = new Webhook(secret).verify(rawBody, {
    "svix-id": headers.id,
    "svix-timestamp": headers.timestamp,
    "svix-signature": headers.signature,
  }) as InboundEvent
  if (!verified || typeof verified.type !== "string" || !verified.data || typeof verified.data.email_id !== "string") {
    throw new Error("unexpected webhook payload")
  }
  return verified
}

export async function fetchReceivedEmail(
  emailId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<ReceivedEmail> {
  const response = await fetchImpl(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new Error(`Resend receiving fetch failed: ${response.status}`)
  const json = (await response.json()) as Record<string, unknown>

  const rawHeaders = (json.headers && typeof json.headers === "object" ? json.headers : {}) as Record<string, unknown>
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawHeaders)) headers[key] = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "")
  const lower = (name: string) => {
    const hit = Object.keys(headers).find((k) => k.toLowerCase() === name)
    return hit ? headers[hit] || null : null
  }

  return {
    id: String(json.id ?? emailId),
    from: typeof json.from === "string" ? json.from : "",
    to: Array.isArray(json.to) ? json.to.map(String) : [],
    subject: typeof json.subject === "string" ? json.subject : "",
    text: typeof json.text === "string" ? json.text : null,
    html: typeof json.html === "string" ? json.html : null,
    headers,
    messageId: typeof json.message_id === "string" ? json.message_id : lower("message-id"),
    inReplyTo: lower("in-reply-to"),
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/resend.test.ts`
Expected: PASS. If svix rejects the test timestamp format, the signing helper in the test is the thing to adjust, not the production code.

- [ ] **Step 5: Commit**

```bash
git add lib/support/inbound/resend.ts lib/support/inbound/resend.test.ts
git commit -m "feat(support): verify Resend inbound webhooks and fetch received mail"
```

---

### Task 4: Ingest service

**Files:**
- Create: `lib/support/inbound/ingest.ts`, `lib/support/inbound/store.ts`
- Test: `lib/support/inbound/ingest.test.ts`

**Interfaces:**
- Consumes: `fetchReceivedEmail`, `ReceivedEmail`, `InboundEvent` (Task 3); `extractTicketNumber`, `normalizeAddress`, `displayName`, `isAutoGenerated`, `toPlainBody` (Task 2); `notifyRoles` and `sendNotification` (existing).
- Produces:
  - `type IngestStore = { hasEmail(resendEmailId: string): Promise<boolean>; hasMessageId(messageId: string): Promise<boolean>; isBlocked(email: string): Promise<boolean>; findCaseByTicket(n: number): Promise<{ id: string; email: string | null; assignee_id: string | null; subject: string; app_id: string | null } | null>; recentFromSender(email: string, sinceIso: string): Promise<number>; insert(row: NewInboundRow): Promise<{ id: string }> }`
  - `type NewInboundRow = { resend_email_id; message_id; in_reply_to; from_email; from_name; subject; body_text; status: "pending" | "attached"; case_id: string | null }`
  - `type IngestDeps = { store: IngestStore; fetchEmail: (id: string) => Promise<ReceivedEmail>; notifyPending: (row: { id: string; from: string; subject: string }) => Promise<void>; notifyAttached: (input: { caseId: string; assigneeId: string | null; subject: string; appId: string | null; from: string }) => Promise<void>; ownAddresses: string[]; now: () => Date }`
  - `type IngestResult = { outcome: "saved"; status: "pending" | "attached"; id: string } | { outcome: "ignored"; reason: "duplicate" | "auto-generated" | "blocked" | "own-address" | "wrong-event" }`
  - `ingestInboundEvent(event: InboundEvent, deps: IngestDeps): Promise<IngestResult>`
  - `createSupabaseIngestStore(): IngestStore`, `createDefaultIngestDeps(): IngestDeps` (in `store.ts`)

Behaviour (from the spec): ignore events that are not `email.received`; ignore a known `resend_email_id`; fetch the email; ignore if `from` is one of `ownAddresses` (loop protection); ignore if auto-generated; ignore if the same `Message-ID` was saved before; ignore blocked senders; match `CS-<n>` + sender equals the case's email -> `attached`, else `pending`. Notify pending mail only if the same sender has no other row created in the last hour. Attached mail always notifies.

- [ ] **Step 1: Write the failing tests**

Create `lib/support/inbound/ingest.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { ingestInboundEvent, type IngestDeps, type IngestStore, type NewInboundRow } from "./ingest"
import type { InboundEvent, ReceivedEmail } from "./resend"

function event(emailId = "e1"): InboundEvent {
  return { type: "email.received", data: { email_id: emailId, from: "pat@example.com", to: ["support@tickets.cofabri.com"] } }
}

function email(overrides: Partial<ReceivedEmail> = {}): ReceivedEmail {
  return {
    id: "e1",
    from: "Pat Lee <Pat@Example.com>",
    to: ["support@tickets.cofabri.com"],
    subject: "Need help",
    text: "My login is broken",
    html: null,
    headers: {},
    messageId: "<m1@x>",
    inReplyTo: null,
    ...overrides,
  }
}

function harness(opts: {
  email?: ReceivedEmail
  seenIds?: string[]
  seenMessageIds?: string[]
  blocked?: string[]
  cases?: Record<number, { id: string; email: string | null; assignee_id: string | null; subject: string; app_id: string | null }>
  recent?: number
} = {}) {
  const rows: NewInboundRow[] = []
  const pending: unknown[] = []
  const attached: unknown[] = []
  const store: IngestStore = {
    hasEmail: async (id) => (opts.seenIds ?? []).includes(id),
    hasMessageId: async (id) => (opts.seenMessageIds ?? []).includes(id),
    isBlocked: async (e) => (opts.blocked ?? []).includes(e),
    findCaseByTicket: async (n) => opts.cases?.[n] ?? null,
    recentFromSender: async () => opts.recent ?? 0,
    insert: async (row) => {
      rows.push(row)
      return { id: `row-${rows.length}` }
    },
  }
  const deps: IngestDeps = {
    store,
    fetchEmail: async () => opts.email ?? email(),
    notifyPending: async (r) => {
      pending.push(r)
    },
    notifyAttached: async (r) => {
      attached.push(r)
    },
    ownAddresses: ["support@cofabri.com", "noreply@cofabri.com"],
    now: () => new Date("2026-10-11T12:00:00Z"),
  }
  return { deps, rows, pending, attached }
}

test("an ordinary email is saved as pending and notifies once", async () => {
  const h = harness()
  const result = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(result, { outcome: "saved", status: "pending", id: "row-1" })
  assert.equal(h.rows[0].from_email, "pat@example.com")
  assert.equal(h.rows[0].from_name, "Pat Lee")
  assert.equal(h.rows[0].status, "pending")
  assert.equal(h.pending.length, 1)
  assert.equal(h.attached.length, 0)
})

test("a repeated delivery of the same email id is ignored", async () => {
  const h = harness({ seenIds: ["e1"] })
  const result = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(result, { outcome: "ignored", reason: "duplicate" })
  assert.equal(h.rows.length, 0)
  assert.equal(h.pending.length, 0)
})

test("the same Message-ID under a new email id is ignored", async () => {
  const h = harness({ seenMessageIds: ["<m1@x>"] })
  const result = await ingestInboundEvent(event("e2"), h.deps)
  assert.deepEqual(result, { outcome: "ignored", reason: "duplicate" })
})

test("auto-replies, blocked senders and our own addresses are ignored", async () => {
  const auto = harness({ email: email({ headers: { "Auto-Submitted": "auto-replied" } }) })
  assert.deepEqual(await ingestInboundEvent(event(), auto.deps), { outcome: "ignored", reason: "auto-generated" })

  const blocked = harness({ blocked: ["pat@example.com"] })
  assert.deepEqual(await ingestInboundEvent(event(), blocked.deps), { outcome: "ignored", reason: "blocked" })

  const own = harness({ email: email({ from: "CoFabri Support <support@cofabri.com>" }) })
  assert.deepEqual(await ingestInboundEvent(event(), own.deps), { outcome: "ignored", reason: "own-address" })
  assert.equal(auto.rows.length + blocked.rows.length + own.rows.length, 0)
})

test("events that are not email.received are ignored without fetching", async () => {
  const h = harness()
  let fetched = false
  h.deps.fetchEmail = async () => {
    fetched = true
    return email()
  }
  const result = await ingestInboundEvent({ type: "email.sent", data: event().data }, h.deps)
  assert.deepEqual(result, { outcome: "ignored", reason: "wrong-event" })
  assert.equal(fetched, false)
})

test("a reply with the case number from the case's own email is attached", async () => {
  const h = harness({
    email: email({ subject: "Re: We Received Your Support Request (CS-1042)" }),
    cases: { 1042: { id: "case-1", email: "pat@example.com", assignee_id: "hr-9", subject: "Login broken", app_id: "gathr" } },
  })
  const result = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(result, { outcome: "saved", status: "attached", id: "row-1" })
  assert.equal(h.rows[0].case_id, "case-1")
  assert.equal(h.attached.length, 1)
  assert.equal(h.pending.length, 0)
})

test("a forged case number from a different sender stays pending", async () => {
  const h = harness({
    email: email({ from: "stranger@evil.com", subject: "Re: (CS-1042)" }),
    cases: { 1042: { id: "case-1", email: "pat@example.com", assignee_id: null, subject: "Login broken", app_id: null } },
  })
  const result = await ingestInboundEvent(event(), h.deps)
  assert.deepEqual(result, { outcome: "saved", status: "pending", id: "row-1" })
  assert.equal(h.rows[0].case_id, null)
  assert.equal(h.attached.length, 0)
})

test("an unknown case number stays pending", async () => {
  const h = harness({ email: email({ subject: "Re: (CS-5)" }) })
  const result = await ingestInboundEvent(event(), h.deps)
  assert.equal(result.outcome === "saved" && result.status, "pending")
})

test("a second pending email from the same sender within the hour saves but does not notify", async () => {
  const h = harness({ recent: 3 })
  const result = await ingestInboundEvent(event(), h.deps)
  assert.equal(result.outcome, "saved")
  assert.equal(h.pending.length, 0)
})

test("the stored body falls back to HTML text and never keeps markup", async () => {
  const h = harness({ email: email({ text: null, html: "<p>Hi <b>team</b></p><script>x()</script>" }) })
  await ingestInboundEvent(event(), h.deps)
  assert.equal(h.rows[0].body_text, "Hi team")
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/ingest.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the service**

Create `lib/support/inbound/ingest.ts`:

```ts
import { displayName, extractTicketNumber, isAutoGenerated, normalizeAddress, toPlainBody } from "./parse"
import type { InboundEvent, ReceivedEmail } from "./resend"

export type NewInboundRow = {
  resend_email_id: string
  message_id: string | null
  in_reply_to: string | null
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  status: "pending" | "attached"
  case_id: string | null
}

export type CaseMatch = { id: string; email: string | null; assignee_id: string | null; subject: string; app_id: string | null }

export type IngestStore = {
  hasEmail(resendEmailId: string): Promise<boolean>
  hasMessageId(messageId: string): Promise<boolean>
  isBlocked(email: string): Promise<boolean>
  findCaseByTicket(ticketNumber: number): Promise<CaseMatch | null>
  /** How many rows from this sender were created since the given ISO time. */
  recentFromSender(email: string, sinceIso: string): Promise<number>
  insert(row: NewInboundRow): Promise<{ id: string }>
}

export type IngestDeps = {
  store: IngestStore
  fetchEmail: (id: string) => Promise<ReceivedEmail>
  notifyPending: (row: { id: string; from: string; subject: string }) => Promise<void>
  notifyAttached: (input: { caseId: string; assigneeId: string | null; subject: string; appId: string | null; from: string }) => Promise<void>
  /** Addresses we send from; mail from them is a loop, never a customer. */
  ownAddresses: string[]
  now: () => Date
}

export type IngestResult =
  | { outcome: "saved"; status: "pending" | "attached"; id: string }
  | { outcome: "ignored"; reason: "duplicate" | "auto-generated" | "blocked" | "own-address" | "wrong-event" }

const NOTIFY_WINDOW_MS = 60 * 60 * 1000

export async function ingestInboundEvent(event: InboundEvent, deps: IngestDeps): Promise<IngestResult> {
  if (event.type !== "email.received") return { outcome: "ignored", reason: "wrong-event" }

  const { store } = deps
  const emailId = event.data.email_id
  if (await store.hasEmail(emailId)) return { outcome: "ignored", reason: "duplicate" }

  const email = await deps.fetchEmail(emailId)
  const fromEmail = normalizeAddress(email.from || event.data.from)

  if (deps.ownAddresses.map((a) => a.toLowerCase()).includes(fromEmail)) return { outcome: "ignored", reason: "own-address" }
  if (isAutoGenerated(email.headers)) return { outcome: "ignored", reason: "auto-generated" }
  if (email.messageId && (await store.hasMessageId(email.messageId))) return { outcome: "ignored", reason: "duplicate" }
  if (await store.isBlocked(fromEmail)) return { outcome: "ignored", reason: "blocked" }

  const subject = (email.subject || "").trim()
  const ticket = extractTicketNumber(subject)
  const match = ticket ? await store.findCaseByTicket(ticket) : null
  const isReplyFromSubmitter = Boolean(match && match.email && normalizeAddress(match.email) === fromEmail)

  const sinceIso = new Date(deps.now().getTime() - NOTIFY_WINDOW_MS).toISOString()
  const recent = isReplyFromSubmitter ? 0 : await store.recentFromSender(fromEmail, sinceIso)

  const status: "pending" | "attached" = isReplyFromSubmitter ? "attached" : "pending"
  const saved = await store.insert({
    resend_email_id: emailId,
    message_id: email.messageId,
    in_reply_to: email.inReplyTo,
    from_email: fromEmail,
    from_name: displayName(email.from),
    subject,
    body_text: toPlainBody({ text: email.text, html: email.html }),
    status,
    case_id: isReplyFromSubmitter && match ? match.id : null,
  })

  if (status === "attached" && match) {
    await deps.notifyAttached({
      caseId: match.id,
      assigneeId: match.assignee_id,
      subject: match.subject,
      appId: match.app_id,
      from: fromEmail,
    })
  } else if (recent === 0) {
    await deps.notifyPending({ id: saved.id, from: fromEmail, subject })
  }

  return { outcome: "saved", status, id: saved.id }
}
```

- [ ] **Step 4: Implement the Supabase store and default deps**

Create `lib/support/inbound/store.ts`:

```ts
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyRoles } from "@/lib/push/notify-roles"
import { sendNotification } from "@/lib/push/send"
import { fetchReceivedEmail } from "./resend"
import type { IngestDeps, IngestStore } from "./ingest"

export function createSupabaseIngestStore(): IngestStore {
  const supabase = createAdminClient()
  return {
    async hasEmail(resendEmailId) {
      const { data, error } = await supabase.from("support_inbound_emails").select("id").eq("resend_email_id", resendEmailId).maybeSingle()
      if (error) throw new Error(error.message)
      return Boolean(data)
    },
    async hasMessageId(messageId) {
      const { data, error } = await supabase.from("support_inbound_emails").select("id").eq("message_id", messageId).limit(1)
      if (error) throw new Error(error.message)
      return (data ?? []).length > 0
    },
    async isBlocked(email) {
      const { data, error } = await supabase.from("support_blocked_senders").select("email").eq("email", email).maybeSingle()
      if (error) throw new Error(error.message)
      return Boolean(data)
    },
    async findCaseByTicket(ticketNumber) {
      const { data, error } = await supabase
        .from("support_cases")
        .select("id, email, assignee_id, subject, app_id")
        .eq("ticket_submission_id", ticketNumber)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data ?? null
    },
    async recentFromSender(email, sinceIso) {
      const { count, error } = await supabase
        .from("support_inbound_emails")
        .select("id", { count: "exact", head: true })
        .eq("from_email", email)
        .gte("created_at", sinceIso)
      if (error) throw new Error(error.message)
      return count ?? 0
    },
    async insert(row) {
      const { data, error } = await supabase.from("support_inbound_emails").insert(row).select("id").single()
      if (error) throw new Error(error.message)
      return { id: data.id }
    },
  }
}

export function createDefaultIngestDeps(): IngestDeps {
  const apiKey = process.env.RESEND_INBOUND_API_KEY
  if (!apiKey) throw new Error("RESEND_INBOUND_API_KEY is not set")
  return {
    store: createSupabaseIngestStore(),
    fetchEmail: (id) => fetchReceivedEmail(id, apiKey),
    ownAddresses: ["support@cofabri.com", "noreply@cofabri.com", "no-reply@cofabri.com"],
    now: () => new Date(),
    notifyPending: async ({ id, from, subject }) => {
      await notifyRoles({
        roles: ["admin", "engineering"],
        type: "support_inbound_email",
        title: "New Support Email",
        body: `${from}: ${subject || "(no subject)"}`,
        url: "/dashboard/support?view=inbox",
        relatedEntityType: "support_inbound_email",
        relatedEntityId: id,
        dedupKey: `support_inbound_email:${id}`,
      }).catch((err) => console.error("Failed to notify new support email:", err))
    },
    notifyAttached: async ({ caseId, assigneeId, subject, appId, from }) => {
      const body = `${from} replied on: ${subject}`
      const common = {
        type: "support_inbound_email" as const,
        title: "Customer Replied by Email",
        body,
        url: "/dashboard/support",
        relatedEntityType: "support_case",
        relatedEntityId: caseId,
        appId,
      }
      if (assigneeId) {
        await sendNotification({ recipientHrPersonId: assigneeId, ...common }).catch((err) =>
          console.error("Failed to notify assignee of email reply:", err)
        )
      } else {
        await notifyRoles({ roles: ["admin", "engineering"], ...common }).catch((err) =>
          console.error("Failed to notify roles of email reply:", err)
        )
      }
    },
  }
}
```

- [ ] **Step 5: Run to verify pass, typecheck, commit**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/ingest.test.ts && npm run typecheck`
Expected: PASS, no type errors.

```bash
git add lib/support/inbound/ingest.ts lib/support/inbound/store.ts lib/support/inbound/ingest.test.ts
git commit -m "feat(support): ingest inbound email into the support inbox"
```

---

### Task 5: Webhook route

**Files:**
- Create: `app/api/webhooks/resend-inbound/route.ts`
- Test: `app/api/webhooks/resend-inbound/route.test.ts`

**Interfaces:**
- Consumes: `verifyInboundWebhook`, `ingestInboundEvent`, `createDefaultIngestDeps`.
- Produces: `handleResendInbound(request: Request, deps: { secret: string | undefined; verify: typeof verifyInboundWebhook; ingest: (event: InboundEvent) => Promise<IngestResult> }): Promise<Response>` and `POST`.

Status codes: no secret configured -> 503; bad or missing signature -> 401 (warn); good signature and handled or ignored -> 200; ingest throws -> 500 (error) so Resend retries.

- [ ] **Step 1: Write the failing tests**

Create `app/api/webhooks/resend-inbound/route.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { handleResendInbound } from "./route"
import type { InboundEvent } from "@/lib/support/inbound/resend"

const EVENT: InboundEvent = { type: "email.received", data: { email_id: "e1", from: "a@b.com", to: [] } }

function request(body = "{}", headers: Record<string, string> = { "svix-id": "i", "svix-timestamp": "1", "svix-signature": "s" }) {
  return new Request("https://core.test/api/webhooks/resend-inbound", { method: "POST", body, headers })
}

test("503 when the secret is not configured", async () => {
  const res = await handleResendInbound(request(), { secret: undefined, verify: () => EVENT, ingest: async () => ({ outcome: "ignored", reason: "duplicate" }) })
  assert.equal(res.status, 503)
})

test("401 on a bad signature, and nothing is ingested", async () => {
  let ingested = false
  const res = await handleResendInbound(request(), {
    secret: "whsec_x",
    verify: () => {
      throw new Error("bad")
    },
    ingest: async () => {
      ingested = true
      return { outcome: "ignored", reason: "duplicate" }
    },
  })
  assert.equal(res.status, 401)
  assert.equal(ingested, false)
})

test("200 when ingested or ignored", async () => {
  const saved = await handleResendInbound(request(), { secret: "whsec_x", verify: () => EVENT, ingest: async () => ({ outcome: "saved", status: "pending", id: "r1" }) })
  assert.equal(saved.status, 200)
  const ignored = await handleResendInbound(request(), { secret: "whsec_x", verify: () => EVENT, ingest: async () => ({ outcome: "ignored", reason: "blocked" }) })
  assert.equal(ignored.status, 200)
})

test("500 when ingest throws, so Resend retries", async () => {
  const res = await handleResendInbound(request(), {
    secret: "whsec_x",
    verify: () => EVENT,
    ingest: async () => {
      throw new Error("db down")
    },
  })
  assert.equal(res.status, 500)
})

test("the verifier receives the raw body and the svix headers", async () => {
  let seen: { body: string; id: string | null } | null = null
  await handleResendInbound(request('{"raw":true}'), {
    secret: "whsec_x",
    verify: (body, headers) => {
      seen = { body, id: headers.id }
      return EVENT
    },
    ingest: async () => ({ outcome: "ignored", reason: "duplicate" }),
  })
  assert.deepEqual(seen, { body: '{"raw":true}', id: "i" })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test app/api/webhooks/resend-inbound/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `app/api/webhooks/resend-inbound/route.ts`:

```ts
import { NextResponse } from "next/server"
import { ingestInboundEvent, type IngestResult } from "@/lib/support/inbound/ingest"
import { createDefaultIngestDeps } from "@/lib/support/inbound/store"
import { verifyInboundWebhook, type InboundEvent } from "@/lib/support/inbound/resend"

export const maxDuration = 30

type Deps = {
  secret: string | undefined
  verify: typeof verifyInboundWebhook
  ingest: (event: InboundEvent) => Promise<IngestResult>
}

export async function handleResendInbound(request: Request, deps: Deps): Promise<Response> {
  if (!deps.secret) {
    console.warn("[support-inbound] RESEND_INBOUND_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  // The signature covers the exact bytes, so read the body as text before anything parses it.
  const rawBody = await request.text()
  let event: InboundEvent
  try {
    event = deps.verify(
      rawBody,
      {
        id: request.headers.get("svix-id"),
        timestamp: request.headers.get("svix-timestamp"),
        signature: request.headers.get("svix-signature"),
      },
      deps.secret
    )
  } catch {
    console.warn("[support-inbound] rejected a webhook with a bad signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const result = await deps.ingest(event)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error("[support-inbound] ingest failed:", error)
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleResendInbound(request, {
    secret: process.env.RESEND_INBOUND_WEBHOOK_SECRET,
    verify: verifyInboundWebhook,
    ingest: (event) => ingestInboundEvent(event, createDefaultIngestDeps()),
  })
}
```

- [ ] **Step 4: Check that unauthenticated webhooks are allowed by the middleware**

Run: `grep -rn "api/webhooks\|api/cron\|publicPaths\|PUBLIC" middleware.ts proxy.ts lib/supabase/middleware.ts 2>/dev/null | head`
Expected: find how existing webhook routes (for example `app/api/webhooks/*`) are exempted from the session redirect. If webhooks are matched by a prefix list, add `/api/webhooks/resend-inbound` the same way, with a one-line test or comment. If `/api/webhooks/` is already exempt, nothing to change.

- [ ] **Step 5: Run to verify pass, typecheck, commit**

Run: `npx tsx --experimental-test-module-mocks --test app/api/webhooks/resend-inbound/route.test.ts && npm run typecheck`
Expected: PASS.

```bash
git add app/api/webhooks/resend-inbound
git commit -m "feat(support): signed Resend inbound webhook route"
```

---

### Task 6: Inbox actions and case-creation options

**Files:**
- Create: `lib/support/inbound/actions.ts`
- Modify: `lib/support/intake.ts` (add `entryPoint` and `skipNotify`)
- Test: `lib/support/inbound/actions.test.ts`

**Interfaces:**
- Consumes: `normalizeAddress` (Task 2); `submitSupportCase` (modified here).
- Produces:
  - `SupportCaseIntakeInput` gains `entryPoint?: string`, and `submitSupportCase(input, options?: { skipNotify?: boolean })`.
  - `type ActionStore = { getEmail(id): Promise<InboundRow | null>; update(id, patch): Promise<void>; upsertBlocked(email, blockedBy): Promise<void>; dismissPendingFrom(email, handledBy, handledAtIso): Promise<void> }`
  - `type InboundRow = { id: string; status: string; from_email: string; from_name: string | null; subject: string; body_text: string; case_id: string | null }`
  - `createCaseFromEmail(id, actorId, deps)`, `dismissEmail(id, actorId, deps)`, `blockSender(id, actorId, deps)`; each returns `{ ok: true; caseId?: string } | { ok: false; reason: "not-found" | "not-pending" }`.
  - `type ActionDeps = { store: ActionStore; createCase: (input: { subject: string; message: string; firstName?: string; lastName?: string; email: string }) => Promise<{ id: string }>; now: () => Date }`
  - `createDefaultActionDeps(): ActionDeps`

Rules: only `pending` rows can be acted on (a second click or an already-converted email returns `not-pending` and creates nothing); Create Case sets `status = converted`, `case_id`, `handled_by`, `handled_at`; Block Sender also dismisses the other pending mail from the same address.

- [ ] **Step 1: Extend `lib/support/intake.ts`**

Add to `SupportCaseIntakeInput`:

```ts
  entryPoint?: string
```

Change the signature and insert, and guard the final notification:

```ts
export async function submitSupportCase(input: SupportCaseIntakeInput, options: { skipNotify?: boolean } = {}) {
```

In the `.insert({ ... })` object add `entry_point: input.entryPoint ?? null,` after `app_id`. Wrap the existing `await notifyRoles({ ... }).catch(...)` block as:

```ts
  if (!options.skipNotify) {
    await notifyRoles({
      // ...unchanged arguments...
    }).catch((err) => console.error("Failed to notify new support case:", err))
  }
```

Run: `npx tsx --experimental-test-module-mocks --test lib/support/*.test.ts app/api/public/support-cases/*.test.ts 2>/dev/null; npm run typecheck`
Expected: existing intake tests still pass (the new parameter is optional).

- [ ] **Step 2: Write the failing tests**

Create `lib/support/inbound/actions.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { blockSender, createCaseFromEmail, dismissEmail, type ActionDeps, type InboundRow } from "./actions"

function harness(row: InboundRow | null) {
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = []
  const blocked: string[] = []
  const dismissedFrom: string[] = []
  const created: Array<Record<string, unknown>> = []
  const deps: ActionDeps = {
    store: {
      getEmail: async () => row,
      update: async (id, patch) => {
        updates.push({ id, patch })
      },
      upsertBlocked: async (email) => {
        blocked.push(email)
      },
      dismissPendingFrom: async (email) => {
        dismissedFrom.push(email)
      },
    },
    createCase: async (input) => {
      created.push(input)
      return { id: "case-9" }
    },
    now: () => new Date("2026-10-11T12:00:00Z"),
  }
  return { deps, updates, blocked, dismissedFrom, created }
}

const PENDING: InboundRow = {
  id: "r1",
  status: "pending",
  from_email: "pat@example.com",
  from_name: "Pat Lee",
  subject: "Login broken",
  body_text: "I cannot sign in",
  case_id: null,
}

test("createCaseFromEmail creates one case, links it and marks the email converted", async () => {
  const h = harness(PENDING)
  const result = await createCaseFromEmail("r1", "hr-1", h.deps)
  assert.deepEqual(result, { ok: true, caseId: "case-9" })
  assert.equal(h.created.length, 1)
  assert.equal(h.created[0].email, "pat@example.com")
  assert.equal(h.created[0].firstName, "Pat")
  assert.equal(h.created[0].lastName, "Lee")
  assert.equal(h.created[0].subject, "Login broken")
  assert.equal(h.created[0].message, "I cannot sign in")
  assert.equal(h.updates[0].patch.status, "converted")
  assert.equal(h.updates[0].patch.case_id, "case-9")
  assert.equal(h.updates[0].patch.handled_by, "hr-1")
})

test("createCaseFromEmail on an already handled email creates nothing", async () => {
  for (const status of ["converted", "dismissed", "blocked", "attached"]) {
    const h = harness({ ...PENDING, status })
    assert.deepEqual(await createCaseFromEmail("r1", "hr-1", h.deps), { ok: false, reason: "not-pending" })
    assert.equal(h.created.length, 0)
  }
})

test("createCaseFromEmail falls back to the address when there is no display name and no subject", async () => {
  const h = harness({ ...PENDING, from_name: null, subject: "" })
  await createCaseFromEmail("r1", "hr-1", h.deps)
  assert.equal(h.created[0].firstName, "pat@example.com")
  assert.equal(h.created[0].subject, "Email from pat@example.com")
})

test("a missing email returns not-found", async () => {
  const h = harness(null)
  assert.deepEqual(await createCaseFromEmail("nope", "hr-1", h.deps), { ok: false, reason: "not-found" })
  assert.deepEqual(await dismissEmail("nope", "hr-1", h.deps), { ok: false, reason: "not-found" })
  assert.deepEqual(await blockSender("nope", "hr-1", h.deps), { ok: false, reason: "not-found" })
})

test("dismissEmail marks the email dismissed", async () => {
  const h = harness(PENDING)
  assert.deepEqual(await dismissEmail("r1", "hr-1", h.deps), { ok: true })
  assert.equal(h.updates[0].patch.status, "dismissed")
  assert.equal(h.updates[0].patch.handled_by, "hr-1")
})

test("blockSender blocks the address, marks this email blocked and dismisses the sender's other pending mail", async () => {
  const h = harness(PENDING)
  assert.deepEqual(await blockSender("r1", "hr-1", h.deps), { ok: true })
  assert.deepEqual(h.blocked, ["pat@example.com"])
  assert.equal(h.updates[0].patch.status, "blocked")
  assert.deepEqual(h.dismissedFrom, ["pat@example.com"])
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/actions.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

Create `lib/support/inbound/actions.ts`:

```ts
import { createAdminClient } from "@/lib/supabase/admin"
import { submitSupportCase } from "@/lib/support/intake"

export type InboundRow = {
  id: string
  status: string
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  case_id: string | null
}

export type ActionStore = {
  getEmail(id: string): Promise<InboundRow | null>
  update(id: string, patch: Record<string, unknown>): Promise<void>
  upsertBlocked(email: string, blockedBy: string): Promise<void>
  dismissPendingFrom(email: string, handledBy: string, handledAtIso: string): Promise<void>
}

export type ActionDeps = {
  store: ActionStore
  createCase: (input: { subject: string; message: string; firstName?: string; lastName?: string; email: string }) => Promise<{ id: string }>
  now: () => Date
}

export type ActionResult = { ok: true; caseId?: string } | { ok: false; reason: "not-found" | "not-pending" }

async function loadPending(id: string, deps: ActionDeps): Promise<{ row: InboundRow } | { fail: ActionResult }> {
  const row = await deps.store.getEmail(id)
  if (!row) return { fail: { ok: false, reason: "not-found" } }
  if (row.status !== "pending") return { fail: { ok: false, reason: "not-pending" } }
  return { row }
}

function splitName(fullName: string | null, fallback: string): { firstName: string; lastName?: string } {
  const name = (fullName ?? "").trim()
  if (!name) return { firstName: fallback }
  const [first, ...rest] = name.split(/\s+/)
  return { firstName: first, lastName: rest.length ? rest.join(" ") : undefined }
}

export async function createCaseFromEmail(id: string, actorId: string, deps: ActionDeps): Promise<ActionResult> {
  const loaded = await loadPending(id, deps)
  if ("fail" in loaded) return loaded.fail
  const { row } = loaded

  const created = await deps.createCase({
    subject: row.subject.trim() || `Email from ${row.from_email}`,
    message: row.body_text,
    email: row.from_email,
    ...splitName(row.from_name, row.from_email),
  })
  await deps.store.update(id, {
    status: "converted",
    case_id: created.id,
    handled_by: actorId,
    handled_at: deps.now().toISOString(),
  })
  return { ok: true, caseId: created.id }
}

export async function dismissEmail(id: string, actorId: string, deps: ActionDeps): Promise<ActionResult> {
  const loaded = await loadPending(id, deps)
  if ("fail" in loaded) return loaded.fail
  await deps.store.update(id, { status: "dismissed", handled_by: actorId, handled_at: deps.now().toISOString() })
  return { ok: true }
}

export async function blockSender(id: string, actorId: string, deps: ActionDeps): Promise<ActionResult> {
  const loaded = await loadPending(id, deps)
  if ("fail" in loaded) return loaded.fail
  const { row } = loaded
  const handledAt = deps.now().toISOString()
  await deps.store.upsertBlocked(row.from_email, actorId)
  await deps.store.update(id, { status: "blocked", handled_by: actorId, handled_at: handledAt })
  await deps.store.dismissPendingFrom(row.from_email, actorId, handledAt)
  return { ok: true }
}

export function createDefaultActionDeps(): ActionDeps {
  const supabase = createAdminClient()
  return {
    now: () => new Date(),
    createCase: async (input) => {
      // The staff member just chose to create this case, so skip the "new case" broadcast.
      const created = await submitSupportCase({ ...input, entryPoint: "email" }, { skipNotify: true })
      return { id: created.id }
    },
    store: {
      async getEmail(id) {
        const { data, error } = await supabase
          .from("support_inbound_emails")
          .select("id, status, from_email, from_name, subject, body_text, case_id")
          .eq("id", id)
          .maybeSingle()
        if (error) throw new Error(error.message)
        return data ?? null
      },
      async update(id, patch) {
        const { error } = await supabase.from("support_inbound_emails").update(patch).eq("id", id)
        if (error) throw new Error(error.message)
      },
      async upsertBlocked(email, blockedBy) {
        const { error } = await supabase.from("support_blocked_senders").upsert({ email, blocked_by: blockedBy }, { onConflict: "email" })
        if (error) throw new Error(error.message)
      },
      async dismissPendingFrom(email, handledBy, handledAtIso) {
        const { error } = await supabase
          .from("support_inbound_emails")
          .update({ status: "dismissed", handled_by: handledBy, handled_at: handledAtIso })
          .eq("from_email", email)
          .eq("status", "pending")
        if (error) throw new Error(error.message)
      },
    },
  }
}
```

- [ ] **Step 5: Run to verify pass, typecheck, commit**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/actions.test.ts && npm run typecheck`
Expected: PASS.

```bash
git add lib/support/intake.ts lib/support/inbound/actions.ts lib/support/inbound/actions.test.ts
git commit -m "feat(support): create case, dismiss and block sender for inbound email"
```

---

### Task 7: Staff API routes

**Files:**
- Create: `app/api/support/inbox/route.ts`, `app/api/support/inbox/[id]/route.ts`, `app/api/support/cases/[id]/emails/route.ts`
- Test: `app/api/support/inbox/handlers.test.ts` with the handler logic in `lib/support/inbound/handlers.ts`

**Interfaces:**
- Consumes: `requireSupportApiUser` (existing; returns `{ ok: true; user }` where `user.id` is the Supabase auth user id), actions from Task 6.
- Produces:
  - `GET /api/support/inbox` -> `{ items: InboxItem[]; pendingCount: number }`, newest first, `body_text` omitted (a 240-character `preview` instead).
  - `GET /api/support/inbox?id=<uuid>` -> `{ item: InboxItem & { body_text: string } }`.
  - `POST /api/support/inbox/[id]` with body `{ action: "create_case" | "dismiss" | "block" }` -> `{ ok: true, caseId? }`; 404 `not-found`, 409 `not-pending`, 400 bad action.
  - `GET /api/support/cases/[id]/emails` -> `{ emails: Array<{ id; from_email; from_name; subject; body_text; received_at }> }` (status `attached` or `converted`, oldest first).
  - `type InboxItem = { id: string; from_email: string; from_name: string | null; subject: string; preview: string; received_at: string }`

`handled_by` references an hr person or auth user id? The column is a plain uuid with no FK; store the Supabase auth user id (`user.id`).

- [ ] **Step 1: Write the failing tests**

Create `app/api/support/inbox/handlers.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { handleInboxAction, toInboxItem } from "@/lib/support/inbound/handlers"
import type { ActionDeps, InboundRow } from "@/lib/support/inbound/actions"

const ROW: InboundRow = { id: "r1", status: "pending", from_email: "a@b.com", from_name: null, subject: "Hi", body_text: "x".repeat(500), case_id: null }

function deps(row: InboundRow | null): ActionDeps {
  return {
    now: () => new Date("2026-10-11T12:00:00Z"),
    createCase: async () => ({ id: "case-1" }),
    store: { getEmail: async () => row, update: async () => {}, upsertBlocked: async () => {}, dismissPendingFrom: async () => {} },
  }
}

test("toInboxItem truncates the preview to 240 characters", () => {
  const item = toInboxItem({ id: "r1", from_email: "a@b.com", from_name: null, subject: "Hi", body_text: "y".repeat(500), received_at: "2026-10-11T00:00:00Z" })
  assert.equal(item.preview.length, 240)
  assert.ok(!("body_text" in item))
})

test("handleInboxAction maps actions and outcomes to status codes", async () => {
  assert.deepEqual(await handleInboxAction("r1", "create_case", "u1", deps(ROW)), { status: 200, body: { ok: true, caseId: "case-1" } })
  assert.deepEqual(await handleInboxAction("r1", "dismiss", "u1", deps(ROW)), { status: 200, body: { ok: true } })
  assert.deepEqual(await handleInboxAction("r1", "block", "u1", deps(ROW)), { status: 200, body: { ok: true } })
  assert.equal((await handleInboxAction("r1", "dismiss", "u1", deps(null))).status, 404)
  assert.equal((await handleInboxAction("r1", "dismiss", "u1", deps({ ...ROW, status: "converted" }))).status, 409)
  assert.equal((await handleInboxAction("r1", "explode", "u1", deps(ROW))).status, 400)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test app/api/support/inbox/handlers.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the shared handlers**

Create `lib/support/inbound/handlers.ts`:

```ts
import { blockSender, createCaseFromEmail, dismissEmail, type ActionDeps } from "./actions"

export type InboxItem = {
  id: string
  from_email: string
  from_name: string | null
  subject: string
  preview: string
  received_at: string
}

export function toInboxItem(row: {
  id: string
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  received_at: string
}): InboxItem {
  return {
    id: row.id,
    from_email: row.from_email,
    from_name: row.from_name,
    subject: row.subject,
    preview: row.body_text.slice(0, 240),
    received_at: row.received_at,
  }
}

export async function handleInboxAction(
  id: string,
  action: string,
  actorId: string,
  deps: ActionDeps
): Promise<{ status: number; body: Record<string, unknown> }> {
  let result
  if (action === "create_case") result = await createCaseFromEmail(id, actorId, deps)
  else if (action === "dismiss") result = await dismissEmail(id, actorId, deps)
  else if (action === "block") result = await blockSender(id, actorId, deps)
  else return { status: 400, body: { error: "Unknown action" } }

  if (result.ok) return { status: 200, body: result.caseId ? { ok: true, caseId: result.caseId } : { ok: true } }
  return result.reason === "not-found"
    ? { status: 404, body: { error: "Email not found" } }
    : { status: 409, body: { error: "This email was already handled" } }
}
```

- [ ] **Step 4: Implement the routes**

Create `app/api/support/inbox/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireSupportApiUser } from "@/lib/auth/require-support-api"
import { createAdminClient } from "@/lib/supabase/admin"
import { toInboxItem } from "@/lib/support/inbound/handlers"

export async function GET(request: Request) {
  const auth = await requireSupportApiUser()
  if (!auth.ok) return auth.response

  const supabase = createAdminClient()
  const id = new URL(request.url).searchParams.get("id")

  if (id) {
    const { data, error } = await supabase
      .from("support_inbound_emails")
      .select("id, from_email, from_name, subject, body_text, received_at, status")
      .eq("id", id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Email not found" }, { status: 404 })
    return NextResponse.json({ item: { ...toInboxItem(data), body_text: data.body_text, status: data.status } })
  }

  const { data, error, count } = await supabase
    .from("support_inbound_emails")
    .select("id, from_email, from_name, subject, body_text, received_at", { count: "exact" })
    .eq("status", "pending")
    .order("received_at", { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: (data ?? []).map(toInboxItem), pendingCount: count ?? 0 })
}
```

Create `app/api/support/inbox/[id]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireSupportApiUser } from "@/lib/auth/require-support-api"
import { createDefaultActionDeps } from "@/lib/support/inbound/actions"
import { handleInboxAction } from "@/lib/support/inbound/handlers"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSupportApiUser()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json().catch(() => null)
  const action = typeof body?.action === "string" ? body.action : ""

  try {
    const result = await handleInboxAction(id, action, auth.user.id, createDefaultActionDeps())
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error("[support-inbox] action failed:", error)
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
```

Create `app/api/support/cases/[id]/emails/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireSupportApiUser } from "@/lib/auth/require-support-api"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSupportApiUser()
  if (!auth.ok) return auth.response
  const { id } = await params

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("support_inbound_emails")
    .select("id, from_email, from_name, subject, body_text, received_at")
    .eq("case_id", id)
    .in("status", ["attached", "converted"])
    .order("received_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: data ?? [] })
}
```

- [ ] **Step 5: Run to verify pass, typecheck, commit**

Run: `npx tsx --experimental-test-module-mocks --test app/api/support/inbox/handlers.test.ts && npm run typecheck`
Expected: PASS.

```bash
git add lib/support/inbound/handlers.ts app/api/support/inbox app/api/support/cases
git commit -m "feat(support): staff API for the support inbox"
```

---

### Task 8: Inbox UI and case drawer section

**Files:**
- Create: `components/support/support-inbox.tsx`, `components/support/support-case-emails.tsx`
- Modify: `components/support/support-page-client.tsx`

**Interfaces:**
- Consumes: the Task 7 routes.
- Produces: `<SupportInbox onCaseCreated={(caseId: string) => void} onCountChange={(n: number) => void} />` and `<SupportCaseEmails caseId={string} />`.

The page gets a view switch ("Cases" and "Inbox (n)") under the header. The Inbox view replaces the stat cards, charts, filters and table. After every action the list must reload from the server, and Create Case must also refresh the cases list and open that case (the memory rule: verify pages actually update after create, edit and delete).

- [ ] **Step 1: Write the Inbox component**

Create `components/support/support-inbox.tsx`:

```tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { Ban, FilePlus2, MailX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

type Item = { id: string; from_email: string; from_name: string | null; subject: string; preview: string; received_at: string }
type Detail = Item & { body_text: string }

export function SupportInbox({
  onCaseCreated,
  onCountChange,
}: {
  onCaseCreated: (caseId: string) => void
  onCountChange: (count: number) => void
}) {
  const { toast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await fetch("/api/support/inbox", { cache: "no-store" })
    if (!response.ok) {
      toast({ title: "Could Not Load the Inbox", variant: "destructive" })
      setLoading(false)
      return
    }
    const json = (await response.json()) as { items: Item[]; pendingCount: number }
    setItems(json.items)
    onCountChange(json.pendingCount)
    setLoading(false)
  }, [onCountChange, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!openId) {
      setDetail(null)
      return
    }
    let cancelled = false
    void fetch(`/api/support/inbox?id=${encodeURIComponent(openId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.item) setDetail(json.item as Detail)
      })
    return () => {
      cancelled = true
    }
  }, [openId])

  async function act(id: string, action: "create_case" | "dismiss" | "block") {
    setBusyId(id)
    try {
      const response = await fetch(`/api/support/inbox/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast({ title: json.error ?? "Action Failed", variant: "destructive" })
      } else {
        toast({
          title: action === "create_case" ? "Case Created" : action === "dismiss" ? "Email Dismissed" : "Sender Blocked",
        })
        if (openId === id) setOpenId(null)
        if (action === "create_case" && json.caseId) onCaseCreated(json.caseId as string)
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Inbox Is Empty</p>
        <p className="mt-1 text-sm text-muted-foreground">New mail to the support address will show up here.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item) => {
        const open = openId === item.id
        const busy = busyId === item.id
        return (
          <li key={item.id} className="p-4">
            <button type="button" className="block w-full text-left" onClick={() => setOpenId(open ? null : item.id)} aria-expanded={open}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.subject || "(No Subject)"}</p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.from_name ? `${item.from_name} · ` : ""}
                {item.from_email}
              </p>
              {!open && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.preview}</p>}
            </button>
            {open && (
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-secondary p-3 font-sans text-sm text-foreground">
                {detail?.id === item.id ? detail.body_text || "(No Text)" : "Loading…"}
              </pre>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => act(item.id, "create_case")}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Create Case
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act(item.id, "dismiss")}>
                <MailX className="mr-2 h-4 w-4" />
                Dismiss
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act(item.id, "block")}>
                <Ban className="mr-2 h-4 w-4" />
                Block Sender
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: Write the case drawer section**

Create `components/support/support-case-emails.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

type CaseEmail = { id: string; from_email: string; from_name: string | null; subject: string; body_text: string; received_at: string }

export function SupportCaseEmails({ caseId }: { caseId: string }) {
  const [emails, setEmails] = useState<CaseEmail[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setEmails(null)
    void fetch(`/api/support/cases/${encodeURIComponent(caseId)}/emails`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { emails: [] }))
      .then((json) => {
        if (!cancelled) setEmails(json.emails as CaseEmail[])
      })
      .catch(() => {
        if (!cancelled) setEmails([])
      })
    return () => {
      cancelled = true
    }
  }, [caseId])

  if (!emails || emails.length === 0) return null
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Emails</h3>
      <ul className="space-y-3">
        {emails.map((email) => (
          <li key={email.id} className="rounded-md border border-border bg-secondary p-3">
            <p className="text-xs text-muted-foreground">
              {email.from_name ? `${email.from_name} · ` : ""}
              {email.from_email} · {format(new Date(email.received_at), "MMM d, yyyy h:mm a")}
            </p>
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-foreground">{email.body_text}</pre>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Wire both into the Support page**

In `components/support/support-page-client.tsx`:

1. Add imports:

```tsx
import { SupportInbox } from "@/components/support/support-inbox"
import { SupportCaseEmails } from "@/components/support/support-case-emails"
```

2. Add state near the other `useState` calls: `const [view, setView] = useState<"cases" | "inbox">("cases")` and `const [inboxCount, setInboxCount] = useState(0)`. Read an initial view from the URL once: `useEffect(() => { if (new URLSearchParams(window.location.search).get("view") === "inbox") setView("inbox") }, [])`.

3. Fetch the pending count on mount even while the Cases view is showing, so the tab label is right: `useEffect(() => { void fetch("/api/support/inbox", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => j && setInboxCount(j.pendingCount)) }, [])`.

4. Directly under `<PageHeader ... />` insert the switch:

```tsx
      <div role="tablist" aria-label="Support views" className="flex gap-2">
        <Button role="tab" aria-selected={view === "cases"} variant={view === "cases" ? "default" : "outline"} size="sm" onClick={() => setView("cases")}>
          Cases
        </Button>
        <Button role="tab" aria-selected={view === "inbox"} variant={view === "inbox" ? "default" : "outline"} size="sm" onClick={() => setView("inbox")}>
          Inbox{inboxCount > 0 ? ` (${inboxCount})` : ""}
        </Button>
      </div>
```

5. Wrap the existing stat cards, charts, filter bar and table (everything between the switch and the `RecordDrawer`) in `{view === "cases" && ( <> ... </> )}` and add:

```tsx
      {view === "inbox" && (
        <SupportInbox
          onCountChange={setInboxCount}
          onCaseCreated={async (caseId) => {
            await loadData()
            setView("cases")
            const created = cases.find((c) => c.id === caseId)
            if (created) openEdit(created)
          }}
        />
      )}
```

Use the page's real names for its existing data loader and drawer opener (read the file: the loader that fills `cases`, and the function that opens the drawer for a row, shown above as `openEdit`; if `cases` has not updated yet when the callback runs, set a `pendingOpenId` state and open the row in an effect once `cases` contains it).

6. Inside the `RecordDrawer`, directly after `{editing && <SupportCaseSubmissionDetails row={editing} />}` add `{editing && <SupportCaseEmails caseId={editing.id} />}`.

- [ ] **Step 4: Typecheck and lint**

Run: `npm run typecheck && npx eslint components/support app/api/support lib/support`
Expected: PASS.

- [ ] **Step 5: Browser pass on a local dev server**

Use a port that is free (another session may hold 3000; the sign-in only returns to localhost:3000, so stop the other server or ask Noah first). With the dev server running and signed in to Core:

1. Insert three test rows with the Supabase MCP into `support_inbound_emails` (one normal, one from a second sender, one more from the same second sender) and one `attached` row linked to an existing case.
2. Check: the Inbox tab shows "Inbox (3)"; opening a row shows the plain text; Create Case opens the new case with entry point `email` and the Inbox count drops to 2 without a reload; Dismiss drops it; Block Sender removes both rows from that sender and adds the address to `support_blocked_senders`; the attached row shows under "Emails" in its case drawer.
3. Delete all test rows and the test case afterwards (through Core's UI for the case, MCP for the inbound rows and the blocked sender).

- [ ] **Step 6: Commit**

```bash
git add components/support
git commit -m "feat(support): Support Inbox view and case email history"
```

---

### Task 9: Purge cron

**Files:**
- Create: `lib/support/inbound/purge.ts`, `app/api/cron/purge-support-inbox/route.ts`
- Modify: `vercel.json`
- Test: `lib/support/inbound/purge.test.ts`

**Interfaces:**
- Produces: `purgeHandledEmails(deps: { deleteBefore: (cutoffIso: string) => Promise<number>; now: () => Date }, retentionDays = 30): Promise<number>` — deletes `dismissed` and `blocked` rows whose `handled_at` is older than the cutoff.

- [ ] **Step 1: Write the failing test**

Create `lib/support/inbound/purge.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"
import { purgeHandledEmails } from "./purge"

test("purgeHandledEmails deletes rows handled more than 30 days ago", async () => {
  let cutoff = ""
  const deleted = await purgeHandledEmails({
    now: () => new Date("2026-10-31T00:00:00Z"),
    deleteBefore: async (iso) => {
      cutoff = iso
      return 4
    },
  })
  assert.equal(deleted, 4)
  assert.equal(cutoff, "2026-10-01T00:00:00.000Z")
})

test("purgeHandledEmails honours a custom retention", async () => {
  let cutoff = ""
  await purgeHandledEmails({ now: () => new Date("2026-10-31T00:00:00Z"), deleteBefore: async (iso) => ((cutoff = iso), 0) }, 7)
  assert.equal(cutoff, "2026-10-24T00:00:00.000Z")
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/purge.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `lib/support/inbound/purge.ts`:

```ts
import { createAdminClient } from "@/lib/supabase/admin"

export async function purgeHandledEmails(
  deps: { deleteBefore: (cutoffIso: string) => Promise<number>; now: () => Date },
  retentionDays = 30
): Promise<number> {
  const cutoff = new Date(deps.now().getTime() - retentionDays * 24 * 60 * 60 * 1000)
  return deps.deleteBefore(cutoff.toISOString())
}

export function createDefaultPurgeDeps() {
  const supabase = createAdminClient()
  return {
    now: () => new Date(),
    deleteBefore: async (cutoffIso: string) => {
      const { data, error } = await supabase
        .from("support_inbound_emails")
        .delete()
        .in("status", ["dismissed", "blocked"])
        .lt("handled_at", cutoffIso)
        .select("id")
      if (error) throw new Error(error.message)
      return (data ?? []).length
    },
  }
}
```

Create `app/api/cron/purge-support-inbox/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { withCronAuth } from "@/lib/api-auth"
import { createDefaultPurgeDeps, purgeHandledEmails } from "@/lib/support/inbound/purge"

export const maxDuration = 60

export const GET = withCronAuth(async (_request: NextRequest) => {
  try {
    const purged = await purgeHandledEmails(createDefaultPurgeDeps())
    return NextResponse.json({ ok: true, purged })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to purge support inbox" }, { status: 500 })
  }
})
```

In `vercel.json`, add to the `crons` array:

```json
    {
      "path": "/api/cron/purge-support-inbox",
      "schedule": "40 8 * * *"
    },
```

- [ ] **Step 4: Run to verify pass, then the whole gate set, then commit**

Run: `npx tsx --experimental-test-module-mocks --test lib/support/inbound/purge.test.ts && npm run lint && npm run typecheck && npm run test:unit && npm run build`
Expected: all pass (if lint or the suite shows failures unrelated to this work, compare against `origin/main` before touching them).

```bash
git add lib/support/inbound/purge.ts lib/support/inbound/purge.test.ts app/api/cron/purge-support-inbox vercel.json
git commit -m "feat(support): purge handled inbox mail after 30 days"
```

---

### Task 10: Rollout (needs Noah at each outward step)

**Files:** none. Each step below changes something outside the repo; stop and ask Noah before steps 1, 2 and 5.

- [ ] **Step 1: Push**

Check `git log origin/main..feat/email-to-ticket` shows only this feature's commits, then `git push origin feat/email-to-ticket:main`. Watch the CI run and the Vercel deploy to READY. (The Task 1 migration is already applied live, so the new code finds its tables.)

- [ ] **Step 2: Resend setup (Noah, in the Resend dashboard and DNS)**

1. Resend dashboard -> add the domain `tickets.cofabri.com` for receiving; add the MX record Resend shows to the cofabri.com DNS; wait for verification.
2. Resend -> Webhooks -> add an endpoint `https://core.cofabri.com/api/webhooks/resend-inbound` for the `email.received` event. Copy the signing secret.
3. Create a Resend API key that can read received emails.
4. Set the two Core env vars (Production, Sensitive) without printing them: `RESEND_INBOUND_WEBHOOK_SECRET` (the signing secret) and `RESEND_INBOUND_API_KEY`. Use the Vercel CLI with the secret piped on stdin, then redeploy Core (env changes need a new deployment).

- [ ] **Step 3: Send a direct test**

Send an email from a personal address to `support@tickets.cofabri.com`. Expected: within a minute a row appears in the Inbox tab and a bell notification arrives for admin and engineering. Check the Vercel function log shows `200` for the webhook and no errors.

- [ ] **Step 4: Test the reply path**

Submit a test ticket on cofabri.com/support from that same address, then reply to the confirmation email's thread through the group address path (Step 5 must be done for the reply to reach Core, so do this after Step 5). Expected: the reply appears under "Emails" in that case's drawer and the assignee (or admins) are notified. Delete the test case afterwards through Core.

- [ ] **Step 5: Add the address to the Google Group (Noah)**

In Google Admin -> Groups -> the support@ group -> add `support@tickets.cofabri.com` as a member (allow external members if the group blocks them). Send one more test email to `support@cofabri.com`; it should arrive in the team's inboxes as before and as a new Inbox row.

- [ ] **Step 6: Clean up and record**

Remove the worktree and branch once everything is on `origin/main` (`git worktree remove`, `git branch -D`), and update the project memory with the live state and the two env var names.
