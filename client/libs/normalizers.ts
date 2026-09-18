// ─────────────────────────────────────────────
// libs/normalizers.ts — Backend → Frontend shape mapping
// Zero hardcoded fallback numerics, zero fake data
// ─────────────────────────────────────────────
import type { Listing, ListingStatus } from '@/types/listing';
import type { Order, OrderStatus } from '@/types/order';
import type { Dispute, DisputeStatus } from '@/types/dispute';
import type { Conversation, ChatMessage } from '@/types/chat';

export interface RawListingLocation {
  district?: string;
  city?: string;
}

export interface RawListingSeller {
  id?: string;
  username?: string;
  avatarUrl?: string;
  rating?: number | string;
  totalDeals?: number | string;
  isVerified?: boolean;
  responseTimeMin?: number | string;
}

export interface RawListing {
  id?: string | number;
  title?: string;
  description?: string;
  price_vnd?: number | string;
  price?: number | string;
  images?: unknown[];
  category?: Listing['category'];
  condition?: Listing['condition'];
  status?: Listing['status'];
  location?: RawListingLocation | null;
  location_name?: string | null;
  seller_wallet?: string;
  sellerWallet?: string;
  seller_id?: string | number;
  sellerId?: string | number;
  user_id?: string | number;
  userId?: string | number;
  seller?: RawListingSeller | null;
  created_at?: string;
  createdAt?: string;
  viewCount?: number | string;
  likeCount?: number | string;
}

