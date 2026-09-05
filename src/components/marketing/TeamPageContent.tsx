import React from 'react';
import Link from 'next/link';
import RevealSection from './RevealSection';
import { aboutHighlights, aboutWhyChoose, missionStatement } from './about-content';
import type { TeamMember } from '@/lib/api-client';

interface TeamPageContentProps {
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

const TeamPageContent = ({ team }: TeamPageContentProps) => {
  const founders = team.filter((p) => p.isFounder);
  const rest = team.filter((p) => !p.isFounder);

  return (
    <div className="bg-background">
      <RevealSection className="py-24 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="max-w-[620px]">
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Our team
            </div>
            <h1 className="m-0 text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-foreground sm:text-[42px]">
              One studio. Every industry.
            </h1>
            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground">{missionStatement}</p>
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

export default TeamPageContent;
