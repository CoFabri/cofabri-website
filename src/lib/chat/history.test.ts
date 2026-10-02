import { describe, it, expect } from 'vitest';
import { buildHistory } from './history';

describe('buildHistory', () => {
  it('maps messages to role and content only', () => {
    const withCitations = { role: 'user' as const, content: 'hi', citations: [{ slug: 'a', title: 'A' }] };
    expect(buildHistory([withCitations])).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });

  it('leaves out excluded messages (a flagged exchange)', () => {
    expect(
      buildHistory([
        { role: 'user', content: 'flagged', excluded: true },
        { role: 'assistant', content: 'fixed reply', excluded: true },
        { role: 'user', content: 'next' },
      ]),
    ).toEqual([{ role: 'user', content: 'next' }]);
  });
});
