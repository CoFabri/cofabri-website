'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Squares2X2Icon, ArrowTrendingUpIcon, BookOpenIcon, LifebuoyIcon, UserGroupIcon,
  Bars3Icon, XMarkIcon, SunIcon, MoonIcon, ComputerDesktopIcon, WindowIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatusIndicator from './StatusIndicator';

const navigation = [
  { name: 'Apps', href: '/apps', icon: Squares2X2Icon },
  { name: 'About', href: '/about', icon: UserGroupIcon },
  { name: 'Roadmap', href: '/roadmaps', icon: ArrowTrendingUpIcon },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpenIcon },
  { name: 'Support', href: '/support', icon: LifebuoyIcon },
];

// Support is promoted to a bottom action button inside the mobile sheet, so
// it's excluded here to avoid listing it twice.
const mobileNavigation = navigation.filter((item) => item.name !== 'Support');

const THEME_CYCLE = ['light', 'dark', 'system'] as const;
const THEME_ICONS = { light: SunIcon, dark: MoonIcon, system: ComputerDesktopIcon } as const;
const THEME_ROW_OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'Auto', icon: ComputerDesktopIcon },
] as const;

function useMountedTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = THEME_CYCLE.includes(theme as (typeof THEME_CYCLE)[number])
    ? (theme as (typeof THEME_CYCLE)[number])
    : 'system';
  return { current, setTheme };
}

function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const theme = useMountedTheme();

  if (variant === 'row') {
    if (!theme) return <div className="h-14 w-full rounded-[11px] border border-border" />;
    return (
      <div className="flex h-14 w-full items-center justify-between rounded-[11px] border border-border px-4">
        <span className="text-[14px] font-semibold text-foreground">Theme</span>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {THEME_ROW_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-label={`Theme: ${label}`}
              aria-pressed={theme.current === value}
              onClick={() => theme.setTheme(value)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                theme.current === value
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!theme) return <div className="h-9 w-9" />;
  const ActiveIcon = THEME_ICONS[theme.current];

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme.current) + 1) % THEME_CYCLE.length];
    theme.setTheme(next);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Theme: ${theme.current}. Click to change.`}
          onClick={cycleTheme}
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="capitalize">
        Theme: {theme.current}
      </TooltipContent>
    </Tooltip>
  );
}

const Navbar = ({ logo }: { logo: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <TooltipProvider delayDuration={200}>
      <nav className="max-w-[1200px] mx-auto px-6 sm:px-10 h-[68px] flex items-center justify-between gap-6">
        <div className="flex items-center flex-shrink-0">{logo}</div>

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild size="icon" aria-label="Explore apps">
                <Link href="/apps">
                  <WindowIcon className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Explore Apps</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <StatusIndicator />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Bars3Icon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="cover" showCloseButton={false} className="lg:hidden">
              <SheetTitle className="sr-only">Menu</SheetTitle>

              {/* Pixel-matches the nav row above (max-w-[1200px] mx-auto,
                  h-[68px], same px-6/sm:px-10 padding, same logo) so it never
                  visibly jumps position/size when the cover opens. `w-full`
                  is load-bearing here (the header's <nav> doesn't need it —
                  it's a block element that already fills its container, so
                  `mx-auto` is a no-op there — but this row is a flex child
                  of SheetContent's `flex flex-col`, where an item with
                  auto cross-axis margins shrinks to its content width and
                  centers itself instead of stretching, which threw the logo
                  out of alignment). */}
              <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 h-[68px] flex shrink-0 items-center justify-between">
                <div className="flex items-center flex-shrink-0" onClick={() => setOpen(false)}>{logo}</div>
                <SheetClose asChild>
                  <button
                    aria-label="Close menu"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </SheetClose>
              </div>

              <div
                data-state={open ? 'open' : 'closed'}
                className="flex flex-1 flex-col px-5 pb-9 ease-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:duration-150 data-[state=open]:duration-200"
              >
              <nav className="mt-7 flex flex-col" aria-label="Primary">
                {mobileNavigation.map((item, i) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-baseline gap-3.5 py-3.5 text-foreground ${
                      i < mobileNavigation.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <span className="w-5 shrink-0 font-mono text-[10px] tracking-[.14em] text-accent-solid">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[26px] font-semibold leading-[1.05] tracking-[-0.035em]">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2.5 pt-6">
                <StatusIndicator variant="row" onNavigate={() => setOpen(false)} />
                <ThemeToggle variant="row" />

                <div className="flex items-center gap-2.5">
                  <Link href="/support" onClick={() => setOpen(false)} className="flex-1">
                    <Button variant="outline" className="h-11 w-full gap-1.5 rounded-[11px] text-[14px] font-semibold">
                      <LifebuoyIcon className="h-4 w-4" />
                      Support
                    </Button>
                  </Link>
                  <Link href="/contact" onClick={() => setOpen(false)} className="flex-1">
                    <Button variant="outline" className="h-11 w-full gap-1.5 rounded-[11px] text-[14px] font-semibold">
                      <EnvelopeIcon className="h-4 w-4" />
                      Contact
                    </Button>
                  </Link>
                </div>

                <Link href="/apps" onClick={() => setOpen(false)}>
                  <Button className="h-[54px] w-full rounded-[11px] text-[15px] font-semibold">
                    Explore apps
                  </Button>
                </Link>
              </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      </TooltipProvider>
    </header>
  );
};

export default Navbar;
