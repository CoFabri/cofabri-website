# Site Copy Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every page's copy to the same confident/plain voice the Quiet Utility redesign already established, fix the fabricated Hero stats and hardcoded app counts, and reconcile nav label drift.

**Architecture:** Pure content + two small derived-value fixes in an existing Next.js 16 App Router site (`cofabri-website`). No new routes, components, or backend calls beyond data already fetched elsewhere in this codebase (`/api/apps`, `/api/roadmaps`).

**Tech Stack:** Next.js 16.1.7, React, TypeScript, Tailwind. No test runner is configured in this repo (`package.json` has no `test` script, no jest/vitest config, no `*.test.ts*` files anywhere) — verification is `npm run build` + manual browser checks, except where a task extracts a pure function, which gets a plain-Node scratch check instead of an invented test framework.

**Spec:** `docs/superpowers/specs/2026-09-02-site-copy-and-cobuild-design.md` (Part 1 and the audit table)

## Global Constraints

- Voice: confident and plain — short declarative sentences/fragments, no "unlock your potential," "AI-powered," "empower," or similar SaaS-template language.
- Terminology: "apps," never "products" or "solutions."
- Company description: CoFabri is a software studio operating a portfolio of independent apps across industries — not a single-product platform, not an agency.
- Do not claim CoFabri never partners with outside experts (the FAQ fix) — but do not name or link to `/partners` or "Co-Build" anywhere in this plan's output. That page doesn't exist until the separate `2026-09-02-cobuild-partner-program.md` plan ships. Keep the partnership mention generic.
- This repo's working tree may have other uncommitted changes from concurrent sessions (confirmed at spec time: `Footer.tsx`, `layout.tsx`, and others were already modified). Before editing any file in this plan, re-check its current contents with Read rather than trusting line numbers quoted here — another session may have touched the same file. Stage and commit only the files each task actually touches (`git add -- <exact paths>`, never `-A` or `.`).

---

### Task 1: Rewrite the homepage About section

**Files:**
- Modify: `src/components/marketing/About.tsx` (full rewrite, 96 lines currently)

**Interfaces:**
- Consumes: nothing new — no new imports or data.
- Produces: nothing other tasks depend on — pure content change.

- [ ] **Step 1: Replace the file contents**

```tsx
'use client';

import React, { useEffect } from 'react';
import RevealSection from './RevealSection';
import { clearHydrationCaches } from '@/lib/utils';

const highlights = [
  'Every app maintained by the people who built it',
  'Frequent, real updates — not annual overhauls',
  'Support from humans, not a ticket queue',
];

const whyChoose = [
  'A track record across industries, not just one',
  'Each app built to do one job, not everything',
  'Direct access to the people who ship it',
  'Straightforward pricing, no lock-in',
];

const About = () => {
  useEffect(() => {
    // Clear any cached content that might cause hydration issues
    clearHydrationCaches();
  }, []);

  return (
    <RevealSection id="about" className="py-24 md:py-28 bg-background">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="mb-11 max-w-[620px]">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            About us
          </div>
          <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
            One studio. Every industry.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-[1.6] text-muted-foreground">
              CoFabri is a software studio — not a single app, a portfolio of them. Each app
              solves one problem for one kind of business, built and maintained by a small team
              that ships fast and stays close to the people using it.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground">
              Most of what we build starts in-house. Some of it starts with an operator who
              already knows an industry cold — we build the app, they bring the customers,
              and we share what it earns.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-foreground">
              We&rsquo;re not chasing every idea — we&rsquo;re picking the ones worth doing well.
            </p>

            <ul className="mt-8 border-t border-border">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 border-b border-border py-3.5 text-[15px] text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="m-0 text-xl font-semibold text-foreground">Our mission</h3>
            <p className="mt-3 text-muted-foreground">
              To build software worth trusting — one industry, one problem, at a time.
            </p>

            <div className="mt-7 border-t border-border pt-7">
              <h4 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Why choose CoFabri
              </h4>
              <ul className="mt-4 flex flex-col">
                {whyChoose.map((item, i) => (
                  <li key={item} className="flex gap-3.5 border-t border-border py-3.5 text-[15px] text-foreground first:border-t-0">
                    <span className="pt-0.5 font-mono text-xs text-ink-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
};

export default About;
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds with no TypeScript/build errors.

- [ ] **Step 3: Visual verification**

Start the dev server (`npm run dev`), open `/` (or `/#about`), and confirm the About section renders correctly in both light and dark mode (toggle via the theme button in the navbar). Confirm no layout shift from the old copy (bullet counts are unchanged: 3 highlights, 4 "why choose" items).

