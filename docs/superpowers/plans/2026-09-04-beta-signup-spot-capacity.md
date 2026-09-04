# Beta Signup Spot Capacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins cap how many people can join a `beta`-status app's early access, show a live "spots remaining" block on the signup page, and hide the signup form once it's full, closed, or the app is no longer in beta.

**Architecture:** A new nullable `apps.beta_capacity` column (schema owned by `cofabri-core`) is the only stored number; "filled" is always computed live from `site_beta` so it can never drift. `cofabri-api` computes and exposes both fields on its public app endpoints and enforces capacity server-side on signup submission. `cofabri-website` (this repo) consumes the real numbers to drive a 5-state UI on `/signup` and to swap card/detail-page CTAs between "Join the Beta" and "Visit".

**Tech Stack:** Next.js App Router + Vitest (`cofabri-website`), Express + Jest + Supabase-js (`cofabri-api`), Next.js dashboard + Supabase migrations, no test runner wired up for component/route code (`cofabri-core`).

**Spec:** `docs/superpowers/specs/2026-09-04-beta-signup-capacity-design.md` (this repo)

## Global Constraints

- Three separate git repositories are touched, at these absolute paths:
  - `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core` (schema + admin dashboard)
  - `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api` (Express API)
  - `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website` (this repo, public site)
  - Commit separately in each repo. Do not attempt a cross-repo commit.
- Feature applies **only** to apps whose status is `beta` (public-facing `lifecycle_stage` value `'Beta'`). Apps with status `development` (`lifecycle_stage` `'In Development'`) keep their existing, unrelated waitlist behavior on `/signup` completely unchanged.
- "Filled" is **never** stored — always computed live as: rows in `site_beta` where `app_id` matches, `type = 'waitlist'`, and `status IN ('new', 'approved')`. `denied` frees a spot; `draft` never held one.
- `beta_capacity IS NULL` = signups not open yet. `beta_capacity = 0` = admin explicitly closed signups. `filled >= capacity` = organically full. All three are "closed" states: hide the form, show a block.
- **Do NOT run `supabase db push` or otherwise apply the migration to the live database as part of this plan.** `cofabri-core/supabase/migrations/README.md` documents unresolved drift between local migration files and the live schema; applying migrations here is a deliberate, separate action for the user to take outside this plan. Task 1's deliverable is the migration **file** plus a manual SQL self-review — nothing is executed against a real database.
- Test conventions differ per repo — follow each repo's own pattern, don't introduce a new one:
  - `cofabri-api`: Jest is fully wired (`npm test`). Every change gets real TDD (service-level and route-level tests).
  - `cofabri-website`: Vitest (`npm test`) covers files under `src/lib/*.ts` only — there is no existing convention for testing Next.js route handlers (`src/app/api/**/route.ts`) or React components. Follow that: add Vitest tests for logic that lives in `src/lib/**` or `src/app/signup/signup-state.ts`, and verify route/component changes with `npm run build` plus a manual browser check instead of writing new-pattern tests for them.
  - `cofabri-core`: `npm test` is a no-op placeholder; there is no React/DOM test setup. Pure TypeScript functions elsewhere in the repo (e.g. `lib/tasks/overdue.test.ts`) are tested with Node's built-in test runner via `npm run test:unit` (`tsx --test <file list...>`). Follow that pattern for the pure form-mapping functions we touch; verify JSX/UI changes with `npm run typecheck` and a manual check in the dashboard instead.

---

## Task 1: Add `apps.beta_capacity` migration (cofabri-core)

**Files:**
- Create: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/supabase/migrations/20260906070000_add_apps_beta_capacity.sql`

**Interfaces:**
- Produces: a nullable `beta_capacity int` column on `public.apps`, consumed by Task 2 (admin form) and by `cofabri-api`'s `WebContentService`/`WebFormsService` (Tasks 4-6).

- [ ] **Step 1: Write the migration file**

```sql
-- Beta signup spot capacity: how many people can join a beta-status app's
-- early access via the website's /signup page. NULL means signups aren't
-- open yet; 0 means an admin has explicitly closed them without changing
-- the app's status. "Filled" is intentionally not stored here -- it's
-- always computed live from site_beta (count of type='waitlist' rows with
-- status in ('new','approved') for the app) so it can never drift from
-- reality. See cofabri-website's
-- docs/superpowers/specs/2026-09-04-beta-signup-capacity-design.md.
ALTER TABLE public.apps ADD COLUMN beta_capacity int NULL;

COMMENT ON COLUMN public.apps.beta_capacity IS
  'Max beta signups for this app (site_beta type=waitlist, status new/approved). NULL = not open yet, 0 = explicitly closed. Filled count is always computed live from site_beta, never stored.';
```

- [ ] **Step 2: Self-review the SQL (no execution)**

Read the file back and confirm: the column is nullable with no default (so existing rows land on `NULL` = "not open yet", the correct default per the spec), the filename timestamp (`20260906070000`) sorts after the latest existing migration (`20260906060000_exclude_dismissed_incidents_from_uptime_history.sql`), and the comment accurately describes the semantics. Do **not** run `supabase db push`, `supabase migration up`, or connect to any database — per Global Constraints, applying this migration is out of scope for this plan.

- [ ] **Step 3: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add supabase/migrations/20260906070000_add_apps_beta_capacity.sql
git commit -m "feat: add apps.beta_capacity column for beta signup spot limits"
```

---

## Task 2: Add `beta_capacity` to the admin edit-form types and mapping (cofabri-core)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/types/database.ts` (apps `Row`/`Insert`/`Update`, around lines 1274-1397)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/components/applications/application-edit-shared.tsx` (lines 10-192)
- Create: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/components/applications/application-edit-shared.test.ts`
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/package.json` (`test:unit` script)

**Interfaces:**
- Consumes: `Database["public"]["Tables"]["apps"]["Row"]["beta_capacity"]: number | null` (this task adds that field to the hand-maintained types file — see Global Constraints on why it can't be regenerated from a live DB right now).
- Produces: `ApplicationEditFormState.beta_capacity: string`; `applicationToEditFormState(app).beta_capacity`; `applicationEditFormToUpdate(form).beta_capacity: number | null`. Task 3 wires these into the JSX field.

- [ ] **Step 1: Add `beta_capacity` to the generated types file**

The live database doesn't have this column yet (Task 1's migration is unapplied by design), so `beta_capacity` can't be regenerated from introspection. Hand-add it to `types/database.ts`, matching the existing alphabetical ordering and the style of the other nullable `int` columns (`logo_width`, `user_count`).

In the `apps.Row` block (currently lines 1274-1315), insert after `app_url: string | null` (line 1279):

```typescript
          app_url: string | null
          beta_capacity: number | null
          business_criticality: string | null
```

In the `apps.Insert` block (currently lines 1316-1356), insert after `app_url?: string | null` (line 1320):

```typescript
          app_url?: string | null
          beta_capacity?: number | null
          business_criticality?: string | null
```

In the `apps.Update` block (currently lines 1357-1397), insert after `app_url?: string | null` (line 1361):

```typescript
          app_url?: string | null
          beta_capacity?: number | null
          business_criticality?: string | null
```

- [ ] **Step 2: Write the failing test for the form-state round trip**

Create `components/applications/application-edit-shared.test.ts`:

