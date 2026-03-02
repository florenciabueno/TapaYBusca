import { useEffect } from 'react';
import { useEquationList } from '../../hooks/useEquationList';
import { useAuthStore } from '../../../../stores';
import { COLORS } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { EquationStatus } from '../../types/equation.types';
import { ORIGIN_LABELS, STATUS_LABELS } from '../../types/equation.types';

const TABLE_HEADERS = ['Ecuación', 'Origen', 'Estado', 'Pasos', 'Fecha', 'Acciones'] as const;

const STATUS_COLORS: Record<EquationStatus, string> = {
  NOT_STARTED: COLORS.status.pending,
  IN_PROGRESS: COLORS.status.inProgress,
  SOLVED: COLORS.status.completed,
};

export const EquationsTable = () => {
  const { equations, isLoading, error, fetchEquations, deleteEquation } = useEquationList();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchEquations();
  }, [user, fetchEquations]);

  const handleDelete = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ecuación?')) return;
    deleteEquation(id);
  };

  const getStatusColor = (status: EquationStatus): string => {
    return STATUS_COLORS[status] ?? COLORS.secondary;
  };

  if (isLoading) {
    return (
      <div
        className="rounded-lg border-2 overflow-hidden"
        style={{ borderColor: COLORS.secondary, backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
      >
        <div className="px-6 py-16 text-center" style={{ color: COLORS.secondary }}>
          Cargando ecuaciones...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border-2 overflow-hidden"
        style={{ borderColor: COLORS.secondary, backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
      >
        <div className="px-6 py-16 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const hasEquations = equations.length > 0;

  return (
    <div
      className="rounded-lg border-2 overflow-hidden"
      style={{ borderColor: COLORS.secondary, backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'rgba(41, 99, 116, 0.25)' }}>
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className="px-6 py-4 text-left text-sm font-semibold"
                style={{ color: COLORS.primary }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasEquations ? (
            equations.map((equation) => (
              <tr
                key={equation.id}
                className="border-t transition-colors hover:bg-[rgba(98,159,173,0.2)]"
                style={{ borderColor: 'rgba(41, 99, 116, 0.2)' }}
              >
                <td className="px-6 py-4" style={{ color: COLORS.secondary }}>
                  <MathExpression expression={equation.equation} />
                </td>
                <td className="px-6 py-4" style={{ color: COLORS.secondary }}>{ORIGIN_LABELS[equation.origin]}</td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: getStatusColor(equation.status),
                      color: 'white',
                    }}
                  >
                    {STATUS_LABELS[equation.status]}
                  </span>
                </td>
                <td className="px-6 py-4" style={{ color: COLORS.secondary }}>{equation.steps}</td>
                <td className="px-6 py-4" style={{ color: COLORS.secondary }}>{equation.date}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: COLORS.primary }}
                    >
                      Ver
                    </button>
                    {user && equation.origin !== 'DEFAULT' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(equation.id)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: COLORS.error.dark }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className="px-6 py-16 text-center text-gray-500"
              >
                No hay ecuaciones creadas. ¡Crea tu primera ecuación!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
