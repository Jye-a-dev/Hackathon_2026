import { Money } from '../value-objects/Money';
import { EscrowTimer } from '../value-objects/EscrowTimer';

export type EscrowStatus = 'LOCKED' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED';

export class EscrowOrder {
  constructor(
    public readonly id: string,
    public readonly buyerId: string,
    public readonly sellerId: string,
    public readonly amount: Money,
    public readonly status: EscrowStatus,
    public readonly deliveredAt?: Date,
    public readonly timeoutDurationSec: number = 172800, // 48 hours
    public readonly vaultPda?: string
  ) {}

  public getTimer(): EscrowTimer | null {
    if (this.status !== 'DELIVERED' || !this.deliveredAt) return null;
    const target = new Date(this.deliveredAt.getTime() + this.timeoutDurationSec * 1000);
    return new EscrowTimer(target);
  }

  public canRaiseDispute(): boolean {
    if (this.status !== 'DELIVERED') return false;
    const timer = this.getTimer();
    return timer ? !timer.isExpired() : false;
  }

  public canConfirmReceipt(): boolean {
    return this.status === 'DELIVERED';
  }

  public isProtectedByEscrow(): boolean {
    return ['LOCKED', 'DELIVERED', 'DISPUTED'].includes(this.status);
  }
}

