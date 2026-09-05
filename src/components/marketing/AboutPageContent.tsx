import React from 'react';
import RevealSection from './RevealSection';
import PageHero from './PageHero';
import Breadcrumbs from './Breadcrumbs';
import CofabriLogo from './CofabriLogo';
import NameOrigin from './NameOrigin';
import { markPalette } from '@/lib/app-display';
import { aboutHighlights, aboutWhyChoose, craftPrinciples, markLayers, missionStatement } from './about-content';
import type { TeamMember } from '@/lib/api-client';

interface AboutPageContentProps {
  team: TeamMember[];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

function Avatar({ person, large = false }: { person: TeamMember; large?: boolean }) {
  const size = large ? 'h-22 w-22' : 'h-14 w-14';
  if (person.photoUrl) {
    return (
      <div
        className={`${size} flex-none rounded-full border border-border bg-cover bg-center`}
        style={{ backgroundImage: `url(${encodeURI(person.photoUrl)})` }}
        aria-hidden
      />
    );
  }
  return (
    <div
      className={`${size} flex flex-none items-center justify-center rounded-full font-semibold tracking-[-0.02em] ${large ? 'text-2xl' : 'text-lg'} ${markPalette(person.id)}`}
      aria-hidden
    >
      {initials(person.name)}
    </div>
  );
}

// The card already carries a "Founder" badge, so a role_title of e.g.
// "Founder, CTO & COO" would otherwise say it twice.
function nonFounderRole(roleTitle: string) {
  return roleTitle.replace(/^co-?founder,?\s*/i, '');
}

function FounderCard({ person }: { person: TeamMember }) {
  const role = person.roleTitle ? nonFounderRole(person.roleTitle) : '';
  return (
    <div className="flex items-start gap-6 rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-border-strong sm:p-8">
      <Avatar person={person} large />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xl font-semibold tracking-[-0.015em] text-foreground">{person.name}</span>
          <span className="rounded-full bg-accent-tint px-[9px] py-1 font-mono text-[11px] tracking-[0.07em] text-primary uppercase">
            Founder
          </span>
        </div>
        {role && <div className="mt-1.5 text-[15px] text-muted-foreground">{role}</div>}
        {person.bio && <p className="mt-3.5 text-[15px] leading-[1.6] text-muted-foreground">{person.bio}</p>}
      </div>
    </div>
  );
}

function TeamCard({ person }: { person: TeamMember }) {
  return (
    <div className="rounded-xl border border-border p-6 transition-colors duration-200 hover:border-border-strong">
      <Avatar person={person} />
      <div className="mt-4.5 text-[17px] font-semibold tracking-[-0.01em] text-foreground">{person.name}</div>
      {person.roleTitle && <div className="mt-1 text-sm text-muted-foreground">{person.roleTitle}</div>}
      {person.department && (
        <div className="mt-2.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          {person.department}
        </div>
      )}
    </div>
  );
}

function LayerIcon({ depth }: { depth: 1 | 2 | 3 }) {
  const STAR = 'M50 1 Q55 45 99 50 Q55 55 50 99 Q45 55 1 50 Q45 45 50 1 Z';
  return (
    <svg width="56" height="56" viewBox="0 0 100 100" className="block">
      <path d={STAR} className="fill-primary" />
      {depth >= 2 && (
        <path d={STAR} className="fill-card" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'scale(.70)' }} />
      )}
      {depth >= 3 && (
        <path d={STAR} className="fill-foreground" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'scale(.36)' }} />
      )}
    </svg>
  );
}

