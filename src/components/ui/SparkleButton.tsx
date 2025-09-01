'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface SparkleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

const SparkleButton: React.FC<SparkleButtonProps> = ({ 
  children, 
  className = '', 
  onClick, 
  href, 
  disabled = false,
  type = 'button'
}) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const createSparkle = () => {
    const newSparkle = {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5
    };
    setSparkles(prev => [...prev, newSparkle]);
    
    // Remove sparkle after animation
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 1000);
  };

  const handleClick = () => {
    createSparkle();
    if (onClick) onClick();
  };

  const buttonContent = (
    <div className="relative inline-flex items-center">
      {children}
      <SparklesIcon className="ml-2 w-4 h-4 animate-pulse" />
      
      {/* Sparkle particles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`
          }}
        >
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
        </div>
      ))}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
};

export default SparkleButton;
