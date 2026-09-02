# CoFabri Website Visual Refresh — Phase 1: Design System Foundation

## Context

The site (Next.js 16 App Router, Tailwind 3.4) has no real design system: shadcn's supporting tooling (Radix, CVA, `cn()`) is present but shadcn itself was never scaffolded (no `components.json`; `src/components/ui/` holds bespoke marketing components, not shadcn primitives). Symptoms found during reconnaissance:

- Brand blue (`#007bff`, from the logo) is barely used — indigo-600, blue-600, and purple-500/600 are used interchangeably as "the" accent across different files.
- Four divergent button implementations coexist: raw `<Link>`/`<a>` with inline Tailwind, a `.touch-button-*` utility system (`TouchButton`/`TouchLink`), a `SparkleButton` with particle effects, and unused `.btn-primary`/`.btn-secondary` classes in `globals.css`.
- Two competing fonts load simultaneously (Poppins via CSS `@import`, Inter via `next/font/google`), with Inter winning on `<body>` by CSS order.
- Two Tailwind config files (`tailwind.config.js` and `.ts`) exist with drifted, non-identical content.
- Border-radius, heading treatment (plain vs. shimmering gradient text), and page richness (homepage/apps heavily composed, contact page bare) are inconsistent across pages with no shared template.
- Decorative effects (animated gradient blobs, aurora backgrounds, shimmering gradient text, particle-button clicks) work against the "minimalistic, tasteful, premium, Apple-like" tone the refresh is targeting.

This refresh is being decomposed into sub-projects: **this spec covers Phase 1 only** — the shared design system foundation. Subsequent phases (each getting their own brainstorm/spec cycle) will apply this foundation page-by-page, starting with the homepage.

Reference projects used as style inspiration (both real Tailwind v4 + shadcn projects):
- **rx-bridge** (`/Users/noahstahl/Desktop/CoFabri App Development/CoFabri Medical/rx-bridge`) — tighter/techier: `new-york` shadcn style, Geist font, `rounded-md` buttons, `0.625rem` base radius, bordered/shadowed cards.
- **medoura** (`/Users/noahstahl/Desktop/CoFabri App Development/CoFabri Medical/medoura`) — softer/warmer: a real branded primary token bound throughout (`--medoura-signal`), Plus Jakarta Sans, pill buttons, "hairline-grid" pattern replacing bordered cards.

Direction approved: a **blend** — Medoura's branded-token approach (bind CoFabri's real `#007bff` into `--primary`, use sparingly) and its hairline-grid pattern for feature sections, combined with Rx-Bridge's tighter radius/button shape — restrained toward an Apple-like minimal-premium tone (quiet neutral base, one accent color, subtle motion only, no decorative gradients/auroras/blobs). Confetti is the one playful effect kept, reserved for genuine success moments (e.g. signup).

## Goals

1. Formally scaffold shadcn/ui (Tailwind v4, `new-york` style, `neutral` base) as the site's actual component system.
2. Establish one consistent token system (color incl. dark mode, typography, radius, spacing) that every future page phase builds on.
3. Rebuild the two truly global surfaces — Navbar and Footer — on the new foundation, since every page depends on them.
4. Consolidate the four competing button implementations into shadcn's single `Button` component.
5. Full responsive support (mobile / tablet / desktop, correct touch-target sizing) on every element built in this phase.
6. Leave all other pages' content/copy/structure untouched in this phase — visual foundation only. Page-level restyling is out of scope here and will happen in later phases.

## Non-goals

- Restyling homepage, apps, contact, knowledge-base, roadmaps, signup, support, status, or legal page content/layout (later phases).
- Content or copy changes anywhere.
- Backend/API changes.

## Design

### 1. Tooling migration

- Upgrade Tailwind CSS 3.4 → 4, moving to the CSS-first `@theme inline` configuration in `globals.css` (matching both reference projects) and removing the two conflicting `tailwind.config.js`/`.ts` files.
- Run `shadcn init` properly: `components.json` with `style: "new-york"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"`.
- Resolve the current `src/components/ui/` naming collision: move the existing bespoke marketing components (Hero, Navbar, Footer, ContactForm, etc.) to `src/components/marketing/` (or equivalent), reserving `src/components/ui/` exclusively for real shadcn primitives going forward.

