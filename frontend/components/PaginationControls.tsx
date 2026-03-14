'use client';

export interface PaginationControlsProps {
  /** Current 0-based page index */
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  /** Optional label for screen readers (e.g. "baptisms", "marriages") */
  ariaLabel?: string;
}

export function PaginationControls({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  isLoading = false,
  ariaLabel = 'records',
}: PaginationControlsProps) {
  if (totalPages <= 1 && totalElements <= size) return null;

  const start = page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <nav
      aria-label={`Pagination for ${ariaLabel}`}
      className="flex flex-wrap items-center justify-between gap-3 py-3"
    >
      <p className="text-sm text-gray-600">
        Showing {start}–{end} of {totalElements}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || isLoading}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600" aria-live="polite">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || isLoading}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
