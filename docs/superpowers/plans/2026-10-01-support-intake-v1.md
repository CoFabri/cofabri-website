# Support Intake v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it easy to file a support ticket from any CoFabri app: a shorter `/support` form, consistent in-app links that carry an entry point, a patient-safe mode, a confirmation email, and the data to measure adoption.

**Architecture:** The website form keeps reading prefill from URL params (no signed tokens). A new pure module parses and sanitizes the params. The website forwards four new fields to cofabri-api, which stores them on `support_cases` and sends a confirmation email. Core shows the new fields read-only. Each app's own URL helper adds `from` (and `audience` for patient surfaces).

**Tech Stack:** Next.js (website, Core, apps), vitest + Playwright (website), jest (cofabri-api), `node:test` (Medoura URL helper), Supabase Postgres, express-validator.

**Spec:** `docs/superpowers/specs/2026-10-01-support-intake-v1-design.md` (in `cofabri-website`). Two spec details changed after reading the apps (see Task 0).

## Global Constraints

- Titles, headings, labels, buttons and email subjects are Title Case; body text stays sentence case.
- No PHI in `support_cases`: patient mode hides screenshots, the PHI notice shows for everyone, and the confirmation email never echoes the description.
- All new columns are additive and nullable. Nothing breaks for callers that omit the new params.
- URL contract (every app uses exactly this): existing `app`, `subject` (`support`|`feature`), `firstName`, `lastName`, `email`, `phone`, `language`; new `from`, `tenant`, `audience` (`staff` default | `patient`).
- Entry point values: `website` (default when absent), `help-menu`, `error-page`, `settings`, `patient-account`, `help-center`, `landing`, `other` (any unknown value).
- App `name` values used in `app=` must match the apps table exactly (case-insensitive): `Gathr`, `Medoura`, `Praxis`, `RxBridge`.
- Every repo: before pushing, read its `.github/workflows/ci.yml` and run the same commands locally. Commit locally; push once per finished repo (every push to main deploys).
- Shared checkouts get switched by other sessions. Do all work in a fresh worktree off `main` named `feat/support-intake-v1`, never in the main checkout.
- Supabase MCP data/schema writes are blocked in auto mode; ask the user to leave auto mode before Task 1 Step 3.

## Review Focus

- Params that are huge, contain `<script>`, repeat, or have a bad `from`/`audience` must not break the page or get stored raw (Task 5 tests).
- `audience=patient` with identity params in the URL must show no prefilled name/email and no screenshot field (Task 7, Task 8 e2e).
- A direct visitor with no params still gets a working form with phone left blank (Task 8 e2e).
- Confirmation email failure (Resend down, template missing) must not fail the ticket (Task 4 test).
- A patient-audience submission that somehow includes screenshots must have them dropped server-side (Task 3 test).
- Preferred contact "Phone" with no phone number must show an error and open More Options (Task 7).

---

## Task 0: Correct the spec

The spec said Praxis/RxBridge need error-boundary links and Medoura needs new header items. Reading the code showed Medoura already has support entry points (QuickActionsHub, staff Help page, Settings Help card, SupportDialog, footer, global-error), Praxis/RxBridge have no `error.tsx`, and Medoura's `referrer=Medoura` is an app name, not an entry point.

**Files:**
- Modify: `cofabri-website/docs/superpowers/specs/2026-10-01-support-intake-v1-design.md`

- [ ] **Step 1:** In section 2, delete the sentence "`referrer` is accepted as a legacy alias for `from`..." and replace it with: "`referrer` is ignored. Medoura currently sends `referrer=Medoura`; its helper drops it when it adds `from`." Add `website` (default when absent) to the entry point list.
- [ ] **Step 2:** Replace the section 7 table with:

| App | Add / change |
|---|---|
| Medoura | Existing entry points get `from`: staff Help page `help-center`, Settings Help card `settings`, QuickActionsHub `help-menu`, patient footer/dialog `patient-account` (`audience=patient`), `global-error` `error-page`. Fix the staff error toast, which links to the cofabri.com home page instead of `/support`. |
| Praxis | New "Still Need Help?" card at the bottom of the Help Center page (`from=help-center`). The sidebar already has a Help item. |
| RxBridge | Same as Praxis. |
| Gathr | Existing links get `from`: sidebar `help-menu`, footer and landing header `landing`, advertise shell `landing`. |

- [ ] **Step 3:** Commit.

```bash
cd cofabri-website
git add docs/superpowers/specs/2026-10-01-support-intake-v1-design.md
git commit -m "docs: correct support intake v1 spec after reading app entry points"
```

---

## Task 1: Database columns (Core migration, applied live)

**Files:**
- Create: `cofabri-core/supabase/migrations/20261001120000_add_support_case_intake_fields.sql`
- Modify: `cofabri-core/types/database.ts` (the `support_cases` Row/Insert/Update blocks, around line 8818)

- [ ] **Step 1: Create the worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git fetch origin && git worktree add ../cofabri-core-support-intake -b feat/support-intake-v1 origin/main
cd ../cofabri-core-support-intake && pnpm install --frozen-lockfile
```

- [ ] **Step 2: Write the migration**

```sql
-- Support intake v1: where a ticket came from, plus the contact phone the
-- form already collects but never stored. All nullable/additive.
alter table public.support_cases
  add column if not exists entry_point text,
  add column if not exists tenant_name text,
  add column if not exists phone text,
  add column if not exists audience text;

alter table public.support_cases
  add constraint support_cases_audience_check
  check (audience is null or audience in ('staff', 'patient'));

comment on column public.support_cases.entry_point is 'Where the submitter came from (help-menu, error-page, settings, patient-account, help-center, landing, website, other).';
comment on column public.support_cases.tenant_name is 'Tenant display name passed by the app (patient and staff surfaces).';
comment on column public.support_cases.audience is 'staff or patient. Patient tickets never carry screenshots.';
```

- [ ] **Step 3: Apply live.** With the user out of auto mode, find the CoFabri Supabase project (`list_projects`, or the project behind `COFABRI_SUPABASE_URL`), then apply this exact SQL with `apply_migration` (name `add_support_case_intake_fields`). Verify:

```sql
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'support_cases'
  and column_name in ('entry_point', 'tenant_name', 'phone', 'audience');
