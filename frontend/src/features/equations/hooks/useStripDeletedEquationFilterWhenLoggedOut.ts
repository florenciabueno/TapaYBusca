import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stripDeletedStatusTokenFromParams } from '../utils/equationListSearchParams';

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

export function useStripDeletedEquationFilterWhenLoggedOut(
  hasToken: boolean,
  setSearchParams: SetSearchParams
): void {
  useEffect(() => {
    if (hasToken) return;
    setSearchParams((prev) => {
      const next = stripDeletedStatusTokenFromParams(prev);
      return next ?? prev;
    });
  }, [hasToken, setSearchParams]);
}
