# CoFabri Visual Refresh — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's ad-hoc, inconsistent styling with a real shadcn/ui design system (Tailwind v4, CoFabri's brand blue bound into tokens, Geist type, dark mode) and rebuild the two global chrome components (Navbar, Footer) on top of it — without touching any other page's content or layout.

**Architecture:** Migrate Tailwind 3→4 and consolidate the two drifted configs into one CSS-first `@theme` block in `globals.css`. Run `shadcn init` to scaffold `components.json` and install primitives into a cleaned-out `src/components/ui/`. Relocate the ~50 existing bespoke marketing components out of `ui/` into `src/components/marketing/` so `ui/` holds only real shadcn primitives going forward. Rebuild Navbar and Footer on the new primitives. Mechanically retire three legacy, site-wide effects the spec killed (dead button CSS, `SparkleButton`, `.animated-gradient-text`) everywhere they appear, since leaving them half-alive would violate the spec's own testing checklist — but without redesigning any of the pages they live on.

**Tech Stack:** Next.js 16 (App Router), React 18.3, Tailwind CSS v4, shadcn/ui (`new-york` style, `neutral` base), Radix UI, `next-themes`, `lucide-react`, `framer-motion`.

**Spec:** `docs/superpowers/specs/2026-09-01-visual-refresh-foundation-design.md`

## Global Constraints

- Brand primary color is `#007BFF` (light) / `#2B96FF` (dark) — bound to the `--primary` token, never hardcoded as `indigo-*`/`purple-*`/`blue-*` in new or touched code.
- Base radius is `0.625rem` (`--radius`); buttons `rounded-md`, cards `rounded-xl`.
- Font is Geist (sans) + Geist Mono (labels/eyebrows) via Google Fonts — no Poppins, no Inter.
- Every component touched in this plan must be responsive at mobile/tablet/desktop and respect `prefers-reduced-motion`.
- No page content, copy, or layout outside Navbar/Footer/global chrome may change in this plan. Where a legacy effect must be retired site-wide (see Tasks 9–10), the fix is a mechanical one-line swap, never a layout change.
- The spec's Motion section also names animated gradient blobs and the `AnimatedGradient`/aurora background as things to remove — but that component only appears inside `Hero.tsx` and `GradientHeading.tsx`, which are homepage/page content explicitly out of scope here. Removing it now would violate the constraint above, so it is deliberately **not** touched in this plan; retire it as part of whichever later phase restyles the homepage/apps/contact pages that render it.
- This repo has no test runner configured (`package.json` has no `test` script) — "run tests" in this plan means `npm run build` + `npm run lint` passing, plus the explicit grep/manual checks each task specifies. Do not introduce a new test framework as part of this plan.
- Every commit message in this plan must end with the attribution block already in use for this session (see git log for the exact trailer format already used on this branch).

---

## Task 1: Upgrade Tailwind CSS 3 → 4 and consolidate config

**Files:**
- Modify: `package.json`
- Modify: `postcss.config.js`
- Modify: `src/app/globals.css:1-5` (directives only)
- Delete: `tailwind.config.js`
- Delete: `tailwind.config.ts`

**Interfaces:**
- Produces: a working Tailwind v4 build with no JS config file — every later task's CSS lives in `globals.css`.

- [ ] **Step 1: Confirm the two existing configs are safe to delete**

Run: `grep -rn "animate-gradient-x\b" src --include="*.tsx"` and `grep -rn "gray-50\|gray-100\|gray-200\|gray-300\|gray-400\|gray-500\|gray-600\|gray-700\|gray-800\|gray-900" src/components/ui/*.tsx | wc -l`

Expected: no direct usage of the Tailwind-generated `animate-gradient-x` utility class (only the hand-written `.animate-gradient-x` CSS class at `globals.css:638` exists, which is plain CSS and unaffected by removing the config), and `tailwind.config.js`'s `gray` override is numerically identical to Tailwind's default gray scale (`#f9fafb` … `#111827`), so removing it changes nothing visually.

- [ ] **Step 2: Install Tailwind v4 and its PostCSS plugin**

Run: `npm install tailwindcss@latest @tailwindcss/postcss@latest`

- [ ] **Step 3: Replace the PostCSS config**

`postcss.config.js` — replace the entire file:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 4: Replace the Tailwind directives in globals.css**

