import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getApp, getService } from '@/lib/api-client';
import { brandClass, isComingSoon, resolveServiceContent } from '@/lib/services';
import { buildDescription } from '@/lib/meta-description';
import { buildServiceSchema } from '@/lib/structured-data';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import HeroAurora from '@/components/marketing/HeroAurora';
import FamilyMark from '@/components/marketing/FamilyMark';
import JsonLd from '@/components/marketing/JsonLd';
import BookCallButton from '@/components/marketing/BookCallButton';
import NotifyInline, { NotifyProvider } from '@/components/marketing/NotifyInline';
import StickyBookBar from '@/components/marketing/StickyBookBar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  ClosingBand,
  FitColumns,
  HowWeWork,
  MetaCard,
  ServiceFaq,
  Steps,
  WhatYouGet,
  type MetaRow,
} from '@/components/marketing/ServiceSections';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: 'Service Not Found', description: 'The requested service could not be found.' };

  const content = resolveServiceContent(service);
  const description = buildDescription(
    content?.outcome ?? service.description,
    [content?.subline ?? '', content?.cardLine ?? ''],
    `${service.name}, a CoFabri service.`
  );
  return {
    title: service.name,
    description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${service.name} | CoFabri`,
      description,
      url: `https://cofabri.com/services/${slug}`,
      images: [{ url: 'https://files.cofabri.com/logos/cofabri/cofabri-og-image.png', width: 1200, height: 630, alt: 'CoFabri' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} | CoFabri`,
      description,
      images: ['https://files.cofabri.com/logos/cofabri/cofabri-og-image.png'],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const content = resolveServiceContent(service);
  const comingSoon = isComingSoon(service);
  const linkedApp = service.linkedAppId ? await getApp(service.linkedAppId) : null;
  const target = { id: service.id, name: service.name };

  // "CoFabri" in the heading's plain colour, the rest of the name in the brand gradient.
  const [prefix, ...rest] = service.name.split(' ');
  const headingTail = prefix === 'CoFabri' && rest.length > 0 ? rest.join(' ') : service.name;
  const headingHead = prefix === 'CoFabri' && rest.length > 0 ? 'CoFabri ' : '';

  const meta: MetaRow[] = (content?.meta ?? []).map((row) => ({
    label: row.label,
    value: row.value,
    appId: row.kind === 'app' ? (linkedApp?.id ?? service.linkedAppId) : undefined,
  }));

  const heroCtaId = comingSoon ? 'notify-hero' : 'service-hero-cta';

  const body = (
    <div className={`min-h-screen bg-background ${brandClass(service.id)}`}>
      <JsonLd data={buildServiceSchema({ id: service.id, name: service.name, description: content?.outcome ?? service.description })} />
      <div className="relative overflow-hidden">
        <HeroAurora />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-9 pb-20 sm:px-10">
          <div className="mb-14">
            <Breadcrumbs items={[{ name: 'Services', href: '/services' }, { name: service.name, href: `/services/${service.id}` }]} />
          </div>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_440px] lg:gap-20">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Badge variant={comingSoon ? 'comingSoon' : 'live'} className="px-2.5 py-1 text-xs font-semibold">
                  {comingSoon ? 'Coming soon' : 'Live'}
                </Badge>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">Service</span>
              </div>
              <div className="flex items-center gap-4">
                <FamilyMark appId={service.id} size={56} />
                <h1 className="m-0 p-0 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[52px]">
                  {headingHead}
                  <span className="brand-gradient-text">{headingTail}</span>
                </h1>
              </div>
              <p className="mt-6 max-w-[560px] text-lg leading-[1.55] text-ink-muted sm:text-xl">{content?.outcome ?? service.description}</p>
              {content?.subline && <p className="mt-2 max-w-[560px] text-base leading-[1.5] text-ink-muted">{content.subline}</p>}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {comingSoon ? (
                  <NotifyInline appId={service.id} id="notify-hero" />
                ) : (
                  <BookCallButton service={target} id="service-hero-cta" />
                )}
                {content?.steps && (
                  <a href="#how-it-works" className={buttonVariants({ variant: 'outline', className: 'h-12 rounded-lg px-6 text-[15px] font-semibold' })}>
                    See How It Works
                  </a>
                )}
              </div>
            </div>
            <MetaCard rows={meta} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-24 sm:px-10 max-sm:pb-32">
        {content?.whatYouGet && <WhatYouGet content={content.whatYouGet} />}
        {content?.steps && <Steps steps={content.steps} />}
        {content?.fit && <FitColumns fit={content.fit} />}
        {content?.howWeWork && <HowWeWork items={content.howWeWork} />}
        {/* Proof (case studies, quotes) stays out until real data exists. */}
        {content?.faq && <ServiceFaq faq={content.faq} />}
        {content?.closing && (
          <ClosingBand
            heading={content.closing.heading}
            body={content.closing.body}
            action={comingSoon ? <NotifyInline appId={service.id} id="notify-band" /> : <BookCallButton service={target} />}
          />
        )}
      </div>

      <StickyBookBar service={target} comingSoon={comingSoon} watchId={heroCtaId} notifyId="notify-hero" />
    </div>
  );

  // Hero and closing band share one Notify Me state while coming soon.
  return comingSoon ? <NotifyProvider appId={service.id}>{body}</NotifyProvider> : body;
}
