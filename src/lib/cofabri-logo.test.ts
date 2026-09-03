import { describe, expect, it } from 'vitest';
import { pickCofabriCut, cofabriPngAsset } from './cofabri-logo';

describe('pickCofabriCut', () => {
  it('picks lockup for wide renders (width >= 280)', () => {
    // width = height * (464/200); 280 / 2.32 = 120.68965517241379
    expect(pickCofabriCut(280 / 2.32, 'auto')).toBe('lockup');
    expect(pickCofabriCut(200, 'auto')).toBe('lockup');
  });

  it('picks lockup-sm for mid-size renders (120 <= width < 280)', () => {
    expect(pickCofabriCut(120 / 2.32, 'auto')).toBe('lockup-sm');
    expect(pickCofabriCut(56, 'auto')).toBe('lockup-sm'); // the site header's actual height
    expect(pickCofabriCut(120, 'auto')).toBe('lockup-sm'); // width = 278.4, just under the 280 breakpoint
  });

  it('falls back to the mark below the lockup-sm width floor', () => {
    expect(pickCofabriCut(40, 'auto')).toBe('mark'); // width = 92.8
    expect(pickCofabriCut(39, 'auto')).toBe('mark-small'); // width = 90.48, height < 40
  });

  it('forces the mark for variant "mark", switching to mark-small below 40px tall', () => {
    expect(pickCofabriCut(40, 'mark')).toBe('mark');
    expect(pickCofabriCut(39, 'mark')).toBe('mark-small');
    expect(pickCofabriCut(200, 'mark')).toBe('mark'); // variant overrides the width ladder entirely
  });
});

describe('cofabriPngAsset', () => {
  it('resolves every lockup tone under /png/, sized to the lockup PNG master', () => {
    const tones = ['light', 'dark', 'mono-ink', 'mono-white', 'mono-black'] as const;
    for (const tone of tones) {
      const asset = cofabriPngAsset('lockup', tone);
      expect(asset).not.toBeNull();
      expect(asset!.src).toBe(`https://files.cofabri.com/logos/cofabri/png/cofabri-lockup-${tone}-1856.png`);
      expect(asset!.width).toBe(1856);
      expect(asset!.height).toBe(800);
    }
  });

  it('reuses the full-size mono lockup master for lockup-sm (no dedicated -sm- mono asset exists)', () => {
    const monoAsset = cofabriPngAsset('lockup-sm', 'mono-ink');
    expect(monoAsset!.src).toBe('https://files.cofabri.com/logos/cofabri/png/cofabri-lockup-mono-ink-1856.png');
  });

  it('resolves lockup-sm light/dark to their dedicated -sm- masters', () => {
    expect(cofabriPngAsset('lockup-sm', 'light')!.src).toBe(
      'https://files.cofabri.com/logos/cofabri/png/cofabri-lockup-light-sm-1856.png'
    );
    expect(cofabriPngAsset('lockup-sm', 'dark')!.src).toBe(
      'https://files.cofabri.com/logos/cofabri/png/cofabri-lockup-dark-sm-1856.png'
    );
  });

  it('resolves the mark at the host root (not under /png/), sized to the mark PNG master', () => {
    const asset = cofabriPngAsset('mark', 'light');
    expect(asset).toEqual({
      src: 'https://files.cofabri.com/logos/cofabri/mark-1024-light.png',
      width: 1024,
      height: 1024,
    });
  });

  it('treats mark-small identically to mark for asset resolution', () => {
    expect(cofabriPngAsset('mark-small', 'dark')).toEqual(cofabriPngAsset('mark', 'dark'));
  });

  it('returns null for mono tones on the mark cut — no mono mark master exists', () => {
    expect(cofabriPngAsset('mark', 'mono-ink')).toBeNull();
    expect(cofabriPngAsset('mark', 'mono-white')).toBeNull();
    expect(cofabriPngAsset('mark', 'mono-black')).toBeNull();
    expect(cofabriPngAsset('mark-small', 'mono-black')).toBeNull();
  });
});