`src/app/globals.css` — replace line 1-5:

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

with:

```css
@import "tailwindcss";
```

(The Poppins import is removed here permanently — Task 5 installs Geist. Do not add `@theme`/token content yet; that's Task 2.)

- [ ] **Step 5: Delete the two JS/TS configs**

```bash
git rm tailwind.config.js tailwind.config.ts
```

- [ ] **Step 6: Build and fix any v4 compatibility errors**

Run: `npm run build`

Tailwind v4 is largely backward-compatible with the `@apply`-based custom classes already in `globals.css` (touch-button system, markdown-content, hover-* utilities), but some utility names changed (e.g. default `ring` width, some `shadow-*` scale renames). If the build reports an unknown-utility error inside `globals.css`, consult the official Tailwind v4 upgrade guide for the renamed equivalent and fix in place — do not delete the surrounding rule. Expected: build succeeds with no Tailwind errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json postcss.config.js src/app/globals.css tailwind.config.js tailwind.config.ts
git commit -m "chore: upgrade Tailwind CSS to v4, remove duplicate configs"
```

---

## Task 2: Initialize shadcn/ui and define the token theme (light + dark)

**Files:**
- Create: `components.json`
- Modify: `src/app/globals.css` (append theme block after the `@import "tailwindcss";` line from Task 1)
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json` (add `next-themes`)

**Interfaces:**
- Produces: Tailwind color utilities `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, etc. — every later task styles with these, never with raw Tailwind palette colors (`gray-*`, `blue-*`, `indigo-*`) for anything token-driven.
- Produces: `<ThemeProvider>` wrapping the app, and the `.dark` class strategy that `next-themes` toggles on `<html>`.

- [ ] **Step 1: Install next-themes**

Run: `npm install next-themes`

- [ ] **Step 2: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Append the token theme to globals.css**

`src/app/globals.css` — insert immediately after `@import "tailwindcss";`:

```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: #FAFBFC;
  --foreground: #14171A;
  --card: #FFFFFF;
  --card-foreground: #14171A;
  --popover: #FFFFFF;
  --popover-foreground: #14171A;
  --primary: #007BFF;
  --primary-foreground: #FFFFFF;
  --secondary: #F3F5F7;
  --secondary-foreground: #14171A;
  --muted: #F3F5F7;
  --muted-foreground: #5B6472;
  --accent: #EAF3FF;
  --accent-foreground: #007BFF;
  --destructive: #D6482B;
  --destructive-foreground: #FFFFFF;
  --border: #E5E8EC;
  --input: #E5E8EC;
  --ring: #007BFF;
}

.dark {
  --background: #0B0D10;
  --foreground: #F2F4F6;
  --card: #14171C;
  --card-foreground: #F2F4F6;
  --popover: #14171C;
  --popover-foreground: #F2F4F6;
  --primary: #2B96FF;
  --primary-foreground: #06111F;
  --secondary: #111418;
  --secondary-foreground: #F2F4F6;
  --muted: #111418;
  --muted-foreground: #97A0AC;
  --accent: #12233A;
  --accent-foreground: #2B96FF;
  --destructive: #E97A62;
  --destructive-foreground: #06111F;
  --border: #262A31;
  --input: #262A31;
  --ring: #2B96FF;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
}
```

Do not touch the existing `@layer base { html { ... } h1,h2... { ... } body { ... } }` rule below this — Task 5 edits the `html` font-family line specifically; leave the rest (including the existing `body` background-gradient rule) untouched for now since it belongs to pages not in scope.

- [ ] **Step 4: Create the theme provider**

`src/components/theme-provider.tsx`:

```tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 5: Wrap the app in the provider**

`src/app/layout.tsx` — add the import near the other component imports:

```tsx
import { ThemeProvider } from "@/components/theme-provider";
```

Modify the `<html>`/`<body>` return block from:

```tsx
    <html lang="en">
      <head>
```

to:

```tsx
    <html lang="en" suppressHydrationWarning>
      <head>
```

and wrap everything currently inside `<body className={inter.className}>...</body>` with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`:

```tsx
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StructuredData
            type="organization"
            data={{
              "foundingDate": "2024",
              "industry": "Software Development",
              "numberOfEmployees": "10-50"
            }}
          />
          <StructuredData
            type="website"
            data={{
              "inLanguage": "en-US",
              "copyrightYear": new Date().getFullYear()
            }}
          />
          <Navbar />
          <SitewideBanner />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <MarketingPopupWrapper />
          <CookieConsent />
        </ThemeProvider>
      </body>
