import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export type EscrowStatusOnChain =
  | { locked: Record<string, never> }
  | { delivered: Record<string, never> }
  | { completed: Record<string, never> }
  | { disputed: Record<string, never> }
  | { refunded: Record<string, never> };

export type DisputeDecision = 'ReleaseToSeller' | 'RefundToBuyer';

export interface EscrowAccountData {
  orderId: anchor.BN;
  payer: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  arbiter: PublicKey;
  amount: anchor.BN;
  status: EscrowStatusOnChain;
  createdAt: anchor.BN;
  deliveredAt: anchor.BN;
  timeoutDuration: anchor.BN;
  bump: number;
  vaultBump: number;
}

export interface EscrowInitializedEvent {
  orderId: anchor.BN;
  buyer: PublicKey;
  seller: PublicKey;
  amount: anchor.BN;
  timestamp: anchor.BN;
}

export interface DeliveredMarkedEvent {
  orderId: anchor.BN;
  deliveredAt: anchor.BN;
  timeoutAt: anchor.BN;
}

export interface EscrowCompletedEvent {
  orderId: anchor.BN;
  seller: PublicKey;
  amount: anchor.BN;
  timestamp: anchor.BN;
}

export interface DisputeRaisedEvent {
  orderId: anchor.BN;
  buyer: PublicKey;
  timestamp: anchor.BN;
}

export interface DisputeResolvedEvent {
  orderId: anchor.BN;
  recipient: PublicKey;
  amount: anchor.BN;
  status: EscrowStatusOnChain;
}

export interface EscrowCancelledEvent {
  orderId: anchor.BN;
  buyer: PublicKey;
  amount: anchor.BN;
  timestamp: anchor.BN;
}

export interface PdaResult {
  escrowPda: string;
  escrowBump: number;
  vaultPda: string;
  vaultBump: number;
  orderId: string;
}
