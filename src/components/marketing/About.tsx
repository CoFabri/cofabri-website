'use client';

import React, { useEffect } from 'react';
import RevealSection from './RevealSection';
import { clearHydrationCaches } from '@/lib/utils';
import { aboutHighlights as highlights, aboutWhyChoose as whyChoose, missionStatement } from './about-content';

const About = () => {
  useEffect(() => {
    // Clear any cached content that might cause hydration issues
    clearHydrationCaches();
  }, []);

  return (
    <RevealSection id="about" className="py-24 md:py-28 bg-background">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="mb-11 max-w-[620px]">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            About us
          </div>
          <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
            One studio. Every industry.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-[1.6] text-muted-foreground">
              CoFabri is a software studio — not a single app, a portfolio of them. Each app
              solves one problem for one kind of business, built and maintained by a small team
              that ships fast and stays close to the people using it.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground">
              Most of what we build starts in-house. Some of it starts with an operator who
              already knows an industry cold — we build the app, they bring the customers,
              and we share what it earns.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-foreground">
              We&rsquo;re not chasing every idea — we&rsquo;re picking the ones worth doing well.
            </p>

            <ul className="mt-8 border-t border-border">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 border-b border-border py-3.5 text-[15px] text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="m-0 text-xl font-semibold text-foreground">Our mission</h3>
            <p className="mt-3 text-muted-foreground">
              {missionStatement}
            </p>

            <div className="mt-7 border-t border-border pt-7">
              <h4 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Why choose CoFabri
              </h4>
              <ul className="mt-4 flex flex-col">
                {whyChoose.map((item, i) => (
                  <li key={item} className="flex gap-3.5 border-t border-border py-3.5 text-[15px] text-foreground first:border-t-0">
                    <span className="pt-0.5 font-mono text-xs text-ink-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
};

export default About;
