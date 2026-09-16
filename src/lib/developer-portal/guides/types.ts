// src/lib/developer-portal/guides/types.ts
//
// Per-app "Getting started" narrative content -- the conceptual material
// (auth model, rate limits, pagination, naming conventions...) that isn't
// mechanically derivable from an OpenAPI spec's paths/schemas. Per-endpoint
// reference content is NOT part of this: it's generated fresh from the
// app's real /openapi.json instead of hand-copied here, so it can't drift
// from the real route code the way a second hand-maintained copy would.

export interface GuideTable {
  headers: string[];
  rows: string[][];
}

export interface GuideBlock {
  kind: 'paragraph' | 'code' | 'table' | 'note';
  text?: string;
  code?: string;
  language?: string;
  table?: GuideTable;
  tone?: 'info' | 'warning';
}

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface AppGuide {
  appId: string;
  intro: string;
  sections: GuideSection[];
}
