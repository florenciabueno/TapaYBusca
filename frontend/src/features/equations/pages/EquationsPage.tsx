import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsTable } from '../components/EquationsTable';

export const EquationsPage = () => {
  return (
    <EquationsLayout>
      <div className="max-w-6xl">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: '#0C2C55' }}
        >
          Mis Ecuaciones
        </h1>
        <p
          className="mb-6"
          style={{ color: '#296374' }}
        >
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <EquationsTable />
      </div>
    </EquationsLayout>
  );
};
