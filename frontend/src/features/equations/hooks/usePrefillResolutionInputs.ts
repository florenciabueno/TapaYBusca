import { useEffect } from 'react';
import type { Equation } from '../types';
import {
  infixToUserFacingForInput,
  splitInfixAtEquals,
} from '../utils/equation-input-guards';

interface UsePrefillResolutionInputsArgs {
  id: string | undefined;
  equation: Equation | null;
  resolutionLoaded: boolean;
  resolutionStepCount: number;
  finished: boolean;
  setSubEquationInfix: (value: string) => void;
  setAnswer: (value: string) => void;
}

const tryComputePrefill = (
  id: string | undefined,
  equation: Equation | null,
  resolutionLoaded: boolean,
  resolutionStepCount: number,
  finished: boolean
): [string, string] | null => {
  if (!id || !equation || equation.id !== id) return null;
  const infix = equation.infixExpression?.trim();
  if (!infix) return null;
  if (!resolutionLoaded || finished) return null;
  if (equation.status !== 'NOT_STARTED') return null;
  if (resolutionStepCount > 0) return null;
  return splitInfixAtEquals(infixToUserFacingForInput(infix));
};

export const usePrefillResolutionInputs = ({
  id,
  equation,
  resolutionLoaded,
  resolutionStepCount,
  finished,
  setSubEquationInfix,
  setAnswer,
}: UsePrefillResolutionInputsArgs): void => {
  useEffect(() => {
    const prefill = tryComputePrefill(
      id,
      equation,
      resolutionLoaded,
      resolutionStepCount,
      finished
    );
    if (!prefill) return;
    setSubEquationInfix(prefill[0]);
    setAnswer(prefill[1]);
  }, [
    id,
    equation?.id,
    equation?.infixExpression,
    equation?.status,
    resolutionLoaded,
    resolutionStepCount,
    finished,
    setSubEquationInfix,
    setAnswer,
  ]);
};
