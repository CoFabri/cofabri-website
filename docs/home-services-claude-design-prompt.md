Design a "Services" section for the CoFabri home page (cofabri.com). Extend the existing design system; do not redesign the page or any other page.

## Why
The home page never mentions services. Apps are what people arrive for, but we now also sell services: CoFabri's own team does work for the customer, inside our apps. The home page needs to introduce them and send people to /services, without competing with the apps section.

## The page today (top to bottom)
1. Hero: "H1" about the portfolio, with two actions, "Explore the Apps" (primary) and "See what we're building →" (text link to the roadmap).
2. Apps: a "heading, count, featured app, then a list of app rows" section ending in a text link to /apps.
3. Co-Build: a section (heading, short copy, link to /co-build).
4. About, a compact roadmap, an FAQ, and a live chat.

Place the new section between **Apps** and **Co-Build**, so the order reads: apps you run yourself, then services we run for you, then building something with us.

## What the section says
- Eyebrow: "Services"
- Heading (sentence case): "Some work is better done for you."
- One line: "Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps."
- One card per visible service (today two): **CoFabri Marketing** ("We run your paid ads, from setup to reporting." Live) and **CoFabri Concierge** ("A CoFabri team that follows up with your customers and leads for you. Coming soon for businesses on CoFabri apps." Coming soon). The cards come from Core, so design for 1 to 4 and say what happens at 5 or more (link only, no cards).
- Each card: the product tile (see below), name, one-line outcome, a status pill (Live or Coming soon), and an action: **Learn More** to its page for a live service, **Notify Me** (opens in place, an email field then "Done. We'll email you once, at launch.") for a coming-soon one.
- A text link under the section: "All Services →" to /services.
- No prices anywhere. No testimonials, numbers, logos or case studies.

## Existing system (match it)
- Next.js + Tailwind, shadcn-style primitives (card, button, badge, accordion, dialog, tabs), Heroicons, light and dark themes, Instrument Sans + JetBrains Mono.
- Tokens: accent `#0B6BE6`, hairline borders, `--surface*`, `--ink*`; radius 0.625rem (10px) everywhere; 1200px max content width with 24 to 40px side gutters.
- The product tiles are `FamilyMark`s: a rounded square (radius 23%) with an oklch gradient and a line icon. CRM `#5C7699` to `#4B6585`, Marketing `#8A6973` to `#785861`, Concierge `#706A90` to `#5E5A7E`. Sizes 24, 36, 44, 56 and larger.
- Per-service accents (buttons, rules, numerals): Marketing `#C2410C`, Concierge `#7E2F8E`. The home page itself uses the site accent; the service accent appears only inside that service's card.
- Existing patterns to reuse: the `/services` page's tinted `ServicePanel` (a wide panel with a 64px tile, name, outcome, and an action column) and `ServiceCard` (a compact card with the tile top left and the pill top right); the apps section's heading with count; `RevealSection` for scroll-in.
- Casing: Title Case for anything clickable, sentence case for headings, body and pills.

## Deliverables (light and dark; desktop 1280, tablet 768 and 1024, phone 390 and 344)
1. The section at 1 service, 2 services (today), 3 to 4, and 5 or more.
2. The coming-soon card's Notify Me states: idle, open with an inline error ("Enter an email like name@business.com."), and done.
3. How the section looks right after the Apps section and right before Co-Build (the transitions).
4. Whether it should be a row of compact cards or the wide tinted panels from /services, and why (the panels are richer, the cards take less height on a phone).

## Rules
- WCAG AA in both themes. Phone-first, no horizontal scroll, touch targets at least 44px.
- Surface Duo: when the two screens are spanned (540px screens with a 34px hinge), two-column layouts should put one column on each screen and no text or card should cross the hinge.
- Keep it minimal: reuse the existing components; if you need a new one, say so.

## Output
Annotated screens for each deliverable, plus a short note listing any new component or token you introduced and why.
