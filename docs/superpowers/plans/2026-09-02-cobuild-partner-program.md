# Co-Build Partner Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce Co-Build — CoFabri's industry-partner program — as a first-class part of the site: a homepage section, a dedicated `/partners` page with a real case study, and a working "Propose a partnership" form backed by a new cofabri-api endpoint and Supabase table.

**Architecture:** Two repos. `cofabri-api` (Express + Supabase) gets a new table, a new `WebFormsService` method, and a new validated route, following the exact pattern already used by `/web/forms/contact` and `/web/forms/support`. `cofabri-website` (Next.js 16 App Router) gets a new shared wordmark component, a new form component modeled on the existing `ContactForm`, a new proxy API route modeled on `/api/contact`, a new `/partners` page, a new homepage section, and one new footer nav entry. Backend ships first so the frontend has something real to call.

**Tech Stack:** cofabri-api: Node/Express, `express-validator`, Supabase (`@supabase/supabase-js`), Jest + Supertest (both already configured and used by the existing `web-forms` route/service). cofabri-website: Next.js 16.1.7, React, TypeScript, Tailwind, `next/font/google`; no test runner configured (verification is `npm run build` + manual browser/curl checks, matching the sibling copy-pass plan).

**Spec:** `docs/superpowers/specs/2026-09-02-site-copy-and-cobuild-design.md` (Part 2)

## Global Constraints

- No revenue-split or equity percentages anywhere in public copy — describe the model conceptually ("the partner holds equity," no numbers).
- The original telehealth company that became Medoura's partner is never named. "Medoura" itself is a real, live, named app and may be named freely.
- "Co-Build" is the public-facing name for the program on the `/partners` page and the homepage section; "Partners" is the nav label (footer only, not the primary Navbar).
- The Medoura page/section quote is a draft pending the user's partner's approval — it must be clearly marked in code as unapproved, not presented as if already cleared.
- Both repos may have other uncommitted changes from concurrent sessions. Re-read any shared file (`Footer.tsx`, `src/app/page.tsx`, `HomeContent.tsx`) with Read immediately before editing it in this plan, rather than trusting the line numbers quoted here. Stage and commit only the exact files each task touches.
- cofabri-api commits and cofabri-website commits are separate `git` repositories — commit each task's changes in the repo it actually touches; never `git add` across repo boundaries.

---

## Backend (cofabri-api)

### Task 1: Supabase migration for `site_partnership_inquiries`

**Files:**
- Create: `supabase/migrations/20260902000000_partnership_inquiries.sql` (in cofabri-api; the most recent existing migration is `20260804120000_...`, so this timestamp sorts after it)

**Interfaces:**
- Produces: a `site_partnership_inquiries` table with columns `id, first_name, last_name, email, company_name, industry, phone, message, status, created_at` — Task 2's `submitPartnershipInquiry` inserts into this exact table/column set.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260902000000_partnership_inquiries.sql

