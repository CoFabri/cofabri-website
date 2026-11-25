import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { App } from '@/lib/api-client';
import { FAMILY_MARKS } from '@/lib/family-marks';
import { brandClass, isComingSoon, resolveServiceContent } from '@/lib/services';
import FamilyMark, { FamilyMarkIcon } from './FamilyMark';
import NotifyInline from './NotifyInline';

// A wide, tinted panel for one service on /services (used while there are four
// or fewer): content on the left, a 300px action column on the right.

interface Tint {
  lightBg: string;
  lightBorder: string;
  darkBg: string;
  darkBorder: string;
}

// Light: a pale wash of the service's colour fading to white. Dark: the tile
// colour at about 30% fading into the card colour, with a border in the icon
// colour at .14. Services without a tint here get the plain card.
const TINTS: Record<string, Tint> = {
  'cofabri-marketing': {
    lightBg: 'linear-gradient(115deg in oklch, #FBF2EF, #FFFFFF 62%)',
    lightBorder: '#EBDDD9',
    darkBg: 'linear-gradient(115deg in oklch, rgb(138 105 115 / 0.30), var(--card) 62%)',
    darkBorder: 'rgb(255 216 208 / 0.14)',
  },
  'cofabri-concierge': {
    lightBg: 'linear-gradient(115deg in oklch, #F4F2FA, #FFFFFF 62%)',
    lightBorder: '#E0DCEB',
    darkBg: 'linear-gradient(115deg in oklch, rgb(112 106 144 / 0.30), var(--card) 62%)',
    darkBorder: 'rgb(228 221 255 / 0.14)',
  },
};

interface ServicePanelProps {
  service: App;
  /** The app this service runs on, for the "Runs on" line. */
  linkedApp?: Pick<App, 'id' | 'name'>;
}

export default function ServicePanel({ service, linkedApp }: ServicePanelProps) {
  const comingSoon = isComingSoon(service);
  const content = resolveServiceContent(service);
  const tint = TINTS[service.id];
  const mark = FAMILY_MARKS[service.id];
  const runsOn =
    linkedApp ??
    (service.linkedAppId ? { id: service.linkedAppId, name: FAMILY_MARKS[service.linkedAppId]?.label ?? service.linkedAppId } : undefined);
  const href = `/services/${service.id}`;

  const style = tint
    ? ({
        '--p-bg-l': tint.lightBg,
        '--p-bd-l': tint.lightBorder,
        '--p-bg-d': tint.darkBg,
        '--p-bd-d': tint.darkBorder,
      } as React.CSSProperties)
    : undefined;

  return (
    <article
      data-service-panel={service.id}
      style={style}
      className={`group relative overflow-hidden rounded-lg border ${brandClass(service.id)} ${
        tint
          ? 'border-[color:var(--p-bd-l)] [background-image:var(--p-bg-l)] dark:border-[color:var(--p-bd-d)] dark:[background-image:var(--p-bg-d)]'
          : 'border-border bg-card'
      } ${comingSoon ? '' : 'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg'}`}
    >
      {/* Watermark: the service's icon, large and tilted, behind the content at the right edge. */}
      {mark && (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 -rotate-[8deg] opacity-[0.13] dark:hidden">
            <FamilyMarkIcon appId={service.id} size={300} color={mark.from} strokeWidth={1.1} />
          </span>
          <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 -rotate-[8deg] opacity-[0.08] dark:block">
            <FamilyMarkIcon appId={service.id} size={300} color={mark.icon} strokeWidth={1.1} />
          </span>
        </>
      )}

      <div className="duo-split relative z-10 grid min-h-[248px] grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="p-6 sm:px-11 sm:py-10">
          <div className="flex items-center gap-4">
            <span className="sm:hidden">
              <FamilyMark appId={service.id} size={52} />
            </span>
            <span className="hidden sm:inline-flex">
              <FamilyMark appId={service.id} size={64} />
            </span>
            <Badge variant={comingSoon ? 'comingSoon' : 'live'} className="px-2.5 py-1 text-xs font-semibold">
              {comingSoon ? 'Coming soon' : 'Live'}
            </Badge>
          </div>
          <h3 className="m-0 mt-5 p-0 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[34px]">
            <Link href={href} className="-my-2 inline-block py-2 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40">
              {service.name}
            </Link>
          </h3>
          <p className="mt-3 max-w-[560px] text-[17px] leading-[1.5] text-ink-muted sm:text-[18px]">{content?.outcome ?? service.description}</p>
          {runsOn && (
            <p className="mt-5 flex items-center gap-2 text-sm text-ink-muted">
              Runs on
              <FamilyMark appId={runsOn.id} size={24} />
              <span className="font-medium text-ink-body">{runsOn.name}</span>
            </p>
          )}
        </div>

        <div
          className={`flex flex-col justify-center gap-3 border-t p-6 sm:px-11 lg:border-l lg:border-t-0 lg:px-8 lg:py-10 ${
            tint ? 'border-[color:var(--p-bd-l)] dark:border-[color:var(--p-bd-d)]' : 'border-border'
          }`}
        >
          {comingSoon ? (
            <>
              <NotifyInline appId={service.id} variant="outline" stacked />
              <Link
                href={href}
                className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-[15px] font-semibold text-brand-text transition-colors hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40"
              >
                Learn More
              </Link>
            </>
          ) : (
            <Link
              href={href}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40"
            >
              Learn More
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
