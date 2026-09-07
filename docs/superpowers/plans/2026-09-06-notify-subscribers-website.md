# Notify Subscribers (Website) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-service-row "Notify me about updates" widget on `/status` with one modal, reachable from `/status`, `/changelog`, and `/roadmaps`, that lets a visitor pick any number of apps and either or both notification kinds ("Product updates" / "Incident & status alerts") in one submission.

**Architecture:** `src/app/api/changelog-subscribe/route.ts`'s body shape and forwarded payload change from single-app to multi-app + dual-kind, matching cofabri-api's already-updated endpoint (sibling plan, must ship first). A new `NotifyMeModal` + `NotifyMeButton` (built on the existing, currently-unused `src/components/ui/dialog.tsx`) replaces `ChangelogSubscribeWidget` entirely and is added to all three pages.

**Tech Stack:** Next.js App Router, Vitest, Cloudflare Turnstile, Zod.

**Spec:** `../../../../cofabri-core/docs/superpowers/specs/2026-09-06-notify-subscribers-design.md`

**Depends on:** the sibling `cofabri-api` plan must be deployed first — this repo's proxy route forwards to its new endpoint shape.

## Global Constraints

- The modal replaces `ChangelogSubscribeWidget` entirely — no per-row inline widget remains on `/status`.
- At least one app and at least one notify-kind checkbox must be checked before submit is enabled.
- Default checked kind: "Incident & status alerts" when opened from `/status`; "Product updates" when opened from `/changelog` or `/roadmaps`.
- The app checklist uses whichever `apps`/`appNames` list each page already fetches server-side (which already excludes retired apps via `getApps()`) — no new fetch, no new filtering logic.
- One Turnstile verification covers the whole multi-app, multi-kind submission — unchanged from today's single-Turnstile-per-submit behavior.

---

## File Structure

- `src/lib/validation/schemas.ts` (modify) — `changelogSubscribeSchema` becomes multi-app, dual-kind
- `src/app/api/changelog-subscribe/route.ts` (modify) — forward the new shape
- `src/app/api/changelog-subscribe/route.test.ts` (modify)
- `src/components/marketing/NotifyMeModal.tsx` (new)
- `src/components/marketing/NotifyMeButton.tsx` (new)
- `src/components/marketing/ChangelogSubscribeWidget.tsx` (delete)
- `src/components/marketing/StatusPageContent.tsx` (modify) — remove per-row widget, add button to hero
- `src/app/changelog/page.tsx` (modify) — pass `apps` list through
- `src/app/changelog/ChangelogContent.tsx` (modify) — accept `apps`, render button in toolbar
- `src/app/roadmaps/page.tsx` (modify) — pass `apps` list through
- `src/app/roadmaps/RoadmapsContent.tsx` (modify) — accept `apps`, render button in toolbar

---

### Task 1: Update the subscribe schema and proxy route

**Files:**
- Modify: `src/lib/validation/schemas.ts` (`changelogSubscribeSchema`, ~lines 132-140)
- Modify: `src/app/api/changelog-subscribe/route.ts`
- Modify: `src/app/api/changelog-subscribe/route.test.ts`

**Interfaces:**
- Produces: `changelogSubscribeSchema` parses `{ appIds: string[], email: string, notifyUpdates: boolean, notifyIncidents: boolean }` (camelCase — Zod-side, matching this file's existing convention; the route maps to cofabri-api's snake_case body). `POST /api/changelog-subscribe` forwards `{ app_ids, email, notify_updates, notify_incidents }` to cofabri-api. Task 2 (the modal) is this schema's only real caller.

- [ ] **Step 1: Read `schemas.ts` around `changelogSubscribeSchema` and the full `route.ts`/`route.test.ts` files**

Already read in full during planning — re-read only if line numbers seem to have shifted.

- [ ] **Step 2: Update the schema**

Replace:
```ts
export const changelogSubscribeSchema = z.object({
  appId: z.string().trim().min(1, 'App is required'),
  email: emailField,
});
```
with:
```ts
export const changelogSubscribeSchema = z
  .object({
    appIds: z.array(z.string().trim().min(1)).min(1, 'Select at least one app'),
    email: emailField,
    notifyUpdates: z.boolean(),
    notifyIncidents: z.boolean(),
  })
  .refine((data) => data.notifyUpdates || data.notifyIncidents, {
    message: 'Select at least one notification type',
    path: ['notifyUpdates'],
  });
```

- [ ] **Step 3: Rewrite the existing route tests for the new body shape**

In `src/app/api/changelog-subscribe/route.test.ts`, update every `request({ appId: 'medoura', email: ..., turnstileToken: ... })` call to `request({ appIds: ['medoura'], email: ..., notifyUpdates: true, notifyIncidents: false, turnstileToken: ... })`, and update the one assertion on the forwarded body:

