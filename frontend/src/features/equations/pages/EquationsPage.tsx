import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsTable } from '../components/EquationsTable';
import { COLORS } from '../../../config/theme';

export const EquationsPage = () => {
  return (
    <EquationsLayout>
      <div className="w-full">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: COLORS.primary }}
        >
          Mis ecuaciones
        </h1>
        <p
          className="mb-8 text-lg"
          style={{ color: COLORS.secondary }}
        >
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <EquationsTable />
      </div>
    </EquationsLayout>
  );
};
