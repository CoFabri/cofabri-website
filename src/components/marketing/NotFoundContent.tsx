'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { App, KnowledgeBaseArticle } from '@/lib/api-client';
import { markPalette, statusDotClasses } from '@/lib/app-display';
import {
  findClosestMatch,
  pickSuggestedArticles,
  searchSuggestions,
} from '@/lib/not-found-match';

export interface NotFoundIncident {
  // Names of the apps the open incident affects; empty for a platform-wide one.
  appNames: string[];
}

interface NotFoundContentProps {
  apps: App[];
  articles: KnowledgeBaseArticle[];
  // ids of apps with an open incident, shown as "Degraded" in the list.
  degradedAppIds: string[];
  incident: NotFoundIncident | null;
}

const MAX_LISTED_APPS = 4;
const rowHover = 'transition-colors duration-200 hover:bg-muted';

function AppMark({ app, size }: { app: App; size: 'sm' | 'md' }) {
  const box = size === 'md' ? 'h-11 w-11 text-lg' : 'h-9 w-9 text-[15px]';
  if (app.faviconUrl) {
    return (
      <span className={`relative block flex-shrink-0 overflow-hidden rounded-[10px] border border-border bg-secondary ${box}`}>
        <Image src={app.faviconUrl} alt="" fill className="object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
      </span>
    );
  }
  return (
    <span className={`flex flex-shrink-0 items-center justify-center rounded-[10px] font-semibold tracking-[-0.02em] ${box} ${markPalette(app.id)}`}>
      {app.name.charAt(0).toUpperCase()}
    </span>
  );
}

function articleMeta(article: KnowledgeBaseArticle): string {
  const source = article.applications[0]?.name ?? article.category;
  return `${source} · ${article.readTime} min read`;
}

function SectionHeader({ label, href, cta }: { label: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3.5">
      <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      {href && cta && (
        <Link href={href} className="hidden text-sm font-semibold text-primary hover:text-accent-hover sm:block">
          {cta} →
        </Link>
      )}
    </div>
  );
}

