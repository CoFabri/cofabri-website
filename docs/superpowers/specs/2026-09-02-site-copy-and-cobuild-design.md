# Site copy pass + Co-Build partner program — design

Date: 2026-09-02
Repos involved: `cofabri-website` (frontend, this repo) and `cofabri-api` (backend, sibling repo at `/Users/noahstahl/Desktop/CoFabri App Development/cofabri-api`)

## Goal

The site has never had a deliberate copy pass — wording accumulated page by page across an earlier generic-SaaS build and the newer "Quiet Utility" visual redesign, and the two eras read as two different companies. Separately, CoFabri wants to publicly introduce a new business line: **Co-Build**, a partner program where an industry operator brings domain expertise and an existing customer base, CoFabri builds the product, and ownership is shared. This spec covers both: bringing the whole site to one voice, and introducing Co-Build as a first-class part of the site.

## Audience & voice

- Primary visitor: a mix of (a) existing app users looking for support/status/docs and (b) prospective customers evaluating one of the portfolio apps. Not investors/press.
- Target voice: **confident and polished**. The pages built during the Quiet Utility redesign (Hero, Roadmaps, Knowledge Base, Support, Contact, Legal, Status, 404, Changelog) already hit this — terse, declarative fragments ("Built in the open.", "Tell us what broke.", "Say hello."). That voice is the standard; nothing needs inventing, it needs to be applied consistently.
- Company description: CoFabri is **a software studio operating a portfolio of independent apps across industries** — not a single-product platform, not a dev agency. Copy should reflect this everywhere the company describes itself (About, meta tags, footer, `StructuredData.tsx`), and should set up Co-Build naturally (a studio that already spans industries is a credible partner for industry operators).
- Terminology: **"apps"**, consistently, everywhere (not "products," "solutions," or "SaaS tools").

## Part 1 — General copy fixes (existing pages, no new features)

Findings are from a full read-through of the current copy (see audit below); each item is copy/derived-data only, no new components or routes.

