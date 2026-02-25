import { create } from 'zustand';
import type { Equation } from '../types';

interface EquationsStore {
  equations: Equation[];
  isLoading: boolean;
  error: string | null;
  setEquations: (equations: Equation[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useEquationsStore = create<EquationsStore>()((set) => ({
  equations: [],
  isLoading: false,
  error: null,
  setEquations: (equations) => set({ equations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
