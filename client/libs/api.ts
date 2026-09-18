// ─────────────────────────────────────────────
// libs/api.ts — Axios client with JWT interceptors
// Full typed API surface, zero hardcoded data
// ─────────────────────────────────────────────
import axios from 'axios';
import type { AxiosInstance } from 'axios';

import type { Listing, PaginatedListings, ListingQueryParams } from '@/types/listing';
import type { Order, CreateOrderPayload } from '@/types/order';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Dispute, ResolveDisputePayload } from '@/types/dispute';
import type { CurrentUser } from '@/store/useAuthStore';
import {
  normalizeListing,
  normalizeOrder,
  normalizeDispute,
  normalizeConversation,
  normalizeChatMessage,
} from './normalizers';

// ─── Axios Instance ────────────────────────────────────────────────────────────

export const http: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

const TOKEN_KEY = 'kyquy_token';

// ── Request interceptor: attach Bearer token ─────────────────────────────────
http.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: 401 → wipe token + redirect ───────────────────────
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

// ─── Public Types ──────────────────────────────────────────────────────────────

export interface PaymentQrResponse {
  qrCodeUrl: string;
  accountNo: string;
  bankCode: string;
  bankName?: string;
  accountHolderName?: string;
  amount: number;
  memo: string;
  expiresAt: string; // ISO 8601
}

