import { describe, expect, it } from 'vitest';
import { renderPolicyHtml } from './policy-markdown';

describe('renderPolicyHtml', () => {
  it('renders headings with ids, lists, emphasis and paragraphs', () => {
    const html = renderPolicyHtml('## 1. Who We Are\n\nHello **there**.\n\n- one\n- two');
    expect(html).toContain('<h2 id="1-who-we-are">');
    expect(html).toContain('<strong>there</strong>');
    expect(html).toContain('<li>one</li>');
  });
  it('escapes raw HTML instead of emitting it', () => {
    const html = renderPolicyHtml('Hi <script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/<script|<img/i);
    expect(html).toContain('&lt;script&gt;');
  });
  it('escapes block-level raw HTML too', () => {
    const html = renderPolicyHtml('<div onclick="x()">hi</div>\n\n<iframe src="https://evil.test"></iframe>');
    expect(html).not.toMatch(/<div|<iframe/i);
  });
  it('drops javascript: and data: links but keeps their text', () => {
    for (const href of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      const html = renderPolicyHtml(`[click](${href})`);
      expect(html).not.toMatch(/href=/i);
      expect(html).toContain('click');
    }
  });
  it('drops javascript: links disguised with whitespace or entities', () => {
    for (const md of [
      '[x](  javascript:alert(1))',
      '[x](<  javascript:alert(1)>)',
      '[x](&#106;avascript:alert(1))',
      '[x](&#x6A;avascript:alert(1))',
      '[x](java&#10;script:alert(1))',
      '[x](java\tscript:alert(1))',
      '[x][r]\n\n[r]: javascript:alert(1)',
      '<javascript:alert(1)>',
    ]) {
      const html = renderPolicyHtml(md);
      expect(html, md).not.toMatch(/href=/i);
      expect(html, md).not.toMatch(/<a\b/i);
    }
  });
  it('keeps https, mailto, relative and anchor links; opens external ones safely', () => {
    expect(renderPolicyHtml('[a](https://example.com)')).toContain('href="https://example.com" target="_blank" rel="noopener noreferrer"');
    expect(renderPolicyHtml('[a](mailto:x@y.com)')).toContain('href="mailto:x@y.com"');
    expect(renderPolicyHtml('[a](/legal/other)')).toContain('href="/legal/other"');
    expect(renderPolicyHtml('[a](#sec)')).toContain('href="#sec"');
  });
  it('accepts uppercase schemes safely', () => {
    const html = renderPolicyHtml('[a](HTTPS://example.com)');
    expect(html).toContain('href="HTTPS://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it('escapes quotes in hrefs and titles', () => {
    const html = renderPolicyHtml('[a](https://example.com/x"onmouseover="y)');
    expect(html).not.toMatch(/href="[^"]*"onmouseover/);
  });
  it('removes images and returns an empty string for empty input', () => {
    expect(renderPolicyHtml('![x](https://example.com/a.png)')).not.toContain('<img');
    expect(renderPolicyHtml('')).toBe('');
    expect(renderPolicyHtml('   \n ')).toBe('');
  });
});
