// ─────────────────────────────────────────────
// types/dispute.ts
// ─────────────────────────────────────────────
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER';

export interface Dispute {
  id: string;
  orderId: string;
  listingTitle: string;
  listingImage: string;
  buyerWallet: string;
  sellerWallet: string;
  amountVnd: number;
  reason: string;
  evidenceUrls: string[];
  chatHistory?: Array<{ sender: string; content: string; createdAt: string }>;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ResolveDisputePayload {
  resolution?: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER';
  decision?: 'ReleaseToSeller' | 'RefundToBuyer';
  note?: string;
  notes?: string;
}