```typescript
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  applicationToEditFormState,
  applicationEditFormToUpdate,
  emptyApplicationEditForm,
} from "./application-edit-shared"
import type { AppEditableRow } from "./application-edit-shared"

function row(overrides: Partial<AppEditableRow> = {}): AppEditableRow {
  return {
    app_id: "medoura",
    app_name: "Medoura",
    category: null,
    project_type: "cofabri_product",
    status: "beta",
    business_criticality: null,
    priority_level: null,
    launch_date: null,
    high_level_description: null,
    feature_1: null,
    feature_2: null,
    feature_3: null,
    app_url: null,
    login_redirect_url: null,
    favicon_url: null,
    logo_url: null,
    logo_light_url: null,
    logo_width: null,
    primary_color: null,
    documentation: null,
    display_on_website: false,
    featured_app: false,
    lifecycle_stage: null,
    owner_id: null,
    beta_capacity: null,
    ...overrides,
  }
}

test("emptyApplicationEditForm has an empty beta_capacity", () => {
  assert.equal(emptyApplicationEditForm.beta_capacity, "")
})

test("applicationToEditFormState renders a set beta_capacity as a string", () => {
  const form = applicationToEditFormState(row({ beta_capacity: 25 }))
  assert.equal(form.beta_capacity, "25")
})

test("applicationToEditFormState renders a null beta_capacity as an empty string", () => {
  const form = applicationToEditFormState(row({ beta_capacity: null }))
  assert.equal(form.beta_capacity, "")
})

test("applicationToEditFormState renders a zero beta_capacity as '0', not empty", () => {
  const form = applicationToEditFormState(row({ beta_capacity: 0 }))
  assert.equal(form.beta_capacity, "0")
})

test("applicationEditFormToUpdate converts a numeric beta_capacity string back to a number", () => {
  const update = applicationEditFormToUpdate({ ...emptyApplicationEditForm, beta_capacity: "25" })
  assert.equal(update.beta_capacity, 25)
})

test("applicationEditFormToUpdate converts an empty beta_capacity string to null", () => {
  const update = applicationEditFormToUpdate({ ...emptyApplicationEditForm, beta_capacity: "" })
  assert.equal(update.beta_capacity, null)
})

test("applicationEditFormToUpdate converts a '0' beta_capacity string to the number 0, not null", () => {
  const update = applicationEditFormToUpdate({ ...emptyApplicationEditForm, beta_capacity: "0" })
  assert.equal(update.beta_capacity, 0)
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test components/applications/application-edit-shared.test.ts`
Expected: FAIL — `beta_capacity` does not exist on `ApplicationEditFormState`/`AppEditableRow` yet (TypeScript error or `undefined` assertion failures).

- [ ] **Step 4: Implement — add `beta_capacity` through the form-state pipeline**

In `application-edit-shared.tsx`, add `"beta_capacity"` to the `AppEditableRow` Pick list (after `"app_url"`, line 24):

```typescript
export type AppEditableRow = Pick<
  Database["public"]["Tables"]["apps"]["Row"],
  | "app_id"
  | "app_name"
  | "category"
  | "project_type"
  | "status"
  | "business_criticality"
  | "priority_level"
  | "launch_date"
  | "high_level_description"
  | "feature_1"
  | "feature_2"
  | "feature_3"
  | "app_url"
  | "beta_capacity"
  | "login_redirect_url"
  | "favicon_url"
  | "logo_url"
  | "logo_light_url"
  | "logo_width"
  | "primary_color"
  | "documentation"
  | "display_on_website"
  | "featured_app"
  | "lifecycle_stage"
  | "owner_id"
>
```

Add `beta_capacity: string` to `ApplicationEditFormState` (after `app_url: string`, line 95):

```typescript
export interface ApplicationEditFormState {
  app_id: string
  app_name: string
  category: string
  project_type: string
  status: string
  business_criticality: string
  priority_level: string
  launch_date: string
  high_level_description: string
  feature_1: string
  feature_2: string
  feature_3: string
  app_url: string
  beta_capacity: string
  login_redirect_url: string
  favicon_url: string
  logo_url: string
  logo_light_url: string
  logo_width: string
  primary_color: string
  documentation: string
  display_on_website: boolean
  featured_app: boolean
  lifecycle_stage: string
  owner_id: string
}
```

Add `beta_capacity: ""` to `emptyApplicationEditForm` (after `app_url: ""`, line 122):

```typescript
export const emptyApplicationEditForm: ApplicationEditFormState = {
  app_id: "",
  app_name: "",
  category: "",
  project_type: "cofabri_product",
  status: "active",
  business_criticality: "",
  priority_level: "",
  launch_date: "",
  high_level_description: "",
  feature_1: "",
  feature_2: "",
  feature_3: "",
  app_url: "",
  beta_capacity: "",
  login_redirect_url: "",
  favicon_url: "",
  logo_url: "",
  logo_light_url: "",
  logo_width: "",
  primary_color: "",
  documentation: "",
  display_on_website: false,
  featured_app: false,
  lifecycle_stage: "",
  owner_id: "",
}
```

In `applicationToEditFormState` (after `app_url: app.app_url ?? "",` line 150), add:

```typescript
    beta_capacity: app.beta_capacity != null ? String(app.beta_capacity) : "",
```

In `applicationEditFormToUpdate` (after `app_url: form.app_url || null,` line 178), add:

```typescript
    beta_capacity: form.beta_capacity !== "" ? Number(form.beta_capacity) : null,
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test components/applications/application-edit-shared.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Add the new test file to `test:unit` and typecheck**

In `package.json`, append `components/applications/application-edit-shared.test.ts` to the end of the `test:unit` script's file list (it's one long space-separated string — add a trailing ` components/applications/application-edit-shared.test.ts` before the closing quote).

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new type errors.

- [ ] **Step 7: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add types/database.ts components/applications/application-edit-shared.tsx components/applications/application-edit-shared.test.ts package.json
git commit -m "feat: thread beta_capacity through the app edit form's data layer"
```

---

## Task 3: Add the "Beta Capacity" field to the admin edit form UI (cofabri-core)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core/components/applications/application-edit-shared.tsx` (`ApplicationEditFormFields`, around lines 308-367)

**Interfaces:**
- Consumes: `ApplicationEditFormState.beta_capacity` (Task 2).
- Produces: nothing consumed by later tasks — this is a leaf UI change, verified manually (no DOM test runner in this repo per Global Constraints).

- [ ] **Step 1: Add the field, shown only when status is `beta`**

In `ApplicationEditFormFields`, insert a new row right after the "Criticality / Lifecycle Stage" grid (after the closing `</div>` on line 367, before the "Priority Level / Launch Date" grid that starts on line 368):

```tsx
      {form.status === "beta" && (
        <div className="space-y-2">
          <Label htmlFor="beta_capacity">Beta Capacity</Label>
          <Input
            id="beta_capacity"
            type="number"
            min={0}
            value={form.beta_capacity}
            onChange={(e) => onChange({ ...form, beta_capacity: e.target.value })}
            placeholder="Leave blank to keep beta signups closed"
          />
          <p className="text-xs text-muted-foreground">
            Max people who can join this app&apos;s beta via the website signup page. Blank = not open yet, 0 =
            explicitly closed. The number of spots already filled is computed live and never edited here.
          </p>
        </div>
      )}
```

- [ ] **Step 2: Typecheck and lint**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual verification**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run dev`, open an app's edit form in the dashboard, set Status to "Beta", confirm the "Beta Capacity" field appears, accepts a number, and disappears again when status is changed away from "Beta".

- [ ] **Step 4: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add components/applications/application-edit-shared.tsx
git commit -m "feat: show a Beta Capacity field on the app edit form for beta-status apps"
```

---

## Task 4: Expose `beta_capacity` and live `beta_spots_filled` from `getAppByAppId` (cofabri-api)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/src/services/WebContentService.js` (lines 10-25, 69-92)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/tests/services/WebContentService.test.js` (lines 119-171)

