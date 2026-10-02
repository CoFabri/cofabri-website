import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMarkdown } from './markdown';

const html = (t: string) => renderToStaticMarkup(<ChatMarkdown text={t} />);

describe('ChatMarkdown', () => {
  it('renders bold, italic and code', () => {
    const out = html('**Gathr** is *great* with `code`');
    expect(out).toContain('<strong>Gathr</strong>');
    expect(out).toContain('<em>great</em>');
    expect(out).toContain('code</code>');
    expect(out).not.toContain('**');
  });
  it('renders bullet and numbered lists', () => {
    expect(html('- one\n- two')).toContain('<ul');
    expect(html('1. one\n2. two')).toContain('<ol');
  });
  it('keeps paragraphs and line breaks', () => {
    const out = html('a\nb\n\nc');
    expect(out.match(/<p/g)).toHaveLength(2);
    expect(out).toContain('<br/>');
  });
  it('never emits raw html from the text', () => {
    const out = html('<script>alert(1)</script> <b>x</b> [a](javascript:alert(1))');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<b>');
    expect(out).not.toContain('<a ');
  });
  it('leaves stray asterisks alone', () => {
    expect(html('2 * 3 and 4 * 5')).toContain('2 * 3 and 4 * 5');
  });
});
