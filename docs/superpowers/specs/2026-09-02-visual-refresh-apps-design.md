# CoFabri Website Visual Refresh — Phase 3: Apps Page

## Context

Phase 1 (design system foundation) and Phase 2 (homepage) are complete and merged to `main`: shadcn/ui (`new-york` style), Tailwind v4, a CoFabri-branded token theme (`--primary: #007BFF` light / `#2B96FF` dark), Geist typography, the `Button`/`Card`/`Badge`/`Accordion`/`HairlineGrid` primitives, the eyebrow `SectionHeading`, and a rebuilt Navbar/Footer. Phase 2 additionally shipped `RevealSection` (scroll-reveal wrapper) and established the homepage's section-rhythm and per-component restyle conventions.

This spec covers Phase 3: applying that foundation to `/apps`, the second page phase, per "foundation first, then page-by-page." It also folds in a scoped amendment to Phase 1's no-gradient rule, decided during this phase's brainstorming — see the Phase 1 spec's Addendum 2 for the full rationale; this spec only covers the amendment's concrete implementation.

Reconnaissance findings:

- The `/apps` route (`src/app/apps/page.tsx`) renders, in order: Breadcrumbs → `GradientHeading` (title/subtitle over `AnimatedGradient`) → `FeaturedApp` spotlight → `Apps` grid → a hand-styled "Resources & Support" section (2 cards) → `Testimonials` → `NewsletterSignup` (wrapped in a `Card`, from a small out-of-scope Phase 2 fix).
- `GradientHeading` (and its `AnimatedGradient` backdrop) is used on 8 other pages (contact, roadmaps, signup, support, knowledge-base, legal, not-found, `Services.tsx`) — it cannot be modified or removed. `/apps` simply stops using it, the same non-destructive pattern Phase 2 used when it stopped using `AnimatedGradient` on the homepage.
- `Apps.tsx` (the grid actually rendered on `/apps`) already renders the Phase-2-restyled `AppPreviewCard` — it only needs minor token cleanup. `AppCard.tsx` (a separate, still fully-legacy component) is used only by `/preview/[type]/[id]`, not `/apps`, and is out of scope.
- `FeaturedApp.tsx` is the page's biggest legacy surface: a decorative indigo→purple gradient-bordered spotlight card, raw `<img>` tags instead of `next/image`, heroicons instead of lucide.
- "Resources & Support" uses `shadow-lg rounded-3xl` white cards with `bg-blue-100`/`bg-purple-100` icon circles and hand-drawn inline SVGs, structurally identical in spirit to the icon-in-colored-circle pattern Phase 2 already retired from `About.tsx`'s stat row in favor of `HairlineGrid`.
- `Breadcrumbs.tsx` uses heroicons and hardcoded `gray-*`/`blue-600` colors.
- `Testimonials.tsx` and `NewsletterSignup.tsx` internals are already Phase-2-restyled and need no changes beyond the page-level container convention.
- All content/copy is preserved as-is; apps/testimonials data is fetched live from Airtable with no hardcoded copy to touch.

## Goals

1. Apply the Phase 1/2 token system and shadcn primitives (`Button`, `Card`, `Badge`, `HairlineGrid`) to every real `/apps` section, eliminating remaining hardcoded `indigo-*`/`purple-*`/`blue-*` colors and raw hand-styled links/buttons.
2. Stop using `GradientHeading`/`AnimatedGradient` on `/apps` specifically (without touching either component, still needed by 8 other pages) and replace with a new token-based `PageHeader` primitive.
3. Rework `FeaturedApp` to drop its decorative indigo/purple gradient border in favor of a bordered `Card` + `Badge` treatment consistent with the rest of the site.
4. Ship a scoped amendment to the foundation's no-gradient rule: a shared `GradientGlow` primitive (monochrome `--primary` radial glow + slow breathing pulse, reduced-motion aware) used behind hero/page-header content — on the new `PageHeader` and retrofitted onto the already-shipped `Hero.tsx`.
5. Give `/apps` a consistent section rhythm (`mx-auto max-w-6xl px-6 py-20`, alternating `bg-background`/`bg-muted/30`), matching Phase 2's homepage convention.
6. Full responsive support (mobile/tablet/desktop) and dark-mode correctness on every section touched.

