import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  wallet: string | null;       // Dùng mock wallet address để định danh user
  username: string | null;
  avatarUrl: string | null;
  isLoggedIn: boolean;
  // Actions
  login: (wallet: string, username: string, avatarUrl?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      wallet: null,
      username: null,
      avatarUrl: null,
      isLoggedIn: false,
      login: (wallet, username, avatarUrl) =>
        set({ wallet, username, avatarUrl: avatarUrl ?? null, isLoggedIn: true }),
      logout: () =>
        set({ wallet: null, username: null, avatarUrl: null, isLoggedIn: false }),
    }),
    { name: 'auth-storage' },
  ),
);

// Mock auto-login cho demo
if (typeof window !== 'undefined') {
  const store = useAuthStore.getState();
  if (!store.isLoggedIn) {
    store.login(
      'demo_wallet_abc123',
      'Minh Tuấn',
      'https://api.dicebear.com/9.x/avataaars/svg?seed=MinhTuan',
    );
  }
}
