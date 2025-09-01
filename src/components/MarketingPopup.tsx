'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketingPopupProps {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  position?: 'Center' | 'Bottom Right' | 'Bottom Left';
  delay?: number;
  isEnabled: boolean;
}

const DISMISSAL_KEY = 'marketing_popup_dismissed';
const DISMISSAL_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default function MarketingPopup({
  title,
  content,
  buttonText,
  buttonLink,
  backgroundColor = '#ffffff',
  textColor = '#000000',
  buttonColor = '#007bff',
  position = 'Center',
  delay = 3000,
  isEnabled = true,
}: MarketingPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Check if popup was dismissed
    const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
    if (dismissedAt) {
      const dismissalTime = parseInt(dismissedAt);
      const now = Date.now();
      if (now - dismissalTime < DISMISSAL_DURATION) {
        return; // Don't show if within 12 hours of dismissal
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, isEnabled]);

  const handleClose = () => {
    setIsVisible(false);
    // Store dismissal time in localStorage
    localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
  };

  const positionClasses = {
    'Center': 'fixed inset-0 flex items-center justify-center px-4 sm:px-6',
    'Bottom Right': 'fixed bottom-6 right-6',
    'Bottom Left': 'fixed bottom-6 left-6',
  };

  const popupVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: position === 'Center' ? 0 : 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: position === 'Center' ? 0 : 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupVariants}
            className={`z-50 ${positionClasses[position]}`}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-white/10"
              style={{ backgroundColor, color: textColor }}
            >
              <div className="p-8">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: textColor }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold tracking-tight mb-4">{title}</h2>
                <p className="text-lg mb-8 opacity-90 leading-relaxed">{content}</p>
                <a
                  href={buttonLink}
                  className="block w-full text-center py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[0.98] active:scale-[0.97]"
                  style={{ backgroundColor: buttonColor }}
                >
                  {buttonText}
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 