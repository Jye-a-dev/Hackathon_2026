// ─────────────────────────────────────────────
// libs/api.ts — Typed API client kết nối NestJS Backend (Real Data)
// ─────────────────────────────────────────────
import type { Listing, PaginatedListings, ListingQueryParams } from '@/types/listing';
import type { Order, CreateOrderPayload } from '@/types/order';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Dispute, ResolveDisputePayload } from '@/types/dispute';
import {
  normalizeListing,
  normalizeOrder,
  normalizeDispute,
  normalizeConversation,
  normalizeChatMessage,
} from './normalizers';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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
    throw new Error(err?.message ?? `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Listings ───────────────────────────────
export interface CreateListingDtoInput {
  sellerWallet: string;
  title: string;
  description?: string;
  priceVnd: number;
  priceSol?: number;
  category: string;
  condition?: string;
  images?: string[];
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

export const listingsApi = {
  list: async (params: ListingQueryParams = {}): Promise<PaginatedListings> => {
    const queryObj: Record<string, string> = {};
    if (params.category && params.category !== ('ALL' as any)) {
      queryObj.category = params.category;
    }
    if (params.search) queryObj.search = params.search;
    if (params.limit) queryObj.limit = String(params.limit);
    if (params.page) {
      const limit = params.limit || 20;
      const offset = (Number(params.page) - 1) * limit;
      queryObj.offset = String(offset);
    }
    if (params.radiusKm) queryObj.radiusKm = String(params.radiusKm);
    if (params.lat) queryObj.latitude = String(params.lat);
    if (params.lng) queryObj.longitude = String(params.lng);

    const qs = new URLSearchParams(queryObj).toString();
    const res = await request<{ total: number; data: any[] }>(
      `/listings${qs ? '?' + qs : ''}`,
    );

    const data = (res?.data || []).map(normalizeListing);
    const total = res?.total ?? data.length;
    const page = params.page || 1;
    const limit = params.limit || 20;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        hasNextPage: page * limit < total,
      },
    };
  },

  get: async (id: string): Promise<Listing> => {
    const raw = await request<any>(`/listings/${id}`);
    return normalizeListing(raw);
  },

  create: async (dto: CreateListingDtoInput): Promise<Listing> => {
    const raw = await request<any>('/listings', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return normalizeListing(raw);
  },

  updateStatus: (id: string, status: string) =>
    request(`/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Orders ─────────────────────────────────
export const ordersApi = {
  create: async (data: CreateOrderPayload & { orderId?: string }): Promise<Order> => {
    const orderId = data.orderId || `${Date.now()}`;
    const raw = await request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        buyerWallet: data.buyerWallet,
        sellerWallet: data.sellerWallet,
        amount: String(data.amountVnd),
      }),
    });
    return normalizeOrder(raw);
  },

  list: async (params?: {
    buyerWallet?: string;
    sellerWallet?: string;
    status?: string;
  }): Promise<Order[]> => {
    const qs = params
      ? new URLSearchParams(params as Record<string, string>).toString()
      : '';
    const res = await request<{ total: number; data: any[] } | any[]>(
      `/orders${qs ? '?' + qs : ''}`,
    );
    const rows = Array.isArray(res) ? res : res?.data ?? [];
    return rows.map(normalizeOrder);
  },

  get: async (id: string, sync = false): Promise<Order> => {
    const res = await request<any>(`/orders/${id}${sync ? '?sync=true' : ''}`);
    // Endpoint returns { db: EscrowEntity, onChain?: any } or EscrowEntity
    const orderRaw = res?.db ? res.db : res;
    return normalizeOrder(orderRaw);
  },

  complete: async (id: string): Promise<Order> => {
    const raw = await request<any>(`/orders/${id}/complete`, { method: 'POST' });
    return normalizeOrder(raw);
  },

  cancel: async (id: string): Promise<Order> => {
    const raw = await request<any>(`/orders/${id}/cancel`, { method: 'POST' });
    return normalizeOrder(raw);
  },

  markDelivered: async (id: string, trackingCode?: string): Promise<Order> => {
    const res = await request<any>(`/orders/${id}/mark-delivered`, {
      method: 'POST',
      body: JSON.stringify({ trackingCode }),
    });
    const orderRaw = res?.escrow ? res.escrow : res;
    return normalizeOrder(orderRaw);
  },

  raiseDispute: async (
    id: string,
    reason: string,
    evidenceUrls: string[],
  ): Promise<Order> => {
    const res = await request<any>(`/orders/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, evidenceUrls }),
    });
    const orderRaw = res?.escrow ? res.escrow : res;
    return normalizeOrder(orderRaw);
  },
};

// ─── Payments ───────────────────────────────
export const paymentsApi = {
  createIntent: (orderId: string, amountVnd: number) =>
    request<{
      id: string;
      qrImageUrl: string;
      transferContent: string;
      bankAccount: string;
      bankName: string;
      expiresAt: string;
    }>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ orderId, amountVnd }),
    }),

  getIntent: (id: string) =>
    request<{
      id: string;
      status: string;
      qrImageUrl: string;
      expiresAt: string;
    }>(`/payments/intent/${id}`),
};

// ─── Chat ────────────────────────────────────
export const chatApi = {
  getOrCreateConversation: async (
    buyerWallet: string,
    sellerWallet: string,
    listingId?: string,
  ): Promise<Conversation> => {
    const raw = await request<any>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ buyerWallet, sellerWallet, listingId }),
    });
    return normalizeConversation(raw);
  },

  listConversations: async (wallet: string): Promise<Conversation[]> => {
    const rawList = await request<any[]>(
      `/chat/conversations?wallet=${encodeURIComponent(wallet)}`,
    );
    return (rawList || []).map(normalizeConversation);
  },

  getMessages: async (
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<ChatMessage[]> => {
    const rawList = await request<any[]>(
      `/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    );
    return (rawList || []).map(normalizeChatMessage);
  },

  sendMessage: async (
    conversationId: string,
    senderWallet: string,
    content: string,
  ): Promise<ChatMessage> => {
    const raw = await request<any>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ senderWallet, content }),
      },
    );
    return normalizeChatMessage(raw);
  },
};

// ─── Admin Disputes ──────────────────────────
export const disputesApi = {
  list: async (status?: string): Promise<Dispute[]> => {
    const rawList = await request<any[]>(
      `/admin/disputes${status ? '?status=' + status : ''}`,
    );
    return (rawList || []).map(normalizeDispute);
  },

  resolve: (id: string, data: ResolveDisputePayload) =>
    request(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
