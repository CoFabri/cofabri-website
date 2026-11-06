import { describe, expect, it } from 'vitest';
import type { OpenApiDocument } from './openapi-types';
import { REDACTED, listStripped, sanitizePublicSpec, sanitizePublicSpecWithReport } from './spec-audit';

const MOS_KEY = `mos_k3x9q2ab_${'A'.repeat(43)}`;
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.c2lnbmF0dXJlc2ln';

function base(extra: Partial<OpenApiDocument> = {}): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'T', version: '1', description: 'Send `Authorization: Bearer mos_<prefix>_<secret>`.' },
    servers: [{ url: '/' }],
    tags: [{ name: 'Tasks' }],
    paths: {
      '/tasks': { get: { operationId: 'listTasks', tags: ['Tasks'], summary: 'List' }, post: { operationId: 'createTask', tags: ['Tasks'] } },
    },
    ...extra,
  };
}

describe('sanitizePublicSpec: clean specs', () => {
  it('returns the very same object when there is nothing to strip', () => {
    const spec = base();
    const out = sanitizePublicSpec(spec);
    expect(out).toBe(spec);
    expect(listStripped(spec)).toEqual([]);
  });

  it('leaves placeholder keys, example uuids and example emails alone', () => {
    const spec = base({
      components: { schemas: { X: { type: 'string', description: 'dana@northwind.example', default: '3f1c0c9e-5a3b-4a4e-9a52-1b7f3c0d2a10' } } },
    });
    expect(sanitizePublicSpec(spec)).toBe(spec);
  });

  it('does not mutate its input', () => {
    const spec = base();
    spec.paths['/internal/x'] = { get: { operationId: 'x' } };
    const snapshot = JSON.stringify(spec);
    sanitizePublicSpec(spec);
    expect(JSON.stringify(spec)).toBe(snapshot);
  });

  it('tolerates a malformed document', () => {
    const bad = { openapi: '3.1.0', info: { title: 'x', version: '1' } } as unknown as OpenApiDocument;
    expect(sanitizePublicSpec(bad)).toBe(bad);
  });
});

describe('sanitizePublicSpec: hidden operations and paths', () => {
  it.each([
    ['x-internal', { 'x-internal': true }],
    ['x-hidden', { 'x-hidden': true }],
    ['x-staff-only', { 'x-staff-only': true }],
    ['Internal tag', { tags: ['Internal'] }],
    ['Platform tag', { tags: ['platform'] }],
    ['Staff tag', { tags: [' Staff '] }],
    ['operationId prefix', { operationId: 'internalSync' }],
    ['operationId snake', { operationId: 'platform_admin_list' }],
  ])('drops an operation marked by %s and keeps its siblings', (_name, marks) => {
    const spec = base();
    spec.paths['/tasks'] = { ...spec.paths['/tasks'], delete: { operationId: 'deleteX', ...marks } as never };
    const { spec: out, stripped } = sanitizePublicSpecWithReport(spec);
    expect(Object.keys(out.paths['/tasks'])).toEqual(['get', 'post']);
    expect(stripped).toHaveLength(1);
    expect(stripped[0]).toMatchObject({ kind: 'operation', where: 'DELETE /tasks' });
  });

  it('drops a path item whose operations are all hidden', () => {
    const spec = base();
    spec.paths['/ops'] = { get: { tags: ['Internal'] }, post: { 'x-hidden': true } as never };
    const out = sanitizePublicSpec(spec);
    expect(out.paths['/ops']).toBeUndefined();
    expect(out.paths['/tasks']).toBeDefined();
  });

  it('drops a path by segment and by path-level extension', () => {
    const spec = base();
    spec.paths['/api/internal/jobs'] = { get: { operationId: 'jobs' } };
    spec.paths['/api/cron/daily'] = { get: {} };
    spec.paths['/api/debug'] = { get: {} };
    spec.paths['/api/staff/users'] = { get: {} };
    spec.paths['/hidden'] = { 'x-internal': true, get: {} } as never;
    const { spec: out, stripped } = sanitizePublicSpecWithReport(spec);
    expect(Object.keys(out.paths)).toEqual(['/tasks']);
    expect(stripped.filter((s) => s.kind === 'path')).toHaveLength(5);
  });

  it('does not match segments by substring', () => {
    const spec = base();
    spec.paths['/internalization'] = { get: { operationId: 'internationalize' } };
    spec.paths['/staffing'] = { get: {} };
    expect(sanitizePublicSpec(spec)).toBe(spec);
  });

  it('keeps non-operation keys of a path item (parameters)', () => {
    const spec = base();
    spec.paths['/a'] = { parameters: [{ name: 'id', in: 'path' }], get: {}, post: { tags: ['Staff'] } } as never;
    const out = sanitizePublicSpec(spec);
    expect(Object.keys(out.paths['/a'])).toEqual(['parameters', 'get']);
  });

  it('only treats x- flags that are truthy as hidden', () => {
    const spec = base();
    spec.paths['/ok'] = { get: { 'x-internal': false } as never };
    expect(sanitizePublicSpec(spec)).toBe(spec);
  });

  it('removes hidden tag declarations', () => {
    const spec = base({ tags: [{ name: 'Tasks' }, { name: 'Internal' }, { name: 'Platform' }] });
    const { spec: out, stripped } = sanitizePublicSpecWithReport(spec);
    expect(out.tags).toEqual([{ name: 'Tasks' }]);
    expect(stripped.map((s) => s.where)).toEqual(['Internal', 'Platform']);
  });
});