- [ ] **Step 4: Commit**

```bash
git add -- src/components/marketing/About.tsx
git commit -m "content: rewrite homepage About section to studio-portfolio voice"
```

---

### Task 2: Rewrite the homepage FAQ section

**Files:**
- Modify: `src/components/marketing/FAQ.tsx` (only the `faqs` array, lines 13-38 as currently written — re-read the file first since only this array changes, not the component body)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace the `faqs` array**

Replace the existing `const faqs = [...]` block (currently lines 13-38) with:

```tsx
const faqs = [
  {
    question: 'Who are CoFabri\'s apps built for?',
    answer: 'Operators who want a tool that does one job well — solo founders and growing teams across a wide range of industries. If you\'re tired of paying for a platform that does twelve things adequately, our apps are built for you.',
  },
  {
    question: 'What kind of apps does CoFabri offer?',
    answer: 'A growing portfolio of apps, each solving one specific business problem — workflow automation, client communication, whatever the industry needs. None of them try to be everything.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Most CoFabri apps run on a monthly subscription. Some offer a free trial or a one-time option. Pricing is on each app\'s own page — no hidden fees.',
  },
  {
    question: 'Is any setup required?',
    answer: 'Not much. Our apps are self-serve and most people are running in minutes. If you get stuck, real support is available — not just a help center.',
  },
  {
    question: 'How is CoFabri different from other platforms?',
    answer: 'We don\'t try to be a platform for everything. Every CoFabri app is built around one problem, which keeps it lean and out of your way.',
  },
  {
    question: 'Who\'s behind CoFabri?',
    answer: 'A small team that builds most of what we ship in-house. On some apps, we partner directly with people who know an industry better than we do — they bring the expertise, we bring the engineering.',
  },
];
```

Do not change anything else in this file (the `FAQ` component body, the accordion markup, and the "Still stuck? Talk to us" link all stay as-is).

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Visual verification**

On `/`, open every FAQ accordion item and confirm the new copy reads correctly in both light and dark mode, and that none of the six answers overflow the `md:pr-20` content column oddly (they're similar length to the originals, so this should be a non-issue, but confirm).

- [ ] **Step 4: Commit**

```bash
git add -- src/components/marketing/FAQ.tsx
git commit -m "content: rewrite homepage FAQ, fix 'no outside agencies' claim"
```

---

### Task 3: Rewrite stale SEO metadata (homepage, Apps page, StructuredData)

**Files:**
- Modify: `src/app/page.tsx:14-30` (the `generateMetadata` function)
- Modify: `src/app/apps/page.tsx:8-30` (the `metadata` export)
- Modify: `src/components/marketing/StructuredData.tsx` (the `organization` and `website` case descriptions only, inside `getStructuredData`)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Rewrite homepage metadata**

In `src/app/page.tsx`, replace the `generateMetadata` function body:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CoFabri — Small software that does one thing well.',
    description: 'CoFabri is a software studio building a portfolio of focused apps — each one solves a single problem and stays out of your way.',
    alternates: {
      canonical: 'https://cofabri.com/',
    },
    openGraph: {
      title: 'CoFabri — Small software that does one thing well.',
      description: 'A software studio building a portfolio of focused apps, each solving a single problem.',
      url: 'https://cofabri.com/',
    },
    twitter: {
      title: 'CoFabri — Small software that does one thing well.',
      description: 'A software studio building a portfolio of focused apps, each solving a single problem.',
    },
  };
}
```

- [ ] **Step 2: Rewrite Apps page metadata**

In `src/app/apps/page.tsx`, replace the `metadata` export. Keep the existing `openGraph.images` block pointing at `/images/placeholder.jpg` — that file was confirmed to exist at exactly 1200x630px, the standard OG image size, so it's a real, intentional fallback, not a dead reference. No change needed there.

```tsx
export const metadata: Metadata = {
  title: 'Our Apps',
  description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
  openGraph: {
    title: 'Our Apps | CoFabri',
    description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
    url: 'https://cofabri.com/apps',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri Apps Collection',
      },
    ],
  },
  twitter: {
    title: 'Our Apps | CoFabri',
    description: 'Every app CoFabri builds, in one place — each one solves a single problem, none of them overlap.',
  },
  alternates: {
    canonical: '/apps',
  },
};
```

(This drops the `keywords` array entirely — `['SaaS apps', 'productivity tools', ..., 'AI tools', 'cloud software']` was generic boilerplate that doesn't describe what CoFabri actually is, and `keywords` meta has no real SEO value in modern search engines.)

- [ ] **Step 3: Rewrite StructuredData descriptions**

In `src/components/marketing/StructuredData.tsx`, inside the `organization` case, change:

```tsx
"description": "CoFabri builds innovative SaaS applications that solve real business challenges.",
```
to:
```tsx
"description": "CoFabri is a software studio operating a portfolio of independent apps across industries.",
```

Inside the `website` case, change:
```tsx
"description": "Discover our suite of powerful SaaS applications designed to help your business grow and succeed.",
```
to:
```tsx
"description": "CoFabri — small software that does one thing well.",
```

Leave every other field (`sameAs`, `contactPoint`, `address`, `logo`, `potentialAction`) unchanged.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual verification**

View source (or use a social share debugger locally via curl) on `/` and `/apps` to confirm the new `<title>`, `<meta name="description">`, and Open Graph tags render with the new copy. Confirm the `application/ld+json` script tags on those pages (View Source, search for `structured-data-organization` / `structured-data-website`) contain the updated descriptions.

- [ ] **Step 6: Commit**

```bash
git add -- src/app/page.tsx src/app/apps/page.tsx src/components/marketing/StructuredData.tsx
git commit -m "content: rewrite stale SEO metadata to match on-page voice"
```

---

### Task 4: Fix "products" terminology and hardcoded app count on the Apps page

**Files:**
- Modify: `src/components/marketing/AppsPageContent.tsx:85-89`

**Interfaces:**
- Consumes: existing `apps` state (`App[]`) already fetched in this component (`AppsPageContent`'s own `useState<App[]>([])`, populated in the `useEffect` at lines 40-64).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace the `PageHero` call**

Change:

```tsx
      <PageHero
        eyebrow="The suite"
        title="Every app we make."
        subtitle="Five products, none of which overlap. Pick the one that matches the problem you actually have."
      />
