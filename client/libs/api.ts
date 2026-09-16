// ─────────────────────────────────────────────
// libs/api.ts — Typed API client kết nối NestJS Backend
// ─────────────────────────────────────────────
import type { Listing, PaginatedListings, ListingQueryParams } from '@/types/listing';
import type { Order, CreateOrderPayload } from '@/types/order';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Dispute, ResolveDisputePayload } from '@/types/dispute';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message ?? 'API error');
  }
  return res.json() as Promise<T>;
}

// ─── Listings ───────────────────────────────
export const listingsApi = {
  list: (params: ListingQueryParams = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedListings>(`/listings${qs ? '?' + qs : ''}`);
  },
  get: (id: string) => request<Listing>(`/listings/${id}`),
  create: (data: FormData) =>
    fetch(`${BASE_URL}/listings`, { method: 'POST', body: data }).then((r) =>
      r.json(),
    ),
  updateStatus: (id: string, status: string) =>
    request(`/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Orders ─────────────────────────────────
export const ordersApi = {
  create: (data: CreateOrderPayload) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  list: (params?: { buyerWallet?: string; sellerWallet?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Order[]>(`/orders${qs ? '?' + qs : ''}`);
  },
  get: (id: string, sync = false) =>
    request<Order>(`/orders/${id}${sync ? '?sync=true' : ''}`),
  complete: (id: string) =>
    request<Order>(`/orders/${id}/complete`, { method: 'POST' }),
  cancel: (id: string) =>
    request<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
  markDelivered: (id: string, trackingCode?: string) =>
    request<Order>(`/orders/${id}/mark-delivered`, {
      method: 'POST',
      body: JSON.stringify({ trackingCode }),
    }),
  raiseDispute: (id: string, reason: string, evidenceUrls: string[]) =>
    request<Order>(`/orders/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, evidenceUrls }),
    }),
};

// ─── Payments ───────────────────────────────
export const paymentsApi = {
  createIntent: (orderId: string, amountVnd: number) =>
    request<{ id: string; qrImageUrl: string; transferContent: string; bankAccount: string; bankName: string; expiresAt: string }>(
      '/payments/intent',
      { method: 'POST', body: JSON.stringify({ orderId, amountVnd }) },
    ),
  getIntent: (id: string) =>
    request<{ id: string; status: string; qrImageUrl: string; expiresAt: string }>(
      `/payments/intent/${id}`,
    ),
};

// ─── Chat ────────────────────────────────────
export const chatApi = {
  getOrCreateConversation: (
    buyerWallet: string,
    sellerWallet: string,
    listingId?: string,
  ) =>
    request<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ buyerWallet, sellerWallet, listingId }),
    }),
  listConversations: (wallet: string) =>
    request<Conversation[]>(`/chat/conversations?wallet=${wallet}`),
  getMessages: (conversationId: string, limit = 50, offset = 0) =>
    request<ChatMessage[]>(
      `/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    ),
};

// ─── Admin Disputes ──────────────────────────
export const disputesApi = {
  list: (status?: string) =>
    request<Dispute[]>(`/admin/disputes${status ? '?status=' + status : ''}`),
  resolve: (id: string, data: ResolveDisputePayload) =>
    request(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
