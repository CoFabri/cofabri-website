import { describe, expect, it } from 'vitest';

// WCAG relative luminance and contrast, to hold the /services ink palette to AA.
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const INK = { light: '#12171B', dark: '#0E1317' };
const TEXT = {
  heading: '#F1F4F6',
  body: '#B4BEC6',
  eyebrow: '#9AA8B2',
  navLink: '#B4BEC6',
  currentStepNumber: '#83B8F8',
  pastStep: '#9AA8B2',
  futureStep: '#7E8B96',
};

describe('ink surface text is AA (4.5:1) on both ink colours', () => {
  for (const [theme, bg] of Object.entries(INK)) {
    for (const [name, fg] of Object.entries(TEXT)) {
      it(`${name} on the ${theme}-theme ink`, () => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('keeps white on the hero buttons readable', () => {
    expect(contrast('#FFFFFF', '#0B6BE6')).toBeGreaterThanOrEqual(4.5);
  });
});
