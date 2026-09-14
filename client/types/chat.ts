// ─────────────────────────────────────────────
// types/chat.ts
// ─────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderWallet: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  buyerWallet: string;
  sellerWallet: string;
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  listingPrice?: number;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