```

(`className={inter.className}` on `<body>` is replaced in Task 5, not here — leave it for now so this task's diff stays isolated to dark-mode wiring.)

- [ ] **Step 6: Build and manually verify dark mode**

Run: `npm run build`, then `npm run dev` and open the homepage. In the browser devtools, run `document.documentElement.classList.add('dark')` in the console — the page background should shift to near-black (`#0B0D10`) even though no component has been restyled yet, because `body`'s existing gradient rule sits on top of the raw `--background-start-rgb`/`--background-end-rgb` vars (untouched) rather than the new `--background` token; confirm this is expected (Navbar/Footer will visibly pick up the token in Tasks 7-8) and that no console errors appear from `next-themes`.

- [ ] **Step 7: Commit**

```bash
git add components.json src/app/globals.css src/app/layout.tsx src/components/theme-provider.tsx package.json package-lock.json
git commit -m "feat: initialize shadcn/ui token theme with light/dark mode"
```

---

## Task 3: Move bespoke components out of `src/components/ui/` into `src/components/marketing/`

**Files:**
- Move: all 50 files currently in `src/components/ui/` → `src/components/marketing/`
- Modify: every file importing from `@/components/ui/<Name>` for one of the moved names

**Interfaces:**
- Produces: `src/components/ui/` empty and reserved for real shadcn primitives (Task 4 populates it); every bespoke component now lives at `@/components/marketing/<Name>`.

- [ ] **Step 1: List the exact files moving (confirm against current directory)**

Run: `ls src/components/ui/`

Expected output (50 files): `About.tsx AirtableFormLoader.tsx Analytics.tsx AnimatedGradient.tsx AppCard.tsx AppPreviewCard.tsx Apps.tsx AppsCelebration.tsx AppsPageCelebration.tsx AppsScrollCelebration.tsx BackButton.tsx Breadcrumbs.tsx CTA.tsx CompactRoadmap.tsx Contact.tsx ContactForm.tsx CookieConsent.tsx ExpandableText.tsx FAQ.tsx FeaturedApp.tsx Features.tsx Footer.tsx GradientHeading.tsx Hero.tsx HomeContent.tsx HomepageApps.tsx KnowledgeBase.tsx KnowledgeBaseContent.tsx KnowledgeBaseSearch.tsx LiveChat.tsx Logo.tsx Navbar.tsx NewsletterSignup.tsx Partners.tsx ProductRoadmap.tsx RoadmapOverlay.tsx RoadmapPreviewCard.tsx SEOChecklist.tsx SEOOptimizer.tsx SectionHeading.tsx Services.tsx ShareButtons.tsx SitewideBanner.tsx SocialFeeds.tsx SparkleButton.tsx StatusIndicator.tsx StatusPageContent.tsx StructuredData.tsx SupportForm.tsx TestimonialPreviewCard.tsx Testimonials.tsx TouchButton.tsx TouchLink.tsx Turnstile.tsx`

If the list differs (a file was added/removed since this plan was written), adjust the array in Step 2 to match reality before proceeding.

- [ ] **Step 2: Move the files with git mv**

```bash
mkdir -p src/components/marketing
FILES=(About AirtableFormLoader Analytics AnimatedGradient AppCard AppPreviewCard Apps AppsCelebration AppsPageCelebration AppsScrollCelebration BackButton Breadcrumbs CTA CompactRoadmap Contact ContactForm CookieConsent ExpandableText FAQ FeaturedApp Features Footer GradientHeading Hero HomeContent HomepageApps KnowledgeBase KnowledgeBaseContent KnowledgeBaseSearch LiveChat Logo Navbar NewsletterSignup Partners ProductRoadmap RoadmapOverlay RoadmapPreviewCard SEOChecklist SEOOptimizer SectionHeading Services ShareButtons SitewideBanner SocialFeeds SparkleButton StatusIndicator StatusPageContent StructuredData SupportForm TestimonialPreviewCard Testimonials TouchButton TouchLink Turnstile)
for f in "${FILES[@]}"; do
  git mv "src/components/ui/${f}.tsx" "src/components/marketing/${f}.tsx"
done
```

