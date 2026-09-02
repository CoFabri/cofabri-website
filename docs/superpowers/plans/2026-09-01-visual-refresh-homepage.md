# CoFabri Visual Refresh — Phase 2 (Homepage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Phase 1 design-system foundation (tokens, `Button`/`Card`/`Badge`/`Accordion`, `SectionHeading`, `HairlineGrid`) to the homepage's 8 real sections, replacing the last hardcoded `indigo-*`/`purple-*`/`blue-*` colors and decorative blob/gradient effects, and shipping the approved "connected nodes" hero motion — without changing any copy, data, section order, or the pages that aren't actually rendered on the homepage.

**Architecture:** Two small new primitives (`RevealSection` for scroll-triggered fade-in, `ConnectedNodesDiagram` for the hero's signature animation) get built first since later tasks depend on them. Each of the 8 homepage sections is then restyled in its existing file, in the order the homepage renders them, preserving all fetch logic, state, and copy verbatim while swapping styling to token-based classes and shadcn primitives. A final task greps for regressions and does the manual responsive/dark-mode/reduced-motion pass.

**Tech Stack:** Next.js 16 (App Router), React 18.3, Tailwind CSS v4, shadcn/ui (`new-york` style), `framer-motion` (already installed), `lucide-react`, `@heroicons/react` (kept for icons not touched by this plan).

**Spec:** `docs/superpowers/specs/2026-09-01-visual-refresh-homepage-design.md`

## Global Constraints

- Brand primary is the `--primary` token (`#007BFF` light / `#2B96FF` dark) — never hardcoded `indigo-*`/`purple-*`/`blue-*` Tailwind classes in any file this plan touches. Semantic status colors (green/yellow/red for "Live"/"upcoming"/etc., and anything already defined in the out-of-scope `ProductRoadmap.tsx`) are exempt — they're status semantics, not brand-color decisions.
- Every section wrapper uses `mx-auto max-w-6xl px-6 py-20`.
- Section backgrounds alternate down the page in this exact order: Hero `bg-background` → HomepageApps `bg-muted/30` → About `bg-background` → Testimonials `bg-muted/30` → CompactRoadmap `bg-background` → FAQ `bg-muted/30` → Newsletter `bg-background`. No section uses a `--primary`-based gradient or full-bleed color wash.
- No copy/content changes: hero headline/subhead, About's body paragraphs and bullets, all 6 FAQ question/answer pairs, and Airtable-sourced data (apps, testimonials, roadmap features) stay byte-for-byte identical. Short structural "eyebrow" labels (e.g. `"About Us"`, `"FAQ"`) are the one exception — they're part of the already-approved `SectionHeading` pattern, not new marketing copy.
- Every button on the homepage is a shadcn `Button`, never a raw `<Link>`/`<button>` with hand-rolled Tailwind color classes.
- All motion (hero diagram draw-in, root-node breathing, section scroll-reveals) respects `prefers-reduced-motion` via `framer-motion`'s `useReducedMotion()` hook — reduced-motion renders the settled end state immediately.
- `Features.tsx`, `Partners.tsx`, `CTA.tsx`, `GradientHeading.tsx`, and `ProductRoadmap.tsx` are **not modified** — none render on the homepage (the first four aren't rendered there at all; `ProductRoadmap.tsx` only backs the separate `/roadmaps` page, and `CompactRoadmap.tsx` merely imports its exported `getStatusColor`/`getStatusIcon` helper functions as-is).
- This repo has no test runner configured — "run tests" means `npm run build` + `npm run lint` passing, plus the manual visual/responsive/dark-mode/reduced-motion checks each task specifies. Do not introduce a new test framework.
- Every commit message must end with:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
```

---

## Task 1: Build the `RevealSection` scroll-reveal primitive

**Files:**
- Create: `src/components/marketing/RevealSection.tsx`

**Interfaces:**
- Produces: `RevealSection` — a drop-in replacement for a `<section>` element (forwards `ref`, accepts every native `<section>` prop including `id`/`className`) that fades/slides its content in on first scroll into view, and renders as a plain static `<section>` under `prefers-reduced-motion`. Every later task that restyles a homepage section imports this.

- [ ] **Step 1: Create `RevealSection.tsx`**

`src/components/marketing/RevealSection.tsx`:

```tsx
'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const RevealSection = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'section'>>(
  function RevealSection({ children, ...props }, ref) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
      return (
        <section ref={ref} {...props}>
          {children}
        </section>
      );
    }

    return (
      <motion.section
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={variants}
        {...props}
      >
        {children}
      </motion.section>
    );
  }
);

