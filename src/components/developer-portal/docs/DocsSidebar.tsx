// src/components/developer-portal/docs/DocsSidebar.tsx

import type { AppGuide } from '@/lib/developer-portal/guides/types';
import type { SpecEndpoint } from '@/lib/developer-portal/openapi-types';

export function DocsSidebar({
  guide,
  groups,
}: {
  guide: AppGuide | null;
  groups: { tag: string; endpoints: SpecEndpoint[] }[];
}) {
  return (
    <nav className="hidden shrink-0 self-start border-r border-border py-8 pr-5 lg:sticky lg:top-[68px] lg:block lg:max-h-[calc(100vh-68px)] lg:w-[220px] lg:overflow-y-auto">
      {guide ? (
        <>
          <div className="px-2 pb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Getting started
          </div>
          <div className="flex flex-col gap-0.5">
            <a href="#overview" className="rounded-md px-2 py-1.5 text-[14px] text-muted-foreground hover:bg-muted hover:text-foreground">
              Overview
            </a>
            {guide.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-md px-2 py-1.5 text-[14px] text-muted-foreground hover:bg-muted hover:text-foreground">
                {s.title}
              </a>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-6 px-2 pb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Resources
      </div>
      <div className="flex flex-col gap-0.5">
        {groups.map((g) => (
          <a
            key={g.tag}
            href={`#tag-${g.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[14px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span>{g.tag}</span>
            <span className="font-mono text-[11px] text-muted-foreground/70">{g.endpoints.length}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
