// ─────────────────────────────────────────────
// store/useAuthStore.ts — JWT-based auth state
// ─────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrentUser {
  id: string;
  username: string;
  avatarUrl?: string;
  rating: number;
  role: 'USER' | 'ADMIN' | 'ARBITER';
  email?: string;
}

interface AuthState {
  jwtToken: string | null;
  user: CurrentUser | null;
  isLoggedIn: boolean;
  // Actions
  login: (token: string) => void;
  setUser: (user: CurrentUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'kyquy_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      jwtToken: null,
      user: null,
      isLoggedIn: false,

      login: (token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, token);
        }
        set({ jwtToken: token, isLoggedIn: true });
      },

      setUser: (user: CurrentUser) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
        }
        set({ jwtToken: null, user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist the token — user info is always re-fetched from /users/me
      partialize: (state) => ({ jwtToken: state.jwtToken, isLoggedIn: state.isLoggedIn }),
    },
  ),
);

// Sync localStorage → Zustand on hydration (handles page refresh)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    useAuthStore.getState().login(stored);
  }
}
