import React from 'react';
import Link from 'next/link';
import { Cinzel } from 'next/font/google';
import RevealSection from './RevealSection';
import CofabriLogo from './CofabriLogo';
import { aboutHighlights, aboutWhyChoose, missionStatement, nameEtymology } from './about-content';
import type { TeamMember } from '@/lib/api-client';

const cinzel = Cinzel({
  weight: '600',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

interface AboutPageContentProps {
  team: TeamMember[];
}

function PersonCard({ person, large = false }: { person: TeamMember; large?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div
        className={
          large
            ? 'h-20 w-20 rounded-full bg-muted bg-cover bg-center'
            : 'h-14 w-14 rounded-full bg-muted bg-cover bg-center'
        }
        style={person.photoUrl ? { backgroundImage: `url(${encodeURI(person.photoUrl)})` } : undefined}
        aria-hidden
      />
      <h3 className={large ? 'mt-4 text-xl font-semibold text-foreground' : 'mt-3 text-base font-semibold text-foreground'}>
        {person.name}
      </h3>
      {person.roleTitle && <p className="text-sm text-muted-foreground">{person.roleTitle}</p>}
      {person.department && <p className="text-xs uppercase tracking-wide text-muted-foreground">{person.department}</p>}
      {person.bio && <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">{person.bio}</p>}
    </div>
  );
}

function LogoChip({ children, tone }: { children: React.ReactNode; tone: 'light' | 'dark' | 'ink' }) {
  const bg =
    tone === 'dark' ? 'bg-[#0a0a0a]' : tone === 'ink' ? 'bg-[#f4f1ea]' : 'bg-[#fafafa] border border-border';
  return (
    <div className={`flex items-center justify-center rounded-xl py-10 ${bg}`}>
      {children}
    </div>
  );
}

const AboutPageContent = ({ team }: AboutPageContentProps) => {
  const founders = team.filter((p) => p.isFounder);
  const rest = team.filter((p) => !p.isFounder);

  return (
    <div className="bg-background">
      <RevealSection className="py-24 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="max-w-[620px]">
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              About us
            </div>
            <h1 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              One studio. Every industry.
            </h1>
            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground">{missionStatement}</p>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="py-16 md:py-24 border-t border-border overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            Where the name comes from
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-8">
            <div>
              <span className="block text-[88px] font-semibold leading-[0.9] tracking-[-0.04em] text-foreground sm:text-[140px]">
                {nameEtymology.co.word}
              </span>
              <p className="mt-4 max-w-[260px] text-sm leading-[1.6] text-muted-foreground">
                <span className="font-medium text-foreground">{nameEtymology.co.origin}</span> — {nameEtymology.co.caption}
              </p>
            </div>

            <span className="hidden pb-8 text-3xl text-muted-foreground/40 sm:block sm:text-4xl">+</span>

            <div>
              <span
                className={`${cinzel.className} block text-[88px] leading-[0.9] tracking-[-0.01em] text-primary sm:text-[140px]`}
              >
                {nameEtymology.fabri.word}
              </span>
              <p className="mt-4 max-w-[300px] text-sm leading-[1.6] text-muted-foreground">
                Latin <span className={`${cinzel.className} text-foreground`}>{nameEtymology.fabri.origin}</span> —{' '}
                {nameEtymology.fabri.caption}
              </p>
            </div>
          </div>

          <p className="mt-10 max-w-[560px] text-lg leading-[1.6] text-foreground">
            {nameEtymology.synthesis}
          </p>
        </div>
      </RevealSection>

      <RevealSection className="py-16 md:py-20 border-t border-border">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            The mark
          </div>
          <h2 className="m-0 text-2xl font-semibold text-foreground">One mark, every context</h2>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <LogoChip tone="light">
              <CofabriLogo height={72} tone="light" />
            </LogoChip>
            <LogoChip tone="dark">
              <CofabriLogo height={72} tone="dark" />
            </LogoChip>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <LogoChip tone="light">
              <CofabriLogo height={96} variant="mark" tone="light" />
            </LogoChip>
            <LogoChip tone="ink">
              <CofabriLogo height={56} tone="mono-ink" />
            </LogoChip>
            <LogoChip tone="dark">
              <CofabriLogo height={56} tone="mono-white" />
            </LogoChip>
          </div>
        </div>
      </RevealSection>

      {founders.length > 0 && (
        <RevealSection className="py-16 md:py-20 border-t border-border">
          <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
            <h2 className="m-0 text-2xl font-semibold text-foreground">Founders</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {founders.map((person) => (
                <PersonCard key={person.id} person={person} large />
              ))}
            </div>
          </div>
        </RevealSection>
      )}

      {rest.length > 0 && (
        <RevealSection className="py-16 md:py-20 border-t border-border">
          <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
            <h2 className="m-0 text-2xl font-semibold text-foreground">The team</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="py-16 md:py-20 border-t border-border">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <h2 className="m-0 text-2xl font-semibold text-foreground">Why CoFabri</h2>
          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <ul className="border-t border-border">
              {aboutHighlights.map((h) => (
                <li key={h} className="flex items-center gap-3 border-b border-border py-3.5 text-[15px] text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
            <ul className="flex flex-col">
              {aboutWhyChoose.map((item, i) => (
                <li key={item} className="flex gap-3.5 border-t border-border py-3.5 text-[15px] text-foreground first:border-t-0">
                  <span className="pt-0.5 font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="py-16 md:py-20 border-t border-border">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10 text-center">
          <h2 className="m-0 text-2xl font-semibold text-foreground">Want to work with us?</h2>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Get in touch
          </Link>
        </div>
      </RevealSection>
    </div>
  );
};

export default AboutPageContent;
