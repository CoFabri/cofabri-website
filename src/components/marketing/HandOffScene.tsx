import { HANDOFF_COPY } from '@/lib/services/handoff';
import HandOffStack from './HandOffStack';
import HandOffStage from './HandOffStage';

/**
 * The hand-off scene on /services (id how-services-work), on the ink surface:
 * the interactive desktop versions (HandOffStage, client) and the static phone
 * version (HandOffStack, server).
 */
export default function HandOffScene() {
  return (
    <section
      id="how-services-work"
      aria-label={HANDOFF_COPY.heading}
      className="border-t border-[var(--ink-line)] bg-[var(--ink-bg)] text-[#B4BEC6]"
    >
      <HandOffStage />
      <HandOffStack />
    </section>
  );
}
