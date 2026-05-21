const GUEST_SESSION_STORAGE_KEY = 'tapaYBusca_guestResolutionSessionId';

const randomSegment = (): string => Math.random().toString(36).slice(2, 10);

const buildSessionId = (): string =>
  `${Date.now().toString(36)}-${randomSegment()}-${randomSegment()}`;

export function getOrCreateGuestSessionId(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing;
    const next = buildSessionId();
    window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return `ephemeral-${buildSessionId()}`;
  }
}
