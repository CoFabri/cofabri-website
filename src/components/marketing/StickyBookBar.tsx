'use client';

import { useEffect, useState } from 'react';
import FamilyMark from './FamilyMark';
import BookCallButton from './BookCallButton';
import { useSharedNotify } from './NotifyInline';

interface StickyBookBarProps {
  service: { id: string; name: string };
  comingSoon: boolean;
  /** id of the hero CTA; the bar appears once it scrolls out of view. */
  watchId: string;
  /** id of the hero's notify field, scrolled to by Notify Me. */
  notifyId?: string;
}

/** Phone-only bar pinned to the bottom of a service page, once the hero CTA has scrolled away. */
export default function StickyBookBar({ service, comingSoon, watchId, notifyId }: StickyBookBarProps) {
  const [visible, setVisible] = useState(false);
  const notify = useSharedNotify();

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  const onNotify = () => {
    const target = notifyId ? document.getElementById(notifyId) : null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    notify?.openField(notifyId ?? '');
  };

  return (
    <div
      // While hidden the bar is `invisible`, which also takes its buttons out of the tab order and the accessibility tree.
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur transition-[transform,visibility] duration-200 sm:hidden ${
        visible ? 'visible translate-y-0' : 'invisible translate-y-full'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <FamilyMark appId={service.id} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{service.name}</div>
          <div className="truncate text-xs text-muted-foreground">{comingSoon ? 'Coming soon' : 'Talk to our team'}</div>
        </div>
        {comingSoon ? (
          <button
            type="button"
            onClick={onNotify}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40"
          >
            Notify Me
          </button>
        ) : (
          <BookCallButton service={service} size="compact" />
        )}
      </div>
    </div>
  );
}
