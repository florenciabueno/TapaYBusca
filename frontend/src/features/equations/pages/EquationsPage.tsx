import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsCardList } from '../components/EquationsCardList';
import { OriginFilter } from '../components/OriginFilter';
import { StatusFilter } from '../components/StatusFilter';
import { DateFilter } from '../components/DateFilter';
import { useEquationList } from '../hooks/useEquationList';
import { COLORS } from '../../../config/theme';

export const EquationsPage = () => {
  const {
    selectedOrigins,
    setOriginFilter,
    selectedStatuses,
    setStatusFilter,
    fromDate,
    toDate,
    setDateFilter,
  } = useEquationList();

  return (
    <EquationsLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.brandDark }}>
          Mis ecuaciones
        </h1>
        <p className="mb-4 text-sm" style={{ color: COLORS.gray[600] }}>
          Gestiona y resuelve tus ecuaciones matemáticas paso a paso
        </p>

        <div className="mb-4 flex flex-col gap-3">
          <OriginFilter selectedOrigins={selectedOrigins} onChange={setOriginFilter} />
          <StatusFilter selectedStatuses={selectedStatuses} onChange={setStatusFilter} />
          <DateFilter fromDate={fromDate} toDate={toDate} onChange={setDateFilter} />
        </div>

        <EquationsCardList />
      </div>
    </EquationsLayout>
  );
};
