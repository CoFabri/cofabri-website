// src/lib/developer-portal/types.ts

export interface DeveloperPortalApp {
  appId: string;
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  appUrl: string | null;
  description: string | null;
  apiDocsUrl: string | null;
}
