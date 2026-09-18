'use client';

import { io, Socket } from 'socket.io-client';

const getSocketBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketBaseUrl();

const TOKEN_KEY = 'kyquy_token';

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

const getUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('kyquy_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Chat Socket (namespace /chat) ────────────────────────────────────────────
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  const token = getToken();
  const user = getUser();
  const authPayload = {
    token,
    userId: user?.id,
    id: user?.id,
    wallet: user?.wallet_address || user?.wallet || user?.id,
    walletAddress: user?.wallet_address || user?.wallet,
  };

  if (!chatSocket) {
    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: authPayload, // JWT handshake
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  } else {
    chatSocket.auth = authPayload;
  }
  return chatSocket;
}

export function disconnectChatSocket(): void {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}

// ─── Escrow / Payment Socket (namespace /escrow) ──────────────────────────────
let escrowSocket: Socket | null = null;

export function getEscrowSocket(): Socket {
  if (!escrowSocket || !escrowSocket.connected) {
    escrowSocket = io(`${SOCKET_URL}/escrow`, {
      auth: { token: getToken() }, // JWT handshake
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return escrowSocket;
}

export function disconnectEscrowSocket(): void {
  escrowSocket?.disconnect();
  escrowSocket = null;
}

// ─── Per-order room helper ────────────────────────────────────────────────────
// Joins the Socket.io room on the /escrow namespace via subscribe:order.
// Backend broadcasts `escrow:updated` to room `order:<orderId>` with payload `{ orderId, status }`.
export function joinOrderRoom(orderId: string): Socket {
  const socket = getEscrowSocket();
  socket.emit('subscribe:order', { orderId });
  // Also emit join_order for legacy support
  socket.emit('join_order', { orderId });
  return socket;
}

export function leaveOrderRoom(orderId: string): void {
  if (escrowSocket) {
    escrowSocket.emit('unsubscribe:order', { orderId });
    escrowSocket.emit('leave_order', { orderId });
  }
}

