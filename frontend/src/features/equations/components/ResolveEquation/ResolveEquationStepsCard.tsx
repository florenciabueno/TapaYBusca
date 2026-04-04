import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
import type { ResolutionStep } from '../../types';
import { ResolutionStepListItem } from './ResolutionStepListItem';

interface ResolveEquationStepsCardProps {
  steps: ResolutionStep[];
  embedded?: boolean;
}

export const ResolveEquationStepsCard = ({ steps, embedded = false }: ResolveEquationStepsCardProps) => {
  if (steps.length === 0) return null;

  const list = (
    <div
      className={`min-h-0 overflow-x-hidden pr-1 max-lg:overflow-visible ${embedded ? 'max-h-[min(50vh,28rem)] overflow-y-auto' : 'lg:flex-1 lg:overflow-y-auto'}`}
    >
      <ul className="flex flex-col gap-2.5 text-base [&_.katex]:!text-base" style={{ color: COLORS.gray[700] }}>
        {steps.map((step, i) => (
          <ResolutionStepListItem key={i} step={step} />
        ))}
      </ul>
    </div>
  );

  if (embedded) {
    return (
      <section
        className="mt-8 border-t pt-6"
        style={{ borderColor: COLORS.gray[200] }}
      >
        <h2 className="mb-4 shrink-0 text-lg font-semibold" style={{ color: COLORS.accentSecondary }}>
          Pasos realizados
        </h2>
        {list}
      </section>
    );
  }

  return (
    <div
      className="flex h-auto min-h-0 w-full flex-col overflow-hidden rounded-2xl p-6 lg:h-full"
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOW.lg,
        border: `1px solid ${COLORS.gray[200]}`,
        borderLeft: `4px solid ${COLORS.orangeLight}`,
      }}
    >
      <h2 className="mb-4 shrink-0 text-lg font-semibold" style={{ color: COLORS.accentSecondary }}>
        Pasos realizados
      </h2>
      {list}
    </div>
  );
};
