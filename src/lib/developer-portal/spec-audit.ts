// src/lib/developer-portal/spec-audit.ts
//
// A pure, defensive, renderer-side filter for a linked app's OpenAPI document. An app's own generator is the first line of
// defence; this is the second: before the public developer portal renders a spec it drops anything marked internal / staff /
// platform / admin-only / hidden and redacts values that look like real secrets. A spec with nothing to strip is returned
// untouched (the very same object), so apps with clean specs are unaffected.

import type { OpenApiDocument, OpenApiOperation } from './openapi-types';

export type StrippedKind = 'path' | 'operation' | 'tag' | 'secret';

export interface StrippedItem {
  kind: StrippedKind;
  /** Where: a path, "METHOD path", a tag name, or a JSON-pointer-ish location for a secret. */
  where: string;
  /** Why: the rule that matched (never the secret value itself). */
  reason: string;
}

export interface SanitizeResult {
  spec: OpenApiDocument;
  stripped: StrippedItem[];
}

export const REDACTED = '[redacted]';

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

/** Tags (case-insensitive, trimmed) that mark an operation as not for the public. */
const HIDDEN_TAGS = new Set(['internal', 'platform', 'staff', 'platform admin', 'platform-admin', 'admin only', 'admin-only', 'hidden']);

/** Path segments that mark a route as not for the public. */
const HIDDEN_SEGMENTS = new Set(['internal', 'staff', 'platform-admin', 'platform_admin', 'cron', 'debug']);

/** operationId prefixes (camelCase or snake/kebab) that mark an operation as not for the public. */
const HIDDEN_OPERATION_ID = /^(internal|staff|platformAdmin|platform[_-]admin|cron|debug)(?![a-z])/;

/** Extension keys that, when truthy, mark a path item or operation as not for the public. */
const HIDDEN_EXTENSIONS = ['x-internal', 'x-hidden', 'x-staff-only', 'x-platform-admin', 'x-admin-only', 'x-private'];

interface SecretRule {
  name: string;
  pattern: RegExp;
}

// Placeholders such as `Bearer mos_<prefix>_<secret>` are documentation and must survive: every rule requires a run of real
// token characters, and `<` / `>` are not token characters.
const SECRET_RULES: SecretRule[] = [
  { name: 'stripe secret key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/g },
  { name: 'MavenOS API key', pattern: /\bmos_[a-z0-9]{8}_[A-Za-z0-9_-]{43}\b/g },
  { name: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g },
  { name: 'Supabase secret key', pattern: /\b(?:sb_secret_[A-Za-z0-9_-]{16,}|sbp_[a-f0-9]{40})\b/g },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Slack token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'long bearer token', pattern: /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{24,}/gi },
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hiddenByExtension(node: Record<string, unknown>): string | null {
  for (const key of HIDDEN_EXTENSIONS) {
    const v = node[key];
    if (v === true || v === 'true') return key;
  }
  return null;
}

function hiddenPathSegment(path: string): string | null {
  for (const raw of path.split('/')) {
    const seg = raw.toLowerCase();
    if (HIDDEN_SEGMENTS.has(seg)) return `path segment "${seg}"`;
  }
  return null;
}

function operationReason(path: string, op: OpenApiOperation): string | null {
  const ext = hiddenByExtension(op as unknown as Record<string, unknown>);
  if (ext) return ext;
  const tag = (op.tags ?? []).find((t) => typeof t === 'string' && HIDDEN_TAGS.has(t.trim().toLowerCase()));
  if (tag) return `tag "${tag}"`;
  if (typeof op.operationId === 'string' && HIDDEN_OPERATION_ID.test(op.operationId)) return `operationId "${op.operationId}"`;
  return hiddenPathSegment(path);
}

/** Redacts secret-like substrings of one string. Returns the same string when nothing matched. */
function redactString(value: string, where: string, stripped: StrippedItem[]): string {
  let out = value;
  for (const rule of SECRET_RULES) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(out)) continue;
    rule.pattern.lastIndex = 0;
    out = out.replace(rule.pattern, (_m, prefix?: unknown) => (typeof prefix === 'string' ? prefix : '') + REDACTED);
    stripped.push({ kind: 'secret', where, reason: rule.name });
  }
  return out;
}

