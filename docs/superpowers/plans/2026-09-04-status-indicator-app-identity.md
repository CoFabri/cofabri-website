# Status Indicator App Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text string matching (app name vs. incident `application`/`affectedServices`) with a real `app_id` relationship, so app status indicators reflect a declared identity instead of a fuzzy name/domain guess.

**Architecture:** `support_cases` (the incidents table) gains an `is_platform_wide` flag; the existing-but-unused `support_case_applications` join table gets populated by both the automated poller and the manual admin UI. cofabri-core's public feed shapes these into `affectedAppIds`/`isPlatformWide` on each incident. cofabri-api needs **no code changes** — `getStatusFeed()` is a byte-for-byte proxy of cofabri-core's response, so the new fields flow through automatically. cofabri-website's three consumers (plus a shared helper and an app-detail page found during planning) switch from string matching to checking `affectedAppIds`/`isPlatformWide`.

**Tech Stack:** Next.js (cofabri-core dashboard, cofabri-website), Supabase/Postgres, vanilla JS (embeddable widget). cofabri-core tests use Node's built-in test runner (`tsx --test`); cofabri-website tests use Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-status-indicator-app-identity-design.md`

## Global Constraints

- No changes to `cofabri-api` — confirmed during planning that `getStatusFeed()` (`src/services/WebContentService.js`) is a pure passthrough of cofabri-core's `/api/public/status` response with no field allow-list, so new fields reach the website automatically. (`WebContentService.getPublicStatusFeed(appId)`, used by the separate `/web/content/status` and `/web/content/status/:app` routes, queries `support_cases.app_id` directly and is **not** called by cofabri-website anywhere — it's dead code from the website's perspective and is intentionally left untouched by this plan.)
- `affected_services` (free-text infra names) stays as display-only copy on every incident — never remove it, never read it for matching once this ships.
- New fields default to safe values (`affectedAppIds: []`, `isPlatformWide: false`) at every layer, so a case predating this feature (or a mid-rollout deploy skew) degrades to "shows on the platform row only," never a crash or a wrongly-matched app.
- cofabri-core test files are added to the explicit file list in `package.json`'s `test:unit` script — it is not glob-based. Only add an entry there for a genuinely new test file (not when only editing an existing one).
- Follow existing patterns exactly where one already exists for the operation you're doing (e.g. the feed drawer's delete-then-insert join-table sync in `app/dashboard/system-status/page.tsx`, the `pollOne` write-error accumulation pattern in `poll.ts`).

---

### Task 1: `cofabri-core` — `is_platform_wide` column + generated types

**Files:**
- Create: `supabase/migrations/20260908100000_add_support_cases_is_platform_wide.sql`
- Modify: `types/database.ts:7774` (Row), `:7825` (Insert), `:7876` (Update) — insert `is_platform_wide` alphabetically between `id` and `issue_ticket_id` in all three shapes of the `support_cases` table type

**Interfaces:**
- Produces: `support_cases.is_platform_wide` column (`boolean not null default false`), and `Database["public"]["Tables"]["support_cases"]["Row"/"Insert"/"Update"]` all gaining `is_platform_wide` — every later task in this plan that touches `support_cases` typing depends on this.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260908100000_add_support_cases_is_platform_wide.sql
-- Part of the app-identity status-matching redesign (see
-- docs/superpowers/specs/2026-09-04-status-indicator-app-identity-design.md
-- in cofabri-website). True means "show on every app's status indicator,"
-- independent of any support_case_applications rows — for incidents like a
-- shared Supabase/API outage that isn't scoped to specific apps.

alter table public.support_cases
  add column if not exists is_platform_wide boolean not null default false;

comment on column public.support_cases.is_platform_wide is
  'True means this incident shows on every app''s public status indicator, regardless of support_case_applications rows.';
```

- [ ] **Step 2: Apply the migration to the local/dev Supabase project**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx supabase db push`
Expected: migration `20260908100000_add_support_cases_is_platform_wide` applied with no errors.

- [ ] **Step 3: Update `types/database.ts` to match**

In the `support_cases` `Row` type (around line 7774), insert alphabetically between `id: string` and `issue_ticket_id: string | null`:

```typescript
          is_platform_wide: boolean
```

In the `Insert` type (around line 7825), insert between `id?: string` and `issue_ticket_id?: string | null`:

```typescript
          is_platform_wide?: boolean
```

In the `Update` type (around line 7876), insert in the same alphabetical position:

```typescript
          is_platform_wide?: boolean
```

- [ ] **Step 4: Typecheck**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add supabase/migrations/20260908100000_add_support_cases_is_platform_wide.sql types/database.ts
git commit -m "$(cat <<'EOF'
feat: add support_cases.is_platform_wide for app-identity status matching

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 2: `cofabri-core` — shape `affectedAppIds`/`isPlatformWide` in the public feed

**Files:**
- Modify: `lib/system-status/public-feed.ts`
- Test: `lib/system-status/public-feed.test.ts`

**Interfaces:**
- Consumes: `support_cases.is_platform_wide` (Task 1), the existing `support_case_applications(support_case_id, app_id)` join table.
- Produces: `PublicStatusIncident.affectedAppIds: string[]` and `PublicStatusIncident.isPlatformWide: boolean` — cofabri-website's Task 6 reads these off the JSON response by the same field names.

- [ ] **Step 1: Write the failing tests**

Add to `lib/system-status/public-feed.test.ts`. First, extend `makeFakeSupabase` to support a `support_case_applications` table and an `is_platform_wide` field on `FakeCase`:

```typescript
// Add to the FakeCase interface:
  is_platform_wide: boolean

// Add to makeCase's defaults:
    is_platform_wide: false,

// Add an `appLinks` option to makeFakeSupabase's options type:
    appLinks?: Array<{ support_case_id: string; app_id: string }>

// Inside makeFakeSupabase, after `const history = options.history ?? []`:
  const appLinks = options.appLinks ?? []

// Inside client.from(table), add a new branch alongside the existing
// "monitored_services" and "support_cases" branches:
      if (table === "support_case_applications") {
        return {
          select: (_columns: string) => ({
            in(_column: string, caseIds: string[]) {
              return Promise.resolve({
                data: appLinks.filter((l) => caseIds.includes(l.support_case_id)),
                error: null,
              })
            },
          }),
        }
      }
```

