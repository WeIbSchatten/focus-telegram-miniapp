import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type { FocusUser } from '@/types/user';

interface AuthState {
  accessToken: string | null;
  user: Pick<FocusUser, 'id' | 'email' | 'fullName' | 'roles' | 'status' | 'hasKidsAccess' | 'hasSenseAccess' | 'telegramUserId'> | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
          if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        }
        set({ accessToken, user });
      },
      setUser: (user) => {
        if (typeof window !== 'undefined' && user) {
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        }
        set({ user });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.accessToken);
          localStorage.removeItem(STORAGE_KEYS.user);
        }
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: 'focus-auth',
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.accessToken, state.accessToken);
          if (state.user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
        }
      },
    }
  )
);
