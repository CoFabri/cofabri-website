'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import HeroAurora from './HeroAurora';
import type { App, KnowledgeBaseArticle, RoadmapFeature } from '@/lib/api-client';

function MetricCount({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? target : 0);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;
    const controls = animate(0, target, {
      duration: 1.3,
      ease: 'easeOut',
      onUpdate: (value) => setDisplay(Math.round(value)),
    });
    return () => controls.stop();
  }, [isInView, shouldReduceMotion, target]);

  return (
    <div ref={ref}>
      {display}
      {suffix}
    </div>
  );
}

const Hero = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapFeature[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    };

    async function fetchMetrics() {
      try {
        const [appsRes, roadmapRes, kbRes] = await Promise.all([
          fetch('/api/apps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/roadmaps', { cache: 'no-store', headers: noCacheHeaders }),
          fetch('/api/knowledge-base', { cache: 'no-store', headers: noCacheHeaders }),
        ]);
        if (appsRes.ok) setApps(await appsRes.json());
        if (roadmapRes.ok) setRoadmap(await roadmapRes.json());
        if (kbRes.ok) setKbArticles(await kbRes.json());
      } catch (err) {
        console.error('Error fetching hero metrics:', err);
      } finally {
        setLoaded(true);
      }
    }

    fetchMetrics();
  }, []);

  const liveAppCount = apps.filter((a) => a.status === 'Live').length;
  const shippedToDate = roadmap.filter((f) => f.status === 'Released').length;

  const metrics = [
    { target: liveAppCount, suffix: '', label: 'Apps live' },
    { target: shippedToDate, suffix: '', label: 'Features shipped to date' },
    { target: kbArticles.length, suffix: '', label: 'Knowledge base articles' },
  ];

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-0 md:pt-[132px]">
      <HeroAurora />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 sm:px-10">
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

        <div className="mt-16 grid grid-cols-3 divide-x divide-border border-t border-border md:mt-24">
          {metrics.map((m) => (
            <div key={m.label} className="px-6 py-7 first:pl-0">
              <div className="text-[28px] font-semibold tracking-[-0.03em] text-foreground sm:text-[34px]">
                {loaded && m.target > 0 ? <MetricCount target={m.target} suffix={m.suffix} /> : '—'}
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
