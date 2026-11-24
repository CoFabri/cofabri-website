import { HANDOFF_STEPS } from '@/lib/services/handoff';
import HandOffIntro from './HandOffIntro';
import HandOffWindow from './HandOffWindow';

/**
 * The phone version of the hand-off scene: the four steps stacked, each with its
 * own compact window. Nothing here changes after load, so it is a server
 * component and costs no client JavaScript.
 */
export default function HandOffStack() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:hidden">
      <HandOffIntro headingId="ho-heading-phone" />
      <ol className="m-0 mt-10 list-none space-y-12 p-0">
        {HANDOFF_STEPS.map((s, i) => (
          <li key={s.title}>
            <div className="flex gap-4">
              <span className="pt-0.5 font-mono text-sm font-semibold text-[#83B8F8]">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="m-0 p-0 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-white">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-[#B4BEC6]">{s.body}</p>
              </div>
            </div>
            <div className="mt-5">
              <HandOffWindow step={i} compact />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
