import type { Metadata } from 'next';
import Link from 'next/link';
import { getApps, getServices } from '@/lib/api-client';
import ServiceCard from '@/components/marketing/ServiceCard';
import ServicePanel from '@/components/marketing/ServicePanel';
import ServicesHero from '@/components/marketing/ServicesHero';
import HandOffScene from '@/components/marketing/HandOffScene';
import RevealSection from '@/components/marketing/RevealSection';
import { ClosingBand } from '@/components/marketing/ServiceSections';
import BookCallButton from '@/components/marketing/BookCallButton';
import StructuredData from '@/components/marketing/StructuredData';
import { buttonVariants } from '@/components/ui/button';
import { isComingSoon } from '@/lib/services';
import { buildComposition, servicesLayout } from '@/lib/services/composition';

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

const PROMISES = [
  { title: 'Your accounts stay yours', body: 'Ad accounts, contacts and data belong to you. If you stop, they stay with you.' },
  { title: 'You set what we say', body: "You approve the wording, the offers and anything we say in your business's name." },
  { title: 'Nothing happens out of sight', body: 'The work is recorded in your CoFabri app, so you can see what was done and when.' },
  { title: 'One team to talk to', body: "The CoFabri team runs the work and answers your questions. You won't be passed around." },
];

const SECTION = 'mx-auto max-w-[1200px] px-6 sm:px-10';

export default async function ServicesPage() {
  const [services, apps] = await Promise.all([getServices(), getApps()]);
  const appById = new Map(apps.map((a) => [a.id, a]));
  const layout = servicesLayout(services.length);
  const composition = buildComposition(services, apps);
  // The hero's Book a Call files the inquiry against the first live service; with none live it goes to /contact.
  const live = services.find((s) => !isComingSoon(s));

  const primaryAction = live ? (
    <BookCallButton service={{ id: live.id, name: live.name }} className="w-full sm:w-auto">
      Book a Call
    </BookCallButton>
  ) : (
    <Link href="/contact" className={buttonVariants({ variant: 'brand', className: 'h-12 w-full rounded-lg px-6 text-[15px] font-semibold sm:w-auto' })}>
      Book a Call
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="breadcrumb"
        data={{
          items: [
            { name: 'Home', url: 'https://cofabri.com/' },
            { name: 'Services', url: 'https://cofabri.com/services' },
          ],
        }}
      />
      {services.length > 0 && (
        <StructuredData
          type="itemList"
          data={{ items: services.map((s) => ({ name: s.name, url: `https://cofabri.com/services/${s.id}` })) }}
        />
      )}

      <ServicesHero tiles={composition.tiles} arranged={composition.arranged} primaryAction={primaryAction} />

      {/* The pinned scene is not wrapped in RevealSection: it has to stay put while the page scrolls. */}
      <HandOffScene />

      <RevealSection className={`${SECTION} pt-20 pb-16`}>
        <div className="mb-8 flex items-baseline gap-3">
          <h2 className="m-0 p-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]">All services</h2>
          <span className="font-mono text-sm text-ink-muted">{services.length}</span>
        </div>
        {layout === 'empty' && <p className="rounded-lg border border-border bg-card p-8 text-ink-muted">No services yet. Check back soon.</p>}
        {layout === 'panels' && (
          <div className="flex flex-col gap-5">
            {services.map((service) => (
              <ServicePanel key={service.id} service={service} linkedApp={service.linkedAppId ? appById.get(service.linkedAppId) : undefined} />
            ))}
          </div>
        )}
        {layout === 'grid' && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} linkedApp={service.linkedAppId ? appById.get(service.linkedAppId) : undefined} />
            ))}
          </div>
        )}
      </RevealSection>

      <RevealSection className={`${SECTION} border-t border-border py-20`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:gap-20">
          <div>
            <h2 className="m-0 p-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]">What you can count on</h2>
            <span aria-hidden="true" className="mt-5 block h-0.5 w-10 bg-accent-solid" />
            <p className="mt-5 max-w-[320px] text-base leading-[1.6] text-ink-muted">True for every service we run, now and later.</p>
          </div>
          <ol className="m-0 list-none p-0">
            {PROMISES.map((promise, i) => (
              <li
                key={promise.title}
                className="grid grid-cols-[48px_1fr] gap-x-4 border-t border-border py-7 first:border-t-0 first:pt-0 sm:grid-cols-[64px_280px_1fr] sm:gap-x-6"
              >
                <span className="pt-1.5 font-mono text-sm font-semibold text-accent-solid">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="m-0 p-0 text-[20px] font-semibold leading-snug tracking-[-0.015em] text-foreground sm:text-[22px]">{promise.title}</h3>
                <p className="col-start-2 m-0 mt-2 text-[15px] leading-[1.6] text-ink-muted sm:col-start-auto sm:mt-1.5">{promise.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </RevealSection>

      <RevealSection className={`${SECTION} pb-24`}>
        <ClosingBand
          heading="Not sure which fits? Talk to us."
          body="Tell us what you're trying to get done. We'll tell you whether an app, a service, or neither is the right call."
          action={
            live ? (
              <BookCallButton service={{ id: live.id, name: live.name }}>Book a Call</BookCallButton>
            ) : (
              <Link href="/contact" className={buttonVariants({ variant: 'brand', className: 'h-12 rounded-lg px-6 text-[15px] font-semibold' })}>
                Book a Call
              </Link>
            )
          }
        />
      </RevealSection>
    </div>
  );
}
