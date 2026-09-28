import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BackstopPage from './BackstopPage';
import { SAMPLE_BACKSTOP_NOTE } from '@/lib/backstop';

const render = (props: Parameters<typeof BackstopPage>[0] = {}) => renderToStaticMarkup(<BackstopPage {...props} />);

describe('BackstopPage', () => {
  it('renders the core content', () => {
    const html = render();
    expect(html).toContain('Temporarily unavailable');
    expect(html).toContain('not quite connecting.');
    expect(html).toContain('Try again');
    expect(html).toContain('Your data is safe.');
    expect(html).toContain('CoFabri by Maven X LLC');
  });

  it('is self-contained: no external URLs, no external assets', () => {
    const html = render({ supportEmail: 'help@example.com', note: SAMPLE_BACKSTOP_NOTE });
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/url\(/);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<script[^>]*\ssrc=/i);
    expect(html).not.toMatch(/<link/i);
    expect(html).not.toMatch(/@import/);
  });

  it('honors reduced motion', () => {
    expect(render()).toContain('prefers-reduced-motion:reduce');
  });

  it('omits the Contact support link when no support email is configured', () => {
    expect(render()).not.toContain('Contact support');
    expect(render()).not.toContain('mailto:');
  });

  it('renders a mailto Contact support link when configured', () => {
    const html = render({ supportEmail: 'help@cofabri.com' });
    expect(html).toContain('href="mailto:help@cofabri.com"');
    expect(html).toContain('Contact support');
  });

  it('escapes a hostile support email instead of emitting markup', () => {
    const html = render({ supportEmail: '"><script>alert(1)</script>@x.com' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('hides the live-status slot without a note and shows it with one', () => {
    expect(render()).not.toContain('Latest update');
    const html = render({ note: SAMPLE_BACKSTOP_NOTE });
    expect(html).toContain('Latest update');
    expect(html).toContain('21:05 UTC');
    expect(html).toContain('hosting provider');
  });

  it('renders three signal rings around a still mark, with no drift or dashed-outline elements', () => {
    const html = render();
    expect((html.match(/class="ring"/g) ?? []).length).toBe(3);
    expect(html).toContain('animation-delay:0s');
    expect(html).toContain('animation-delay:2.5s');
    expect(html).toContain('animation-delay:5s');
    expect(html).toContain('viewBox="-50 -50 200 200"');
    expect(html).not.toContain('class="ghost"');
    expect(html).not.toContain('class="float"');
    expect(html).not.toContain('bs-drift');
    expect(html).not.toContain('bs-dash');
  });

  it('defines the ripple keyframes and a static first ring under reduced motion', () => {
    const html = render();
    expect(html).toContain('@keyframes bs-ripple{');
    expect(html).toContain('@keyframes bs-ripple-sm{');
    expect(html).toContain('.bs .ring:first-of-type{opacity:.25;transform:scale(1.35)}');
  });

  it('ships no inline script (retry enhancement is a client component that runs after hydration)', () => {
    expect(render()).not.toContain('<script');
  });

  it('shows the Preview tag only in preview mode', () => {
    expect(render()).not.toContain('>Preview<');
    expect(render({ preview: true })).toContain('>Preview<');
  });

  it('carries the requested initial state on the root element', () => {
    expect(render()).not.toContain('data-state="');
    expect(render({ initialState: 'retry' })).toContain('data-state="retry"');
    expect(render({ initialState: 'loading' })).toContain('data-state="loading"');
  });

  it('keeps the retry link working without JavaScript', () => {
    expect(render()).toContain('id="bs-retry"');
    expect(render()).toContain('href="?retry=1"');
  });
});
