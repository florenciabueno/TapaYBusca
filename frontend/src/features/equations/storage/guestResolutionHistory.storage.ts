import type { ResolutionStep } from '../types';

const GUEST_HISTORY_STORAGE_KEY = 'tapaYBusca_guestResolutionHistory';
const GUEST_SESSION_STORAGE_KEY = 'tapaYBusca_guestResolutionSessionId';
const STORAGE_VERSION = 1;

type GuestHistoryEntry = {
  equationId: string;
  steps: ResolutionStep[];
  solutionSet: number[];
  updatedAt: string;
  finished: boolean;
  finishedCode: string | null;
};

type GuestHistoryStorage = {
  version: number;
  entries: GuestHistoryEntry[];
};

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getOrCreateGuestSessionId(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing;
    const next = `${Date.now().toString(36)}-${randomSegment()}-${randomSegment()}`;
    window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return `ephemeral-${Date.now().toString(36)}-${randomSegment()}`;
  }
}

export function loadGuestResolutionHistory(): GuestHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(GUEST_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<GuestHistoryStorage>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(
      (entry): entry is GuestHistoryEntry =>
        typeof entry?.equationId === 'string' &&
        Array.isArray(entry.steps) &&
        Array.isArray(entry.solutionSet) &&
        typeof entry.updatedAt === 'string'
    );
  } catch {
    return [];
  }
}

function saveGuestResolutionHistory(entries: GuestHistoryEntry[]) {
  const payload: GuestHistoryStorage = {
    version: STORAGE_VERSION,
    entries,
  };
  try {
    window.localStorage.setItem(GUEST_HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch (error){
    if (import.meta.env.DEV) {
      console.warn('No se pudo guardar historial guest', error);
    }
  }
}

export function upsertGuestResolutionHistory(entry: GuestHistoryEntry) {
  const entries = loadGuestResolutionHistory();
  const nextEntries = [entry, ...entries.filter((item) => item.equationId !== entry.equationId)].slice(
    0,
    25
  );
  saveGuestResolutionHistory(nextEntries);
}

export function clearGuestResolutionHistory(equationId: string) {
  const entries = loadGuestResolutionHistory();
  const nextEntries = entries.filter((item) => item.equationId !== equationId);
  saveGuestResolutionHistory(nextEntries);
}

