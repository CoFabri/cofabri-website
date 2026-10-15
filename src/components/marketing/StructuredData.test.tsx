import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StructuredData from './StructuredData';

describe('StructuredData', () => {
  it('renders a real ld+json script tag in server markup', () => {
    const html = renderToStaticMarkup(<StructuredData type="organization" data={{}} />);
    expect(html).toMatch(/^<script id="structured-data-organization" type="application\/ld\+json">/);
    expect(html).toContain('"@type":"Organization"');
  });

  it('renders BreadcrumbList items', () => {
    const html = renderToStaticMarkup(
      <StructuredData type="breadcrumb" data={{ items: [{ name: 'Home', url: 'https://cofabri.com/' }] }} />,
    );
    expect(html).toContain('"@type":"BreadcrumbList"');
  });
});
