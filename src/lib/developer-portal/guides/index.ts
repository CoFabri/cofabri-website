// src/lib/developer-portal/guides/index.ts

import type { AppGuide } from './types';
import { rxBridgeGuide } from './rx-bridge';

const GUIDES: Record<string, AppGuide> = {
  'rx-bridge': rxBridgeGuide,
};

export function getAppGuide(appId: string): AppGuide | null {
  return GUIDES[appId] ?? null;
}
