import type { ReactNode } from 'react';
import type { CompositionTile } from '@/lib/services/composition';
import FamilyMark from './FamilyMark';
import InkEyebrow from './InkEyebrow';

// The dark /services hero: copy on the left, a 440px family composition on the
// right, and a meta strip along the bottom. It sits on the ink surface (the
// header above it is dark too, so the two read as one block). The tiles come
// from Core, via buildComposition.

const META = [
  { key: 'Who does the work', value: 'The CoFabri team' },
  { key: 'Where it happens', value: 'Inside your CoFabri apps' },
  { key: 'What you see', value: 'Every step, in your app' },
  { key: 'How it starts', value: 'A short call' },
];

// Each tile sits on a soft halo in its accent colour.
const HALO: Record<string, string> = {
  'cofabri-crm': '#0B6BE6',
  'cofabri-marketing': '#C2410C',
  'cofabri-concierge': '#7E2F8E',
};

function Tile({ tile, size }: { tile: CompositionTile; size: number }) {
  return (
    <span className="relative inline-flex">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: -size * 0.38,
          backgroundImage: `radial-gradient(closest-side, ${HALO[tile.id] ?? '#0B6BE6'}73, transparent)`,
        }}
      />
      <FamilyMark appId={tile.id} size={size} strokeWidth={1.6} ink className="relative" />
    </span>
  );
}

function Label({ tile, className = '' }: { tile: CompositionTile; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[15px] font-semibold leading-snug text-[#F1F4F6]">{tile.name}</div>
      <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#9AA8B2]">{tile.sublabel}</div>
    </div>
  );
}

function SimpleRow({ tiles }: { tiles: CompositionTile[] }) {
  return (
    <ul aria-label="CoFabri apps and services" className="m-0 flex list-none flex-wrap items-start gap-x-6 gap-y-10 p-0 sm:gap-x-10">
      {tiles.map((tile) => (
        <li key={tile.id} className="flex w-[104px] flex-col items-start gap-4 sm:w-[132px]">
          <span className="sm:hidden">
            <Tile tile={tile} size={72} />
          </span>
          <span className="hidden sm:inline-flex">
            <Tile tile={tile} size={88} />
          </span>
          <Label tile={tile} />
        </li>
      ))}
    </ul>
  );
}

// The designed arrangement, desktop only: the app top left, the second service
// bottom left (labels to their right), the first service larger and right of
// centre with its label below.
function Arranged({ tiles }: { tiles: CompositionTile[] }) {
  const [app, main, other] = tiles;
  return (
    <ul aria-label="CoFabri apps and services" className="relative m-0 hidden h-[400px] list-none p-0 lg:block">
      <li className="absolute left-0 top-[14px]">
        <Tile tile={app} size={104} />
      </li>
      <li className="absolute left-[132px] top-[42px]">
        <Label tile={app} />
      </li>
      <li className="absolute left-[262px] top-[78px]">
        <Tile tile={main} size={148} />
        <Label tile={main} className="mt-7" />
      </li>
      <li className="absolute left-0 top-[290px]">
        <Tile tile={other} size={104} />
      </li>
      <li className="absolute left-[132px] top-[322px]">
        <Label tile={other} />
      </li>
    </ul>
  );
}

interface ServicesHeroProps {
  tiles: CompositionTile[];
  arranged: boolean;
  /** The primary action (Book a Call). */
  primaryAction: ReactNode;
}

export default function ServicesHero({ tiles, arranged, primaryAction }: ServicesHeroProps) {
  return (
    <section className="br-crm relative overflow-hidden bg-[var(--ink-bg)] text-[#B4BEC6]">
      <div className="relative mx-auto max-w-[1200px] px-6 pt-12 sm:px-10 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_440px] lg:gap-16">
          <div>
            <InkEyebrow>Services</InkEyebrow>
            <h1 className="m-0 mt-6 p-0 text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] text-[#F1F4F6] sm:text-[56px] lg:text-[68px]">
              Some work is better <span className="ink-gradient-text">done for you.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-lg leading-[1.6] text-[#B4BEC6] sm:text-[19px]">
              Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {primaryAction}
              <a
                href="#how-services-work"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/[0.22] bg-transparent px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83B8F8] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-bg)] sm:w-auto"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="relative">
            {/* Three soft glows behind the tiles. Plain radial gradients, so nothing repaints on scroll. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-24 -inset-y-20"
              style={{
                backgroundImage: [
                  'radial-gradient(closest-side at 22% 24%, rgba(11,107,230,0.30), transparent)',
                  'radial-gradient(closest-side at 74% 46%, rgba(194,65,12,0.22), transparent)',
                  'radial-gradient(closest-side at 20% 84%, rgba(126,47,142,0.28), transparent)',
                ].join(', '),
              }}
            />
            <div className="relative">
              {arranged ? (
                <>
                  <Arranged tiles={tiles} />
                  <div className="lg:hidden">
                    <SimpleRow tiles={tiles} />
                  </div>
                </>
              ) : (
                <SimpleRow tiles={tiles} />
              )}
            </div>
          </div>
        </div>

        <dl className="m-0 mt-16 grid grid-cols-2 border-t border-[var(--ink-line)] lg:mt-20 lg:grid-cols-4">
          {META.map((cell) => (
            <div
              key={cell.key}
              className="border-[var(--ink-line)] py-5 pr-4 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0 max-lg:[&:nth-child(even)]:border-l max-lg:[&:nth-child(even)]:pl-5"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#9AA8B2]">{cell.key}</dt>
              <dd className="m-0 mt-1.5 text-[15px] font-semibold text-[#F1F4F6]">{cell.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
