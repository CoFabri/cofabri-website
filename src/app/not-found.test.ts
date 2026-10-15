import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({ getApps: vi.fn(), getKnowledgeBaseArticles: vi.fn() }));
vi.mock('@/lib/status-api', () => ({ getSystemStatus: vi.fn() }));

import { metadata } from './not-found';

describe('not-found metadata', () => {
  it('is noindex with its own title and no canonical', () => {
    expect(metadata.title).toBe('Page Not Found');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
  });
});