**Interfaces:**
- Produces: `getAppByAppId(appId)` resolves to `{ ...app, beta_statements, beta_spots_filled: number }`, where `app.beta_capacity` is `number | null` (now selected). Consumed by Task 9 (`cofabri-website`'s `/api/apps/[id]/route.ts`).

- [ ] **Step 1: Update the failing test first**

Replace the test `'returns the app with beta statements filtered on type and status'` (lines 119-171 of `WebContentService.test.js`) with a version that also mocks a second `site_beta` query (the waitlist-count query) and asserts on `beta_spots_filled`:

```javascript
  it('returns the app with beta statements and a live-computed beta_spots_filled', async () => {
    // Mock for apps table
    const appsMaybeSingle = jest.fn().mockResolvedValue({
      data: { app_id: 'medoura', app_name: 'Medoura', display_on_website: true, beta_capacity: 10 },
      error: null,
    });
    const appsEq2 = jest.fn(() => ({ maybeSingle: appsMaybeSingle }));
    const appsEq1 = jest.fn(() => ({ eq: appsEq2 }));
    const appsSelect = jest.fn(() => ({ eq: appsEq1 }));

    // Mock for site_beta statements query (approved testimonials)
    const statementsOrder = jest.fn().mockResolvedValue({
      data: [{ id: '1', app_id: 'medoura', type: 'statement', status: 'approved', order: 1, content: 'Test' }],
      error: null,
    });
    const statementsEq3 = jest.fn(() => ({ order: statementsOrder }));
    const statementsEq2 = jest.fn(() => ({ eq: statementsEq3 }));
    const statementsEq1 = jest.fn(() => ({ eq: statementsEq2 }));
    const statementsSelect = jest.fn(() => ({ eq: statementsEq1 }));

    // Mock for site_beta waitlist-count query (spots filled)
    const waitlistIn = jest.fn().mockResolvedValue({ data: [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }], error: null });
    const waitlistEq2 = jest.fn(() => ({ in: waitlistIn }));
    const waitlistEq1 = jest.fn(() => ({ eq: waitlistEq2 }));
    const waitlistSelect = jest.fn(() => ({ eq: waitlistEq1 }));

    let siteBetaCallCount = 0;
    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appsSelect };
      if (table === 'site_beta') {
        siteBetaCallCount += 1;
        return { select: siteBetaCallCount === 1 ? statementsSelect : waitlistSelect };
      }
    });
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const app = await service.getAppByAppId('medoura');

    expect(appsSelect).toHaveBeenCalledWith(
      'app_id, app_name, high_level_description, app_url, favicon_url, lifecycle_stage, category, feature_1, feature_2, feature_3, launch_date, latest_release_date, featured_app, display_on_website, beta_capacity'
    );
    expect(appsEq1).toHaveBeenCalledWith('app_id', 'medoura');
    expect(appsEq2).toHaveBeenCalledWith('display_on_website', true);
    expect(statementsSelect).toHaveBeenCalledWith('statement, order');
    expect(statementsEq1).toHaveBeenCalledWith('app_id', 'medoura');
    expect(statementsEq2).toHaveBeenCalledWith('type', 'statement');
    expect(statementsEq3).toHaveBeenCalledWith('status', 'approved');
    expect(waitlistSelect).toHaveBeenCalledWith('id');
    expect(waitlistEq1).toHaveBeenCalledWith('app_id', 'medoura');
    expect(waitlistEq2).toHaveBeenCalledWith('type', 'waitlist');
    expect(waitlistIn).toHaveBeenCalledWith('status', ['new', 'approved']);
    expect(app).toEqual({
      app_id: 'medoura',
      app_name: 'Medoura',
      display_on_website: true,
      beta_capacity: 10,
      beta_statements: [{ id: '1', app_id: 'medoura', type: 'statement', status: 'approved', order: 1, content: 'Test' }],
      beta_spots_filled: 3,
    });
  });
```

Also update the third test in that `describe` block, `'throws error when site_beta query fails'` (lines 197-230): it mocks `site_beta` with a single `statementsSelect` shape regardless of call order, which still works because the statements query is always the *first* `site_beta` call and it's the one that errors — no change needed there. Leave it as-is.

Update the fourth test, `'returns empty beta_statements array when none are approved'` (lines 232-258): it also needs the second (`waitlist`) `site_beta` call mocked now, or the implementation's second query will call `.select` on `undefined`. Add a waitlist mock and callCount-based dispatch matching the pattern above:

```javascript
  it('returns empty beta_statements array when none are approved', async () => {
    const appsMaybeSingle = jest.fn().mockResolvedValue({
      data: { app_id: 'medoura', app_name: 'Medoura', display_on_website: true },
      error: null,
    });
    const appsEq2 = jest.fn(() => ({ maybeSingle: appsMaybeSingle }));
    const appsEq1 = jest.fn(() => ({ eq: appsEq2 }));
    const appsSelect = jest.fn(() => ({ eq: appsEq1 }));

    const statementsOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const statementsEq3 = jest.fn(() => ({ order: statementsOrder }));
    const statementsEq2 = jest.fn(() => ({ eq: statementsEq3 }));
    const statementsEq1 = jest.fn(() => ({ eq: statementsEq2 }));
    const statementsSelect = jest.fn(() => ({ eq: statementsEq1 }));

    const waitlistIn = jest.fn().mockResolvedValue({ data: [], error: null });
    const waitlistEq2 = jest.fn(() => ({ in: waitlistIn }));
    const waitlistEq1 = jest.fn(() => ({ eq: waitlistEq2 }));
    const waitlistSelect = jest.fn(() => ({ eq: waitlistEq1 }));

    let siteBetaCallCount = 0;
    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appsSelect };
      if (table === 'site_beta') {
        siteBetaCallCount += 1;
        return { select: siteBetaCallCount === 1 ? statementsSelect : waitlistSelect };
      }
    });
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const app = await service.getAppByAppId('medoura');

    expect(app.beta_statements).toEqual([]);
    expect(app.beta_spots_filled).toEqual(0);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js -t "getAppByAppId"`
Expected: FAIL — `beta_capacity` isn't selected, `beta_spots_filled` is undefined, and/or the second `site_beta` mock chain is never consulted by the current implementation.

- [ ] **Step 3: Implement**

In `WebContentService.js`, add `'beta_capacity'` to `PUBLIC_APP_COLUMNS` (after `'featured_app'`, line 23):

```javascript
const PUBLIC_APP_COLUMNS = [
  'app_id',
  'app_name',
  'high_level_description',
  'app_url',
  'favicon_url',
  'lifecycle_stage',
  'category',
  'feature_1',
  'feature_2',
  'feature_3',
  'launch_date',
  'latest_release_date',
  'featured_app',
  'display_on_website',
  'beta_capacity',
].join(', ');
```

Replace `getAppByAppId` (lines 69-92) with:

```javascript
  async getAppByAppId(appId) {
    const { data: app, error } = await this.supabase
      .from('apps')
      .select(PUBLIC_APP_COLUMNS)
      .eq('app_id', appId)
      .eq('display_on_website', true)
      .maybeSingle();
    if (error) throw error;
    if (!app) return null;

    const { data: statements, error: statementsError } = await this.supabase
      .from('site_beta')
      .select(PUBLIC_BETA_STATEMENT_COLUMNS)
      .eq('app_id', appId)
      .eq('type', 'statement')
      .eq('status', 'approved')
      .order('order', { ascending: true });
    if (statementsError) throw statementsError;

    // A beta "spot" is held by any waitlist signup that hasn't been denied —
    // denying frees the spot back up, draft rows never held one. See
    // cofabri-website's docs/superpowers/specs/2026-09-04-beta-signup-capacity-design.md.
    const { data: waitlistRows, error: waitlistError } = await this.supabase
      .from('site_beta')
      .select('id')
      .eq('app_id', appId)
      .eq('type', 'waitlist')
      .in('status', ['new', 'approved']);
    if (waitlistError) throw waitlistError;

    return {
      ...app,
      beta_statements: statements || [],
      beta_spots_filled: (waitlistRows || []).length,
    };
  }
```

Also remove the now-outdated `PUBLIC_APP_COLUMNS` comment line 8-9 restriction note isn't affected — leave the surrounding comment (lines 3-9) as-is, it still accurately describes the whitelist rationale.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js -t "getAppByAppId"`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full test file to check for regressions**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js`
Expected: PASS (all tests, including `getApps` — unaffected by this task)

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api"
git add src/services/WebContentService.js tests/services/WebContentService.test.js
git commit -m "feat: expose beta_capacity and live beta_spots_filled from getAppByAppId"
```

---

## Task 5: Compute `beta_spots_filled` for beta apps in `getApps()` (cofabri-api)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/src/services/WebContentService.js` (`getApps`, lines 58-67)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/tests/services/WebContentService.test.js` (`describe('WebContentService.getApps'`, lines 4-110)

**Interfaces:**
- Consumes: `PUBLIC_APP_COLUMNS` (now includes `beta_capacity`, from Task 4).
- Produces: `getApps()` resolves to an array where any app with `lifecycle_stage === 'Beta'` and `beta_capacity != null` also carries `beta_spots_filled: number`; every other app is returned unchanged (no new key added) — this keeps the existing exact-match tests passing untouched. Consumed by Task 7 (`cofabri-website`'s `api-client.ts`).

- [ ] **Step 1: Add a new failing test for the beta batch computation**

Add this test inside `describe('WebContentService.getApps', ...)` in `WebContentService.test.js`, after the existing `'never selects credential or internal-config columns from apps'` test (after line 59):

```javascript
  it('attaches a live beta_spots_filled only to beta apps with a capacity set', async () => {
    const appsOrder = jest.fn().mockResolvedValue({
      data: [
        { app_id: 'medoura', app_name: 'Medoura', lifecycle_stage: 'Beta', beta_capacity: 10 },
        { app_id: 'reprisma', app_name: 'Reprisma', lifecycle_stage: 'Beta', beta_capacity: null },
        { app_id: 'certifi', app_name: 'CertiFi Central', lifecycle_stage: 'Live', beta_capacity: null },
      ],
      error: null,
    });
    const appsEq = jest.fn(() => ({ order: appsOrder }));
    const appsSelect = jest.fn(() => ({ eq: appsEq }));

    // Real query chain this mocks: .select('app_id').eq('type', 'waitlist')
    // .in('status', [...]).in('app_id', [...]) — each .in() call resolves to
    // the next link, with the second .in() resolving the promise.
    const waitlistIn2 = jest.fn().mockResolvedValue({
      data: [{ app_id: 'medoura' }, { app_id: 'medoura' }],
      error: null,
    });
    const waitlistIn1 = jest.fn(() => ({ in: waitlistIn2 }));
    const waitlistEq1 = jest.fn(() => ({ in: waitlistIn1 }));
    const waitlistSelect = jest.fn(() => ({ eq: waitlistEq1 }));

    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appsSelect };
      if (table === 'site_beta') return { select: waitlistSelect };
    });
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const apps = await service.getApps();

    expect(waitlistSelect).toHaveBeenCalledWith('app_id');
    expect(waitlistEq1).toHaveBeenCalledWith('type', 'waitlist');
    expect(waitlistIn1).toHaveBeenCalledWith('status', ['new', 'approved']);
    expect(waitlistIn2).toHaveBeenCalledWith('app_id', ['medoura']);
    expect(apps).toEqual([
      { app_id: 'medoura', app_name: 'Medoura', lifecycle_stage: 'Beta', beta_capacity: 10, beta_spots_filled: 2 },
      { app_id: 'reprisma', app_name: 'Reprisma', lifecycle_stage: 'Beta', beta_capacity: null },
      { app_id: 'certifi', app_name: 'CertiFi Central', lifecycle_stage: 'Live', beta_capacity: null },
    ]);
  });

  it('does not query site_beta at all when no app is an open beta', async () => {
    const appsOrder = jest.fn().mockResolvedValue({
      data: [{ app_id: 'medoura', app_name: 'Medoura', lifecycle_stage: 'Live', beta_capacity: null }],
      error: null,
    });
    const appsEq = jest.fn(() => ({ order: appsOrder }));
    const appsSelect = jest.fn(() => ({ eq: appsEq }));

    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appsSelect };
      throw new Error(`unexpected query against ${table}`);
    });
    createClient.mockReturnValue({ from });

    const WebContentService = require('../../src/services/WebContentService');
    const service = new WebContentService();
    const apps = await service.getApps();

    expect(apps).toEqual([{ app_id: 'medoura', app_name: 'Medoura', lifecycle_stage: 'Live', beta_capacity: null }]);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js -t "getApps"`
Expected: FAIL — `getApps()` doesn't query `site_beta` yet, so `beta_spots_filled` is never attached and the "does not query" test's `from` throws only if actually called (it isn't yet, so that one may already pass — the "attaches" test fails).

- [ ] **Step 3: Implement**

Replace `getApps()` (lines 58-67) with:

```javascript
  async getApps() {
    const { data, error } = await this.supabase
      .from('apps')
      .select(PUBLIC_APP_COLUMNS)
      .eq('display_on_website', true)
      .order('app_name', { ascending: true });
    if (error) throw error;

    const apps = data || [];

    // Beta spot counts are only meaningful for apps an admin has actually
    // opened a beta for (lifecycle_stage 'Beta' + a capacity set) — skip the
    // extra query entirely otherwise, and never attach beta_spots_filled to
    // an app that isn't in that state (keeps the response shape unchanged
    // for every other app).
    const betaAppIds = apps
      .filter((app) => app.lifecycle_stage === 'Beta' && app.beta_capacity != null)
      .map((app) => app.app_id);
    if (betaAppIds.length === 0) return apps;

    const { data: waitlistRows, error: waitlistError } = await this.supabase
      .from('site_beta')
      .select('app_id')
      .eq('type', 'waitlist')
      .in('status', ['new', 'approved'])
      .in('app_id', betaAppIds);
    if (waitlistError) throw waitlistError;

    const filledByAppId = new Map();
    for (const row of waitlistRows || []) {
      filledByAppId.set(row.app_id, (filledByAppId.get(row.app_id) || 0) + 1);
    }

    return apps.map((app) =>
      betaAppIds.includes(app.app_id)
        ? { ...app, beta_spots_filled: filledByAppId.get(app.app_id) || 0 }
        : app
    );
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js -t "getApps"`
Expected: PASS (6 tests: 4 pre-existing + 2 new)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebContentService.test.js`
Expected: PASS (all tests, including the untouched `getAppByAppId` tests from Task 4)

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api"
git add src/services/WebContentService.js tests/services/WebContentService.test.js
git commit -m "feat: compute live beta_spots_filled for beta apps in getApps()"
```

---

## Task 6: Server-side capacity guard + quote/statement persistence on waitlist signup (cofabri-api)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/src/services/WebFormsService.js` (`submitWaitlistSignup`, lines 94-109)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/src/routes/web-forms.js` (waitlist route, lines 91-112)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/tests/services/WebFormsService.test.js` (`describe('WebFormsService.submitWaitlistSignup'`, lines 534-610)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api/tests/routes/web-forms.test.js` (`describe('POST /web/forms/waitlist'`, lines 664-768)

**Interfaces:**
- Produces: `submitWaitlistSignup({ ..., quote, statement })` persists `quote`/`statement` on the inserted `site_beta` row, and throws an `Error` with `.status = 400` when the target app is `beta`-status and full/closed/not-open. The route (`POST /web/forms/waitlist`) forwards that as a `400` with the error's message instead of a generic `500`. Consumed by Task 11 (`cofabri-website`'s `/api/signup/route.ts`).

- [ ] **Step 1: Write the failing service-level tests**

Add these tests inside `describe('WebFormsService.submitWaitlistSignup', ...)` in `WebFormsService.test.js`, after the existing `'defaults app_id and interest_level to null when omitted'` test (after line 593):

```javascript
  it('persists quote and statement when provided', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitWaitlistSignup({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      quote: 25,
      statement: 'Excited to try this!',
    });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ quote: 25, statement: 'Excited to try this!' }),
    ]);
  });

  it('defaults quote and statement to null when omitted', async () => {
    const select = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    await service.submitWaitlistSignup({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' });

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ quote: null, statement: null }),
    ]);
  });

  it('rejects with a 400 error when the target beta app has no capacity set', async () => {
    const appMaybeSingle = jest.fn().mockResolvedValue({ data: { status: 'beta', beta_capacity: null }, error: null });
    const appEq = jest.fn(() => ({ maybeSingle: appMaybeSingle }));
    const appSelect = jest.fn(() => ({ eq: appEq }));
    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appSelect };
      throw new Error(`unexpected query against ${table}`);
    });
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();

    await expect(
      service.submitWaitlistSignup({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects with a 400 error when the target beta app has capacity explicitly set to 0', async () => {
    const appMaybeSingle = jest.fn().mockResolvedValue({ data: { status: 'beta', beta_capacity: 0 }, error: null });
    const appEq = jest.fn(() => ({ maybeSingle: appMaybeSingle }));
    const appSelect = jest.fn(() => ({ eq: appEq }));
    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appSelect };
      throw new Error(`unexpected query against ${table}`);
    });
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();

    await expect(
      service.submitWaitlistSignup({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects with a 400 error when the target beta app is already full', async () => {
    const appMaybeSingle = jest.fn().mockResolvedValue({ data: { status: 'beta', beta_capacity: 2 }, error: null });
    const appEq = jest.fn(() => ({ maybeSingle: appMaybeSingle }));
    const appSelect = jest.fn(() => ({ eq: appEq }));

    const waitlistIn = jest.fn().mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }], error: null });
    const waitlistEq2 = jest.fn(() => ({ in: waitlistIn }));
    const waitlistEq1 = jest.fn(() => ({ eq: waitlistEq2 }));
    const waitlistSelect = jest.fn(() => ({ eq: waitlistEq1 }));

    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appSelect };
      if (table === 'site_beta') return { select: waitlistSelect };
    });
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();

    await expect(
      service.submitWaitlistSignup({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('allows a signup when the target beta app still has room', async () => {
    const appMaybeSingle = jest.fn().mockResolvedValue({ data: { status: 'beta', beta_capacity: 2 }, error: null });
    const appEq = jest.fn(() => ({ maybeSingle: appMaybeSingle }));
    const appSelect = jest.fn(() => ({ eq: appEq }));

    const waitlistIn = jest.fn().mockResolvedValue({ data: [{ id: 'a' }], error: null });
    const waitlistEq2 = jest.fn(() => ({ in: waitlistIn }));
    const waitlistEq1 = jest.fn(() => ({ eq: waitlistEq2 }));
    const waitlistSelect = jest.fn(() => ({ eq: waitlistEq1 }));

    const insertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'new' }], error: null });
    const insert = jest.fn(() => ({ select: insertSelect }));

    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appSelect };
      if (table === 'site_beta') return { select: waitlistSelect, insert };
    });
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    const result = await service.submitWaitlistSignup({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura',
    });

    expect(result).toEqual({ id: 'new' });
  });

  it('does not guard signups for non-beta apps (e.g. still In Development)', async () => {
    const appMaybeSingle = jest.fn().mockResolvedValue({ data: { status: 'development', beta_capacity: null }, error: null });
    const appEq = jest.fn(() => ({ maybeSingle: appMaybeSingle }));
    const appSelect = jest.fn(() => ({ eq: appEq }));

    const insertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'new' }], error: null });
    const insert = jest.fn(() => ({ select: insertSelect }));

    const from = jest.fn((table) => {
      if (table === 'apps') return { select: appSelect };
      if (table === 'site_beta') return { insert };
    });
    createClient.mockReturnValue({ from });

    const WebFormsService = require('../../src/services/WebFormsService');
    const service = new WebFormsService();
    const result = await service.submitWaitlistSignup({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura',
    });

    expect(result).toEqual({ id: 'new' });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebFormsService.test.js -t "submitWaitlistSignup"`
Expected: FAIL — `quote`/`statement` aren't persisted, and there's no capacity guard at all (the guard tests fail because no `apps` lookup happens and no error is thrown).

- [ ] **Step 3: Implement**

Replace `submitWaitlistSignup` (lines 94-109) with:

```javascript
  async submitWaitlistSignup({ first_name, last_name, email, app_id, interest_level, quote, statement }) {
    if (app_id) {
      const { data: app, error: appError } = await this.supabase
        .from('apps')
        .select('status, beta_capacity')
        .eq('app_id', app_id)
        .maybeSingle();
      if (appError) throw appError;

      // Capacity only applies to beta-status apps (see
      // cofabri-website's docs/superpowers/specs/2026-09-04-beta-signup-capacity-design.md)
      // — the pre-launch 'development' waitlist funnel is unaffected.
      if (app && app.status === 'beta') {
        if (app.beta_capacity == null || app.beta_capacity === 0) {
          const err = new Error(
            app.beta_capacity === 0
              ? 'Beta signups are closed for this app'
              : 'Beta signups are not open yet for this app'
          );
          err.status = 400;
          throw err;
        }

        const { data: waitlistRows, error: waitlistError } = await this.supabase
          .from('site_beta')
          .select('id')
          .eq('app_id', app_id)
          .eq('type', 'waitlist')
          .in('status', ['new', 'approved']);
        if (waitlistError) throw waitlistError;

        if ((waitlistRows || []).length >= app.beta_capacity) {
          const err = new Error('All beta spots for this app are filled');
          err.status = 400;
          throw err;
        }
      }
    }

    const { data, error } = await this.supabase
      .from('site_beta')
      .insert([{
        type: 'waitlist',
        first_name,
        last_name,
        email,
        app_id: app_id || null,
        interest_level: interest_level || null,
        quote: quote ?? null,
        statement: statement || null,
        status: 'new',
      }])
      .select();
    if (error) throw error;
    return data[0];
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebFormsService.test.js -t "submitWaitlistSignup"`
Expected: PASS (9 tests: 3 pre-existing + 6 new)

- [ ] **Step 5: Write the failing route-level test**

Add these tests inside `describe('POST /web/forms/waitlist', ...)` in `tests/routes/web-forms.test.js`, after the existing `'accepts a valid interest_level within the 1-5 range'` test (after line 767):

```javascript
  it('accepts optional quote and statement fields', async () => {
    const WebFormsService = require('../../src/services/WebFormsService');
    const submitWaitlistSignup = jest.fn().mockResolvedValue({ id: '1' });
    WebFormsService.mockImplementation(() => ({ submitWaitlistSignup }));

    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/waitlist')
      .set('Authorization', 'Bearer test-secret')
      .send({
        first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura',
        quote: 25, statement: 'Excited!',
      });

    expect(res.status).toBe(201);
    expect(submitWaitlistSignup).toHaveBeenCalledWith(
      expect.objectContaining({ quote: 25, statement: 'Excited!' })
    );
  });

  it('forwards a capacity-guard rejection from the service as a 400', async () => {
    const WebFormsService = require('../../src/services/WebFormsService');
    const err = new Error('All beta spots for this app are filled');
    err.status = 400;
    WebFormsService.mockImplementation(() => ({
      submitWaitlistSignup: jest.fn().mockRejectedValue(err),
    }));

    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/waitlist')
      .set('Authorization', 'Bearer test-secret')
      .send({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'All beta spots for this app are filled' });
  });

  it('still returns a generic 500 for a non-guard service failure', async () => {
    const WebFormsService = require('../../src/services/WebFormsService');
    WebFormsService.mockImplementation(() => ({
      submitWaitlistSignup: jest.fn().mockRejectedValue(new Error('Database error')),
    }));

    const webFormsRoutes = require('../../src/routes/web-forms');
    app = express();
    app.use(express.json());
    app.use('/web/forms', authenticateApiKey, webFormsRoutes);

    const res = await request(app)
      .post('/web/forms/waitlist')
      .set('Authorization', 'Bearer test-secret')
      .send({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', app_id: 'medoura' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Failed to submit waitlist signup' });
  });
```

- [ ] **Step 6: Run the route tests to verify the new ones fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/routes/web-forms.test.js -t "waitlist"`
Expected: FAIL — the route has no `quote`/`statement` validators yet and always returns 500 on any thrown error.

- [ ] **Step 7: Implement the route changes**

Replace the `/waitlist` route (lines 91-112 of `src/routes/web-forms.js`) with:

```javascript
router.post(
  '/waitlist',
  [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('email').isEmail(),
    body('interest_level').optional().isInt({ min: 1, max: 5 }),
    body('quote').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('quote must be a non-negative number'),
    body('statement').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const signup = await service.submitWaitlistSignup(req.body);
      res.status(201).json(signup);
    } catch (error) {
      console.error('POST /web/forms/waitlist error:', error);
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Failed to submit waitlist signup' });
    }
  }
);
```

- [ ] **Step 8: Run the route tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/routes/web-forms.test.js -t "waitlist"`
Expected: PASS (9 tests: 6 pre-existing + 3 new)

- [ ] **Step 9: Run both full test files to check for regressions**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api" && npx jest tests/services/WebFormsService.test.js tests/routes/web-forms.test.js`
Expected: PASS (all tests)

- [ ] **Step 10: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api"
git add src/services/WebFormsService.js src/routes/web-forms.js tests/services/WebFormsService.test.js tests/routes/web-forms.test.js
git commit -m "feat: guard beta waitlist signups against full/closed apps, persist quote and statement"
```

---

## Task 7: Carry `betaCapacity`/`betaSpotsFilled` through `api-client.ts` (cofabri-website)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/lib/api-client.ts` (lines 23-103)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/lib/api-client.test.ts`

**Interfaces:**
- Consumes: `cofabri-api`'s `beta_capacity`/`beta_spots_filled` fields on `/web/content/apps` and `/web/content/apps/:id` (Tasks 4-5).
- Produces: `App.betaCapacity: number | null | undefined` and `App.betaSpotsFilled: number | undefined`, populated by `mapApp()`. Consumed by Task 8 (`app-display.ts`) and Task 10 (`/api/apps/[id]/route.ts`).

- [ ] **Step 1: Write the failing test**

Add this test to `api-client.test.ts` (new `describe` block, after the existing `getAppReleases` block):

```typescript
describe('getApp', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.COFABRI_API_BASE_URL;

  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.cofabri.com';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COFABRI_API_BASE_URL = originalBaseUrl;
  });

  it('maps beta_capacity and beta_spots_filled onto the App', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        app_id: 'medoura',
        app_name: 'Medoura',
        lifecycle_stage: 'Beta',
        beta_capacity: 10,
        beta_spots_filled: 4,
      }),
    });

    const { getApp } = await import('./api-client');
    const app = await getApp('medoura');

    expect(app?.betaCapacity).toBe(10);
    expect(app?.betaSpotsFilled).toBe(4);
  });

  it('passes through a null beta_capacity and a missing beta_spots_filled as-is', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        app_id: 'reprisma',
        app_name: 'Reprisma',
        lifecycle_stage: 'Beta',
        beta_capacity: null,
      }),
    });

    const { getApp } = await import('./api-client');
    const app = await getApp('reprisma');

    expect(app?.betaCapacity).toBeNull();
    expect(app?.betaSpotsFilled).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- api-client`
Expected: FAIL — `betaCapacity`/`betaSpotsFilled` are `undefined` on the mapped `App` because `mapApp` doesn't read them yet.

- [ ] **Step 3: Implement**

In `api-client.ts`, add to the `App` interface (after `betaStatements?: BetaStatement[];`, line 39):

```typescript
  betaStatements?: BetaStatement[];
  betaCapacity?: number | null;
  betaSpotsFilled?: number;
