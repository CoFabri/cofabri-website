// src/components/developer-portal/AppMonogram.tsx
//
// Shared app-branding badge: real logo/favicon when the app has one,
// otherwise a deterministic-color initial letter. Used by both the
// /developers directory cards and the per-app docs render, which don't
// share the same underlying app type (one comes from the authenticated
// account-apps API, the other from the public content API) -- takes only
// the fields either shape actually has.

import Image from 'next/image';
import { monogramClassesFor } from './app-monogram-palette';

interface AppMonogramProps {
  appId: string;
  appName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  size?: number;
}

export function AppMonogram({ appId, appName, logoUrl, faviconUrl, size = 44 }: AppMonogramProps) {
  const logo = faviconUrl ?? logoUrl;
  const radius = size <= 32 ? 'rounded-lg' : 'rounded-[10px]';

  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 ${radius} object-contain bg-secondary`}
        style={{ width: size, height: size }}
      />
    );
  }

  const { bg, fg } = monogramClassesFor(appId);
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${radius} font-semibold tracking-tight ${bg} ${fg}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.4)) }}
    >
      {appName.charAt(0).toUpperCase()}
    </div>
  );
}