/** Deep-walks a JSON value, redacting strings. Returns the same reference for any subtree that did not change. */
function redactDeep(node: unknown, where: string, stripped: StrippedItem[]): unknown {
  if (typeof node === 'string') return redactString(node, where, stripped);
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((item, i) => {
      const r = redactDeep(item, `${where}/${i}`, stripped);
      if (r !== item) changed = true;
      return r;
    });
    return changed ? next : node;
  }
  if (isPlainObject(node)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      const r = redactDeep(v, `${where}/${k}`, stripped);
      if (r !== v) changed = true;
      next[k] = r;
    }
    return changed ? next : node;
  }
  return node;
}

/** Sanitizes a spec and reports what was stripped. Never mutates the input. */
export function sanitizePublicSpecWithReport(spec: OpenApiDocument): SanitizeResult {
  const stripped: StrippedItem[] = [];
  if (!isPlainObject(spec) || !isPlainObject(spec.paths)) return { spec, stripped };

  // 1. Drop hidden paths and operations.
  let pathsChanged = false;
  const nextPaths: OpenApiDocument['paths'] = {};
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!isPlainObject(item)) {
      nextPaths[path] = item;
      continue;
    }
    const pathReason = hiddenByExtension(item) ?? hiddenPathSegment(path);
    if (pathReason) {
      stripped.push({ kind: 'path', where: path, reason: pathReason });
      pathsChanged = true;
      continue;
    }
    let itemChanged = false;
    let keptOperations = 0;
    const nextItem: Record<string, OpenApiOperation> = {};
    for (const [key, value] of Object.entries(item)) {
      if (!HTTP_METHODS.has(key.toLowerCase()) || !isPlainObject(value)) {
        nextItem[key] = value as OpenApiOperation;
        continue;
      }
      const reason = operationReason(path, value as OpenApiOperation);
      if (reason) {
        stripped.push({ kind: 'operation', where: `${key.toUpperCase()} ${path}`, reason });
        itemChanged = true;
        continue;
      }
      keptOperations += 1;
      nextItem[key] = value as OpenApiOperation;
    }
    if (!itemChanged) {
      nextPaths[path] = item;
    } else if (keptOperations > 0) {
      nextPaths[path] = nextItem;
      pathsChanged = true;
    } else {
      pathsChanged = true; // every operation was stripped: drop the empty path item
    }
  }

  let working: OpenApiDocument = pathsChanged ? { ...spec, paths: nextPaths } : spec;

  // 2. Drop hidden tag declarations.
  if (Array.isArray(working.tags)) {
    const keptTags = working.tags.filter((t) => {
      const hidden = typeof t?.name === 'string' && HIDDEN_TAGS.has(t.name.trim().toLowerCase());
      if (hidden) stripped.push({ kind: 'tag', where: t.name, reason: 'hidden tag' });
      return !hidden;
    });
    if (keptTags.length !== working.tags.length) working = { ...working, tags: keptTags };
  }

  // 3. Redact secret-like strings anywhere in the document.
  const redacted = redactDeep(working, '', stripped) as OpenApiDocument;
  return { spec: redacted, stripped };
}

/** The renderer-side filter: a spec with nothing to strip comes back as the very same object. */
export function sanitizePublicSpec(spec: OpenApiDocument): OpenApiDocument {
  return sanitizePublicSpecWithReport(spec).spec;
}

/** What sanitizePublicSpec would strip, for tests and logging. Values are never included, only locations and rules. */
export function listStripped(spec: OpenApiDocument): StrippedItem[] {
  return sanitizePublicSpecWithReport(spec).stripped;
}
