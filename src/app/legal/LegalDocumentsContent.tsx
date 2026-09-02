'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CoreLoader } from '@/components/ui/core-loader';
import { LegalDocument } from '@/lib/api-client';
import { filterPillClasses } from '@/lib/filter-pill';
import Breadcrumbs from '@/components/marketing/Breadcrumbs';
import PageHero from '@/components/marketing/PageHero';
import RevealSection from '@/components/marketing/RevealSection';

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
  const [selectedType, setSelectedType] = useState(searchParams?.get('type') || '');
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchDocuments() {
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
      } catch (error) {
        console.error('Error loading legal documents:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

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
      ) : filteredDocuments.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">No documents found matching those filters.</div>
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

          {totalPages > 1 && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm text-ink-body transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:border-border"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-foreground text-background'
                      : 'border border-border text-ink-body hover:border-ink-faint'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm text-ink-body transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:border-border"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
      </RevealSection>
    </div>
  );
}
