import { HANDOFF_STEPS } from '@/lib/services/handoff';
import HandOffIntro from './HandOffIntro';
import HandOffWindow from './HandOffWindow';

/**
 * The version of the hand-off scene for phones, tablets and a folded Surface Duo
 * (everything under 1024px): the four steps stacked, each with its own compact
 * window, side by side with its text from 768px. Nothing here changes after load,
 * so it is a server component and costs no client JavaScript.
 */
export default function HandOffStack() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 md:py-20 lg:hidden">
      <HandOffIntro headingId="ho-heading-phone" />
      <ol className="m-0 mt-10 list-none space-y-12 p-0">
        {HANDOFF_STEPS.map((s, i) => (
          <li key={s.title} className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-10">
            <div className="flex gap-4">
              <span className="pt-0.5 font-mono text-sm font-semibold text-[#83B8F8]">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="m-0 p-0 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-white">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-[#B4BEC6]">{s.body}</p>
              </div>
            </div>
            <div className="mt-5 md:mt-0">
              <HandOffWindow step={i} compact />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
