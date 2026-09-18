// ─────────────────────────────────────────────
// types/order.ts
// ─────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING_PAYMENT'  // Chờ thanh toán
  | 'LOCKED'           // Đã thanh toán, tiền đang trong ký quỹ
  | 'SHIPPED'          // Đang giao hàng
  | 'DELIVERED'        // Đã giao, đang đếm ngược 48h
  | 'COMPLETED'        // Hoàn tất, giải ngân cho seller
  | 'DISPUTED'         // Đang tranh chấp
  | 'REFUNDED'         // Đã hoàn tiền cho buyer
  | 'CANCELLED';       // Đã hủy

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerWallet: string;
  sellerWallet: string;
  amountVnd: number;
  status: OrderStatus;
  paymentIntentId?: string;
  trackingCode?: string;
  deliveredAt?: string;    // ISO date — bắt đầu đếm 48h từ đây
  completedAt?: string;
  createdAt: string;
  disputeReason?: string;
  disputeEvidenceUrls?: string[];
  vaultPda?: string;
  escrowAddress?: string;
}

export interface CreateOrderPayload {
  orderId?: string;
  listingId: string;
  buyerWallet: string;
  sellerWallet: string;
  amountVnd: number;
}

