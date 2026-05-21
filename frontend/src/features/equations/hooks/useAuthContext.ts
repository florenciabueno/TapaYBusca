import { useMemo } from 'react';
import { useAuthStore } from '../../../stores';
import type { AuthContext } from '../api/authContext';
import { getOrCreateGuestSessionId } from '../storage/guestSession';

export type AuthMode = 'auth' | 'guest';

export interface AuthSnapshot {
  ctx: AuthContext;
  mode: AuthMode;
  token: string | null;
}

export const useAuthContext = (): AuthSnapshot => {
  const token = useAuthStore((state) => state.token);
  const guestSessionId = useMemo(() => getOrCreateGuestSessionId(), []);

  if (token) {
    return { ctx: { kind: 'auth', token }, mode: 'auth', token };
  }
  return { ctx: { kind: 'guest', guestSessionId }, mode: 'guest', token: null };
};