## Non-goals

- No copy/content changes anywhere on `/apps`, and no changes to Airtable-sourced data (apps, testimonials).
- No section reordering, addition, or removal on `/apps` — this phase restyles the existing sections in place.
- No changes to `GradientHeading.tsx` or `AnimatedGradient.tsx` themselves — both remain exactly as-is for the 8 other pages that still depend on them.
- No changes to `Testimonials.tsx` or `NewsletterSignup.tsx` internals (already Phase-2-restyled), `AppsCelebration.tsx` (confetti, kept per the foundation spec), or any data-fetching/API logic.
- No changes to `AppCard.tsx` or the `/preview/[type]/[id]` route that uses it — not reachable from `/apps`.
- Reopening the foundation's no-gradient rule beyond the scoped amendment in Addendum 2 (buttons, cards, text, and full-bleed washes stay banned).

## Design

### 1. `GradientGlow` primitive (new, shared)

`src/components/marketing/GradientGlow.tsx` — an absolutely-positioned background layer: a monochrome `--primary` radial gradient (`radial-gradient(ellipse 80% 75% at 50% 0%, ...)`, ~0.40 peak opacity fading to transparent) with a `framer-motion` breathing pulse (opacity 0.85→1, scale 1→1.06, ~5s ease-in-out, infinite). Uses `useReducedMotion()` — renders at rest (no pulse) when reduced motion is preferred. Takes no props beyond `className` (for sizing/positioning by the consumer). Both `PageHeader` and `Hero.tsx` render it as a backdrop layer so the treatment is defined once.

### 2. `PageHeader` primitive (new)

`src/components/marketing/PageHeader.tsx` — sibling to `SectionHeading`, but renders an `h1` for page-top use: eyebrow (optional) + H1 (`text-4xl md:text-6xl font-semibold tracking-tight`) + subtitle (optional), with `GradientGlow` behind it. No `AnimatedGradient`, no other decorative backdrop. Props: `{ eyebrow?, title, subtitle?, className? }`, matching `SectionHeading`'s shape for consistency.

`apps/page.tsx` renders `PageHeader` in place of `GradientHeading`:

```tsx
<PageHeader
  eyebrow="Apps"
  title="Our Apps"
  subtitle="Explore our full collection of applications designed to enhance your productivity."
/>
```

This is the pattern any later phase can reuse when it stops using `GradientHeading` on its own page.

### 3. Hero.tsx retrofit

`Hero.tsx` (homepage, shipped in Phase 2) adds `GradientGlow` as a backdrop layer behind its existing text/diagram content — no other change to the component. Brings the homepage in line with `/apps` now that both have a hero-type moment.

### 4. FeaturedApp rework

Full rewrite, dropping the `bg-gradient-to-br from-indigo-500 to-purple-600` border entirely:

