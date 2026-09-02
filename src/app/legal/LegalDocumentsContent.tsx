'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CoreLoader } from '@/components/ui/core-loader';
import { LegalDocument } from '@/lib/api-client';
import { filterPillClasses } from '@/lib/filter-pill';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import PageHero from '@/components/marketing/PageHero';
import RevealSection from '@/components/marketing/RevealSection';
import { EmptyState } from '@/components/marketing/EmptyState';
import { ErrorState } from '@/components/marketing/ErrorState';
import { Pagination } from '@/components/marketing/Pagination';

const DOCUMENTS_PER_PAGE = 6;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusDotClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-success';
    case 'draft':
      return 'bg-warning';
    case 'archived':
      return 'bg-ink-disabled';
    default:
      return 'bg-ink-disabled';
  }
}

function statusTextClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-success';
    case 'draft':
      return 'text-warning';
    default:
      return 'text-ink-faint';
  }
}

export default function LegalDocumentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(searchParams?.get('type') || '');
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/legal', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch legal documents');
      setDocuments((await response.json()) as LegalDocument[]);
    } catch (err) {
      console.error('Error loading legal documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load legal documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const documentTypes = useMemo(() => Array.from(new Set(documents.map((d) => d.documentType))), [documents]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const q = searchInput.trim().toLowerCase();
        const matchesSearch = !q || doc.title.toLowerCase().includes(q) || doc.documentType.toLowerCase().includes(q);
        const matchesType = !selectedType || doc.documentType === selectedType;
        return matchesSearch && matchesType;
      }),
    [documents, searchInput, selectedType]
  );

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE));
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * DOCUMENTS_PER_PAGE,
    currentPage * DOCUMENTS_PER_PAGE
  );

  const updateURL = (newType?: string, newSearch?: string) => {
    const params = new URLSearchParams();
    if (newType) params.set('type', newType);
    if (newSearch) params.set('search', newSearch);
    const queryString = params.toString();
    router.push(queryString ? `${pathname || ''}?${queryString}` : pathname || '');
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
    updateURL(type || undefined, searchInput || undefined);
  };

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setCurrentPage(1);
    updateURL(selectedType || undefined, search || undefined);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedType('');
    setCurrentPage(1);
    updateURL(undefined, undefined);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Legal', href: '/legal' }]} />
      </div>

      <PageHero
        eyebrow="Legal"
        title="The paperwork."
        subtitle="Terms, privacy, and processing agreements for every app. Current versions only."
        right={
          <div className="relative w-full sm:w-[400px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search documents"
              className="h-14 w-full rounded-[10px] border border-border-strong bg-background pl-12 pr-4 text-[17px] text-foreground placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        }
      />

      {documentTypes.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-4 border-b border-border pb-8">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
            <DocumentTextIcon className="h-4 w-4" />
            Filter
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleTypeChange('')} className={filterPillClasses(selectedType === '')}>
              All types
            </button>
            {documentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={filterPillClasses(selectedType === type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      <RevealSection>
      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <CoreLoader size={40} />
        </div>
      ) : error ? (
        <div className="mt-16">
          <ErrorState title="Couldn't load legal documents" description={error} onRetry={fetchDocuments} />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            title="No documents match"
            description="Try a different search term, or clear the type filter."
            action={{ label: 'Clear Filters', onClick: clearFilters }}
          />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedDocuments.map((doc) => {
              const card = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                      {doc.documentType}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusTextClasses(doc.status)}`}>
                      <span className={`block h-1.5 w-1.5 rounded-full ${statusDotClasses(doc.status)}`} />
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  <h4 className="m-0 mt-4 text-lg font-semibold leading-[1.35] tracking-[-0.015em] text-foreground">
                    {doc.title}
                  </h4>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-faint">Version</span>
                      <span className="font-mono text-ink-body">{doc.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-faint">Updated</span>
                      <span className="font-mono text-ink-body">{formatDate(doc.lastUpdated)}</span>
                    </div>
                    {doc.associatedApp && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-faint">Applies to</span>
                        <span className="font-mono text-ink-body">{doc.associatedApp}</span>
                      </div>
                    )}
                  </div>
                  {doc.documentUrl && (
                    <div className="mt-5 border-t border-border pt-4">
                      <span className="text-[15px] font-semibold text-primary">Read document →</span>
                    </div>
                  )}
                </>
              );

              return doc.documentUrl ? (
                <a
                  key={doc.id}
                  href={doc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border p-6 text-foreground transition-all duration-200 hover:-translate-y-px hover:border-ink-disabled"
                >
                  {card}
                </a>
              ) : (
                <div key={doc.id} className="rounded-xl border border-border p-6 text-foreground">
                  {card}
                </div>
              );
            })}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      </RevealSection>
    </div>
  );
}