```

Add to the `AppRow` interface (after `beta_statements?: BetaStatement[];`, line 59):

```typescript
  beta_statements?: BetaStatement[];
  beta_capacity?: number | null;
  beta_spots_filled?: number;
```

In `mapApp` (after `betaStatements: row.beta_statements,`, line 101):

```typescript
    betaStatements: row.beta_statements,
    betaCapacity: row.beta_capacity,
    betaSpotsFilled: row.beta_spots_filled,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- api-client`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/lib/api-client.ts src/lib/api-client.test.ts
git commit -m "feat: carry betaCapacity and betaSpotsFilled through api-client's App type"
```

---

## Task 8: "Join the Beta" CTA on cards/detail pages when spots remain (cofabri-website)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/lib/app-display.ts` (lines 87-95)
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/lib/app-display.test.ts`

**Interfaces:**
- Consumes: `App.status`, `App.betaCapacity`, `App.betaSpotsFilled` (Task 7).
- Produces: `hasOpenBetaSignup(app: App): boolean` (exported for testing); `actionLabel`/`actionHref` now return `'Join the Beta'` / `/signup?appId=X` for a `Beta`-status app with open spots. No change needed in `AppPreviewCard.tsx` or the app detail page — both already call these two functions.

- [ ] **Step 1: Write the failing tests**

Add to the `describe('actionLabel / actionHref', ...)` block in `app-display.test.ts` (after the existing `'falls back to the apps index when a live app has no url'` test, line 48):

```typescript
  it('offers to join the beta when a beta app has open spots', () => {
    const a = app({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 4, url: 'app.example.com' });
    expect(actionLabel(a)).toBe('Join the Beta');
    expect(actionHref(a)).toBe('/signup?appId=app-1');
  });

  it('falls back to Visit once a beta app is full', () => {
    const a = app({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 10, url: 'app.example.com' });
    expect(actionLabel(a)).toBe('Visit');
    expect(actionHref(a)).toBe('https://app.example.com');
  });

  it('falls back to Visit when a beta app has no capacity set', () => {
    const a = app({ status: 'Beta', betaCapacity: null, url: 'app.example.com' });
    expect(actionLabel(a)).toBe('Visit');
  });

  it('falls back to Visit when a beta app has capacity explicitly closed at 0', () => {
    const a = app({ status: 'Beta', betaCapacity: 0, betaSpotsFilled: 0, url: 'app.example.com' });
    expect(actionLabel(a)).toBe('Visit');
  });
