'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { App } from '@/lib/airtable';

interface AppsCelebrationProps {
  apps: App[];
}

export default function AppsCelebration({ apps }: AppsCelebrationProps) {
  useEffect(() => {
    // Check if there are any apps launching today
    const today = new Date();
    const launchingToday = apps.filter(app => {
      if (!app.launchDate) return false;
      const launchDate = new Date(app.launchDate);
      return (
        launchDate.getDate() === today.getDate() &&
        launchDate.getMonth() === today.getMonth() &&
        launchDate.getFullYear() === today.getFullYear()
      );
    });

    // Only show confetti if there are apps launching today
    if (launchingToday.length === 0) return;

    const fireConfetti = () => {
      const count = launchingToday.length > 0 ? 50 : 30;
      
      // Launch confetti from both sides
      confetti({
        particleCount: count,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
      });

      confetti({
        particleCount: count,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
      });
    };

    // Fire initial confetti
    fireConfetti();

    // Continue with more confetti for a duration
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      fireConfetti();
    }, 400);

    return () => clearInterval(interval);
  }, [apps.length]); // Use apps.length instead of apps array to prevent infinite re-renders

  return null;
} 