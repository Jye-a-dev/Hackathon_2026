import type { Listing } from '@/types/listing';
import type { Order, OrderStatus } from '@/types/order';
import type { Dispute, DisputeStatus } from '@/types/dispute';
import type { Conversation, ChatMessage } from '@/types/chat';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

export function normalizeListing(raw: any): Listing {
  if (!raw) {
    throw new Error('Listing payload is null or undefined');
  }

  const rawImages = raw.images;
  const images =
    Array.isArray(rawImages) && rawImages.length > 0
      ? rawImages.filter(Boolean)
      : [DEFAULT_IMAGE];

  const sellerWallet = raw.seller_wallet || raw.seller?.id || '0xSellerWallet';
  const username =
    raw.seller?.username ||
    (sellerWallet.length > 12
      ? `${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}`
      : sellerWallet);

  let district = 'Hồ Chí Minh';
  let city = 'Việt Nam';
  if (raw.location && typeof raw.location === 'object') {
    district = raw.location.district || district;
    city = raw.location.city || city;
  } else if (typeof raw.location_name === 'string' && raw.location_name.trim()) {
    const parts = raw.location_name.split(',').map((p: string) => p.trim());
    district = parts[0] || district;
    city = parts[1] || city;
  }

  return {
    id: String(raw.id),
    title: raw.title || 'Món đồ không có tiêu đề',
    description: raw.description || '',
    price: Number(raw.price_vnd ?? raw.price ?? 0),
    images: images.length > 0 ? images : [DEFAULT_IMAGE],
    category: raw.category || 'OTHER',
    condition: raw.condition || 'GOOD',
    status: raw.status || 'ACTIVE',
    location: {
      district,
      city,
    },
    seller: {
      id: sellerWallet,
      username,
      avatarUrl:
        raw.seller?.avatarUrl ||
        `https://api.dicebear.com/9.x/avataaars/svg?seed=${sellerWallet}`,
      rating: Number(raw.seller?.rating ?? 5.0),
      totalDeals: Number(raw.seller?.totalDeals ?? 12),
      isVerified: Boolean(raw.seller?.isVerified ?? true),
      responseTimeMin: Number(raw.seller?.responseTimeMin ?? 15),
    },
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    viewCount: Number(raw.viewCount ?? 38),
    likeCount: Number(raw.likeCount ?? 6),
  };
}

export function normalizeOrder(raw: any): Order {
  if (!raw) throw new Error('Order payload is null or undefined');

  const id = String(raw.id ?? raw.order_id ?? '');
  const amount = Number(
    raw.amount_vnd ?? raw.amount_lamports ?? raw.amount ?? raw.amountVnd ?? 0,
  );

  return {
    id,
    listingId: String(raw.listing_id ?? raw.listingId ?? '1'),
    listingTitle:
      raw.listing_title ??
      raw.listingTitle ??
      `Giao dịch Ký quỹ #${id.slice(-6)}`,
    listingImage:
      raw.listing_image ??
      raw.listingImage ??
      (Array.isArray(raw.images) && raw.images[0] ? raw.images[0] : DEFAULT_IMAGE),
    buyerWallet: raw.buyer_wallet ?? raw.buyerWallet ?? '',
    sellerWallet: raw.seller_wallet ?? raw.sellerWallet ?? '',
    amountVnd: amount,
    status: (raw.status as OrderStatus) || 'LOCKED',
    trackingCode: raw.tracking_code ?? raw.trackingCode,
    deliveredAt: raw.delivered_at ?? raw.deliveredAt,
    completedAt: raw.completed_at ?? raw.completedAt,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    disputeReason: raw.dispute_reason ?? raw.reason ?? raw.disputeReason,
    disputeEvidenceUrls:
      raw.evidence_urls ?? raw.disputeEvidenceUrls ?? undefined,
  };
}

export function normalizeDispute(raw: any): Dispute {
  if (!raw) throw new Error('Dispute payload is null or undefined');

  let status: DisputeStatus = 'OPEN';
  if (raw.resolution_status === 'RESOLVED') {
    status =
      raw.decision === 'REFUND_TO_BUYER'
        ? 'RESOLVED_BUYER'
        : 'RESOLVED_SELLER';
  } else if (raw.resolution_status === 'UNDER_REVIEW') {
    status = 'UNDER_REVIEW';
  }

  const orderId = String(raw.order_id ?? raw.orderId ?? '');

  return {
    id: String(raw.id),
    orderId,
    listingTitle:
      raw.listing_title ??
      raw.listingTitle ??
      `Đơn hàng #${orderId.slice(-6)}`,
    listingImage:
      raw.listing_image ??
      raw.listingImage ??
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    buyerWallet: raw.buyer_wallet ?? raw.buyerWallet ?? '',
    sellerWallet: raw.seller_wallet ?? raw.sellerWallet ?? '',
    amountVnd: Number(
      raw.amount_lamports ?? raw.amount_vnd ?? raw.amountVnd ?? 0,
    ),
    reason: raw.reason || 'Tranh chấp sản phẩm không đúng mô tả',
    evidenceUrls: Array.isArray(raw.evidence_urls)
      ? raw.evidence_urls
      : raw.evidence_url
      ? [raw.evidence_url]
      : [],
    chatHistory: Array.isArray(raw.chat_history)
      ? raw.chat_history
      : [
          {
            sender: 'Buyer',
            content: raw.reason || 'Sản phẩm có vấn đề khi nhận hàng',
            createdAt: raw.created_at || '10:00',
          },
        ],
    status,
    createdAt: raw.created_at ?? new Date().toISOString(),
    resolvedAt: raw.resolved_at ?? undefined,
    resolutionNote: raw.decision
      ? `Đã phân xử: ${raw.decision}`
      : undefined,
  };
}

export function normalizeConversation(raw: any): Conversation {
  return {
    id: String(raw.id),
    buyerWallet: raw.buyer_wallet ?? raw.buyerWallet ?? '',
    sellerWallet: raw.seller_wallet ?? raw.sellerWallet ?? '',
    listingId: raw.listing_id ? String(raw.listing_id) : undefined,
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

export function normalizeChatMessage(raw: any): ChatMessage {
  return {
    id: String(raw.id),
    conversationId: String(raw.conversation_id ?? raw.conversationId),
    senderWallet: raw.sender_wallet ?? raw.senderWallet ?? '',
    content: raw.content ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    isRead: Boolean(raw.is_read ?? raw.isRead),
  };
}