```

- [ ] **Step 2: Fix a pre-existing test-infrastructure bug that blocks this file from running at all**

Confirmed during planning (not introduced by this task): in the current toolchain (`vitest@4.1.11` on Node 25), the `@` alias configured in `vitest.config.mts` fails to resolve for any *real* (value) import — only `import type`-only imports across the `@` alias happen to work today, because TypeScript's type-only imports are stripped before Vite ever attempts to resolve them. `app-display.ts` line 1 does a real (non-type-only) `@/lib/api-client` import (`KNOWN_LIFECYCLE_STATUSES` is a runtime value), so `app-display.test.ts` currently fails to even load, with `Error: Cannot find package '@/lib/api-client'` — before any of this task's changes. `api-client.ts` lives in the same directory as `app-display.ts`, so switch that one import to a relative path, which sidesteps the alias bug entirely without touching the shared `vitest.config.mts` (a config change would affect all ~70 files using the `@` alias, most of them in type position where it currently "works" only because it's elided — out of scope to touch broadly here).

`app-display.ts` and `api-client.ts` are both directly in `src/lib/`, so change line 1 of `app-display.ts` from:

```typescript
import { KNOWN_LIFECYCLE_STATUSES, type App, type RoadmapFeature } from '@/lib/api-client';
```

to:

```typescript
import { KNOWN_LIFECYCLE_STATUSES, type App, type RoadmapFeature } from './api-client';
```

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- app-display`
Expected: the file now loads and its existing (pre-this-task) tests pass — confirms the infra fix, independent of anything else in this task.

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- app-display`
Expected: FAIL on the 4 new tests from Step 1 — `actionLabel`/`actionHref` currently only special-case `'In Development'`, so a `Beta` app always falls through to `'Visit'`/the URL branch regardless of capacity. (Pre-existing tests from before this task still pass, per Step 2.)

- [ ] **Step 4: Implement**

Replace `actionLabel`/`actionHref` (lines 87-95 of `app-display.ts`) with:

```typescript
// A beta app only gets the signup CTA while it's genuinely accepting people:
// capacity must be set above zero and not yet fully claimed. Otherwise it
// falls back to the same default a live app gets (Visit, or the apps index).
export function hasOpenBetaSignup(app: App): boolean {
  return (
    app.status === 'Beta' &&
    app.betaCapacity != null &&
    app.betaCapacity > 0 &&
    (app.betaSpotsFilled ?? 0) < app.betaCapacity
  );
}

