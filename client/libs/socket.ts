'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

const TOKEN_KEY = 'kyquy_token';

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

// ─── Chat Socket (namespace /chat) ────────────────────────────────────────────
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket || !chatSocket.connected) {
    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token: getToken() }, // JWT handshake
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return chatSocket;
}

export function disconnectChatSocket(): void {
  chatSocket?.disconnect();
  chatSocket = null;
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
// Joins the Socket.io room "order_<orderId>" on the /escrow namespace.
// Listens for: PAYMENT_LOCKED, PAYMENT_CONFIRMED, ORDER_STATUS_UPDATED
export function joinOrderRoom(orderId: string): Socket {
  const socket = getEscrowSocket();
  socket.emit('join_order', { orderId });
  return socket;
}

export function leaveOrderRoom(orderId: string): void {
  escrowSocket?.emit('leave_order', { orderId });
}
