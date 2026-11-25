import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import type { App } from '@/lib/api-client';
import { serviceCardLine } from '@/lib/services';
import FamilyMark from './FamilyMark';

interface ManagedServiceCardProps {
  service: App;
  /** Name of the app the service runs on. */
  runsOn?: string;
}

/**
 * A service listed among the apps: the same row as an app, on a sunken fill,
 * marked "Managed" so it is not mistaken for something you sign up for yourself.
 */
export default function ManagedServiceCard({ service, runsOn }: ManagedServiceCardProps) {
  return (
    <Link
      href={`/services/${service.id}`}
      data-managed-service={service.id}
      className="group mt-2 flex flex-col gap-4 rounded-lg border border-border bg-surface-sunken px-6 py-5 text-foreground transition-colors duration-200 hover:border-border-strong sm:flex-row sm:items-center sm:gap-5"
    >
      <FamilyMark appId={service.id} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-lg font-semibold tracking-[-0.015em]">{service.name}</span>
          <Badge variant="managed" className="px-2.5 py-0.5 text-xs font-semibold">
            Managed
          </Badge>
        </div>
        <div className="mt-1 text-[15px] leading-[1.5] text-muted-foreground">{serviceCardLine(service)}</div>
        <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.07em] text-ink-muted">
          Service{runsOn ? ` · on ${runsOn}` : ''}
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[15px] font-semibold text-primary">
        See the Service
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