function ResultRow({ href, mark, eyebrow, title, meta, cta }: {
  href: string;
  mark: React.ReactNode;
  eyebrow: string;
  title: string;
  meta: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 rounded-[10px] border border-border bg-card px-4 py-3.5 text-foreground sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:px-[18px] sm:py-4 ${rowHover}`}
    >
      {mark}
      <span className="min-w-0">
        <span className="block font-mono text-[11px] uppercase tracking-[0.07em] text-ink-muted">{eyebrow}</span>
        <span className="mt-0.5 block text-base font-semibold tracking-[-0.015em] sm:text-[17px]">{title}</span>
        <span className="mt-0.5 hidden truncate text-sm text-ink-muted sm:block">{meta}</span>
        <span className="mt-1 block text-sm font-semibold text-primary sm:hidden">{cta} →</span>
      </span>
      <span className="hidden whitespace-nowrap text-[15px] font-semibold text-primary sm:block">{cta} →</span>
    </Link>
  );
}

export default function NotFoundContent({ apps, articles, degradedAppIds, incident }: NotFoundContentProps) {
  const pathname = usePathname() ?? '';
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search field, the same shortcut the field advertises.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const match = useMemo(() => findClosestMatch(pathname, apps, articles), [pathname, apps, articles]);
  const suggested = useMemo(
    () => pickSuggestedArticles(pathname, articles, match?.kind === 'article' ? match.article.slug : undefined),
    [pathname, articles, match]
  );
  const results = useMemo(() => searchSuggestions(query, apps, articles), [query, apps, articles]);
  const degraded = useMemo(() => new Set(degradedAppIds), [degradedAppIds]);
  const hasResults = results.apps.length + results.articles.length > 0;
  const isKbPath = pathname.startsWith('/knowledge-base/');

  const subline = isKbPath
    ? 'That article may have been renamed or merged into another one.'
    : pathname.startsWith('/apps/')
      ? 'The link may be mistyped, or the page may have moved.'
      : "It may have moved, or the link may be wrong. Here's where most people head next.";

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10 sm:py-[112px]">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
        <svg
          viewBox="-12 -12 124 124"
          aria-hidden="true"
          className="block h-24 w-24 lg:order-2 lg:mt-6 lg:h-[340px] lg:w-[340px] lg:justify-self-end"
        >
          <path
            d="M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            className="cf-nf-dash"
          />
          <g className="cf-nf-sway" style={{ transformOrigin: '50px 50px', transform: 'rotate(14deg)' }}>
            <path d="M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z" fill="#3B82F6" />
            <path d="M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z" fill="var(--surface)" transform="translate(15 15) scale(.7)" />
            <path d="M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z" fill="var(--ink-body)" transform="translate(32 32) scale(.36)" />
          </g>
        </svg>

        <div className="max-w-[640px] lg:order-1">
          <div className="font-mono text-xs tracking-[0.14em] text-ink-faint sm:text-[13px]">404 — NOT FOUND</div>
          <h1 className="m-0 mt-5 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground [text-wrap:balance] sm:mt-7 sm:text-[64px] sm:leading-[1.03]">
            This page doesn&apos;t exist.
          </h1>
          <p className="mt-4 max-w-[540px] text-[17px] leading-[1.6] text-ink-muted [text-wrap:pretty] sm:mt-[22px] sm:text-xl">
            We couldn&apos;t find{' '}
            <code className="break-all rounded-[5px] bg-secondary px-1.5 py-0.5 font-mono text-sm text-ink-body sm:px-[7px] sm:text-[17px]">
              {pathname || '/'}
            </code>
            . {subline}
          </p>

          {incident && (
            <div className="mt-4 flex items-start gap-2.5 text-[15px] leading-[1.5] text-ink-body sm:mt-[18px] sm:items-center">
              <span className="mt-[7px] block h-2 w-2 flex-none animate-[cf-nf-pulse_2.4s_ease-in-out_infinite] rounded-full bg-warning shadow-[0_0_0_4px_color-mix(in_srgb,var(--warning)_16%,transparent)] motion-reduce:animate-none sm:mt-0" />
              <span>
                {incident.appNames.length > 0 ? incident.appNames.join(' and ') : 'Part of our platform'}{' '}
                {incident.appNames.length > 1 ? 'are' : 'is'} having trouble right now. If a link from there sent you here,
                that may be why.{' '}
                <Link href="/status" className="font-semibold text-primary hover:text-accent-hover">
                  Status
                </Link>
              </span>
            </div>
          )}

          <div className="mt-7 sm:mt-9">
            <label className="flex h-[52px] items-center gap-3 rounded-[10px] border border-border-strong bg-card px-4 shadow-[0_1px_2px_rgba(35,46,54,.04)] focus-within:border-primary sm:h-14 sm:px-[18px]">
              <MagnifyingGlassIcon className="h-[18px] w-[18px] flex-none text-ink-faint" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps and articles"
                aria-label="Search apps and articles"
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-ink-faint sm:text-[17px] [&::-webkit-search-cancel-button]:hidden"
              />
              <kbd className="hidden rounded-[5px] border border-border px-[7px] py-0.5 font-mono text-xs text-ink-muted sm:block">/</kbd>
            </label>

            {query.trim() && (
              <div className="mt-3 flex flex-col rounded-[10px] border border-border bg-card p-1.5" role="region" aria-label="Search results" aria-live="polite">
                {hasResults ? (
                  <>
                    {results.apps.map((a) => (
                      <Link key={a.id} href={`/apps/${a.id}`} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground ${rowHover}`}>
                        <AppMark app={a} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">{a.name}</span>
                          <span className="block truncate text-sm text-ink-muted">{a.category ?? 'App'}</span>
                        </span>
                      </Link>
                    ))}
                    {results.articles.map((k) => (
                      <Link key={k.id} href={`/knowledge-base/${k.slug}`} className={`block rounded-lg px-3 py-2.5 text-foreground ${rowHover}`}>
                        <span className="block text-[15px] font-semibold leading-snug">{k.title}</span>
                        <span className="block text-sm text-ink-muted">{articleMeta(k)}</span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <p className="px-3 py-2.5 text-[15px] text-ink-muted">Nothing matches &ldquo;{query.trim()}&rdquo;.</p>
                )}
              </div>
            )}

            {!query.trim() && match?.kind === 'app' && (
              <div className="mt-3">
                <ResultRow
                  href={`/apps/${match.app.id}`}
                  mark={<AppMark app={match.app} size="md" />}
                  eyebrow="Closest match"
                  title={match.app.name}
                  meta={[match.app.category, match.app.status].filter(Boolean).join(' · ')}
                  cta={`Open ${match.app.name}`}
                />
              </div>
            )}
            {!query.trim() && match?.kind === 'article' && (
              <div className="mt-3">
                <ResultRow
                  href={`/knowledge-base/${match.article.slug}`}
                  mark={
                    <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-accent text-lg font-semibold text-accent-foreground">
                      {match.article.title.charAt(0).toUpperCase()}
                    </span>
                  }
                  eyebrow="Likely the same article"
                  title={match.article.title}
                  meta={articleMeta(match.article)}
                  cta="Read it"
                />
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-[9px] bg-primary px-[26px] py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
            >
              Go home
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-12 items-center justify-center rounded-[9px] border border-border-strong px-[26px] py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>

      {(apps.length > 0 || suggested.articles.length > 0) && (
        <div className="mt-16 grid gap-11 sm:mt-[112px] md:grid-cols-2 md:gap-16">
          {apps.length > 0 && (
            <section>
              <SectionHeader label="Apps" href="/apps" cta="All apps" />
              {apps.slice(0, MAX_LISTED_APPS).map((a) => (
                <Link
                  key={a.id}
                  href={`/apps/${a.id}`}
                  className={`-mx-2.5 grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg border-b border-border px-2.5 py-3 text-foreground sm:py-3.5 ${rowHover}`}
                >
                  <AppMark app={a} size="sm" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-base font-semibold tracking-[-0.015em]">
                      {a.name}
                      <span className={`block h-1.5 w-1.5 rounded-full ${degraded.has(a.id) ? 'bg-warning' : statusDotClasses(a.status)}`} />
                    </span>
                    <span className="block text-sm text-ink-muted">{a.category ?? a.description}</span>
                  </span>
                  <span className="hidden text-[13px] text-ink-muted sm:block">{degraded.has(a.id) ? 'Degraded' : a.status}</span>
                </Link>
              ))}
            </section>
          )}
          {suggested.articles.length > 0 && (
            <section>
              <SectionHeader
                label={suggested.related ? 'Related articles' : 'From the knowledge base'}
                href="/knowledge-base"
                cta="Knowledge base"
              />
              {suggested.articles.map((k) => (
                <Link
                  key={k.id}
                  href={`/knowledge-base/${k.slug}`}
                  className={`-mx-2.5 block rounded-lg border-b border-border px-2.5 py-3 text-foreground sm:py-3.5 ${rowHover}`}
                >
                  <span className="block text-base font-semibold leading-[1.4] tracking-[-0.015em]">{k.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{articleMeta(k)}</span>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