- Becomes a bordered `Card`, no gradient.
- The "Featured App" label becomes a `Badge` (`text-primary`/`bg-accent`), replacing the indigo `SparklesIcon` + text pairing.
- Screenshot image: `next/image` (matching `AppPreviewCard`), not raw `<img>`.
- "Learn More" link becomes a `Button` with a lucide `Rocket` icon, replacing the indigo pill link.
- Loading skeleton: plain `bg-muted animate-pulse` blocks (matching `Testimonials.tsx`'s skeleton pattern), no gradient wrapper.
- Wrapped in `RevealSection`.

### 5. Apps grid (`Apps.tsx`) — token cleanup only

- Spinner: `border-blue-500` → `border-primary`.
- Error state: `text-gray-900`/`text-gray-600` → `text-foreground`/`text-muted-foreground`.
- Grid logic, `AppPreviewCard`, `AppsCelebration` unchanged.
- `FeaturedApp` + `Apps` grid share one `RevealSection`/background block (`bg-muted/30`) — see §7.

### 6. Resources & Support → `HairlineGrid`

Two `HairlineGridItem` cells (not two separate `shadow-lg rounded-3xl` cards), each with: a lucide icon in `text-primary` (`TrendingUp` for Product Roadmap, `BookOpen` for Knowledge Base — the same icons `Navbar.tsx` already uses for these links), title, description. Replaces the `bg-blue-100`/`bg-purple-100` icon circles and inline hand-drawn SVGs. Section wrapped in `RevealSection`, `bg-background` (see §7).

### 7. Section rhythm

`mx-auto max-w-6xl px-6 py-20` container convention throughout, replacing `container mx-auto px-4`. Backgrounds alternate:

`PageHeader` (`bg-background`) → `FeaturedApp` + `Apps` grid (`bg-muted/30`) → Resources & Support (`bg-background`) → `Testimonials` (`bg-muted/30`, unchanged — hardcoded in the Phase-2-shipped component) → Newsletter (`bg-background`).

This keeps clean alternation even though `Testimonials.tsx` isn't touched and always renders `bg-muted/30`.

### 8. Breadcrumbs tokenization

`Breadcrumbs.tsx`: swap heroicons (`ChevronRightIcon`/`HomeIcon`) for lucide (`ChevronRight`/`Home`); tokenize `text-gray-600`/`text-gray-900`/`hover:text-blue-600` → `text-muted-foreground`/`text-foreground`/`hover:text-primary`. Structure and JSON-LD structured-data output unchanged. (This component is shared across pages, so this change is visible everywhere breadcrumbs render — acceptable since it's a pure token/icon swap, not a layout or content change, consistent with how Phase 1 handled shared-component token fixes.)

### 9. Motion

`PageHeader`'s and `Hero.tsx`'s `GradientGlow`, plus `RevealSection` wrapping `FeaturedApp`+`Apps` and Resources & Support — all reduced-motion-aware per the existing conventions.

### 10. Untouched

`Testimonials.tsx`, `NewsletterSignup.tsx` internals, its `Card` wrapper (gets the new container convention only), `AppsCelebration`, `GradientHeading.tsx`, `AnimatedGradient.tsx`, `AppCard.tsx`, all data-fetching/confetti logic, all copy.

## Testing / Verification

- `npm run build` and `npm run lint` pass.
- Visual check of every restyled section at mobile/tablet/desktop breakpoints — no horizontal scroll, correct touch-target sizing.
- Dark mode toggle verified across `PageHeader`, `FeaturedApp`, the `HairlineGrid` resources section, and the retrofitted `Hero.tsx` glow.
- `prefers-reduced-motion` verified: `GradientGlow`'s pulse and all `RevealSection` scroll-reveals are skipped/instant when enabled.
- `grep -rn "indigo-\|purple-\|blue-[0-9]" src/app/apps/page.tsx src/components/marketing/FeaturedApp.tsx src/components/marketing/Apps.tsx src/components/marketing/Breadcrumbs.tsx src/components/marketing/PageHeader.tsx src/components/marketing/GradientGlow.tsx src/components/marketing/Hero.tsx` — confirm no remaining hardcoded brand-color classes.
- Confirm `GradientHeading.tsx`/`AnimatedGradient.tsx` are unmodified and still used correctly by the other 8 pages (spot-check one, e.g. `/contact`).
- Confirm the Featured App spotlight still only renders when an app has `featureOnWebsite` set, and the newsletter subscribe flow still functions after the container-convention change.

## Out of scope / deferred to later phases

- Contact, knowledge-base, roadmaps, signup, support, status, legal pages.
- `AppCard.tsx` / `/preview/[type]/[id]`.
- Any copy/content rewrites.
- Any further reopening of the foundation's gradient rule beyond Addendum 2's scope.
