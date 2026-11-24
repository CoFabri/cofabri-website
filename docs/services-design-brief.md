# Services: design brief (for the Claude Design pass)

Status: draft for review. Nothing in this brief is built yet.

## Why

CoFabri sells **apps** (self-service software) and is adding **services**
(CoFabri's team does work for the customer, inside CoFabri's own apps and
infrastructure). The site only has a page type for apps. This brief covers
the new page types and the changes to existing ones.

## What is being added

| Offering | Type | How it's sold | Primary CTA | Where it lives |
|---|---|---|---|---|
| CoFabri CRM | App | Self-service | **Get started** to Stripe (monthly or annual) | `/apps/cofabri-crm` (existing app template) |
| CoFabri Marketing | Service (ads management) | Call first | **Book a call** to sales inquiry form | `/services/cofabri-marketing` |
| CoFabri Concierge | Service | Not launched | **Notify me** to prefilled `/contact` | Card on `/services`; no detail page yet |

- Marketing also gets a small card in `/apps` marked "Managed" that links to
  its service page. One canonical page only (no duplicated content, for SEO).
- **Prices are hidden everywhere.** Pricing is covered on the sales call, and
  Stripe links are sent by the team afterward. Don't design price UI, but
  leave room in the template so a price row can be added later.

## Pages to design

### 1. `/services` (index)
- Hero in the same family as `/apps` and `/co-build`, with a short line
  explaining the difference: *apps you run yourself, services we run for you*.
- Grid of service cards. Launch set: **CoFabri Marketing** (live) and
  **CoFabri Concierge** (coming soon).
- Card states: *Live* (CTA: Learn more) and *Coming soon* (CTA: Notify me).
  Reuse the status-pill vocabulary from `statusPillClasses`.
- Closing CTA band: "Not sure which fits? Talk to us" linking to `/contact`.

### 2. `/services/[slug]` (detail template)
Sections, in order. Each should be optional so Concierge can reuse the
template later.
1. **Hero:** service name, one-line outcome, primary CTA (Book a call), and a
   secondary "See how it works" anchor. Show the linked app's mark if one exists.
2. **What you get:** short list of included deliverables.
3. **How it works:** 3 to 5 numbered steps from first call to ongoing work.
4. **Who it's for / not for:** short, honest. Filters out poor-fit leads.
5. **How we work with you:** access and reporting expectations.
6. **FAQ:** accordion (`ui/accordion` already exists).
7. **Closing CTA band:** Book a call.
- Persistent CTA on mobile (sticky bottom bar or the header button).

### 3. Book-a-call form (service inquiry)
- Opens in a modal from every "Book a call" button, in the style of Praxis's
  `TalkToUsModal` (name, email, phone, message), so the experience is
  consistent across CoFabri properties.
- Fields: first name, last name, email, phone (optional), company, message
  ("Tell us about your business and what you want to advertise").
- States to design: idle, submitting, success ("Thanks. We'll be in touch
  within one business day."), error.
- Anti-spam is invisible: honeypot, timing, Turnstile as on the other forms.

### 4. Coming-soon card and Notify me (Concierge)
- No detail page at launch. The card carries a one-sentence description and a
  **Notify me** button that links to
  `/contact?topic=sales&subject=CoFabri%20Concierge&message=...`.
- Public description (keep it to this; the internal plan has more detail than
  we should promise): *"A CoFabri team that follows up with your customers and
  leads for you. Coming soon for businesses on CoFabri apps."*
- Do not mention HIPAA, Twilio, GHL, or phases on the public site.

### 5. Changes to existing pieces
- **Navbar:** add `Services` after `Apps`. Footer link list gets the same.
- **App detail template:** add an optional "Want us to run this for you?"
  cross-link band when a related service exists (CRM to Marketing is a likely
  pair; confirm).
- **Self-service app CTA:** the app template needs a "Get started" button that
  goes to an external Stripe link, with monthly and annual choices. Design a
  simple two-option control. No prices shown. **Decided:** plain labels,
  "Monthly" and "Annual", with no savings claim.
- **Footer CTA band** currently says "No demo call. No onboarding fee." That
  is false for managed services. **Decided:** keep the headline "Start with
  one app." and change the second line to "Apps start in minutes. Need
  hands-on help? Talk to us." The Contact Us button stays.

## Constraints the design must respect

- **Match the existing system:** tokens in `src/app/globals.css` (accent
  `#0B6BE6`, hairline borders, `--surface*`, `--ink*`), light and dark, the
  `HeroAurora`/`GradientHeading` treatment, 1200px max width, `ui/` primitives
  (card, button, accordion, dialog, badge).
- Phone width first. No horizontal scroll.
- Accessibility: visible focus states, dialog trap and Escape to close,
  sufficient contrast on both themes.
- Services are content-driven. Design for 2 to 10 services, with sections
  optional so a new service doesn't need a new layout.

## Content for Marketing (draft, needs your edit)

- **Outcome:** "We run your paid advertising so you can focus on your
  business."
- **Included:** account setup and audit, campaign build, ongoing optimization,
  monthly reporting. (Confirm the real list.)
- **Ad spend:** paid directly to the ad platforms, in the customer's own
  accounts. Don't state the management fee or percentage on the page.
- **Process:** discovery call, proposal, onboarding and account access,
  launch, ongoing optimization and reporting.

## Open items before build

1. Real included-deliverables list and process steps for Marketing.
2. Proof: owner will supply real results or quotes. Until then the proof
   section is omitted, never invented. Design it as an optional section.
3. Registration of CoFabri CRM in the app catalog API (apps are served from
   `getMarketingApps()`). Services content is static in this repo at launch
   (decided), shaped to match a future API type.

## Engineering notes (not for the design pass)

- Inquiry path: Praxis and RxBridge forward to cofabri-api
  `POST /web/forms/contact` with `app_id` and `inquiry_type: 'sales'`; this
  site's `/api/contact` already does the same. The service inquiry will
  reuse that endpoint, adding the service as the subject, so no new API work
  is expected. Confirm that cofabri-api creates the MavenOS deal or lead
  from it and can attribute it to the CoFabri Marketing product.
- `/contact` currently prefills from `firstName`, `lastName`, `email`, `phone`,
  `language`, `topic`, and `app`. It needs `subject` and `message` prefill
  params for Notify me.
- Services content source: static in this repo for launch, with a type that
  maps cleanly to an API content type later. The API repo is not attached.
- SEO: follow `SEO_IMPLEMENTATION.md`; add per-service metadata, canonical
  URLs, JSON-LD (`Service` schema), and sitemap entries.
