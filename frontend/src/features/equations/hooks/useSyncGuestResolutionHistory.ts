import { useEffect } from 'react';
import type { AuthMode } from '../api/authContext';
import {
  clearGuestResolutionHistory,
  upsertGuestResolutionHistory,
} from '../storage/guestResolutionHistory';
import type { ResolutionStep } from '../types';

interface UseSyncGuestResolutionHistoryArgs {
  id: string | undefined;
  mode: AuthMode;
  steps: ResolutionStep[];
  solutionSet: number[];
  solutionSetLatex?: string[];
  finished: boolean;
  finishedCode: string | null;
  resolutionData: { steps?: ResolutionStep[] } | null | undefined;
}

export const useSyncGuestResolutionHistory = ({
  id,
  mode,
  steps,
  solutionSet,
  solutionSetLatex,
  finished,
  finishedCode,
  resolutionData,
}: UseSyncGuestResolutionHistoryArgs): void => {
  useEffect(() => {
    if (!id || mode !== 'guest') return;
    upsertGuestResolutionHistory({
      equationId: id,
      steps,
      solutionSet,
      solutionSetLatex,
      updatedAt: new Date().toISOString(),
      finished,
      finishedCode,
    });
  }, [id, mode, steps, solutionSet, solutionSetLatex, finished, finishedCode]);

  useEffect(() => {
    if (!id || mode !== 'guest' || !resolutionData) return;
    if ((resolutionData.steps?.length ?? 0) === 0) {
      clearGuestResolutionHistory(id);
    }
  }, [id, mode, resolutionData]);
};
