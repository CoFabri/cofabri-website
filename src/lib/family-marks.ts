// The product tiles for CoFabri's own products (CRM, Marketing, Concierge).
// Not the CoFabri diamond or blackletter: a rounded square, a gradient and a
// line icon. One definition feeds the FamilyMark component and the exported
// SVG files in public/brand (for apps.favicon_url).

export interface FamilyMarkDef {
  appId: string;
  label: string;
  /** Gradient stops, lighter first (top left). */
  from: string;
  to: string;
  /** Stroke colour of the icon. */
  icon: string;
  /** Icon path data, 24-unit viewBox, stroke only. */
  path: string;
}

export const FAMILY_MARKS: Record<string, FamilyMarkDef> = {
  'cofabri-crm': {
    appId: 'cofabri-crm',
    label: 'CoFabri CRM',
    from: '#5C7699',
    to: '#4B6585',
    icon: '#CFE4FF',
    path: 'M6 5h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 6 5z M11 10.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0z M6.25 15.75c.55-1.35 1.6-2.1 2.75-2.1s2.2.75 2.75 2.1 M14.25 10h3.5 M14.25 13.5h2.25',
  },
  'cofabri-marketing': {
    appId: 'cofabri-marketing',
    label: 'CoFabri Marketing',
    from: '#8A6973',
    to: '#785861',
    icon: '#FFD8D0',
    path: 'M4.5 9.75h2.75L13.5 6v12l-6.25-3.75H4.5a1 1 0 0 1-1-1v-2.5a1 1 0 0 1 1-1z M7.25 14.25 8.5 19 M16.75 9.5a3.5 3.5 0 0 1 0 5 M19.25 7.25a6.75 6.75 0 0 1 0 9.5',
  },
  'cofabri-concierge': {
    appId: 'cofabri-concierge',
    label: 'CoFabri Concierge',
    from: '#706A90',
    to: '#5E5A7E',
    icon: '#E4DDFF',
    path: 'M6.5 4.75h11a3 3 0 0 1 3 3v5.5a3 3 0 0 1-3 3h-5l-4.25 3.5v-3.5H6.5a3 3 0 0 1-3-3v-5.5a3 3 0 0 1 3-3z M8.5 10.5h.01 M12 10.5h.01 M15.5 10.5h.01',
  },
};

/** Pixel size of a tile. The design uses 24, 36, 44 and 56 in the UI, and larger on /services. */
export type FamilyMarkSize = number;

export function hasFamilyMark(appId: string | undefined): boolean {
  return !!appId && appId in FAMILY_MARKS;
}

/** Stroke width in icon units: heavier at 24px so the line stays visible. */
export function markStrokeWidth(size: FamilyMarkSize): number {
  return size <= 24 ? 2.3 : 1.9;
}

/** Share of the tile the icon fills. */
export function markIconScale(size: FamilyMarkSize): number {
  return size <= 24 ? 0.66 : 0.6;
}

/** Standalone SVG for a tile, used for the files in public/brand. */
export function familyMarkSvg(def: FamilyMarkDef): string {
  const tile = 96;
  const scale = (tile * markIconScale(56)) / 24;
  const offset = (tile - tile * markIconScale(56)) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tile} ${tile}" width="${tile}" height="${tile}" role="img" aria-label="${def.label}">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${def.from}"/><stop offset="1" stop-color="${def.to}"/></linearGradient></defs>`,
    `<rect width="${tile}" height="${tile}" rx="${Math.round(tile * 0.23)}" fill="url(#g)"/>`,
    `<g transform="translate(${+offset.toFixed(2)} ${+offset.toFixed(2)}) scale(${+scale.toFixed(3)})" fill="none" stroke="${def.icon}" stroke-width="${markStrokeWidth(56)}" stroke-linecap="round" stroke-linejoin="round"><path d="${def.path}"/></g>`,
    `</svg>`,
    '',
  ].join('\n');
}
