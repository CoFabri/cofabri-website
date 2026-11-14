import { describe, expect, it } from 'vitest';
import { safeHref } from './safe-url';

describe('safeHref', () => {
  it.each(['https://cofabri.com/x', 'http://a.test', 'mailto:hi@cofabri.com', 'tel:+15551234', '/apps', '#top'])(
    'keeps %s',
    (url) => expect(safeHref(url)).toBe(url)
  );

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example',
    '/\\evil.example',
    'evil.example',
    '',
    null,
    undefined,
  ])('rejects %s', (url) => expect(safeHref(url)).toBeUndefined());
});
