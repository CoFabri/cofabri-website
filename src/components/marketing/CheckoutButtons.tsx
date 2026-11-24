import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface CheckoutButtonsProps {
  monthly: string;
  annual: string;
}

const checkoutButton =
  'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border-strong bg-background px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 sm:flex-none sm:min-w-[132px]';

/**
 * Self-service checkout for an app: two equal outlined links, Monthly and
 * Annual, each opening checkout in a new tab, then All Apps set apart by a
 * divider. No prices and no savings copy. The parent decides whether to
 * render this at all: it needs both links from the app's metadata.checkout.
 */
export default function CheckoutButtons({ monthly, annual }: CheckoutButtonsProps) {
  return (
    <div>
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted" id="checkout-label">
        Get Started
      </div>
      <div className="flex flex-wrap items-stretch gap-3">
        <div role="group" aria-labelledby="checkout-label" className="flex w-full gap-3 sm:w-auto">
          {[
            { label: 'Monthly', href: monthly },
            { label: 'Annual', href: annual },
          ].map((option) => (
            <a key={option.label} href={option.href} target="_blank" rel="noopener noreferrer" className={checkoutButton}>
              {option.label}
              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-brand-text" aria-hidden="true" />
              <span className="sr-only">(opens checkout in a new tab)</span>
            </a>
          ))}
        </div>
        <span className="hidden w-px self-stretch bg-border sm:block" aria-hidden="true" />
        <Link
          href="/apps"
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border-strong px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 sm:w-auto sm:border-transparent sm:hover:bg-muted"
        >
          All Apps
        </Link>
      </div>
      <p className="mt-2.5 text-sm text-muted-foreground">Opens secure checkout in a new tab.</p>
    </div>
  );
}