Then add these tests:

```typescript
test("getPublicStatusFeed attaches affectedAppIds from support_case_applications, grouped by case", async () => {
  const client = makeFakeSupabase({
    services: [makeService()],
    cases: [
      makeCase({ id: "case-a", monitored_service_id: "s1" }),
      makeCase({ id: "case-b", monitored_service_id: "s1" }),
    ],
    appLinks: [
      { support_case_id: "case-a", app_id: "medoura" },
      { support_case_id: "case-a", app_id: "praxis" },
      { support_case_id: "case-b", app_id: "praxis" },
    ],
  })

  const feed = await getPublicStatusFeed(client as never)

  const caseA = feed.incidents.find((i) => i.ticketId === "case-a")
  const caseB = feed.incidents.find((i) => i.ticketId === "case-b")
  assert.deepEqual(caseA?.affectedAppIds, ["medoura", "praxis"])
  assert.deepEqual(caseB?.affectedAppIds, ["praxis"])
})

test("getPublicStatusFeed defaults affectedAppIds to an empty array when a case has no app links", async () => {
  const client = makeFakeSupabase({
    services: [makeService()],
    cases: [makeCase({ id: "unlinked-case", monitored_service_id: "s1" })],
  })

  const feed = await getPublicStatusFeed(client as never)

  assert.deepEqual(feed.incidents[0].affectedAppIds, [])
})

test("getPublicStatusFeed passes through is_platform_wide, defaulting to false", async () => {
  const client = makeFakeSupabase({
    services: [makeService()],
    cases: [
      makeCase({ id: "wide", monitored_service_id: "s1", is_platform_wide: true }),
      makeCase({ id: "scoped", monitored_service_id: "s1", is_platform_wide: false }),
    ],
  })

  const feed = await getPublicStatusFeed(client as never)

  assert.equal(feed.incidents.find((i) => i.ticketId === "wide")?.isPlatformWide, true)
  assert.equal(feed.incidents.find((i) => i.ticketId === "scoped")?.isPlatformWide, false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test lib/system-status/public-feed.test.ts`
