import type { Dispatch, SetStateAction } from 'react';

export interface ResolutionFormState {
  subEquationInfix: string;
  answer: string;
  message: string | null;
}

export interface ResolutionMutationStatus {
  submitting: boolean;
  resolveStepPending: boolean;
  finishResolutionPending: boolean;
}

export interface ResolutionOutcome {
  finished: boolean;
  finishedCode: string | null;
}

export interface ResolutionActions {
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onFinishResolution: () => void;
  onReset: () => void;
}
