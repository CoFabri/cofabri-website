'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutGrid, TrendingUp, BookOpen, LifeBuoy,
  Menu, Sun, Moon, Monitor, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Logo from './Logo';
import StatusIndicator from './StatusIndicator';

const navigation = [
  { name: 'Apps', href: '/apps', icon: LayoutGrid },
  { name: 'Roadmap', href: '/roadmaps', icon: TrendingUp },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Support', href: '/support', icon: LifeBuoy },
];

const THEME_CYCLE = ['light', 'dark', 'system'] as const;
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const current = THEME_CYCLE.includes(theme as (typeof THEME_CYCLE)[number])
    ? (theme as (typeof THEME_CYCLE)[number])
    : 'system';
  const ActiveIcon = THEME_ICONS[current];

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length];
    setTheme(next);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Theme: ${current}. Click to change.`}
      onClick={cycleTheme}
    >
      <ActiveIcon className="h-4 w-4" />
    </Button>
  );
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <nav className="max-w-[1200px] mx-auto px-6 sm:px-10 h-[68px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center flex-shrink-0">
          <Logo size="nav" noLink />
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[15px] font-medium leading-none transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-[15px] w-[15px] flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <StatusIndicator />
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/apps">
              Explore Apps
              <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <StatusIndicator />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-1 mt-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors ${
                        isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