```

to:

```tsx
      <PageHero
        eyebrow="The suite"
        title="Every app we make."
        subtitle={
          apps.length > 0
            ? `${apps.length} apps, none of which overlap. Pick the one that matches the problem you actually have.`
            : 'Apps built to solve one problem well. Pick the one that matches the problem you actually have.'
        }
      />
```

This avoids ever rendering "0 apps" during the brief loading window before the `useEffect` fetch resolves — before load, `apps.length` is `0`, so the non-numeric fallback phrasing is used instead.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: succeeds — `apps` is already in scope in this component (declared as `useState<App[]>([])` earlier in the file), no new import needed.

- [ ] **Step 3: Manual verification**

Load `/apps` with the network tab open. Confirm the subtitle briefly shows the non-numeric fallback text, then updates to show the real count once `/api/apps` resolves, and that the number matches the actual number of app rows rendered below it (featured card + row list combined).

- [ ] **Step 4: Commit**

```bash
git add -- src/components/marketing/AppsPageContent.tsx
git commit -m "fix: derive Apps page count from real data instead of hardcoding 'Five'"
```

---

### Task 5: Fix the same hardcoded-count bug on the homepage apps section

This is the same bug as Task 4, found in a second location during research for this plan — not in the original spec's explicit list, but the same underlying problem in the same feature family, so it's included here rather than left half-fixed.

**Files:**
- Modify: `src/components/marketing/HomepageApps.tsx:163-165`

**Interfaces:**
- Consumes: existing `apps` state already in this component.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace the hardcoded heading**

Change:

```tsx
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              Five apps. One standard.
            </h2>
```

to:

```tsx
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              {apps.length > 0 ? `${apps.length} apps. One standard.` : 'One standard, every app.'}
            </h2>
```

Note this component's `apps` state (declared at the top of `HomepageApps`) is already filtered to `app.category !== 'Customer Facing'` before this render — so the count shown here reflects exactly the apps this section itself displays (featured card + rows), which is correct.

- [ ] **Step 2: Build check**

Run: `npm run build`

- [ ] **Step 3: Manual verification**

Load `/` and confirm the section heading shows the real count matching the number of apps actually rendered (featured + rest), in both light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add -- src/components/marketing/HomepageApps.tsx
git commit -m "fix: derive homepage apps-section count from real data instead of hardcoding 'Five'"
```

---

### Task 6: Extract a shared shipped-count helper and replace the fabricated Hero stat bar

