'use client';

import React, { useEffect } from 'react';
import RevealSection from './RevealSection';
import { clearHydrationCaches } from '@/lib/utils';

const highlights = [
  'Industry-leading automation and AI features',
  'Frequent updates to improve every app',
  'Fast, real support from the people who built it',
];

const whyChoose = [
  'Proven track record of fast, effective deployments',
  'AI-powered automation built for real-world use cases',
  'Modular SaaS apps that grow with your business',
  'Transparent support and continuous improvements',
];

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
            Smart, scalable technology — without the complexity.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-[1.6] text-muted-foreground">
              CoFabri helps modern businesses unlock their potential through automation, AI-enhanced
              tools, and intuitive software. Whether you&rsquo;re a solo founder or an established
              enterprise, our growing suite of apps is built to streamline operations, reduce
              inefficiencies, and spark meaningful growth.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground">
              With deep expertise in software development and business process optimization, we
              create elegant, no-code and low-code solutions that simplify complexity and deliver
              measurable results. Every product is built to be modular, easy to adopt, and backed by
              ongoing support.
            </p>
            <p className="mt-5 text-lg leading-[1.6] text-foreground">
              We&rsquo;re not just a software provider — we&rsquo;re your technology partner.
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
              To empower businesses with intelligent technology solutions that drive performance,
              efficiency, and long-term success — without the traditional complexity.
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
