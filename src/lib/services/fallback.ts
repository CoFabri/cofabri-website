import type { ServiceContent } from './schema';

// Page copy used when apps.metadata.service is empty or invalid, so a service
// page still renders. Core's metadata wins whenever it parses. Keep this in
// step with the seed migration in cofabri-core.
//
// Rules for anything added here: no prices, no testimonials, numbers, logos
// or case studies, and never name the white-label CRM platform. Concierge copy
// stays free of compliance, telephony-vendor and internal-tech detail.

export const SERVICE_FALLBACKS: Record<string, ServiceContent> = {
  'cofabri-marketing': {
    outcome: 'Paid ads that bring in new customers, run for you by our team.',
    cardLine: 'We run your paid ads, from setup to reporting.',
    runsOn: ['cofabri-crm', 'medoura'],
    meta: [
      { label: 'Runs on', value: 'CoFabri CRM and Medoura', kind: 'app' },
      { label: 'Who does the work', value: 'The CoFabri team' },
      { label: 'Ad platforms', value: 'Facebook · Instagram' },
      { label: 'Billing', value: 'Month to month' },
    ],
    whatYouGet: {
      items: [
        { title: 'Campaign setup', body: 'We build your campaigns in your own ad account, aimed at the customers and area you serve.' },
        { title: 'Ads written for you', body: 'Ad copy written by our team, built around your own photos and video or around images we produce for an added fee. Nothing goes live until you approve it.' },
        { title: 'Ongoing management', body: 'We watch results and adjust audiences, budget split and ads as we learn what works.' },
        { title: 'Leads in CoFabri CRM', body: 'Every lead lands in CoFabri CRM with where it came from, so you can follow up fast.' },
        { title: 'Plain-language reports', body: 'What ran, what it cost, and how many leads came in, without the jargon.' },
      ],
    },
    steps: [
      { title: 'Book a call', body: 'We learn about your business, your area and what you want more of.' },
      { title: 'We set things up', body: 'We connect your ad account to CoFabri CRM and draft your first ads for your approval.' },
      { title: 'We run your ads', body: "We launch, watch the numbers and adjust, so you don't have to." },
      { title: 'You get reports', body: 'What ran, what it cost and the leads it brought in.' },
    ],
    fit: {
      fit: [
        'Local and service businesses that want more leads',
        'Owners who would rather not learn ad tools',
        'Teams using, or ready to use, CoFabri CRM',
      ],
      notFit: [
        'Businesses that want to manage their own ads day to day',
        'Brands that need TV, print or influencer campaigns',
        'A one-off ad with no follow-up',
      ],
    },
    howWeWork: [
      { icon: 'access', title: 'Access', body: 'You own your ad account. We ask for partner access, never your password, and you can remove it any time.' },
      { icon: 'reporting', title: 'Reporting', body: 'Regular reports in plain language, and a call to go through them whenever you want one.' },
      { icon: 'needs', title: 'What we need from you', body: 'Your photos and video if you\'re supplying them, approval on every new ad, and a quick reply when we have a question. New campaigns take a few weeks to settle.' },
    ],
    faq: [
      { q: 'Do I need CoFabri CRM?', a: "Yes. Leads from your ads go into CoFabri CRM so you can follow up in one place. If you don't have it yet, we'll set it up as part of getting started." },
      { q: 'Do you make the images and video?', a: 'We can. Our team produces images and video for an added fee, or you can send your own and we\'ll build the ads around them.' },
      { q: 'Who owns the ad account?', a: 'You do. We work in your account with partner access. If you stop, the account, its history and your ads stay with you.' },
      { q: 'Which ad platforms do you run?', a: "Facebook and Instagram today. Google Ads is planned, and we'll tell you when it's available." },
      { q: 'How is it priced?', a: "It depends on your business and how much you want to spend on ads. We'll go through it on the call, before you commit to anything." },
      { q: 'Can I stop at any time?', a: "Yes. It's month to month. Cancel before your next billing date and you won't be charged again." },
    ],
    appBand: 'With CoFabri Marketing, our team runs your paid ads and sends the leads into CoFabri CRM.',
    closing: {
      heading: 'Ready to hand off your ads?',
      body: "A short call to learn about your business. No obligation, and we'll tell you if it isn't a fit.",
    },
  },

  'cofabri-concierge': {
    outcome: 'A CoFabri team that follows up with your customers and leads for you.',
    subline: 'Coming soon for businesses on CoFabri apps.',
    cardLine: 'A CoFabri team that follows up with your customers and leads for you. Coming soon for businesses on CoFabri apps.',
    meta: [
      { label: 'Status', value: 'Coming soon' },
      { label: 'Who does the work', value: 'The CoFabri team' },
      { label: 'Works with', value: 'Your CoFabri apps' },
      { label: 'Pricing', value: 'Shared at launch' },
    ],
    whatYouGet: {
      heading: "What you'll get",
      note: 'A preview. Details may change before launch.',
      items: [
        { title: 'Quick follow-up on new leads', body: "We reach out to new leads soon after they come in, while they're still interested." },
        { title: 'Appointments booked for you', body: "When a lead is ready, we book them in at a time that works for your business." },
        { title: 'Check-ins with past customers', body: "We follow up when it's time for repeat work, a reminder or a review." },
        { title: "In your business's voice", body: 'We use the greeting, offers and wording you set, and avoid anything you tell us not to say.' },
        { title: 'Everything in your app', body: 'Every conversation is recorded in your CoFabri app, so your team always sees what was said.' },
      ],
    },
    steps: [
      { title: 'Join the list', body: "Tap Notify Me and we'll email you once, when Concierge opens." },
      { title: 'Tell us about your business', body: 'Your services, your offers, your hours and how you like to sound.' },
      { title: 'We follow up for you', body: 'Our team works your new leads and past customers on your behalf.' },
      { title: 'You see the results', body: 'Conversations and booked appointments show up in your CoFabri app.' },
    ],
    fit: {
      fit: [
        'Businesses on CoFabri apps that get more leads than they can call back',
        'Owners who would rather spend the day doing the work',
        'Teams that want every lead followed up, every time',
      ],
      notFit: [
        "Businesses that aren't on a CoFabri app",
        "Cold outreach to lists you've bought",
        'Companies that need a full in-house sales team',
      ],
    },
    howWeWork: [
      { icon: 'voice', title: 'Your voice', body: 'You approve the greeting, the offers and the things we should never say. We update them whenever you ask.' },
      { icon: 'visibility', title: 'Visibility', body: 'Every conversation and booking is recorded in your CoFabri app, so nothing happens out of sight.' },
      { icon: 'needs', title: 'What we need from you', body: 'Your services and offers, when you can take appointments, and a quick reply when a lead asks something only you can answer.' },
    ],
    faq: [
      { q: 'When is it available?', a: "We're getting it ready now. Tap Notify Me and we'll email you once, at launch." },
      { q: 'Which apps does it work with?', a: "It's built for businesses on CoFabri apps. We'll share the full list at launch." },
      { q: 'Will you speak as my business?', a: "Yes. We follow up in your business's name, using the greeting and offers you set." },
      { q: 'Can I control what you say?', a: 'Yes. You approve the wording, the offers and anything we should avoid, and you can change them at any time.' },
      { q: 'How is it priced?', a: "We'll share pricing at launch. Joining the list is free and doesn't commit you to anything." },
    ],
    closing: {
      heading: 'Want to hear when it opens?',
      body: 'One email at launch. No spam, and no commitment.',
    },
  },
};
