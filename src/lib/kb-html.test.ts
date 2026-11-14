import { describe, expect, it } from 'vitest';
import { renderKbArticleHtml } from './kb-html';

describe('renderKbArticleHtml', () => {
  it('keeps ordinary markdown formatting', async () => {
    const html = await renderKbArticleHtml(
      '## Setup\n\nSome **bold** and *em* text with a [link](https://cofabri.com/apps) and `code`.\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n![Logo](https://files.cofabri.com/logos/x.png)'
    );
    expect(html).toContain('<h2>Setup</h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<table>');
    expect(html).toContain('<img src="https://files.cofabri.com/logos/x.png" alt="Logo" />');
    expect(html).toContain('href="https://cofabri.com/apps" target="_blank" rel="noopener noreferrer"');
  });

  it('strips scripts, event handlers, iframes and javascript: links', async () => {
    const html = await renderKbArticleHtml(
      'Hi <script>alert(1)</script>\n\n<img src="https://x.test/a.png" onerror="alert(2)">\n\n<iframe src="https://evil.test"></iframe>\n\n[click](javascript:alert(3))\n\n<a href="javascript:alert(4)">x</a>\n\n<div style="background:url(x)" onclick="alert(5)">d</div>'
    );
    expect(html).not.toMatch(/<script|onerror|onclick|<iframe|javascript:|style=/i);
  });

  it('returns an empty string for empty content', async () => {
    expect(await renderKbArticleHtml('')).toBe('');
  });
});
