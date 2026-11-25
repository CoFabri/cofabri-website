import type { RunsOnApp } from '@/lib/services/runs-on';
import AppTile from './AppTile';

/** "Runs on [tile] CoFabri CRM [tile] Medoura": the apps a service runs on. Renders nothing for none. */
export default function RunsOnLine({ apps, className = '' }: { apps: RunsOnApp[]; className?: string }) {
  if (apps.length === 0) return null;
  return (
    <p className={`m-0 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted ${className}`}>
      <span>Runs on</span>
      {apps.map((app) => (
        <span key={app.id} className="inline-flex items-center gap-2">
          <AppTile app={app} size={24} />
          <span className="font-medium text-ink-body">{app.name}</span>
        </span>
      ))}
    </p>
  );
}
