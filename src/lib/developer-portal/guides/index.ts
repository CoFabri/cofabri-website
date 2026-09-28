// src/lib/developer-portal/guides/index.ts

import type { AppGuide } from './types';
import { rxBridgeGuide } from './rx-bridge';
import { praxisGuide } from './praxis';

const GUIDES: Record<string, AppGuide> = {
  'rx-bridge': rxBridgeGuide,
  praxis: praxisGuide,
};

export function getAppGuide(appId: string): AppGuide | null {
  return GUIDES[appId] ?? null;
}
