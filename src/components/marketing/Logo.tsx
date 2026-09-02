'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  /** 'auto' (default) follows the active theme; 'default'/'inverted' pin a mark regardless of theme. */
  variant?: 'auto' | 'default' | 'inverted';
  href?: string;
  size?: 'nav' | 'footer' | 'hero';
  noLink?: boolean;
}

const Logo = ({ className = '', variant = 'auto', href = '/', size = 'nav', noLink = false }: LogoProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  // Render the light mark until mounted so SSR/first paint never mismatches the client.
  const resolvedVariant =
    variant === 'auto' ? (mounted && resolvedTheme === 'dark' ? 'inverted' : 'default') : variant;

  const sizeClasses = {
    nav: 'w-36',      // Slightly bigger for nav
    footer: 'w-28',   // A bit smaller for footer
    hero: 'h-64',     // Keep the perfect hero size
  };

  const image = (
    resolvedVariant === 'default' ? (
      <Image
        src="/images/logo.svg"
        alt="CoFabri Logo"
        width={150}
        height={40}
        className={`${sizeClasses[size]} ${size === 'hero' ? 'w-auto' : ''}`}
        priority
      />
    ) : (
      <Image
        src="/images/logo-inverted.svg"
        alt="CoFabri Logo"
        width={150}
        height={40}
        className={`${sizeClasses[size]} ${size === 'hero' ? 'w-auto' : ''}`}
        priority
      />
    )
  );

  if (noLink) {
    return (
      <div className={`inline-block ${className}`}>
        {image}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className={`inline-block ${className}`}>
        {image}
      </Link>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      {image}
    </div>
  );
};

export default Logo; 