Expected: FAIL — `affectedAppIds`/`isPlatformWide` are `undefined` on the returned incidents (the shaping code doesn't produce them yet).

- [ ] **Step 3: Implement**

In `lib/system-status/public-feed.ts`:

Add `is_platform_wide` to `caseColumns` (line 71-72):

```typescript
  const caseColumns =
    "id, issue_ticket_id, subject, public_status, severity, message, created_at, updated_at, resolved_date, affected_services, app_id, updates, monitored_service_id, is_platform_wide"
```

After `cases` is computed (after line 111, before the `incidents = cases.map(...)` block), add the join-table lookup:

```typescript
  const caseIds = cases.map((c) => c.id)
  const { data: appLinkRows, error: appLinkError } = caseIds.length
    ? await supabase.from("support_case_applications").select("support_case_id, app_id").in("support_case_id", caseIds)
    : { data: [], error: null }
  if (appLinkError) throw new Error(appLinkError.message)
  const appIdsByCase = new Map<string, string[]>()
  for (const row of appLinkRows ?? []) {
    const existing = appIdsByCase.get(row.support_case_id) ?? []
    existing.push(row.app_id)
    appIdsByCase.set(row.support_case_id, existing)
  }
```

Add the two new fields to the `PublicStatusIncident` interface:

```typescript
export interface PublicStatusIncident {
  ticketId: string
  title: string
  publicStatus: string
  severity: string
  message: string
  "Created Date": string
  "Updated At": string
  "Resolved Date": string
  affectedServices: string[]
  application: string
  updates: string
  isThirdParty: boolean
  affectedAppIds: string[]
  isPlatformWide: boolean
}
```

Add the two fields to the `incidents = cases.map((c) => ({ ... }))` shaping (after `isThirdParty`):

```typescript
    isThirdParty: c.monitored_service_id !== null,
    affectedAppIds: appIdsByCase.get(c.id) ?? [],
    isPlatformWide: c.is_platform_wide ?? false,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test lib/system-status/public-feed.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones).

- [ ] **Step 5: Typecheck**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add lib/system-status/public-feed.ts lib/system-status/public-feed.test.ts
git commit -m "$(cat <<'EOF'
feat: shape affectedAppIds/isPlatformWide into the public status feed

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 3: `cofabri-core` — poller populates `support_case_applications`

**Files:**
- Modify: `lib/system-status/poll.ts`
- Test: `lib/system-status/poll.test.ts`

**Interfaces:**
- Consumes: `monitored_service_apps(monitored_service_id, app_id)` joined to `apps(app_id, app_name)` (already exists).
- Produces: `support_case_applications` rows for every poll-sourced incident, kept in sync (delete-then-insert) on every poll — Task 2's `public-feed.ts` reads these.

- [ ] **Step 1: Write the failing tests**

In `lib/system-status/poll.test.ts`, update the `linkedApps` option's shape (it currently only carries `app_name`) and the `monitored_service_apps` mock to also carry `app_id`:

```typescript
// Change the makeFakeSupabase options type:
    linkedApps?: Array<{ monitored_service_id: string; app_id: string; app_name: string }>

// Change the "monitored_service_apps" branch's row mapping:
                const rows = linkedApps
                  .filter((row) => row.monitored_service_id === serviceId)
                  .map((row) => ({ apps: { app_id: row.app_id, app_name: row.app_name } }))
```

Update the existing test `"pollMonitoredServices includes linked apps' names in affected_services alongside the provider name"` to give its fixtures an `app_id`:

```typescript
    linkedApps: [
      { monitored_service_id: service.id, app_id: "medoura", app_name: "Medoura" },
      { monitored_service_id: service.id, app_id: "rx-bridge", app_name: "Rx-Bridge" },
    ],
```

Add a `support_case_applications` branch to the fake client, and track its calls:

```typescript
// Add to makeFakeSupabase's local state:
  const supportCaseApplicationDeletes: string[] = []
  const supportCaseApplicationInserts: Array<{ support_case_id: string; app_id: string }> = []

// Add a branch inside client.from(table):
      if (table === "support_case_applications") {
        return {
          delete() {
            return {
              eq(_column: string, caseId: string) {
                supportCaseApplicationDeletes.push(caseId)
                return Promise.resolve({ error: null })
              },
            }
          },
          insert(values: Array<{ support_case_id: string; app_id: string }>) {
            supportCaseApplicationInserts.push(...values)
            return Promise.resolve({ error: null })
          },
        }
      }

// Add both arrays to makeFakeSupabase's return object:
  return { client, monitoredUpdates, supportCaseUpserts, supportCaseResolves, supportCases, statusSamples, supportCaseApplicationDeletes, supportCaseApplicationInserts }
```

Add a new test:

```typescript
test("pollMonitoredServices links the upserted incident to its dependent apps via support_case_applications", async () => {
  const service = makeService()
  const { client, supportCaseApplicationDeletes, supportCaseApplicationInserts } = makeFakeSupabase({
    linkedApps: [
      { monitored_service_id: service.id, app_id: "medoura", app_name: "Medoura" },
      { monitored_service_id: service.id, app_id: "rx-bridge", app_name: "Rx-Bridge" },
    ],
  })
  const fakeFetch = async () =>
    new Response(
      JSON.stringify({
        status: { indicator: "minor" },
        incidents: [
          {
            id: "abc123",
            name: "Elevated latency",
            status: "investigating",
            impact: "minor",
            created_at: "2026-09-01T10:00:00.000Z",
            resolved_at: null,
            incident_updates: [{ body: "Investigating elevated latency." }],
          },
        ],
      })
    )

  await pollMonitoredServices([service], fakeFetch, client as never)

  assert.deepEqual(supportCaseApplicationDeletes, ["case-1"])
  assert.deepEqual(supportCaseApplicationInserts, [
    { support_case_id: "case-1", app_id: "medoura" },
    { support_case_id: "case-1", app_id: "rx-bridge" },
  ])
})

test("pollMonitoredServices does not insert support_case_applications rows for a service with no linked apps", async () => {
  const service = makeService()
  const { client, supportCaseApplicationDeletes, supportCaseApplicationInserts } = makeFakeSupabase()
  const fakeFetch = async () =>
    new Response(
      JSON.stringify({
        status: { indicator: "minor" },
        incidents: [
          {
            id: "abc123",
            name: "Elevated latency",
            status: "investigating",
            impact: "minor",
            created_at: "2026-09-01T10:00:00.000Z",
            resolved_at: null,
            incident_updates: [{ body: "Investigating elevated latency." }],
          },
        ],
      })
    )

  await pollMonitoredServices([service], fakeFetch, client as never)

  assert.deepEqual(supportCaseApplicationDeletes, ["case-1"])
  assert.deepEqual(supportCaseApplicationInserts, [])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test lib/system-status/poll.test.ts`
Expected: FAIL — `supportCaseApplicationDeletes`/`supportCaseApplicationInserts` stay empty (poll.ts doesn't write to that table yet), and the updated `monitored_service_apps` mock shape may also break the existing affected-services test until Step 3 lands.

- [ ] **Step 3: Implement**

In `lib/system-status/poll.ts`, replace the linked-apps block (lines 152-166):

```typescript
    // Apps tagged as depending on this service (via "Manage Feeds") get their names
    // included in affected_services alongside the provider's own name (display copy
    // only), and their app_ids synced into support_case_applications below (the real
    // signal the public per-app status widget matches against).
    const { data: linkedAppRows, error: linkedAppsError } = await supabase
      .from("monitored_service_apps")
      .select("apps(app_id, app_name)")
      .eq("monitored_service_id", service.id)
    if (linkedAppsError) {
      writeErrors.push(`Failed to fetch linked apps: ${linkedAppsError.message}`)
    }
    const linkedApps = (linkedAppRows ?? [])
      .map((row) => row.apps as unknown as { app_id: string; app_name: string } | null)
      .filter((app): app is { app_id: string; app_name: string } => Boolean(app))
    const linkedAppIds = linkedApps.map((app) => app.app_id)
    const affectedServices = [service.name, ...linkedApps.map((app) => app.app_name)]
```

Then, inside the incident upsert loop, replace the success branch (currently just `applySupportCaseRule`) so it also syncs `support_case_applications`:

```typescript
      if (upsertError) {
        writeErrors.push(`Failed to upsert support_cases (${incident.externalIncidentId}): ${upsertError.message}`)
      } else {
        incidentsUpserted++

        // Replace the app links wholesale rather than diffing — same approach as the
        // dashboard's monitored_service_apps sync — poll.ts is the only writer of this
        // junction for poll-sourced incidents.
        const { error: unlinkError } = await supabase
          .from("support_case_applications")
          .delete()
          .eq("support_case_id", upsertedCase.id)
        if (unlinkError) {
          writeErrors.push(`Failed to clear app links (${incident.externalIncidentId}): ${unlinkError.message}`)
        } else if (linkedAppIds.length > 0) {
          const { error: linkError } = await supabase
            .from("support_case_applications")
            .insert(linkedAppIds.map((appId) => ({ support_case_id: upsertedCase.id, app_id: appId })))
          if (linkError) {
            writeErrors.push(`Failed to link apps (${incident.externalIncidentId}): ${linkError.message}`)
          }
        }

        try {
          await applySupportCaseRule(supabase, upsertedCase)
        } catch (taskError) {
          writeErrors.push(
            `Failed to apply support case task rule (${incident.externalIncidentId}): ${taskError instanceof Error ? taskError.message : "unknown error"}`
          )
        }
      }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test lib/system-status/poll.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Typecheck**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add lib/system-status/poll.ts lib/system-status/poll.test.ts
git commit -m "$(cat <<'EOF'
feat: sync poll-sourced incidents' app links into support_case_applications

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 4: `cofabri-core` — admin UI: app multi-select + platform-wide toggle

**Files:**
- Modify: `app/dashboard/system-status/page.tsx`

**Interfaces:**
- Consumes: `apps` state (`AppOption[]`, already fetched at line 138), the `support_case_applications` table (Task 1/2).
- Produces: manually-reported incidents get real `support_case_applications` rows and `is_platform_wide`, same as poll-sourced ones from Task 3.

No test file — this codebase has no React/DOM test setup (`npm test` is a no-op placeholder here); JSX/state changes are verified with `npm run typecheck` and a manual dashboard check, matching the existing convention for this repo (see `docs/superpowers/plans/2026-09-04-beta-signup-spot-capacity.md`).

- [ ] **Step 1: Extend form state**

In the `form` state (line 67-75) and `emptyIncidentForm` (line 303-311), add two fields to both:

```typescript
    appIds: [] as string[],
    isPlatformWide: false,
```

- [ ] **Step 2: Add a toggle helper**

After `toggleAffectedService` (line 294-301), add:

```typescript
  const toggleIncidentApp = (appId: string) => {
    setForm((prev) => ({
      ...prev,
      appIds: prev.appIds.includes(appId) ? prev.appIds.filter((id) => id !== appId) : [...prev.appIds, appId],
    }))
  }
```

- [ ] **Step 3: Load existing app links when editing an incident**

Replace `openEditIncident` (line 319-335) so it fetches the incident's current app links and becomes async, matching `openEditFeed`'s existing pattern (line 105-119):

```typescript
  const openEditIncident = async (supportCase: SupportCase) => {
    setEditingCase(supportCase)
    const { data: linkedApps } = await supabase
      .from("support_case_applications")
      .select("app_id")
      .eq("support_case_id", supportCase.id)
    setForm({
      subject: supportCase.subject,
      description: supportCase.description ?? "",
      message: supportCase.message ?? "",
      severity: supportCase.severity ?? "medium",
      public_status: supportCase.public_status ?? "investigating",
      is_public: supportCase.public_status !== null,
      // affected_services stores names, not ids (see poll.ts) — map back to whichever
      // current services match by name so re-saving doesn't silently drop them.
      affectedServiceIds: services
        .filter((s) => supportCase.affected_services?.includes(s.name))
        .map((s) => s.id),
      appIds: (linkedApps ?? []).map((row) => row.app_id),
      isPlatformWide: supportCase.is_platform_wide,
    })
    setDrawerOpen(true)
  }
```

- [ ] **Step 4: Save app links and the platform-wide flag**

Replace `handleSaveIncident` (line 337-374):

```typescript
  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const affectedNames = services.filter((s) => form.affectedServiceIds.includes(s.id)).map((s) => s.name)
    const payload = {
      subject: form.subject,
      description: form.description,
      message: form.message || form.description,
      severity: form.severity as Database["public"]["Enums"]["support_severity"],
      priority: form.severity,
      status: form.public_status === "resolved" ? "resolved" : "in_progress",
      // NULL public_status means "private" — excluded from the public status API.
      public_status: form.is_public ? (form.public_status as Database["public"]["Enums"]["support_public_status"]) : null,
      // Saving here — even to leave it private — counts as staff having reviewed it,
      // so it must drop out of the pending-review queue rather than have the
      // safety-net sweep later overwrite this decision with pending_public_status.
      confirm_by: null,
      monitored_service_id: form.affectedServiceIds[0] ?? null,
      affected_services: affectedNames,
      is_platform_wide: form.isPlatformWide,
    }
    const { data: savedCase, error } = editingCase
      ? await supabase.from("support_cases").update(payload).eq("id", editingCase.id).select("id").single()
      : await supabase
          .from("support_cases")
          .insert({
            ...payload,
            type: "internal_issue",
            source: "manual",
          } satisfies Database["public"]["Tables"]["support_cases"]["Insert"])
          .select("id")
          .single()
    if (error) {
      setSaving(false)
      toast({ title: `Error ${editingCase ? "updating" : "reporting"} incident`, description: error.message, variant: "destructive" })
      return
    }

    // Replace the app links wholesale rather than diffing — same approach as the
    // feed drawer's monitored_service_apps sync — this drawer is the only writer of
    // this junction for manually-reported incidents.
    const { error: unlinkError } = await supabase
      .from("support_case_applications")
      .delete()
      .eq("support_case_id", savedCase.id)
    if (unlinkError) {
      setSaving(false)
      toast({ title: "Incident saved, but clearing app links failed", description: unlinkError.message, variant: "destructive" })
      return
    }
    if (form.appIds.length > 0) {
      const { error: linkError } = await supabase
        .from("support_case_applications")
        .insert(form.appIds.map((appId) => ({ support_case_id: savedCase.id, app_id: appId })))
      if (linkError) {
        setSaving(false)
        toast({ title: "Incident saved, but linking apps failed", description: linkError.message, variant: "destructive" })
        return
      }
    }

    setSaving(false)
    toast({ title: editingCase ? "Incident updated" : "Incident reported" })
    setDrawerOpen(false)
    setEditingCase(null)
    setForm(emptyIncidentForm)
    loadData()
  }
```

- [ ] **Step 5: Add the UI controls**

In the incident `RecordDrawer` JSX, between the "Affected Services" block and the "Show on public status page" `Switch` (line 870-894), insert:

```tsx
        <div className="space-y-2">
          <Label>Affected Apps</Label>
          <p className="text-xs text-muted-foreground">
            Which apps show this incident on their public status indicator. Ignored when &quot;Affects all apps&quot; below is on.
          </p>
          <div className="space-y-2">
            {apps.map((app) => (
              <div key={app.app_id} className="flex items-center gap-2">
                <Checkbox
                  id={`incident-app-${app.app_id}`}
                  checked={form.appIds.includes(app.app_id)}
                  onCheckedChange={() => toggleIncidentApp(app.app_id)}
                  disabled={form.isPlatformWide}
                />
                <Label htmlFor={`incident-app-${app.app_id}`} className="font-normal">{app.app_name}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="incident-platform-wide"
            checked={form.isPlatformWide}
            onCheckedChange={(checked) => setForm({ ...form, isPlatformWide: checked, appIds: checked ? [] : form.appIds })}
          />
          <Label htmlFor="incident-platform-wide" className="font-normal">
            Affects all apps (shows on every app&apos;s status indicator)
          </Label>
        </div>
```

- [ ] **Step 6: Typecheck**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new errors.

- [ ] **Step 7: Manual verification**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run dev`, open `/dashboard/system-status`, click "Report Incident". Confirm:
- "Affected Apps" shows a checkbox per app.
- Checking "Affects all apps" clears and disables the app checkboxes.
- Saving an incident with two apps checked, then reopening it for edit, shows those same two apps still checked.
- Saving with "Affects all apps" on, then reopening, shows the toggle still on and no apps checked.

- [ ] **Step 8: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add app/dashboard/system-status/page.tsx
git commit -m "$(cat <<'EOF'
feat: let staff tag manual incidents with specific apps or platform-wide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 5: `cofabri-core` — one-time backfill script

**Files:**
- Create: `scripts/backfill-status-incident-app-links.ts`
- Test: `scripts/backfill-status-incident-app-links.test.ts`
- Modify: `package.json:12` (`test:unit` script — append the new test file path)

**Interfaces:**
- Consumes: `apps(app_id, app_name)`, `support_cases(id, app_id, affected_services, type)`, `support_case_applications(support_case_id, app_id)`.
- Produces: `matchAppIdsForCase(caseRow, apps): { appIds: string[]; isPlatformWide: boolean; unmatched: string[] }` — pure function, exported for the test below; not consumed by any other task.

- [ ] **Step 1: Write the failing tests**

```typescript
// scripts/backfill-status-incident-app-links.test.ts
import assert from "node:assert/strict"
import test from "node:test"
import { matchAppIdsForCase } from "./backfill-status-incident-app-links"

const APPS = [
  { app_id: "medoura", app_name: "Medoura" },
  { app_id: "praxis", app_name: "Praxis" },
]

test("matchAppIdsForCase matches affected_services names to app_id case-insensitively, reporting unmatched names", () => {
  const result = matchAppIdsForCase({ app_id: null, affected_services: ["Supabase", "Medoura"] }, APPS)
  assert.deepEqual(result.appIds, ["medoura"])
  assert.equal(result.isPlatformWide, false)
  assert.deepEqual(result.unmatched, ["Supabase"])
})

test("matchAppIdsForCase marks a case platform-wide when 'CoFabri API' appears, without treating it as an unmatched name", () => {
  const result = matchAppIdsForCase({ app_id: "CoFabri API", affected_services: [] }, APPS)
  assert.equal(result.isPlatformWide, true)
  assert.deepEqual(result.appIds, [])
  assert.deepEqual(result.unmatched, [])
})

test("matchAppIdsForCase dedupes an app matched via both app_id and affected_services", () => {
  const result = matchAppIdsForCase({ app_id: "Medoura", affected_services: ["medoura"] }, APPS)
  assert.deepEqual(result.appIds, ["medoura"])
})

test("matchAppIdsForCase returns no apps and no unmatched names for a case with nothing set", () => {
  const result = matchAppIdsForCase({ app_id: null, affected_services: null }, APPS)
  assert.deepEqual(result.appIds, [])
  assert.equal(result.isPlatformWide, false)
  assert.deepEqual(result.unmatched, [])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test scripts/backfill-status-incident-app-links.test.ts`
Expected: FAIL — `scripts/backfill-status-incident-app-links.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

```typescript
// scripts/backfill-status-incident-app-links.ts
//
// One-time backfill for the app-identity status-matching redesign (see
// docs/superpowers/specs/2026-09-04-status-indicator-app-identity-design.md
// in cofabri-website). Historical support_cases (type='internal_issue') rows
// have no support_case_applications rows and no is_platform_wide value —
// this maps their free-text affected_services/app_id strings to real app_ids
// via a case-insensitive, alphanumeric-only match against apps.app_name,
// mirroring the normalization the website's old string-matching code used.
// Not idempotent by design (skips cases that already have app links), not
// scheduled — a single snapshot run once during rollout.
//
// Run with: npx tsx scripts/backfill-status-incident-app-links.ts

import { readFileSync, existsSync } from "node:fs"
import { createAdminClient } from "@/lib/supabase/admin"

function loadDotEnvLocal() {
  const path = new URL("../.env.local", import.meta.url)
  if (!existsSync(path)) return
  const text = readFileSync(path, "utf8")
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadDotEnvLocal()

// Legacy sentinel some pre-migration-tracking rows used in place of a real
// app_id (see the special case this replaces in cofabri-website's
// api/status/[app]/route.ts and public/app-status-widget.js).
const PLATFORM_WIDE_SENTINEL = "CoFabri API"

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function matchAppIdsForCase(
  caseRow: { app_id: string | null; affected_services: string[] | null },
  apps: Array<{ app_id: string; app_name: string }>
): { appIds: string[]; isPlatformWide: boolean; unmatched: string[] } {
  const names = [...(caseRow.app_id ? [caseRow.app_id] : []), ...(caseRow.affected_services ?? [])]
  const isPlatformWide = names.some((name) => normalize(name) === normalize(PLATFORM_WIDE_SENTINEL))
  const appIds = new Set<string>()
  const unmatched: string[] = []
  for (const name of names) {
    if (normalize(name) === normalize(PLATFORM_WIDE_SENTINEL)) continue
    const match = apps.find((app) => normalize(app.app_name) === normalize(name))
    if (match) {
      appIds.add(match.app_id)
    } else {
      unmatched.push(name)
    }
  }
  return { appIds: [...appIds], isPlatformWide, unmatched }
}

async function main() {
  const supabase = createAdminClient()

  const { data: apps, error: appsError } = await supabase.from("apps").select("app_id, app_name")
  if (appsError) throw new Error(`Failed to read apps: ${appsError.message}`)

  const { data: cases, error: casesError } = await supabase
    .from("support_cases")
    .select("id, app_id, affected_services")
    .eq("type", "internal_issue")
  if (casesError) throw new Error(`Failed to read support_cases: ${casesError.message}`)

  const { data: existingLinks, error: existingLinksError } = await supabase
    .from("support_case_applications")
    .select("support_case_id")
  if (existingLinksError) throw new Error(`Failed to read support_case_applications: ${existingLinksError.message}`)
  const alreadyLinked = new Set((existingLinks ?? []).map((row) => row.support_case_id))

  let platformWideCount = 0
  let linkedCaseCount = 0
  let linkRowCount = 0
  const unmatchedReport: Array<{ caseId: string; names: string }> = []

  for (const caseRow of cases ?? []) {
    if (alreadyLinked.has(caseRow.id)) continue
    const { appIds, isPlatformWide, unmatched } = matchAppIdsForCase(caseRow, apps ?? [])

    if (isPlatformWide) {
      const { error: updateError } = await supabase
        .from("support_cases")
        .update({ is_platform_wide: true })
        .eq("id", caseRow.id)
      if (updateError) throw new Error(`Failed to mark case ${caseRow.id} platform-wide: ${updateError.message}`)
      platformWideCount++
    }

    if (appIds.length > 0) {
      const { error: insertError } = await supabase
        .from("support_case_applications")
        .insert(appIds.map((appId) => ({ support_case_id: caseRow.id, app_id: appId })))
      if (insertError) throw new Error(`Failed to link case ${caseRow.id} to apps: ${insertError.message}`)
      linkedCaseCount++
      linkRowCount += appIds.length
    }

    if (unmatched.length > 0) {
      unmatchedReport.push({ caseId: caseRow.id, names: unmatched.join(", ") })
    }
  }

  console.log(`Marked ${platformWideCount} case(s) is_platform_wide.`)
  console.log(`Linked ${linkedCaseCount} case(s) to apps (${linkRowCount} support_case_applications rows inserted).`)
  if (unmatchedReport.length > 0) {
    console.log(`${unmatchedReport.length} case(s) had a name that didn't match any app (left unmatched, for manual review):`)
    console.table(unmatchedReport)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error)
    process.exit(1)
  })
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx --test scripts/backfill-status-incident-app-links.test.ts`
Expected: PASS.

- [ ] **Step 5: Register the new test file**

In `package.json`, append `scripts/backfill-status-incident-app-links.test.ts` to the end of the `test:unit` script's file list (space-separated, same as every other entry).

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run test:unit`
Expected: PASS — the full suite still passes with the new file included.

- [ ] **Step 6: Typecheck**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npm run typecheck`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core"
git add scripts/backfill-status-incident-app-links.ts scripts/backfill-status-incident-app-links.test.ts package.json
git commit -m "$(cat <<'EOF'
feat: add one-time backfill for historical incident-app links

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

- [ ] **Step 8: Run it against the real database (once, during rollout — after Task 1's migration is applied there)**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-core" && npx tsx scripts/backfill-status-incident-app-links.ts`
Expected: prints counts of platform-wide cases marked and apps linked, plus a table of any unmatched names for manual review. This step is a one-time operational action, not part of the repeatable test suite — do not re-run it reflexively on later deploys.

---

### Task 6: `cofabri-website` — thread `affectedAppIds`/`isPlatformWide` through `airtable.ts`

**Files:**
- Modify: `src/lib/airtable.ts`
- Test: `src/lib/airtable.test.ts`

**Interfaces:**
- Consumes: the `affectedAppIds`/`isPlatformWide` fields on `/web/content/status-feed`'s `incidents[]` (Task 2, passed through cofabri-api unchanged).
- Produces: `SystemStatus.affectedAppIds: string[]` and `SystemStatus.isPlatformWide: boolean` — Task 7's `matchAppIncident` and Task 8's route both read these off `SystemStatus`.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/airtable.test.ts`, inside the `describe('getSystemStatus', ...)` block:

```typescript
  it('passes through affectedAppIds and isPlatformWide, defaulting to empty/false when missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        incidents: [
          { ticketId: 'T-1', publicStatus: 'Investigating', affectedAppIds: ['medoura'], isPlatformWide: false },
          { ticketId: 'T-2', publicStatus: 'Investigating' },
        ],
      }),
    });

    const { getSystemStatus } = await import('./airtable');
    const statuses = await getSystemStatus();

    expect(statuses[0].affectedAppIds).toEqual(['medoura']);
    expect(statuses[0].isPlatformWide).toBe(false);
    expect(statuses[1].affectedAppIds).toEqual([]);
    expect(statuses[1].isPlatformWide).toBe(false);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- airtable`
Expected: FAIL — `statuses[0].affectedAppIds` is `undefined`.

- [ ] **Step 3: Implement**

In `src/lib/airtable.ts`, add the two fields to the `SystemStatus` interface:

```typescript
export interface SystemStatus {
  ticketId: string;
  title: string;
  publicStatus: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  'Created Date': string;
  'Updated At': string;
  'Resolved Date': string;
  affectedServices: string[];
  application?: string;
  updates?: string;
  affectedAppIds: string[];
  isPlatformWide: boolean;
}
```

Add the two fields to the `StatusFeedResponse.incidents[]` shape:

```typescript
  incidents?: Array<{
    ticketId?: string;
    title?: string;
    publicStatus?: SystemStatus['publicStatus'];
    severity?: SystemStatus['severity'];
    message?: string;
    'Created Date'?: string;
    'Updated At'?: string;
    'Resolved Date'?: string;
    affectedServices?: string[];
    application?: string;
    updates?: string;
    affectedAppIds?: string[];
    isPlatformWide?: boolean;
  }>;
