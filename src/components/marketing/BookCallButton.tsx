'use client';

import { useState } from 'react';
import BookCallDialog from './BookCallDialog';

interface BookCallButtonProps {
  service: { id: string; name: string };
  /** `compact` is the smaller sticky-bar size. */
  size?: 'default' | 'compact';
  /** `solid` is the brand-filled primary button; `outline` is the secondary one. */
  variant?: 'solid' | 'outline';
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function BookCallButton({ service, size = 'default', variant = 'solid', id, className = '', children = 'Book a Call' }: BookCallButtonProps) {
  const [open, setOpen] = useState(false);
  const sizing = size === 'compact' ? 'h-10 px-4 text-sm' : 'h-12 px-6 text-[15px]';
  const look =
    variant === 'outline'
      ? 'border border-border-strong bg-transparent text-foreground hover:bg-muted'
      : 'bg-brand text-on-brand hover:bg-brand-hover';
  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40 ${look} ${sizing} ${className}`}
      >
        {children}
      </button>
      <BookCallDialog open={open} onOpenChange={setOpen} service={service} />
    </>
  );
}
