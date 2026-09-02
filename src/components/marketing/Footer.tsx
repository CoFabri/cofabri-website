import React from 'react';
import Link from 'next/link';
import { LayoutGrid, TrendingUp, Sparkles, BookOpen, ScrollText, LifeBuoy, Handshake } from 'lucide-react';
import CofabriLogo from './CofabriLogo';

const navigation = [
  { name: 'Apps', href: '/apps', icon: LayoutGrid },
  { name: 'Partners', href: '/partners', icon: Handshake },
  { name: 'Roadmap', href: '/roadmaps', icon: TrendingUp },
  { name: 'Changelog', href: '/changelog', icon: Sparkles },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Legal', href: '/legal', icon: ScrollText },
  { name: 'Support', href: '/support', icon: LifeBuoy },
];

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
          <CofabriLogo variant="mark" tone="dark" height={40} href="/" />

          <ul className="flex items-center gap-6 flex-wrap justify-center text-sm">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-[#9BA7B0] hover:text-white transition-colors duration-200"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex-shrink-0 text-xs text-[#6B7880]">
            &copy; {new Date().getFullYear()} CoFabri. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
