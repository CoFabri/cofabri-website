'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigationTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

interface TouchLinkProps {
  href: string;
  variant?: 'nav' | 'footer' | 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  feedback?: 'subtle' | 'normal' | 'strong';
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  external?: boolean;
  target?: string;
  rel?: string;
}

const TouchLink: React.FC<TouchLinkProps> = ({
  href,
  variant = 'nav',
  size = 'medium',
  feedback = 'normal',
  hapticType = 'light',
  children,
  className,
  onClick,
  external = false,
  target,
  rel,
  ...props
}) => {
  const { touchProps } = useNavigationTouchFeedback();

  const baseClasses = 'touch-link touch-focus select-none';
  
  const variantClasses = {
    nav: 'touch-link-nav',
    footer: 'touch-link-footer',
    primary: 'touch-button-primary',
    secondary: 'touch-button-secondary',
    ghost: 'touch-button-ghost',
  };

  const sizeClasses = {
    small: 'min-h-[36px] min-w-[36px] px-3 py-1.5 text-sm',
    medium: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base',
    large: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg',
  };

  const feedbackClasses = {
    subtle: 'touch-feedback-subtle',
    normal: 'touch-feedback',
    strong: 'touch-feedback-strong',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  const linkProps = {
    href,
    onClick: handleClick,
    className: cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      feedbackClasses[feedback],
      'haptic-feedback',
      className
    ),
    ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
    ...(target && { target }),
    ...(rel && { rel }),
    ...touchProps,
    ...props,
  };

  return <Link {...linkProps}>{children}</Link>;
};

export default TouchLink;
