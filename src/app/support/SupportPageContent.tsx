import React from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import PageHero from '@/components/marketing/PageHero';
import SupportForm from '@/components/marketing/SupportForm';

const SUPPORT_CARDS = [
  {
    title: 'Knowledge base',
    body: 'Setup guides, troubleshooting, and the answers support gives most often.',
    href: '/knowledge-base',
    action: 'Browse articles',
  },
  {
    title: 'System status',
    body: "Check whether something's actually down before you file a ticket.",
    href: '/status',
    action: 'Check status',
  },
  {
    title: 'Contact us',
    body: 'General inquiries, partnerships, or anything that is not a bug.',
    href: '/contact',
    action: 'Get in touch',
  },
];

export default function SupportPageContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Support', href: '/support' }]} />
      </div>

      <PageHero
        eyebrow="Support"
        title="Tell us what broke."
        subtitle="A real person replies within one business day. Check the three below first — they solve most things faster than we can."
      />

      <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {SUPPORT_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block rounded-xl border border-border p-6 text-foreground transition-all hover:-translate-y-px hover:border-ink-disabled"
          >
            <div className="text-lg font-semibold tracking-[-0.015em]">{card.title}</div>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-ink-muted">{card.body}</p>
            <span className="mt-4 inline-block text-[15px] font-semibold text-primary">{card.action} →</span>
          </Link>
        ))}
      </div>

      <div className="mt-[72px] grid grid-cols-1 gap-14 lg:grid-cols-[320px_1fr] lg:gap-20">
        <div>
          <h2 className="m-0 text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
            Open a ticket
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-ink-muted">
            Include the app, what you expected, and what happened instead. Screenshots help.
          </p>
          <div className="mt-7 rounded-[10px] border border-border bg-muted px-5 py-[18px]">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <span className="block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
              Typical first reply
            </div>
            <div className="mt-2 text-[15px] text-ink-muted">Under 24 hours, Monday to Friday.</div>
          </div>
        </div>
        <SupportForm />
      </div>
    </div>
  );
}