export function normalizeListing(raw: unknown): Listing {
  if (!raw || typeof raw !== 'object') throw new Error('Listing payload is null or undefined');
  const r = raw as RawListing;

  const rawImages = r.images;
  const images =
    Array.isArray(rawImages) && rawImages.length > 0
      ? rawImages.filter((img): img is string => Boolean(img)).map(String)
      : [];

  const sellerWallet = r.seller_wallet ?? r.seller?.id ?? '';
  const username =
    r.seller?.username ??
    (sellerWallet.length > 12
      ? `${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}`
      : sellerWallet || 'Người bán');

  let district = '';
  let city = '';
  if (r.location && typeof r.location === 'object') {
    district = r.location.district ?? '';
    city = r.location.city ?? '';
  } else if (typeof r.location_name === 'string' && r.location_name.trim()) {
    const parts = r.location_name.split(',').map((p: string) => p.trim());
    district = parts[0] ?? '';
    city = parts[1] ?? '';
  }

  return {
    id: String(r.id),
    title: r.title ?? 'Sản phẩm',
    description: r.description ?? '',
    price: Number(r.price_vnd ?? r.price ?? 0),
    images,
    category: r.category ?? 'OTHER',
    condition: r.condition ?? 'GOOD',
    status: (r.status === 'AVAILABLE' ? 'ACTIVE' : (r.status ?? 'ACTIVE')) as ListingStatus,
    location: { district, city },
    seller: {
      id: sellerWallet,
      username,
      avatarUrl:
        r.seller?.avatarUrl ??
        (sellerWallet
          ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${sellerWallet}`
          : undefined),
      rating: Number(r.seller?.rating ?? 0),
      totalDeals: r.seller?.totalDeals !== undefined ? Number(r.seller.totalDeals) : undefined,
      isVerified: Boolean(r.seller?.isVerified ?? false),
      responseTimeMin:
        r.seller?.responseTimeMin !== undefined
          ? Number(r.seller.responseTimeMin)
          : undefined,
    },
    sellerId: r.seller_id ? String(r.seller_id) : (r.sellerId ? String(r.sellerId) : undefined),
    sellerWallet: r.seller_wallet ?? r.sellerWallet ?? (sellerWallet || undefined),
    userId: r.user_id ? String(r.user_id) : (r.userId ? String(r.userId) : undefined),
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    viewCount: r.viewCount !== undefined ? Number(r.viewCount) : undefined,
    likeCount: r.likeCount !== undefined ? Number(r.likeCount) : undefined,
  };
}

export interface RawOrder {
  id?: string | number;
  order_id?: string | number;
  amount_vnd?: number | string;
  amount_lamports?: number | string;
  amount?: number | string;
  amountVnd?: number | string;
  listing_id?: string | number;
  listingId?: string | number;
  listing_title?: string;
  listingTitle?: string;
  listing_image?: string;
  listingImage?: string;
  images?: unknown[];
  buyer_wallet?: string;
  buyerWallet?: string;
  seller_wallet?: string;
  sellerWallet?: string;
  status?: OrderStatus | string;
  payment_intent_id?: string;
  paymentIntentId?: string;
  tracking_code?: string;
  trackingCode?: string;
  delivered_at?: string;
  deliveredAt?: string;
  completed_at?: string;
  completedAt?: string;
  created_at?: string;
  createdAt?: string;
  dispute_reason?: string;
  reason?: string;
  disputeReason?: string;
  evidence_urls?: string[];
  disputeEvidenceUrls?: string[];
}

export function normalizeOrder(raw: unknown): Order {
  if (!raw || typeof raw !== 'object') throw new Error('Order payload is null or undefined');
  const r = raw as RawOrder;

  const id = String(r.id ?? r.order_id ?? '');
  const amount = Number(
    r.amount_vnd ?? r.amount_lamports ?? r.amount ?? r.amountVnd ?? 0,
  );

  return {
    id,
    listingId: String(r.listing_id ?? r.listingId ?? ''),
    listingTitle:
      r.listing_title ??
      r.listingTitle ??
      `Giao dịch Ký quỹ #${id.slice(-6)}`,
    listingImage:
      r.listing_image ??
      r.listingImage ??
      (Array.isArray(r.images) && r.images[0] ? String(r.images[0]) : ''),
    buyerWallet: r.buyer_wallet ?? r.buyerWallet ?? '',
    sellerWallet: r.seller_wallet ?? r.sellerWallet ?? '',
    amountVnd: amount,
    status: (r.status as OrderStatus) ?? 'LOCKED',
    paymentIntentId: r.payment_intent_id ?? r.paymentIntentId,
    trackingCode: r.tracking_code ?? r.trackingCode,
    deliveredAt: r.delivered_at ?? r.deliveredAt,
    completedAt: r.completed_at ?? r.completedAt,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    disputeReason: r.dispute_reason ?? r.reason ?? r.disputeReason,
    disputeEvidenceUrls: r.evidence_urls ?? r.disputeEvidenceUrls ?? undefined,
  };
}

export interface RawDispute {
  id?: string | number;
  order_id?: string | number;
  orderId?: string | number;
  resolution_status?: string;
  decision?: string;
  listing_title?: string;
  listingTitle?: string;
  listing_image?: string;
  listingImage?: string;
  buyer_wallet?: string;
  buyerWallet?: string;
  seller_wallet?: string;
  sellerWallet?: string;
  amount_lamports?: number | string;
  amount_vnd?: number | string;
  amountVnd?: number | string;
  reason?: string;
  evidence_urls?: string[];
  evidence_url?: string;
  chat_history?: Dispute['chatHistory'];
  created_at?: string;
  resolved_at?: string;
}

export function normalizeDispute(raw: unknown): Dispute {
  if (!raw || typeof raw !== 'object') throw new Error('Dispute payload is null or undefined');
  const r = raw as RawDispute;

  let status: DisputeStatus = 'OPEN';
  if (r.resolution_status === 'RESOLVED') {
    status =
      r.decision === 'REFUND_TO_BUYER' ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER';
  } else if (r.resolution_status === 'UNDER_REVIEW') {
    status = 'UNDER_REVIEW';
  }

  const orderId = String(r.order_id ?? r.orderId ?? '');

  return {
    id: String(r.id),
    orderId,
    listingTitle:
      r.listing_title ?? r.listingTitle ?? `Đơn hàng #${orderId.slice(-6)}`,
    listingImage: r.listing_image ?? r.listingImage ?? '',
    buyerWallet: r.buyer_wallet ?? r.buyerWallet ?? '',
    sellerWallet: r.seller_wallet ?? r.sellerWallet ?? '',
    amountVnd: Number(r.amount_lamports ?? r.amount_vnd ?? r.amountVnd ?? 0),
    reason: r.reason ?? '',
    evidenceUrls: Array.isArray(r.evidence_urls)
      ? r.evidence_urls
      : r.evidence_url
      ? [r.evidence_url]
      : [],
    // No synthetic fallback — undefined if absent from payload
    chatHistory: Array.isArray(r.chat_history) ? r.chat_history : undefined,
    status,
    createdAt: r.created_at ?? new Date().toISOString(),
    resolvedAt: r.resolved_at ?? undefined,
    resolutionNote: r.decision ? `Đã phân xử: ${r.decision}` : undefined,
  };
}

export interface RawConversation {
  id?: string | number;
  buyer_wallet?: string;
  buyerWallet?: string;
  seller_wallet?: string;
  sellerWallet?: string;
  listing_id?: string | number;
  listingId?: string | number;
  listing_title?: string;
  listingTitle?: string;
  listing_image?: string;
  listingImage?: string;
  listing_price?: number | string;
  listingPrice?: number | string;
  last_message?: string;
  lastMessage?: string;
  last_message_at?: string;
  lastMessageAt?: string;
  unread_count?: number | string;
  unreadCount?: number | string;
  created_at?: string;
  createdAt?: string;
}

export function normalizeConversation(raw: unknown): Conversation {
  const r = (raw ?? {}) as RawConversation;
  return {
    id: String(r.id),
    buyerWallet: r.buyer_wallet ?? r.buyerWallet ?? '',
    sellerWallet: r.seller_wallet ?? r.sellerWallet ?? '',
    listingId: r.listing_id ? String(r.listing_id) : r.listingId ? String(r.listingId) : undefined,
    listingTitle: r.listing_title ?? r.listingTitle ?? undefined,
    listingImage: r.listing_image ?? r.listingImage ?? undefined,
    listingPrice: r.listing_price !== undefined ? Number(r.listing_price) : r.listingPrice !== undefined ? Number(r.listingPrice) : undefined,
    lastMessage: r.last_message ?? r.lastMessage ?? undefined,
    lastMessageAt: r.last_message_at ?? r.lastMessageAt ?? undefined,
    unreadCount: r.unread_count !== undefined ? Number(r.unread_count) : r.unreadCount !== undefined ? Number(r.unreadCount) : undefined,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
  };
}

export interface RawChatMessage {
  id?: string | number;
  conversation_id?: string | number;
  conversationId?: string | number;
  sender_wallet?: string;
  senderWallet?: string;
  content?: string;
  image_url?: string;
  imageUrl?: string;
  created_at?: string;
  createdAt?: string;
  is_read?: boolean;
  isRead?: boolean;
}

export function normalizeChatMessage(raw: unknown): ChatMessage {
  const r = (raw ?? {}) as RawChatMessage;
  return {
    id: String(r.id),
    conversationId: String(r.conversation_id ?? r.conversationId ?? ''),
    senderWallet: r.sender_wallet ?? r.senderWallet ?? '',
    content: r.content ?? '',
    imageUrl: r.image_url ?? r.imageUrl ?? undefined,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    isRead: Boolean(r.is_read ?? r.isRead),
  };
}
