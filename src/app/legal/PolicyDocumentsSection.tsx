import Link from 'next/link';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { filterPolicyGroups, type PolicyGroup } from '@/lib/policy-groups';

export function formatPolicyDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

interface PolicyDocumentsSectionProps {
  groups: PolicyGroup[];
  search: string;
}

export default function PolicyDocumentsSection({ groups, search }: PolicyDocumentsSectionProps) {
  const visibleGroups = filterPolicyGroups(groups, search);
  if (visibleGroups.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="legal-documents-heading">
      <h2
        id="legal-documents-heading"
        className="m-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground"
      >
        Documents
      </h2>
      {visibleGroups.map((group) => (
        <div key={group.appId} className="mt-8">
          <h3 className="m-0 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-faint">
            {group.appName}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.policies.map((policy) => (
              <Link
                key={`${group.appId}-${policy.slug}`}
                href={`/legal/${policy.slug}`}
                className="block rounded-xl border border-border p-6 text-foreground transition-all duration-200 hover:-translate-y-px hover:border-ink-disabled"
              >
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  {group.appName}
                </span>
                <h4 className="m-0 mt-4 text-lg font-semibold leading-[1.35] tracking-[-0.015em] text-foreground">
                  {policy.title}
                </h4>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-faint">Version</span>
                    <span className="font-mono text-ink-body">{policy.versionNumber}</span>
                  </div>
                  {formatPolicyDate(policy.publishedAt) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-faint">Last Updated</span>
                      <span className="font-mono text-ink-body">{formatPolicyDate(policy.publishedAt)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <span className="text-[15px] font-semibold text-primary">Read Document →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
