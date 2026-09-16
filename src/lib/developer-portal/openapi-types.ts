// src/lib/developer-portal/openapi-types.ts
//
// Loose types for the subset of OpenAPI 3.1 a linked app's /openapi.json is
// expected to contain. Deliberately permissive (most fields optional) --
// this renders whatever a real spec actually has rather than assuming every
// app's generator fills in every field the same way.

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  enum?: (string | number | boolean)[];
  const?: string | number | boolean;
  default?: unknown;
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
}

export interface OpenApiParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: OpenApiSchema }> }>;
}

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  tags?: { name: string; description?: string }[];
  components?: {
    securitySchemes?: Record<string, { type: string; scheme?: string; in?: string; name?: string; description?: string }>;
    schemas?: Record<string, OpenApiSchema>;
  };
  paths: Record<string, Record<string, OpenApiOperation>>;
}

export interface SpecEndpoint {
  method: string;
  path: string;
  operation: OpenApiOperation;
}

/** Flattens spec.paths into a list, sorted by tag then path -- the shape every render component actually wants to iterate. */
export function flattenEndpoints(spec: OpenApiDocument): SpecEndpoint[] {
  const out: SpecEndpoint[] = [];
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      out.push({ method, path, operation });
    }
  }
  return out;
}

export function groupByTag(endpoints: SpecEndpoint[]): { tag: string; endpoints: SpecEndpoint[] }[] {
  const order: string[] = [];
  const byTag = new Map<string, SpecEndpoint[]>();
  for (const e of endpoints) {
    const tag = e.operation.tags?.[0] || 'Other';
    if (!byTag.has(tag)) {
      byTag.set(tag, []);
      order.push(tag);
    }
    byTag.get(tag)!.push(e);
  }
  return order.map((tag) => ({ tag, endpoints: byTag.get(tag)! }));
}