### 2. Color tokens & dark mode

- `--primary` bound to CoFabri's actual brand blue (`#007bff`), used sparingly — CTAs, links, active states, focus rings. Not used for gradients, decorative fills, or large background washes.
- All other tokens (`--background`, `--card`, `--border`, `--muted`, etc.) stay close to shadcn's default neutral OKLCH scale — a quiet, mostly gray/white UI where blue appears only at decision points. This is a deliberate departure from the current site's indigo/purple/blue mixing.
- Full light/dark theme pair defined via shadcn's standard variable set. `--primary` stays the same blue in both themes (verify contrast against the dark background during implementation; remap only if `#007bff` fails contrast on near-black, following Medoura's remap pattern as a fallback).
- Single source of truth: no more per-component hardcoded `indigo-*`/`purple-*`/`blue-*` Tailwind classes for brand color — everything routes through the `--primary` token.

### 3. Typography

- Replace Poppins (`@import`) and Inter (`next/font/google`) with **Geist** (`next/font/google`), applied globally via a single mechanism (CSS variable + Tailwind `@theme inline`, no competing `@import`).
- Type scale (consistent across all future pages):
  - Hero H1: `text-5xl md:text-6xl font-semibold tracking-tight`
  - Section H2: `text-3xl md:text-4xl font-semibold`
  - Body: `text-base md:text-lg text-muted-foreground leading-relaxed`
  - Eyebrow/label: `text-xs uppercase tracking-wide text-muted-foreground`
- `font-semibold` for headings (not `font-bold`) — deliberately quieter weight, part of the Apple-like tone.

### 4. Radius & spacing