**Files:**
- Modify: `src/lib/roadmap-display.ts` (add one new exported function)
- Modify: `src/components/marketing/HomepageApps.tsx` (use the new helper instead of its inline calculation)
- Modify: `src/components/marketing/Hero.tsx` (full rewrite — becomes a data-fetching client component)

**Interfaces:**
- Produces: `shippedInLastNDays(roadmap: RoadmapFeature[], days: number): number` in `src/lib/roadmap-display.ts` — later steps in this task, and any future code, should import this instead of recomputing the 30-day window inline.
- Consumes (in Hero.tsx): `App` and `RoadmapFeature` types from `@/lib/api-client`; the existing `/api/apps` and `/api/roadmaps` Next.js API routes (already used by `HomepageApps.tsx` and `AppsPageContent.tsx` — no backend work needed).

- [ ] **Step 1: Add the shared helper**

In `src/lib/roadmap-display.ts`, add this function (anywhere after the existing imports, e.g. at the end of the file):

```ts
export function shippedInLastNDays(roadmap: RoadmapFeature[], days: number): number {
  const windowMs = days * 24 * 60 * 60 * 1000;
  return roadmap.filter(
    (item) => item.status === 'Released' && item.releasedDate && Date.now() - new Date(item.releasedDate).getTime() <= windowMs
  ).length;
}
```

- [ ] **Step 2: Manually verify the helper's logic (no test framework in this repo)**

This repo has no jest/vitest config and no existing `*.test.ts*` files, so don't introduce a new test framework for one function. Instead, run this scratch check with plain Node (no TypeScript, no imports — just the same filter logic against fixture data) to confirm the boundary condition (exactly 30 days ago is included, 31 days ago is excluded):

```bash
node -e "
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const roadmap = [
  { status: 'Released', releasedDate: new Date(now - 5 * day).toISOString() },   // 5 days ago -> counts
  { status: 'Released', releasedDate: new Date(now - 29 * day).toISOString() },  // 29 days ago -> counts
  { status: 'Released', releasedDate: new Date(now - 31 * day).toISOString() },  // 31 days ago -> excluded
  { status: 'Planned', releasedDate: null },                                     // not released -> excluded
];
const windowMs = 30 * day;
const count = roadmap.filter(i => i.status === 'Released' && i.releasedDate && now - new Date(i.releasedDate).getTime() <= windowMs).length;
console.log('expected 2, got', count);
"
```

Expected output: `expected 2, got 2`.

- [ ] **Step 3: Refactor `HomepageApps.tsx` to use the helper**

In `src/components/marketing/HomepageApps.tsx`, add the import:

```tsx
import { shippedInLastNDays } from '@/lib/roadmap-display';
```

Then replace:

```tsx
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const shippedLast30Days = roadmap.filter(
    (item) => item.status === 'Released' && item.releasedDate && Date.now() - new Date(item.releasedDate).getTime() <= THIRTY_DAYS_MS
  ).length;
```

with:

```tsx
  const shippedLast30Days = shippedInLastNDays(roadmap, 30);
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual verification of the refactor**

Load `/`, scroll to the apps section, and confirm the "N features shipped in the last 30 days" line still shows the same number it did before this change (compare against the live `/api/roadmaps` response if in doubt — this step only refactored *how* the number is computed, not the computation itself, so the displayed value must not change).

- [ ] **Step 6: Rewrite Hero.tsx to fetch and show real numbers**

Replace the entire contents of `src/components/marketing/Hero.tsx`:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeroAurora from './HeroAurora';
import type { App, RoadmapFeature } from '@/lib/api-client';
import { shippedInLastNDays } from '@/lib/roadmap-display';

const Hero = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapFeature[]>([]);

  useEffect(() => {
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    };

    async function fetchMetrics() {
      try {
        const [appsRes, roadmapRes] = await Promise.all([
          fetch('/api/apps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/roadmaps', { cache: 'no-store', headers: noCacheHeaders }),
        ]);
        if (appsRes.ok) setApps(await appsRes.json());
        if (roadmapRes.ok) setRoadmap(await roadmapRes.json());
      } catch (err) {
        console.error('Error fetching hero metrics:', err);
      }
    }

    fetchMetrics();
  }, []);

  const liveAppCount = apps.filter((a) => a.status === 'Live').length;
  const shippedLast30Days = shippedInLastNDays(roadmap, 30);

  const metrics = [
    { value: liveAppCount > 0 ? `${liveAppCount}` : '—', label: 'Apps live' },
    { value: shippedLast30Days > 0 ? `${shippedLast30Days}` : '—', label: 'Features shipped, last 30 days' },
  ];

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-0 md:pt-[132px]">
      <HeroAurora />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="max-w-[880px]">
          <div className="mb-7 flex items-center gap-2.5">
            <span className="block h-px w-[22px] bg-ink-disabled" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Independent software studio
            </span>
          </div>
          <h1 className="m-0 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-foreground sm:text-6xl lg:text-[76px] lg:leading-[1.02]">
            Small software that
            <br />
            does one thing well.
          </h1>
          <p className="mt-8 max-w-[560px] text-lg leading-[1.55] text-muted-foreground md:text-xl">
            We build focused SaaS apps for operators. Each one solves a single
            problem, ships in weeks, and stays out of your way.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <Button asChild size="lg">
              <Link href="/apps">Explore the Apps</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/roadmaps">See what we&apos;re building →</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 divide-x divide-border border-t border-border md:mt-24">
          {metrics.map((m) => (
            <div key={m.label} className="px-6 py-7 first:pl-0">
              <div className="text-[28px] font-semibold tracking-[-0.03em] text-foreground sm:text-[34px]">
                {m.value}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
```

