import Image from 'next/image';
import { hasFamilyMark } from '@/lib/family-marks';
import { markPalette } from '@/lib/app-display';
import FamilyMark from './FamilyMark';

interface AppTileProps {
  app: { id: string; name: string; faviconUrl?: string };
  size?: number;
}

/**
 * A small tile for an app, decorative (the name always sits beside it): CoFabri's own products use
 * their FamilyMark; any other app uses its favicon, or its initial on a colour.
 */
export default function AppTile({ app, size = 24 }: AppTileProps) {
  if (hasFamilyMark(app.id)) return <FamilyMark appId={app.id} size={size} />;
  const radius = '23%';
  if (app.faviconUrl) {
    return (
      <span aria-hidden="true" data-app-tile={app.id} className="relative inline-block shrink-0 overflow-hidden border border-border bg-secondary" style={{ width: size, height: size, borderRadius: radius }}>
        <Image src={app.faviconUrl} alt="" fill sizes={`${size}px`} className="object-contain" unoptimized={process.env.NODE_ENV === 'development'} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      data-app-tile={app.id}
      className={`inline-flex shrink-0 items-center justify-center font-semibold ${markPalette(app.id)}`}
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.5) }}
    >
      {app.name.charAt(0).toUpperCase()}
    </span>
  );
}