export function actionLabel(app: App): string {
  if (app.status === 'In Development') return 'Join waitlist';
  if (hasOpenBetaSignup(app)) return 'Join the Beta';
  return 'Visit';
}

export function actionHref(app: App): string {
  if (app.status === 'In Development') return `/signup?appId=${app.id}`;
  if (hasOpenBetaSignup(app)) return `/signup?appId=${app.id}`;
  if (app.url) return app.url.startsWith('http') ? app.url : `https://${app.url}`;
  return '/apps';
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- app-display`
Expected: PASS

- [ ] **Step 6: Run the full test suite to check for regressions**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test`
Expected: PASS (all files)

- [ ] **Step 7: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/lib/app-display.ts src/lib/app-display.test.ts
git commit -m "feat: show a Join the Beta CTA on cards/detail pages while spots remain"
```

---

## Task 9: Pure signup-state logic (cofabri-website)

**Files:**
- Create: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/app/signup/signup-state.ts`
- Create: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/app/signup/signup-state.test.ts`

**Interfaces:**
- Produces: `SignupState` (discriminated union: `'legacy-waitlist' | 'not-open' | 'closed' | 'full' | 'open' | 'unavailable'`), `getSignupState(appData): SignupState`, `getSignupCopy(state, appName): { title: string; body: string }`. Consumed by Task 12 (`SignupPageContent.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `src/app/signup/signup-state.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { getSignupState, getSignupCopy } from './signup-state';

describe('getSignupState', () => {
  it('is legacy-waitlist for apps still In Development, regardless of capacity', () => {
    expect(getSignupState({ status: 'In Development', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'legacy-waitlist',
    });
    expect(getSignupState({ status: 'In Development', betaCapacity: 0, betaSpotsFilled: 0 })).toEqual({
      kind: 'legacy-waitlist',
    });
  });

  it('is unavailable for a status this page does not support', () => {
    expect(getSignupState({ status: 'Live', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'unavailable',
      status: 'Live',
    });
    expect(getSignupState({ status: 'Active', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'unavailable',
      status: 'Active',
    });
  });

  it('is not-open for a beta app with no capacity set', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({ kind: 'not-open' });
  });

  it('is closed for a beta app with capacity explicitly set to 0', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 0, betaSpotsFilled: 0 })).toEqual({ kind: 'closed' });
  });

  it('is full when filled reaches capacity', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 10 })).toEqual({
      kind: 'full',
      capacity: 10,
      filled: 10,
    });
  });

  it('is full when filled somehow exceeds capacity', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 11 })).toEqual({
      kind: 'full',
      capacity: 10,
      filled: 11,
    });
  });

  it('is open with the correct remaining count when spots are available', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 4 })).toEqual({
      kind: 'open',
      capacity: 10,
      filled: 4,
      remaining: 6,
    });
  });
});

describe('getSignupCopy', () => {
  it('describes each closed state with the app name interpolated', () => {
    expect(getSignupCopy({ kind: 'not-open' }, 'Medoura').title).toContain('Medoura');
    expect(getSignupCopy({ kind: 'closed' }, 'Medoura').title).toContain('Medoura');
    expect(getSignupCopy({ kind: 'full', capacity: 10, filled: 10 }, 'Medoura').title).toContain('Medoura');
  });

  it('describes unavailable differently for a live app than for any other status', () => {
    const live = getSignupCopy({ kind: 'unavailable', status: 'Live' }, 'Medoura');
    expect(live.title).toContain('live');
    const other = getSignupCopy({ kind: 'unavailable', status: 'Paused' }, 'Medoura');
    expect(other.title).not.toContain('live');
  });

  it('throws for a state that should still show the form instead of a block', () => {
    expect(() => getSignupCopy({ kind: 'legacy-waitlist' }, 'Medoura')).toThrow();
    expect(() => getSignupCopy({ kind: 'open', capacity: 10, filled: 4, remaining: 6 }, 'Medoura')).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- signup-state`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Implement**

Create `src/app/signup/signup-state.ts`:

```typescript
export type SignupState =
  | { kind: 'legacy-waitlist' }
  | { kind: 'not-open' }
  | { kind: 'closed' }
  | { kind: 'full'; capacity: number; filled: number }
  | { kind: 'open'; capacity: number; filled: number; remaining: number }
  | { kind: 'unavailable'; status: string };

interface SignupAppData {
  status: string;
  betaCapacity: number | null;
  betaSpotsFilled: number;
}

// This page serves two unrelated funnels: the legacy pre-launch waitlist
// (status 'In Development', unlimited, unchanged by this feature) and the
// capacity-limited beta signup (status 'Beta'). Anything else means a stale
// or direct link pointed here for an app this page no longer serves.
export function getSignupState(appData: SignupAppData): SignupState {
  if (appData.status === 'In Development') return { kind: 'legacy-waitlist' };
  if (appData.status !== 'Beta') return { kind: 'unavailable', status: appData.status };
  if (appData.betaCapacity == null) return { kind: 'not-open' };
  if (appData.betaCapacity === 0) return { kind: 'closed' };

  const remaining = appData.betaCapacity - appData.betaSpotsFilled;
  if (remaining <= 0) return { kind: 'full', capacity: appData.betaCapacity, filled: appData.betaSpotsFilled };
  return { kind: 'open', capacity: appData.betaCapacity, filled: appData.betaSpotsFilled, remaining };
}

// Only called for states that hide the form and show a block instead —
// 'legacy-waitlist' and 'open' keep showing the real form and never reach here.
export function getSignupCopy(state: SignupState, appName: string): { title: string; body: string } {
  switch (state.kind) {
    case 'not-open':
      return {
        title: `Beta signups for ${appName} aren't open yet`,
        body: "We're not accepting beta signups for this app just yet. Check back soon.",
      };
    case 'closed':
      return {
        title: `Beta signups for ${appName} are closed`,
        body: 'This beta is no longer accepting new signups.',
      };
    case 'full':
      return {
        title: `All beta spots for ${appName} are filled`,
        body: 'Every spot has been claimed. Check back later or explore our other apps.',
      };
    case 'unavailable':
      return state.status === 'Live' || state.status === 'Active'
        ? { title: `${appName} is live!`, body: 'This app has launched — head over and start using it.' }
        : {
            title: `Beta signups aren't available for ${appName} right now`,
            body: 'This signup page is not currently available for this app.',
          };
    case 'legacy-waitlist':
    case 'open':
      throw new Error(`getSignupCopy called for a state that still shows the form: ${state.kind}`);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- signup-state`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/app/signup/signup-state.ts src/app/signup/signup-state.test.ts
git commit -m "feat: add pure signup-state logic for the beta signup page's 5 UI states"
```