```ts
expect(JSON.parse(forwardInit.body)).toEqual({ app_ids: ['medoura'], email: 'a@b.com', notify_updates: true, notify_incidents: false })
```

Add these new cases (matching the file's existing `vi.stubGlobal('fetch', ...)` style exactly):

```ts
  it('rejects an empty appIds array with a specific message', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: [], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects when neither notifyUpdates nor notifyIncidents is true', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: false, notifyIncidents: false, turnstileToken: 'dev-token' }))
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('forwards multiple app ids in one request', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })))
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura', 'rx-bridge'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: true, turnstileToken: 'dev-token' }))
    expect(res.status).toBe(200)
    const [, forwardInit] = vi.mocked(fetch).mock.calls[1] as [string, { body: string }]
    expect(JSON.parse(forwardInit.body)).toEqual({ app_ids: ['medoura', 'rx-bridge'], email: 'a@b.com', notify_updates: true, notify_incidents: true })
  })
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run src/app/api/changelog-subscribe/route.test.ts`
Expected: FAIL — the route still reads `parsed.data.appId` (singular) and the schema doesn't yet accept the new shape.

- [ ] **Step 5: Update the route**

Change the forwarding line:
```ts
        body: JSON.stringify({ app_id: parsed.data.appId, email: parsed.data.email }),
```
to:
```ts
        body: JSON.stringify({
          app_ids: parsed.data.appIds,
          email: parsed.data.email,
          notify_updates: parsed.data.notifyUpdates,
          notify_incidents: parsed.data.notifyIncidents,
        }),
```

No other changes are needed in this file — the Turnstile verification block above it is unchanged (still one token per request, regardless of app count).

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/app/api/changelog-subscribe/route.test.ts`
Expected: PASS (all tests, old and new)

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation/schemas.ts src/app/api/changelog-subscribe/route.ts src/app/api/changelog-subscribe/route.test.ts
git commit -m "feat: multi-app, dual-kind changelog-subscribe schema and proxy route"
```

---

### Task 2: `NotifyMeModal` + `NotifyMeButton`

**Files:**
- Create: `src/components/marketing/NotifyMeModal.tsx`
- Create: `src/components/marketing/NotifyMeButton.tsx`
- Test: `src/components/marketing/NotifyMeModal.test.tsx` (if this repo has any existing component-level Vitest + Testing Library tests — check for a precedent, e.g. search for `@testing-library/react` in `package.json` and any existing `*.test.tsx` under `src/components`; if none exist, this component is validated manually in Task 3 instead, matching this codebase's existing convention of not unit-testing presentational form components — `ChangelogSubscribeWidget.tsx` itself had no dedicated test file either)

**Interfaces:**
- Produces: `NotifyMeButton({ apps, defaultKind }: { apps: { id: string; name: string }[]; defaultKind: 'updates' | 'incidents' })` — renders a trigger + the modal. This is the only exported component the three pages need.

- [ ] **Step 1: Read `src/components/ui/dialog.tsx`, `Turnstile.tsx`, and the old `ChangelogSubscribeWidget.tsx` in full**

All three already read in full during planning — re-read to confirm no drift before writing against them.

- [ ] **Step 2: Check for an existing component-test precedent**

Run: `grep -r "@testing-library/react" package.json` and `find src/components -name "*.test.tsx"`. If both come back empty, skip the dedicated test file for this task (per the Files note above) and rely on Task 3's manual verification. If a precedent exists, write tests matching its exact setup before implementing (validation: submit disabled with zero apps/zero kinds selected; enabled once one of each is checked; calls `fetch('/api/changelog-subscribe', ...)` with the right body on submit).

- [ ] **Step 3: Implement `NotifyMeModal.tsx`**

```tsx
'use client';

import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Turnstile from './Turnstile';

interface NotifyMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: { id: string; name: string }[];
  defaultKind: 'updates' | 'incidents';
}

function getTurnstileSiteKey(): string | undefined {
  if (process.env.NODE_ENV === 'development') {
    return '1x00000000000000000000AA';
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export default function NotifyMeModal({ open, onOpenChange, apps, defaultKind }: NotifyMeModalProps) {
  const emailInputId = useId();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [notifyUpdates, setNotifyUpdates] = useState(defaultKind === 'updates');
  const [notifyIncidents, setNotifyIncidents] = useState(defaultKind === 'incidents');
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleApp = (id: string) => {
    setSelectedAppIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSubmit = selectedAppIds.length > 0 && (notifyUpdates || notifyIncidents) && email.length > 0 && !!turnstileToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setStatus('error');
      setErrorMessage('Please complete the security verification.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/changelog-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appIds: selectedAppIds, email, notifyUpdates, notifyIncidents, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
        // Turnstile tokens are single-use -- a failed submit leaves the widget
        // showing "verified" even though the token is now dead, so clear it
        // to force a fresh challenge (same convention ChangelogSubscribeWidget used).
        setTurnstileToken('');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to subscribe. Please try again.');
      setTurnstileToken('');
    }
  };

  const resetAndClose = () => {
    onOpenChange(false);
    // Reset after the close animation would otherwise show a flash of the
    // pristine form; a short delay isn't worth the complexity here since the
    // dialog unmounts its content anyway on next open in most Radix setups --
    // if a flash is visible in manual testing, revisit with a delayed reset.
    setStatus('idle');
    setSelectedAppIds([]);
    setEmail('');
    setTurnstileToken('');
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get notified</DialogTitle>
          <DialogDescription>Pick which apps and what kind of updates you want in your inbox.</DialogDescription>
        </DialogHeader>
        {status === 'success' ? (
          <p className="text-sm text-success" role="status" aria-live="polite">
            Check your email to confirm your subscription.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Apps</p>
              <div className="space-y-1">
                {apps.map((app) => (
                  <label key={app.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedAppIds.includes(app.id)} onChange={() => toggleApp(app.id)} />
                    {app.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Notify me about</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyUpdates} onChange={(e) => setNotifyUpdates(e.target.checked)} />
                Product updates
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyIncidents} onChange={(e) => setNotifyIncidents(e.target.checked)} />
                Incident &amp; status alerts
              </label>
            </div>
            <div className="space-y-2">
              <label htmlFor={emailInputId} className="text-sm font-medium">
                Email address
              </label>
              <input
                id={emailInputId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-border px-3 py-2 text-sm"
              />
            </div>
            {getTurnstileSiteKey() && (
              <Turnstile
                siteKey={getTurnstileSiteKey()!}
                onVerify={setTurnstileToken}
                onError={() => {
                  setTurnstileToken('');
                  setStatus('error');
                  setErrorMessage('Security verification failed. Please try again.');
                }}
                onExpire={() => {
                  setTurnstileToken('');
                  setStatus('error');
                  setErrorMessage('Security verification expired. Please try again.');
                }}
                theme="light"
                size="normal"
              />
            )}
            {status === 'error' && (
              <p className="text-sm text-danger" role="status" aria-live="polite">
                {errorMessage}
              </p>
            )}
            <Button type="submit" disabled={!canSubmit || status === 'submitting'}>
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

Note: the inline `onError`/`onExpire` arrow functions above intentionally deviate from `ChangelogSubscribeWidget.tsx`'s `useCallback`-memoized handlers. Re-check `Turnstile.tsx`'s effect dependency array (read in Step 1) — if it still depends on `onError`/`onExpire` by reference, these inline functions will reset the widget on every keystroke in the email field, exactly the bug `ChangelogSubscribeWidget.tsx`'s comment warns about. If so, wrap both in `useCallback(() => {...}, [])` (import `useCallback` from `react`) before finalizing, matching that file's exact pattern.

- [ ] **Step 4: Implement `NotifyMeButton.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import NotifyMeModal from './NotifyMeModal';

interface NotifyMeButtonProps {
  apps: { id: string; name: string }[];
  defaultKind: 'updates' | 'incidents';
  label?: string;
}

export default function NotifyMeButton({ apps, defaultKind, label = 'Notify me' }: NotifyMeButtonProps) {
  const [open, setOpen] = useState(false);
  if (apps.length === 0) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <NotifyMeModal open={open} onOpenChange={setOpen} apps={apps} defaultKind={defaultKind} />
    </>
  );
}
```

- [ ] **Step 5: Run the repo's existing test suite to confirm nothing broke**

Run: `npx vitest run`
Expected: PASS (these are new files with no existing consumers yet, so this should be a no-op check).

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing/NotifyMeModal.tsx src/components/marketing/NotifyMeButton.tsx
git commit -m "feat: add NotifyMeModal and NotifyMeButton (multi-app, dual-kind subscribe)"
```

---

### Task 3: Wire into `/status`, remove the old widget

**Files:**
- Modify: `src/components/marketing/StatusPageContent.tsx`
- Delete: `src/components/marketing/ChangelogSubscribeWidget.tsx`

**Interfaces:**
- Consumes: `NotifyMeButton` (Task 2), `apps: App[]` (already a prop of `StatusPageContentProps`).

- [ ] **Step 1: Remove the per-row widget**

In `ServiceRow`, delete:
```tsx
      {service.appId && (
        <div className="mt-2">
          <ChangelogSubscribeWidget appId={service.appId} />
        </div>
      )}
```
and the now-unused `import ChangelogSubscribeWidget from './ChangelogSubscribeWidget';` line.

- [ ] **Step 2: Add the button to the page hero**

`apps: App[]` is already a prop of `StatusPageContent` (see `StatusPageContentProps`). Add the button into `PageHero`'s `right` slot, alongside the existing refresh countdown:

```tsx
      <PageHero
        eyebrow="Status"
        title={allOperational ? 'All systems operational.' : `${openIncidents.length} active ${openIncidents.length === 1 ? 'incident' : 'incidents'}.`}
        subtitle="Live status for every CoFabri service. Updated automatically, and by a human when something needs saying."
        right={
          <div className="flex items-center gap-4">
            <NotifyMeButton apps={apps.map((app) => ({ id: app.id, name: app.name }))} defaultKind="incidents" />
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-faint">
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Refreshes in {formatCountdown(secondsUntilRefresh)}
            </div>
          </div>
        }
      />
```

Add `import NotifyMeButton from './NotifyMeButton';` alongside the other marketing-component imports at the top of the file.

- [ ] **Step 3: Delete the old widget file**

```bash
git rm src/components/marketing/ChangelogSubscribeWidget.tsx
```

- [ ] **Step 4: Run the build and existing test suite**

Run: `npx vitest run` then `npm run build`
Expected: both succeed — the build step in particular catches any stale import of the deleted file.

- [ ] **Step 5: Manually verify in the dev server**

Run: `npm run dev`, open `/status`, confirm: no per-row "Notify me" links remain, a "Notify me" button appears near the top next to the refresh countdown, clicking it opens the modal with "Incident & status alerts" pre-checked, apps listed, and (in dev) the Turnstile test widget renders.

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing/StatusPageContent.tsx
git commit -m "feat: replace per-app notify widget with NotifyMeButton on /status"
```

---

### Task 4: Wire into `/changelog` and `/roadmaps`

**Files:**
- Modify: `src/app/changelog/page.tsx`
- Modify: `src/app/changelog/ChangelogContent.tsx`
- Modify: `src/app/roadmaps/page.tsx`
- Modify: `src/app/roadmaps/RoadmapsContent.tsx`

**Interfaces:**
- Consumes: `NotifyMeButton` (Task 2). Both `page.tsx` files already fetch the full `apps` array before deriving `appNames` — this task just also passes a slimmed `{id, name}[]` through.

- [ ] **Step 1: Update `changelog/page.tsx`**

After the existing `const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));` line, add:
```ts
const notifyApps = apps.map((a) => ({ id: a.id, name: a.name }));
```
and pass it to `ChangelogContent`:
```tsx
<ChangelogContent initialShipped={shipped} initialAppNames={appNames} notifyApps={notifyApps} />
```

- [ ] **Step 2: Update `ChangelogContent.tsx`**

Add to `ChangelogContentProps`:
```ts
  notifyApps: { id: string; name: string }[];