export default RevealSection;
```

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds (component isn't imported anywhere yet, so this just confirms it compiles standalone).

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/RevealSection.tsx
git commit -m "$(cat <<'EOF'
feat: add RevealSection scroll-reveal primitive

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 2: Build the `ConnectedNodesDiagram` hero animation

**Files:**
- Create: `src/components/marketing/ConnectedNodesDiagram.tsx`

**Interfaces:**
- Produces: `ConnectedNodesDiagram({ className? })` — a self-contained SVG that draws its lines in on mount, pops its nodes in, and pulses a soft "breathing" glow behind the root node thereafter. Task 3 (Hero) renders it.

- [ ] **Step 1: Create `ConnectedNodesDiagram.tsx`**

`src/components/marketing/ConnectedNodesDiagram.tsx`:

```tsx
'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Node {
  id: string;
  cx: number;
  cy: number;
  r: number;
  root?: boolean;
}

const nodes: Node[] = [
  { id: 'root', cx: 70, cy: 150, r: 10, root: true },
  { id: 'a', cx: 170, cy: 60, r: 6 },
  { id: 'b', cx: 290, cy: 95, r: 6 },
  { id: 'c', cx: 270, cy: 215, r: 6 },
  { id: 'd', cx: 155, cy: 250, r: 6 },
  { id: 'e', cx: 45, cy: 45, r: 5 },
];

const edges: [string, string][] = [
  ['root', 'a'],
  ['root', 'b'],
  ['root', 'c'],
  ['root', 'd'],
  ['root', 'e'],
  ['a', 'b'],
  ['c', 'd'],
];

function findNode(id: string): Node {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown node id: ${id}`);
  return node;
}

const root = findNode('root');

export default function ConnectedNodesDiagram({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 320 280"
      className={className}
      role="img"
      aria-label="Diagram of connected nodes representing CoFabri's suite of apps working together"
    >
      {edges.map(([fromId, toId], index) => {
        const from = findNode(fromId);
        const to = findNode(toId);
        return (
          <motion.line
            key={`${fromId}-${toId}`}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            className="stroke-border"
            strokeWidth={1.5}
            initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.6, delay: index * 0.12, ease: 'easeOut' }
            }
          />
        );
      })}
      {nodes.map((node, index) => (
        <motion.circle
          key={node.id}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className={node.root ? 'fill-primary' : 'fill-primary/60'}
          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.4, delay: 0.6 + index * 0.08, ease: 'easeOut' }
          }
          style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
        />
      ))}
      {!shouldReduceMotion && (
        <motion.circle
          cx={root.cx}
          cy={root.cy}
          r={root.r}
          className="fill-primary"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.8, 1] }}
          transition={{ duration: 2.5, delay: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${root.cx}px ${root.cy}px` }}
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/ConnectedNodesDiagram.tsx
git commit -m "$(cat <<'EOF'
feat: add connected-nodes hero diagram

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 3: Rewrite Hero

**Files:**
- Modify: `src/components/marketing/Hero.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Button` (`@/components/ui/button`), `ConnectedNodesDiagram` (Task 2, same directory).
- Produces: no change to public interface — still a default-exported, prop-less `<Hero />`.

- [ ] **Step 1: Rewrite `Hero.tsx`**

`src/components/marketing/Hero.tsx` — replace the entire file:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConnectedNodesDiagram from './ConnectedNodesDiagram';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Powerful SaaS apps for your business needs
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            Self-service solutions to help you grow and succeed
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
            <Button asChild size="lg">
              <Link href="/apps">
                Explore Apps
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                Contact Us
                <Mail className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="w-full max-w-md md:max-w-lg">
          <ConnectedNodesDiagram className="h-auto w-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
```

This removes the `Logo`, `AnimatedGradient`, all five blur-blob `<div>`s, and the decorative floating ring from the previous implementation.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open the homepage.
- Confirm the hero shows headline/subhead/two buttons on the left, the connected-nodes diagram on the right on desktop widths, stacking (text above diagram) below `md`.
- Confirm the diagram's lines draw in and nodes pop in on page load, and the root (leftmost, largest) node keeps a soft pulsing glow afterward.
- Toggle dark mode — diagram lines/nodes should stay visible and legible (they use `stroke-border`/`fill-primary` tokens, not hardcoded colors).
- In devtools, enable "Emulate CSS prefers-reduced-motion: reduce" — the diagram should render fully drawn/settled immediately with no animation and no pulsing glow.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Hero.tsx
git commit -m "$(cat <<'EOF'
feat: restyle Hero with asymmetric layout and connected-nodes diagram

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 4: Restyle HomepageApps and AppPreviewCard

**Files:**
- Modify: `src/components/marketing/HomepageApps.tsx` (full rewrite)
- Modify: `src/components/marketing/AppPreviewCard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SectionHeading`, `RevealSection` (Task 1), `Button` (`@/components/ui/button`).
- Produces: no change to either component's public props (`HomepageApps({ onAppsLoaded? })`, `AppPreviewCard({ app })`).

- [ ] **Step 1: Rewrite `HomepageApps.tsx`**

`src/components/marketing/HomepageApps.tsx` — replace the entire file:

```tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { App } from '@/lib/airtable';
import confetti from 'canvas-confetti';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import AppPreviewCard from './AppPreviewCard';

