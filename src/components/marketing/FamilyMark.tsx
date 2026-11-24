import { FAMILY_MARKS, markIconScale, markStrokeWidth, type FamilyMarkSize } from '@/lib/family-marks';

interface FamilyMarkProps {
  appId: string;
  size?: FamilyMarkSize;
  className?: string;
}

/**
 * Product tile for CoFabri's own products. Decorative (aria-hidden): the
 * product name always sits beside it. Renders nothing for an app without a tile.
 */
export default function FamilyMark({ appId, size = 36, className = '' }: FamilyMarkProps) {
  const def = FAMILY_MARKS[appId];
  if (!def) return null;
  const icon = Math.round(size * markIconScale(size));
  return (
    <span
      aria-hidden="true"
      data-family-mark={appId}
      className={`inline-flex shrink-0 items-center justify-center dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] ${className}`}
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
        strokeWidth={markStrokeWidth(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={def.path} />
      </svg>
    </span>
  );
}
