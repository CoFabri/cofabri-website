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
  it('drops protocol-relative and backslash links that would leave the site', () => {
    for (const md of ['[x](//evil.com)', '[x](/\\evil.com)', '[x](\\\\evil.com)']) {
      const html = renderPolicyHtml(md);
      expect(html, md).not.toMatch(/href=/i);
      expect(html, md).not.toMatch(/<a\b/i);
      expect(html, md).toContain('x');
    }
  });
  it('drops links whose destination hides a control character or space (browsers strip tabs and newlines from URLs)', () => {
    for (const md of [
      '[x](</\t/evil.com>)',
      '[x](<\t//evil.com>)',
      '[x](</ /evil.com>)',
      '[x](<https://exa\tmple.com>)',
      '[x](<mailto:a@b.com\u0000>)',
      '[x](<#a b>)',
    ]) {
      const html = renderPolicyHtml(md);
      expect(html, JSON.stringify(md)).not.toMatch(/href=/i);
      expect(html, JSON.stringify(md)).toContain('x');
    }
  });
  it('keeps same-site paths, path anchors and fragment links', () => {
    expect(renderPolicyHtml('[x](/legal/other)')).toContain('href="/legal/other"');
    expect(renderPolicyHtml('[x](/#a)')).toContain('href="/#a"');
    expect(renderPolicyHtml('[x](#sec)')).toContain('href="#sec"');
  });
  it('drops a leading level-1 heading, since the page renders the title itself', () => {
    const html = renderPolicyHtml('# Title\n\n## 1. A\n\nText.');
    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2 id="1-a">');
    expect(html).toContain('Text.');
  });
  it('drops a leading level-1 heading after leading blank lines', () => {
    expect(renderPolicyHtml('\n\n# Title\n\nBody')).not.toContain('<h1');
  });
  it('leaves a body without a leading level-1 heading unchanged', () => {
    const md = '## A\n\nText.\n\n# Later';
    const html = renderPolicyHtml(md);
    expect(html).toContain('<h2 id="a">');
    expect(html).toContain('<h1 id="later">Later</h1>');
  });
  it('keeps a level-1 heading that is not the first block', () => {
    const html = renderPolicyHtml('# Title\n\nIntro\n\n# Part Two');
    expect(html).not.toContain('<h1 id="title"');
    expect(html).toContain('<h1 id="part-two">Part Two</h1>');
  });
  it('renders an empty string for a body that is only a level-1 heading', () => {
    expect(renderPolicyHtml('# Title')).toBe('');
    expect(renderPolicyHtml('# Title\n\n')).toBe('');
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