```
Expected: 4 rows.

- [ ] **Step 4: Update types.** In `types/database.ts`, in the `support_cases` block add to **Row** `audience: string | null`, `entry_point: string | null`, `phone: string | null`, `tenant_name: string | null`; to **Insert** and **Update** add the same four as optional (`audience?: string | null`, etc). Position does not matter to the compiler; keep alphabetical for tidiness.

- [ ] **Step 5: Verify and commit**

```bash
pnpm exec next typegen && pnpm run typecheck
git add supabase/migrations/20261001120000_add_support_case_intake_fields.sql types/database.ts
git commit -m "feat(support): add entry_point, tenant_name, phone, audience to support_cases"
```
Expected: typecheck passes.

---

## Task 2: Show the new fields in Core

Core's drawer edits the whole case through `supportCaseFormToInsert`; the new fields are submission metadata, so they are shown read-only and are not added to the form state (so saving never overwrites them).

**Files:**
- Create: `cofabri-core-support-intake/components/support/support-case-submission-details.tsx`
- Modify: `cofabri-core-support-intake/components/support/support-page-client.tsx` (the `{editing && (` blocks near line 461)

**Interfaces:**
- Produces: `SupportCaseSubmissionDetails({ row }: { row: SupportCaseRow })`, renders nothing when all four fields are empty. `SupportCaseRow` is the existing type exported from `support-cases-shared.tsx`.

- [ ] **Step 1: Create the component**

```tsx
import type { SupportCaseRow } from "@/components/support/support-cases-shared"

function labelizeEntryPoint(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SupportCaseSubmissionDetails({ row }: { row: SupportCaseRow }) {
  const items: { label: string; value: string }[] = []
  if (row.entry_point) items.push({ label: "Entry Point", value: labelizeEntryPoint(row.entry_point) })
  if (row.tenant_name) items.push({ label: "Tenant", value: row.tenant_name })
  if (row.audience) items.push({ label: "Audience", value: labelizeEntryPoint(row.audience) })
  if (row.phone) items.push({ label: "Phone", value: row.phone })
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Submission Details</h3>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 2: Render it.** In `support-page-client.tsx` add `import { SupportCaseSubmissionDetails } from "@/components/support/support-case-submission-details"` and, directly above the `{editing && (` Screenshots block, add:

```tsx
        {editing && <SupportCaseSubmissionDetails row={editing} />}
```

- [ ] **Step 3: Run Core's CI gates**

```bash
pnpm run lint && pnpm exec next typegen && pnpm run typecheck && pnpm run check:api-auth && pnpm run test:unit && pnpm run build
```
Expected: all pass.

- [ ] **Step 4: Commit** (`feat(support): show submission details on a case`). Do not push yet; the browser check happens in Task 12 after real data exists.

---

## Task 3: cofabri-api stores the new fields

**Files:**
- Modify: `cofabri-api/src/routes/web-forms.js` (the `/support` validators)
- Modify: `cofabri-api/src/services/WebFormsService.js` (`submitSupportTicket`)
- Test: `cofabri-api/tests/services/WebFormsService.test.js`

**Interfaces:**
- Produces: `submitSupportTicket` accepts `phone`, `entry_point`, `tenant_name`, `audience` and writes `phone`, `entry_point`, `tenant_name`, `audience` (null when omitted). When `audience === 'patient'`, `screenshots` is ignored.

- [ ] **Step 1: Worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api"
git fetch origin && git worktree add ../cofabri-api-support-intake -b feat/support-intake-v1 origin/main
cd ../cofabri-api-support-intake && npm ci
```

- [ ] **Step 2: Write failing tests.** Append inside `describe('WebFormsService.submitSupportTicket', ...)` in `tests/services/WebFormsService.test.js`:

```js
  it('stores phone, entry_point, tenant_name and audience when provided', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitSupportTicket({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
      subject: 'S', description: 'D',
      phone: '+15551234567', entry_point: 'help-menu', tenant_name: 'Acme Clinic', audience: 'staff',
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        phone: '+15551234567', entry_point: 'help-menu', tenant_name: 'Acme Clinic', audience: 'staff',
      }),
    ]);
  });

  it('defaults phone, entry_point, tenant_name and audience to null', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitSupportTicket({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', subject: 'S', description: 'D',
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ phone: null, entry_point: null, tenant_name: null, audience: null }),
    ]);
  });

  it('drops screenshots for patient-audience tickets', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitSupportTicket({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', subject: 'S', description: 'D',
      audience: 'patient',
      screenshots: [{ buffer: Buffer.from('x'), contentType: 'image/png', fileName: 'a.png' }],
    });

    // Only the support_cases insert happened; no storage upload or screenshot row.
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('support_cases');
  });