function LogoCard({
  bgClassName,
  height,
  label,
  caption,
  children,
}: {
  bgClassName: string;
  height: number;
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className={`flex items-center justify-center px-6 ${bgClassName}`} style={{ height }}>
        {children}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border px-[18px] py-3.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}

// The team API doesn't guarantee ordering, so sort by sort_order here rather
// than trusting whatever order it happens to return.
function bySortOrder(a: TeamMember, b: TeamMember) {
  if (a.sortOrder == null && b.sortOrder == null) return 0;
  if (a.sortOrder == null) return 1;
  if (b.sortOrder == null) return -1;
  return a.sortOrder - b.sortOrder;
}

const AboutPageContent = ({ team }: AboutPageContentProps) => {
  const sorted = [...team].sort(bySortOrder);
  const founders = sorted.filter((p) => p.isFounder);
  const rest = sorted.filter((p) => !p.isFounder);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[1200px] px-6 pt-9 sm:px-10">
        <div className="mb-14">
          <Breadcrumbs items={[{ name: 'About', href: '/about' }]} />
        </div>

        <PageHero
          eyebrow="About CoFabri"
          title={
            <>
              One studio.
              <br />
              Every industry.
            </>
          }
          subtitle={missionStatement}
          right={
            <div className="flex justify-center self-center sm:self-end">
              <div className="sm:hidden">
                <CofabriLogo variant="mark" height={88} clearSpace="dense" />
              </div>
              <div className="hidden sm:block">
                <CofabriLogo variant="mark" height={120} clearSpace="dense" />
              </div>
            </div>
          }
        />

        <RevealSection className="mt-12 grid grid-cols-1 gap-8 border-t border-ink-disabled sm:mt-16 sm:grid-cols-3 sm:gap-12">
          {aboutHighlights.map((h, i) => (
            <div key={h} className="py-6">
              <div className="font-mono text-[11px] tracking-[0.09em] text-muted-foreground uppercase">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="mt-3 max-w-[280px] text-[17px] leading-[1.45] font-medium text-foreground">{h}</div>
            </div>
          ))}
        </RevealSection>
      </div>

      <NameOrigin />

      <RevealSection className="border-t border-border py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-10 border-b border-border pb-8">
            <div>
              <div className="mb-3.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">The mark</div>
              <h2 className="m-0 text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground sm:text-[36px]">
                One mark, every context.
              </h2>
            </div>
            <p className="max-w-[380px] text-base leading-[1.6] text-muted-foreground">
              Three concentric four-point stars — shell, void, core. The same geometry on a billboard, a browser tab,
              and the corner of every app we make.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 sm:grid-cols-2 sm:gap-16">
            <div>
              <div className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                Read from the outside in
              </div>
              <p className="mt-4.5 max-w-[460px] text-lg leading-[1.5] tracking-[-0.015em] text-foreground sm:text-xl">
                A four-point star, three times over. The layers aren&rsquo;t decoration — they&rsquo;re the argument.
              </p>
              <p className="mt-5 max-w-[460px] text-[15px] leading-[1.65] text-muted-foreground sm:text-base">
                Read it the other way and it&rsquo;s the order things get built in: a core worth trusting, room kept
                clear around it, a business built to hold it. Four points, not five — a compass, not a rating.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {markLayers.map((layer, i) => (
                <div key={layer.title} className="rounded-xl border border-border bg-card p-[22px]">
                  <LayerIcon depth={(i + 1) as 1 | 2 | 3} />
                  <div className="mt-4.5 font-mono text-[11px] tracking-[0.09em] text-muted-foreground uppercase">
                    {layer.title}
                  </div>
                  <div className="mt-2 text-[15px] leading-[1.55] text-foreground">{layer.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <LogoCard bgClassName="bg-white" height={200} label="Primary lockup" caption="light · on #FFFFFF">
              <CofabriLogo tone="light" height={68} clearSpace="dense" />
            </LogoCard>
            <LogoCard bgClassName="bg-[#0a0a0a]" height={200} label="Dark surfaces" caption="dark · on #0A0A0A">
              <CofabriLogo tone="dark" height={68} clearSpace="dense" />
            </LogoCard>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <LogoCard bgClassName="bg-surface-sunken" height={156} label="Mark alone" caption="below 120px wide">
              <CofabriLogo variant="mark" tone="light" height={92} clearSpace="dense" />
            </LogoCard>
            <LogoCard bgClassName="bg-[#f4f1ea]" height={156} label="Mono ink" caption="print · one colour">
              <CofabriLogo tone="mono-ink" height={52} clearSpace="dense" />
            </LogoCard>
            <LogoCard bgClassName="bg-[#0a0a0a]" height={156} label="Mono white" caption="photo · dark print">
              <CofabriLogo tone="mono-white" height={52} clearSpace="dense" />
            </LogoCard>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-10 border-b border-foreground pb-9">
            <div>
              <div className="mb-3.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                How we build
              </div>
              <h2 className="m-0 max-w-[520px] text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground sm:text-[36px]">
                The craft is the product.
              </h2>
            </div>
            <p className="max-w-[380px] text-base leading-[1.6] text-muted-foreground">
              Most business software is a database with a form bolted on. We treat design, interaction and
              reliability as the same job.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-16">
            {craftPrinciples.map((c, i) => (
              <div key={c.title} className="border-b border-border py-7 sm:py-9">
                <div className="flex items-baseline gap-3.5">
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="m-0 text-[19px] leading-[1.25] font-semibold tracking-[-0.02em] text-foreground sm:text-[22px]">
                    {c.title}
                  </h3>
                </div>
                <p className="mt-3.5 max-w-[440px] pl-[26px] text-[15px] leading-[1.6] text-muted-foreground sm:text-base">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {(founders.length > 0 || rest.length > 0) && (
        <RevealSection className="border-t border-border py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <div className="mb-3.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                  The people
                </div>
                <h2 className="m-0 text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground sm:text-[36px]">
                  Every app is maintained by whoever built it.
                </h2>
              </div>
              <span className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
                getTeam()
              </span>
            </div>

            {founders.length > 0 && (
              <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {founders.map((person) => (
                  <FounderCard key={person.id} person={person} />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {rest.map((person) => (
                  <TeamCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </div>
        </RevealSection>
      )}

      <RevealSection className="border-t border-border py-16 pb-24 md:py-20 md:pb-28">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16">
            <div>
              <div className="mb-3.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
                Why CoFabri
              </div>
              <h2 className="m-0 max-w-[420px] text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-foreground sm:text-[36px]">
                Four reasons operators stay.
              </h2>
            </div>
            <ul className="flex flex-col border-t border-border-strong">
              {aboutWhyChoose.map((item, i) => (
                <li
                  key={item}
                  className="flex items-baseline gap-4 border-b border-border py-[22px] text-[15px] text-foreground sm:gap-7 sm:text-lg"
                >
                  <span className="flex-none font-mono text-[13px] text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-[1.45]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealSection>
    </div>
  );
};

export default AboutPageContent;