export interface CreateListingDtoInput {
  title: string;
  description?: string;
  priceVnd: number;
  category: string;
  condition?: string;
  locationName?: string;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listingsApi = {
  list: async (params: ListingQueryParams = {}): Promise<PaginatedListings> => {
    const queryObj: Record<string, string> = {};
    if (params.category && (params.category as string) !== 'ALL') queryObj.category = params.category;
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
    if (params.status) queryObj.status = params.status;

    const res = await http.get<{ total: number; data: unknown[] }>('/listings', {
      params: queryObj,
    });
    const raw = res.data;
    const data = (raw?.data || []).map(normalizeListing);
    const total = raw?.total ?? data.length;
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
    const res = await http.get<unknown>(`/listings/${id}`);
    return normalizeListing(res.data);
  },

  // Accepts FormData (multipart) for real image upload
  create: async (formData: FormData): Promise<Listing> => {
    const res = await http.post<unknown>('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizeListing(res.data);
  },

  updateStatus: (id: string, status: string) =>
    http.patch(`/listings/${id}/status`, { status }),

  // Quick search — returns up to 5 results for navbar dropdown
  search: async (query: string): Promise<Listing[]> => {
    const res = await http.get<{ total: number; data: unknown[] }>('/listings', {
      params: { search: query, limit: 5, offset: 0 },
    });
    return (res.data?.data || []).map(normalizeListing);
  },
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  // Server generates orderId — no client-side Date.now()
  create: async (data: CreateOrderPayload): Promise<Order> => {
    const res = await http.post<unknown>('/orders', {
      buyerWallet: data.buyerWallet,
      sellerWallet: data.sellerWallet,
      listingId: data.listingId,
      amount: String(data.amountVnd),
    });
    return normalizeOrder(res.data);
  },

  list: async (params?: {
    buyerWallet?: string;
    sellerWallet?: string;
    status?: string;
  }): Promise<Order[]> => {
    const res = await http.get<unknown[] | { data: unknown[] }>('/orders', { params });
    const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    return rows.map(normalizeOrder);
  },

  get: async (id: string, sync = false): Promise<Order> => {
    const res = await http.get<{ db?: unknown } | Record<string, unknown>>(
      `/orders/${id}${sync ? '?sync=true' : ''}`,
    );
    const raw = res.data && typeof res.data === 'object' && 'db' in res.data ? res.data.db : res.data;
    return normalizeOrder(raw);
  },

  // Buyer confirms receipt — triggers fund release to seller
  confirm: async (id: string): Promise<Order> => {
    const res = await http.post<unknown>(`/orders/${id}/confirm`);
    return normalizeOrder(res.data);
  },

  complete: async (id: string): Promise<Order> => {
    const res = await http.post<unknown>(`/orders/${id}/complete`);
    return normalizeOrder(res.data);
  },

  cancel: async (id: string): Promise<Order> => {
    const res = await http.post<unknown>(`/orders/${id}/cancel`);
    return normalizeOrder(res.data);
  },

  markDelivered: async (id: string, trackingCode?: string): Promise<Order> => {
    const res = await http.post<{ escrow?: unknown } | Record<string, unknown>>(
      `/orders/${id}/mark-delivered`,
      { trackingCode },
    );
    const raw = res.data && typeof res.data === 'object' && 'escrow' in res.data ? res.data.escrow : res.data;
    return normalizeOrder(raw);
  },

  // Raises dispute with multipart evidence files
  raiseDisputeWithFiles: async (id: string, formData: FormData): Promise<Order> => {
    const res = await http.post<{ escrow?: unknown } | Record<string, unknown>>(
      `/orders/${id}/dispute`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    const raw = res.data && typeof res.data === 'object' && 'escrow' in res.data ? res.data.escrow : res.data;
    return normalizeOrder(raw);
  },

  // Legacy JSON dispute (no file upload)
  raiseDispute: async (id: string, reason: string, evidenceUrls: string[]): Promise<Order> => {
    const res = await http.post<{ escrow?: unknown } | Record<string, unknown>>(
      `/orders/${id}/dispute`,
      { reason, evidenceUrls },
    );
    const raw = res.data && typeof res.data === 'object' && 'escrow' in res.data ? res.data.escrow : res.data;
    return normalizeOrder(raw);
  },
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  // Returns live VietQR data — STRICTLY from backend, never constructed locally
  getPaymentQr: async (orderId: string): Promise<PaymentQrResponse> => {
    const res = await http.get<PaymentQrResponse>(`/orders/${orderId}/payment-qr`);
    return res.data;
  },

  createIntent: (orderId: string, amountVnd: number) =>
    http.post<{
      id: string;
      qrImageUrl: string;
      transferContent: string;
      bankAccount: string;
      bankName: string;
      expiresAt: string;
    }>('/payments/intent', { orderId, amountVnd }).then((r) => r.data),

  getIntent: (id: string) =>
    http.get<{
      id: string;
      status: string;
      qrImageUrl: string;
      expiresAt: string;
    }>(`/payments/intent/${id}`).then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: async (): Promise<CurrentUser> => {
    const res = await http.get<Record<string, unknown>>('/users/me');
    const raw = res.data;
    return {
      id: String(raw.id ?? raw._id ?? ''),
      username: String(raw.username ?? raw.name ?? 'Người dùng'),
      avatarUrl: (raw.avatarUrl ?? raw.avatar_url ?? undefined) as string | undefined,
      rating: Number(raw.rating ?? 5.0),
      role: (raw.role as CurrentUser['role']) ?? 'USER',
      email: (raw.email ?? undefined) as string | undefined,
    };
  },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  requestPhoneOtp: async (
    phone: string,
  ): Promise<{ success: boolean; message: string; testOtp?: string }> => {
    const res = await http.post<{ success: boolean; message: string; testOtp?: string }>(
      '/auth/phone/request-otp',
      { phone },
    );
    return res.data;
  },

  verifyPhoneOtp: async (
    phone: string,
    otp: string,
    walletAddress?: string,
  ): Promise<{ token: string; user: CurrentUser }> => {
    const res = await http.post<{ token: string; user: CurrentUser }>(
      '/auth/phone/verify-otp',
      { phone, otp, walletAddress },
    );
    return res.data;
  },

  loginWithGoogle: async (payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    walletAddress?: string;
  }): Promise<{ token: string; user: CurrentUser }> => {
    const res = await http.post<{ token: string; user: CurrentUser }>(
      '/auth/google',
      payload,
    );
    return res.data;
  },

  connectWallet: async (
    walletAddress: string,
  ): Promise<{ token: string; user: CurrentUser }> => {
    const res = await http.post<{ token: string; user: CurrentUser }>(
      '/auth/wallet',
      { walletAddress },
    );
    return res.data;
  },
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  getOrCreateConversation: async (
    buyerWallet: string,
    sellerWallet: string,
    listingId?: string,
  ): Promise<Conversation> => {
    const res = await http.post<unknown>('/chat/conversations', {
      buyerWallet,
      sellerWallet,
      listingId,
    });
    return normalizeConversation(res.data);
  },

  listConversations: async (wallet: string): Promise<Conversation[]> => {
    const res = await http.get<unknown[]>('/chat/conversations', {
      params: { wallet },
    });
    return (res.data || []).map(normalizeConversation);
  },

  getMessages: async (
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<ChatMessage[]> => {
    const res = await http.get<unknown[]>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { limit, offset } },
    );
    return (res.data || []).map(normalizeChatMessage);
  },

  sendMessage: async (
    conversationId: string,
    senderWallet: string,
    content: string,
  ): Promise<ChatMessage> => {
    const res = await http.post<unknown>(
      `/chat/conversations/${conversationId}/messages`,
      { senderWallet, content },
    );
    return normalizeChatMessage(res.data);
  },
};

// ─── Admin Disputes ───────────────────────────────────────────────────────────

export const disputesApi = {
  list: async (status?: string): Promise<Dispute[]> => {
    const res = await http.get<unknown[]>('/admin/disputes', {
      params: status ? { status } : undefined,
    });
    return (res.data || []).map(normalizeDispute);
  },

  resolve: (id: string, data: ResolveDisputePayload) =>
    http.post(`/admin/disputes/${id}/resolve`, data).then((r) => r.data),
};
