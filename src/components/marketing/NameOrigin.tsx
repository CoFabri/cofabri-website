'use client';

import * as React from 'react';
import Image from 'next/image';
import { Poppins, UnifrakturMaguntia } from 'next/font/google';
import { nameEtymology } from './about-content';

// Self-hosted at build time (not the runtime `@import url(fonts.googleapis...)`
// in globals.css) so these two display faces — used nowhere else on the site —
// don't depend on a Google Fonts request succeeding at runtime. That runtime
// @import is what globals.css used for these before; it silently fails to
// register any @font-face in some environments, which is invisible for the
// sitewide sans/mono fallback but glaring for a blackletter face falling back
// to Georgia.
const poppinsBold = Poppins({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
const unifrakturMaguntia = UnifrakturMaguntia({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// Scroll-scrubbed within a tall sticky stage: "Co" and "Fabri" start apart at
// their natural reading position, slide together into "CoFabri" as the user
// scrolls through the pinned section, then their captions and the synthesis
// line fade in. Ported from the Claude Design mock's scroll-fraction math
// (CoFabri About Page.dc.html) — kept as an imperative rAF/transform loop
// rather than Framer Motion because it's driven by absolute scroll position
// within the stage, not viewport-entry, which is what RevealSection covers.
const ramp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

export default function NameOrigin() {
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const coRef = React.useRef<HTMLDivElement>(null);
  const fabriRef = React.useRef<HTMLDivElement>(null);
  const capCoRef = React.useRef<HTMLDivElement>(null);
  const capFabriRef = React.useRef<HTMLDivElement>(null);
  const synthRef = React.useRef<HTMLParagraphElement>(null);
  const eyebrowRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLImageElement>(null);
  const deltas = React.useRef({ dxCo: 0, dxFa: 0, dyFa: 0 });

  React.useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;

    function measure() {
      const co = coRef.current;
      const fa = fabriRef.current;
      const stage = stageRef.current;
      if (!co || !fa || !stage) return;
      co.style.transform = '';
      fa.style.transform = '';
      const a = co.getBoundingClientRect();
      const b = fa.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const kern = -a.width * 0.03;
      const joined = a.width + b.width + kern;
      const left = s.left + (s.width - joined) / 2;
      deltas.current = {
        dxCo: left - a.left,
        dxFa: left + a.width + kern - b.left,
        dyFa: a.bottom - b.bottom,
      };
    }

    function apply() {
      const sc = sceneRef.current;
      const stage = stageRef.current;
      if (!sc || !stage) return;
      const { dxCo, dxFa, dyFa } = deltas.current;
      const r = sc.getBoundingClientRect();
      const h = stage.offsetHeight || window.innerHeight || 800;
      const span = Math.max(1, r.height - h);
      let p = -r.top / span;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (reduced) p = 1;

      const split = easeInOut(ramp((p - 0.1) / 0.42));
      const t = 1 - split;

      if (coRef.current) coRef.current.style.transform = `translate3d(${(dxCo * t).toFixed(2)}px,0,0)`;
      if (fabriRef.current) {
        fabriRef.current.style.transform = `translate3d(${(dxFa * t).toFixed(2)}px,${(dyFa * t).toFixed(2)}px,0)`;
      }

      const caps = easeOut(ramp((p - 0.34) / 0.3));
      [capCoRef.current, capFabriRef.current].forEach((el, i) => {
        if (!el) return;
        const c = easeOut(ramp((p - 0.34 - i * 0.06) / 0.3));
        el.style.opacity = String(c);
        el.style.transform = `translate3d(0,${((1 - c) * 16).toFixed(2)}px,0)`;
      });

      if (eyebrowRef.current) {
        const eb = easeOut(ramp((p - 0.26) / 0.26));
        eyebrowRef.current.style.opacity = String(eb);
        eyebrowRef.current.style.transform = `translate3d(0,${((1 - eb) * 12).toFixed(2)}px,0)`;
      }

      const synth = easeOut(ramp((p - 0.66) / 0.28));
      if (synthRef.current) {
        synthRef.current.style.opacity = String(synth);
        synthRef.current.style.transform = `translate3d(0,${((1 - synth) * 24).toFixed(2)}px,0)`;
      }

      if (markRef.current) {
        markRef.current.style.opacity = (0.05 + caps * 0.05).toFixed(3);
        markRef.current.style.transform = `translate3d(0,${((p - 1) * 40).toFixed(2)}px,0) rotate(${((1 - p) * 14).toFixed(2)}deg)`;
      }
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply();
      });
    }
    function onResize() {
      measure();
      apply();
    }

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onResize);
    measure();
    apply();
    document.fonts?.ready?.then(() => {
      measure();
      apply();
    });

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="mt-16 bg-[#12171B] text-[#F1F4F6] md:mt-24">
      <div ref={sceneRef} className="relative" style={{ height: '280vh' }}>
        <div ref={stageRef} data-stage className="sticky top-0 flex min-h-screen items-center overflow-hidden">
          <Image
            ref={markRef}
            src="https://files.cofabri.com/logos/cofabri/png/cofabri-mark-dark-1024.png"
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            className="pointer-events-none absolute -top-[60px] -right-[90px] block h-auto w-[300px] opacity-[0.07] sm:w-[420px] lg:w-[520px]"
          />
          <div className="relative mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-10 sm:py-20">
            <div ref={eyebrowRef} className="mb-9 flex items-center gap-2.5 opacity-0 sm:mb-14">
              <span className="block h-px w-[22px] flex-none bg-[#55636D]" />
              <span className="font-mono text-xs tracking-[0.1em] text-[#9AA8B2] uppercase">
                Where the name comes from
              </span>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 sm:gap-16">
              <div>
                <div
                  ref={coRef}
                  className={`${unifrakturMaguntia.className} inline-block text-[76px] leading-[0.92] text-[#F1F4F6] will-change-transform sm:text-[110px] lg:text-[158px]`}
                >
                  {nameEtymology.co.word}
                </div>
                <div ref={capCoRef} className="mt-6 max-w-[320px] border-t border-[#2B353D] pt-[18px] opacity-0">
                  <div className="font-mono text-[13px] text-[#F1F4F6]">{nameEtymology.co.origin}</div>
                  <p className="mt-2.5 text-[15px] leading-[1.6] text-[#9AA8B2]">{nameEtymology.co.caption}</p>
                </div>
              </div>

              <div>
                <div
                  ref={fabriRef}
                  className={`${poppinsBold.className} inline-block text-[70px] leading-none tracking-[-0.03em] text-[#5AA0F5] will-change-transform sm:text-[100px] lg:text-[146px]`}
                >
                  {nameEtymology.fabri.word}
                </div>
                <div ref={capFabriRef} className="mt-6 max-w-[340px] border-t border-[#2B353D] pt-[18px] opacity-0">
                  <div className="text-[13px] text-[#9AA8B2]">
                    Latin <span className="text-[15px] text-[#F1F4F6] italic">{nameEtymology.fabri.origin}</span>
                  </div>
                  <p className="mt-2.5 text-[15px] leading-[1.6] text-[#9AA8B2]">{nameEtymology.fabri.caption}</p>
                </div>
              </div>
            </div>

            <p
              ref={synthRef}
              className="mt-11 max-w-[640px] border-l-2 border-[#5AA0F5] pl-5 text-[22px] leading-[1.25] font-medium tracking-[-0.02em] text-[#F1F4F6] opacity-0 sm:text-[28px] lg:text-[34px]"
            >
              {nameEtymology.synthesis}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
