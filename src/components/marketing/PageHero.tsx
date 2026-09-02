import React from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export default function PageHero({ eyebrow, title, subtitle, right, className = '' }: PageHeroProps) {
  return (
    <div className={`flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-[640px]">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">{eyebrow}</div>
        <h1 className="m-0 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[56px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-[520px] text-lg leading-[1.6] text-ink-muted sm:text-[19px]">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
