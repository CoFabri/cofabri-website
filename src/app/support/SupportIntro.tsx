'use client';

import { useSearchParams } from 'next/navigation';
import { parseSupportParams } from '@/lib/support/params';

/** Side-panel intro; patients get no screenshot upload, so the screenshot hint is staff-only. */
export default function SupportIntro() {
  const params = parseSupportParams(useSearchParams());
  const isPatient = params.audience === 'patient';
  return (
    <p className="mt-4 text-base leading-[1.6] text-ink-muted">
      {isPatient
        ? 'Include what you expected and what happened instead.'
        : 'Include the app, what you expected, and what happened instead. Screenshots help.'}
    </p>
  );
}
