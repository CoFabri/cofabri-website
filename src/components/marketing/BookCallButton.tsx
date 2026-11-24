'use client';

import { useState } from 'react';
import BookCallDialog from './BookCallDialog';

interface BookCallButtonProps {
  service: { id: string; name: string };
  /** `solid` is the brand-filled primary button; `compact` is the smaller sticky-bar size. */
  size?: 'default' | 'compact';
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function BookCallButton({ service, size = 'default', id, className = '', children = 'Book a Call' }: BookCallButtonProps) {
  const [open, setOpen] = useState(false);
  const sizing = size === 'compact' ? 'h-10 px-4 text-sm' : 'h-12 px-6 text-[15px]';
  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex items-center justify-center rounded-lg bg-brand font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 ${sizing} ${className}`}
      >
        {children}
      </button>
      <BookCallDialog open={open} onOpenChange={setOpen} service={service} />
    </>
  );
}
