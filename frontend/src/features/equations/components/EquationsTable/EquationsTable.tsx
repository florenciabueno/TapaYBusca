import { useEffect, useState } from 'react';
import { equationService } from '../../services/equation.service';
import type { Equation } from '../../types';

const TABLE_HEADERS = ['Ecuación', 'Origen', 'Estado', 'Pasos', 'Fecha', 'Acciones'] as const;

const STATUS_COLORS = {
  'sin comenzar': '#629FAD', // azul
  'en proceso': '#FF8C42', // naranja
  'resuelta': '#4CAF50', // verde
} as const;

export const EquationsTable = () => {
  const [equations, setEquations] = useState<Equation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEquations();
  }, []);

  const loadEquations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equationService.getAllEquations();
      setEquations(data);
    } catch (err) {
      console.error('Error al cargar ecuaciones:', err);
      setError('Error al cargar las ecuaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ecuación?')) return;
    
    try {
      await equationService.deleteEquation(id);
      await loadEquations(); // Recargar lista
    } catch (err) {
      console.error('Error al eliminar ecuación:', err);
      alert('Error al eliminar la ecuación');
    }
  };

  const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#296374';
  };

  if (loading) {
    return (
      <div
        className="rounded-lg border-2 overflow-hidden"
        style={{ borderColor: '#296374', backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
      >
        <div className="px-6 py-16 text-center" style={{ color: '#296374' }}>
          Cargando ecuaciones...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border-2 overflow-hidden"
        style={{ borderColor: '#296374', backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
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
      style={{ borderColor: '#296374', backgroundColor: 'rgba(98, 159, 173, 0.2)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'rgba(41, 99, 116, 0.25)' }}>
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className="px-6 py-4 text-left text-sm font-semibold"
                style={{ color: '#0C2C55' }}
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
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.equation}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.origin}</td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: getStatusColor(equation.status),
                      color: 'white',
                    }}
                  >
                    {equation.status}
                  </span>
                </td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.steps}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.date}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#0C2C55' }}
                    >
                      Ver
                    </button>
                    {equation.origin !== 'defecto' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(equation.id)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#DC2626' }}
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
