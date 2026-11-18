import Image from 'next/image';

interface AppNameLineProps {
  apps: { id: string; name: string }[];
  /** App id -> display name (falls back to the linked app's own name). */
  appNames: Record<string, string>;
  /** App id -> mark (favicon) URL. Apps without one just show the name. */
  appMarks: Record<string, string>;
}

/**
 * The small "mark + APP NAME" line under a changelog/roadmap entry's title.
 * Each linked app gets its mark (when it has one) next to its name; several
 * apps wrap onto the same line separated by gaps.
 */
export function AppNameLine({ apps, appNames, appMarks }: AppNameLineProps) {
  if (apps.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {apps.map((app) => {
        const mark = appMarks[app.id];
        return (
          <span key={app.id} className="inline-flex items-center gap-1.5">
            {mark && (
              <span className="relative h-[18px] w-[18px] flex-shrink-0 overflow-hidden rounded-[5px] border border-border bg-white p-px">
                <Image
                  src={mark}
                  alt=""
                  fill
                  sizes="18px"
                  className="object-contain"
                  unoptimized={process.env.NODE_ENV === 'development'}
                />
              </span>
            )}
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              {appNames[app.id] || app.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}
