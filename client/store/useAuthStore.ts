// ─────────────────────────────────────────────
// store/useAuthStore.ts — JWT-based auth state
// ─────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrentUser {
  id: string;
  username: string;
  wallet?: string;
  wallet_address?: string;
  avatarUrl?: string;
  rating: number;
  role: 'USER' | 'ADMIN' | 'ARBITER';
  email?: string;
  phone?: string;
}

interface AuthState {
  jwtToken: string | null;
  user: CurrentUser | null;
  isLoggedIn: boolean;
  // Actions
  login: (token: string, user?: CurrentUser | null) => void;
  setUser: (user: CurrentUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'kyquy_token';
const USER_KEY = 'kyquy_user';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      jwtToken: null,
      user: null,
      isLoggedIn: false,

      login: (token: string, user?: CurrentUser | null) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, token);
          document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; SameSite=Lax`;
          if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          }
        }
        set((state) => ({
          jwtToken: token,
          user: user !== undefined ? user : state.user,
          isLoggedIn: true,
        }));
      },

      setUser: (user: CurrentUser) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        set({ user });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          // Wipe Zustand persist snapshot so hydration finds nothing
          localStorage.removeItem('auth-storage');
          // Clear any tab-scoped state
          sessionStorage.clear();
          // Expire cookie with strict SameSite
          document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
        }
        set({ jwtToken: null, user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        jwtToken: state.jwtToken,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);

// Sync localStorage & Cookies → Zustand on hydration (handles page refresh)
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUserRaw = localStorage.getItem(USER_KEY);
  let parsedUser: CurrentUser | null = null;
  if (storedUserRaw) {
    try {
      parsedUser = JSON.parse(storedUserRaw);
    } catch {
      // Ignore
    }
  }
  if (storedToken) {
    document.cookie = `${TOKEN_KEY}=${storedToken}; path=/; max-age=2592000; SameSite=Lax`;
    useAuthStore.getState().login(storedToken, parsedUser);
  }
}