1. **`src/components/marketing/About.tsx`** — full rewrite. Currently generic AI-SaaS boilerplate ("unlock their potential through automation, AI-enhanced tools, and intuitive software," "We're not just a software provider — we're your technology partner"). Rewrite to the target voice and the portfolio-studio description.
2. **`src/components/marketing/FAQ.tsx`** — full rewrite to match voice. The "Who's behind CoFabri?" answer currently says *"We're a small but mighty team building all our tools in-house... No outside agencies."* — this directly contradicts Co-Build and must be rewritten as part of this same change (not left to contradict the new page).
3. **Meta descriptions / OG tags / `StructuredData.tsx`** — rewrite sitewide. Currently generic and stale (e.g. homepage `generateMetadata`: "CoFabri - SaaS Apps for Modern Businesses" / keyword list including "AI tools", "cloud software"). Bring these to the on-page voice since they're what shows in search results and share cards.
4. **Apps page terminology fix** (`AppsPageContent.tsx`) — "Every app we make." currently followed by "**Five products**, none of which overlap." Fix to "apps," and stop hardcoding "Five" — derive the count from the actual app list length so it doesn't go stale.
5. **Hero stat bar** (`Hero.tsx`) — `10K+ Active users`, `50+ Countries served`, `98% Deployment success rate` are hardcoded, fabricated literals (confirmed with the user — not real numbers). Replace with real, derivable numbers: live app count (from the apps API, already fetched elsewhere) and a shipped-features count (from `/api/roadmaps`, already used for the homepage's rolling 30-day shipped-features count per prior work). Do not publish unverifiable stats under a "confident and polished" banner.
6. **Nav/Footer consistency** — Footer (`Footer.tsx`) lists Apps/Roadmaps/Changelog/Knowledge Base/Legal/Support; Navbar (`Navbar.tsx`) lists Apps/Roadmap/Knowledge Base/Support/Contact. Fix the "Roadmap" vs "Roadmaps" plural mismatch to a single consistent label used in both places. Footer also gets a new "Partners" entry (see Part 2). Contact and Changelog/Legal staying footer/CTA-only rather than in the primary Navbar is intentional (matches existing project convention for Contact) — not a bug to fix, just confirm it's still intentional post-changes.
7. **Placeholder OG image** — Apps page metadata references `/images/placeholder.jpg`. Confirm this is an intentional generic fallback; replace if it's a forgotten leftover.

### Audit reference (per-page voice, current state)

| Page | Current headline | Voice |
|---|---|---|
| Homepage Hero | "Small software that does one thing well." | On-voice |
| Homepage About | "Smart, scalable technology — without the complexity." | Off-voice — generic SaaS |
| Homepage FAQ | "Questions, answered." | Headline on-voice; answers off-voice/stale (see #2) |
| Apps | "Every app we make." / "Five products..." | On-voice, terminology bug |
| Roadmap | "Built in the open." | On-voice |
| Knowledge base | "How things work." | On-voice |
| Support | "Tell us what broke." | On-voice |
| Contact | "Say hello." | On-voice — subtitle already mentions "partnerships" with nowhere to send them today |
| Legal | "The paperwork." | On-voice |
| Status | (metadata only) "Updated automatically, and by a human when something needs saying." | On-voice |
| 404 | "This page doesn't exist." | On-voice |
| Changelog | "What shipped." | On-voice |

## Part 2 — Co-Build partner program (new)

### Positioning

Co-Build is how CoFabri expands into new industries without needing in-house expertise in each one: an industry operator brings domain knowledge, an existing customer base, and credibility within their industry; CoFabri builds the product; ownership is shared. This also diversifies CoFabri's revenue across industries rather than concentrating risk in one.

Public copy states the model conceptually — no equity percentages or revenue-split numbers. Specifics are discussed after someone reaches out via the form.

### Case study (Medoura)

- Partner: an established telehealth provider (name withheld by request — do not name the originating company anywhere in copy).
- Product: **Medoura** (real, live, named — an existing app in the portfolio, so it's fine to name).
- Story: CoFabri originally partnered with this telehealth pioneer to build and launch their business online. That work was then expanded into Medoura, a SaaS platform other telehealth businesses use to run their own telehealth operations — covering both the clinical and sales/marketing side, unlike existing telehealth SaaS options which are expensive, lock customers in, and lack sales/marketing tooling.
- Partner brought: their existing patients, years of industry experience, and their professional network to bring early customers onto the platform.
- Ownership: partner holds equity (no specific split stated in copy).
- Status: live and selling.
- Quote: needs to be drafted (see Open Items) and sent to the partner for approval before publishing — do not publish a fabricated quote as if already approved.

### "Co" wordmark treatment

The site's actual logo (`public/images/logo.svg`) is a vector image with the wordmark drawn as paths — there's no live text or existing CSS class to reuse for a "styled Co." Per the user, the intended font is **UnifrakturMaguntia** (the blackletter font embedded in the logo SVG), used on "Co" only, with "Build" in the site's normal font.

Implementation: load `UnifrakturMaguntia` via `next/font/google` (self-hosted, no external request at runtime) so it's available wherever "Co-Build" appears (homepage section heading, `/partners` hero, footer nav label optionally). Provide a CSS fallback stack behind it (e.g. `Georgia, 'Times New Roman', serif`) in case the font fails to load, per the user's explicit request for a fallback. Build this as a small shared component (e.g. `CoBuildWordmark.tsx`, a `<span>` wrapping just "Co" in the special font class next to plain "Build" text) rather than repeating the markup at each usage site.

### Frontend changes (cofabri-website)

- **New homepage section**, placed between the Apps section and About: headline using the Co-Build wordmark treatment, a short pitch paragraph, a condensed version of the Medoura case study, and a CTA linking to `/partners`.
- **New route `/partners`**: hero (reusing `PageHero.tsx`), a "how it works" section (3 steps: industry expertise + customer base → CoFabri builds → shared ownership), the full Medoura case study with quote, and the inquiry form.
- **New `PartnerForm.tsx`**, modeled directly on `ContactForm.tsx`/`SupportForm.tsx` (same Turnstile verification flow, client-side validation, char-limit UI): fields are first name, last name, email, company/business name (optional), industry, phone (optional), and a message describing their business and the idea. No file upload (unlike SupportForm) — not needed for an initial inquiry.
- **New `src/app/api/partners/route.ts`**, same shape as `src/app/api/contact/route.ts`: validates input, verifies Turnstile, then POSTs to `${COFABRI_API_BASE_URL}/web/forms/partnership`.
- **Footer nav**: add "Partners" entry. Not added to the primary Navbar (per user decision — reachable via footer + the new homepage section, same treatment Contact already gets).

### Backend changes (cofabri-api)

Confirmed the existing pattern by reading `src/routes/web-forms.js` and `src/services/WebFormsService.js`: each form type is an Express route with `express-validator` rules → a `WebFormsService` method → a Supabase insert into a dedicated `site_*`/purpose-named table with a `status` column. New work follows the same shape:

- **New Supabase migration** (`supabase/migrations/<timestamp>_partnership_inquiries.sql`): creates `site_partnership_inquiries` table — `id`, `first_name`, `last_name`, `email`, `company_name` (nullable), `industry`, `phone` (nullable), `message`, `status` (default `'new'`), `created_at`.
- **New `submitPartnershipInquiry` method** on `WebFormsService.js`, mirroring `submitContact`/`submitSupportTicket`.
- **New `POST /partnership` route** in `web-forms.js`, validated the same way as `/contact` and `/support` (required: first_name, last_name, email, industry, message; optional: company_name, phone).

## Testing / verification

- General copy fixes: visual check of every touched page in both light/dark mode (per this codebase's existing dark-mode token system); confirm the Apps page count is no longer hardcoded by checking it against the real app list length.
- Hero stat bar: confirm the new numbers actually render correctly against `/api/roadmaps` and the apps list, matching the pattern already used for the homepage's existing rolling shipped-features count.
- Co-Build: submit a real test inquiry through the new form end-to-end (Turnstile dev bypass → `/api/partners` → cofabri-api `/web/forms/partnership` → Supabase row lands in `site_partnership_inquiries`), same way SupportForm/ContactForm are verified elsewhere in this codebase's history.
- Wordmark: verify the UnifrakturMaguntia font loads correctly and that the fallback stack renders acceptably if the font is blocked (e.g. throttle/block the font request in devtools and check the fallback doesn't look broken).

## Open items (need user input before/along the way, not blocking the plan)

- **Medoura quote**: will be drafted during implementation and flagged for the user to send to their partner for approval before the page goes live with it.
- **Real Hero numbers**: exact derivation (which roadmap/app-count query, what time window) gets finalized during implementation against the live API — not a copy decision.
