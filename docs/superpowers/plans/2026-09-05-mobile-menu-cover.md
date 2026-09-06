# CoFabri Website Mobile Menu Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CoFabri corporate site's mobile nav — currently a Radix `Sheet` sliding in from the right — with a full-screen "cover" menu (pattern 3a/3b from the shared design spec), adapted to this site's actual nav (Apps/About/Roadmap/Knowledge Base/Support — there is no ecosystem switcher or partner sign-in here, since this *is* the parent site).

**Architecture:** Add a `"cover"` variant to the existing `SheetContent` primitive (`src/components/ui/sheet.tsx`) so the mobile menu keeps using Radix `Dialog` under the hood — free focus trap, `Escape`-to-close, and body-scroll-lock, all already provided by Radix, no hand-rolled `useEffect` needed (unlike the other three sites' plans, which don't have this primitive available). `Navbar.tsx`'s mobile block is rewritten to render the new cover content instead of the old right-drawer link list.

**Tech Stack:** Next.js 16.1.7 (App Router), React 18.3.1, Tailwind CSS v4 (CSS-first), Radix UI (`radix-ui` package) + `tailwindcss-animate`-style `data-[state=]` utilities (confirmed already in use by `sheet.tsx`), Vitest (`environment: 'node'`, logic-only, no component rendering) + Playwright e2e (`tests/e2e/*.spec.ts`).

**Spec:** `docs/superpowers/plans/2026-09-05-mobile-menu-cover-spec.md` (shared pattern spec — read it first). Note this site is explicitly called out there as the one that skips the ecosystem switcher and partner-sign-in sections, since neither exists on the parent corporate site.

## Global Constraints

- No new npm dependencies — Radix, Heroicons, and the existing `Button`/`StatusIndicator` components cover everything needed.
- Reuse the `ThemeToggle` function and `StatusIndicator` component already used in `Navbar.tsx` as-is; reuse `navigation` (the existing 5-item array) as the nav data — do not invent new links or an app-switcher.
- This site currently has no jsdom/`@testing-library/react` component-render tests (only `src/**/*.test.ts` logic tests and Playwright e2e under `tests/e2e/`) — follow that convention: verify this component's interactive behavior with a new Playwright spec, not a new unit-test harness.
- `Next.js 16.1.7` is also a pre-1.0-familiar-API version — check `node_modules/next/dist/docs/` for anything relevant before writing code (this repo has no `AGENTS.md` file calling this out explicitly like the other three repos do, but the Next.js major version is the same, so the same caution applies).
- Test runner: `npx vitest run` for unit tests; `npx playwright test` for e2e (builds and starts the app first, per `playwright.config.ts`).

---

### Task 1: Add a `"cover"` variant to `SheetContent`

**Files:**
- Modify: `src/components/ui/sheet.tsx`

**Interfaces:**
- Produces: `SheetContent`'s `side` prop type becomes `"top" | "right" | "bottom" | "left" | "cover"`; passing `side="cover"` renders the dialog content at `inset-0` (full viewport) with a fade transition instead of a slide, at `z-[60]` (above the sticky header's `z-50`).

- [ ] **Step 1: Modify `SheetContent`**

In `src/components/ui/sheet.tsx`, change the `side` prop's type and add a `"cover"` branch to the `cn(...)` call inside `SheetContent` (around lines 47-86):

```tsx
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left" | "cover"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          side === "cover" &&
            "z-[60] inset-0 h-full w-full data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-150 data-[state=open]:duration-200",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}
```

