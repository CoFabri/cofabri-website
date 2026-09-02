import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import TouchButton from './TouchButton';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Couldn't load this",
  description = 'Something went wrong on our end. The team has been notified.',
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-danger/20 bg-danger/5 px-6 py-11 text-center">
      <div className="mx-auto mb-[18px] flex h-11 w-11 items-center justify-center rounded-[10px] border border-danger/20 bg-card">
        <ExclamationCircleIcon className="h-5 w-5 text-danger" />
      </div>
      <div className="text-[17px] font-semibold text-danger">{title}</div>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-[1.55] text-danger/80">{description}</p>
      {onRetry && (
        <TouchButton variant="error" size="medium" className="mx-auto mt-[18px]" onClick={onRetry}>
          {retryLabel}
        </TouchButton>
      )}
    </div>
  );
}
