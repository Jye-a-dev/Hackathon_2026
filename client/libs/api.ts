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
import { useAuthStore, type CurrentUser } from '@/store/useAuthStore';
import {
  normalizeListing,
  normalizeOrder,
  normalizeDispute,
  normalizeConversation,
  normalizeChatMessage,
} from './normalizers';

// ─── Axios Instance ────────────────────────────────────────────────────────────

const sanitizeBaseUrl = (url: string): string =>
  url.replace(/([^:]\/)\/+/g, '$1').replace(/\/+$/, '');

export const http: AxiosInstance = axios.create({
  baseURL: sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'),
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

async function compressImageFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof document === 'undefined') {
        resolve(e.target?.result as string);
        return;
      }
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

  // Accepts JSON or FormData with automatic field mapping
  create: async (payload: CreateListingDtoInput | FormData | Record<string, unknown>): Promise<Listing> => {
    let body: unknown = payload;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (payload instanceof FormData) {
      const seller = payload.get('sellerWallet')?.toString() || '';
      const title = payload.get('title')?.toString() || '';
      const description = payload.get('description')?.toString();
      const priceVnd = Number(payload.get('price_vnd') || payload.get('priceVnd') || 0);
      const category = payload.get('category')?.toString() || 'OTHER';
      const condition = payload.get('condition')?.toString() || 'GOOD';
      const locationName = payload.get('location_name')?.toString() || payload.get('locationName')?.toString();
      const imagesRaw = payload.getAll('images');
      const images: string[] = [];
      for (const item of imagesRaw) {
        if (typeof item === 'string') {
          images.push(item);
        } else if (typeof File !== 'undefined' && item instanceof File) {
          try {
            const b64 = await compressImageFile(item);
            images.push(b64);
          } catch {
            // ignore
          }
        }
      }

      body = {
        sellerWallet: seller,
        title,
        description,
        priceVnd,
        category,
        condition,
        locationName,
        images,
      };
    }

    const res = await http.post<unknown>('/listings', body, { headers });
    return normalizeListing(res.data);
  },

  update: async (
    id: string,
    payload: Partial<CreateListingDtoInput> | FormData | Record<string, unknown>,
  ): Promise<Listing> => {
    let body: unknown = payload;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (payload instanceof FormData) {
      const title = payload.get('title')?.toString();
      const description = payload.get('description')?.toString();
      const rawPrice = payload.get('priceVnd') || payload.get('price_vnd') || payload.get('price');
      const priceVnd = rawPrice !== null && rawPrice !== undefined ? Number(rawPrice) : undefined;
      const category = payload.get('category')?.toString();
      const condition = payload.get('condition')?.toString();
      const district = payload.get('district')?.toString();
      const city = payload.get('city')?.toString();
      let locationName = payload.get('location_name')?.toString() || payload.get('locationName')?.toString();
      if (!locationName && (district || city)) {
        locationName = [district, city].filter(Boolean).join(', ');
      }

      // Existing images
      const existingImages: string[] = [];
      const existingRaw = payload.getAll('existingImages');
      for (const item of existingRaw) {
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              existingImages.push(...parsed.filter((img) => typeof img === 'string'));
            } else {
              existingImages.push(item);
            }
          } catch {
            existingImages.push(item);
          }
        }
      }

      // New image files / strings
      const imagesRaw = payload.getAll('images');
      const newImages: string[] = [];
      for (const item of imagesRaw) {
        if (typeof item === 'string') {
          if (!existingImages.includes(item)) newImages.push(item);
        } else if (typeof File !== 'undefined' && item instanceof File) {
          try {
            const b64 = await compressImageFile(item);
            newImages.push(b64);
          } catch {
            // ignore
          }
        }
      }

      const allImages = [...existingImages, ...newImages];

      body = {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priceVnd !== undefined && { priceVnd }),
        ...(category && { category }),
        ...(condition && { condition }),
        ...(locationName && { locationName }),
        images: allImages,
      };
    }

    const res = await http.patch<unknown>(`/listings/${id}`, body, { headers });
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
  // Satisfies NestJS CreateOrderDto with numeric orderId
  create: async (data: CreateOrderPayload): Promise<Order> => {
    const orderId = data.orderId || `${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const res = await http.post<unknown>('/orders', {
      orderId,
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
    try {
      const res = await http.post<unknown>(`/orders/${id}/confirm`);
      return normalizeOrder(res.data);
    } catch {
      const res = await http.post<unknown>(`/orders/${id}/complete`);
      return normalizeOrder(res.data);
    }
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

  // Raises dispute with evidence URLs
  raiseDisputeWithFiles: async (id: string, formData: FormData): Promise<Order> => {
    const reason = formData.get('reason')?.toString() || '';
    const rawFiles = formData.getAll('evidence');
    const evidenceUrls: string[] = [];

    for (const item of rawFiles) {
      if (typeof item === 'string') {
        evidenceUrls.push(item);
      } else if (typeof File !== 'undefined' && item instanceof File) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(item);
          });
          evidenceUrls.push(base64);
        } catch {
          // ignore error
        }
      }
    }

    const res = await http.post<{ escrow?: unknown } | Record<string, unknown>>(
      `/orders/${id}/dispute`,
      { reason, evidenceUrls },
    );
    const raw = res.data && typeof res.data === 'object' && 'escrow' in res.data ? res.data.escrow : res.data;
    return normalizeOrder(raw);
  },

  // Standard JSON dispute
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

  // Returns live VietQR data via payment intent contract
  getPaymentQr: async (orderId: string, amountVnd?: number): Promise<PaymentQrResponse> => {
    try {
      let amount = amountVnd;
      if (!amount) {
        const orderData = await ordersApi.get(orderId).catch(() => null);
        amount = orderData?.amountVnd;
      }
      if (amount && amount > 0) {
        const intent = await paymentsApi.createIntent(orderId, amount);
        return {
          qrCodeUrl: intent.qrImageUrl,
          accountNo: intent.bankAccount,
          bankCode: '970422',
          bankName: intent.bankName || 'MBBank',
          accountHolderName: 'P2P_ESCROW',
          amount,
          memo: intent.transferContent,
          expiresAt: intent.expiresAt,
        };
      }
    } catch {
      // Fallback if payment intent creation is already processed
    }

    const res = await http.get<PaymentQrResponse>(`/orders/${orderId}/payment-qr`);
    return res.data;
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: async (): Promise<CurrentUser> => {
    let raw: Record<string, unknown> | null = null;
    let storedUser: CurrentUser | null = null;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kyquy_user');
      if (stored) {
        try {
          storedUser = JSON.parse(stored);
        } catch {
          // ignore parse error
        }
      }
    }

    const authUser = useAuthStore.getState().user || storedUser;
    const wallet = authUser?.wallet || authUser?.wallet_address;

    try {
      if (wallet) {
        const res = await http.get<Record<string, unknown>>(`/users/${wallet}`);
        raw = res.data;
      } else {
        const res = await http.get<Record<string, unknown>>('/users/me');
        raw = res.data;
      }
    } catch {
      if (authUser) {
        return authUser;
      }
      throw new Error('Không thể tải thông tin người dùng.');
    }

    const rawRole = String(raw?.role ?? 'USER').toUpperCase();
    const role: CurrentUser['role'] =
      rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'ARBITER' ? 'ARBITER' : 'USER';

    const normalized: CurrentUser = {
      id: String(raw?.id ?? raw?._id ?? authUser?.id ?? ''),
      username: String(raw?.full_name ?? raw?.username ?? raw?.name ?? authUser?.username ?? 'Người dùng'),
      wallet: String(raw?.wallet_address ?? raw?.wallet ?? authUser?.wallet ?? ''),
      wallet_address: String(raw?.wallet_address ?? raw?.wallet ?? authUser?.wallet ?? ''),
      avatarUrl: (raw?.avatarUrl ?? raw?.avatar_url ?? authUser?.avatarUrl ?? undefined) as string | undefined,
      rating: Number(raw?.rating_score ?? raw?.rating ?? authUser?.rating ?? 5.0),
      role,
      email: (raw?.email ?? authUser?.email ?? undefined) as string | undefined,
      phone: (raw?.phone ?? authUser?.phone ?? undefined) as string | undefined,
    };

    useAuthStore.getState().setUser(normalized);
    return normalized;
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
    const res = await http.post<{ token: string; user: Record<string, unknown> }>(
      '/auth/phone/verify-otp',
      { phone, otp, walletAddress },
    );
    const u = res.data.user || {};
    const rawRole = String(u.role ?? 'USER').toUpperCase();
    const role: CurrentUser['role'] =
      rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'ARBITER' ? 'ARBITER' : 'USER';

    const normalizedUser: CurrentUser = {
      id: String(u.id ?? ''),
      username: String(u.full_name ?? u.username ?? `User_${phone.slice(-4)}`),
      wallet: String(u.wallet_address ?? u.wallet ?? ''),
      wallet_address: String(u.wallet_address ?? u.wallet ?? ''),
      avatarUrl: (u.avatar_url ?? u.avatarUrl ?? undefined) as string | undefined,
      rating: Number(u.rating_score ?? u.rating ?? 5.0),
      role,
      email: (u.email ?? undefined) as string | undefined,
      phone: (u.phone ?? phone) as string | undefined,
    };

    return { token: res.data.token, user: normalizedUser };
  },

  loginWithGoogle: async (payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    walletAddress?: string;
  }): Promise<{ token: string; user: CurrentUser }> => {
    const res = await http.post<{ token: string; user: Record<string, unknown> }>(
      '/auth/google',
      payload,
    );
    const u = res.data.user || {};
    const rawRole = String(u.role ?? 'USER').toUpperCase();
    const role: CurrentUser['role'] =
      rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'ARBITER' ? 'ARBITER' : 'USER';

    const normalizedUser: CurrentUser = {
      id: String(u.id ?? ''),
      username: String(u.full_name ?? u.username ?? payload.fullName ?? 'Google User'),
      wallet: String(u.wallet_address ?? u.wallet ?? ''),
      wallet_address: String(u.wallet_address ?? u.wallet ?? ''),
      avatarUrl: (u.avatar_url ?? u.avatarUrl ?? payload.avatarUrl ?? undefined) as string | undefined,
      rating: Number(u.rating_score ?? u.rating ?? 5.0),
      role,
      email: (u.email ?? payload.email) as string | undefined,
    };

    return { token: res.data.token, user: normalizedUser };
  },

  connectWallet: async (
    walletAddress: string,
  ): Promise<{ token: string; user: CurrentUser }> => {
    const res = await http.post<{ token: string; user: Record<string, unknown> }>(
      '/auth/wallet',
      { walletAddress },
    );
    const u = res.data.user || {};
    const rawRole = String(u.role ?? 'USER').toUpperCase();
    const role: CurrentUser['role'] =
      rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'ARBITER' ? 'ARBITER' : 'USER';

    const normalizedUser: CurrentUser = {
      id: String(u.id ?? ''),
      username: String(u.full_name ?? u.username ?? `Wallet_${walletAddress.slice(0, 4)}...`),
      wallet: String(u.wallet_address ?? u.wallet ?? walletAddress),
      wallet_address: String(u.wallet_address ?? u.wallet ?? walletAddress),
      avatarUrl: (u.avatar_url ?? u.avatarUrl ?? undefined) as string | undefined,
      rating: Number(u.rating_score ?? u.rating ?? 5.0),
      role,
      email: (u.email ?? undefined) as string | undefined,
    };

    return { token: res.data.token, user: normalizedUser };
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
    if (!wallet || wallet === 'me') return [];
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