(Only the type union and the new `side === "cover" && "..."` line are new — everything else in the function is unchanged from the current file.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. This step has no test of its own — `side="cover"` is exercised by Task 2's e2e spec once it's wired into `Navbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sheet.tsx
git commit -m "feat: add a full-screen cover variant to SheetContent

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T9usogB2pthM2opYQMsdpt"
```

---

### Task 2: Rewrite `Navbar`'s mobile menu as a full-screen cover

**Files:**
- Modify: `src/components/marketing/Navbar.tsx`
- Create: `tests/e2e/mobile-menu.spec.ts`

**Interfaces:**
- Consumes: `SheetContent`'s new `side="cover"` (Task 1).
- Produces: no change to `Navbar`'s own exported API — `export default Navbar` still takes `{ logo: React.ReactNode }`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// tests/e2e/mobile-menu.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('mobile menu opens as a full-screen cover and closes via the close button', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Apps/ })).toHaveAttribute('href', '/apps');
  await expect(dialog.getByRole('link', { name: /About/ })).toHaveAttribute('href', '/about');
  await expect(dialog.getByRole('link', { name: /Roadmap/ })).toHaveAttribute('href', '/roadmaps');
  await expect(dialog.getByRole('link', { name: /Knowledge Base/ })).toHaveAttribute('href', '/knowledge-base');
  await expect(dialog.getByRole('link', { name: /Support/ })).toHaveAttribute('href', '/support');
  await expect(dialog.getByRole('link', { name: /Explore apps/ })).toHaveAttribute('href', '/apps');

  await dialog.getByRole('button', { name: 'Close menu' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('clicking a nav link inside the mobile menu navigates and closes it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: /About/ }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/mobile-menu.spec.ts`
Expected: FAIL — the current mobile menu has no `role="dialog"` content matching these link expectations at these hrefs the way this spec expects (or the "Close menu" button doesn't exist yet — the current `SheetContent`'s default close button is unlabeled `<span className="sr-only">Close</span>`, not "Close menu").

- [ ] **Step 3: Rewrite the mobile block in `Navbar.tsx`**

Add `XMarkIcon` to the existing `@heroicons/react/24/outline` import (line 7-10) and `SheetClose` to the existing `@/components/ui/sheet` import (line 12):

```tsx
import {
  Squares2X2Icon, ArrowTrendingUpIcon, BookOpenIcon, LifebuoyIcon, UserGroupIcon,
  Bars3Icon, XMarkIcon, SunIcon, MoonIcon, ComputerDesktopIcon, WindowIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
```

Replace the entire `<div className="flex items-center gap-2 lg:hidden">...</div>` block (current lines 114-145) with:

```tsx
<div className="flex items-center gap-2 lg:hidden">
  <StatusIndicator />
  <ThemeToggle />
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon" aria-label="Open menu">
        <Bars3Icon className="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent side="cover" showCloseButton={false} className="px-5 pt-6 pb-9">
      <SheetTitle className="sr-only">Menu</SheetTitle>

      <div className="flex items-center justify-between">
        <div className="flex items-center flex-shrink-0">{logo}</div>
        <SheetClose asChild>
          <button
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </SheetClose>
      </div>

      <nav className="mt-7 flex flex-col" aria-label="Primary">
        {navigation.map((item, i) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-baseline gap-3.5 py-3.5 text-foreground ${
              i < navigation.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="w-5 shrink-0 font-mono text-[10px] tracking-[.14em] text-accent">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[26px] font-semibold leading-[1.05] tracking-[-0.035em]">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <Link href="/apps" onClick={() => setOpen(false)}>
          <Button className="h-[54px] w-full rounded-[11px] text-[15px] font-semibold">
            Explore apps
          </Button>
        </Link>
      </div>
    </SheetContent>
  </Sheet>
</div>
```

Note what's intentionally different from the other three sites' plans: no ecosystem switcher grid (this site *is* the switcher's destination — "Explore apps" already covers that), no "Partner sign in" row (no such link exists on this site), and `StatusIndicator`/`ThemeToggle` stay in the always-visible collapsed bar exactly as before rather than moving inside the cover, since this site's cover only has one CTA and doesn't need a dedicated bottom-footer row for them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/mobile-menu.spec.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Run the full e2e suite for regressions**

Run: `npx playwright test`
Expected: PASS, including the existing `tests/e2e/homepage.spec.ts` (which navigates the same nav routes and checks the header/footer logo — unaffected by this change) and `tests/e2e/logo-regression.spec.ts` / `tests/e2e/contact-form.spec.ts`.

- [ ] **Step 6: Run unit tests for regressions**

Run: `npx vitest run`
Expected: PASS — this change touches no `src/**/*.test.ts` file.

- [ ] **Step 7: Commit**

```bash
git add src/components/marketing/Navbar.tsx tests/e2e/mobile-menu.spec.ts
git commit -m "feat: replace CoFabri site mobile nav drawer with full-screen cover menu

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T9usogB2pthM2opYQMsdpt"
```

---

### Task 3: Manual verification in the browser

- [ ] **Step 1:** Start the dev server: `npm run dev`
- [ ] **Step 2:** Open `/` in a mobile-width viewport (below `lg`) and open the hamburger menu.
- [ ] **Step 3:** Verify in **light mode**: the cover fills the screen, `CofabriLogo` + close button in the header row, five numbered nav links, a single "Explore apps" CTA pinned to the bottom.
- [ ] **Step 4:** Switch to **dark mode** via the theme toggle in the collapsed bar (still visible next to the hamburger) and confirm the cover's colors (all Tailwind `dark:`-aware tokens) flip correctly.
- [ ] **Step 5:** Confirm `Escape` closes the cover, clicking a link closes it and navigates, and Radix's built-in focus trap keeps `Tab` cycling inside the cover while it's open (this comes from Radix `Dialog` for free — verify it rather than assuming).
- [ ] **Step 6:** Confirm desktop nav (`≥1024px`) is unchanged, and that `StatusIndicator`/`ThemeToggle` still appear in the collapsed mobile bar exactly as before.
