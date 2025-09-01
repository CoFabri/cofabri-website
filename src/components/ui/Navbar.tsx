'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import StatusIndicator from './StatusIndicator';
import TouchLink from './TouchLink';
import TouchButton from './TouchButton';
import MobileNavigation from './MobileNavigation';
import { useMobileMenuSwipe } from '@/hooks/useSwipeGestures';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Apps', href: '/apps' },
  { name: 'Roadmaps', href: '/roadmaps' },
  { name: 'Knowledge Base', href: '/knowledge-base' },
  { name: 'Support', href: '/support' },
  { name: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const navbarRef = useRef<HTMLElement>(null);

  // Use swipe gestures for mobile menu on the entire navbar
  useMobileMenuSwipe(navbarRef, isOpen, () => setIsOpen(true), () => setIsOpen(false));

  // Function to check if a nav item is active
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === href;
    if (href.includes('#')) {
      // For anchor links, check if we're on the homepage
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Function to handle anchor links
  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.includes('#')) {
      e.preventDefault();
      const id = href.split('#')[1];
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8;
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > heroHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  if (!mounted) return null;

  return (
    <header
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-sm shadow-sm ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center touch-target-min haptic-feedback">
          <Logo size="nav" noLink />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center touch-spacing-horizontal">
          {navigation.map((item) => (
            <TouchLink
              key={item.name}
              href={item.href}
              variant="nav"
              onClick={(e) => handleNavClick(item.href, e)}
              className={
                isActive(item.href)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }
            >
              {item.name}
            </TouchLink>
          ))}
        </div>

        {/* CTA Button and Status Indicator */}
        <div className="hidden lg:flex items-center ml-8 touch-spacing-horizontal">
          <StatusIndicator />
          <TouchLink
            href="/apps"
            variant="primary"
            size="medium"
            className="ml-4"
          >
            Explore Apps
          </TouchLink>
        </div>

                {/* Mobile Status Indicator and Menu Button */}
        <div className="flex items-center lg:hidden touch-spacing-horizontal-compact">
          <StatusIndicator />
          <TouchButton
            variant="icon"
            size="medium"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </TouchButton>
        </div>
      </nav>

      {/* Mobile Navigation with Swipe Support */}
      <MobileNavigation
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        navigation={navigation}
      />
    </header>
  );
};

export default Navbar; 