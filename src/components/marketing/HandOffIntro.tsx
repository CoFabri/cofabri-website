import { HANDOFF_COPY } from '@/lib/services/handoff';
import InkEyebrow from './InkEyebrow';

/** Eyebrow, heading and body for the hand-off scene. Static, so it renders on the server. */
export default function HandOffIntro({ headingId }: { headingId: string }) {
  return (
    <div>
      <InkEyebrow>{HANDOFF_COPY.eyebrow}</InkEyebrow>
      <h2 id={headingId} className="m-0 mt-5 p-0 text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] text-[#F1F4F6] sm:text-[38px]">
        {HANDOFF_COPY.heading}
      </h2>
      <p className="mt-4 text-base leading-[1.6] text-[#B4BEC6]">{HANDOFF_COPY.body}</p>
    </div>
  );
}
