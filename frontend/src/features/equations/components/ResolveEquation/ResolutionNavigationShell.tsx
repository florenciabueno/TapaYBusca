import type { ReactNode } from 'react';
import { COLORS } from '../../../../config/theme';
import type { EquationNeighbors } from '../../hooks/useEquationNeighbors';

const ARROW_COLOR = COLORS.orange;
const ARROW_DISABLED_COLOR = COLORS.gray[400];

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg
    className="h-16 w-16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

const NavArrowButton = ({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={direction === 'left' ? 'Ecuación anterior' : 'Ecuación siguiente'}
    className="flex shrink-0 cursor-pointer items-center justify-center p-1 transition-transform duration-200 ease-out hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default disabled:pointer-events-none disabled:opacity-30"
    style={{ color: disabled ? ARROW_DISABLED_COLOR : ARROW_COLOR }}
  >
    <ChevronIcon direction={direction} />
  </button>
);

interface ResolutionNavigationShellProps {
  navigation: EquationNeighbors;
  children: ReactNode;
}

export const ResolutionNavigationShell = ({
  navigation,
  children,
}: ResolutionNavigationShellProps) => {
  if (!navigation.showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full items-center gap-1 sm:gap-2 lg:gap-4">
      <div className="hidden shrink-0 lg:flex">
        <NavArrowButton
          direction="left"
          disabled={!navigation.hasPrev}
          onClick={navigation.goToPrev}
        />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="hidden shrink-0 lg:flex">
        <NavArrowButton
          direction="right"
          disabled={!navigation.hasNext}
          onClick={navigation.goToNext}
        />
      </div>
    </div>
  );
};
