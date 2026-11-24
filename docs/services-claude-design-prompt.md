Design the new "Services" section of the CoFabri website (cofabri.com). Extend the existing design system. Do not redesign what exists.

## Context
CoFabri builds software apps, each solving one problem, sold self-service. We're adding **services**: CoFabri's own team does work for the customer, inside our apps and infrastructure. The site has no page type for this yet. Tone: calm, plain-spoken, confident, no hype. Audience: small business owners and operators.

## Existing design system (match it)
- Next.js + Tailwind, shadcn-style primitives (card, button, badge, accordion, dialog, tabs).
- Light and dark themes. Light tokens: surface #FFFFFF, surface-sunken #F7F8F9, hairline border #E9ECEF, strong border #D9DFE3, ink #232E36, body #36454F, muted #5A6A75, accent #0B6BE6 (hover #0857BE), accent tint #EAF2FE, success #12A150, warning #D98212, danger #D92D20. Dark surface #171D22, raised #1E262C.
- Style: hairline borders, generous whitespace, 0.625rem radius, 1200px max content width with 24 to 40px side gutters, soft aurora gradient behind heroes, gradient accent on hero headings, status pills (Live, Coming soon).
- Footer is a dark band (#232E36) with a large headline and two buttons.
- Heroicons for icons. Keep it phone-first with no horizontal scroll.

## Offerings at launch
1. **CoFabri Marketing** (live service): ads management. We run the customer's paid advertising. CTA: Book a call. Prices are hidden.
2. **CoFabri Concierge** (coming soon): "A CoFabri team that follows up with your customers and leads for you. Coming soon for businesses on CoFabri apps." CTA: Notify me. No detail page yet.
3. **CoFabri CRM** is an *app*, not a service, and uses the existing app page. It needs only a new CTA (below).

## Deliverables (light and dark, desktop and mobile)

### 1. `/services` index
- Hero: headline plus one line explaining the difference: *apps you run yourself, services we run for you*.
- Grid of service cards. Two states: Live (CTA: Learn more) and Coming soon (CTA: Notify me, with a Coming soon pill).
- Closing band: "Not sure which fits? Talk to us."
- Must still look right with 1 service and with 8.

### 2. `/services/[slug]` detail template
Sections, each optional so the template works for any future service:
1. Hero: name, one-line outcome, primary CTA "Book a call", secondary "See how it works" anchor.
2. What you get (included deliverables)
3. How it works (3 to 5 numbered steps)
4. Who it's for / who it's not for
5. How we work with you (access, reporting, expectations)
6. Proof (optional; omitted until we have real results; design it so its absence leaves no gap)
7. FAQ (accordion)
8. Closing CTA band
- Persistent Book a call on mobile (sticky bar or header button).
- Show the linked app's mark when the service runs on an app.

### 3. Book a call modal (sales inquiry)
- Opened from every "Book a call" button.
- Fields: first name, last name, email, phone (optional), company, message ("Tell us about your business and what you want to advertise").
- States: idle, submitting, success ("Thanks. We'll be in touch within one business day."), error with inline validation.
- Accessible dialog: focus trap, Escape to close, visible focus.

### 4. Self-service CTA on app pages (for CoFabri CRM)
- A "Get started" control with two choices, **Monthly** and **Annual**, each opening an external checkout link. Plain labels, no savings claim, no prices shown. Design the control, its hover and focus states, and an external-link affordance.

### 5. Cross-links and nav
- Navbar: add "Services" after "Apps" (desktop and mobile menu).
- Apps page: a small card variant marked "Managed" that links to a service page.
- App detail page: optional band "Want us to run this for you?" linking to the matching service.
- Footer band: headline "Start with one app." and second line "Apps start in minutes. Need hands-on help? Talk to us." with the existing two buttons.

## Rules
- Do not show any pricing anywhere.
- Do not invent testimonials, numbers, logos, or case studies. Use clearly marked placeholder text.
- Do not mention HIPAA, telephony vendors, or internal technical detail on Concierge.
- Reuse existing primitives and tokens. If you need a new component, say so and keep it minimal.
- Meet WCAG AA contrast in both themes.

## Output
Annotated screens for each deliverable, plus a short note listing any new component or token you introduced and why.
