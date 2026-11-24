import { FAMILY_MARKS, markIconScale, markStrokeWidth, type FamilyMarkSize } from '@/lib/family-marks';

interface FamilyMarkProps {
  appId: string;
  size?: FamilyMarkSize;
  /** Overrides the default stroke (the large tiles on /services use 1.6). */
  strokeWidth?: number;
  /** On the dark ink surface: a 1px inner edge in both themes, plus a soft drop shadow. */
  ink?: boolean;
  className?: string;
}

/**
 * Product tile for CoFabri's own products. Decorative (aria-hidden): the
 * product name always sits beside it. Renders nothing for an app without a tile.
 */
export default function FamilyMark({ appId, size = 36, strokeWidth, ink = false, className = '' }: FamilyMarkProps) {
  const def = FAMILY_MARKS[appId];
  if (!def) return null;
  const icon = Math.round(size * markIconScale(size));
  const edge = ink
    ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_14px_30px_-10px_rgba(0,0,0,0.55)]'
    : 'dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]';
  return (
    <span
      aria-hidden="true"
      data-family-mark={appId}
      className={`inline-flex shrink-0 items-center justify-center ${edge} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '23%',
        backgroundImage: `linear-gradient(135deg in oklch, ${def.from}, ${def.to})`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={icon}
        height={icon}
        fill="none"
        stroke={def.icon}
        strokeWidth={strokeWidth ?? markStrokeWidth(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={def.path} />
      </svg>
    </span>
  );
}

/** Just the tile's line icon, in any colour, for large decorative watermarks. */
export function FamilyMarkIcon({
  appId,
  size,
  color,
  strokeWidth = 1.1,
  className = '',
}: {
  appId: string;
  size: number;
  color: string;
  strokeWidth?: number;
  className?: string;
}) {
  const def = FAMILY_MARKS[appId];
  if (!def) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={def.path} />
    </svg>
  );
}