describe('sanitizePublicSpec: secret redaction', () => {
  const cases: [string, string, string][] = [
    ['stripe live', 'key sk_live_51Habcdefghijkl here', 'key [redacted] here'],
    ['stripe test', 'sk_test_abcdefgh12345678', REDACTED],
    ['restricted live', 'rk_live_abcdefgh12345678', REDACTED],
    ['MavenOS key', `use ${MOS_KEY}`, `use ${REDACTED}`],
    ['JWT', `token ${JWT}`, `token ${REDACTED}`],
    ['supabase secret', 'sb_secret_abcdefghijklmnopqrstu', REDACTED],
    ['long bearer', 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123456789', `Authorization: Bearer ${REDACTED}`],
  ];
  it.each(cases)('redacts %s', (_n, input, expected) => {
    const spec = base();
    spec.paths['/tasks'].get.description = input;
    const { spec: out, stripped } = sanitizePublicSpecWithReport(spec);
    expect(out.paths['/tasks'].get.description).toBe(expected);
    expect(stripped.some((s) => s.kind === 'secret' && s.where === '/paths//tasks/get/description')).toBe(true);
  });

  it('keeps the documented Bearer placeholder and short bearer words', () => {
    const spec = base();
    spec.paths['/tasks'].get.description = 'Send Bearer mos_<prefix>_<secret>, or Bearer tokens in general. Prefix mos_k3x9q2ab is fine.';
    expect(sanitizePublicSpec(spec)).toBe(spec);
  });

  it('redacts inside examples, defaults and servers anywhere in the document', () => {
    const spec = base({
      servers: [{ url: 'https://x.test', description: `admin ${JWT}` }],
      components: { schemas: { K: { type: 'string', default: 'sk_live_abcdefgh12345678', description: 'ok' } } },
    });
    (spec.paths['/tasks'].post as Record<string, unknown>).example = { nested: [{ key: MOS_KEY }] };
    const { spec: out, stripped } = sanitizePublicSpecWithReport(spec);
    const text = JSON.stringify(out);
    expect(text).not.toContain('sk_live_');
    expect(text).not.toContain(JWT);
    expect(text).not.toContain(MOS_KEY);
    expect(stripped.filter((s) => s.kind === 'secret')).toHaveLength(3);
  });

  it('never puts the secret value in the report', () => {
    const spec = base();
    spec.paths['/tasks'].get.description = MOS_KEY;
    expect(JSON.stringify(listStripped(spec))).not.toContain('AAAA');
  });

  it('shares unchanged subtrees with the input', () => {
    const spec = base();
    spec.paths['/tasks'].get.description = 'sk_test_abcdefgh12345678';
    const out = sanitizePublicSpec(spec);
    expect(out.paths['/tasks'].post).toBe(spec.paths['/tasks'].post);
    expect(out.info).toBe(spec.info);
  });
});
