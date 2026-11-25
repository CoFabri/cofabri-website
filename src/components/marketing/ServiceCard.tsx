import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { App } from '@/lib/api-client';
import { brandClass, isComingSoon, serviceCardLine } from '@/lib/services';
import FamilyMark from './FamilyMark';
import NotifyInline from './NotifyInline';
import RunsOnLine from './RunsOnLine';
import type { RunsOnApp } from '@/lib/services/runs-on';

interface ServiceCardProps {
  service: App;
  /** The apps this service runs on, for the "Runs on" line. */
  runsOn?: RunsOnApp[];
  /** Exactly one service is visible: lay the card out horizontally. */
  solo?: boolean;
}

export default function ServiceCard({ service, runsOn = [], solo = false }: ServiceCardProps) {
  const comingSoon = isComingSoon(service);
  const href = `/services/${service.id}`;

  return (
    <article
      data-service-card={service.id}
      className={`relative flex h-full rounded-lg border border-border bg-card p-6 ${brandClass(service.id)} ${solo ? 'flex-col gap-6 md:flex-row md:items-center md:gap-10 md:p-8 duo:flex-col duo:items-stretch duo:gap-6' : 'flex-col gap-5'}`}
    >
      <div className={solo ? 'flex-1' : ''}>
        <div className={`flex gap-3 ${solo ? 'items-center gap-4' : 'items-start justify-between'}`}>
          <FamilyMark appId={service.id} size={solo ? 56 : 44} />
          <Badge variant={comingSoon ? 'comingSoon' : 'live'} className="px-2.5 py-1 text-xs font-semibold">
            {comingSoon ? 'Coming soon' : 'Live'}
          </Badge>
        </div>
        <h3 className="m-0 mt-5 p-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground md:text-[22px]">
          <Link href={href} className="after:absolute after:inset-0 hover:underline">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 max-w-[520px] text-[15px] leading-[1.55] text-ink-muted">{serviceCardLine(service)}</p>
        <RunsOnLine apps={runsOn} className="mt-4" />
      </div>

      {/* Footer row has a fixed minimum height so the footers line up across cards. */}
      {/* A card footer is a size container, so Notify Me stacks (field above button) when the card is narrow: a two-up card at 768 is about 332px wide. The solo card's footer sizes to its content, so it is not one. */}
      <div className={`relative z-10 flex flex-wrap items-center gap-x-5 gap-y-3 ${solo ? 'md:flex-shrink-0 duo:flex-shrink' : '@container mt-auto min-h-[68px] border-t border-border pt-5'}`}>
        {comingSoon && <NotifyInline appId={service.id} stacked={solo ? false : 'container'} />}
        <Link
          href={href}
          className="text-[15px] font-semibold text-brand-text transition-colors hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          Learn More
        </Link>
      </div>
    </article>
  );
}