Note the grid changed from `grid-cols-2 ... sm:grid-cols-4` (four metrics) to a plain `grid-cols-2` (two metrics) — there are now only two real numbers to show, down from the four fabricated ones.

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Visual + data verification**

Load `/` with the network tab open. Confirm:
- Both stat values start as `—` and then populate once `/api/apps` and `/api/roadmaps` resolve.
- "Apps live" matches the actual count of apps with `status === 'Live'` in the `/api/apps` response.
- "Features shipped, last 30 days" matches the same number shown lower on the page in the apps section's "N features shipped in the last 30 days" line (both now use the same `shippedInLastNDays` helper, so they must agree).
- Check both light and dark mode.
- Check on a narrow (390px) viewport — the two-column grid should look intentional, not sparse.

- [ ] **Step 9: Commit**

```bash
git add -- src/lib/roadmap-display.ts src/components/marketing/HomepageApps.tsx src/components/marketing/Hero.tsx
git commit -m "fix: replace fabricated Hero stats with real derived numbers"
```

---

### Task 7: Fix "Roadmap" vs "Roadmaps" nav label mismatch

**Files:**
- Modify: `src/components/marketing/Footer.tsx:10`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Re-read the current file first**

This file was already flagged as having uncommitted changes from another session before this plan was written — re-read it now to get the current `navigation` array before editing, since the exact surrounding lines may have shifted.

- [ ] **Step 2: Change the label**

In the `navigation` array, change:

```tsx
  { name: 'Roadmaps', href: '/roadmaps', icon: TrendingUp },
```

to:

```tsx
  { name: 'Roadmap', href: '/roadmaps', icon: TrendingUp },
```

This matches the Navbar's existing singular label (`src/components/marketing/Navbar.tsx`, `{ name: 'Roadmap', href: '/roadmaps', icon: TrendingUp }`) — pick whichever of the two labels the file you're re-reading doesn't already use, so Footer and Navbar agree. Do not change the `href` (`/roadmaps` is the correct route either way) or touch any other entry in either file's navigation array. Note: the Navbar previously gained a "Contact" nav item from another session's uncommitted work; that has already been reverted (Contact stays footer/CTA-only, matching this project's established convention) — don't re-add it.

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Visual verification**

Load any page and confirm the footer nav now says "Roadmap" (singular), matching the navbar, in both light/dark mode and on mobile (the footer nav wraps on narrow viewports).

- [ ] **Step 5: Commit**

```bash
git add -- src/components/marketing/Footer.tsx
git commit -m "fix: match Footer's Roadmap nav label to Navbar's singular form"
```

---

### Task 8: Rewrite the root layout's default SEO metadata

