import { COLORS } from '../../../../config/theme';

export interface DateFilterProps {
  fromDate: string | undefined;
  toDate: string | undefined;
  onChange: (fromDate?: string, toDate?: string) => void;
}

export const DateFilter = ({ fromDate, toDate, onChange }: DateFilterProps) => {
  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || undefined;
    onChange(value, toDate);
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || undefined;
    onChange(fromDate, value);
  }

  function clearFrom() {
    onChange(undefined, toDate);
  }

  function clearTo() {
    onChange(fromDate, undefined);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
        Fecha:
      </span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Desde</label>
        <input
          type="date"
          value={fromDate ?? ''}
          onChange={handleFromChange}
          className="rounded-lg border px-2 py-1.5 text-sm"
          style={{ borderColor: COLORS.gray[300] }}
          aria-label="Fecha desde"
        />
        {fromDate && (
          <button
            type="button"
            onClick={clearFrom}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Hasta</label>
        <input
          type="date"
          value={toDate ?? ''}
          onChange={handleToChange}
          className="rounded-lg border px-2 py-1.5 text-sm"
          style={{ borderColor: COLORS.gray[300] }}
          aria-label="Fecha hasta"
        />
        {toDate && (
          <button
            type="button"
            onClick={clearTo}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};
