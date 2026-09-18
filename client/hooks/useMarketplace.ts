// ─────────────────────────────────────────────
// hooks/useMarketplace.ts — All TanStack Query hooks
// Single source of truth for remote state
// ─────────────────────────────────────────────
'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listingsApi,
  ordersApi,
  paymentsApi,
  chatApi,
  disputesApi,
  usersApi,
} from '@/libs/api';
import type { ListingQueryParams } from '@/types/listing';

// ─── Listings ─────────────────────────────────────────────────────────────────

export function useListings(params: ListingQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: ['listings', params],
    queryFn: ({ pageParam = 1 }) =>
      listingsApi.list({ ...params, page: Number(pageParam) }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.hasNextPage ? last.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 15,
  });
}

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.get(id),
    staleTime: 1000 * 120, // 2 min
    enabled: !!id,
  });
}

export function useSearchListings(query: string) {
  return useQuery({
    queryKey: ['listings', 'search', query],
    queryFn: () => listingsApi.search(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 10,
    placeholderData: keepPreviousData,
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId, true),
    enabled: !!orderId,
    // Poll every 5 s unless order is in a terminal state
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return ['COMPLETED', 'REFUNDED', 'CANCELLED'].includes(s ?? '')
        ? false
        : 5000;
    },
  });
}

export function useMyOrders(params?: {
  buyerWallet?: string;
  sellerWallet?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
    staleTime: 1000 * 30,
  });
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || (err instanceof Error ? err.message : fallback);
};

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.confirm(orderId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['order', data.id] });
      toast.success('Đã xác nhận nhận hàng. Tiền đang được giải ngân cho người bán.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể xác nhận. Vui lòng thử lại.'));
    },
  });
}

export function useRaiseDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, formData }: { orderId: string; formData: FormData }) =>
      ordersApi.raiseDisputeWithFiles(orderId, formData),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['order', data.id] });
      toast.warning('Đã gửi khiếu nại. Trọng tài sẽ xem xét trong vòng 24h.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể gửi khiếu nại.'));
    },
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePaymentQr(orderId: string, amountVnd?: number) {
  return useQuery({
    queryKey: ['payment-qr', orderId, amountVnd],
    queryFn: () => paymentsApi.getPaymentQr(orderId, amountVnd),
    enabled: !!orderId,
    staleTime: 1000 * 60, // QR valid for ~1 min before refresh
    retry: 3,
  });
}

// ─── Current User ─────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
    initialData: () => {
      if (typeof window === 'undefined') return undefined;
      try {
        const stored = localStorage.getItem('kyquy_user');
        return stored ? JSON.parse(stored) : undefined;
      } catch {
        return undefined;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
    // Only fetch if authenticated
    enabled: typeof window !== 'undefined'
      ? !!localStorage.getItem('kyquy_token')
      : false,
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export function useConversations(currentUserId?: string) {
  const validId = currentUserId && currentUserId !== 'me' ? currentUserId : undefined;
  return useQuery({
    queryKey: ['conversations', validId],
    queryFn: () => chatApi.listConversations(validId ?? ''),
    enabled: Boolean(validId),
    staleTime: 1000 * 20,
    refetchInterval: 15_000, // poll every 15s for new conversations
  });
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 0, // always fresh — WS handles real-time
  });
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export function useDisputes(status?: string) {
  return useQuery({
    queryKey: ['disputes', status],
    queryFn: () => disputesApi.list(status),
    staleTime: 1000 * 30,
    refetchInterval: 30_000,
  });
}

export const useAdminDisputes = useDisputes;

export function useAdminEscrowList(filters?: {
  buyerWallet?: string;
  sellerWallet?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-escrow', filters],
    queryFn: () => ordersApi.list(filters),
    staleTime: 1000 * 15,
    refetchInterval: 15_000,
  });
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.complete(orderId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-escrow'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', data.id] });
      toast.success('Đã kích hoạt giải ngân quỹ cho người bán.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể giải ngân đơn hàng.'));
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-escrow'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', data.id] });
      toast.success('Đã hủy đơn hàng và hoàn tiền về ví người mua.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể hủy đơn hàng.'));
    },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: 'ReleaseToSeller' | 'RefundToBuyer';
      notes?: string;
    }) => disputesApi.resolve(id, { decision, notes }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['disputes'] });
      toast.success(
        vars.decision === 'RefundToBuyer'
          ? 'Đã hoàn tiền cho người mua'
          : 'Đã giải ngân cho người bán',
      );
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể phân xử. Thử lại sau.'));
    },
  });
}

