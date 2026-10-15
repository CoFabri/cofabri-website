import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  getApps: vi.fn(),
  getPolicies: vi.fn(),
  getPolicy: vi.fn(async () => ({ slug: 'privacy', title: 'Privacy Policy', versionNumber: 2, apps: [], policyType: 'privacy', body: '' })),
}));
vi.mock('@/lib/status-api', () => ({ getSystemStatus: vi.fn(), getServiceUptimeHistory: vi.fn() }));
vi.mock('@/components/marketing/StatusPageContent', () => ({ StatusPageContent: () => null }));
vi.mock('./support/SupportPageContent', () => ({ default: () => null }));
vi.mock('./legal/LegalDocumentsContent', () => ({ default: () => null }));

import { metadata as supportMetadata } from './support/page';
import { metadata as statusMetadata } from './status/page';
import { metadata as legalMetadata } from './legal/page';
import { generateMetadata as legalDocMetadata } from './legal/[slug]/page';

const noindex = { index: false, follow: true };

describe('noindex pages', () => {
  it('keeps /support, /status and /legal out of the index but followable', () => {
    expect(supportMetadata.robots).toEqual(noindex);
    expect(statusMetadata.robots).toEqual(noindex);
    expect(legalMetadata.robots).toEqual(noindex);
  });

  it('keeps individual legal documents out of the index', async () => {
    const m = await legalDocMetadata({ params: Promise.resolve({ slug: 'privacy' }) });
    expect(m.robots).toEqual(noindex);
  });
});
