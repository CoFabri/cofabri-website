import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from './global-error';

describe('GlobalError', () => {
  it('renders a complete document containing the backstop page', () => {
    const html = renderToStaticMarkup(<GlobalError />);
    expect(html).toContain('<html');
    expect(html).toContain('<title>CoFabri · Temporarily unavailable</title>');
    expect(html).toContain('not quite connecting.');
    expect(html).not.toMatch(/https?:\/\//);
  });
});