```

In `getSystemStatus()`'s mapping, add:

```typescript
        affectedServices: incident.affectedServices || [],
        application: incident.application || 'CoFabri System',
        updates: incident.updates || '',
        affectedAppIds: incident.affectedAppIds || [],
        isPlatformWide: incident.isPlatformWide || false,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- airtable`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/lib/airtable.ts src/lib/airtable.test.ts
git commit -m "$(cat <<'EOF'
feat: thread affectedAppIds/isPlatformWide through getSystemStatus

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 7: `cofabri-website` — `matchAppIncident` by `appId`, update its callers

**Files:**
- Modify: `src/lib/incident-display.ts`
- Test: `src/lib/incident-display.test.ts`
- Modify: `src/components/marketing/StatusPageContent.tsx`
- Modify: `src/app/apps/[id]/page.tsx:89`

**Interfaces:**
- Consumes: `SystemStatus.affectedAppIds`/`isPlatformWide` (Task 6), `App.id` (already equals cofabri-core's `apps.app_id`, per `mapApp` in `src/lib/api-client.ts:84`).
- Produces: `matchAppIncident(appId: string, statuses: SystemStatus[]): SystemStatus | undefined` — same exported name, changed first-parameter meaning (name → id). Both of its two callers are updated in this same task so there's no stale caller left mid-task.

- [ ] **Step 1: Write the failing tests**

Add a `describe('matchAppIncident', ...)` block to `src/lib/incident-display.test.ts` (this function currently has zero test coverage):

```typescript
import { incidentDotClasses, incidentPillClasses, severityPillClasses, mostSevereIncident, matchAppIncident } from './incident-display';

