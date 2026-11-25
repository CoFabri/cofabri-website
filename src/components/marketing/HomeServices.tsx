'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { App } from '@/lib/api-client';
import { isService } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { allServicesLabel, homeCardsGridClass, homeServicesLayout, homeServicesView, type HomeServicesState } from '@/lib/services/home-layout';
import RevealSection from './RevealSection';
import ServiceCard from './ServiceCard';

// The Services section of the home page, between Apps and Co-Build: apps you run yourself, then
// services we run for you. Same services, in the same order, as /services. See
// src/lib/services/home-layout.ts for how the cards are laid out by count.

const SHELL = 'border-t border-border py-24 md:py-28 bg-background';
const INNER = 'mx-auto max-w-[1200px] px-6 sm:px-10';

export function HomeServicesView({ services }: { services: App[] }) {
  const layout = homeServicesLayout(services.length);
  if (layout === 'none') return null;

  return (
    <RevealSection data-home-services className={SHELL} aria-labelledby="home-services-heading">
      <div className={INNER}>
        {/* Spanned on a dual-screen device the heading sits on the left screen and the line on the right. */}
        <div className="grid grid-cols-1 duo-split">
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">Services</div>
            <h2 id="home-services-heading" className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              Some work is better done for you.
            </h2>
          </div>
          <p className="mt-4 max-w-[560px] text-lg leading-[1.6] text-muted-foreground duo:mt-0 duo:self-end">
            Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps.
          </p>
        </div>

        {layout === 'solo' && (
          <div className="mt-10 grid grid-cols-1 duo-split">
            <ServiceCard service={services[0]} solo />
          </div>
        )}
        {layout === 'cards' && (
          <div className={`mt-10 duo-split ${homeCardsGridClass(services.length)}`}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/services"
            className="group inline-flex items-center text-[15px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 pointer-coarse:min-h-11"
          >
            <span className="inline-flex items-center gap-1.5 border-b border-ink-disabled pb-0.5 transition-colors group-hover:border-primary">
              {allServicesLabel(services.length)}
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </RevealSection>
  );
}

export function HomeServicesSkeleton() {
  return (
    <section data-home-services-skeleton aria-hidden="true" className={SHELL}>
      <div className={INNER}>
        <Skeleton className="mb-3.5 h-3 w-20" />
        <Skeleton className="h-10 w-full max-w-[520px] sm:h-12" />
        <Skeleton className="mt-4 h-14 w-full max-w-[560px]" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-[290px] rounded-lg" />
          <Skeleton className="h-[290px] rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export default function HomeServices() {
  const [services, setServices] = useState<App[]>([]);
  const [state, setState] = useState<HomeServicesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/services', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0', Pragma: 'no-cache' },
        });
        if (!res.ok) throw new Error('Failed to fetch services');
        const data = ((await res.json()) as App[]).filter(isService);
        if (cancelled) return;
        setServices(data);
        setState({ status: 'ready', count: data.length });
      } catch (err) {
        console.error('Error fetching services:', err);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const view = homeServicesView(state);
  if (view === 'skeleton') return <HomeServicesSkeleton />;
  if (view === 'hidden') return null;
  return <HomeServicesView services={services} />;
}
