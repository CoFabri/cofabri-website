'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HELPFUL_LINKS = [
  { title: 'Apps', body: 'Every app we make, one page.', href: '/apps' },
  { title: 'Roadmap', body: "What's shipping next, and what's already out.", href: '/roadmaps' },
  { title: 'Knowledge base', body: 'Setup guides and answers to common questions.', href: '/knowledge-base' },
  { title: 'Support', body: 'Something actually broken? Tell us.', href: '/support' },
];

export default function NotFound() {
  const pathname = usePathname();
  const isKnowledgeBaseArticle = pathname?.startsWith('/knowledge-base/');

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-[140px] sm:px-10">
      <div className="max-w-[620px]">
        <div className="mb-8 font-mono text-[13px] tracking-[0.14em] text-ink-disabled">404 — NOT FOUND</div>
        <h1 className="m-0 text-[44px] font-semibold leading-[1.03] tracking-[-0.035em] text-foreground sm:text-[64px]">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-6 max-w-[480px] text-lg leading-[1.6] text-ink-muted sm:text-xl">
          {isKnowledgeBaseArticle
            ? `The article "${pathname?.replace('/knowledge-base/', '')}" may have moved, or the link may be wrong. Here's where most people are heading.`
            : "It may have moved, or the link may be wrong. Here's where most people are heading."}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary px-[26px] py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
          >
            Go home
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border-strong px-[26px] py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Contact support
          </Link>
        </div>
      </div>

      <div className="mt-[88px] border-t border-border">
        {HELPFUL_LINKS.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="grid grid-cols-1 gap-2 rounded-lg border-b border-border px-3 py-6 text-foreground transition-colors hover:bg-muted sm:grid-cols-[240px_1fr_40px] sm:items-center sm:gap-8"
          >
            <span className="text-lg font-semibold tracking-[-0.015em]">{link.title}</span>
            <span className="text-base text-ink-muted">{link.body}</span>
            <ArrowRightIcon className="hidden h-[18px] w-[18px] justify-self-end text-ink-disabled sm:block" />
          </Link>
        ))}
      </div>
    </div>
  );
}
