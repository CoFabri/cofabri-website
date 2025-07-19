'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { App } from '@/lib/airtable';

interface AppsScrollCelebrationProps {
  apps: App[];
}

export default function AppsScrollCelebration({ apps }: AppsScrollCelebrationProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  // Check if there are any apps launching today
  const hasLaunchingApps = () => {
    const today = new Date();
    return apps.some(app => {
      if (!app.launchDate) return false;
      const launchDate = new Date(app.launchDate);
      return (
        launchDate.getDate() === today.getDate() &&
        launchDate.getMonth() === today.getMonth() &&
        launchDate.getFullYear() === today.getFullYear()
      );
    });
  };

  useEffect(() => {
    // Only set up the observer if there are apps launching today
    if (!hasLaunchingApps()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered.current) {
            hasTriggered.current = true;
            
            // Fire confetti from both sides
            confetti({
              particleCount: 30,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
            });

            confetti({
              particleCount: 30,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
            });
          }
        });
      },
      { 
        threshold: 0.2, // Require 20% of the section to be visible
        rootMargin: '-20% 0px -20% 0px' // Add margins to prevent triggering too early
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [apps.length]); // Use apps.length instead of apps array to prevent infinite re-renders

  return (
    <div 
      ref={sectionRef} 
      className="absolute top-0 left-0 right-0 h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
} 