// ... (keep the existing `status` helper and describe blocks)

describe('matchAppIncident', () => {
  it('matches an incident whose affectedAppIds includes the given app id', () => {
    const incident = status({ publicStatus: 'Investigating', affectedAppIds: ['medoura'] });
    expect(matchAppIncident('medoura', [incident])).toBe(incident);
    expect(matchAppIncident('praxis', [incident])).toBeUndefined();
  });

  it('matches any app when the incident is platform-wide', () => {
    const incident = status({ publicStatus: 'Investigating', isPlatformWide: true, affectedAppIds: [] });
    expect(matchAppIncident('medoura', [incident])).toBe(incident);
  });

  it('ignores resolved incidents even if they would otherwise match', () => {
    const incident = status({ publicStatus: 'Resolved', affectedAppIds: ['medoura'] });
    expect(matchAppIncident('medoura', [incident])).toBeUndefined();
  });
});
```

Also update the existing `status()` test helper at the top of the file to satisfy the now-required `SystemStatus` fields:

```typescript
function status(overrides: Partial<SystemStatus> = {}): SystemStatus {
  return {
    ticketId: 't-1',
    title: 'Incident',
    publicStatus: 'Resolved',
    severity: 'Low',
    message: '',
    'Created Date': '',
    'Updated At': '',
    'Resolved Date': '',
    affectedServices: [],
    affectedAppIds: [],
    isPlatformWide: false,
    ...overrides,
  };
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- incident-display`
Expected: FAIL — `matchAppIncident('medoura', ...)` still checks `incident.application?.toLowerCase() === 'medoura'.toLowerCase()`, which doesn't match.

- [ ] **Step 3: Implement**

Replace `matchAppIncident` in `src/lib/incident-display.ts`:

```typescript
// Cross-references an app against open incidents by its declared app_id
// (SystemStatus.affectedAppIds / isPlatformWide), not free-text name/domain
// matching — pulled out here so the app detail page's status dot stays in
// sync with what /status itself shows, instead of re-implementing the match
// logic a second time.
export function matchAppIncident(appId: string, statuses: SystemStatus[]): SystemStatus | undefined {
  const open = statuses.filter((s) => s.publicStatus !== 'Resolved');
  return open.find((incident) => incident.isPlatformWide || incident.affectedAppIds.includes(appId));
}
```

In `src/app/apps/[id]/page.tsx:89`, change the caller to pass the app's id instead of its name:

```typescript
  const statusIncident = showStatusDot ? matchAppIncident(app.id, await getSystemStatus()) : undefined;
```

In `src/components/marketing/StatusPageContent.tsx`, replace the inline `matchIncident`/`platformIncident` logic (lines 213-249) so it reuses the shared helper instead of duplicating it:

```typescript
  // Cross-reference each app (and the platform as a whole) against open
  // incidents via matchAppIncident, which checks the incident's declared
  // affectedAppIds/isPlatformWide — see src/lib/incident-display.ts.
  const services = useMemo(() => {
    // Same best-effort case-insensitive name match as before — monitored_services
    // (cofabri-core) has no foreign key to an app record, just a free-text name, so
    // a service with no matching name here simply renders with no uptime bars
    // rather than a wrong match. (Out of scope for this change: see
    // docs/superpowers/specs/2026-09-04-status-indicator-app-identity-design.md.)
    const matchHistory = (name: string) => uptimeHistory.find((s) => s.name.toLowerCase() === name.toLowerCase());

    const appRows = apps.map((app) => ({
      name: app.name,
      incident: matchAppIncident(app.id, openIncidents),
      history: matchHistory(app.name)?.history ?? [],
    }));
    const platformIncident = openIncidents.find((incident) => incident.isPlatformWide);

    // Real monitored_services are shared infra (Supabase, Vercel, Stripe,
    // GoHighLevel, GitHub, ...), not per-app feeds — none of them will ever
    // match an app name. Anything not claimed by a specific app rolls up into
    // the platform row's bar, mirroring how an unattributed incident already
    // falls through to platformIncident above.
    const matchedServiceIds = new Set(
      apps.map((app) => matchHistory(app.name)?.id).filter((id): id is string => Boolean(id))
    );
    const platformHistory = mergeHistories(
      uptimeHistory.filter((s) => !matchedServiceIds.has(s.id)).map((s) => s.history)
    );

    return [
      ...appRows,
      { name: 'CoFabri Platform', incident: platformIncident, history: platformHistory },
    ];
  }, [apps, openIncidents, uptimeHistory]);
```

And add `matchAppIncident` to the existing import from `@/lib/incident-display` at the top of the file:

```typescript
import { incidentDotClasses, incidentPillClasses, matchAppIncident, mostSevereIncident, severityPillClasses } from '@/lib/incident-display';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- incident-display`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Build check (covers the two JSX callers, which have no test harness)**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully, no type errors in `StatusPageContent.tsx` or `apps/[id]/page.tsx`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/lib/incident-display.ts src/lib/incident-display.test.ts src/components/marketing/StatusPageContent.tsx src/app/apps/[id]/page.tsx
git commit -m "$(cat <<'EOF'
feat: match app status by declared app_id instead of free-text name

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 8: `cofabri-website` — `/api/status/[app]` route matches by `app_id`

**Files:**
- Modify: `src/app/api/status/[app]/route.ts`

**Interfaces:**
- Consumes: `SystemStatus.affectedAppIds`/`isPlatformWide` (Task 6). `resolvedParams.app` (the URL slug) is expected to equal an `apps.app_id` value, matching how this route is actually invoked today (`/api/status/medoura`, etc.).

No test file — this route has no existing test harness (route handlers aren't part of this repo's Vitest convention); verified with a build check plus a manual request.

- [ ] **Step 1: Implement**

Replace the `relevantStatuses` filter (lines 42-71):

```typescript
    // Filter statuses to only include those affecting this app: platform-wide
    // incidents always show, plus anything specifically tagged with this app_id.
    const relevantStatuses = allStatuses.filter((status: SystemStatus) => {
      return status.isPlatformWide || status.affectedAppIds.includes(appSlug);
    });
```

- [ ] **Step 2: Build check**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully.

- [ ] **Step 3: Manual verification**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run dev`, then visit `http://localhost:3000/api/status/medoura` in a browser. Confirm it still returns the widget HTML with an operational (green) dot when there are no open Medoura incidents.

- [ ] **Step 4: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add src/app/api/status/[app]/route.ts
git commit -m "$(cat <<'EOF'
feat: match /api/status/[app] incidents by app_id instead of name strings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

### Task 9: `cofabri-website` — embeddable widget matches by `app_id`; delete the dead `domains` field

**Files:**
- Modify: `public/app-status-widget.js`
- Modify: `src/lib/api-client.ts`

**Interfaces:**
- Consumes: `affectedAppIds`/`isPlatformWide` on the JSON `/api/status` already returns (Task 6, passed through unchanged by `src/app/api/status/route.ts`).

No test file — `app-status-widget.js` is a plain static script with no build/test step in this repo; verified with a manual browser check. `api-client.ts`'s change is a pure deletion with existing test coverage that doesn't reference the removed field (confirmed during planning: no test in `api-client.test.ts` touches `domains`).

- [ ] **Step 1: Implement the widget matching change**

In `public/app-status-widget.js`, replace `filterStatusesForApp` (lines 118-139):

```javascript
  // Filter statuses for specific app: platform-wide incidents always show,
  // plus anything specifically tagged with this app's id (appSlug).
  function filterStatusesForApp(allStatuses, appSlug) {
    return allStatuses.filter(status => {
      return Boolean(status.isPlatformWide) || (Array.isArray(status.affectedAppIds) && status.affectedAppIds.includes(appSlug));
    });
  }
```

Leave `getAppSlug()`'s domain-based fallback untouched — it answers "whose widget is this embed," not "which incidents apply," and stays out of scope for this change (see the design spec's scope decisions).