```
and to the destructured props:
```ts
export default function ChangelogContent({ initialShipped, initialAppNames, notifyApps }: ChangelogContentProps) {
```

Add the button to the toolbar row (the `<div className="mt-11 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">` block, which currently has only one child — the filter-pill `<div>`):

```tsx
      <div className="mt-11 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
        <div className="flex flex-wrap gap-2">
          {/* ...existing filter pills unchanged... */}
        </div>
        <NotifyMeButton apps={notifyApps} defaultKind="updates" />
      </div>
```

Add `import NotifyMeButton from '@/components/marketing/NotifyMeButton';` at the top.

- [ ] **Step 3: Update `roadmaps/page.tsx`**

Same change as Step 1, passing `notifyApps` to `RoadmapsContent`.

- [ ] **Step 4: Update `RoadmapsContent.tsx`**

Same change as Step 2: add `notifyApps` to `RoadmapsContentProps` and the destructured props, import `NotifyMeButton`, and read this file's own toolbar-row JSX (it may differ slightly in structure from `ChangelogContent.tsx`'s — read it first) to find the right `justify-between` row to add the button to; if no such row exists in this file, add one directly below `PageHero`, matching `ChangelogContent.tsx`'s spacing convention (`mt-11`).

- [ ] **Step 5: Run the build and test suite**

Run: `npx vitest run` then `npm run build`
Expected: both succeed.

- [ ] **Step 6: Manually verify in the dev server**

Run: `npm run dev`, open `/changelog` and `/roadmaps`, confirm a "Notify me" button appears in each toolbar row with "Product updates" pre-checked when opened.

- [ ] **Step 7: Commit**

```bash
git add src/app/changelog/page.tsx src/app/changelog/ChangelogContent.tsx src/app/roadmaps/page.tsx src/app/roadmaps/RoadmapsContent.tsx
git commit -m "feat: add NotifyMeButton to /changelog and /roadmaps"
```
