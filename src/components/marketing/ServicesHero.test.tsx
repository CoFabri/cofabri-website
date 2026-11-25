import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ServicesHero from './ServicesHero';
import type { CompositionTile } from '@/lib/services/composition';

const tiles: CompositionTile[] = [
  { id: 'cofabri-crm', name: 'CoFabri CRM', sublabel: 'App · you run it', kind: 'app' },
  { id: 'cofabri-marketing', name: 'CoFabri Marketing', sublabel: 'Service · Live', kind: 'service' },
  { id: 'cofabri-concierge', name: 'CoFabri Concierge', sublabel: 'Service · Coming soon', kind: 'service' },
];
const render = (t: CompositionTile[], arranged = true) =>
  renderToStaticMarkup(<ServicesHero tiles={t} arranged={arranged} primaryAction={<button>Book a Call</button>} />);

describe('ServicesHero', () => {
  it('always has the heading, the lead, both buttons and the meta strip', () => {
    for (const out of [render(tiles), render([])]) {
      expect(out).toContain('Some work is better');
      expect(out).toContain('done for you.');
      expect(out).toContain('Book a Call');
      expect(out).toContain('See How It Works');
      expect(out).toContain('The CoFabri team');
      expect(out).toContain('A short call');
    }
  });

  it('shows a tile and a label for each service Core returns', () => {
    const out = render(tiles);
    for (const t of tiles) {
      expect(out).toContain(`data-family-mark="${t.id}"`);
      expect(out).toContain(t.name);
    }
    expect(out).toContain('App · you run it');
    expect(out).toContain('Service · Coming soon');
  });

  it('leaves out the tile column, not an empty box, when Core returns nothing', () => {
    const out = render([]);
    expect(out).not.toContain('data-family-mark');
    expect(out).not.toContain('CoFabri apps and services');
    expect(out).not.toContain('lg:grid-cols-[1fr_440px]');
  });

  it('uses a simple row when the arrangement does not apply', () => {
    const out = render(tiles.slice(0, 2), false);
    expect(out).toContain('data-family-mark="cofabri-marketing"');
    expect(out).not.toContain('h-[400px]');
  });
});
