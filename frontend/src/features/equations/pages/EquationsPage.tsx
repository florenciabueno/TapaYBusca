import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsCardList } from '../components/EquationsCardList';
import { COLORS } from '../../../config/theme';

export const EquationsPage = () => {
  return (
    <EquationsLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.brandDark }}>
          Mis ecuaciones
        </h1>
        <p className="mb-4 text-sm" style={{ color: COLORS.gray[600] }}>
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <EquationsCardList />
      </div>
    </EquationsLayout>
  );
};