```

- [ ] **Step 3: Run to confirm failure**

Run: `npx jest tests/services/WebFormsService.test.js -t "submitSupportTicket"`
Expected: the three new tests FAIL.

- [ ] **Step 4: Implement.** In `WebFormsService.js` change the `submitSupportTicket` signature to add `phone, entry_point, tenant_name, audience`, add them to the insert object, and guard screenshots:

```js
  async submitSupportTicket({
    first_name, last_name, email, subject, description, app_id,
    subject_type, preferred_contact_method, company_organization, language_preference,
    phone, entry_point, tenant_name, audience,
    screenshots,
  }) {
```
Insert object additions (next to `language_preference`):
```js
        phone: phone || null,
        entry_point: entry_point || null,
        tenant_name: tenant_name || null,
        audience: audience || null,
```
Change `if (screenshots?.length) {` to:
```js
    // Patient tickets never carry screenshots: an image can itself contain PHI.
    if (audience !== 'patient' && screenshots?.length) {
```

- [ ] **Step 5: Route validators.** In `routes/web-forms.js` add a constant near the other constants and the validators in the `/support` array:

```js
const SUPPORT_ENTRY_POINTS = ['website', 'help-menu', 'error-page', 'settings', 'patient-account', 'help-center', 'landing', 'other'];
```
```js
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
    body('entry_point').optional({ checkFalsy: true }).isIn(SUPPORT_ENTRY_POINTS),
    body('tenant_name').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('audience').optional({ checkFalsy: true }).isIn(['staff', 'patient']),
```

- [ ] **Step 6: Run tests**

Run: `npx jest tests/services/WebFormsService.test.js`
Expected: PASS.

- [ ] **Step 7: Commit** (`feat(support): store entry point, tenant, phone and audience on tickets`).

---

## Task 4: Confirmation email

**Files:**
- Create: `cofabri-api-support-intake/src/services/SupportConfirmationEmail.js`
- Test: `cofabri-api-support-intake/tests/services/SupportConfirmationEmail.test.js`
- Modify: `cofabri-api-support-intake/src/services/WebFormsService.js`
- Modify: `cofabri-api-support-intake/tests/services/WebFormsService.test.js` (mock the new module)

**Interfaces:**
- Produces: `sendSupportRequestReceivedEmail({ email, firstName, ticketSubmissionId })` returns a promise that never rejects; exports `TEMPLATE_KEY = 'support_request_received'`.

- [ ] **Step 1: Write the failing test** `tests/services/SupportConfirmationEmail.test.js`:

```js
jest.mock('../../src/services/EmailTemplateService');
jest.mock('../../src/services/CommunicationsService');

const EmailTemplateService = require('../../src/services/EmailTemplateService');
const CommunicationsService = require('../../src/services/CommunicationsService');
const { sendSupportRequestReceivedEmail, TEMPLATE_KEY } = require('../../src/services/SupportConfirmationEmail');

describe('sendSupportRequestReceivedEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('sends the published template with the ticket number and first name', async () => {
    EmailTemplateService.getPublishedTemplate.mockResolvedValue({ id: 'tpl-1' });
    CommunicationsService.sendEmail.mockResolvedValue({ id: 'email-1' });

    await sendSupportRequestReceivedEmail({ email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: 42 });

    expect(CommunicationsService.sendEmail).toHaveBeenCalledWith({
      app_id: 'cofabri-core',
      to: 'jane@example.com',
      reply_to: 'support@cofabri.com',
      template: { key: TEMPLATE_KEY, data: { firstName: 'Jane', ticketNumber: 'CS-42' } },
    });
  });

  it('seeds and publishes the template when it does not exist yet', async () => {
    EmailTemplateService.getPublishedTemplate.mockResolvedValue(null);
    EmailTemplateService.upsertDraft.mockResolvedValue({ id: 'draft-1' });
    EmailTemplateService.publish.mockResolvedValue({ id: 'draft-1' });
    CommunicationsService.sendEmail.mockResolvedValue({ id: 'email-1' });

    await sendSupportRequestReceivedEmail({ email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: 7 });

    expect(EmailTemplateService.upsertDraft).toHaveBeenCalledWith(
      'cofabri-core',
      TEMPLATE_KEY,
      expect.objectContaining({ subject_template: 'We Received Your Support Request ({{ticketNumber}})' }),
    );
    expect(EmailTemplateService.publish).toHaveBeenCalledWith('cofabri-core', TEMPLATE_KEY, 'system:support-intake');
  });

  it('does nothing when there is no email or no ticket number', async () => {
    await sendSupportRequestReceivedEmail({ email: '', firstName: 'Jane', ticketSubmissionId: 1 });
    await sendSupportRequestReceivedEmail({ email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: null });
    expect(CommunicationsService.sendEmail).not.toHaveBeenCalled();
  });

  it('never rejects when sending fails', async () => {
    EmailTemplateService.getPublishedTemplate.mockResolvedValue({ id: 'tpl-1' });
    CommunicationsService.sendEmail.mockRejectedValue(new Error('resend down'));

    await expect(
      sendSupportRequestReceivedEmail({ email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: 3 }),
    ).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it('never puts the ticket description in the email data', async () => {
    EmailTemplateService.getPublishedTemplate.mockResolvedValue({ id: 'tpl-1' });
    CommunicationsService.sendEmail.mockResolvedValue({});
    await sendSupportRequestReceivedEmail({ email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: 9, description: 'secret' });
    const data = CommunicationsService.sendEmail.mock.calls[0][0].template.data;
    expect(Object.keys(data).sort()).toEqual(['firstName', 'ticketNumber']);
  });
});
```

- [ ] **Step 2: Run to confirm failure.** `npx jest tests/services/SupportConfirmationEmail.test.js` — FAIL (module not found).

- [ ] **Step 3: Implement** `src/services/SupportConfirmationEmail.js`:

```js
const EmailTemplateService = require('./EmailTemplateService');
const CommunicationsService = require('./CommunicationsService');

const TEMPLATE_KEY = 'support_request_received';
// The CoFabri platform app (same one IncidentNotificationService sends from).
const COFABRI_APP_ID = 'cofabri-core';
const SUPPORT_REPLY_TO = 'support@cofabri.com';

async function ensureSupportRequestReceivedTemplate() {
  const existing = await EmailTemplateService.getPublishedTemplate(COFABRI_APP_ID, TEMPLATE_KEY);
  if (existing) return existing;

  await EmailTemplateService.upsertDraft(COFABRI_APP_ID, TEMPLATE_KEY, {
    subject_template: 'We Received Your Support Request ({{ticketNumber}})',
    preview_text_template: 'Your ticket number is {{ticketNumber}}.',
    variant: 'default',
    header_label: 'Support Request Received',
    blocks_draft: [
      { type: 'paragraph', text: "Hi {{firstName}}, thanks for reaching out. We've received your request and will reply within one business day." },
      { type: 'paragraph', text: 'Your ticket number is {{ticketNumber}}. Reply to this email if you want to add more details.' },
      { type: 'paragraph', text: "Please don't include health information in your reply. We can help without it." },
    ],
    sample_data: { firstName: 'Jane', ticketNumber: 'CS-1042' },
  });
  return EmailTemplateService.publish(COFABRI_APP_ID, TEMPLATE_KEY, 'system:support-intake');
}

// Best-effort: the ticket already exists, so a failure here must never fail
// the submission. Awaited by the caller (not fire-and-forget) because a
// serverless function can be frozen once the response is sent.
async function sendSupportRequestReceivedEmail({ email, firstName, ticketSubmissionId }) {
  if (!email || ticketSubmissionId === null || ticketSubmissionId === undefined) return;
  try {
    await ensureSupportRequestReceivedTemplate();
    await CommunicationsService.sendEmail({
      app_id: COFABRI_APP_ID,
      to: email,
      reply_to: SUPPORT_REPLY_TO,
      template: {
        key: TEMPLATE_KEY,
        data: { firstName: firstName || 'there', ticketNumber: `CS-${ticketSubmissionId}` },
      },
    });
  } catch (error) {
    console.warn('Support confirmation email failed:', error && error.message);
  }
}

module.exports = { sendSupportRequestReceivedEmail, ensureSupportRequestReceivedTemplate, TEMPLATE_KEY };
```

- [ ] **Step 4: Run.** `npx jest tests/services/SupportConfirmationEmail.test.js` — PASS.

- [ ] **Step 5: Wire into `submitSupportTicket`.** Add `const { sendSupportRequestReceivedEmail } = require('./SupportConfirmationEmail');` at the top of `WebFormsService.js`. Just before `return ticket;` in `submitSupportTicket` add:

```js
    await sendSupportRequestReceivedEmail({
      email: ticket.email,
      firstName: ticket.first_name,
      ticketSubmissionId: ticket.ticket_submission_id,
    });
```

- [ ] **Step 6: Keep the service tests isolated.** At the very top of `tests/services/WebFormsService.test.js` (above the existing `jest.mock('@supabase/supabase-js')`) add:

```js
jest.mock('../../src/services/SupportConfirmationEmail', () => ({
  sendSupportRequestReceivedEmail: jest.fn().mockResolvedValue(undefined),
}));
```
Add one test inside the `submitSupportTicket` describe:

```js
  it('sends the confirmation email after the ticket is created', async () => {
    const { sendSupportRequestReceivedEmail } = require('../../src/services/SupportConfirmationEmail');
    const select = jest.fn().mockResolvedValue({
      data: [{ id: '1', email: 'jane@example.com', first_name: 'Jane', ticket_submission_id: 42 }],
      error: null,
    });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitSupportTicket({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', subject: 'S', description: 'D',
    });

    expect(sendSupportRequestReceivedEmail).toHaveBeenCalledWith({
      email: 'jane@example.com', firstName: 'Jane', ticketSubmissionId: 42,
    });
  });
```

- [ ] **Step 7: Run CI gates.** `npm test && npm run build` — expected all pass (this repo has no lint step).

- [ ] **Step 8: Commit** (`feat(support): email submitters a confirmation with their ticket number`).

---

## Task 5: Website param parsing module

**Files:**
- Create: `cofabri-website-support-intake/src/lib/support/params.ts`
- Test: `cofabri-website-support-intake/src/lib/support/params.test.ts`

**Interfaces:**
- Produces:
  - `ENTRY_POINTS`, `type EntryPoint`, `type Audience = 'staff' | 'patient'`
  - `sanitizeEntryPoint(v: unknown): EntryPoint` (null/empty → `'website'`, unknown → `'other'`)
  - `sanitizeAudience(v: unknown): Audience` (anything but `'patient'` → `'staff'`)
  - `sanitizeTenant(v: unknown): string` (trimmed, control chars removed, max 100)
  - `parseSupportParams(params: { get(name: string): string | null } | null | undefined): SupportParams`
  - `interface SupportParams { appNames: string[]; subject: 'support' | 'feature'; firstName: string; lastName: string; email: string; phone: string; language: 'English' | 'Spanish'; from: EntryPoint; tenant: string; audience: Audience }`

- [ ] **Step 1: Worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git worktree add ../cofabri-website-support-intake -b feat/support-intake-v1 main
cd ../cofabri-website-support-intake && npm ci
```

- [ ] **Step 2: Write the failing tests** `src/lib/support/params.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  parseSupportParams,
  sanitizeAudience,
  sanitizeEntryPoint,
  sanitizeTenant,
} from './params';

const q = (s: string) => new URLSearchParams(s);

describe('sanitizeEntryPoint', () => {
  it('defaults to website when absent', () => {
    expect(sanitizeEntryPoint(null)).toBe('website');
    expect(sanitizeEntryPoint('')).toBe('website');
  });
  it('keeps known values', () => {
    expect(sanitizeEntryPoint('help-menu')).toBe('help-menu');
    expect(sanitizeEntryPoint('error-page')).toBe('error-page');
  });
  it('maps anything unknown to other, never storing free text', () => {
    expect(sanitizeEntryPoint('<script>alert(1)</script>')).toBe('other');
    expect(sanitizeEntryPoint('Medoura')).toBe('other');
  });
});

describe('sanitizeAudience', () => {
  it('only patient is patient', () => {
    expect(sanitizeAudience('patient')).toBe('patient');
    expect(sanitizeAudience('staff')).toBe('staff');
    expect(sanitizeAudience('admin')).toBe('staff');
    expect(sanitizeAudience(null)).toBe('staff');
  });
});

describe('sanitizeTenant', () => {
  it('trims, strips control characters and caps length', () => {
    expect(sanitizeTenant('  Acme Clinic \n')).toBe('Acme Clinic');
    expect(sanitizeTenant('a'.repeat(500))).toHaveLength(100);
    expect(sanitizeTenant(undefined)).toBe('');
  });
});

describe('parseSupportParams', () => {
  it('returns safe defaults for no params', () => {
    expect(parseSupportParams(null)).toEqual({
      appNames: [], subject: 'support', firstName: '', lastName: '', email: '', phone: '',
      language: 'English', from: 'website', tenant: '', audience: 'staff',
    });
  });

  it('reads existing params and the new ones', () => {
    const p = parseSupportParams(q('app=Medoura,Praxis&subject=feature&firstName=Jane&lastName=Doe&email=jane%40example.com&phone=%2B15551234567&language=Spanish&from=settings&tenant=Acme'));
    expect(p.appNames).toEqual(['Medoura', 'Praxis']);
    expect(p.subject).toBe('feature');
    expect(p.firstName).toBe('Jane');
    expect(p.email).toBe('jane@example.com');
    expect(p.language).toBe('Spanish');
    expect(p.from).toBe('settings');
    expect(p.tenant).toBe('Acme');
  });

  it('falls back on a bad subject or language', () => {
    const p = parseSupportParams(q('subject=weird&language=Klingon'));
    expect(p.subject).toBe('support');
    expect(p.language).toBe('English');
  });

  it('ignores identity params for patients', () => {
    const p = parseSupportParams(q('audience=patient&firstName=Jane&lastName=Doe&email=jane%40example.com&phone=5551234567&tenant=Acme%20Clinic'));
    expect(p.audience).toBe('patient');
    expect(p.firstName).toBe('');
    expect(p.lastName).toBe('');
    expect(p.email).toBe('');
    expect(p.phone).toBe('');
    expect(p.tenant).toBe('Acme Clinic');
  });

  it('caps oversized identity values', () => {
    const p = parseSupportParams(q(`firstName=${'a'.repeat(300)}&email=${'b'.repeat(300)}%40x.com`));
    expect(p.firstName.length).toBeLessThanOrEqual(50);
    expect(p.email.length).toBeLessThanOrEqual(100);
  });

  it('uses the first value when a param repeats', () => {
    expect(parseSupportParams(q('from=help-menu&from=settings')).from).toBe('help-menu');
  });

  it('ignores the legacy referrer param', () => {
    expect(parseSupportParams(q('referrer=Medoura')).from).toBe('website');
  });
});
```

- [ ] **Step 3: Run to confirm failure.** `npx vitest run src/lib/support/params.test.ts` — FAIL (module not found).

- [ ] **Step 4: Implement** `src/lib/support/params.ts`:

```ts
import { FIELD_LIMITS } from '@/lib/validation/schemas';

export const ENTRY_POINTS = [
  'website',
  'help-menu',
  'error-page',
  'settings',
  'patient-account',
  'help-center',
  'landing',
  'other',
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number];
export type Audience = 'staff' | 'patient';

export interface SupportParams {
  appNames: string[];
  subject: 'support' | 'feature';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: 'English' | 'Spanish';
  from: EntryPoint;
  tenant: string;
  audience: Audience;
}

type ParamReader = { get(name: string): string | null };

const TENANT_MAX = 100;
const PHONE_MAX = 30;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, ' ').trim().slice(0, max);
}

export function sanitizeEntryPoint(value: unknown): EntryPoint {
  if (typeof value !== 'string' || value.trim() === '') return 'website';
  return (ENTRY_POINTS as readonly string[]).includes(value) ? (value as EntryPoint) : 'other';
}

export function sanitizeAudience(value: unknown): Audience {
  return value === 'patient' ? 'patient' : 'staff';
}

export function sanitizeTenant(value: unknown): string {
  return clean(value, TENANT_MAX);
}

export function parseSupportParams(params: ParamReader | null | undefined): SupportParams {
  const get = (name: string) => params?.get(name) ?? '';
  const audience = sanitizeAudience(get('audience'));
  const isPatient = audience === 'patient';

  const appNames = get('app')
    .split(',')
    .map((name) => clean(name, 100))
    .filter(Boolean);

  return {
    appNames,
    subject: get('subject') === 'feature' ? 'feature' : 'support',
    // Patients never get prefilled identity: the form asks for it fresh.
    firstName: isPatient ? '' : clean(get('firstName'), FIELD_LIMITS.firstName),
    lastName: isPatient ? '' : clean(get('lastName'), FIELD_LIMITS.lastName),
    email: isPatient ? '' : clean(get('email'), FIELD_LIMITS.email),
    phone: isPatient ? '' : clean(get('phone'), PHONE_MAX),
    language: get('language') === 'Spanish' ? 'Spanish' : 'English',
    from: sanitizeEntryPoint(get('from')),
    tenant: sanitizeTenant(get('tenant')),
    audience,
  };
}
```
Confirm `FIELD_LIMITS` is exported from `@/lib/validation/schemas` (SupportForm.tsx already imports it from there) and has `firstName`, `lastName`, `email` keys.

- [ ] **Step 5: Run.** `npx vitest run src/lib/support/params.test.ts` — PASS.

- [ ] **Step 6: Commit** (`feat(support): parse and sanitize support form URL params`).

---

## Task 6: Website API route forwards the new fields

**Files:**
- Modify: `cofabri-website-support-intake/src/app/api/support/route.ts`

**Interfaces:**
- Consumes: `sanitizeEntryPoint`, `sanitizeAudience`, `sanitizeTenant` from Task 5.
- Produces: form fields `entryPoint`, `tenantName`, `audience` accepted from the client; cofabri-api fields `entry_point`, `tenant_name`, `audience`, `phone`.

- [ ] **Step 1:** Add the import at the top of `route.ts`:

```ts
import { sanitizeAudience, sanitizeEntryPoint, sanitizeTenant } from '@/lib/support/params';
```

- [ ] **Step 2:** After the line `const turnstileToken = formData.get('turnstileToken');` add:

```ts
    // Re-sanitized server-side: the client is never trusted. Unknown entry
    // points collapse to 'other'; free text is never stored.
    const entryPoint = sanitizeEntryPoint(formData.get('entryPoint'));
    const audience = sanitizeAudience(formData.get('audience'));
    const tenantName = sanitizeTenant(formData.get('tenantName'));
```

- [ ] **Step 3:** Replace `const screenshots = formData.getAll('screenshots') as File[];` with:

```ts
    // Patient tickets never carry screenshots (an image can contain PHI).
    const screenshots = audience === 'patient' ? [] : (formData.getAll('screenshots') as File[]);
```

- [ ] **Step 4:** After the `apiFormData.set('description', ...)` line add:

```ts
    apiFormData.set('entry_point', entryPoint);
    apiFormData.set('audience', audience);
    if (tenantName) apiFormData.set('tenant_name', tenantName);
    if (normalizedPhone) apiFormData.set('phone', normalizedPhone);
```

- [ ] **Step 5:** Update the old comment about phone (the block starting `// Note: phone is intentionally not required here`) to read: `// Phone is optional. When given it must be valid, and it is forwarded and stored (support_cases.phone).`

- [ ] **Step 6:** `npx tsc --noEmit && npm run lint` — expected pass. Commit (`feat(support): forward entry point, tenant, audience and phone to cofabri-api`).

---

## Task 7: Website form changes

**Files:**
- Modify: `cofabri-website-support-intake/src/components/marketing/SupportForm.tsx`

**Interfaces:** consumes `parseSupportParams` and `SupportParams` from Task 5.

Each edit is anchored on existing code in the file. Work top to bottom.

- [ ] **Step 1: Imports.** Add `useMemo` to the existing `react` import (it already imports `useState`, `useEffect`, `useCallback`). Add:

```tsx
import { parseSupportParams } from '@/lib/support/params';
```

- [ ] **Step 2: State.** Directly under `const searchParams = useSearchParams();` add:

```tsx
  const params = useMemo(() => parseSupportParams(searchParams), [searchParams]);
  const isPatient = params.audience === 'patient';
  const identityPrefilled = Boolean(params.firstName && params.lastName && params.email);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [changingApp, setChangingApp] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
```

- [ ] **Step 3: Default contact method.** In all three places that contain `preferredContactMethod: 'any',` (initial state, the post-success reset, and `clearForm`) change `'any'` to `'email'`.

- [ ] **Step 4: App selection from params.** In the "Update selectedApps" effect, replace the lines that compute `urlApp` and `appNames` with `const appNames = params.appNames;` and change that effect's dependency array from `[isLoadingApps, apps, searchParams, urlAppsInitialized]` to `[isLoadingApps, apps, params, urlAppsInitialized]`.

- [ ] **Step 5: Prefill effect.** Replace the whole "Pre-fill form with URL parameters" effect (from `useEffect(() => {` with `const firstName = searchParams?.get('firstName')` through its `}, [searchParams]);`) with:

```tsx
  // Pre-fill form with URL parameters (already sanitized; patients get no
  // prefilled identity).
  useEffect(() => {
    // Format phone as the user would type it. Runs before the user could
    // have picked a different country, so it uses the default country.
    const phone = params.phone ? formatPhoneAsYouType(params.phone, '', DEFAULT_COUNTRY) : '';

    setFormData(prev => ({
      ...prev,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone,
      languagePreference: params.language,
      subject: params.subject,
      // A staff member's tenant is their organization; for patients the
      // tenant is a clinic, which is not the patient's company.
      companyOrganization: !isPatient && params.tenant ? params.tenant : prev.companyOrganization,
    }));
  }, [params, isPatient]);
```

- [ ] **Step 6: Validation.** In `validateForm`, replace the block

```tsx
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone, phoneCountry)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
```
with:

```tsx
    // Phone is optional, but a Phone contact preference needs one.
    if (formData.phone.trim()) {
      if (!isValidPhone(formData.phone, phoneCountry)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    } else if (formData.preferredContactMethod === 'phone') {
      newErrors.phone = 'Add a phone number, or choose a different contact method';
    }
    // The fields live under More Options; open it so the error is visible.
    if (newErrors.phone || newErrors.preferredContactMethod) {
      setShowMoreOptions(true);
    }
```

- [ ] **Step 7: Submit payload.** In `handleSubmit`, after `formDataToSend.append('turnstileToken', turnstileToken);` add:

```tsx
      formDataToSend.append('entryPoint', params.from);
      formDataToSend.append('tenantName', params.tenant);
      formDataToSend.append('audience', params.audience);
```

- [ ] **Step 8: Success copy.** Change the success paragraph text to: `Thank you for contacting us. We've received your support request and will reply within one business day. You'll get a confirmation email with your ticket number shortly.` (keep the existing `&apos;` escaping style for the apostrophe).

- [ ] **Step 9: Patient banner.** Directly under `<h2 className="text-2xl font-semibold mb-8">Submit a Support Ticket</h2>` (inside the idle-state fragment) add:

```tsx
          {isPatient && (
            <div role="note" className="mb-6 rounded-lg border border-border bg-muted p-4 text-sm">
              <p className="font-medium text-foreground">Questions about your care, orders or prescriptions?</p>
              <p className="mt-1 text-muted-foreground">
                Please contact {params.tenant || 'your clinic'} directly. This form is only for problems with the app itself.
              </p>
            </div>
          )}
```

- [ ] **Step 10: Contact section restructure.** Inside the `Contact Information` `<div className="space-y-6">`, after its `<h3>`, the content should become this skeleton (move existing blocks, do not rewrite them):

```tsx
          {identityPrefilled && !editingIdentity ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-foreground">
                Submitting as <span className="font-medium">{formData.firstName} {formData.lastName}</span> ({formData.email})
              </p>
              <button type="button" onClick={() => setEditingIdentity(true)} className="text-sm text-primary hover:underline">
                Change
              </button>
            </div>
          ) : (
            <>
              {/* EXISTING first/last name grid, unchanged */}
              {/* EXISTING Email field block, moved out of the email/phone grid so it renders on its own */}
            </>
          )}

          <button
            type="button"
            onClick={() => setShowMoreOptions((open) => !open)}
            aria-expanded={showMoreOptions}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showMoreOptions ? 'Fewer Options' : 'More Options'}
          </button>

          {showMoreOptions && (
            <div className="space-y-6">
              {/* EXISTING Language Preference block, unchanged */}
              {/* EXISTING Company/Organization block, unchanged */}
              {/* EXISTING Preferred Contact Method block, unchanged except the label loses the " *" */}
              {/* EXISTING Phone field block (the second column of the old email/phone grid) */}
            </div>
          )}
```
Phone block specifics: change its `<label>` text from `Phone Number *` to `Phone Number (Optional)` and remove the `required` prop from `<PhoneField ... />`. After moving Email out, delete the now-empty two-column grid wrapper.

- [ ] **Step 11: Locked app.** In the Ticket Information section, replace the `MultiSelectDropdown` + "Selected: N applications" block with:

```tsx
            {params.appNames.length > 0 && selectedApps.length > 0 && !changingApp ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
                <p className="text-sm text-foreground">
                  {appOptions.filter((o) => selectedApps.includes(o.value)).map((o) => o.label).join(', ')}
                </p>
                <button type="button" onClick={() => setChangingApp(true)} className="text-sm text-primary hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <>
                {/* EXISTING MultiSelectDropdown and "Selected: N application(s)" block, unchanged */}
              </>
            )}
```

- [ ] **Step 12: PHI notice.** Directly after the closing `</div>` of the description character-counter row (`<div className="flex justify-between items-center mt-1">`), add:

```tsx
            <p className="mt-2 text-xs text-muted-foreground">
              Please don&apos;t include health information. We can help without it.
            </p>
```

- [ ] **Step 13: Hide screenshots for patients.** Wrap the whole Screenshots `<div>` (the one beginning `<label htmlFor="screenshots"`) in `{!isPatient && ( ... )}`.

- [ ] **Step 14: Gates.** `npm run lint && npx tsc --noEmit` — expected pass. Commit (`feat(support): shorter form, prefilled identity, patient mode, PHI notice`).

---

## Task 8: Website e2e tests

**Files:**
- Create: `cofabri-website-support-intake/tests/e2e/support-form.spec.ts`

Uses Playwright request interception, so no stub API changes. The contact form spec shows the Turnstile wait pattern.

- [ ] **Step 1: Write the tests**

```ts
import { test, expect, type Page } from '@playwright/test';

async function mockApps(page: Page) {
  await page.route('**/api/apps', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'medoura', name: 'Medoura', status: 'Active' }]),
    }),
  );
}

async function waitForTurnstile(page: Page) {
  await page.waitForFunction(
    () => Boolean(document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value),
    { timeout: 30_000 },
  );
}

test('app link prefills identity, collapses it, and sends the entry point', async ({ page }) => {
  await mockApps(page);
  let posted = '';
  await page.route('**/api/support', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/support?app=Medoura&firstName=Jane&lastName=Doe&email=jane%40example.com&from=help-menu&tenant=Acme');
  await expect(page.getByText('Submitting as')).toBeVisible();
  await expect(page.getByLabel('First Name *')).toHaveCount(0);

  await page.getByLabel('Description *').fill('Automated check of the prefilled flow.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  expect(posted).toContain('help-menu');
  expect(posted).toContain('Acme');
  expect(posted).toContain('jane@example.com');
});

test('patient mode shows the clinic banner, no screenshots, and ignores identity params', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support?app=Medoura&audience=patient&tenant=Acme%20Clinic&firstName=Jane&email=jane%40example.com');

  await expect(page.getByText('Questions about your care, orders or prescriptions?')).toBeVisible();
  await expect(page.getByText('Acme Clinic')).toBeVisible();
  await expect(page.getByLabel('Screenshots')).toHaveCount(0);
  await expect(page.getByLabel('First Name *')).toHaveValue('');
  await expect(page.getByLabel('Email *')).toHaveValue('');
});

test('direct visitor can submit without a phone number', async ({ page }) => {
  await mockApps(page);
  let posted = '';
  await page.route('**/api/support', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/support');
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('No phone number on purpose.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  expect(posted).toContain('website');
});

test('choosing Phone as the contact method without a number shows an error', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('Phone preference check.');

  await page.getByRole('button', { name: 'More Options' }).click();
  await page.getByText('Phone', { exact: true }).first().click();
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Add a phone number, or choose a different contact method')).toBeVisible();
});
```

- [ ] **Step 2: Run.** `npx playwright install --with-deps chromium webkit` (first time only), then `npm run test:e2e -- tests/e2e/support-form.spec.ts`. Expected: 4 passed. If a locator misses (the page's exact labels may differ slightly), fix the locator, not the product code.

- [ ] **Step 3: Full website CI gates.** Run exactly: `npm ci && npm run lint && npx tsc --noEmit && npm run build && npm run test && npm run test:e2e`. Expected: all pass.

- [ ] **Step 4: Commit** (`test(support): e2e coverage for prefill, patient mode and optional phone`).

---

## Task 9: Medoura links

**Files (all in `CoFabri Medical/medoura`, worktree `feat/support-intake-v1`):**
- Modify: `lib/support-urls.ts`, `lib/support-urls.test.ts`
- Modify: `app/[locale]/staff/settings/page.tsx` (lines ~21, 969, 972), `app/[locale]/staff/help/page.tsx` (lines ~17, 124)
- Modify: `app/global-error.tsx`, `lib/observability/error-toast.ts`
- Check: `components/support/SupportDialog.tsx`, `FeatureRequestDialog.tsx`, `components/ui/footer-column.tsx`, `components/staff/QuickActionsHub.tsx`

**Interfaces:**
- Produces from `lib/support-urls.ts`:
  - `type SupportEntryPoint`
  - `SUPPORT_URL` (`from=help-menu`), `FEATURE_REQUEST_URL` (`from=help-menu`, `subject=feature`)
  - `getStaffSupportUrl(subject: "support" | "feature", from: SupportEntryPoint): string`
  - `getSupportUrl(tenantName: string, subject: "support" | "feature", from?: SupportEntryPoint): string` (patient audience; default `from` = `"patient-account"`)

- [ ] **Step 1: Worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/CoFabri Medical/medoura"
git fetch origin && git worktree add ../medoura-support-intake -b feat/support-intake-v1 origin/main
cd ../medoura-support-intake && pnpm install --frozen-lockfile
```

- [ ] **Step 2: Rewrite the tests first** in `lib/support-urls.test.ts` (replace the whole file):

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getSupportUrl, getStaffSupportUrl, SUPPORT_URL, FEATURE_REQUEST_URL } from "./support-urls";

test("getSupportUrl tags a patient support link with tenant, audience and entry point", () => {
  assert.equal(
    getSupportUrl("MANÜ Telehealth", "support"),
    "https://cofabri.com/support?app=Medoura&subject=support&tenant=MAN%C3%9C%20Telehealth&audience=patient&from=patient-account",
  );
});

test("getSupportUrl accepts a custom entry point", () => {
  assert.equal(
    getSupportUrl("Acme Clinic", "feature", "error-page"),
    "https://cofabri.com/support?app=Medoura&subject=feature&tenant=Acme%20Clinic&audience=patient&from=error-page",
  );
});

test("getSupportUrl URL-encodes special characters in the tenant name", () => {
  assert.ok(getSupportUrl("Tenant & Co / Health", "support").includes(`tenant=${encodeURIComponent("Tenant & Co / Health")}`));
});

test("getStaffSupportUrl has no audience or tenant and carries the entry point", () => {
  assert.equal(getStaffSupportUrl("support", "settings"), "https://cofabri.com/support?app=Medoura&subject=support&from=settings");
  assert.equal(getStaffSupportUrl("feature", "help-center"), "https://cofabri.com/support?app=Medoura&subject=feature&from=help-center");
});

test("legacy constants carry the help-menu entry point and no referrer", () => {
  assert.equal(SUPPORT_URL, "https://cofabri.com/support?app=Medoura&from=help-menu");
  assert.equal(FEATURE_REQUEST_URL, "https://cofabri.com/support?app=Medoura&subject=feature&from=help-menu");
});
```

- [ ] **Step 3: Confirm failure.** Look in `package.json` for how `lib/*.test.ts` run (`pnpm test`); run `pnpm test` (or the single file with `node --test --experimental-strip-types lib/support-urls.test.ts` if that is how the repo runs it). Expected: FAIL.

- [ ] **Step 4: Implement** `lib/support-urls.ts` (replace the file):

```ts
// Shared CoFabri support-ticket links. The form at cofabri.com/support
// understands: app, subject (support|feature), tenant, audience
// (staff|patient), and from (the entry point, so CoFabri can see which
// part of the app drives tickets).
export type SupportEntryPoint =
  | "help-menu"
  | "error-page"
  | "settings"
  | "patient-account"
  | "help-center"
  | "landing"
  | "other";

const BASE = "https://cofabri.com/support?app=Medoura";

/** Staff-facing links default to the help menu entry point. */
export const SUPPORT_URL = `${BASE}&from=help-menu`;
export const FEATURE_REQUEST_URL = `${BASE}&subject=feature&from=help-menu`;

export function getStaffSupportUrl(subject: "support" | "feature", from: SupportEntryPoint): string {
  return `${BASE}&subject=${subject}&from=${from}`;
}

/**
 * Patient-facing link, tagged with the tenant so CoFabri triage knows which
 * tenant an app-issue report is about. `audience=patient` makes the form
 * show the "contact your clinic" notice and hide screenshots (PHI).
 */
export function getSupportUrl(
  tenantName: string,
  subject: "support" | "feature",
  from: SupportEntryPoint = "patient-account",
): string {
  return `${BASE}&subject=${subject}&tenant=${encodeURIComponent(tenantName)}&audience=patient&from=${from}`;
}
```

- [ ] **Step 5: Re-tag call sites.**
  - `app/[locale]/staff/settings/page.tsx`: change the import to `import { getStaffSupportUrl } from "@/lib/support-urls";` and the two hrefs to `href={getStaffSupportUrl("feature", "settings")}` and `href={getStaffSupportUrl("support", "settings")}`.
  - `app/[locale]/staff/help/page.tsx`: change the import to `import { getStaffSupportUrl } from "@/lib/support-urls";` and `href={FEATURE_REQUEST_URL}` to `href={getStaffSupportUrl("feature", "help-center")}`.
  - `app/global-error.tsx`: change `getSupportUrl(supportInfo?.name ?? "unknown", "support")` to `getSupportUrl(supportInfo?.name ?? "unknown", "support", "error-page")`. (Unknown audience on an error page: use the patient-safe mode.)
  - `lib/observability/error-toast.ts`: change `const SUPPORT_URL = 'https://cofabri.com';` to `const SUPPORT_URL = 'https://cofabri.com/support?app=Medoura&from=error-page';` (this toast linked to the cofabri.com home page).
  - `QuickActionsHub.tsx` keeps `SUPPORT_URL` (`help-menu`). `SupportDialog.tsx`, `FeatureRequestDialog.tsx` and `footer-column.tsx` keep calling `getSupportUrl(branding.name, ...)` and so pick up `from=patient-account` and `audience=patient` automatically.

- [ ] **Step 6: Check the toast test.** `lib/observability/error-toast.test.ts` may assert the old URL. Run it and update any URL assertion to the new string.

- [ ] **Step 7: CI gates.** Read `.github/workflows/ci.yml`, then run `pnpm exec tsc --noEmit && pnpm test` (and anything else ci.yml lists). Expected: pass.

- [ ] **Step 8: Commit** (`feat(support): tag support links with entry point and audience`).

---

## Task 10: Praxis and RxBridge "Still Need Help?" card

Both Help Center components render the same shape. Add a card at the bottom of each, with links built by a tiny URL helper per repo.

**Files (Praxis, worktree `feat/support-intake-v1` in `CoFabri Medical/praxis`):**
- Create: `lib/help/support-urls.ts`, `lib/help/support-urls.test.ts`
- Modify: `components/help/HelpCenter.tsx`

**Files (RxBridge, `CoFabri Medical/rx-bridge`):** the same three, with `app=RxBridge`.

**Interfaces:**
- Produces: `getSupportUrl(subject: "support" | "feature"): string` returning `https://cofabri.com/support?app=<Praxis|RxBridge>&subject=<subject>&from=help-center`.

- [ ] **Step 1: Worktree (Praxis)**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/CoFabri Medical/praxis"
git fetch origin && git worktree add ../praxis-support-intake -b feat/support-intake-v1 origin/main
cd ../praxis-support-intake && pnpm install --frozen-lockfile
```
Check how tests are written in `lib/help/` (the repo runs `pnpm test`; match the runner used by neighbouring `*.test.ts` files such as `lib/help/*.test.ts`).

- [ ] **Step 2: Test first** `lib/help/support-urls.test.ts` (adapt the import line to the repo's runner if it is vitest rather than `node:test`):

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getSupportUrl } from "./support-urls";

test("support link names the app, subject and entry point", () => {
  assert.equal(getSupportUrl("support"), "https://cofabri.com/support?app=Praxis&subject=support&from=help-center");
  assert.equal(getSupportUrl("feature"), "https://cofabri.com/support?app=Praxis&subject=feature&from=help-center");
});
```
Run it. Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `lib/help/support-urls.ts`:

```ts
// The app name must match the apps table exactly (case-insensitive).
const SUPPORT_BASE = "https://cofabri.com/support?app=Praxis";

export function getSupportUrl(subject: "support" | "feature"): string {
  return `${SUPPORT_BASE}&subject=${subject}&from=help-center`;
}
```
Run the test. Expected: PASS.

- [ ] **Step 4: Add the card.** In `components/help/HelpCenter.tsx` add `import { getSupportUrl } from '@/lib/help/support-urls';`. In the final `return (...)`, immediately before the closing `</div>` of the outer wrapper (after the `sections.map(...)` block) add:

```tsx
      <div className="space-y-2 rounded-[9px] border p-4" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
          Still Need Help?
        </h2>
        <p className="text-sm" style={{ color: 'var(--fg2)' }}>
          Can&apos;t find your answer? Send us a message and a real person will reply within one business day. Please
          don&apos;t include patient or health information.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <a href={getSupportUrl('support')} target="_blank" rel="noopener noreferrer" className="underline">
            Contact Support
          </a>
          <a href={getSupportUrl('feature')} target="_blank" rel="noopener noreferrer" className="underline">
            Request a Feature
          </a>
        </div>
      </div>
```
The card must also show while articles are loading or have failed to load, since that is when someone needs it most: place it so it renders in the `state === 'error'` branch too (wrap the error `<p>` and the card in a fragment). Check how `state === 'loading'` renders; if it returns early, leave loading alone.

- [ ] **Step 5: Gates.** Read `.github/workflows/ci.yml`; run `pnpm run lint && npx tsc --noEmit && pnpm test && pnpm run build`. Expected: pass. Commit (`feat(help): add support and feature request links to the Help Center`).

- [ ] **Step 6: Repeat for RxBridge.** Same steps in `CoFabri Medical/rx-bridge` (worktree `../rx-bridge-support-intake`), with these differences: `SUPPORT_BASE` uses `app=RxBridge`; the test expects `app=RxBridge`; RxBridge's `HelpCenter.tsx` uses Tailwind classes (`cn(...)`, `text-neutral-400`, `dark:prose-invert`) instead of CSS-variable styles, so the card is:

```tsx
      <div className="space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Still Need Help?</h2>
        <p className="text-sm text-neutral-500">
          Can&apos;t find your answer? Send us a message and a real person will reply within one business day. Please
          don&apos;t include patient or health information.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <a href={getSupportUrl('support')} target="_blank" rel="noopener noreferrer" className="underline">
            Contact Support
          </a>
          <a href={getSupportUrl('feature')} target="_blank" rel="noopener noreferrer" className="underline">
            Request a Feature
          </a>
        </div>
      </div>
```
(RxBridge uses no semicolons; match that in the files you write.) CI gates: `pnpm run lint && pnpm exec tsc --noEmit && pnpm run test && pnpm run build`.

---

## Task 11: Gathr links

**Files (`gathr`, worktree `feat/support-intake-v1`):**
- Modify: `src/lib/support.ts`, its test (create `src/lib/support.test.ts` if none exists)
- Modify: `src/lib/sidebarNav.ts` (lines 142-143), `src/components/PublicFooter.tsx` (98, 105), `src/components/landing/LandingHeader.tsx` (53), `src/app/advertise/AdvertiseShell.tsx` (42), `src/components/landing/landing-data.ts` (527-528, hard-coded URLs)

**Interfaces:**
- Produces: `supportUrl(subject: "feature" | "support", from: SupportEntryPoint, leader?: LeaderContact): string`. Note `from` is inserted as the second parameter; existing `leader` callers must move to the third.

- [ ] **Step 1: Worktree**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/gathr"
git fetch origin && git worktree add ../gathr-support-intake -b feat/support-intake-v1 origin/main
cd ../gathr-support-intake && pnpm install --frozen-lockfile
```

- [ ] **Step 2: Test first.** Create or extend `src/lib/support.test.ts` (use the same runner as neighbouring tests, e.g. `src/lib/cofabri-billing.test.ts`; vitest style shown):

```ts
import { describe, expect, it } from "vitest";
import { supportUrl } from "./support";

describe("supportUrl", () => {
  it("adds the entry point", () => {
    expect(supportUrl("support", "help-menu")).toBe("https://cofabri.com/support?app=Gathr&subject=support&from=help-menu");
  });
  it("still prefills a signed-in leader", () => {
    const url = supportUrl("feature", "help-menu", { firstName: "Jane", lastName: "Doe", email: "jane@example.com" });
    expect(url).toContain("from=help-menu");
    expect(url).toContain("firstName=Jane");
    expect(url).toContain("email=jane%40example.com");
  });
});
```
Run it. Expected: FAIL.

- [ ] **Step 3: Implement.** In `src/lib/support.ts` add above `supportUrl`:

```ts
export type SupportEntryPoint = "help-menu" | "error-page" | "settings" | "help-center" | "landing" | "other";
```
Change the function to:

```ts
export function supportUrl(subject: "feature" | "support", from: SupportEntryPoint, leader?: LeaderContact): string {
  const params = new URLSearchParams({ app: "Gathr", subject, from });
```
(rest unchanged). Update the doc comment: replace "the Airtable record must read exactly "Gathr"" with "the apps table name must read exactly "Gathr"".

- [ ] **Step 4: Update callers.**
  - `sidebarNav.ts:142-143`: `supportUrl("feature", "help-menu")` and `supportUrl("support", "help-menu")`.
  - `PublicFooter.tsx:98,105`, `LandingHeader.tsx:53`, `AdvertiseShell.tsx:42`: `supportUrl("<subject>", "landing")`.
  - `landing-data.ts:527-528`: change the two hard-coded URLs to `https://cofabri.com/support?app=Gathr&subject=support&from=landing` and `...&subject=feature&from=landing`.
  - Run `grep -rn "supportUrl(" src` and confirm no call still passes a leader as the second argument.

- [ ] **Step 5: CI gates.** `pnpm run lint && npx tsc --noEmit && pnpm run test && pnpm run build`. Expected: pass. Commit (`feat(support): tag Gathr support links with an entry point`).

---

## Task 12: Baseline, rollout and verification

- [ ] **Step 1: Baseline before anything ships.** With the Supabase MCP, run and save the result in the PR description for the website change:

```sql
select coalesce(app_id, 'none') as app, count(*) as cases_90d
from public.support_cases
where type = 'customer_ticket' and created_at >= now() - interval '90 days'
group by 1 order by 2 desc;
```

- [ ] **Step 2: Merge and push in order, once per repo.** Task 1 migration is already live. Push and let CI finish for each, checking the run with `gh run list`/`gh run view`:
  1. cofabri-api (Tasks 3-4), then confirm it deployed.
  2. cofabri-core (Tasks 1-2).
  3. cofabri-website (Tasks 0, 5-8).
  4. The apps: Medoura, Praxis, RxBridge, Gathr (Tasks 9-11), one push each.
  Use the repo's normal merge path (PR or local merge to main), not a force push.

- [ ] **Step 3: Browser pass on production (Chrome).** For each case, submit a real test ticket with a recognizable subject, then confirm in Core (Dashboard, Support) that the case appears and the drawer shows Submission Details with the right values; also confirm the confirmation email arrived (subject Title Case, includes `CS-<number>`, no description text):
  - `https://cofabri.com/support` (direct): Entry Point Website, phone blank allowed.
  - `https://cofabri.com/support?app=Medoura&firstName=Jane&lastName=Doe&email=<a real inbox>&from=help-menu&tenant=Test`: identity collapsed, app locked, Entry Point Help Menu.
  - `https://cofabri.com/support?app=Medoura&audience=patient&tenant=Test%20Clinic&from=patient-account`: banner shown, no screenshots field, Audience Patient.
  - A Medoura staff Help page link, a Praxis and an RxBridge Help Center "Contact Support" link, and a Gathr sidebar "Get Help" link: each opens the form with the right app and entry point.
  Delete the test cases in Core afterwards.

- [ ] **Step 4: Check the Email Templates page.** In Core, Email Templates, confirm `support_request_received` appears under CoFabri and renders with the sample data.

- [ ] **Step 5: Record results.** Note the baseline numbers and the launch date in the spec's Measuring section, and save a project memory (`project_support_intake_v1.md`) with status and what remains (the roadmap: chatbot, email-to-ticket, and the rest).

---

## Self-Review

**Spec coverage:** Shorter form (Task 7: phone optional, collapsed identity, locked app, More Options). URL contract (Tasks 5-6). Patient mode (Tasks 5, 6, 7, 3 server-side). PHI notice (Task 7). Data changes (Tasks 1-3). Confirmation email (Task 4). Entry points per app (Tasks 9-11, with Task 0 correcting the spec). Measuring adoption (Task 12 baseline, Task 2 display). Error handling and testing (embedded per task, e2e in Task 8). Rollout order (Task 12).

**Placeholder scan:** The only deferred-by-reference items are the two "move existing block" instructions in Task 7 (Steps 10-11), anchored to named existing blocks in a 1,100-line component, and the runner-specific test import in Tasks 10-11, which the steps tell the engineer to match to neighbouring tests.

**Type consistency:** `entryPoint`/`tenantName`/`audience` (form fields, camelCase) in Tasks 6-7 map to `entry_point`/`tenant_name`/`audience` (API, snake_case) in Tasks 3 and 6. `SupportEntryPoint` values match `ENTRY_POINTS` in Task 5 and `SUPPORT_ENTRY_POINTS` in Task 3 (`website` appears in both lists; the apps never send it). `sendSupportRequestReceivedEmail` signature matches in Tasks 4 (definition, tests, wiring).
