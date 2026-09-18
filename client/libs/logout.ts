// ─────────────────────────────────────────────────────────────
// libs/logout.ts — Multi-layer auth purge & session sanitization
// Called on every "Đăng xuất" action across all layouts/navbars
// ─────────────────────────────────────────────────────────────
import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { disconnectChatSocket, disconnectEscrowSocket } from '@/libs/socket';

const TOKEN_KEY = 'kyquy_token';
const AUTH_PERSIST_KEY = 'auth-storage';

export const performFullLogout = async (queryClient?: QueryClient): Promise<void> => {
  // ── 1. Wipe all client-side persistence ─────────────────────
  if (typeof window !== 'undefined') {
    // JWT token & user cache
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('kyquy_user');
    // Zustand persist snapshot
    localStorage.removeItem(AUTH_PERSIST_KEY);
    // Session storage (any tab-scoped state)
    sessionStorage.clear();
    // Expire the auth cookie with past date, strict SameSite
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
  }

  // ── 2. Disconnect all real-time WebSocket namespaces ────────
  try {
    disconnectChatSocket();
  } catch (err) {
    console.error('[Logout] Chat socket disconnect error:', err);
  }
  try {
    disconnectEscrowSocket();
  } catch (err) {
    console.error('[Logout] Escrow socket disconnect error:', err);
  }

  // ── 3. Purge TanStack Query in-memory cache ──────────────────
  if (queryClient) {
    queryClient.removeQueries();
    queryClient.clear();
  }

  // ── 4. Reset Zustand auth store state ───────────────────────
  try {
    useAuthStore.getState().logout?.();
  } catch (err) {
    console.error('[Logout] Auth store reset error:', err);
  }

  // ── 5. Hard redirect — replaceState prevents back-button restore
  if (typeof window !== 'undefined') {
    window.location.replace('/auth/login');
  }
};

