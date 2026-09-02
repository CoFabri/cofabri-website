# CoFabri Website Visual Refresh — Phase 2: Homepage

## Context

Phase 1 (design system foundation) is complete and merged to `main`: shadcn/ui (`new-york` style), Tailwind v4, a CoFabri-branded token theme (`--primary: #007BFF` light / `#2B96FF` dark) with working light/dark mode, Geist typography, the `Button`/`Card`/`Badge`/`Accordion`/etc. primitives, the eyebrow `SectionHeading` and `HairlineGrid` custom primitives, and a rebuilt Navbar/Footer. Page-level restyling was explicitly out of scope for Phase 1.

This spec covers Phase 2: applying that foundation to the homepage — the first page phase, per the plan's approved "foundation first, then page-by-page, starting with homepage" sequencing.

Reconnaissance findings:

- The homepage route (`src/app/page.tsx` → `HomeContent.tsx`) renders 8 sections in order: **Hero → HomepageApps → About → Testimonials → CompactRoadmap → FAQ → NewsletterSignup (wrapped in a gradient band) → LiveChat**.
- `Features.tsx`, `Partners.tsx`, `CTA.tsx`, and `GradientHeading.tsx` are **not rendered on the homepage at all** (orphaned/unused there) and are out of scope for this phase.
- `Hero.tsx`, `HomepageApps.tsx`, and `About.tsx` still carry Phase 1's targeted legacy patterns: hardcoded `indigo-*`/`purple-*`/`blue-*` colors, raw hand-styled `<Link>` buttons instead of the shadcn `Button`, `AnimatedGradient` + five animated blur blobs, and gradient-clip heading text.
- `Testimonials.tsx` already uses the new eyebrow `SectionHeading`; the rest of the sections (`CompactRoadmap.tsx`, `FAQ.tsx`) still use the old plain-title call of `SectionHeading` and legacy `gray-*`/`blue-*` colors.
- `FAQ.tsx` reimplements an accordion by hand with `TouchButton`; the real shadcn `Accordion` primitive was installed in Phase 1 but has never been used anywhere.
- `NewsletterSignup.tsx` is styled for a colored background (translucent white inputs, white text) because `HomeContent.tsx` wraps it in a `bg-gradient-to-r from-blue-500 to-indigo-600` band — a decorative gradient wash, which the foundation's token rules disallow for `--primary`.
- All real content (hero headline/subhead, About's body copy and stat values, the 6 FAQ entries) is preserved as-is; Testimonials and Apps data are fetched live from Airtable with no hardcoded copy to touch. `framer-motion` and `react-intersection-observer` are already installed and available for scroll-reveal motion.

## Goals

1. Apply the Phase 1 token system, `Button`, `Card`, `Badge`, `Accordion`, `SectionHeading`, and `HairlineGrid` primitives to every real homepage section, eliminating all remaining hardcoded `indigo-*`/`purple-*`/`blue-*` colors and raw hand-styled buttons/links on the homepage.
2. Retire the last site-wide legacy decorative effects that live on the homepage: `AnimatedGradient`, the five animated blur blobs in `Hero.tsx`, and the gradient-clip heading text in `HomepageApps.tsx`.
3. Give the homepage a consistent section rhythm: the `mx-auto max-w-6xl px-6 py-20` container convention and alternating `bg-background`/`bg-muted/30` section backgrounds, replacing today's per-section inconsistency (`container mx-auto px-4`, `bg-gray-50`, `bg-gradient-to-b`).
4. Ship the approved "connected nodes" hero motion (from the Phase 1 mockup) adapted to the homepage's real headline/subhead/CTA copy, in an asymmetric text-left/diagram-right layout.
5. Add subtle scroll-reveal motion (fade/slide-in) across sections, respecting `prefers-reduced-motion`, using the already-installed `framer-motion`.
6. Full responsive support (mobile/tablet/desktop) and dark-mode correctness on every section touched.

## Non-goals

- No copy/content changes: hero headline/subhead, About's body paragraphs and bullet text, the 6 FAQ question/answer pairs, and all Airtable-sourced data (apps, testimonials, roadmap features) stay exactly as they are today.
- No section reordering, addition, or removal — this phase restyles the existing 8 sections in place.
- No changes to `Features.tsx`, `Partners.tsx`, `CTA.tsx`, or `GradientHeading.tsx` — none of them render on the homepage; they're addressed (if ever) in whichever later phase restyles the pages that actually use them.
- No changes to data-fetching logic, API routes, or `LiveChat.tsx` (a third-party script loader with no visual markup of its own).
- No backend/API changes.

## Design

### 1. Hero (`Hero.tsx`)

- Layout becomes asymmetric: text column (headline, subhead, two CTAs) on the left, the connected-nodes diagram on the right; stacks vertically on mobile (text first, diagram below).
- The large centered `Logo` is removed — the Navbar already carries brand presence on every page.
- `AnimatedGradient` and the five hardcoded blur-blob `<div>`s (`bg-indigo-100`/`purple-100`/`blue-100`/`indigo-50`/`blue-50` + `animate-float`/`animate-float-slow`) are deleted, along with the decorative floating ring at the bottom.
- Headline ("Powerful SaaS apps for your business needs") and subhead ("Self-service solutions to help you grow and succeed") copy is unchanged, restyled to the foundation's hero type scale (`text-5xl md:text-6xl font-semibold tracking-tight` / `text-base md:text-lg text-muted-foreground leading-relaxed`).
- The two CTAs (`Explore Apps`, `Contact Us`) become shadcn `Button` components with paired icons (e.g. `ArrowRight`/`LayoutGrid` and `Mail`), matching the Navbar's icon+text convention — `Explore Apps` as the default/primary variant, `Contact Us` as `outline`.
- **Connected-nodes diagram**: a small SVG of a handful of nodes joined by lines, drawn in with a `framer-motion` stroke-animation on mount, with the root node gently "breathing" (subtle scale pulse) afterward. Skips animation entirely under `prefers-reduced-motion` (renders the fully-drawn static state instead).

### 2. HomepageApps (`HomepageApps.tsx`)

- The gradient-clip heading (`bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`) is replaced by the token-based `SectionHeading` (eyebrow + H2), matching every other section.
- The "View All Apps" raw `<Link>` becomes a shadcn `Button` (`asChild`) with an icon.
- `AppPreviewCard`'s internal `bg-blue-600 hover:bg-blue-700` button is tokenized to the `Button` component / `bg-primary`.
- Data fetching, confetti-on-launch-day logic, and the app grid structure are unchanged.

### 3. About (`About.tsx`)

- Body copy (3 paragraphs) and the "Our Mission" / "Why Choose CoFabri?" copy are unchanged.
- The 3 hardcoded `bg-blue-500` bullet dots and 4 `bg-blue-100`/`text-blue-600` checkmark circles become `bg-primary`/`bg-accent`/`text-accent-foreground` token equivalents.
- The rotated gradient-blur backdrop (`bg-gradient-to-r from-blue-500/10 to-purple-500/10`) behind the Mission block is removed; the Mission block becomes a plain shadcn `Card`.
- The section's own background (`bg-gradient-to-b from-white to-gray-50`) becomes a flat token background per the alternating-section-background convention (§6).
- **Stat row**: the 4 stats (Active Users 10K+, Apps Launched 5+, Countries Served 50+, Success Rate 98%) move from individual icon-in-blue-circle blocks to a `HairlineGrid`/`HairlineGridItem` layout — bordered cells, primary-tinted icon (no colored circle backdrop), value + label per cell. Stat values/labels/icons are unchanged.

### 4. Testimonials (`Testimonials.tsx`)

- Already uses the eyebrow `SectionHeading` — no heading change needed.
- `TestimonialPreviewCard` (and its loading skeleton, which is already plain gray/tokenless) gets any remaining hardcoded colors tokenized.
- Data fetching (`/api/testimonials`) is unchanged.

### 5. CompactRoadmap (`CompactRoadmap.tsx`)

- `SectionHeading` call is unchanged in content, restyled by the primitive itself (no code change needed there beyond what Phase 1 already did).
- Each custom bordered `<div>` roadmap card becomes a shadcn `Card`; the status pill (currently a raw `<span>` styled via `getStatusColor`) becomes a `Badge`, keeping the existing status→color mapping logic but routing its output through `Badge`'s variant system where it maps cleanly, or a token-based custom class where it doesn't (e.g. status colors that aren't part of the default `Badge` palette stay as explicit token-safe Tailwind classes, not `indigo`/`purple`).
- The "View All Roadmaps" raw `<Link>` becomes a `Button` (`asChild`) with an icon; the hardcoded `text-blue-600 group-hover:text-blue-800` "View Details →" text is tokenized.
- Data fetching and grouping/pagination logic are unchanged.

### 6. FAQ (`FAQ.tsx`)

- The hand-rolled `TouchButton`-based disclosure is replaced with the real shadcn `Accordion` primitive (`AccordionItem`/`AccordionTrigger`/`AccordionContent`), installed in Phase 1 but never used anywhere until now.
- All 6 question/answer pairs are unchanged.
- Section background (`bg-gray-50`) becomes `bg-muted/30` per the alternating-section-background convention.

### 7. Newsletter section (`HomeContent.tsx` wrapper + `NewsletterSignup.tsx`)

- The wrapping `bg-gradient-to-r from-blue-500 to-indigo-600` band in `HomeContent.tsx` is replaced with a plain `bg-muted/30` section containing a bordered shadcn `Card`.
- `NewsletterSignup.tsx`'s internals (currently styled for a colored background: `text-white` headings, `bg-white/10` translucent inputs, `text-blue-100` placeholders) are restyled to standard token-based form fields: shadcn `Input`/`Label` for the three fields, `Button` for submit, `text-foreground`/`text-muted-foreground` for copy. The success state (`CheckCircleIcon` + "You're Subscribed!") is restyled the same way, using `text-primary`/token-safe success color instead of hardcoded green on a white/20 card.
- Title/description copy (`"Subscribe to our newsletter"` / `"Get weekly updates..."`) and submit behavior (`/api/newsletter` POST, cookie-based re-subscribe guard) are unchanged.

### 8. Motion

- Each section gets a subtle scroll-triggered fade/slide-in (via `framer-motion`'s `whileInView`, or `react-intersection-observer` gating a CSS transition — implementer's choice, consistent site-wide) on first entry into viewport.
- All motion (hero diagram draw-in, root-node breathing, section reveals) respects `prefers-reduced-motion`: reduced-motion users see the fully-settled end state immediately, no animated transition.

### 9. Cross-cutting conventions

- Every section wrapper adopts `mx-auto max-w-6xl px-6 py-20` (replacing the current mix of `container mx-auto px-4` with `py-20`/`py-16`).
- Section backgrounds alternate `bg-background` / `bg-muted/30` down the page for rhythm, replacing today's `bg-white`, `bg-gray-50`, and gradient washes. No section uses a `--primary`-based gradient or full-bleed color wash (confirmed via the Newsletter decision above).
- Every button on the homepage (Hero's 2 CTAs, HomepageApps' "View All Apps", AppPreviewCard's per-app button, CompactRoadmap's "View All Roadmaps", NewsletterSignup's submit) is a shadcn `Button`, none are raw `<Link>`/`<button>` with hand-rolled Tailwind color classes.
- No `indigo-*`, `purple-*`, or hardcoded `blue-*` Tailwind color utility remains anywhere in the 8 homepage-reachable component files after this phase (icons/status-mapping colors that are semantic, e.g. `StatusIndicator`'s red/green/orange dots, are out of scope — they're not brand-color decisions).

## Testing / Verification

- `npm run build` and `npm run lint` pass.
- Visual check of all 8 sections at mobile/tablet/desktop breakpoints — no horizontal scroll, no overlap, correct touch-target sizing on interactive elements (CTAs, accordion triggers, form fields, app/roadmap cards).
- Dark mode toggle verified across every section, including the new Newsletter `Card` and the connected-nodes diagram (line/node colors should read correctly in both themes).
- `prefers-reduced-motion` verified: hero diagram, root-node breathing, and all scroll-reveal transitions are skipped/instant when enabled.
- `grep -rn "indigo-\|purple-\|blue-[0-9]" src/components/marketing/Hero.tsx src/components/marketing/HomepageApps.tsx src/components/marketing/About.tsx src/components/marketing/CompactRoadmap.tsx src/components/marketing/FAQ.tsx src/components/marketing/NewsletterSignup.tsx src/components/marketing/HomeContent.tsx src/components/marketing/AppPreviewCard.tsx src/components/marketing/TestimonialPreviewCard.tsx` — confirm no remaining hardcoded brand-color classes (semantic status colors elsewhere are unaffected since those files aren't in this grep).
- Confirm `AnimatedGradient.tsx`'s only remaining usage (`GradientHeading.tsx`, not homepage-reachable) means it's now safe to consider for removal in a later phase — not removed as a file in this phase, since `GradientHeading.tsx` still references it and is out of scope.
- Confirm all 6 FAQ entries render correctly through the new `Accordion` and are keyboard-navigable (tab to trigger, Enter/Space to expand, arrow-key navigation between items per Radix's default `Accordion` behavior).
- Confirm newsletter subscribe flow (submit → success state → cookie-guarded re-visit) still functions after the restyle.

## Out of scope / deferred to later phases

- `Features.tsx`, `Partners.tsx`, `CTA.tsx`, `GradientHeading.tsx` and every other non-homepage page (apps, contact, knowledge-base, roadmaps, signup, support, status, legal).
- Removing `AnimatedGradient.tsx` as a file (still used by out-of-scope `GradientHeading.tsx`).
- Any copy/content rewrites.