- [ ] **Step 2: Delete the dead `domains` field**

In `src/lib/api-client.ts`, remove `domains?: string;` from the `App` interface (line 37) and remove `domains: undefined,` from `mapApp` (line 102).

- [ ] **Step 3: Run the existing api-client tests**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm test -- api-client`
Expected: PASS — no test references the removed field.

- [ ] **Step 4: Build check**

Run: `cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website" && npm run build`
Expected: builds successfully (confirms nothing else references `App.domains`).

- [ ] **Step 5: Manual verification**

Create a scratch HTML file that loads `app-status-widget.js` with `data-app="medoura"`, open it in a browser, and confirm the dot renders (green when no open Medoura incident exists). This can be deleted after checking.

- [ ] **Step 6: Commit**

```bash
cd "/Users/noahstahl/Desktop/CoFabri App Development/cofabri-website"
git add public/app-status-widget.js src/lib/api-client.ts
git commit -m "$(cat <<'EOF'
feat: match embeddable status widget by app_id; drop dead domains field

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017jcc28WugPxbSZB167rkty
EOF
)"
```

---

## Rollout order

Tasks are numbered in a safe deploy order (each independently deployable, per the spec):

1. Task 1 (migration) → 2. Task 2 (feed shaping) → 3. Task 3 (poller) → 4. Task 4 (admin UI) → 5. Task 5 (backfill script; run its Step 8 against the real database once cofabri-core's changes are deployed) → 6. Task 6 (website types) → 7. Task 7 (shared matcher + callers) → 8. Task 8 (route) → 9. Task 9 (widget + dead field cleanup).

Tasks 6-9 (cofabri-website) can deploy before or after Tasks 1-5 (cofabri-core) without breaking anything — `SystemStatus.affectedAppIds`/`isPlatformWide` default to `[]`/`false` whenever the upstream feed doesn't include them yet.
