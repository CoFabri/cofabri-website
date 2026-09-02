import type { ReactNode } from 'react';
import TouchButton from './TouchButton';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-border px-6 py-11 text-center">
      <div className="mx-auto mb-[18px] flex h-11 w-11 items-center justify-center rounded-[10px] border border-border text-ink-disabled">
        {icon}
      </div>
      <div className="text-[17px] font-semibold text-foreground">{title}</div>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-[1.55] text-ink-muted">{description}</p>
      {action && (
        <TouchButton variant="secondary" size="medium" className="mx-auto mt-[18px]" onClick={action.onClick}>
          {action.label}
        </TouchButton>
      )}
    </div>
  );
}