---

## Task 10: Pass through real beta fields in `/api/apps/[id]/route.ts` (cofabri-website)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/app/api/apps/[id]/route.ts`

**Interfaces:**
- Consumes: `getApp(id)` returning `App.betaCapacity`/`App.betaSpotsFilled` (Task 7).
- Produces: the route's JSON response gains real `betaCapacity: number | null` and `betaSpotsFilled: number` fields (replacing the hardcoded `betaSpotsTotal`/`betaSpotsFilled: 0`/`betaDescription: ''`). Consumed by Task 12 (`SignupPageContent.tsx`).

No test — there is no existing convention for testing Next.js route handlers in this repo (see Global Constraints). Verify with `npm run build` and the manual check in Task 12's Step 6.

- [ ] **Step 1: Implement**

Replace the whole file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getApp, type BetaStatement } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface AppData {
  betaCapacity: number | null;
  betaSpotsFilled: number;
  status: string;
  name: string;
  betaStatements: BetaStatement[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const app = await getApp(id);

    if (!app) {
      throw new Error('Invalid app data response');
    }

    const response: AppData = {
      betaCapacity: app.betaCapacity ?? null,
      betaSpotsFilled: app.betaSpotsFilled ?? 0,
      status: app.status || 'Coming Soon',
      name: app.name || 'Unknown App',
      betaStatements: app.betaStatements || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/apps/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

This also drops the two `console.log` debug statements and the always-empty `betaDescription` field — the debug logs were never gated and `betaDescription` was never populated or rendered anywhere (dead since before this feature; see the spec's research).

- [ ] **Step 2: Build to verify no type errors**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully (Task 12 hasn't updated `SignupPageContent.tsx` yet, so it will still reference the old `AppData` field names locally in that file — that's fine, they're two independent local interfaces until Task 12 updates the other one).

- [ ] **Step 3: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/app/api/apps/[id]/route.ts
git commit -m "feat: pass through real beta capacity and spots-filled data instead of hardcoded zeros"
```

---

## Task 11: Forward `quote`/`statement` and the capacity-guard 400 in `/api/signup/route.ts` (cofabri-website)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/app/api/signup/route.ts`

**Interfaces:**
- Consumes: `cofabri-api`'s `POST /web/forms/waitlist` now accepting `quote`/`statement` and returning `400` with a `message` on capacity guard failure (Task 6).
- Produces: the route forwards `quote`/`statement` from the request body, and returns `{ error: string }` with status `400` (instead of a generic `502`) when `cofabri-api` rejects for capacity reasons. Consumed by Task 12 (`SignupPageContent.tsx`'s error handling).

No test — same rationale as Task 10. Verify with `npm run build` and the manual check in Task 12's Step 6.

- [ ] **Step 1: Implement**

Replace the whole file with:

```typescript
import { NextResponse } from 'next/server';

interface ApiError {
  message?: string;
  stack?: string;
  details?: string;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { firstName, lastName, email, appId, interestLevel, quote, statement } = data;

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      throw new Error('cofabri-api configuration missing');
    }

    // Submit to cofabri-api, which persists the waitlist signup in Supabase
    // and enforces beta capacity server-side.
    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        app_id: appId || undefined,
        interest_level: Number(interestLevel) || undefined,
        quote: quote !== undefined && quote !== null && quote !== '' ? Number(quote) : undefined,
        statement: statement || undefined,
      }),
    });

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      console.error('cofabri-api waitlist submission failed:', apiRes.status, errorBody);

      // A 400 here means cofabri-api's capacity guard rejected the signup
      // (e.g. someone submitted just as the last spot was taken) — surface
      // its message to the user instead of a generic failure.
      if (apiRes.status === 400) {
        return NextResponse.json(
          { error: errorBody?.message || 'Beta signups are no longer available for this app.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create record' },
        { status: 502 }
      );
    }

    const waitlistRecord = await apiRes.json();

    return NextResponse.json({ success: true, waitlistRecord });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('Detailed error in signup route:', {
      message: err.message,
      stack: err.stack,
      details: err.details || 'No additional details available'
    });

    return NextResponse.json(
      { error: 'Failed to create record', details: err.message },
      { status: 500 }
    );
  }
}
```

This also drops the two unconditional debug `console.log` calls that logged request data (one logged the whole payload, redacting only email) — noisy in production and not needed now that the route's behavior is otherwise unchanged.

- [ ] **Step 2: Build to verify no type errors**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully.

- [ ] **Step 3: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/app/api/signup/route.ts
git commit -m "feat: forward quote/statement to cofabri-api and surface capacity-guard errors"
```

---

## Task 12: Render the 5 signup-page states in `SignupPageContent.tsx` (cofabri-website)

**Files:**
- Modify: `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website/src/app/signup/SignupPageContent.tsx`

**Interfaces:**
- Consumes: `getSignupState`/`getSignupCopy`/`SignupState` (Task 9); the real `betaCapacity`/`betaSpotsFilled` fields from `/api/apps/[id]` (Task 10); the `{ error: string }` 400 body from `/api/signup` (Task 11).
- Produces: the finished user-facing page. Nothing else in the plan consumes this file.

No test — no component-test convention in this repo (see Global Constraints). Verify with `npm run build` plus the manual browser check in Step 6.

- [ ] **Step 1: Update imports and the local `AppData` interface**

At the top of the file, add the import (after the `CoreLoader` import, line 9):

```typescript
import { getSignupState, getSignupCopy } from './signup-state';
```

Replace the `AppData` interface (lines 26-34) with:

```typescript
interface AppData {
  betaCapacity: number | null;
  betaSpotsFilled: number;
  status: string;
  name: string;
  betaStatements: BetaStatement[];
}
```

This drops `betaSpotsTotal`, `betaPrice`, and `betaDescription` — the first is renamed to match the API field (`betaCapacity`), and the other two were dead code (see Task 10's note: `betaDescription` was never rendered anywhere, and `betaPrice` was referenced in JSX but never populated by the route, so it silently always evaluated to `undefined`).

- [ ] **Step 2: Add submit-error state and update `handleSubmit`**

Add a new state declaration (after `const [isSubmitting, setIsSubmitting] = useState(false);`, line 47):

```typescript
  const [submitError, setSubmitError] = useState<string | null>(null);
```

Replace `handleSubmit` (lines 92-122) with:

```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Ensure interestLevel is included in the form data
      const submitData = {
        ...formData,
        interestLevel: interestLevel || 0
      };

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to submit form');
      }

      setShowThankYou(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
```

- [ ] **Step 3: Compute `state` and replace the hero spots panel**

Right after the `if (!hasAppId) { ... }` early return (after line 135, before the main `return`), add:

```typescript
  const state = appData ? getSignupState(appData) : null;
```

Replace the "Beta Spots Progress" block (lines 163-200) with:

```tsx
            {/* Beta Spots Progress — only shown once we have real capacity/filled
                numbers to display (the 'open' and 'full' states); every other
                state has no meaningful numbers to show here. */}
            {!isLoading && state && (state.kind === 'open' || state.kind === 'full') && (
              <div className="max-w-md mx-auto bg-card rounded-2xl p-6 shadow-lg mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Beta Spots Remaining</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {Math.max(state.capacity - state.filled, 0)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((state.filled / state.capacity) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {state.kind === 'full' ? (
                    <span className="text-danger font-medium">All spots are filled</span>
                  ) : state.remaining < 10 ? (
                    <span className="text-danger font-medium">Hurry! Only {state.remaining} spots left!</span>
                  ) : (
                    `${state.filled} people have already joined`
                  )}
                </p>
              </div>
            )}
```

- [ ] **Step 4: Gate the form vs. a closed/unavailable block**

Replace the ternary that currently switches only on `showThankYou` (`{showThankYou ? ( ... ) : ( <div className="bg-white/10 ...">...form...</div> )}`, lines 271-421) with this three-way branch: thank-you, then the form (for `legacy-waitlist`/`open`/still-loading), then a closed/unavailable block for everything else. The thank-you JSX and the form's internal fields are carried over unchanged from the original file — only the branching condition changes and a `submitError` message is added just before `</form>`:

```tsx
                  {showThankYou ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HeartIcon className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Thank You!</h3>
                      <p className="text-muted-foreground">
                        We&apos;ve received your submission and will keep you updated on our progress.
                      </p>
                    </div>
                  ) : !state || state.kind === 'legacy-waitlist' || state.kind === 'open' ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 lg:p-12 border border-white/20">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Join the {appData?.name} Waitlist</h2>
                        <p className="text-muted-foreground">Fill out the form below to secure your spot on our waitlist. We&apos;ll notify you as soon as we&apos;re ready to launch.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                              First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              required
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                              Last Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              required
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email Address <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            placeholder="you@company.com"
                          />
                        </div>

                        {/* Interest Level Selector */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            How interested are you? <span className="text-danger">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleInterestLevel(level)}
                                className="p-2 hover:scale-110 transition-transform"
                              >
                                <StarIcon
                                  className={`w-8 h-8 ${
                                    level <= (interestLevel || 0)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          {!interestLevel && (
                            <p className="mt-1 text-sm text-danger">Please select your interest level</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="quote" className="block text-sm font-medium text-foreground mb-1">
                            How much would you pay monthly? <span className="text-danger">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <CurrencyDollarIcon className="h-5 w-5 text-ink-faint" />
                            </div>
                            <input
                              type="number"
                              id="quote"
                              name="quote"
                              required
                              min="0"
                              step="1"
                              value={formData.quote}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                              placeholder="Enter amount"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="statement" className="block text-sm font-medium text-foreground mb-1">
                            Beta Statement (Optional)
                          </label>
                          <textarea
                            id="statement"
                            name="statement"
                            value={formData.statement}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[100px]"
                            placeholder="Share why you're excited about this beta"
                          />
                          <p className="mt-1 text-sm text-muted-foreground">
                            If approved, your statement will appear on this waitlist page
                          </p>
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !interestLevel}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <>
                              <CoreLoader size={16} tone="inverted" />
                              Submitting...
                            </>
                          ) : (
                            'Join Waitlist'
                          )}
                        </Button>
                        {submitError && (
                          <p className="text-sm text-danger text-center" role="alert">{submitError}</p>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {(() => {
                        const { title, body } = getSignupCopy(state, appData?.name ?? 'this app');
                        return (
                          <>
                            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
                            <p className="text-muted-foreground mb-6">{body}</p>
                          </>
                        );
                      })()}
                      <Button asChild>
                        <Link href="/apps">Explore our apps</Link>
                      </Button>
                    </div>
                  )}
```

Note the two blank-line gap that used to separate the heading block from the `<form>` tag in the original file (a leftover empty JSX gap, lines 287-289 of the original) is dropped here as a trivial whitespace cleanup — it rendered nothing and has no visual effect either way.

- [ ] **Step 5: Add the `Link` import**

Add to the imports at the top of the file (after the `CoreLoader` import, alongside the `signup-state` import from Step 1):

```typescript
import Link from 'next/link';
```

- [ ] **Step 6: Build, then manually verify all 5 states in the browser**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully with no type errors.

Run: `npm run dev`, then in the browser check `/signup?appId=<id>` for:
1. An app with `status: 'In Development'` — form shows exactly as before (no spots panel, no change in behavior).
2. A `Beta` app with `beta_capacity` unset — "aren't open yet" block, no form.
3. A `Beta` app with `beta_capacity: 0` — "closed" block, no form.
4. A `Beta` app with `beta_capacity` set and `beta_spots_filled >= beta_capacity` — spots panel shows 0 remaining, "full" block, no form.
5. A `Beta` app with room — spots panel with a real remaining count, form visible and submittable.

(Since the migration from Task 1 is intentionally not applied to any live database as part of this plan, states 2-5 will need to be checked either against a local/staging Supabase instance where the migration *has* been applied by hand, or by temporarily stubbing `getApp`'s return value — use whichever is available; note in your task completion which method you used.)

- [ ] **Step 7: Run the full test suite one more time**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test`
Expected: PASS (all files, including Tasks 7-9's new/updated tests)

- [ ] **Step 8: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/app/signup/SignupPageContent.tsx
git commit -m "feat: render all 5 beta signup states and surface submission errors"
```
