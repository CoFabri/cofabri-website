'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'inverted';
  href?: string;
  size?: 'nav' | 'footer' | 'hero';
}

const Logo = ({ className = '', variant = 'default', href = '/', size = 'nav' }: LogoProps) => {
  const Component = href ? Link : 'div';
  
  const sizeClasses = {
    nav: 'w-36',      // Slightly bigger for nav
    footer: 'w-28',   // A bit smaller for footer
    hero: 'h-64',     // Keep the perfect hero size
  };

  return (
    <Component href={href} className={`inline-block ${className}`}>
      {variant === 'default' ? (
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
      )}
    </Component>
  );
};

export default Logo; 