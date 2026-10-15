import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const robots = readFileSync(join(process.cwd(), 'public/robots.txt'), 'utf8');

describe('robots.txt', () => {
  it('does not use a broad wildcard that blocks real paths starting with "rec"', () => {
    const disallows = robots
      .split('\n')
      .filter((l) => l.startsWith('Disallow:'))
      .map((l) => l.slice('Disallow:'.length).trim());
    expect(disallows.filter((d) => /rec\*?$/.test(d))).toEqual([]);
  });

  it('still blocks the private areas', () => {
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Disallow: /preview/');
  });
});
