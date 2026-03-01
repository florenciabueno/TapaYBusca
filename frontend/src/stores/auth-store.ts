import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../shared/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  setUserAndToken: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUserAndToken: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