-- site_partnership_inquiries: inbound leads from the /partners page's
-- "Propose a partnership" form (the Co-Build program) — an industry
-- operator proposing to co-build an app with CoFabri. Same shape as
-- site_contact_submissions/support_cases (see WebFormsService.js):
-- one row per submission, service-role-only access via RLS.
create table site_partnership_inquiries (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  company_name text,
  industry text not null,
  phone text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table site_partnership_inquiries enable row level security;
```

No explicit RLS policy is added — matching `plaid_items` and every other `site_*` form table in this repo, which rely on the service-role key (used by `WebFormsService`) bypassing RLS by default, with no anon/authenticated access granted.

- [ ] **Step 2: Apply the migration to the local/dev Supabase project**

Run: `supabase db push` (or this repo's equivalent migration-apply command — check `package.json` scripts for a `db:migrate`/`supabase:push` alias first and prefer that if one exists) against the project's development database, not production, unless the team's normal workflow pushes migrations straight to production. Confirm no errors.

- [ ] **Step 3: Verify the table exists**

Run: `supabase db diff` (or query `select * from site_partnership_inquiries limit 1;` via the Supabase SQL editor / `psql`) and confirm the table exists with the expected columns and zero rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260902000000_partnership_inquiries.sql
git commit -m "feat: add site_partnership_inquiries table for Co-Build inquiries"
```

---

### Task 2: `submitPartnershipInquiry` service method + tests

**Files:**
- Modify: `src/services/WebFormsService.js` (add one new method)
- Modify: `tests/services/WebFormsService.test.js` (add one new `describe` block; this file already exists with an identical pattern for `submitContact`/`submitSupportTicket`/`submitWaitlistSignup`)

**Interfaces:**
- Consumes: the `site_partnership_inquiries` table from Task 1.
- Produces: `WebFormsService.prototype.submitPartnershipInquiry({ first_name, last_name, email, company_name, industry, phone, message }): Promise<object>` — Task 3's route calls this exact method name with `req.body` passed through directly (same pattern as the existing `/contact` and `/support` routes).

- [ ] **Step 1: Write the failing test**

Append this `describe` block to the end of `tests/services/WebFormsService.test.js` (after the existing `describe('WebFormsService.submitWaitlistSignup', ...)` block):

```js
describe('WebFormsService.submitPartnershipInquiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COFABRI_SUPABASE_URL = 'https://example.supabase.co';
    process.env.COFABRI_SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('inserts into site_partnership_inquiries with all fields', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1', email: 'jane@example.com' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    const result = await service.submitPartnershipInquiry({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      company_name: 'Acme Health',
      industry: 'Telehealth',
      phone: '555-0100',
      message: 'We want to build a scheduling app for our clinics.',
    });

    expect(from).toHaveBeenCalledWith('site_partnership_inquiries');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        company_name: 'Acme Health',
        industry: 'Telehealth',
        phone: '555-0100',
        message: 'We want to build a scheduling app for our clinics.',
        status: 'new',
      }),
    ]);
    expect(result).toEqual({ id: '1', email: 'jane@example.com' });
  });

  it('defaults company_name and phone to null when omitted', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitPartnershipInquiry({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      industry: 'Telehealth',
      message: 'We want to build a scheduling app for our clinics.',
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ company_name: null, phone: null }),
    ]);
  });

  it('throws error when insert query fails', async () => {
    const select = jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();

    await expect(service.submitPartnershipInquiry({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      industry: 'Telehealth',
      message: 'We want to build a scheduling app for our clinics.',
    })).rejects.toThrow('Insert failed');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- WebFormsService.test.js`
Expected: FAIL — `TypeError: service.submitPartnershipInquiry is not a function`.

- [ ] **Step 3: Implement the method**

In `src/services/WebFormsService.js`, add this method to the `WebFormsService` class (after `submitWaitlistSignup`, before the closing `}` of the class):

```js
  async submitPartnershipInquiry({
    first_name, last_name, email, company_name, industry, phone, message,
  }) {
    const { data, error } = await this.supabase
      .from('site_partnership_inquiries')
      .insert([{
        first_name,
        last_name,
        email,
        company_name: company_name || null,
        industry,
        phone: phone || null,
        message,
        status: 'new',
      }])
      .select();
    if (error) throw error;
    return data[0];
  }
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- WebFormsService.test.js`
Expected: PASS, all tests in the file (including the pre-existing ones) still green.

- [ ] **Step 5: Commit**

```bash
git add src/services/WebFormsService.js tests/services/WebFormsService.test.js
git commit -m "feat: add submitPartnershipInquiry to WebFormsService"
```

---

### Task 3: `POST /web/forms/partnership` route + tests

**Files:**
- Modify: `src/routes/web-forms.js` (add one new route)
- Modify: `tests/routes/web-forms.test.js` (add one new `describe` block, mirroring the existing `POST /web/forms/contact` block's auth/validation/success tests)

**Interfaces:**
- Consumes: `service.submitPartnershipInquiry(req.body)` from Task 2 — `req.body` is passed through unvalidated-shape (same as `/contact` and `/support`), relying on the `express-validator` rules below to have already rejected anything missing required fields.
- Produces: `POST /web/forms/partnership`, called by `cofabri-website`'s `src/app/api/partners/route.ts` (Task 6) as `POST ${COFABRI_API_BASE_URL}/web/forms/partnership` with an `Authorization: Bearer ${COFABRI_API_KEY}` header (same as every other route in this file, via the existing `authenticateApiKey` middleware mounted in front of this whole router).

- [ ] **Step 1: Write the failing tests**

Append this `describe` block to the end of `tests/routes/web-forms.test.js`:

```js
describe('POST /web/forms/partnership', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.API_KEY_SECRET = 'test-secret';
  });

  it('rejects requests without API key (401)', async () => {
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        industry: 'Telehealth',
        message: 'We want to build a scheduling app for our clinics.',
      });

    expect(res.status).toBe(401);
  });

  it('inserts valid submission and returns 201', async () => {
    const WebFormsService = require('../../src/services/WebFormsService');
    WebFormsService.mockImplementation(() => ({
      submitPartnershipInquiry: jest.fn().mockResolvedValue({ id: '1', email: 'jane@example.com' }),
    }));

    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        company_name: 'Acme Health',
        industry: 'Telehealth',
        phone: '555-0100',
        message: 'We want to build a scheduling app for our clinics.',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: '1', email: 'jane@example.com' });
  });

  it('accepts a submission with no company_name or phone', async () => {
    const WebFormsService = require('../../src/services/WebFormsService');
    WebFormsService.mockImplementation(() => ({
      submitPartnershipInquiry: jest.fn().mockResolvedValue({ id: '1' }),
    }));

    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        industry: 'Telehealth',
        message: 'We want to build a scheduling app for our clinics.',
      });

    expect(res.status).toBe(201);
  });

  it('rejects submission missing industry (400)', async () => {
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        message: 'We want to build a scheduling app for our clinics.',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects submission missing message (400)', async () => {
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        industry: 'Telehealth',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects submission with invalid email format (400)', async () => {
    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/partnership')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'not-an-email',
        industry: 'Telehealth',
        message: 'We want to build a scheduling app for our clinics.',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- web-forms.test.js`
Expected: the new `POST /web/forms/partnership` tests fail with 404 (no such route yet); all pre-existing tests in the file still pass.

- [ ] **Step 3: Implement the route**

In `src/routes/web-forms.js`, add this route (after the existing `/waitlist` route, before `module.exports = router;`):

```js
router.post(
  '/partnership',
  [
    body('first_name').notEmpty().withMessage('first_name is required'),
    body('last_name').notEmpty().withMessage('last_name is required'),
    body('email').isEmail().withMessage('email must be a valid email'),
    body('industry').notEmpty().withMessage('industry is required'),
    body('message').notEmpty().withMessage('message is required'),
    body('company_name').optional(),
    body('phone').optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const inquiry = await service.submitPartnershipInquiry(req.body);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error('POST /web/forms/partnership error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit partnership inquiry' });
    }
  }
);
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- web-forms.test.js`
Expected: PASS, including every pre-existing test in the file.

- [ ] **Step 5: Commit**

```bash
git add src/routes/web-forms.js tests/routes/web-forms.test.js
git commit -m "feat: add POST /web/forms/partnership route"
```

---

## Frontend (cofabri-website)

### Task 4: `CoBuildWordmark` shared component

**Files:**
- Create: `src/components/marketing/CoBuildWordmark.tsx`

**Interfaces:**
- Produces: `export default function CoBuildWordmark({ className }: { className?: string })` — a `<span>` rendering "Co" in the UnifrakturMaguntia display font followed by plain "-Build" text. Consumed by Task 7 (`/partners` hero) and Task 8 (homepage section heading).

UnifrakturMaguntia is confirmed available in Google Fonts' catalog (https://fonts.google.com/specimen/UnifrakturMaguntia) — `next/font/google` mirrors that catalog directly, so it loads via the standard `next/font/google` API, self-hosted at build time (no runtime request to Google, no CSP exception needed). This also matches the existing brand mark: `public/images/placeholder.jpg` (the site's real OG share image) already renders "Co" in this exact blackletter style next to a plain bold "Fabri" — confirms this is consistent with established branding, not a one-off choice.

- [ ] **Step 1: Write the component**

Write `src/components/marketing/CoBuildWordmark.tsx`:

```tsx
import { UnifrakturMaguntia } from 'next/font/google';

const unifraktur = UnifrakturMaguntia({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export default function CoBuildWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <span className={unifraktur.className}>Co</span>
      -Build
    </span>
  );
}
```

The `fallback` array is the safety net the user asked for: if the self-hosted font file fails to load client-side for any reason, the browser falls through to `Georgia` / `Times New Roman` / generic `serif` instead of showing invisible or broken text.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds. If it fails with an error naming `UnifrakturMaguntia` (e.g. "has no exported member"), the font isn't in this installed Next.js version's (16.1.7) generated font list despite being in Google's catalog — stop and flag this to the user rather than guessing a workaround, since it would mean the confirmed assumption this step rests on was wrong.

- [ ] **Step 3: Visual verification**

Create a temporary throwaway usage (e.g. drop `<CoBuildWordmark />` into any page temporarily, or wait until Task 7/8 wire it in for real — either is fine) and confirm in the browser that "Co" renders in the same blackletter/gothic style visible in `public/images/placeholder.jpg`, distinct from "-Build", in both light and dark mode. Then, with browser devtools' network conditions set to block the font file request, reload and confirm "Co" falls back to a plain serif font rather than rendering as invisible text or a broken glyph.

- [ ] **Step 4: Commit**

```bash
git add -- src/components/marketing/CoBuildWordmark.tsx
git commit -m "feat: add CoBuildWordmark component for Co-Build branding"
```

---

### Task 5: `PartnerForm` component

**Files:**
- Create: `src/components/marketing/PartnerForm.tsx`

**Interfaces:**
- Consumes: `Turnstile` from `./Turnstile` (existing component, props: `siteKey`, `onVerify`, `onError`, `onExpire`, `theme`, `size`, `className` — same as used in `ContactForm.tsx`).
- Produces: `export default function PartnerForm()`. Submits to `POST /api/partners` (Task 6) with JSON body `{ firstName, lastName, email, companyName, industry, phone, message, turnstileToken }`.

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useState, useCallback } from 'react';
import Turnstile from './Turnstile';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  industry: string;
  phone: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  industry?: string;
  message?: string;
  turnstile?: string;
}

