export type AuthContext =
  | { kind: 'auth'; token: string }
  | { kind: 'guest'; guestSessionId: string };

export const buildAuthHeaders = (ctx: AuthContext | null): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!ctx) return headers;
  if (ctx.kind === 'auth') {
    headers.Authorization = `Bearer ${ctx.token}`;
  } else {
    headers['x-guest-session-id'] = ctx.guestSessionId;
  }
  return headers;
};