- Base radius `--radius: 0.625rem` (rx-bridge-leaning, not Medoura's soft `1rem`/pill-everything).
- Buttons: `rounded-md`. Cards: `rounded-xl`.
- Section container convention: `mx-auto max-w-6xl px-6 py-20` (adopted from medoura, consistent site-wide), replacing today's inconsistent per-page container/padding choices.

### 5. Motion

- Subtle only: fade/slide-in on scroll for section reveals (via existing `framer-motion` or `react-intersection-observer` dependencies), gentle hover states (slight scale/shadow/border-color shift). No shimmering gradient text, no animated gradient blobs/orbs, no aurora backgrounds, no particle-click effects.
- All motion respects `prefers-reduced-motion`.
- Confetti is kept, but only wired to genuine success moments (e.g. signup confirmation) — the `SparkleButton` particle effect and decorative blob/aurora animations are removed.

### 6. Components installed (this phase)

Via `shadcn add`: `button`, `card`, `badge`, `input`, `textarea`, `label`, `form`, `select`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `accordion`, `tooltip`, `separator`, `skeleton`, `sonner`.

Custom, built on top of shadcn primitives for reuse in later phases:
- **Section heading** pattern: eyebrow label + H2 + optional subhead.
- **Hairline-grid**: Medoura-style bordered grid sheet (cells draw their own `border-b border-r`) as the feature-grid alternative to individually shadowed cards.

### 7. Navbar & Footer rebuild

Rebuilt now (not deferred) since every page depends on them:
- Navbar: shadcn `Button`/`DropdownMenu`/`Sheet` (mobile) replacing the current `TouchButton`/`TouchLink` system entirely.
- Footer: consistent with the new spacing/typography/color tokens.
- Both fully responsive (mobile hamburger/sheet nav through desktop inline nav).

### 8. Button consolidation

Every button site-wide (across all phases, but the component itself ships in this phase) becomes shadcn's `Button` with its CVA variants (`default`/`outline`/`ghost`/etc.), replacing: raw inline-styled links, the `.touch-button-*` classes, `SparkleButton`, and the unused `.btn-primary`/`.btn-secondary`/`.futuristic-button` classes in `globals.css` (which get deleted).

### 9. Responsive requirement

Every element built in this phase (primitives, navbar, footer, section-heading, hairline-grid) must be verified at mobile, tablet, and desktop breakpoints, with correct touch-target sizing on mobile. This standard carries forward into every later page-phase as well.

## Testing / Verification

- Build compiles cleanly after the Tailwind 3→4 upgrade and `shadcn init`.
- Visual check of every installed primitive, the navbar, and the footer at mobile/tablet/desktop breakpoints.
- Dark mode toggle verified across all of the above (including contrast check on `--primary` against the dark background).
- `prefers-reduced-motion` verified (no motion plays when enabled).
- Confirm no remaining references to the deleted `.btn-primary`/`.btn-secondary`/`.futuristic-button` classes, `SparkleButton`, blob/aurora animations, Poppins import, or the old `tailwind.config.js`/`.ts` pair.
- Confirm `src/components/ui/` contains only real shadcn primitives post-migration.

## Out of scope / deferred to later phases

- Homepage, apps, contact, knowledge-base, roadmaps, signup, support, status, legal page restyling.
- Any copy/content changes.

## Addendum: decisions confirmed after mockup review

The Phase 1 mockup ([artifact](https://claude.ai/code/artifact/d4007811-28ad-4940-977b-b12be7329215)) surfaced a few decisions not fully specified above:

- **Hero signature motion**: a small "connected nodes" diagram (a handful of nodes joined by lines that draw themselves in on load, root node breathing gently afterward) replaces a generic centered-hero layout — chosen over an "assembling app grid" and a "live product glimpse" concept after live side-by-side comparison. Hero layout is asymmetric (text left, diagram right, stacking on mobile), not centered.
- **Icon usage**: icon + text paired everywhere — nav links, footer links, the stat row, and primary/secondary buttons all get a small icon alongside their label, to cut text density without removing any visible/crawlable text (kept deliberately compatible with the SEO decision below).
- **Eyebrow labels**: kept. The small uppercase eyebrow tag above section headings stays as a structural device site-wide.
- **SEO**: a technical SEO pass (meta descriptions, structured data/JSON-LD, heading hierarchy, alt text) is in scope for the later page-by-page phases, not Phase 1 itself (Phase 1 has no page content to optimize). Because icons are always paired with real visible text rather than replacing it, this stays compatible with that later SEO work.

## Addendum 2 (2026-09-02): scoped amendment to the no-gradient rule

Raised during Phase 3 (apps page) brainstorming. The original Motion/Color sections above ban decorative gradients outright (blobs, auroras, gradient-clip text, `--primary`-based washes). That rule is amended, narrowly:

- **What's now allowed**: a monochrome `--primary`-only radial glow behind hero/page-header content, with a slow "breathing" pulse (opacity 0.85→1, scale 1→1.06, ~5s ease-in-out loop). Implemented once as a shared `GradientGlow` primitive (`src/components/marketing/GradientGlow.tsx`) so the treatment stays visually identical everywhere it's used, rather than being redefined per component. Respects `prefers-reduced-motion` (renders at rest, no pulse).
- **Where it's allowed**: hero/page-header backgrounds only — `Hero.tsx` (homepage) and the new `PageHeader` primitive (page-top headers on non-homepage pages, starting with `/apps`).
- **What's still banned, unchanged**: gradients on buttons, cards, badges, or text; multi-color gradients; full-bleed color washes; blobs/auroras/particle effects anywhere else on the site.

**Why**: real appetite for more visual richness in the hero/header moment specifically, tested live via mockup (radial glow read as "depth," not "decoration," at the opacity/scope above) and confirmed live with the animation. Keeping it monochrome and motion-respecting preserves the Apple-like restrained tone everywhere else; it's an amendment to one specific surface, not a reopening of the whole rule.

**Also considered and declined**: during the same discussion, several newly-installed third-party design skills (`minimalist-ui`, `gpt-taste`, `high-end-visual-design`, `design-taste-frontend`, `redesign-existing-projects`) were reviewed as candidates for a full foundation redo — including two live mockup rounds exploring an "editorial calm" serif direction, a "soft structuralism" bold-grotesk/double-bezel direction, and an "ethereal glass" dark-mode/mesh-gradient direction, plus an attempted blend. None replaced the shipped shadcn/tokens foundation: the blend read as incoherent (mixing systems built for different brand personalities), and no specific complaint was raised against the current direction itself — the appetite was for more gradient richness, which this amendment addresses directly. Decision: keep the Phase 1 foundation as the system of record. `web-design-guidelines` (official Vercel accessibility/UX audit) remains available as a low-risk, non-visual audit pass against shipped surfaces, to run whenever wanted — not tied to any of the above.
