'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function AppsPageCelebration() {
  useEffect(() => {
    // Fire confetti from both sides
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
    });

    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
    });
  }, []); // Empty dependency array means this runs once on mount

  return null;
} 