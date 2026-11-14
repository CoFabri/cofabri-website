import { describe, expect, it } from 'vitest';
import { cn, markdownToHtml, roadmapMarkdownToHtml, releaseNotesMarkdownToHtml } from './utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });
});

describe('markdownToHtml', () => {
  it('converts bold, italics, and line breaks', () => {
    expect(markdownToHtml('**bold** and *italic*\nnext line')).toBe(
      '<strong>bold</strong> and <em>italic</em><br>next line'
    );
  });

  it('returns an empty string for falsy input', () => {
    expect(markdownToHtml('')).toBe('');
  });
});

describe('roadmapMarkdownToHtml', () => {
  it('converts bold/italic but leaves line breaks as-is', () => {
    expect(roadmapMarkdownToHtml('**bold**\nline two')).toBe('<strong>bold</strong>\nline two');
  });
});

describe('releaseNotesMarkdownToHtml', () => {
  it('converts bold, italic, and line breaks', () => {
    expect(releaseNotesMarkdownToHtml('**bold**\nline two')).toBe('<strong>bold</strong><br>line two');
  });
});

describe('markdown helpers escape raw HTML', () => {
  it.each([
    ['markdownToHtml', markdownToHtml],
    ['roadmapMarkdownToHtml', roadmapMarkdownToHtml],
    ['releaseNotesMarkdownToHtml', releaseNotesMarkdownToHtml],
  ])('%s', (_name, fn) => {
    const html = fn('**ok** <img src=x onerror="alert(1)"> & <script>alert(2)</script>');
    expect(html).toContain('<strong>ok</strong>');
    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;script&gt;');
  });
});
