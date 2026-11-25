import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  KeyIcon,
  MinusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { ServiceContent } from '@/lib/services';
import type { ServiceIconKey } from '@/lib/services/schema';
import FamilyMark from './FamilyMark';

// Building blocks shared by the services index and the service detail pages.
// Every section uses the same top hairline and padding, with no alternating
// backgrounds, so leaving any section out leaves no gap.

const ICONS: Record<ServiceIconKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  access: KeyIcon,
  reporting: ChartBarIcon,
  needs: ClipboardDocumentListIcon,
  voice: ChatBubbleLeftRightIcon,
  visibility: EyeIcon,
  team: UserGroupIcon,
};

export function PageSection({ id, title, intro, note, children }: { id?: string; title: string; intro?: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-16">
      <h2 className="m-0 p-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]">{title}</h2>
      {intro && <p className="mt-3 max-w-[560px] text-base leading-[1.6] text-ink-muted">{intro}</p>}
      {note && <p className="mt-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">{note}</p>}
      <div className="mt-9">{children}</div>
    </section>
  );
}

export interface MetaRow {
  label: string;
  value: string;
  /** Show the app tile (for a "Runs on" row). */
  appId?: string;
}

/** The bordered at-a-glance list, in the style of the app detail page. */
export function MetaCard({ rows }: { rows: MetaRow[] }) {
  if (rows.length === 0) return null;
  return (
    <dl className="m-0 w-full overflow-hidden rounded-lg border border-border bg-card">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-6 border-b border-border px-5 py-[15px] last:border-b-0">
          <dt className="text-sm text-ink-muted">{row.label}</dt>
          <dd className="m-0 flex items-center gap-2 text-right font-mono text-[13px] text-ink-body">
            {row.appId && <FamilyMark appId={row.appId} size={24} />}
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function WhatYouGet({ content }: { content: NonNullable<ServiceContent['whatYouGet']> }) {
  return (
    <PageSection title={content.heading ?? 'What you get'} note={content.note}>
      <ol className="m-0 list-none p-0">
        {content.items.map((item, i) => (
          <li key={item.title} className="grid grid-cols-[44px_1fr] gap-4 border-t border-border py-6 first:border-t-0 first:pt-0 sm:grid-cols-[56px_260px_1fr] sm:gap-6">
            <span className="pt-0.5 font-mono text-sm font-semibold text-brand-text">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="m-0 p-0 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{item.title}</h3>
            <p className="col-start-2 m-0 max-w-[560px] text-[15px] leading-[1.6] text-ink-muted sm:col-start-auto">{item.body}</p>
          </li>
        ))}
      </ol>
    </PageSection>
  );
}

const STEP_COLUMNS: Record<number, string> = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

export function Steps({ steps, id = 'how-it-works', title = 'How it works', intro }: { steps: { title: string; body: string }[]; id?: string; title?: string; intro?: string }) {
  return (
    <PageSection id={id} title={title} intro={intro}>
      <ol className={`m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 ${STEP_COLUMNS[steps.length] ?? 'lg:grid-cols-4'}`}>
        {steps.map((step, i) => (
          <li key={step.title} className="rounded-lg border border-border bg-card p-6">
            <span className="font-mono text-sm font-semibold text-brand-text">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="m-0 mt-3 p-0 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.55] text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </PageSection>
  );
}

export function FitColumns({ fit }: { fit: NonNullable<ServiceContent['fit']> }) {
  return (
    <PageSection title="Who it's for">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h3 className="m-0 p-0 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-brand-text">A good fit</h3>
          <ul className="m-0 mt-5 list-none space-y-4 p-0">
            {fit.fit.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-[1.5] text-foreground">
                <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-text" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="m-0 p-0 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Not a fit</h3>
          <ul className="m-0 mt-5 list-none space-y-4 p-0">
            {fit.notFit.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-[1.5] text-ink-body">
                <MinusIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-faint" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageSection>
  );
}

export function HowWeWork({ items }: { items: NonNullable<ServiceContent['howWeWork']> }) {
  return (
    <PageSection title="How we work with you">
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon ?? 'team'];
          return (
            <li key={item.title} className="rounded-lg border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-brand-text" aria-hidden="true" />
              <h3 className="m-0 mt-4 p-0 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-ink-muted">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </PageSection>
  );
}

export function ServiceFaq({ faq }: { faq: NonNullable<ServiceContent['faq']> }) {
  return (
    <PageSection title="Questions">
      <Accordion type="single" collapsible defaultValue="faq-0" className="max-w-[760px]">
        {faq.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">{item.q}</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.6] text-ink-muted">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </PageSection>
  );
}

/** The sunken closing band: a heading, one line and one action. */
export function ClosingBand({ heading, body, action }: { heading: string; body: string; action: ReactNode }) {
  return (
    <section className="border-t border-border py-16">
      <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-surface-sunken p-8 sm:p-10 md:flex-row md:items-center">
        <div className="max-w-[560px]">
          <h2 className="m-0 p-0 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[30px]">{heading}</h2>
          <p className="mt-3 text-base leading-[1.6] text-ink-muted">{body}</p>
        </div>
        <div className="flex-shrink-0">{action}</div>
      </div>
    </section>
  );
}
