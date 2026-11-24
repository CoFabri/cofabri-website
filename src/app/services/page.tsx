import type { Metadata } from 'next';
import Link from 'next/link';
import { getApps, getServices } from '@/lib/api-client';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import HeroAurora from '@/components/marketing/HeroAurora';
import ServiceCard from '@/components/marketing/ServiceCard';
import { ClosingBand, MetaCard, PageSection } from '@/components/marketing/ServiceSections';
import BookCallButton from '@/components/marketing/BookCallButton';
import StructuredData from '@/components/marketing/StructuredData';
import { buttonVariants } from '@/components/ui/button';

const TITLE = 'Services';
const DESCRIPTION =
  'Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps. See what we run today and how it works.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/services' },
  openGraph: {
    title: `${TITLE} | CoFabri`,
    description: DESCRIPTION,
    url: 'https://cofabri.com/services',
    images: [{ url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png', width: 1200, height: 630, alt: 'CoFabri Services' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | CoFabri`,
    description: DESCRIPTION,
    images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
  },
};

const GLANCE = [
  { label: 'Who does the work', value: 'The CoFabri team' },
  { label: 'Where it happens', value: 'Inside your CoFabri apps' },
  { label: 'What you see', value: 'Every step, in your app' },
  { label: 'How it starts', value: 'A short call' },
];

const STEPS = [
  { title: 'Talk to us', body: "Tell us what you want done. We'll tell you plainly whether a service fits, or whether an app on its own is enough." },
  { title: 'We set it up', body: 'We connect what the work needs inside your CoFabri apps, and you approve it before anything starts.' },
  { title: 'We run it, you see it', body: 'Our team does the work day to day. Every step shows up in your app, so you can check in whenever you like.' },
];

const PROMISES = [
  { title: 'Your accounts stay yours', body: 'Ad accounts, contacts and data belong to you. If you stop, they stay with you.' },
  { title: 'You set what we say', body: "You approve the wording, the offers and anything we say in your business's name." },
  { title: 'Nothing happens out of sight', body: 'The work is recorded in your CoFabri app, so you can see what was done and when.' },
  { title: 'One team to talk to', body: "The CoFabri team runs the work and answers your questions. You won't be passed around." },
];

export default async function ServicesPage() {
  const [services, apps] = await Promise.all([getServices(), getApps()]);
  const appById = new Map(apps.map((a) => [a.id, a]));
  const solo = services.length === 1;
  const columns = services.length >= 3 ? 'lg:grid-cols-3' : services.length === 2 ? 'md:grid-cols-2' : '';

  return (
    <div className="min-h-screen bg-background">
      {services.length > 0 && (
        <StructuredData
          type="itemList"
          data={{ items: services.map((s) => ({ name: s.name, url: `https://cofabri.com/services/${s.id}` })) }}
        />
      )}
      <div className="relative overflow-hidden">
        <HeroAurora />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-9 pb-20 sm:px-10">
          <div className="mb-14">
            <Breadcrumbs items={[{ name: 'Services', href: '/services' }]} />
          </div>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-20">
            <div>
              <div className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">Services</div>
              <h1 className="m-0 p-0 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[56px]">
                Some work is better <span className="brand-gradient-text">done for you.</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-lg leading-[1.6] text-ink-muted sm:text-[19px]">
                Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps.
              </p>
              <div className="mt-8">
                <a href="#how-services-work" className={buttonVariants({ variant: 'outline', className: 'h-12 rounded-lg px-6 text-[15px] font-semibold' })}>
                  How Services Work
                </a>
              </div>
            </div>
            <MetaCard rows={GLANCE} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-24 sm:px-10">
        <section className="pb-16">
          <div className="mb-8 flex items-baseline gap-3">
            <h2 className="m-0 p-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]">All services</h2>
            <span className="font-mono text-sm text-ink-muted">{services.length}</span>
          </div>
          {services.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-8 text-ink-muted">No services yet. Check back soon.</p>
          ) : (
            <div className={`grid grid-cols-1 gap-5 ${columns}`}>
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  solo={solo}
                  linkedApp={service.linkedAppId ? appById.get(service.linkedAppId) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <PageSection
          id="how-services-work"
          title="How services work"
          intro="The same three steps for every service, so you always know what happens next."
        >
          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-lg border border-border bg-card p-6">
                <span className="font-mono text-sm font-semibold text-brand-text">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="m-0 mt-3 p-0 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </PageSection>

        <PageSection title="What you can count on" intro="True for every service we run, now and later.">
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
            {PROMISES.map((promise) => (
              <li key={promise.title} className="rounded-lg border border-border bg-card p-6">
                <h3 className="m-0 p-0 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{promise.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ink-muted">{promise.body}</p>
              </li>
            ))}
          </ul>
        </PageSection>

        <ClosingBand
          heading="Not sure which fits? Talk to us."
          body="Tell us what you're trying to get done. We'll tell you whether an app, a service, or neither is the right call."
          action={
            // The inquiry is filed against a live service when one exists, otherwise a plain contact request.
            (() => {
              const live = services.find((s) => s.status !== 'In Development');
              return live ? (
                <BookCallButton service={{ id: live.id, name: live.name }}>Book a Call</BookCallButton>
              ) : (
                <Link href="/contact" className={buttonVariants({ variant: 'brand', className: 'h-12 rounded-lg px-6 text-[15px] font-semibold' })}>
                  Book a Call
                </Link>
              );
            })()
          }
        />
      </div>
    </div>
  );
}
