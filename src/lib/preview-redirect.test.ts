import { describe, expect, it } from 'vitest';
import { safePreviewRedirect } from './preview-redirect';

describe('safePreviewRedirect', () => {
  it('keeps preview paths on this site', () => {
    expect(safePreviewRedirect('/preview/apps/1')).toBe('/preview/apps/1');
  });

  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example/preview/x',
    '/\\evil.example',
    '/preview/\\/evil.example',
    '/preview/\t/evil',
    'javascript:alert(1)',
    '/about',
    '/preview/login',
  ])('falls back to / for %s', (value) => {
    expect(safePreviewRedirect(value)).toBe('/');
  });
});
