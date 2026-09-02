'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './Logo';
import TouchLink from './TouchLink';

const Footer = () => {
  const navigation = {
    main: [
      { name: 'Apps', href: '/apps' },
      { name: 'Roadmaps', href: '/roadmaps' },
      { name: 'Knowledge Base', href: '/knowledge-base' },
      { name: 'Legal', href: '/legal' },
      { name: 'Support', href: '/support' },
    ],
    social: [
      {
        name: 'X',
        href: 'https://x.com/noah_maven_x',
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
      },
      {
        name: 'Instagram',
        href: 'https://instagram.com/meetayden',
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        ),
      },
      {
        name: 'LinkedIn',
        href: 'https://linkedin.com/company/maven-x-co',
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path
              fillRule="evenodd"
              d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
    ],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center items-center space-x-1" aria-label="Footer">
          {navigation.main.map((item, index) => (
            <React.Fragment key={item.name}>
              <div className="px-1 py-1">
                <TouchLink
                  href={item.href}
                  variant="footer"
                  size="medium"
                  className="text-gray-600 hover:text-indigo-600"
                >
                  {item.name}
                </TouchLink>
              </div>
              {index < navigation.main.length - 1 && (
                <div className="text-gray-300 text-sm">•</div>
              )}
            </React.Fragment>
          ))}
        </nav>
        <div className="mt-6 flex justify-center touch-spacing-horizontal">
          {navigation.social.map((item) => (
            <TouchLink
              key={item.name}
              href={item.href}
              variant="icon"
              size="medium"
              external
              className="text-gray-600 hover:text-indigo-600"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </TouchLink>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <div className="touch-target-min haptic-feedback">
            <Logo size="footer" />
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-600 whitespace-nowrap">
          <span>&copy; 2025 CoFabri by </span>
          <Link href='https://mavenx.co' className="font-semibold hover:text-blue-600" target="_blank" rel="noopener noreferrer">
            Maven X LLC
          </Link>
          <span>. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 