- [ ] **Step 3: Rewrite every import referencing a moved component**

For each name in the same `FILES` array, rewrite `@/components/ui/<name>` to `@/components/marketing/<name>` repo-wide (this precise per-name loop avoids accidentally rewriting real shadcn imports like `@/components/ui/button` that Task 4 will add later):

```bash
for f in "${FILES[@]}"; do
  grep -rl "@/components/ui/${f}\"" src --include="*.tsx" --include="*.ts" | xargs -r sed -i '' "s#@/components/ui/${f}\"#@/components/marketing/${f}\"#g"
  grep -rl "@/components/ui/${f}'" src --include="*.tsx" --include="*.ts" | xargs -r sed -i '' "s#@/components/ui/${f}'#@/components/marketing/${f}'#g"
done
```

(Two passes handle both double- and single-quoted import strings. On Linux, drop the empty `''` after `-i`; on macOS, the `-i ''` above is required.)

- [ ] **Step 4: Verify no stale references remain**

Run: `grep -rn "@/components/ui/" src --include="*.tsx" --include="*.ts" | grep -v -E "@/components/ui/(button|card|badge|input|textarea|label|form|select|dialog|sheet|dropdown-menu|tabs|accordion|tooltip|separator|skeleton|sonner)"`

Expected: no output (every remaining `@/components/ui/` import refers to a shadcn primitive that Task 4 is about to install; anything else means Step 3's loop missed a file — fix it before continuing).

- [ ] **Step 5: Build**

Run: `npm run build`

Expected: succeeds (shadcn primitives referenced by nothing yet, so the only imports resolving are the ones just rewritten to `marketing/`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move bespoke components from components/ui to components/marketing"
```

---

## Task 4: Install shadcn primitive components

**Files:**
- Create: `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `form.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `accordion.tsx`, `tooltip.tsx`, `separator.tsx`, `skeleton.tsx`, `sonner.tsx` (all generated by the CLI — do not hand-author)

**Interfaces:**
- Produces: `Button`, `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Badge`, `Input`, `Textarea`, `Label`, `Select`, `Dialog`, `Sheet`/`SheetTrigger`/`SheetContent`, `DropdownMenu`, `Tabs`, `Accordion`, `Tooltip`, `Separator`, `Skeleton`, `Toaster`/`toast()` — imported from `@/components/ui/<name>` by Tasks 6-9.

- [ ] **Step 1: Install the primitives via the shadcn CLI**

Run: `npx shadcn@latest add button card badge input textarea label form select dialog sheet dropdown-menu tabs accordion tooltip separator skeleton sonner`

This installs the underlying `@radix-ui/react-*` packages it needs (some, like `react-dropdown-menu` and `react-slot`, are already dependencies) and writes each component file into `src/components/ui/`.

- [ ] **Step 2: Confirm nothing outside `ui/` was touched**

Run: `git status --short`

Expected: only new files under `src/components/ui/` (plus `package.json`/`package-lock.json` gaining the new Radix deps). If the CLI modified `globals.css` (some versions append a duplicate `@theme`/`:root` block), diff it against Task 2's block and remove any duplicate — keep the version from Task 2, since it already encodes CoFabri's brand colors.

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui package.json package-lock.json
git commit -m "feat: install shadcn/ui primitive components"
```

---

## Task 5: Replace Poppins/Inter with Geist site-wide

**Files:**
- Modify: `src/app/layout.tsx:1-16, 119`

**Interfaces:**
- Produces: `<body>` with the Geist font applied via the `--font-sans` CSS variable already wired in Task 2's `@theme inline` block (no new Tailwind class needed — `font-sans` now resolves to Geist).

- [ ] **Step 1: Remove the Inter import and usage**

`src/app/layout.tsx` — change:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
```

to:

```tsx
import type { Metadata } from "next";
import "./globals.css";
```

Remove the line `const inter = Inter({ subsets: ["latin"] });`.

- [ ] **Step 2: Stop applying Inter's className**

Change:

```tsx
      <body className={inter.className}>
```

to:

```tsx
      <body>
```

(The `@layer base { body { ... } }` rule in `globals.css` already applies `font-sans` via `body { @apply bg-background text-foreground font-sans; }` from Task 2 — no className needed here.)

- [ ] **Step 3: Confirm the Poppins import is gone**

Run: `grep -n "Poppins" src/app/globals.css`

Expected: no output (removed in Task 1, Step 4).

- [ ] **Step 4: Build and visually confirm**

Run: `npm run dev`, open the homepage, inspect a heading in devtools — computed `font-family` should start with `Geist`.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: replace Poppins/Inter with Geist site-wide"
```

---

## Task 6: Build the SectionHeading (eyebrow) and HairlineGrid primitives

**Files:**
- Create: `src/components/marketing/SectionHeading.tsx` (replaces the existing one from Task 3's move — same filename, new implementation)
- Create: `src/components/ui/hairline-grid.tsx`

**Interfaces:**
- Produces: `SectionHeading({ eyebrow?, title, subtitle?, className? })` and `HairlineGrid({ children, className? })` / `HairlineGridItem({ children, className? })` — for later page phases to consume; not wired into any page in this plan.

- [ ] **Step 1: Rewrite SectionHeading with the eyebrow pattern**

`src/components/marketing/SectionHeading.tsx` — replace the entire file:

```tsx
import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  extraContent?: React.ReactNode;
}

export default function SectionHeading({ eyebrow, title, subtitle, className = '', extraContent }: SectionHeadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="max-w-4xl mx-auto text-center px-4">
        {eyebrow && (
          <span className="font-mono text-xs uppercase tracking-wide text-primary font-semibold">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {extraContent}
      </div>
    </div>
  );
}
```

This removes `SectionHeading`'s `animated-gradient-text` usage as a side effect of the rewrite (its one occurrence from the Task-0 grep), satisfying part of Task 10.

- [ ] **Step 2: Create the HairlineGrid primitive**

`src/components/ui/hairline-grid.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export function HairlineGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid border-t border-l border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function HairlineGridItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-r border-b border-border p-6 sm:p-8 bg-card transition-colors hover:bg-muted', className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: succeeds. `SectionHeading`'s new `eyebrow` prop is optional, so existing call sites (which don't pass it) keep compiling.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/SectionHeading.tsx src/components/ui/hairline-grid.tsx
git commit -m "feat: add eyebrow SectionHeading and HairlineGrid primitives"
```

---

## Task 7: Rebuild Navbar on shadcn primitives

**Files:**
- Modify: `src/components/marketing/Navbar.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Button` (`@/components/ui/button`), `Sheet`/`SheetContent`/`SheetTrigger` (`@/components/ui/sheet`), `Logo` (`@/components/marketing/Logo`), `StatusIndicator` (`@/components/marketing/StatusIndicator`), `useTheme` (`next-themes`).
- Produces: no change to the component's public interface — still a default-exported, prop-less `<Navbar />` rendered once from `layout.tsx`.

- [ ] **Step 1: Rewrite Navbar.tsx**

`src/components/marketing/Navbar.tsx` — replace the entire file:

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Home, LayoutGrid, TrendingUp, BookOpen, LifeBuoy, Mail,
  Menu, Sun, Moon, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Logo from './Logo';
import StatusIndicator from './StatusIndicator';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Apps', href: '/apps', icon: LayoutGrid },
  { name: 'Roadmaps', href: '/roadmaps', icon: TrendingUp },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Support', href: '/support', icon: LifeBuoy },
  { name: 'Contact', href: '/contact', icon: Mail },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center flex-shrink-0">
          <Logo size="nav" noLink />
        </Link>

        <ul className="hidden lg:flex items-center gap-7 text-sm">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    isActive(item.href) ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-[15px] w-[15px]" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <StatusIndicator />
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/apps">
              Explore Apps
              <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <StatusIndicator />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-1 mt-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors ${
                        isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
```

Note: this drops the previous scroll-hide-on-homepage behavior in favor of a plain sticky header, matching the approved mockup. `TouchLink`/`TouchButton` are no longer imported here, but their files remain at `src/components/marketing/TouchButton.tsx` / `TouchLink.tsx` since `FAQ.tsx` (out of scope for this plan) still uses `TouchButton`.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds. If `sheet.tsx` doesn't export `SheetTitle`, re-run `npx shadcn@latest add sheet --overwrite` (recent shadcn `Sheet` requires a `SheetTitle` for accessibility even when visually hidden).

- [ ] **Step 3: Manual responsive + theme check**

Run: `npm run dev`, open the homepage.
- Resize the viewport across desktop (nav links visible), tablet, and mobile (~375px, hamburger + Sheet) widths — confirm no horizontal scroll and the Sheet opens/closes cleanly.
- Toggle the sun/moon button — background, text, and border colors should flip immediately with no flash of unstyled content.
- In devtools, enable "Emulate CSS prefers-reduced-motion: reduce" — confirm the Sheet's open/close and Button hover states still work without relying on any custom animation (shadcn's built-in transitions already respect this via Radix).

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Navbar.tsx
git commit -m "feat: rebuild Navbar on shadcn Button and Sheet primitives"
```

---

## Task 8: Rebuild Footer on the new tokens

**Files:**
- Modify: `src/components/marketing/Footer.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Logo` (`@/components/marketing/Logo`).
- Produces: no change to public interface — still a default-exported, prop-less `<Footer />`.

- [ ] **Step 1: Rewrite Footer.tsx**

`src/components/marketing/Footer.tsx` — replace the entire file:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, TrendingUp, BookOpen, ScrollText, LifeBuoy } from 'lucide-react';
import Logo from './Logo';

const navigation = {
  main: [
    { name: 'Apps', href: '/apps', icon: LayoutGrid },
    { name: 'Roadmaps', href: '/roadmaps', icon: TrendingUp },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
    { name: 'Legal', href: '/legal', icon: ScrollText },
    { name: 'Support', href: '/support', icon: LifeBuoy },
  ],
  social: [
    {
      name: 'X',
      href: 'https://x.com/noah_maven_x',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/meetayden',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/maven-x-co',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border py-9">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-5 flex-wrap">
        <Link href="/" className="flex items-center">
          <Logo size="footer" />
        </Link>

        <ul className="flex items-center gap-5 flex-wrap text-sm">
          {navigation.main.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {navigation.social.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <div className="w-full mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CoFabri by{' '}
          <Link href="https://mavenx.co" className="font-medium text-foreground hover:text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            Maven X LLC
          </Link>
          . All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

(Copyright year switches from the hardcoded `2025` to `new Date().getFullYear()` — a correctness fix that falls out of the rewrite, not a new content decision.)

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual responsive + theme check**

Run: `npm run dev`. Resize desktop → mobile — the link row/social icons/copyright should wrap cleanly with no overlap. Toggle dark mode — border, link, and hover-to-primary colors should flip correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Footer.tsx
git commit -m "feat: rebuild Footer on shadcn tokens"
```

---

## Task 9: Retire dead button CSS and remove SparkleButton

**Files:**
- Modify: `src/app/globals.css` (delete `.btn-primary`, `.btn-secondary`, `.futuristic-button` + its pseudo-elements)
- Delete: `src/components/marketing/SparkleButton.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/components/marketing/AppCard.tsx`
- Modify: `src/components/marketing/AppPreviewCard.tsx`

**Interfaces:**
- Consumes: `Button` (`@/components/ui/button`) with `asChild` for the two `href`-based call sites.

- [ ] **Step 1: Delete the dead CSS**

`src/app/globals.css` — remove these two rules from `@layer components` (confirmed zero `.tsx` usages in Task 1, Step 1):

```css
  .btn-primary {
    @apply bg-[var(--accent)] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200;
  }
  
  .btn-secondary {
    @apply bg-[var(--secondary)] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200;
  }
```

And remove this whole block (it sits just after the `@layer components` closing brace, not inside a layer):

```css
  .futuristic-button {
  @apply px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold;
  @apply transition-all duration-300;
  @apply relative overflow-hidden;
  @apply border border-indigo-500/50;
  @apply shadow-lg shadow-indigo-500/20;
}

.futuristic-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.futuristic-button:hover::before {
  left: 100%;
}
```

- [ ] **Step 2: Swap the signup page's SparkleButton for shadcn Button**

`src/app/signup/page.tsx` — remove the import:

```tsx
import SparkleButton from '@/components/ui/SparkleButton';
```

Add:

```tsx
import { Button } from '@/components/ui/button';
```

Replace:

```tsx
                        <SparkleButton
                          type="submit"
                          disabled={isSubmitting || !interestLevel}
                          className="w-full bg-indigo-600 text-white rounded-lg py-3 px-6 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                        </SparkleButton>
```

with:

```tsx
                        <Button
                          type="submit"
                          disabled={isSubmitting || !interestLevel}
                          className="w-full"
                        >
                          {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                        </Button>
```

- [ ] **Step 3: Swap AppCard's SparkleButton**

`src/components/marketing/AppCard.tsx` — remove `import SparkleButton from './SparkleButton';`, add `import { Button } from '@/components/ui/button';` and `import Link from 'next/link';` if not already imported (check the top of the file — `Link` is likely already used for the "Visit App" branch just below).

Replace:

```tsx
            <SparkleButton
              href={`/signup?appId=${app.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Join Waitlist
            </SparkleButton>
```

with:

```tsx
            <Button asChild>
              <Link href={`/signup?appId=${app.id}`}>Join Waitlist</Link>
            </Button>
```

- [ ] **Step 4: Swap AppPreviewCard's SparkleButton**

`src/components/marketing/AppPreviewCard.tsx` — same pattern. Remove `import SparkleButton from './SparkleButton';`, add `import { Button } from '@/components/ui/button';`.

Replace:

```tsx
            <SparkleButton
              href={`/signup?appId=${app.id}`}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Join Waitlist
            </SparkleButton>
```

with:

```tsx
            <Button asChild>
              <Link href={`/signup?appId=${app.id}`}>Join Waitlist</Link>
            </Button>
```

- [ ] **Step 5: Delete SparkleButton.tsx**

```bash
git rm src/components/marketing/SparkleButton.tsx
```

- [ ] **Step 6: Verify no references remain**

Run: `grep -rn "SparkleButton\|btn-primary\|btn-secondary\|futuristic-button" src`

Expected: no output.

- [ ] **Step 7: Build**

Run: `npm run build`

Expected: succeeds (confetti components — `AppsCelebration.tsx`, `AppsPageCelebration.tsx`, `AppsScrollCelebration.tsx` — are untouched and keep working, per the spec's decision to keep confetti).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: remove SparkleButton and dead button CSS, use shadcn Button"
```

---

## Task 10: Retire the shimmering gradient-text utility

**Files:**
- Modify: `src/app/globals.css` (delete `.animated-gradient-text` from `@layer utilities`)
- Modify: `src/components/marketing/Hero.tsx`
- Modify: `src/components/marketing/GradientHeading.tsx`
- Modify: `src/components/marketing/KnowledgeBaseContent.tsx` (3 occurrences)
- Modify: `src/components/marketing/StatusPageContent.tsx`
- Modify: `src/components/marketing/ProductRoadmap.tsx`
- Modify: `src/components/marketing/SocialFeeds.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/apps/page.tsx`
- Modify: `src/app/knowledge-base/[slug]/page.tsx`

(`src/components/marketing/SectionHeading.tsx`'s occurrence was already removed by Task 6's rewrite.)

**Interfaces:**
- None — every change is a same-element className swap, no props or structure change.

- [ ] **Step 1: Delete the utility definition**

`src/app/globals.css` — remove from `@layer utilities`:

```css
  .animated-gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500;
    background-size: 200% auto;
    animation: gradient 3s ease infinite;
  }
```

- [ ] **Step 2: Swap every call site**

Each row is the exact current line and its replacement (`text-foreground` is the only addition; every other class on the element is unchanged):

| File | Current | Replace with |
|---|---|---|
| `src/components/marketing/Hero.tsx:25` | `<h1 className="text-4xl md:text-6xl font-bold mb-6 animated-gradient-text">` | `<h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">` |
| `src/components/marketing/GradientHeading.tsx` (the `<h2>`) | `<h2 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">` | `<h2 className="text-5xl md:text-6xl font-bold mb-8 text-foreground">` |
| `src/components/marketing/KnowledgeBaseContent.tsx:76` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 text-foreground">` |
| `src/components/marketing/KnowledgeBaseContent.tsx:129` | `<h2 className="text-2xl font-bold mb-6 animated-gradient-text">` | `<h2 className="text-2xl font-bold mb-6 text-foreground">` |
| `src/components/marketing/KnowledgeBaseContent.tsx:172` | `<h2 className="text-2xl font-bold mb-6 animated-gradient-text">` | `<h2 className="text-2xl font-bold mb-6 text-foreground">` |
| `src/components/marketing/StatusPageContent.tsx:155` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 text-foreground">` |
| `src/components/marketing/ProductRoadmap.tsx:459` | `<h3 className="text-2xl font-bold text-gray-900 animated-gradient-text">` | `<h3 className="text-2xl font-bold text-foreground">` (drop `text-gray-900`, redundant with `text-foreground`) |
| `src/components/marketing/SocialFeeds.tsx:40` | `<h2 className="text-4xl font-bold mb-4 animated-gradient-text">Social Updates</h2>` | `<h2 className="text-4xl font-bold mb-4 text-foreground">Social Updates</h2>` |
| `src/app/signup/page.tsx:182` | `<h1 className="text-4xl md:text-6xl font-bold mb-6 animated-gradient-text">` | `<h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">` |
| `src/app/apps/page.tsx:67` | `<h2 className="text-4xl font-bold animated-gradient-text">Resources & Support</h2>` | `<h2 className="text-4xl font-bold text-foreground">Resources & Support</h2>` |
| `src/app/knowledge-base/[slug]/page.tsx:145` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">` | `<h1 className="text-5xl md:text-6xl font-bold mb-8 text-foreground">` |

- [ ] **Step 3: Verify no references remain**

Run: `grep -rn "animated-gradient-text" src`

Expected: no output.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 5: Visually spot-check two untouched pages**

Run: `npm run dev`. Open `/signup` and `/apps` — their H1/H2 should now render in solid `text-foreground` (black in light mode) instead of the indigo→purple→pink shimmer. No other visual change on these pages is expected or in scope.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: retire animated-gradient-text utility site-wide"
```

---

## Task 11: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full build and lint**

Run: `npm run build && npm run lint`

Expected: both succeed with no errors.

- [ ] **Step 2: Grep sweep for every removed reference**

Run:

```bash
grep -rn "Poppins\|SparkleButton\|btn-primary\|btn-secondary\|futuristic-button\|animated-gradient-text" src
grep -rln "@/components/ui/" src --include="*.tsx" --include="*.ts" | xargs grep -n "@/components/ui/" | grep -v -E "@/components/ui/(button|card|badge|input|textarea|label|form|select|dialog|sheet|dropdown-menu|tabs|accordion|tooltip|separator|skeleton|sonner|hairline-grid)"
ls tailwind.config.js tailwind.config.ts 2>&1
```

Expected: first two commands produce no output; the third reports "No such file or directory" for both.

- [ ] **Step 3: Responsive check on Navbar + Footer**

Run: `npm run dev`. At each of ~375px (mobile), ~768px (tablet), and ~1280px (desktop) viewport widths, load the homepage and confirm: no horizontal scroll anywhere, the Navbar's mobile Sheet trigger appears below `lg` and the inline nav above it, the Footer's link row/social icons wrap without overlap, and every interactive element (nav links, theme toggle, Sheet trigger, footer links/social icons) has a visible focus ring when tabbed to with the keyboard.

- [ ] **Step 4: Dark mode + reduced motion check**

In the running dev server, toggle the Navbar's theme button — background/text/border/primary colors should flip site-wide instantly (Navbar and Footer, plus the still-untouched pages' base `bg-background`/`text-foreground` if they use those tokens; pages still on hardcoded `bg-white`/`text-gray-900` are expected to not flip yet — that's correct, since restyling them is a later phase, not a bug in this one). Then enable "Emulate CSS prefers-reduced-motion: reduce" in devtools and confirm the Sheet and Button hover/focus states still function without relying on any animation that was skipped.

- [ ] **Step 5: Confirm the spec's addendum decisions are reflected**

Cross-check `docs/superpowers/specs/2026-09-01-visual-refresh-foundation-design.md`'s addendum against the running Navbar: icon+text pairing on every nav link, footer link, and the CTA button (done in Tasks 7-8); eyebrow labels supported by `SectionHeading` (done in Task 6, not yet used by any page — expected, since no page is restyled in this plan).

- [ ] **Step 6: Report**

No commit for this task — it's verification-only. If any check in Steps 1-5 fails, fix it as part of the task that owns the broken file (re-open that task's checkbox) rather than patching ad hoc here.
