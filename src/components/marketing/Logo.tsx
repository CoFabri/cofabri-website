'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'inverted';
  href?: string;
  size?: 'nav' | 'footer' | 'hero';
  noLink?: boolean;
}

const Logo = ({ className = '', variant = 'default', href = '/', size = 'nav', noLink = false }: LogoProps) => {
  const sizeClasses = {
    nav: 'w-36',      // Slightly bigger for nav
    footer: 'w-28',   // A bit smaller for footer
    hero: 'h-64',     // Keep the perfect hero size
  };

  const image = (
    variant === 'default' ? (
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