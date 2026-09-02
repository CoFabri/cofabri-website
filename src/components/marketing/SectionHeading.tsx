import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  extraContent?: React.ReactNode;
}

export default function SectionHeading({ eyebrow, title, subtitle, className = '', extraContent }: SectionHeadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="max-w-4xl mx-auto text-center px-4">
        {eyebrow && (
          <span className="font-mono text-xs uppercase tracking-wide text-primary font-semibold">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {extraContent}
      </div>
    </div>
  );
} 