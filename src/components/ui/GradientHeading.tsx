import React from 'react';
import AnimatedGradient from './AnimatedGradient';

interface GradientHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  extraContent?: React.ReactNode;
}

export default function GradientHeading({ title, subtitle, className = '', extraContent }: GradientHeadingProps) {
  return (
    <div className={`relative min-h-[320px] flex flex-col items-center justify-center pt-32 pb-24 ${className}`}>
      <AnimatedGradient />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        <h2 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {extraContent}
      </div>
    </div>
  );
} 