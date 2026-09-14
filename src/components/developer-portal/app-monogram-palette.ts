// src/components/developer-portal/app-monogram-palette.ts
//
// Deterministic tint per app_id for the fallback monogram when an app has
// no logo/favicon -- same app always gets the same color, no per-render
// randomness.

const PALETTE = [
  { bg: 'bg-accent', fg: 'text-primary' },
  { bg: 'bg-success/15', fg: 'text-success' },
  { bg: 'bg-warning/15', fg: 'text-warning' },
  { bg: 'bg-secondary', fg: 'text-foreground' },
];

export function monogramClassesFor(appId: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < appId.length; i += 1) {
    hash = (hash * 31 + appId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
