import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsCardList } from '../components/EquationsCardList';
import { COLORS } from '../../../config/theme';

export const EquationsPage = () => {
  return (
    <EquationsLayout>
      <div className="w-full">
        <h1 className="mb-1 text-xl font-semibold sm:text-2xl" style={{ color: COLORS.gray[800] }}>
          Mis ecuaciones
        </h1>
        <p className="mb-4 text-xs text-gray-500 sm:text-sm">
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <EquationsCardList />
      </div>
    </EquationsLayout>
  );
};
