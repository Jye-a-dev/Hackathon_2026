export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface UserEntity {
  id: string;
  wallet_address: string;
  email?: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type EscrowDbStatus =
  | 'LOCKED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface OrderEntity {
  id: string; // u64 order_id
  buyer_id?: string | null;
  seller_id?: string | null;
  buyer_wallet: string;
  seller_wallet: string;
  arbiter_wallet: string;
  amount_lamports: string;
  escrow_pda: string;
  vault_pda: string;
  status: EscrowDbStatus;
  tracking_code?: string | null;
  timeout_duration: string;
  tx_signature?: string | null;
  delivered_at?: Date | null;
  completed_at?: Date | null;
  disputed_at?: Date | null;
  resolved_at?: Date | null;
  resolution_recipient?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EscrowEntity extends OrderEntity {
  order_id: string;
  amount: string;
}

export interface EscrowEventEntity {
  id: string;
  order_id: string;
  event_name: string;
  signature?: string | null;
  slot?: string | null;
  data: Record<string, any>;
  created_at: Date;
}

export interface DisputeEntity {
  id: string;
  order_id: string;
  buyer_wallet?: string | null;
  reason?: string | null;
  evidence_url?: string | null;
  evidence_urls?: string[] | null;
  resolution_status?: string | null;
  decision?: string | null;
  resolved_by?: string | null;
  tx_signature?: string | null;
  resolved_at?: Date | null;
  created_at: Date;
}
