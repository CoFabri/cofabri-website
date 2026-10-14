import { Suspense } from 'react';
import { CoreLoader } from '@/components/ui/core-loader';
import { getApps, getPolicies } from '@/lib/api-client';
import { groupPoliciesByApp } from '@/lib/policy-groups';
import LegalDocumentsContent from './LegalDocumentsContent';
import { metadata } from './metadata';

// Export metadata
export { metadata };

export default async function LegalDocumentsPage() {
  // Both helpers swallow API failures, so /legal still renders with only the old list.
  const [policies, apps] = await Promise.all([getPolicies(), getApps().catch(() => [])]);
  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  const policyGroups = groupPoliciesByApp(policies, appNames);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CoreLoader size={52} />
      </div>
    }>
      <LegalDocumentsContent policyGroups={policyGroups} />
    </Suspense>
  );
}
