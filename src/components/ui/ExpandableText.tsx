'use client';

import { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({ text, maxLength = 150, className = '' }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded ? text : text.slice(0, maxLength) + (shouldTruncate ? '...' : '');

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      <p className="mb-2">
        {displayText}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
      >
        {isExpanded ? 'Read Less' : 'Read More'}
      </button>
    </div>
  );
} 