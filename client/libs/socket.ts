'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

// ─── Chat Socket (namespace /chat) ────────────
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket || !chatSocket.connected) {
    chatSocket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return chatSocket;
}

export function disconnectChatSocket() {
  chatSocket?.disconnect();
  chatSocket = null;
}

// ─── Escrow / Payment Socket (namespace /escrow) ──
let escrowSocket: Socket | null = null;

export function getEscrowSocket(): Socket {
  if (!escrowSocket || !escrowSocket.connected) {
    escrowSocket = io(`${SOCKET_URL}/escrow`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return escrowSocket;
}

export function disconnectEscrowSocket() {
  escrowSocket?.disconnect();
  escrowSocket = null;
}
