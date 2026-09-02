# Website Leads → GHL Sync (cofabri-website) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "inquiry type" field to the contact form so visitors self-classify as a sales/partnership lead vs. a general question, and forward that classification to `cofabri-api` on submit.

**Architecture:** `ContactForm.tsx` gains a required `inquiryType` field (`'sales' | 'general'`), rendered with the existing `SimpleDropdown` component already used for `languagePreference`. `handleSubmit` includes it in the POST body to `/api/contact`. The route handler (`app/api/contact/route.ts`) validates it and forwards it to `cofabri-api`'s `/web/forms/contact` as `inquiry_type`.

**Tech Stack:** Next.js App Router, React (client component), TypeScript. This repo has no test framework configured (no Jest/Vitest/Playwright) — verification here is `npm run lint`, `npx tsc --noEmit`, and manual browser testing, not automated unit tests.

**Spec:** `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/docs/superpowers/specs/2026-09-02-website-leads-ghl-sync-design.md` (Section A). `cofabri-api`'s matching plan (`/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/docs/superpowers/plans/2026-09-02-website-leads-ghl-sync.md`) must have merged Task 2 (route validation accepting `inquiry_type`) before this repo's change can submit successfully against a real `cofabri-api` deployment — until then, verify locally against a `cofabri-api` dev server that has that change, or expect a 400 from the live API.

## Global Constraints

- `inquiryType` values are exactly `'sales'` or `'general'` — matches the `cofabri-api` migration's check constraint exactly (see that repo's plan, Task 1).
- No test framework exists in this repo — do not introduce one for this change. Verify via lint, typecheck, and manual browser testing only.
- Follow the existing `SimpleDropdown` pattern already used for `languagePreference` in `ContactForm.tsx:608-617` — do not introduce a new dropdown component.

---

### Task 1: Add `inquiryType` field to `ContactForm.tsx`

**Files:**
- Modify: `src/components/marketing/ContactForm.tsx`

**Interfaces:**
- Produces: `formData.inquiryType: 'sales' | 'general'`, submitted as `inquiryType` in the POST body to `/api/contact` — consumed by Task 2 (this plan).

- [ ] **Step 1: Add `inquiryType` to `FormData` and `FormErrors`**

In `src/components/marketing/ContactForm.tsx:9-26`, update the two interfaces:

```typescript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  languagePreference: string;
  relatedApp: string;
  inquiryType: '' | 'sales' | 'general';
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
  inquiryType?: string;
  turnstile?: string;
}
```

- [ ] **Step 2: Add `inquiryType` to initial state and `clearForm`**

In `src/components/marketing/ContactForm.tsx:201-209` (initial `useState`), add `inquiryType: ''` to the object. Do the same in `clearForm` at lines 369-377.

- [ ] **Step 3: Add validation**

In `validateForm()` (`src/components/marketing/ContactForm.tsx:278-321`), add before the `turnstileToken` check:

```typescript
    if (!formData.inquiryType) {
      newErrors.inquiryType = 'Please select what this is about';
    }
```

- [ ] **Step 4: Add a change handler and render the dropdown**

Add a handler near `handleLanguageChange` (`src/components/marketing/ContactForm.tsx:354-359`):

```typescript
  const handleInquiryTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      inquiryType: value as 'sales' | 'general'
    }));
    if (errors.inquiryType) {
      setErrors(prev => ({
        ...prev,
        inquiryType: undefined
      }));
    }
  };
```

Render it in the form, right before the "Subject" field (`src/components/marketing/ContactForm.tsx:620`, i.e. immediately after the `email`/`languagePreference` grid closes at line 618):

```tsx
        <div>
          <label htmlFor="inquiryType" className="block text-sm font-medium text-foreground mb-2">
            What can we help with? *
          </label>
          <SimpleDropdown
            options={[
              { value: 'sales', label: 'Sales / partnership inquiry' },
              { value: 'general', label: 'General question / support' },
            ]}
            value={formData.inquiryType}
            onChange={handleInquiryTypeChange}
            placeholder="Select an option"
          />
          {errors.inquiryType && (
            <p className="mt-1 text-sm text-danger">
              {errors.inquiryType}
            </p>
          )}
        </div>
```

- [ ] **Step 5: Include it in the submit payload**

`handleSubmit` (`src/components/marketing/ContactForm.tsx:416-425`) already spreads `...formData` into the POST body, so `inquiryType` is included automatically — no change needed there. Confirm this by reading lines 416-425 after Steps 1-4 land.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no new type errors.

Run: `npm run lint`
Expected: no new lint errors.

- [ ] **Step 7: Manual browser verification**

Run: `npm run dev`, open the contact page. Confirm:
- The new "What can we help with?" dropdown renders between Email/Language and Subject.
- Submitting without selecting an option shows "Please select what this is about" and blocks submission.
- Selecting "Sales / partnership inquiry" or "General question / support" clears that error.

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing/ContactForm.tsx
git commit -m "feat: add inquiry-type field to contact form for GHL lead sync"
```

---

### Task 2: Forward `inquiryType` through `/api/contact`

**Files:**
- Modify: `src/app/api/contact/route.ts`

**Interfaces:**
- Consumes: `inquiryType` from Task 1's form submission.
- Produces: `inquiry_type` field in the POST body to `cofabri-api`'s `/web/forms/contact` — matches the param name `WebFormsService.submitContact()` expects (see `cofabri-api`'s plan, Task 2).

- [ ] **Step 1: Extract and validate `inquiryType`**

In `src/app/api/contact/route.ts:35`, add `inquiryType` to the destructured body:

```typescript
    const { firstName, lastName, email, subject, message, languagePreference, relatedApp, turnstileToken, inquiryType } = body;
```

Add a validator right after the existing required-fields check (`src/app/api/contact/route.ts:38-43`):

```typescript
    if (inquiryType !== 'sales' && inquiryType !== 'general') {
      return NextResponse.json(
        { error: 'inquiryType must be sales or general' },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: Forward it to cofabri-api**

In the `fetch` call to `cofabri-api` (`src/app/api/contact/route.ts:154-168`), add `inquiry_type: inquiryType` to the JSON body:

```typescript
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          language_preference: toApiLanguagePreference(languagePreference),
          inquiry_type: inquiryType,
        }),
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Manual verification against a local cofabri-api**

With a local `cofabri-api` dev server running the Task-2 change from its own plan (`npm run dev` in that repo) and `COFABRI_API_BASE_URL`/`COFABRI_API_KEY` pointed at it, submit the contact form end-to-end for both "Sales / partnership inquiry" and "General question / support". Confirm in `cofabri-api`'s Supabase table (`site_contact_submissions`) that `inquiry_type` and `ghl_sync_status` land correctly (`sales` → `pending`, `general` → `not_applicable`).

If a local `cofabri-api` isn't available, at minimum confirm the request body cofabri-website sends (via browser devtools network tab) includes `inquiry_type: "sales"` or `"general"` correctly, and that omitting the field is now impossible from the UI.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/contact/route.ts
git commit -m "feat: forward inquiry_type to cofabri-api for GHL lead sync"
```
