import { COLORS, PURPLE_RGB } from '../../../../config/theme';

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
        className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
        style={{
          borderColor: COLORS.accentSecondary,
          color: COLORS.accentSecondary,
        }}
        onMouseEnter={(e) => {
          if (currentPage > 1) {
            e.currentTarget.style.backgroundColor = `rgba(${PURPLE_RGB}, 0.12)`;
            e.currentTarget.style.borderColor = COLORS.accentSecondary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.borderColor = COLORS.accentSecondary;
        }}
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
        className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
        style={{
          borderColor: COLORS.accentSecondary,
          color: COLORS.accentSecondary,
        }}
        onMouseEnter={(e) => {
          if (currentPage < totalPages) {
            e.currentTarget.style.backgroundColor = `rgba(${PURPLE_RGB}, 0.12)`;
            e.currentTarget.style.borderColor = COLORS.accentSecondary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.borderColor = COLORS.accentSecondary;
        }}
      >
        {nextLabel}
      </button>
    </nav>
  );
};
