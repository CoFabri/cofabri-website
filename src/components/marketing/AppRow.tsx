import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { App, RoadmapFeature } from '@/lib/api-client';
import { statusPillClasses, statusDotClasses, markPalette, appMomentum } from '@/lib/app-display';

interface AppRowProps {
  app: App;
  roadmap: RoadmapFeature[];
  href: string;
}

export default function AppRow({ app, roadmap, href }: AppRowProps) {
  const momentum = appMomentum(app, roadmap);

  return (
    <Link
      href={href}
      className="group block rounded-[10px] border-b border-border px-6 py-6 text-foreground transition-colors duration-200 hover:bg-muted md:grid md:grid-cols-[40px_1fr_112px_200px_20px] md:items-start md:gap-6"
    >
      <div className="flex items-center gap-4 md:contents">
        {app.faviconUrl ? (
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[9px] border border-border">
            <Image src={app.faviconUrl} alt="" fill className="object-cover" unoptimized={process.env.NODE_ENV === 'development'} />
          </div>
        ) : (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] text-[17px] font-semibold tracking-[-0.02em] ${markPalette(app.id)}`}>
            {app.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-[-0.015em]">{app.name}</span>
            <span className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDotClasses(app.status)}`} />
          </div>
          {app.description && <div className="mt-1 text-[15px] leading-[1.5] text-muted-foreground">{app.description}</div>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 md:contents">
        <div className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(app.status)}`}>
          {app.status}
        </div>
        <div className="md:border-l md:border-border md:pl-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-faint">Momentum</div>
          <div className="mt-1 text-sm leading-snug text-ink-body">{momentum}</div>
        </div>
      </div>
      <ArrowRight className="hidden h-[17px] w-[17px] justify-self-end text-ink-disabled transition-transform duration-200 group-hover:translate-x-0.5 md:block" />
    </Link>
  );
}
