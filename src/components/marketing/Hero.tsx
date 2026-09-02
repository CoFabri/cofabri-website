'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const metrics = [
  { value: '10K+', label: 'Active users' },
  { value: '5', label: 'Apps live' },
  { value: '50+', label: 'Countries served' },
  { value: '98%', label: 'Deployment success rate' },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-0 md:pt-[132px]">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="max-w-[880px]">
          <div className="mb-7 flex items-center gap-2.5">
            <span className="block h-px w-[22px] bg-ink-disabled" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Independent software studio
            </span>
          </div>
          <h1 className="m-0 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-foreground sm:text-6xl lg:text-[76px] lg:leading-[1.02]">
            Small software that
            <br />
            does one thing well.
          </h1>
          <p className="mt-8 max-w-[560px] text-lg leading-[1.55] text-muted-foreground md:text-xl">
            We build focused SaaS apps for operators. Each one solves a single
            problem, ships in weeks, and stays out of your way.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <Button asChild size="lg">
              <Link href="/apps">Explore the Apps</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/roadmaps">See what we&apos;re building →</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4 md:mt-24">
          {metrics.map((m) => (
            <div key={m.label} className="py-7 pr-6">
              <div className="text-[28px] font-semibold tracking-[-0.03em] text-foreground sm:text-[34px]">
                {m.value}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
