'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import TouchLink from './TouchLink';
import TouchButton from './TouchButton';
import { useMobileMenuSwipe } from '@/hooks/useSwipeGestures';

interface MobileNavigationProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  navigation: Array<{ name: string; href: string }>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onOpen,
  onClose,
  navigation,
}) => {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Use swipe gestures for mobile menu
  useMobileMenuSwipe(menuRef, isOpen, onOpen, onClose);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
    } else {
      document.body.style.overflow = 'unset';
      // Delay hiding to allow animation to complete
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Function to check if a nav item is active
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  // Function to handle navigation click
  const handleNavClick = (href: string) => {
    if (href.includes('#')) {
      const id = href.split('#')[1];
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Mobile Menu */}
          <motion.div
            ref={menuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              mass: 0.8 
            }}
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
              <TouchButton
                variant="icon"
                size="medium"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                <XMarkIcon className="h-6 w-6" />
              </TouchButton>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-2">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.3,
                      ease: 'easeOut'
                    }}
                  >
                    <TouchLink
                      href={item.href}
                      variant="nav"
                      size="large"
                      onClick={() => handleNavClick(item.href)}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </TouchLink>
                  </motion.div>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <TouchLink
                href="/apps"
                variant="primary"
                size="large"
                className="w-full justify-center"
                onClick={onClose}
              >
                Explore Apps
              </TouchLink>
            </div>

            {/* Swipe Indicator */}
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-30">
              <div className="w-1 h-16 bg-gray-300 rounded-full">
                <div className="w-1 h-8 bg-blue-500 rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigation;
