import { mockEquations } from '../../data/mockEquations';

const TABLE_HEADERS = ['Ecuación', 'Origen', 'Estado', 'Pasos', 'Fecha', 'Acciones'] as const;

export const EquationsTable = () => {
  const hasEquations = mockEquations.length > 0;

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
            mockEquations.map((equation) => (
              <tr
                key={equation.id}
                className="border-t transition-colors hover:bg-[rgba(98,159,173,0.2)]"
                style={{ borderColor: 'rgba(41, 99, 116, 0.2)' }}
              >
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.equation}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.origin}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.status}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.steps}</td>
                <td className="px-6 py-4" style={{ color: '#296374' }}>{equation.date}</td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#0C2C55' }}
                  >
                    Ver
                  </button>
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
