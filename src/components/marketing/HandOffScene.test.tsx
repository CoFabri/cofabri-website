import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HandOffScene from './HandOffScene';

// The pinned, scroll-scrubbed scene needs room: a 400px list plus a 560px window. It must only
// appear from 1024px up; phones, tablets and a folded Surface Duo get the stacked version.
describe('HandOffScene breakpoints', () => {
  const html = renderToStaticMarkup(<HandOffScene />);

  it('pins the scene only from 1024px up (lg), and only when motion is allowed', () => {
    expect(html).toContain('lg:motion-safe:block');
    expect(html).not.toMatch(/(?<![a-z-])md:motion-safe/);
  });

  it('shows the static reduced-motion layout from 1024px up too', () => {
    expect(html).toContain('lg:motion-reduce:grid');
    expect(html).not.toMatch(/(?<![a-z-])md:motion-reduce/);
  });

  it('shows the stacked version below 1024px, side by side with its text from 768px', () => {
    expect(html).toContain('lg:hidden');
    expect(html).toContain('md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]');
  });

  it('puts the list and window on separate screens when the viewport spans two', () => {
    expect(html).toContain('duo-split');
  });
});
