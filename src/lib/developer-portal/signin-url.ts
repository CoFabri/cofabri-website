// src/lib/developer-portal/signin-url.ts

import { DEVELOPER_PORTAL_APP_ID } from './session';

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

// Requires cofabri-website to be provisioned as its own app_id in
// cofabri-api (own Supabase project, apps.login_redirect_url pointing at
// /developers/callback) -- not something this code can do. Until that
// exists, this link 404s at cofabri-api, same as any unregistered app_id.
export function getDeveloperPortalSigninUrl(): string {
  if (!COFABRI_API_BASE_URL) {
    throw new Error('COFABRI_API_BASE_URL is not configured');
  }
  return `${COFABRI_API_BASE_URL}/web/signin/${DEVELOPER_PORTAL_APP_ID}`;
}
