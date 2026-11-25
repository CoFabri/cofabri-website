import { CheckIcon } from '@heroicons/react/24/solid';
import { windowState, type PillTone } from '@/lib/services/handoff';
import FamilyMark from './FamilyMark';

// A stand-in for the CoFabri CRM window, built in JSX and CSS (not an image).
// It is decorative: the step list next to it carries the meaning, so it is
// aria-hidden and nothing in it is focusable. It follows the site theme (the
// light app UI in light theme, the dark app UI in dark theme). Everything shown
// is placeholder text: no real names, numbers or results.

const PILL: Record<PillTone, string> = {
  neutral: 'bg-muted text-ink-body',
  accent: 'bg-accent-tint text-[#0857BE] dark:text-accent-hover',
  success: 'bg-success/15 text-[#0F6B3A] dark:text-success',
};

interface HandOffWindowProps {
  /** 0-based step, 0 to 3. */
  step: number;
  /** The phone version: only the newest log row, and the ad image as a 72px thumbnail. */
  compact?: boolean;
}

function FauxButton({ children, solid = false }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold ${
        solid ? 'bg-[#0B6BE6] text-white' : 'border border-border-strong text-foreground'
      }`}
    >
      {children}
    </span>
  );
}

export default function HandOffWindow({ step, compact = false }: HandOffWindowProps) {
  const state = windowState(step);
  const log = compact ? state.log.slice(0, 1) : state.log;

  return (
    <div
      aria-hidden="true"
      data-handoff-window
      data-step={Math.max(0, Math.min(3, Math.trunc(step)))}
      className="w-full overflow-hidden rounded-[12px] border border-border bg-card text-foreground shadow-[0_30px_80px_-24px_rgba(0,0,0,0.65)]"
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-sunken px-4 py-3">
        <span className="hidden gap-1.5 sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </span>
        <FamilyMark appId="cofabri-crm" size={24} />
        <span className="text-sm font-semibold">CoFabri CRM</span>
        <span className="ml-auto hidden font-mono text-xs text-ink-muted sm:block">[Your business] · Campaigns</span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          Run by
          <FamilyMark appId="cofabri-marketing" size={24} />
          <span className="font-medium text-ink-body">CoFabri Marketing</span>
        </div>

        {/* Ad card */}
        <div className={`flex gap-4 rounded-lg border border-border bg-background p-3.5 ${compact ? 'items-center' : 'flex-col sm:flex-row'}`}>
          <div
            className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-border text-center font-mono text-[11px] text-ink-muted ${
              compact ? 'h-[72px] w-[72px]' : 'h-32 w-full sm:w-44'
            }`}
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, var(--surface-sunken) 0 9px, var(--surface-hover) 9px 18px)' }}
          >
            {compact ? '' : '[Your photo]'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Facebook · Instagram ad</div>
            <div className="mt-1 text-[15px] font-semibold">[Ad headline]</div>
            <div className="mt-2.5 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-border" />
              <div className="h-2 w-3/5 rounded-full bg-border" />
            </div>
            <span
              key={state.pill.label}
              className={`ho-in mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[state.pill.tone]}`}
            >
              {state.pill.icon === 'check' && <CheckIcon className="h-3 w-3" />}
              {state.pill.icon === 'dot' && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              {state.pill.label}
            </span>
          </div>
        </div>

        {state.approval && (
          <div className="ho-in flex flex-col gap-3 rounded-lg border border-border bg-surface-sunken p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium">Approve this ad before it runs?</span>
            <span className="flex gap-2">
              <FauxButton>Request Changes</FauxButton>
              <FauxButton solid>Approve</FauxButton>
            </span>
          </div>
        )}

        {state.lead && (
          <div className="ho-in flex items-center gap-3 rounded-lg border border-border bg-background p-3.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-[#0857BE] dark:text-accent-hover">
              LN
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">New lead · [Lead name]</span>
              <span className="block truncate text-xs text-ink-muted">From the Facebook ad &ldquo;[Ad headline]&rdquo;</span>
            </span>
            <FauxButton>Follow Up</FauxButton>
          </div>
        )}

        {/* Activity log, newest first */}
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Activity</div>
          <ul className="m-0 list-none space-y-2 p-0">
            {log.map((row, i) => (
              <li key={row.id} className={`ho-in flex items-center gap-2.5 text-sm ${i === 0 ? 'text-foreground' : 'text-ink-muted'}`}>
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${i === 0 ? 'bg-[#0B6BE6] dark:bg-[#83B8F8]' : 'bg-border-strong'}`} />
                <span>
                  {row.text} <span className="text-ink-muted">· {row.by}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