interface HomepageAppsProps {
  onAppsLoaded?: () => void;
}

export default function HomepageApps({ onAppsLoaded }: HomepageAppsProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function fetchApps() {
      try {
        const response = await fetch('/api/apps', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch apps');
        const data = await response.json();
        setApps(data.filter((app: App) => app.category !== 'Customer Facing'));
      } catch (err) {
        console.error('Error fetching apps:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch apps');
      } finally {
        setIsLoading(false);
        if (onAppsLoaded) {
          onAppsLoaded();
        }
      }
    }

    fetchApps();
  }, []);

  useEffect(() => {
    if (!sectionRef.current || hasTriggeredConfetti || !apps.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredConfetti) {
          // Check if any app launches today
          const today = new Date();
          const hasLaunchToday = apps.some(app => {
            if (!app.launchDate) return false;
            const launchDate = new Date(app.launchDate);
            return (
              launchDate.getDate() === today.getDate() &&
              launchDate.getMonth() === today.getMonth() &&
              launchDate.getFullYear() === today.getFullYear()
            );
          });

          if (hasLaunchToday) {
            // Fire confetti from multiple angles
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                clearInterval(interval);
                return;
              }

              const particleCount = 50 * (timeLeft / duration);

              // Since particles fall down, start a bit higher than random
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
              });
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
              });
            }, 250);
          }
          setHasTriggeredConfetti(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasTriggeredConfetti, apps.length]); // Use apps.length instead of apps array to prevent infinite re-renders

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevealSection ref={sectionRef} className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Our Apps"
          title="Latest Apps"
          subtitle="Discover our suite of powerful applications designed to streamline your workflow"
        />

        <div className={`grid gap-8 mx-auto ${
          apps.length === 1 
            ? 'grid-cols-1' 
            : apps.length === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {apps.map((app) => (
            <AppPreviewCard key={app.id} app={app} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/apps">
              View All Apps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}
```

- [ ] **Step 2: Rewrite `AppPreviewCard.tsx`**

`src/components/marketing/AppPreviewCard.tsx` — replace the entire file:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { App } from '@/lib/airtable';
import { ArrowUpRight } from 'lucide-react';
import ExpandableText from './ExpandableText';
import { Button } from '@/components/ui/button';

interface AppPreviewCardProps {
  app: App;
}

export default function AppPreviewCard({ app }: AppPreviewCardProps) {
  // Check if app is launching today
  const isLaunchingToday = () => {
    if (!app.launchDate) return false;
    const today = new Date();
    const launchDate = new Date(app.launchDate);
    return (
      launchDate.getDate() === today.getDate() &&
      launchDate.getMonth() === today.getMonth() &&
      launchDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="group">
      <div className={`bg-card rounded-2xl shadow-sm overflow-hidden border transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-1
        ${isLaunchingToday() 
          ? 'border-primary/60 shadow-lg hover:shadow-2xl hover:border-primary animate-pulse hover:animate-none' 
          : 'border-border hover:shadow-xl'}`}>
        <div className="relative w-full h-auto overflow-hidden">
          {app.screenshot && (
            <Image
              src={app.screenshot}
              alt={app.name}
              width={1200}
              height={630}
              className="object-cover w-full h-auto transition-transform duration-500 ease-out group-hover:scale-105"
              onError={(e) => {
                console.error(`Error loading image for ${app.name}:`, e);
                // Fallback to placeholder
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = '/images/placeholder.jpg';
              }}
            />
          )}
        </div>
        <div className="p-6">
          {/* Badges Section */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              app.status === 'Live' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              app.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              app.status === 'Beta' ? 'bg-accent text-accent-foreground hover:bg-accent/80' :
              app.status === 'Alpha' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
              'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
              {app.status}
            </span>
            {app.launchDate && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                isLaunchingToday()
                  ? 'bg-accent text-accent-foreground animate-pulse hover:bg-accent/80'
                  : new Date(app.launchDate) > new Date() 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}>
                {isLaunchingToday()
                  ? '🚀 Launching Today! 🎉'
                  : new Date(app.launchDate) > new Date()
                    ? `Launching ${new Date(app.launchDate).toLocaleDateString()}`
                    : `Launched ${new Date(app.launchDate).toLocaleDateString()}`
                }
              </span>
            )}
            {app.releaseDate && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200">
                Released {new Date(app.releaseDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* App Name */}
          <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mb-4">
            {app.name}
            {isLaunchingToday() && (
              <span className="ml-2 inline-flex items-center text-sm font-medium text-primary animate-bounce">
                🎉
              </span>
            )}
          </h2>
          <ExpandableText 
            text={app.description} 
            maxLength={200}
            className="text-muted-foreground text-base leading-relaxed"
          />

          {/* Features Section */}
          {(app.feature1 || app.feature2 || app.feature3) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Key Features</h3>
              <ul className="space-y-2.5">
                {app.feature1 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature1}</span>
                  </li>
                )}
                {app.feature2 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature2}</span>
                  </li>
                )}
                {app.feature3 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature3}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {app.status === 'In Development' ? (
            <Button asChild>
              <Link href={`/signup?appId=${app.id}`}>Join Waitlist</Link>
            </Button>
          ) : app.url ? (
            <Button asChild>
              <Link
                href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit App
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

(Drops the unused `StarIcon` import that existed in the previous version — it was imported but never rendered.)

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open the homepage. Confirm the apps grid renders with the new `SectionHeading` (eyebrow + heading), cards show tokenized badges/buttons, "View All Apps" is a real `Button`, and dark mode flips all card colors correctly (border, badges, buttons).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/HomepageApps.tsx src/components/marketing/AppPreviewCard.tsx
git commit -m "$(cat <<'EOF'
refactor: restyle HomepageApps and AppPreviewCard on design tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 5: Restyle About

**Files:**
- Modify: `src/components/marketing/About.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SectionHeading`, `RevealSection` (Task 1), `Card` (`@/components/ui/card`), `HairlineGrid`/`HairlineGridItem` (`@/components/ui/hairline-grid`).
- Produces: no change to public interface — still a default-exported, prop-less `<About />`. Keeps the `id="about"` element that `HomeContent.tsx`'s anchor-scroll logic depends on.

- [ ] **Step 1: Rewrite `About.tsx`**

`src/components/marketing/About.tsx` — replace the entire file:

```tsx
'use client';

import React, { useEffect } from 'react';
import { ChartBar, Users, Globe, Sparkles } from 'lucide-react';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import { Card } from '@/components/ui/card';
import { HairlineGrid, HairlineGridItem } from '@/components/ui/hairline-grid';
import { clearHydrationCaches } from '@/lib/utils';

const stats = [
  {
    name: 'Active Users',
    value: '10K+',
    icon: Users,
  },
  {
    name: 'Apps Launched',
    value: '5+',
    icon: Sparkles,
  },
  {
    name: 'Countries Served',
    value: '50+',
    icon: Globe,
  },
  {
    name: 'Success Rate',
    value: '98%',
    icon: ChartBar,
  },
];

const About = () => {
  useEffect(() => {
    // Clear any cached content that might cause hydration issues
    clearHydrationCaches();
  }, []);

  return (
    <RevealSection id="about" className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          key="about-section-heading"
          eyebrow="About Us"
          title="About CoFabri"
          subtitle="Empowering Businesses Through Smart, Scalable Technology"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
            CoFabri helps modern businesses unlock their potential through automation, AI-enhanced tools, and intuitive software. Whether you’re a solo founder or an established enterprise, our growing suite of apps is built to streamline operations, reduce inefficiencies, and spark meaningful growth.
            </p>
            <p className="text-lg text-muted-foreground">
            With deep expertise in software development and business process optimization, we create elegant, no-code and low-code solutions that simplify complexity and deliver measurable results. Every product is built to be modular, easy to adopt, and backed by ongoing support.
            </p>
            <p className="text-lg text-muted-foreground">
            We’re not just a software provider — we’re your technology partner.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Industry-leading automation and AI features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Frequent updates to improve every app</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Fast support</span>
              </div>
            </div>
          </div>
          <Card className="p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground">
              To empower businesses with intelligent technology solutions that drive performance, efficiency, and long-term success — without the traditional complexity.
              </p>
              <div className="pt-4 border-t border-border">
                <h4 className="text-lg font-medium text-foreground mb-2">Why Choose CoFabri?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Proven track record of fast, effective deployments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">AI-powered automation built for real-world use cases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Modular SaaS apps that grow with your business</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Transparent support and continuous improvements</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <HairlineGrid className="grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <HairlineGridItem key={stat.name} className="p-8 flex flex-col items-center justify-center gap-2 text-center">
              <stat.icon className="w-6 h-6 text-primary" />
              <div className="text-3xl font-semibold text-foreground">{stat.value}</div>
              <div className="text-muted-foreground">{stat.name}</div>
            </HairlineGridItem>
          ))}
        </HairlineGrid>
      </div>
    </RevealSection>
  );
};

export default About;
```

This drops the rotated gradient-blur backdrop behind the Mission block (replaced by the plain `Card`) and moves the stat row from icon-in-blue-circle blocks to `HairlineGrid` cells.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`. Confirm: the Mission card renders as a bordered `Card` with no gradient backdrop; the 4-stat row renders as bordered hairline cells (2 columns on mobile, 4 on desktop); clicking a nav link to `/#about` (or scrolling from the Navbar) still lands on this section; dark mode flips all colors correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/About.tsx
git commit -m "$(cat <<'EOF'
refactor: restyle About with token colors, Card mission block, HairlineGrid stats

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 6: Restyle Testimonials and TestimonialPreviewCard

**Files:**
- Modify: `src/components/marketing/Testimonials.tsx` (full rewrite)
- Modify: `src/components/marketing/TestimonialPreviewCard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SectionHeading`, `RevealSection` (Task 1).
- Produces: no change to public interfaces — `Testimonials({ appId? })`, `TestimonialPreviewCard({ testimonial })`.

- [ ] **Step 1: Rewrite `Testimonials.tsx`**

`src/components/marketing/Testimonials.tsx` — replace the entire file:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import SectionHeading from './SectionHeading';
import TestimonialPreviewCard from './TestimonialPreviewCard';
import RevealSection from './RevealSection';
import { Testimonial } from '@/lib/airtable';

interface TestimonialsProps {
  appId?: string;
}

const Testimonials = ({ appId }: TestimonialsProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        let url = '/api/testimonials';
        if (appId) {
          url += `?appId=${encodeURIComponent(appId)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch testimonials');
        const data = await response.json();
        setTestimonials(data);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch testimonials');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestimonials();
  }, [appId]);

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="relative p-8 rounded-2xl bg-card border border-border shadow-sm animate-pulse"
              >
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-muted" />
                  <div className="ml-4">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded mt-2" />
                  </div>
                </div>
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="text-center text-destructive">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevealSection className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Our Customers Say"
          subtitle="Hear from businesses that have transformed their operations with our apps"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialPreviewCard
              key={testimonial.id}
              testimonial={{
                id: testimonial.id,
                name: testimonial.name,
                role: testimonial.role,
                company: testimonial.company,
                content: testimonial.content,
                rating: testimonial.rating,
                image: testimonial.image
              }}
            />
          ))}
        </div>
      </div>
    </RevealSection>
  );
};

export default Testimonials;
```

(Drops the unused `StarIcon`/`getTestimonials` imports that existed in the previous version — `StarIcon` was never rendered in this file, `getTestimonials` was never called.)

- [ ] **Step 2: Rewrite `TestimonialPreviewCard.tsx`**

`src/components/marketing/TestimonialPreviewCard.tsx` — replace the entire file:

```tsx
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface TestimonialPreviewCardProps {
  testimonial: {
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    image: string;
  };
}

export default function TestimonialPreviewCard({ testimonial }: TestimonialPreviewCardProps) {
  return (
    <div className="group relative p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-1">
      <div className="flex items-center mb-6">
        <div className="relative w-14 h-14 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-110">
          <Image
            src={testimonial.image || '/images/placeholder.jpg'}
            alt={testimonial.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
            {testimonial.name}
          </h3>
          <p className="text-muted-foreground transition-colors duration-300">
            {testimonial.role}
          </p>
          <p className="text-muted-foreground text-sm transition-colors duration-300">
            {testimonial.company}
          </p>
        </div>
      </div>

      <div className="flex mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <StarIcon
            key={i}
            className="h-5 w-5 text-yellow-400 transition-transform duration-200 hover:scale-110"
          />
        ))}
      </div>

      <blockquote className="text-muted-foreground italic transition-colors duration-300">
        "{testimonial.content}"
      </blockquote>

      <div className="absolute top-4 right-4 text-6xl font-serif text-muted-foreground/10 select-none transition-transform duration-300 group-hover:scale-110 group-hover:text-muted-foreground/20">
        "
      </div>
    </div>
  );
}
```

(Star rating color is left as `yellow-400` — a semantic rating indicator, not a brand-color decision.)

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`. Confirm testimonial cards render with tokenized colors and the decorative quote mark is a faint neutral rather than indigo. Dark mode flips correctly, including the loading skeleton (visible briefly on page load / hard refresh).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/Testimonials.tsx src/components/marketing/TestimonialPreviewCard.tsx
git commit -m "$(cat <<'EOF'
refactor: restyle Testimonials and TestimonialPreviewCard on design tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 7: Restyle CompactRoadmap

**Files:**
- Modify: `src/components/marketing/CompactRoadmap.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SectionHeading`, `RevealSection` (Task 1), `Card` (`@/components/ui/card`), `Badge` (`@/components/ui/badge`), `Button` (`@/components/ui/button`), and the existing `getStatusColor`/`getStatusIcon` exports from `./ProductRoadmap` (unchanged, out of scope — see Global Constraints).
- Produces: no change to public interface — still a default-exported, prop-less `<CompactRoadmap />`.

- [ ] **Step 1: Rewrite `CompactRoadmap.tsx`**

`src/components/marketing/CompactRoadmap.tsx` — replace the entire file:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { RoadmapFeature } from '@/lib/airtable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getStatusColor, getStatusIcon } from './ProductRoadmap';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CompactRoadmap() {
  const router = useRouter();
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/roadmaps');
        if (!response.ok) throw new Error('Failed to fetch roadmap features');
        const data = await response.json();
        setFeatures(data);
      } catch (err) {
        console.error('Error fetching roadmap features:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roadmap features');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatures();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (features.length === 0) {
    return null;
  }

  // Get the next quarter's milestone and its features
  const nextQuarter = features[0].milestone;
  const nextQuarterFeatures = features.filter(feature => feature.milestone === nextQuarter);

  // Helper function to get dynamic grid classes based on feature count
  const getDynamicGridClasses = (featureCount: number) => {
    if (featureCount === 1) {
      return 'grid-cols-1 lg:grid-cols-1'; // Single feature takes full width
    } else if (featureCount === 2) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'; // Two features, 50% each
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // Three or more, max 3 per row
    }
  };

  // Helper function to group features into rows of 3
  const groupFeaturesIntoRows = (features: RoadmapFeature[]) => {
    const rows: RoadmapFeature[][] = [];
    for (let i = 0; i < features.length; i += 3) {
      rows.push(features.slice(i, i + 3));
    }
    return rows;
  };

  return (
    <RevealSection className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Roadmap"
          title="Product Roadmaps & Changelog"
          subtitle="See what's coming next and track our progress"
        />

        <div className="space-y-8 mb-12">
          <div className="relative">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 mb-6">
              <h3 className="text-2xl font-semibold text-foreground">
                {nextQuarter}
              </h3>
            </div>

            <div className="space-y-6">
              {groupFeaturesIntoRows(nextQuarterFeatures).map((row, rowIndex) => (
                <div key={rowIndex} className={`grid ${getDynamicGridClasses(row.length)} gap-6`}>
                  {row.map((feature) => (
                    <Card
                      key={feature.id}
                      onClick={() => router.push(`/roadmaps?expand=${feature.id}`)}
                      className="overflow-hidden gap-0 py-0 flex flex-col cursor-pointer group hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(feature.status)}
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-base font-semibold text-foreground">
                              {feature.name}
                            </h4>
                            {feature.application && (
                              <div className="mt-1">
                                <span className="inline-flex text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                  {feature.application}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="px-5 py-3 border-t border-border bg-muted/50">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="outline" className={getStatusColor(feature.status)}>
                              {feature.status}
                            </Badge>
                            <span className="text-xs text-primary group-hover:text-primary/80 transition-colors">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/roadmaps">
              View All Roadmaps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}
```

(`getStatusColor` still returns semantic status-mapping classes like `bg-blue-100 text-blue-800` for "In Progress" — that's the existing, out-of-scope `ProductRoadmap.tsx` helper, reused as-is per the Global Constraints exemption for status semantics. The `Badge`'s own `outline` variant classes are overridden by that returned string via `className`, giving it badge shape/sizing with the existing status color.)

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`. Confirm roadmap cards render as bordered `Card`s with a `Badge` status pill, "View All Roadmaps" is a real `Button`, clicking a card still navigates to `/roadmaps?expand=<id>`, and dark mode flips card/border/text colors correctly (status badge colors are semantic and won't flip hue, only their light/dark shade via Tailwind's palette — that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/CompactRoadmap.tsx
git commit -m "$(cat <<'EOF'
refactor: restyle CompactRoadmap with Card, Badge, and Button primitives

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 8: Rewrite FAQ on the shadcn Accordion

**Files:**
- Modify: `src/components/marketing/FAQ.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SectionHeading`, `RevealSection` (Task 1), `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` (`@/components/ui/accordion`).
- Produces: no change to public interface — still a default-exported, prop-less `<FAQ />`.

- [ ] **Step 1: Rewrite `FAQ.tsx`**

`src/components/marketing/FAQ.tsx` — replace the entire file:

```tsx
'use client';

import React from 'react';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Who are CoFabri\'s tools built for?',
    answer: 'Our tools are built for anyone looking to save time and work smarter — from solo entrepreneurs to growing teams. While we serve a wide range of industries, most of our early users are business owners looking for affordable, no-code tools that solve real problems fast.',
  },
  {
    question: 'What kind of tools does CoFabri offer?',
    answer: 'CoFabri offers a growing suite of SaaS apps designed to solve specific business challenges — whether it\'s automating workflows, streamlining onboarding, or managing client communications. Each app is built to be simple, efficient, and ready to use.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Most CoFabri apps are available on a monthly subscription basis. Some offer a free trial or one-time purchase options depending on the use case. You\'ll find clear pricing details on each app\'s page — no hidden fees.',
  },
  {
    question: 'Is any setup required?',
    answer: 'Nope. Our apps are fully self-serve and designed for quick setup — many users are up and running in just minutes. If you ever need help, our team is available for general support and guidance.',
  },
  {
    question: 'How is CoFabri different from other platforms?',
    answer: 'We don\'t try to be everything. Each CoFabri app is built around solving one specific problem really well. That focus means our tools are lean, fast, and effective — not bloated with features you\'ll never use.',
  },
  {
    question: 'Who\'s behind CoFabri?',
    answer: 'We\'re a small but mighty team building all our tools in-house. That means we can move fast, adapt to your feedback, and keep improving with every release. No outside agencies. No guesswork.',
  },
];

const FAQ = () => {
  return (
    <RevealSection className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about our products and services"
        />

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-lg font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </RevealSection>
  );
};

export default FAQ;
```

All 6 question/answer pairs are unchanged. `type="single" collapsible` matches the previous behavior (only one entry open at a time, and clicking the open one closes it).

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`. Confirm all 6 FAQ entries render, clicking a question expands its answer and collapses any previously open one, and keyboard navigation works (Tab to a trigger, Enter/Space to toggle, Arrow keys to move between triggers). Dark mode flips colors correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/FAQ.tsx
git commit -m "$(cat <<'EOF'
refactor: rebuild FAQ on shadcn Accordion primitive

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 9: Restyle the Newsletter section

**Files:**
- Modify: `src/components/marketing/HomeContent.tsx` (wrapper section only)
- Modify: `src/components/marketing/NewsletterSignup.tsx` (full rewrite)

**Interfaces:**
- Consumes: `RevealSection` (Task 1), `Card` (`@/components/ui/card`), `Input`/`Label`/`Button` (`@/components/ui/*`).
- Produces: no change to `NewsletterSignup`'s public props (`{ className?, title?, description? }`) or its `/api/newsletter` submit/cookie-guard behavior.

- [ ] **Step 1: Update the wrapper section in `HomeContent.tsx`**

`src/components/marketing/HomeContent.tsx` — replace the entire file:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '@/components/marketing/Hero';
import HomepageApps from '@/components/marketing/HomepageApps';
import About from '@/components/marketing/About';
import Testimonials from '@/components/marketing/Testimonials';
import CompactRoadmap from '@/components/marketing/CompactRoadmap';
import FAQ from '@/components/marketing/FAQ';
import NewsletterSignup from '@/components/marketing/NewsletterSignup';
import LiveChat from '@/components/marketing/LiveChat';
import RevealSection from '@/components/marketing/RevealSection';
import { Card } from '@/components/ui/card';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  const [appsLoaded, setAppsLoaded] = useState(false);

  useEffect(() => {
    if (searchParams?.get('cache-cleared') === 'true') {
      setShowCacheCleared(true);
      setTimeout(() => setShowCacheCleared(false), 5000);
    }
  }, [searchParams]);

  // Handle anchor links after apps are loaded
  useEffect(() => {
    if (appsLoaded && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#about') {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
          const element = document.getElementById('about');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [appsLoaded]);

  return (
    <main>
      {showCacheCleared && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">✅ Cache cleared successfully! Hydration issues should be resolved.</p>
        </div>
      )}
      <Hero />
      <HomepageApps onAppsLoaded={() => setAppsLoaded(true)} />
      <About />
      <Testimonials />
      <CompactRoadmap />
      <FAQ />
      <RevealSection className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <Card className="max-w-2xl mx-auto p-8 md:p-10">
            <NewsletterSignup />
          </Card>
        </div>
      </RevealSection>
      <LiveChat />
    </main>
  );
}
```

- [ ] **Step 2: Rewrite `NewsletterSignup.tsx`**

`src/components/marketing/NewsletterSignup.tsx` — replace the entire file:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewsletterSignupProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function NewsletterSignup({ 
  className = '',
  title = 'Subscribe to our newsletter',
  description = 'Get weekly updates on the latest articles and insights.'
}: NewsletterSignupProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);

  useEffect(() => {
    // Check if user has already subscribed
    const subscribedEmail = Cookies.get('newsletter_subscribed');
    if (subscribedEmail) {
      setHasSubscribed(true);
      setEmail(subscribedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Set cookie to prevent multiple signups
      Cookies.set('newsletter_subscribed', email, { expires: 365 }); // Expires in 1 year
      setIsSuccess(true);
      setHasSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubscribed) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[220px] ${className}`}>
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
          <h3 className="text-xl font-semibold text-foreground mb-2">You're Subscribed!</h3>
          <p className="text-muted-foreground mb-1">
            {firstName ? `Thank you for subscribing, ${firstName}!` : 'Thank you for subscribing to our newsletter.'}
          </p>
          <p className="text-muted-foreground">Updates will be sent to <span className="font-semibold text-foreground">{email}</span>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="newsletter-first-name" className="sr-only">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newsletter-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newsletter-last-name" className="sr-only">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newsletter-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newsletter-email" className="sr-only">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      {isSuccess && (
        <p className="text-sm text-primary text-center">Successfully subscribed! Welcome to our newsletter.</p>
      )}
    </div>
  );
}
```

Title/description prop defaults, the `/api/newsletter` POST call, and the cookie-based re-subscribe guard are unchanged.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Manual visual check + functional smoke test**

Run: `npm run dev`, scroll to the bottom of the homepage.
- Confirm the newsletter form now sits inside a bordered `Card` on a plain background (no blue/indigo band), with standard token-styled inputs and a full-width submit `Button`.
- Submit the form with a test email (or inspect that the POST request to `/api/newsletter` still fires correctly via devtools network tab) and confirm the success state renders (checkmark, "You're Subscribed!", token-styled text) — do not worry about actually completing the newsletter subscription if that has side effects in the connected system; verifying the request shape and success-state rendering is sufficient.
- Dark mode flips all colors correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/HomeContent.tsx src/components/marketing/NewsletterSignup.tsx
git commit -m "$(cat <<'EOF'
refactor: restyle Newsletter section as a quiet card, drop gradient band

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JgF9vJuvVYDYmCZ8NZzXXM
EOF
)"
```

---

## Task 10: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full build and lint**

Run: `npm run build && npm run lint`

Expected: both succeed with no errors.

- [ ] **Step 2: Grep sweep for hardcoded brand colors**

Run:

```bash
grep -rn "indigo-\|purple-\|blue-[0-9]" \
  src/components/marketing/Hero.tsx \
  src/components/marketing/HomepageApps.tsx \
  src/components/marketing/About.tsx \
  src/components/marketing/CompactRoadmap.tsx \
  src/components/marketing/FAQ.tsx \
  src/components/marketing/NewsletterSignup.tsx \
  src/components/marketing/HomeContent.tsx \
  src/components/marketing/AppPreviewCard.tsx \
  src/components/marketing/TestimonialPreviewCard.tsx \
  src/components/marketing/Testimonials.tsx
```

Expected: no output.

- [ ] **Step 3: Confirm no remaining raw hand-styled buttons on the homepage**

Run: `grep -rn "bg-blue-600\|bg-indigo-600" src/components/marketing/Hero.tsx src/components/marketing/HomepageApps.tsx src/components/marketing/AppPreviewCard.tsx src/components/marketing/CompactRoadmap.tsx`

Expected: no output (every button-shaped element in these files is now a shadcn `Button`).

- [ ] **Step 4: Responsive check across all 8 sections**

Run: `npm run dev`. At each of ~375px (mobile), ~768px (tablet), and ~1280px (desktop) viewport widths, load the homepage and scroll through Hero → HomepageApps → About → Testimonials → CompactRoadmap → FAQ → Newsletter. Confirm: no horizontal scroll anywhere, the Hero diagram stacks correctly below the text on mobile, the About stat `HairlineGrid` is 2 columns on mobile / 4 on desktop, app/testimonial/roadmap card grids reflow correctly, the FAQ accordion and Newsletter form are usable and correctly sized at all three widths, and every interactive element (buttons, accordion triggers, form fields) has a visible focus ring when tabbed to with the keyboard.

- [ ] **Step 5: Dark mode + reduced motion check**

In the running dev server, toggle the Navbar's theme button and scroll through all 8 sections — background/text/border/primary colors should flip correctly everywhere, including the hero diagram, hairline-grid stat cells, all cards, the accordion, and the newsletter card. Then enable "Emulate CSS prefers-reduced-motion: reduce" in devtools, reload, and confirm: the hero diagram renders fully drawn/settled with no animation, and each section's content is visible immediately on scroll with no fade/slide transition.

- [ ] **Step 6: Confirm the spec's decisions are reflected**

Cross-check `docs/superpowers/specs/2026-09-01-visual-refresh-homepage-design.md` against the running homepage: asymmetric hero with connected-nodes diagram and no large centered logo (done in Task 3); every section using the `mx-auto max-w-6xl px-6 py-20` container and the specified background alternation (done across Tasks 3-9); FAQ on the real `Accordion` primitive (Task 8); Newsletter as a quiet card, not a gradient band (Task 9).

- [ ] **Step 7: Report**

No commit for this task — it's verification-only. If any check in Steps 1-6 fails, fix it as part of the task that owns the broken file (re-open that task's checkbox) rather than patching ad hoc here.
