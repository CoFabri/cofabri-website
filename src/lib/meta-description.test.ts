import { describe, expect, it } from 'vitest';
import { buildDescription } from './meta-description';

describe('buildDescription', () => {
  it('keeps a long enough summary unchanged', () => {
    const s = 'A'.repeat(120);
    expect(buildDescription(s, ['extra'])).toBe(s);
  });

  it('extends a short summary with real page copy up to 160 characters', () => {
    const d = buildDescription('Short summary.', ['Getting started means setting up your clinic. '.repeat(10)]);
    expect(d.length).toBeGreaterThanOrEqual(100);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.startsWith('Short summary. Getting started')).toBe(true);
  });

  it('strips markdown from borrowed copy', () => {
    const d = buildDescription('Short.', ['# Heading\n\n**Bold** text with [a link](https://x.y) in it and more words to pad the length out well past one hundred characters total.']);
    expect(d).not.toMatch(/[#*\[\]()]/);
  });

  it('falls back when there is no summary', () => {
    expect(buildDescription(undefined, [], 'Fallback text')).toBe('Fallback text');
  });
});
