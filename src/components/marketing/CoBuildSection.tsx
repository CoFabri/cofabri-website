import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import RevealSection from './RevealSection';
import CoBuildWordmark from './CoBuildWordmark';

export default function CoBuildSection() {
  return (
    <RevealSection className="py-24 md:py-28 bg-muted">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Co-Build
            </div>
            <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              <CoBuildWordmark /> an app for your industry.
            </h2>
          </div>
          <div>
            <p className="text-lg leading-[1.6] text-muted-foreground">
              We don&apos;t understand every industry we build for — you might. If you know an
              industry well enough to see exactly where its software falls short, we want to
              build with you: you bring the expertise and the customers, we bring the
              engineering, and you keep a stake in what we ship.
            </p>
            <p className="mt-4 text-lg leading-[1.6] text-muted-foreground">
              Medoura, live and selling to telehealth businesses today, started exactly this way.
            </p>
            <Link
              href="/partners"
              className="mt-7 inline-flex items-center gap-1.5 border-b border-ink-disabled pb-0.5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              See how Co-Build works
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
