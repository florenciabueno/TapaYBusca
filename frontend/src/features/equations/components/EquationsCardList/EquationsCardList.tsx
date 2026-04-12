import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { COLORS, PURPLE_RGB, SHADOW } from '../../../../config/theme';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';
import type { UseEquationListReturn } from '../../hooks/useEquationList';
import { useAuthStore } from '../../../../stores';
import { EQUATION_LIST_STATUS_DELETED } from '../../types/equation.types';
import { canDeleteEquation } from '../../utils/equationPermissions';
import { EquationCard } from '../EquationCard';

const MESSAGES = {
  LOADING: 'Cargando ecuaciones...',
  EMPTY_TITLE: 'No hay ecuaciones',
  EMPTY_DESCRIPTION: 'Crea tu primera ecuación para comenzar a resolver paso a paso.',
  EMPTY_DELETED_TITLE: 'No hay ecuaciones eliminadas',
  EMPTY_DELETED_DESCRIPTION:
    'Cuando elimines una ecuación, podrás verla aquí seleccionando este filtro.',
  EMPTY_DOWNLOADED_TITLE: 'No hay ecuaciones descargadas',
  EMPTY_DOWNLOADED_DESCRIPTION: 'Descarga ecuaciones para agregarlas a tu listado.',
  DELETE_CONFIRM_TITLE: 'Eliminar ecuación',
  DELETE_CONFIRM_MESSAGE: '¿Estás seguro de eliminar esta ecuación? Esta acción no se puede deshacer.',
  DELETE_CONFIRM_BTN: 'Eliminar',
  CANCEL_BTN: 'Cancelar',
} as const;

export interface EquationsCardListProps {
  equationList: UseEquationListReturn;
}

export const EquationsCardList = ({ equationList }: EquationsCardListProps) => {
  const {
    equations,
    isLoading,
    error,
    deleteError,
    currentPage,
    totalPages,
    total,
    goToPage,
    deleteEquation,
    selectedOrigins,
    selectedStatuses,
  } = equationList;
  const user = useAuthStore((state) => state.user);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteEquation(pendingDeleteId).finally(() => setPendingDeleteId(null));
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  if (isLoading) {
    return (
      <div
        className="rounded-lg border bg-white px-4 py-10 text-center"
        style={{ borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium" style={{ color: COLORS.brandDark }}>
          {MESSAGES.LOADING}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center"
        style={{ boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  const showDeleteError = deleteError != null && deleteError !== '';

  if (equations.length === 0 && total === 0) {
    const isOnlyDownloadedFilter =
      selectedOrigins?.length === 1 && selectedOrigins[0] === 'DOWNLOADED';
    const isOnlyDeletedFilter =
      selectedStatuses?.length === 1 && selectedStatuses[0] === EQUATION_LIST_STATUS_DELETED;

    return (
      <div
        className="rounded-lg border bg-white px-4 py-10 text-center transition-shadow"
        style={{ borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `rgba(${PURPLE_RGB}, 0.25)` }}
        >
          {isOnlyDownloadedFilter ? (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          {isOnlyDownloadedFilter
            ? MESSAGES.EMPTY_DOWNLOADED_TITLE
            : isOnlyDeletedFilter
              ? MESSAGES.EMPTY_DELETED_TITLE
              : MESSAGES.EMPTY_TITLE}
        </p>
        <p className="mb-4 text-xs text-gray-500">
          {isOnlyDownloadedFilter
            ? MESSAGES.EMPTY_DOWNLOADED_DESCRIPTION
            : isOnlyDeletedFilter
              ? MESSAGES.EMPTY_DELETED_DESCRIPTION
              : MESSAGES.EMPTY_DESCRIPTION}
        </p>
        {!isOnlyDeletedFilter && (
          <Link
            to={isOnlyDownloadedFilter ? ROUTES.DOWNLOAD : ROUTES.CREATE_EQUATION}
            className="inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2"
            style={{ backgroundColor: COLORS.orange }}
          >
            {isOnlyDownloadedFilter ? 'Descargar ecuaciones' : 'Crear ecuación'}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {showDeleteError && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </div>
      )}
      <div className="space-y-4 w-full">
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equations.map((equation) => (
            <EquationCard
              key={equation.id}
              equation={equation}
              onDelete={handleDeleteClick}
              canDelete={canDeleteEquation(equation, user)}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title={MESSAGES.DELETE_CONFIRM_TITLE}
        message={MESSAGES.DELETE_CONFIRM_MESSAGE}
        confirmLabel={MESSAGES.DELETE_CONFIRM_BTN}
        cancelLabel={MESSAGES.CANCEL_BTN}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
