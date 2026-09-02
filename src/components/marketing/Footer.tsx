'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, TrendingUp, BookOpen, ScrollText, LifeBuoy } from 'lucide-react';
import Logo from './Logo';

const navigation = {
  main: [
    { name: 'Apps', href: '/apps', icon: LayoutGrid },
    { name: 'Roadmaps', href: '/roadmaps', icon: TrendingUp },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
    { name: 'Legal', href: '/legal', icon: ScrollText },
    { name: 'Support', href: '/support', icon: LifeBuoy },
  ],
  social: [
    {
      name: 'X',
      href: 'https://x.com/noah_maven_x',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/meetayden',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/maven-x-co',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
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

const Footer = () => {
  return (
    <footer className="bg-[#232E36] text-white">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-16 md:py-[88px] flex flex-col md:flex-row items-center md:items-center justify-between gap-8 md:gap-16 text-center md:text-left">
        <div>
          <h2 className="m-0 text-3xl md:text-[40px] font-semibold leading-[1.1] tracking-[-0.03em]">
            Start with one app.
          </h2>
          <p className="mt-3.5 text-lg text-[#9BA7B0]">
            No demo call. No onboarding fee. Sign up and use it.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link
            href="/apps"
            className="rounded-[9px] bg-white px-[26px] py-3.5 text-[16px] font-semibold text-[#232E36] transition-transform duration-200 hover:-translate-y-px"
          >
            Explore Apps
          </Link>
          <Link
            href="/contact"
            className="rounded-[9px] border border-[#3D4A55] px-[26px] py-3.5 text-[16px] font-semibold text-white transition-colors duration-200 hover:border-[#8494A0]"
          >
            Contact Us
          </Link>
        </div>
      </div>

      <div className="border-t border-[#35424C]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-9 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Logo size="footer" variant="inverted" noLink />
          </Link>

          <ul className="flex items-center gap-6 flex-wrap justify-center text-sm">
            {navigation.main.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-[#9BA7B0] hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 flex-shrink-0">
            {navigation.social.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#3D4A55] text-[#9BA7B0] hover:text-white hover:border-[#8494A0] transition-colors"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-[#35424C]">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-4 text-center md:text-left text-xs text-[#6B7880]">
            &copy; {new Date().getFullYear()} CoFabri by{' '}
            <Link href="https://mavenx.co" className="font-medium text-[#9BA7B0] hover:text-white underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              Maven X LLC
            </Link>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
