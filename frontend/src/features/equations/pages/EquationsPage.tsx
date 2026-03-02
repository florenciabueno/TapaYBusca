import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsCardList } from '../components/EquationsCardList';
import { COLORS } from '../../../config/theme';

export const EquationsPage = () => {
  return (
    <EquationsLayout>
      <div className="w-full">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl" style={{ color: COLORS.gray[800] }}>
          Mis ecuaciones
        </h1>
        <p className="mb-8 text-sm text-gray-500 sm:text-base">
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <EquationsCardList />
      </div>
    </EquationsLayout>
  );
};
