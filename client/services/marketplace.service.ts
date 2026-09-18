import { http } from '@/libs/api';
import type { Listing, ListingQueryParams, PaginatedListings } from '@/types/listing';
import type { Order } from '@/types/order';
import type { PaymentQrResponse } from '@/libs/api';
import type { CurrentUser } from '@/store/useAuthStore';
import {
  normalizeListing,
  normalizeOrder,
} from '@/libs/normalizers';

export type ListingDetail = Listing;
export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
};
export type OrderResponse = Order;

export const listings = {
  list: async (params: ListingQueryParams = {}): Promise<PaginatedResult<Listing>> => {
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

    const res = await http.get<{ total: number; data: unknown[] }>('/listings', { params: queryObj });
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

  getById: async (id: string): Promise<ListingDetail> => {
    const res = await http.get<unknown>(`/listings/${id}`);
    return normalizeListing(res.data);
  },

  create: async (formData: FormData): Promise<Listing> => {
    const res = await http.post<unknown>('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizeListing(res.data);
  },
};

export const orders = {
  create: async (listingId: string): Promise<{ orderId: string }> => {
    const res = await http.post<{ id?: string; orderId?: string }>('/orders', { listingId });
    return { orderId: res.data.orderId || res.data.id || '' };
  },

  getById: async (id: string): Promise<OrderResponse> => {
    const res = await http.get<{ db?: unknown } | Record<string, unknown>>(`/orders/${id}?sync=true`);
    const raw = res.data && typeof res.data === 'object' && 'db' in res.data ? res.data.db : res.data;
    return normalizeOrder(raw);
  },

  getPaymentQr: async (id: string): Promise<PaymentQrResponse> => {
    const res = await http.get<PaymentQrResponse>(`/orders/${id}/payment-qr`);
    return res.data;
  },

  confirm: async (id: string): Promise<void> => {
    await http.post(`/orders/${id}/confirm`);
  },

  raiseDispute: async (id: string, formData: FormData): Promise<void> => {
    await http.post(`/orders/${id}/dispute`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const users = {
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

export const marketplaceService = {
  listings,
  orders,
  users,
};

