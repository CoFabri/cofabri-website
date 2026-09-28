import Image from 'next/image';
import type { LinkedApp } from '@/lib/api-client';

const MAX_VISIBLE = 3;

interface AppMarkGroupProps {
  apps: LinkedApp[];
}

/**
 * The linked apps' marks as an overlapping group (one mark when a single app
 * is linked, "+N" past three). Renders nothing when no linked app has a mark,
 * so callers can drop it in without a guard.
 */
export function AppMarkGroup({ apps }: AppMarkGroupProps) {
  const withMarks = apps.filter((a) => a.faviconUrl);
  if (withMarks.length === 0) return null;

  const visible = withMarks.slice(0, MAX_VISIBLE);
  const overflow = withMarks.length - visible.length;

  return (
    <div className="flex flex-shrink-0 items-center -space-x-1.5" title={apps.map((a) => a.name).join(', ')}>
      {visible.map((app) => (
        <div
          key={app.id}
          className="relative h-6 w-6 overflow-hidden rounded-md border border-border bg-white p-0.5 ring-2 ring-background"
        >
          <Image
            src={app.faviconUrl as string}
            alt=""
            fill
            sizes="24px"
            className="object-contain"
            unoptimized={process.env.NODE_ENV === 'development'}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div className="relative flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-background px-1 font-mono text-[10px] text-ink-muted ring-2 ring-background">
          +{overflow}
        </div>
      )}
    </div>
  );
}
