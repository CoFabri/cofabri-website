'use client';

import { useEffect, useRef, useState } from 'react';
import { HANDOFF_STEPS, STEP_COUNT, resolveStep, sectionProgress, stepFromProgress, type StepOverride } from '@/lib/services/handoff';
import HandOffIntro from './HandOffIntro';
import HandOffWindow from './HandOffWindow';

// The interactive desktop versions of the hand-off scene on /services, inside
// HandOffScene's section (the phone version is HandOffStack, rendered on the server):
//  - desktop: a tall block with a sticky stage; scroll position scrubs steps 1 to 4
//  - desktop with reduced motion: no pinning, no scrubbing; the list with step 4's window
// The scroll listener is rAF-throttled, like NameOrigin's, rather than Framer Motion.

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83B8F8] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-bg)]';

// Past steps a lighter grey, future steps dimmer, the current step white. All AA on both ink colours.
function stepColors(i: number, current: number) {
  if (i === current) return { num: 'text-[#83B8F8]', title: 'text-white' };
  if (i < current) return { num: 'text-[#9AA8B2]', title: 'text-[#9AA8B2]' };
  return { num: 'text-[#7E8B96]', title: 'text-[#7E8B96]' };
}

function StepList({ step, onSelect }: { step: number; onSelect: (i: number) => void }) {
  return (
    <ol className="m-0 mt-8 list-none space-y-1 p-0">
      {HANDOFF_STEPS.map((s, i) => {
        const c = stepColors(i, step);
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`flex w-full gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5 ${FOCUS_RING}`}
            >
              <span className={`pt-0.5 font-mono text-sm font-semibold ${c.num}`}>{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className={`block text-[17px] font-semibold leading-snug tracking-[-0.01em] ${c.title}`}>{s.title}</span>
                {i === step && <span className="ho-in mt-1.5 block text-[15px] leading-[1.55] text-[#B4BEC6]">{s.body}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="mt-6 h-0.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${((step + 1) / STEP_COUNT) * 100}%`, backgroundImage: 'linear-gradient(90deg, #83B8F8, #FDBA8C)' }}
      />
    </div>
  );
}

export default function HandOffStage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [reducedStep, setReducedStep] = useState(STEP_COUNT - 1);
  const override = useRef<StepOverride | null>(null);

  useEffect(() => {
    let raf = 0;
    function apply() {
      const scene = sceneRef.current;
      // The pinned scene is display:none on phone and with reduced motion: nothing to scrub.
      if (!scene || scene.offsetHeight === 0) return;
      const rect = scene.getBoundingClientRect();
      const scrollStep = stepFromProgress(sectionProgress(rect.top, rect.height, window.innerHeight));
      const next = resolveStep(scrollStep, window.scrollY, override.current);
      override.current = next.override;
      setStep((current) => (current === next.step ? current : next.step));
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const choose = (i: number) => {
    override.current = { step: i, scrollY: window.scrollY };
    setStep(i);
  };

  return (
    <>
      {/* Desktop: pinned, scroll-scrubbed */}
      <div ref={sceneRef} className="relative hidden md:motion-safe:block" style={{ height: '300vh' }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[400px_1fr] items-center gap-16 px-10 lg:gap-24">
            <div>
              <HandOffIntro headingId="ho-heading-pinned" />
              <StepList step={step} onSelect={choose} />
              <Progress step={step} />
            </div>
            <div className="mx-auto w-full max-w-[560px]">
              <HandOffWindow step={step} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop with reduced motion: no pinning, no scrubbing */}
      <div className="mx-auto hidden w-full max-w-[1200px] grid-cols-[400px_1fr] items-start gap-16 px-10 py-24 md:motion-reduce:grid lg:gap-24">
        <div>
          <HandOffIntro headingId="ho-heading-static" />
          <StepList step={reducedStep} onSelect={setReducedStep} />
          <Progress step={reducedStep} />
        </div>
        <div className="mx-auto w-full max-w-[560px]">
          <HandOffWindow step={reducedStep} />
        </div>
      </div>
    </>
  );
}
