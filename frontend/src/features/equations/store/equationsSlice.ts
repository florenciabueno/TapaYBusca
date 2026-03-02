import { create } from 'zustand';
import type { Equation } from '../types';

interface EquationsStore {
  equations: Equation[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  total: number;
  totalPages: number;
  setEquations: (equations: Equation[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setPagination: (total: number, page: number, totalPages: number) => void;
  setPage: (page: number) => void;
}

export const useEquationsStore = create<EquationsStore>()((set) => ({
  equations: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  total: 0,
  totalPages: 1,
  setEquations: (equations) => set({ equations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setPagination: (total, page, totalPages) => set({ total, currentPage: page, totalPages }),
  setPage: (page) => set({ currentPage: page }),
}));