**Files:**
- Modify: `src/app/layout.tsx:16-79` (the `metadata` export's `title`, `description`, `keywords`, `openGraph`, and `twitter` fields only)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing other tasks depend on.

This is the site-wide default metadata every page inherits unless it defines its own (Task 3 already overrides it for `/` and `/apps`) — it's the same stale-boilerplate problem as Task 3, just one level up. `src/app/layout.tsx` has unrelated uncommitted changes from another session (favicon/icon URLs, at different line numbers than the fields below) — re-read the file first and edit only the fields shown here; do not touch the `icons` block.

- [ ] **Step 1: Re-read the current file first**

Confirm the current line numbers for the `title`, `description`, `keywords`, `openGraph`, and `twitter` fields inside the `metadata` export before editing — another session's concurrent changes may have shifted them since this plan was written.

- [ ] **Step 2: Rewrite title, description, and keywords**

Change:

```tsx
  title: {
    default: "CoFabri - SaaS Apps for Modern Businesses",
    template: "%s | CoFabri"
  },
  description: "Discover our suite of powerful SaaS applications designed to help your business grow and succeed. From productivity tools to AI-powered solutions, we build software that works.",
  keywords: [
    'SaaS', 
    'software development', 
    'AI', 
    'cloud solutions', 
    'business automation',
    'productivity tools',
    'business software',
    'web applications',
    'enterprise software',
    'digital transformation'
  ],
```

to:

```tsx
  title: {
    default: "CoFabri — Small software that does one thing well.",
    template: "%s | CoFabri"
  },
  description: "CoFabri is a software studio operating a portfolio of independent apps across industries — each one built to solve a single problem well.",
```

Drop the `keywords` array entirely, same reasoning as Task 3 Step 2: it was generic boilerplate ('AI', 'cloud solutions', 'digital transformation') that doesn't describe CoFabri and has no real SEO value in modern search engines.

- [ ] **Step 3: Rewrite openGraph and twitter text**

Change:

```tsx
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cofabri.com',
    siteName: 'CoFabri',
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges. Discover our suite of productivity tools and AI-powered solutions.',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri - SaaS Apps for Real Business Needs',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFabri - SaaS Apps for Real Business Needs',
    description: 'CoFabri builds innovative SaaS applications that solve real business challenges.',
    images: ['/images/placeholder.jpg'],
    creator: '@cofabri',
    site: '@cofabri',
  },
```

to:

```tsx
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cofabri.com',
    siteName: 'CoFabri',
    title: 'CoFabri — Small software that does one thing well.',
    description: 'A software studio operating a portfolio of independent apps across industries.',
    images: [
      {
        url: '/images/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CoFabri',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFabri — Small software that does one thing well.',
    description: 'A software studio operating a portfolio of independent apps across industries.',
    images: ['/images/placeholder.jpg'],
    creator: '@cofabri',
    site: '@cofabri',
  },
```

`/images/placeholder.jpg` is the real branded OG card (confirmed visually — it renders the CoFabri wordmark on a light-blue gradient background, 1200x630px) — leave the image reference as-is, only the surrounding title/description/alt text changes.

Leave `authors`, `creator`, `publisher`, `category`, `classification`, `icons`, `manifest`, `formatDetection`, `metadataBase`, `robots`, `verification`, and `other` untouched — none of that is stale marketing copy, it's functional config outside this plan's scope.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual verification**

View source on any page that doesn't override metadata (e.g. `/support` or `/contact`) and confirm the inherited `<title>`, `<meta name="description">`, and Open Graph/Twitter tags show the new copy, matching the voice already applied to `/` and `/apps` in Task 3.

- [ ] **Step 6: Commit**

```bash
git add -- src/app/layout.tsx
git commit -m "content: rewrite root layout's default SEO metadata to match on-page voice"
```

---

## Self-Review

**Spec coverage** (spec Part 1, items 1-7): About rewrite → Task 1. FAQ rewrite + contradiction fix → Task 2. Meta descriptions/StructuredData → Task 3. Apps page terminology + count → Task 4. Hero stat bar → Task 6. Nav/Footer consistency → Task 7. Placeholder OG image → confirmed real during research (visually verified: it's the branded wordmark card, not a dead reference), folded into Task 3 and Task 8 as a verified no-op rather than a separate task. Additional discoveries beyond the spec's original list: the same hardcoded-count bug in `HomepageApps.tsx` → Task 5; the root layout's default metadata has the identical staleness problem as Task 3's targets, flagged during brainstorming and approved as a follow-up → Task 8. The Navbar's out-of-plan "Contact" nav item (another session's uncommitted work, contradicting this project's footer-only convention for Contact) was reverted directly by the user rather than via a plan task — Task 7 accounts for this when touching the same file.

**Placeholder scan:** no TBD/TODO; every step has literal code; no "similar to Task N" shortcuts — Tasks 4 and 5 fix the same class of bug in two different files with two full, separately-shown code blocks rather than one referencing the other.

**Type/signature consistency:** `shippedInLastNDays(roadmap: RoadmapFeature[], days: number): number` is defined once in Task 6 Step 1 and consumed with the identical name and argument order in Task 6 Steps 3 and 6 — no drift.
