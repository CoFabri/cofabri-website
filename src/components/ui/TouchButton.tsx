'use client';

import React from 'react';
import { useButtonTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  feedback?: 'subtle' | 'normal' | 'strong';
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  feedback = 'normal',
  hapticType = 'light',
  loading = false,
  disabled = false,
  children,
  className,
  onClick,
  ...props
}) => {
  const { buttonProps } = useButtonTouchFeedback({
    hapticType: hapticType,
  });

  const baseClasses = 'touch-button touch-focus select-none';
  
  const variantClasses = {
    primary: 'touch-button-primary',
    secondary: 'touch-button-secondary',
    ghost: 'touch-button-ghost',
    icon: 'touch-button-icon',
    success: 'touch-success',
    error: 'touch-error',
    warning: 'touch-warning',
  };

  const sizeClasses = {
    small: 'min-h-[36px] min-w-[36px] px-3 py-1.5 text-sm',
    medium: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base',
    large: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg',
    'extra-large': 'min-h-[56px] min-w-[56px] px-8 py-4 text-xl',
  };

  const feedbackClasses = {
    subtle: 'touch-feedback-subtle',
    normal: 'touch-feedback',
    strong: 'touch-feedback-strong',
  };

  const stateClasses = {
    disabled: disabled ? 'touch-disabled' : '',
    loading: loading ? 'touch-loading' : '',
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button
      {...buttonProps}
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        feedbackClasses[feedback],
        stateClasses.disabled,
        stateClasses.loading,
        'haptic-feedback',
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default TouchButton;
