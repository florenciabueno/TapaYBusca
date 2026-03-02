import { COLORS } from '../../../../config/theme';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = 'Anterior',
  nextLabel = 'Siguiente',
}: PaginationProps) => {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-1"
      aria-label="Paginación"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-50"
        style={{ borderColor: COLORS.lightTeal, color: COLORS.gray[700] }}
      >
        {previousLabel}
      </button>
      <span
        className="px-3 py-2 text-sm text-gray-600"
        aria-live="polite"
      >
        Página {currentPage} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-50"
        style={{ borderColor: COLORS.lightTeal, color: COLORS.gray[700] }}
      >
        {nextLabel}
      </button>
    </nav>
  );
};
