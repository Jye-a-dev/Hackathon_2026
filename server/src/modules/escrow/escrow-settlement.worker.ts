import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowRepository } from './repositories/escrow.repository';
import { SolanaService } from '../solana/solana.service';
import { EscrowGateway } from './escrow.gateway';

@Injectable()
export class EscrowSettlementWorker {
  private readonly logger = new Logger(EscrowSettlementWorker.name);
  private isProcessing = false;

  constructor(
    private readonly escrowRepo: EscrowRepository,
    private readonly solanaService: SolanaService,
    private readonly escrowGateway: EscrowGateway,
  ) {}

  /**
   * Run every 30 seconds to query Delivered orders where timeout window has expired
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronSettlement(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug(
        'Settlement worker already processing previous cycle. Skipping...',
      );
      return;
    }

    this.isProcessing = true;
    try {
      await this.processEligibleDeliveries();
    } catch (err: any) {
      this.logger.error(
        `Settlement worker encountered error: ${err.message}`,
        err.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Scan database for Delivered orders where now >= delivered_at + timeout_duration (48h default)
   * and automatically call complete() on-chain.
   */
  public async processEligibleDeliveries(): Promise<number> {
    const expiredOrders = await this.escrowRepo.findExpiredDeliveredOrders();
    if (!expiredOrders || expiredOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `Found ${expiredOrders.length} delivered order(s) eligible for automated release.`,
    );

    let settledCount = 0;
    for (const order of expiredOrders) {
      const orderId = order.order_id || order.id;
      try {
        this.logger.log(
          `Executing automated release for orderId ${orderId}...`,
        );
        const txSig = await this.solanaService.completeEscrow(orderId);
        const completedAt = new Date();

        await this.escrowRepo.markCompleted(orderId, completedAt, txSig);
        this.escrowGateway.broadcastOrderStatus(orderId, 'COMPLETED', {
          completedAt,
          txSignature: txSig,
          automated: true,
        });

        this.logger.log(
          `Successfully completed escrow for orderId ${orderId} (signature: ${txSig})`,
        );
        settledCount++;
      } catch (error: any) {
        this.logger.error(
          `Failed automated settlement for orderId ${orderId}: ${error.message}`,
          error.stack,
        );
      }
    }

    return settledCount;
  }
}
