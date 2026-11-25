import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { App } from '@/lib/api-client';
import { HomeServicesSkeleton, HomeServicesView } from './HomeServices';

const svc = (id: string, name: string, status = 'Live'): App => ({ id, name, status, projectType: 'cofabri_service' });
const marketing = svc('cofabri-marketing', 'CoFabri Marketing');
const concierge = svc('cofabri-concierge', 'CoFabri Concierge', 'In Development');
const render = (services: App[]) => renderToStaticMarkup(<HomeServicesView services={services} />);
const cards = (html: string) => (html.match(/data-service-card=/g) ?? []).length;

describe('HomeServicesView', () => {
  it('renders nothing with no services', () => {
    expect(render([])).toBe('');
  });

  it('has the eyebrow, the heading and the one-line intro', () => {
    const out = render([marketing, concierge]);
    expect(out).toContain('Services</div>');
    expect(out).toContain('Some work is better done for you.');
    expect(out).toContain('Apps you run yourself. Services we run for you, by the CoFabri team, inside the same apps.');
  });

  it('two services (today): two cards, in order, with a link to /services', () => {
    const out = render([marketing, concierge]);
    expect(cards(out)).toBe(2);
    expect(out.indexOf('cofabri-marketing')).toBeLessThan(out.indexOf('cofabri-concierge'));
    expect(out).toContain('md:grid-cols-2');
    expect(out).toContain('href="/services"');
    expect(out).toContain('All Services');
  });

  it('one service: a single solo card', () => {
    const out = render([marketing]);
    expect(cards(out)).toBe(1);
    expect(out).toContain('md:flex-row');
  });

  it('three services get a third column from 1024; four stay two by two', () => {
    const three = render([marketing, concierge, svc('s3', 'Three')]);
    expect(cards(three)).toBe(3);
    expect(three).toContain('lg:grid-cols-3');
    const four = render([marketing, concierge, svc('s3', 'Three'), svc('s4', 'Four')]);
    expect(cards(four)).toBe(4);
    expect(four).not.toContain('lg:grid-cols-');
  });

  it('five or more services show no cards, only "All 5 Services"', () => {
    const five = Array.from({ length: 5 }, (_, i) => svc(`s${i}`, `Service ${i}`));
    const out = render(five);
    expect(cards(out)).toBe(0);
    expect(out).toContain('All 5 Services');
    expect(out).toContain('Some work is better done for you.');
  });

  it('a live service links to its page; a coming-soon one has Notify Me', () => {
    const out = render([marketing, concierge]);
    expect(out).toContain('href="/services/cofabri-marketing"');
    expect(out).toContain('Notify Me');
    expect(out.match(/Notify Me/g)).toHaveLength(1);
  });

  it('stacks Notify Me from the card, not the viewport', () => {
    expect(render([marketing, concierge])).toContain('@container');
  });

  it('spanned on a dual-screen device, the heading and the cards use the hinge split', () => {
    expect(render([marketing, concierge]).match(/duo-split/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('shows no price, no "Runs on" line, and no numbers other than a count in the link', () => {
    const out = render([marketing, concierge]);
    expect(out).not.toMatch(/\$|per month|\/mo\b/i);
    expect(out).not.toContain('Runs on');
  });
});

describe('HomeServicesSkeleton', () => {
  it('is a hidden, text-free placeholder', () => {
    const out = renderToStaticMarkup(<HomeServicesSkeleton />);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('animate-pulse');
    expect(out).not.toMatch(/>[A-Za-z]/);
  });
});
