import type { ResolutionStep } from '../types';

const GUEST_HISTORY_STORAGE_KEY = 'tapaYBusca_guestResolutionHistory';
const STORAGE_VERSION = 1;
const MAX_HISTORY_ENTRIES = 25;

export interface GuestResolutionHistoryEntry {
  equationId: string;
  steps: ResolutionStep[];
  solutionSet: number[];
  updatedAt: string;
  finished: boolean;
  finishedCode: string | null;
}

interface GuestHistoryStorage {
  version: number;
  entries: GuestResolutionHistoryEntry[];
}

const isValidEntry = (value: unknown): value is GuestResolutionHistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<GuestResolutionHistoryEntry>;
  return (
    typeof entry.equationId === 'string' &&
    Array.isArray(entry.steps) &&
    Array.isArray(entry.solutionSet) &&
    typeof entry.updatedAt === 'string'
  );
};

export function loadGuestResolutionHistory(): GuestResolutionHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(GUEST_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<GuestHistoryStorage>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(isValidEntry);
  } catch {
    return [];
  }
}

function saveGuestResolutionHistory(entries: GuestResolutionHistoryEntry[]): void {
  const payload: GuestHistoryStorage = { version: STORAGE_VERSION, entries };
  try {
    window.localStorage.setItem(GUEST_HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save guest resolution history', error);
    }
  }
}

export function upsertGuestResolutionHistory(entry: GuestResolutionHistoryEntry): void {
  const existing = loadGuestResolutionHistory().filter(
    (item) => item.equationId !== entry.equationId
  );
  saveGuestResolutionHistory([entry, ...existing].slice(0, MAX_HISTORY_ENTRIES));
}

export function clearGuestResolutionHistory(equationId: string): void {
  const entries = loadGuestResolutionHistory().filter((item) => item.equationId !== equationId);
  saveGuestResolutionHistory(entries);
}
