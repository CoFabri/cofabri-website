# Mobile Menu "Cover" Pattern — Shared Spec

**Source:** Claude Design project "CoFabri Medical Branding" (`b495519c-4c98-447f-b6d8-c5b1c586df65`), file `Mobile Menu Patterns.dc.html`, patterns **3a** (cover · light) and **3b** (cover · dark). Canvas URL: `https://claude.ai/design/p/b495519c-4c98-447f-b6d8-c5b1c586df65?file=Mobile+Menu+Patterns.dc.html`

This document is the shared design contract for a new full-screen mobile navigation pattern being rolled out across four sites: Praxis, Medoura, RxBridge, and the CoFabri corporate website. Each site has its own implementation plan that adapts this pattern to its real content, tokens, and codebase conventions — **do not port the mockup's literal hex values, font (Geist), or copy ("38 ST", "Book coverage", etc.) into a site whose plan says otherwise.** The mockup used Praxis's brand as a stand-in for all four; only Praxis's plan actually matches it closely.

## What "cover" means

Today, all four sites' mobile menus are either a **dropdown panel** (pushes content down, semi-transparent backdrop-blur bar under the sticky header) or a **side drawer** (CoFabri's `Sheet`, slides in from the right, dims the page behind it). The cover pattern replaces that with a **full-viewport opaque overlay** — `position: fixed; inset: 0`, above the header, with no page content or dimmed backdrop visible behind it. It reads as a new layer, not a panel.

## Structure (top to bottom)

1. **Container:** `position: fixed; inset: 0; z-index: <above the site's header z-index>`. Opaque background using the site's own `--background`/`--surface`/`--canvas` token (whatever that site calls it) for light mode, and its own dark-mode equivalent for dark mode — never a hardcoded hex. Padding: roughly the site's header height at the top (so the logo row doesn't collide with the real header, which stays visible/fixed above it or is hidden — match whatever's least disruptive per site), ~20-22px on the sides, ~36px at the bottom, respecting safe-area insets on iOS if the site already does that elsewhere.
2. **Header row:** the site's existing logo component (theme-reactive, reuse as-is) on the left; a circular close (✕) button on the right, 44×44px hit target, subtle background (`bg-muted`/`bg-accent`/equivalent), `aria-label="Close menu"`.
3. **Nav links list**, `margin-top: 28px`, vertical stack, using the site's *real, current* nav link data (don't invent links):
   - Each row: flex, `align-items: baseline`, `gap: 14px`.
   - Index number (`01`, `02`, …) in the site's mono font token, ~10px, `letter-spacing: .14em`, colored with the site's accent/brand-ink token.
   - Label at ~28px, weight 600, `letter-spacing: -0.035em`, `line-height: 1.05`.
   - `padding: 14px 0`, `border-bottom: 1px solid <site's hairline/border token>` — omit the border on the last item.
   - A trailing small mono pill badge is optional and only allowed when it echoes a real, currently-published number from that site's own content (e.g. Praxis's "34 states" from `Coverage.tsx`) — never fabricate a stat.
4. **Bottom-pinned block** (`margin-top: auto`, so it sits at the bottom of the cover regardless of link count):
   - a. Primary CTA — filled brand color, white/on-brand text, 54px tall, ~11px radius, full width. Only include if the site has a real primary CTA today; reuse its existing copy/href/component.
   - b. Secondary CTA — outline style, same size, directly below. Same rule: reuse what exists, don't invent one.
   - c. **"Switch product" ecosystem strip** (Praxis, Medoura, RxBridge only — not CoFabri, which is the parent site): a small "Switch product" mono/uppercase/muted label, then a 3-column grid (`gap: 4px`, `padding: 4px`, container radius ~13px, container bg = site's muted/chip token) of 56px-tall tiles — icon (CDN URL from `files.cofabri.com/logos/<app>/<app>-icon.svg`, light variant on dark backgrounds) + product name. The current site's own tile is non-interactive (elevated/white card, bold text, no link); the other two are `<a>`/`<Link>` out to their marketing sites (`https://medoura.co`, `https://praxisnp.co`, `https://rx-bridge.com` as applicable — verify against that site's own `EcosystemStrip`/`PANELS` data before hardcoding, since the parent site doesn't have this list itself).
   - d. Footer row: left side = site's existing secondary account link (e.g. "Partner sign in", "Sign in") if one exists, stacked above the site's existing live status-badge component if one exists (reuse it — do not build a new one); right side = the site's existing theme toggle component (segmented light/dark/system control), reused as-is.
5. **Colors:** every color in the cover must come from the site's own existing CSS custom properties / dark-mode tokens — this makes the cover automatically correct in both themes with zero new color work, since all four sites already ship working dark mode.
6. **Motion:** fade the cover in on open only — opacity 0→1, ease, ~200-220ms. No special close animation required.
7. **New behavior** (all four sites currently lack every item below in their mobile menu — add all of them):
   - Lock `document.body` scroll while open; restore the previous inline value on close/unmount.
   - Close on `Escape` keydown.
   - Move focus to the close button when the cover opens.
   - Restore focus to the hamburger trigger button when the cover closes.
   - `role="dialog"`, `aria-modal="true"`, `aria-label="Menu"` on the cover container.
8. The cover replaces the **mobile** (small-viewport) menu only. Desktop nav is untouched.

## Non-goals

- No new npm dependencies. Every site already has everything needed (React state, the site's own theme/logo/status components, plain CSS).
- No changes to desktop nav, footer, or any content section.
- No new brand colors, fonts, or copy — reuse what each site already ships.
