import { describe, expect, it } from 'vitest';
import { filterPillClasses } from './filter-pill';

describe('filterPillClasses', () => {
  it('uses the solid foreground style when active', () => {
    expect(filterPillClasses(true)).toContain('bg-foreground');
  });

  it('uses an outlined style when inactive', () => {
    const classes = filterPillClasses(false);
    expect(classes).toContain('border-border-strong');
    expect(classes).not.toContain('bg-foreground');
  });
});
