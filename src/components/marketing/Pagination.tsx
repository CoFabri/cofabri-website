interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm text-ink-body transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:border-border"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
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
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm text-ink-body transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:border-border"
      >
        →
      </button>
    </div>
  );
}