const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const COMPANY_NAME_MAX_LENGTH = 100;
const INDUSTRY_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 30;
const MESSAGE_MAX_LENGTH = 2000;

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  companyName: '',
  industry: '',
  phone: '',
  message: '',
};

export default function PartnerForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState<string>('');

  const maxLengths: Record<keyof FormData, number> = {
    firstName: FIRST_NAME_MAX_LENGTH,
    lastName: LAST_NAME_MAX_LENGTH,
    email: EMAIL_MAX_LENGTH,
    companyName: COMPANY_NAME_MAX_LENGTH,
    industry: INDUSTRY_MAX_LENGTH,
    phone: PHONE_MAX_LENGTH,
    message: MESSAGE_MAX_LENGTH,
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.industry.trim()) newErrors.industry = 'Industry is required';

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    if (!turnstileToken) {
      newErrors.turnstile = 'Please complete the security verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof FormData; value: string };
    const max = maxLengths[name];
    const processedValue = max && value.length > max ? value.slice(0, max) : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const clearForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setTurnstileToken('');
    setTurnstileError('');
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError('');
    setErrors((prev) => ({ ...prev, turnstile: undefined }));
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileError('Security verification failed. Please try again.');
    setTurnstileToken('');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileError('Security verification expired. Please complete it again.');
    setTurnstileToken('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        clearForm();
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.error || 'Failed to submit form. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTurnstileSiteKey = () => {
    if (process.env.NODE_ENV === 'development') {
      return '1x00000000000000000000AA';
    }
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  };

  if (submitStatus === 'success') {
    return (
      <div className="rounded-2xl border border-border p-9 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Got it.</h2>
        <p className="mt-3 text-muted-foreground">
          We&apos;ll read every word of this ourselves and get back to you.
        </p>
        <button
          type="button"
          onClick={() => setSubmitStatus('idle')}
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-9">
      <h2 className="text-2xl font-semibold text-foreground">Propose a partnership</h2>
      <p className="mt-2 text-muted-foreground">
        Tell us about your industry and what you&apos;d want to build. We read every one of these ourselves.
      </p>

      {submitStatus === 'error' && (
        <div className="mt-6 rounded-lg border border-danger bg-danger/10 p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-foreground">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              maxLength={FIRST_NAME_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.firstName ? 'border-danger' : 'border-border-strong'}`}
            />
            {errors.firstName && <p className="mt-1 text-sm text-danger">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-foreground">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              maxLength={LAST_NAME_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.lastName ? 'border-danger' : 'border-border-strong'}`}
            />
            {errors.lastName && <p className="mt-1 text-sm text-danger">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              maxLength={EMAIL_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.email ? 'border-danger' : 'border-border-strong'}`}
            />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">Phone (optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength={PHONE_MAX_LENGTH}
              className="w-full rounded-lg border border-border-strong px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-foreground">Company (optional)</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              maxLength={COMPANY_NAME_MAX_LENGTH}
              className="w-full rounded-lg border border-border-strong px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label htmlFor="industry" className="mb-2 block text-sm font-medium text-foreground">Industry *</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              maxLength={INDUSTRY_MAX_LENGTH}
              placeholder="e.g. Veterinary clinics"
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.industry ? 'border-danger' : 'border-border-strong'}`}
            />
            {errors.industry && <p className="mt-1 text-sm text-danger">{errors.industry}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">Tell us about your business and the idea *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={6}
            maxLength={MESSAGE_MAX_LENGTH}
            className={`w-full resize-none rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.message ? 'border-danger' : 'border-border-strong'}`}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.message && <p className="text-sm text-danger">{errors.message}</p>}
            <p className="ml-auto text-sm text-muted-foreground">{formData.message.length}/{MESSAGE_MAX_LENGTH}</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Security Verification *</label>
          {getTurnstileSiteKey() ? (
            <Turnstile
              key="partner-form-turnstile"
              siteKey={getTurnstileSiteKey()!}
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
              theme="light"
              size="normal"
              className="flex justify-start"
            />
          ) : (
            <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
              Security verification is not configured. Please contact the administrator.
            </div>
          )}
          {(errors.turnstile || turnstileError) && (
            <p className="mt-1 text-sm text-danger">{errors.turnstile || turnstileError}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button type="button" onClick={clearForm} className="text-sm text-muted-foreground hover:text-foreground">
            Clear form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds. (This component isn't imported anywhere yet — Task 7 wires it in — so this step only confirms it type-checks in isolation.)

- [ ] **Step 3: Commit**

```bash
git add -- src/components/marketing/PartnerForm.tsx
git commit -m "feat: add PartnerForm component for Co-Build inquiries"
```

---

### Task 6: `src/app/api/partners/route.ts`

**Files:**
- Create: `src/app/api/partners/route.ts`

**Interfaces:**
- Consumes: `PartnerForm`'s POST body (Task 5): `{ firstName, lastName, email, companyName, industry, phone, message, turnstileToken }`. Requires `process.env.COFABRI_API_BASE_URL` and `process.env.COFABRI_API_KEY` (already set in `.env.local`, same variables `api/contact/route.ts` uses) and, in production, `process.env.TURNSTILE_SECRET_KEY`.
- Produces: `POST /web/forms/partnership` on cofabri-api (Task 3), with body `{ first_name, last_name, email, company_name, industry, phone, message }`.

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server';

const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const INDUSTRY_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 2000;

const getTurnstileSecretKey = () => {
  if (process.env.NODE_ENV === 'development') {
    return '1x0000000000000000000000000000000AA';
  }
  return process.env.TURNSTILE_SECRET_KEY;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, companyName, industry, phone, message, turnstileToken } = body;

    if (!firstName || !lastName || !email || !industry || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (firstName.trim().length > FIRST_NAME_MAX_LENGTH || lastName.trim().length > LAST_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 });
    }
    if (email.trim().length > EMAIL_MAX_LENGTH) {
      return NextResponse.json({ error: `Email must be ${EMAIL_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (industry.trim().length > INDUSTRY_MAX_LENGTH) {
      return NextResponse.json({ error: `Industry must be ${INDUSTRY_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (message.trim().length < 10 || message.trim().length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json({ error: `Message must be between 10 and ${MESSAGE_MAX_LENGTH} characters` }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Security verification required' }, { status: 400 });
    }

    if (turnstileToken !== 'development-mode') {
      const TURNSTILE_SECRET_KEY = getTurnstileSecretKey();
      if (!TURNSTILE_SECRET_KEY) {
        console.error('Turnstile secret key not configured');
        return NextResponse.json({ error: 'Security verification service unavailable' }, { status: 503 });
      }

      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        }),
      });

      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        console.error('Turnstile verification failed:', turnstileResult);
        return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
      }
    }

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      console.error('cofabri-api credentials not configured');
      return NextResponse.json({ error: 'Partnership form service temporarily unavailable' }, { status: 503 });
    }

    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/partnership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        company_name: companyName || undefined,
        industry,
        phone: phone || undefined,
        message,
      }),
    });

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      console.error('cofabri-api partnership submission failed:', apiRes.status, errorBody);
      return NextResponse.json({ error: 'Failed to save partnership inquiry. Please try again later.' }, { status: 502 });
    }

    const result = await apiRes.json();
    console.log('Partnership inquiry saved via cofabri-api:', {
      recordId: result.id,
      firstName,
      lastName,
      email,
      industry,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Partnership inquiry submitted successfully', recordId: result.id }, { status: 200 });
  } catch (error) {
    console.error('Error processing partnership inquiry:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Manual verification (development Turnstile bypass)**

With the dev server running (`npm run dev`), submit:

```bash
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","industry":"Telehealth","message":"We would like to build a scheduling app for our clinics.","turnstileToken":"development-mode"}'
```

Expected: `200` with `{"message":"Partnership inquiry submitted successfully","recordId":"..."}` — this requires Task 3's backend route to already be deployed/reachable at `COFABRI_API_BASE_URL`, since this route proxies to it directly. If cofabri-api's new endpoint isn't deployed yet, this will fail at the `apiRes.ok` check with a 502 — that's expected until Task 3 ships, not a bug in this route.

- [ ] **Step 4: Commit**

```bash
git add -- src/app/api/partners/route.ts
git commit -m "feat: add /api/partners route proxying to cofabri-api"
```

---

### Task 7: `/partners` page

**Files:**
- Create: `src/app/partners/page.tsx`
- Create: `src/components/marketing/PartnersPageContent.tsx`
- Modify: `src/components/marketing/PageHero.tsx` (widen the `title` prop type from `string` to `React.ReactNode` so it can render `CoBuildWordmark` alongside plain text)

**Interfaces:**
- Consumes: `PageHero` (widened in Step 1), `Breadcrumbs`, `CoBuildWordmark` (Task 4), `PartnerForm` (Task 5).
- Produces: the `/partners` route, linked from Task 8 (homepage section) and Task 9 (footer nav).

- [ ] **Step 1: Widen `PageHero`'s `title` prop**

In `src/components/marketing/PageHero.tsx`, change:

```tsx
interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}
```

to:

```tsx
interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}
```

Nothing else in this file changes — every existing caller already passes a plain string, which is a valid `React.ReactNode`, so this is a strictly additive, non-breaking type change.

- [ ] **Step 2: Write the page shell**

Create `src/app/partners/page.tsx`, modeled directly on `src/app/contact/page.tsx`:

```tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import PartnersPageContent from '@/components/marketing/PartnersPageContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Co-Build',
  description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
  keywords: ['partnership', 'co-build', 'industry partner', 'equity partnership'],
  alternates: {
    canonical: '/partners',
  },
  openGraph: {
    title: 'Co-Build | CoFabri',
    description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
    url: 'https://cofabri.com/partners',
  },
  twitter: {
    title: 'Co-Build | CoFabri',
    description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
  },
};

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <PartnersPageContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: Write the page content**

Create `src/components/marketing/PartnersPageContent.tsx`:

```tsx
import Breadcrumbs from './Breadcrumbs';
import PageHero from './PageHero';
import CoBuildWordmark from './CoBuildWordmark';
import PartnerForm from './PartnerForm';

const STEPS = [
  {
    title: 'You know the industry.',
    body: "You've spent years in it — you know the workflow, the customers, and exactly where the tools available today fall short.",
  },
  {
    title: 'We build the product.',
    body: "Our team designs, builds, and maintains the software. You're not hiring a dev shop — you're getting a technical partner for this one product.",
  },
  {
    title: 'You keep a stake.',
    body: "This isn't a one-time contract. You hold equity in what we build together, and you're the one selling it into an industry you already know.",
  },
];

export default function PartnersPageContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Co-Build', href: '/partners' }]} />
      </div>

      <PageHero
        eyebrow="Co-Build"
        title={<><CoBuildWordmark /> something worth owning.</>}
        subtitle="Bring the industry expertise and the customers. We bring the engineering. You keep a stake in what we build together."
      />

      <div className="mt-16 border-t border-border">
        {STEPS.map((step, i) => (
          <div key={step.title} className="grid grid-cols-1 gap-3 border-b border-border py-8 sm:grid-cols-[80px_1fr]">
            <span className="font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="m-0 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 max-w-[640px] text-base leading-[1.6] text-ink-muted">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">One example</div>
        <h2 className="m-0 max-w-[720px] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[34px]">
          An established telehealth provider needed more than software.
        </h2>
        <p className="mt-5 max-w-[720px] text-lg leading-[1.6] text-ink-muted">
          Existing telehealth platforms were expensive, locked customers in, and only handled the
          clinical side — not the sales and marketing a growing telehealth business actually
          needs. We partnered with an established telehealth provider to build{' '}
          <strong className="font-semibold text-foreground">Medoura</strong>: a platform that runs
          both sides of the business. They brought years in the industry, existing patients, and
          a professional network to bring in early customers. Today Medoura is live, selling, and
          the partner holds a real stake in the company.
        </p>

        {/* DRAFT QUOTE — needs partner approval before publishing, see spec Open Items in
            docs/superpowers/specs/2026-09-02-site-copy-and-cobuild-design.md */}
        <blockquote className="mt-8 max-w-[640px] border-l-2 border-primary pl-6 text-lg italic leading-[1.6] text-foreground">
          &ldquo;We&apos;d tried to explain what telehealth actually needs to three different dev
          shops before this. CoFabri was the first team that built the sales side and the
          clinical side like they mattered equally.&rdquo;
          <footer className="mt-3 text-sm not-italic text-muted-foreground">— Medoura partner</footer>
        </blockquote>
      </div>

      <div className="mt-24">
        <PartnerForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds — confirms `PageHero`'s widened `title` type accepts the `<><CoBuildWordmark /> ...</>` fragment.

- [ ] **Step 5: Visual verification**

Load `/partners` in both light and dark mode and on a 390px viewport. Confirm: the hero's "Co" renders in the wordmark font, the three steps render as a numbered list, the case study paragraph and quote block are legible, and the form at the bottom matches the visual style of `ContactForm`/`SupportForm` elsewhere on the site. Confirm every other page that calls `PageHero` with a plain string `title` (Apps, Roadmaps, Knowledge base, Support, Contact, Legal) still renders identically — the type widening in Step 1 must not change their output.

- [ ] **Step 6: Commit**

```bash
git add -- src/app/partners/page.tsx src/components/marketing/PartnersPageContent.tsx src/components/marketing/PageHero.tsx
git commit -m "feat: add /partners Co-Build page"
```

---

### Task 8: Homepage Co-Build section

**Files:**
- Create: `src/components/marketing/CoBuildSection.tsx`
- Modify: `src/app/page.tsx` (both the `Suspense` fallback's section list and the import list)
- Modify: `src/components/marketing/HomeContent.tsx` (the real rendered section list)

**Interfaces:**
- Consumes: `CoBuildWordmark` (Task 4).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the section component**

Create `src/components/marketing/CoBuildSection.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import RevealSection from './RevealSection';
import CoBuildWordmark from './CoBuildWordmark';

export default function CoBuildSection() {
  return (
    <RevealSection className="py-24 md:py-28 bg-muted">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Co-Build
            </div>
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              <CoBuildWordmark /> an app for your industry.
            </h2>
          </div>
          <div>
            <p className="text-lg leading-[1.6] text-muted-foreground">
              We don&apos;t understand every industry we build for — you might. If you know an
              industry well enough to see exactly where its software falls short, we want to
              build with you: you bring the expertise and the customers, we bring the
              engineering, and you keep a stake in what we ship.
            </p>
            <p className="mt-4 text-lg leading-[1.6] text-muted-foreground">
              Medoura, live and selling to telehealth businesses today, started exactly this way.
            </p>
            <Link
              href="/partners"
              className="mt-7 inline-flex items-center gap-1.5 border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              See how Co-Build works
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
```

- [ ] **Step 2: Wire it into the homepage, between Apps and About**

Re-read `src/app/page.tsx` and `src/components/marketing/HomeContent.tsx` first (both compose the same section list independently — the `Suspense` fallback in `page.tsx` and the real render in `HomeContent.tsx` must both change, or the section will flash in only after `HomeContent` mounts).

In `src/app/page.tsx`, add the import:

```tsx
import CoBuildSection from '@/components/marketing/CoBuildSection';
```

and in the `Suspense` fallback's `<main>`, insert `<CoBuildSection />` between `<HomepageApps />` and `<About />`:

```tsx
      <main>
        <Hero />
        <HomepageApps />
        <CoBuildSection />
        <About />
        <CompactRoadmap />
        <FAQ />
        <LiveChat />
      </main>
```

In `src/components/marketing/HomeContent.tsx`, add the same import and make the identical insertion in the real `<main>` render:

```tsx
      <Hero />
      <HomepageApps />
      <CoBuildSection />
      <About />
      <CompactRoadmap />
      <FAQ />
      <LiveChat />
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Visual verification**

Load `/`, scroll past the apps section, and confirm the new Co-Build section appears before About, with the wordmark rendering correctly, in both light and dark mode and on a 390px viewport. Click "See how Co-Build works" and confirm it navigates to `/partners` (built in Task 7).

- [ ] **Step 5: Commit**

```bash
git add -- src/components/marketing/CoBuildSection.tsx src/app/page.tsx src/components/marketing/HomeContent.tsx
git commit -m "feat: add Co-Build section to homepage"
```

---

### Task 9: Footer "Partners" nav entry

**Files:**
- Modify: `src/components/marketing/Footer.tsx`

**Interfaces:**
- Consumes: nothing new beyond the `Handshake` icon from `lucide-react` (confirmed present in the installed version).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Re-read the current file first**

This file was already flagged as having uncommitted changes from another session, and was also touched by Task 7 of the sibling copy-pass plan (the "Roadmap" label fix) if that plan has run first — re-read it now before editing.

- [ ] **Step 2: Add the import and nav entry**

Add `Handshake` to the existing `lucide-react` import:

```tsx
import { LayoutGrid, TrendingUp, Sparkles, BookOpen, ScrollText, LifeBuoy, Handshake } from 'lucide-react';
```

Add a new entry to the `navigation` array (position it after "Apps" — Co-Build is a core part of what CoFabri does, so it shouldn't be buried last):

```tsx
const navigation = [
  { name: 'Apps', href: '/apps', icon: LayoutGrid },
  { name: 'Partners', href: '/partners', icon: Handshake },
  { name: 'Roadmap', href: '/roadmaps', icon: TrendingUp },
  { name: 'Changelog', href: '/changelog', icon: Sparkles },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Legal', href: '/legal', icon: ScrollText },
  { name: 'Support', href: '/support', icon: LifeBuoy },
];
```

(This shows the array already reflecting the sibling plan's "Roadmap" singular-label fix — if that plan hasn't run yet, the existing entry will read `{ name: 'Roadmaps', ... }`; only add the new "Partners" line, don't fix the label here too.)

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Visual verification**

Load any page and confirm "Partners" appears in the footer nav, links to `/partners`, and renders correctly in both light/dark mode and on mobile (footer nav wraps on narrow viewports).

- [ ] **Step 5: Commit**

```bash
git add -- src/components/marketing/Footer.tsx
git commit -m "feat: add Partners entry to footer nav"
```

---

### Task 10: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm the backend is deployed and reachable**

Confirm cofabri-api's Tasks 1-3 are deployed to whatever environment `COFABRI_API_BASE_URL` in `.env.local` points at (`https://api.cofabri.com` per the current value) — or point a local `.env.local` override at a local cofabri-api dev server if testing before deploy.

- [ ] **Step 2: Submit a real inquiry through the full path**

With the cofabri-website dev server running, open `/partners` in a browser, fill out the form with real-looking test data, complete the Turnstile widget (the dev site key renders Cloudflare's always-passing test widget), and submit.

- [ ] **Step 3: Confirm the row landed in Supabase**

Query the `site_partnership_inquiries` table (via the Supabase SQL editor, `psql`, or `supabase db` tooling) and confirm a new row exists matching the submitted data, with `status = 'new'`.

- [ ] **Step 4: Confirm error handling**

Submit once more with the Turnstile widget deliberately left incomplete (don't check it) and confirm the client-side validation blocks submission with "Please complete the security verification" rather than allowing a request through. Then, with devtools open, temporarily stop the local dev server's access to `COFABRI_API_BASE_URL` (e.g. point `.env.local` at an unreachable URL and restart) and confirm a real submission surfaces the "Failed to save partnership inquiry" error state in the form rather than hanging or crashing.

---

## Self-Review

**Spec coverage** (spec Part 2): positioning/case-study content → Tasks 7-8. Wordmark treatment → Task 4. Frontend form/route → Tasks 5-6. Backend migration/service/route → Tasks 1-3. Footer nav entry → Task 9. End-to-end test → Task 10.

**Placeholder scan:** no TBD/TODO; the one intentionally-marked placeholder (the Medoura quote) is explicitly called out in the spec's Open Items and marked in code with a comment naming exactly why it's unapproved — that's a real content-lifecycle decision, not a plan gap. Every step has literal code.

**Type/signature consistency:** `submitPartnershipInquiry({ first_name, last_name, email, company_name, industry, phone, message })` is defined once in Task 2 Step 3 and called with the same shape (via `req.body`) in Task 3 Step 3 — the frontend's `api/partners/route.ts` (Task 6) is the one place translating camelCase (`firstName`) to the snake_case the backend expects (`first_name`), matching exactly how `api/contact/route.ts` already does this translation. `PageHero`'s `title` prop widened from `string` to `React.ReactNode` in Task 7 Step 1 is additive and doesn't break any of the six existing string-title callers.

## Discoveries flagged for the user (resolved after this plan was drafted)

- **`src/app/layout.tsx`'s root `metadata` export** had the same stale-boilerplate problem as the individual pages — the user asked for it as a follow-up, so it's now Task 8 of the sibling copy-pass plan (`2026-09-02-site-copy-pass.md`) rather than this one, since it's pure copy with no Co-Build dependency.
- **`Navbar.tsx`'s "Contact" entry** (another session's uncommitted work, contradicting this project's footer-only convention for Contact) has been reverted directly by the user — `Contact` is removed from the `navigation` array and the now-unused `Mail` icon import. Neither plan needs to touch this further.
- **UnifrakturMaguntia's availability** was confirmed by the user via https://fonts.google.com/specimen/UnifrakturMaguntia — it's in Google's catalog, so Task 4 now commits directly to the `next/font/google` approach instead of branching on an uncertain build-check.
