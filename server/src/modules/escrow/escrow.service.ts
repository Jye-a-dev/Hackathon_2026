import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { EscrowRepository } from './repositories/escrow.repository';
import { SolanaService } from '../solana/solana.service';
import { EscrowGateway } from './escrow.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { QueryEscrowDto } from './dto/query-escrow.dto';
import { EscrowEntity, EscrowDbStatus } from './entities/escrow.entity';
import { DisputeDecision, PdaResult } from '../solana/solana.types';

@Injectable()
export class EscrowService implements OnModuleInit {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly escrowRepo: EscrowRepository,
    private readonly solanaService: SolanaService,
    private readonly escrowGateway: EscrowGateway,
  ) {}

  onModuleInit() {
    this.registerOnChainEventListener();
  }

  /**
   * Listen to on-chain events and keep PostgreSQL in sync automatically
   */
  private registerOnChainEventListener() {
    this.solanaService.subscribeToProgramEvents(
      async (eventName: string, data: any, slot: number, sig?: string) => {
        const orderId = data.orderId?.toString();
        if (!orderId) return;

        this.logger.log(
          `Processing on-chain event [${eventName}] for orderId: ${orderId}`,
        );

        // Persist raw audit log
        await this.escrowRepo.saveEvent(orderId, eventName, data, sig, slot);

        // Broadcast raw event via WebSocket
        this.escrowGateway.broadcastOnChainEvent(eventName, orderId, data, sig);

        switch (eventName) {
          case 'escrowInitialized': {
            const { escrowPda, vaultPda } =
              this.solanaService.calculatePdas(orderId);
            const amount = data.amount?.toString() || '0';
            const buyer = data.buyer?.toBase58?.() || data.buyer?.toString();
            const seller = data.seller?.toBase58?.() || data.seller?.toString();
            const arbiter = this.solanaService.getArbiterPublicKey().toBase58();

            await this.escrowRepo.create({
              orderId,
              buyerWallet: buyer,
              sellerWallet: seller,
              arbiterWallet: arbiter,
              amount,
              status: 'LOCKED',
              escrowPda,
              vaultPda,
              txSignature: sig,
            });
            this.escrowGateway.broadcastOrderStatus(orderId, 'LOCKED', {
              amount,
              buyer,
              seller,
            });
            break;
          }

          case 'deliveredMarked': {
            const deliveredAt = data.deliveredAt
              ? new Date(data.deliveredAt.toNumber() * 1000)
              : new Date();
            await this.escrowRepo.markDelivered(orderId, deliveredAt, sig);
            this.escrowGateway.broadcastOrderStatus(orderId, 'DELIVERED', {
              deliveredAt,
            });
            break;
          }

          case 'escrowCompleted': {
            const completedAt = data.timestamp
              ? new Date(data.timestamp.toNumber() * 1000)
              : new Date();
            await this.escrowRepo.markCompleted(orderId, completedAt, sig);
            this.escrowGateway.broadcastOrderStatus(orderId, 'COMPLETED', {
              completedAt,
            });
            break;
          }

          case 'disputeRaised': {
            const disputedAt = data.timestamp
              ? new Date(data.timestamp.toNumber() * 1000)
              : new Date();
            const buyer =
              data.buyer?.toBase58?.() || data.buyer?.toString() || '';
            await this.escrowRepo.markDisputed(orderId, disputedAt, sig);
            await this.escrowRepo.createDispute({
              orderId,
              buyerWallet: buyer,
              reason: 'On-chain dispute raised',
              txSignature: sig,
            });
            this.escrowGateway.broadcastOrderStatus(orderId, 'DISPUTED', {
              disputedAt,
              buyer,
            });
            break;
          }

          case 'disputeResolved': {
            const rawStatus = data.status;
            const statusStr: EscrowDbStatus =
              rawStatus && 'refunded' in rawStatus ? 'REFUNDED' : 'COMPLETED';
            const recipient =
              data.recipient?.toBase58?.() || data.recipient?.toString() || '';
            const resolvedAt = new Date();

            await this.escrowRepo.markResolved(
              orderId,
              statusStr,
              recipient,
              resolvedAt,
              sig,
            );
            await this.escrowRepo.resolveDisputeRecord(
              orderId,
              statusStr === 'REFUNDED' ? 'RefundToBuyer' : 'ReleaseToSeller',
              this.solanaService.getArbiterPublicKey().toBase58(),
              sig,
            );
            this.escrowGateway.broadcastOrderStatus(orderId, statusStr, {
              status: statusStr,
              recipient,
              resolvedAt,
            });
            break;
          }
        }
      },
    );
  }

  /**
   * Helper: getEscrowPda(orderId: number | bigint): [PublicKey, number]
   */
  getEscrowPda(orderId: number | bigint | string): [PublicKey, number] {
    return this.solanaService.getEscrowPda(orderId);
  }

  /**
   * Helper: getVaultPda(escrowPda: PublicKey): [PublicKey, number]
   */
  getVaultPda(escrowPda: PublicKey): [PublicKey, number] {
    return this.solanaService.getVaultPda(escrowPda);
  }

  /**
   * Calculate PDA strings and bumps for a given orderId
   */
  calculatePdas(orderId: string): PdaResult {
    return this.solanaService.calculatePdas(orderId);
  }

  /**
   * Pre-create or record an order in PostgreSQL
   */
  async createOrder(dto: CreateOrderDto): Promise<EscrowEntity> {
    const { escrowPda, vaultPda } = this.solanaService.calculatePdas(
      dto.orderId,
    );
    const arbiterWallet = this.solanaService.getArbiterPublicKey().toBase58();

    const escrow = await this.escrowRepo.create({
      orderId: dto.orderId,
      buyerWallet: dto.buyerWallet,
      sellerWallet: dto.sellerWallet,
      arbiterWallet,
      amount: dto.amount,
      status: 'LOCKED',
      escrowPda,
      vaultPda,
      trackingCode: dto.trackingCode,
      timeoutDuration: dto.timeoutDuration || '172800',
      txSignature: dto.txSignature,
    });

    this.escrowGateway.broadcastOrderStatus(dto.orderId, 'LOCKED', escrow);
    return escrow;
  }

  /**
   * Find order by shipping tracking code
   */
  async findByTrackingCode(trackingCode: string): Promise<EscrowEntity | null> {
    return this.escrowRepo.findByTrackingCode(trackingCode);
  }

  /**
   * Retrieve order with optional on-chain state sync
   */
  async getOrder(
    orderId: string | number | bigint,
    syncWithChain: boolean = false,
  ): Promise<{
    db: EscrowEntity;
    onChain?: any;
  }> {
    const idStr = orderId.toString();
    let escrow = await this.escrowRepo.findByOrderId(idStr);

    if (syncWithChain || !escrow) {
      const onChainData = await this.syncOrderFromChain(idStr);
      escrow = await this.escrowRepo.findByOrderId(idStr);
      if (!escrow) {
        throw new NotFoundException(`Escrow with orderId ${idStr} not found`);
      }
      return { db: escrow, onChain: onChainData };
    }

    return { db: escrow };
  }

  /**
   * Mark delivered: Server signs as Arbiter, calls program.methods.markDelivered().
   * Updates database status to Delivered and sets delivered_at.
   */
  async markDelivered(
    orderId: string | number | bigint,
    dto?: MarkDeliveredDto,
  ): Promise<{
    escrow: EscrowEntity;
    txSignature?: string;
  }> {
    const idStr = orderId.toString();
    const existing = await this.escrowRepo.findByOrderId(idStr);
    if (!existing) {
      throw new NotFoundException(`Order ${idStr} not found`);
    }

    if (existing.status !== 'LOCKED') {
      throw new BadRequestException(
        `Cannot mark delivered from status ${existing.status}`,
      );
    }

    let txSig = dto?.txSignature;

    // If no client txSignature provided, Arbiter backend executes signed transaction
    if (!txSig) {
      txSig = await this.solanaService.markDelivered(idStr);
    }

    const deliveredAt = new Date();
    const updated = await this.escrowRepo.markDelivered(
      idStr,
      deliveredAt,
      txSig,
    );
    this.escrowGateway.broadcastOrderStatus(idStr, 'DELIVERED', {
      deliveredAt,
      txSignature: txSig,
    });

    return { escrow: updated!, txSignature: txSig };
  }

  /**
   * Raise dispute: Buyer files a dispute
   */
  async raiseDispute(
    orderId: string | number | bigint,
    dto: RaiseDisputeDto,
  ): Promise<{
    escrow: EscrowEntity;
  }> {
    const idStr = orderId.toString();
    const existing = await this.escrowRepo.findByOrderId(idStr);
    if (!existing) {
      throw new NotFoundException(`Order ${idStr} not found`);
    }

    if (existing.status !== 'DELIVERED') {
      throw new BadRequestException(
        `Cannot dispute order from status ${existing.status}`,
      );
    }

    const updated = await this.escrowRepo.markDisputed(
      idStr,
      new Date(),
      dto.txSignature,
    );
    await this.escrowRepo.createDispute({
      orderId: idStr,
      buyerWallet: dto.buyerWallet || existing.buyer_wallet,
      reason: dto.reason,
      evidenceUrl: dto.evidenceUrl,
      evidenceUrls: dto.evidenceUrls,
      txSignature: dto.txSignature,
    });

    this.escrowGateway.broadcastOrderStatus(idStr, 'DISPUTED', {
      reason: dto.reason,
      evidenceUrl: dto.evidenceUrl,
      evidenceUrls: dto.evidenceUrls,
    });

    return { escrow: updated! };
  }

  /**
   * Arbiter resolves dispute: Server signs as Arbiter, calls program.methods.resolveDispute().
   * Updates DB accordingly.
   */
  async resolveDispute(
    orderId: string | number | bigint,
    decisionOrDto: 'ReleaseToSeller' | 'RefundToBuyer' | ResolveDisputeDto,
  ): Promise<{
    escrow: EscrowEntity;
    signature: string;
    decision: DisputeDecision;
    status: string;
    recipient: string;
  }> {
    const idStr = orderId.toString();
    const decision: DisputeDecision =
      typeof decisionOrDto === 'string'
        ? decisionOrDto
        : decisionOrDto.decision;

    const existing = await this.escrowRepo.findByOrderId(idStr);
    if (!existing) {
      throw new NotFoundException(`Order ${idStr} not found`);
    }

    if (existing.status !== 'DISPUTED') {
      throw new BadRequestException(
        `Order is in status ${existing.status}, must be DISPUTED to resolve`,
      );
    }

    // Submit signed Arbiter transaction to Solana blockchain
    const res = await this.solanaService.resolveDispute(idStr, decision);

    const finalStatus: EscrowDbStatus = res.status as EscrowDbStatus;
    const resolvedAt = new Date();
    const updated = await this.escrowRepo.markResolved(
      idStr,
      finalStatus,
      res.recipient,
      resolvedAt,
      res.signature,
    );

    await this.escrowRepo.resolveDisputeRecord(
      idStr,
      decision,
      this.solanaService.getArbiterPublicKey().toBase58(),
      res.signature,
    );

    this.escrowGateway.broadcastOrderStatus(idStr, finalStatus, {
      decision,
      recipient: res.recipient,
      signature: res.signature,
      resolvedAt,
    });

    return {
      escrow: updated!,
      signature: res.signature,
      decision,
      status: finalStatus,
      recipient: res.recipient,
    };
  }

  /**
   * Complete escrow (called by buyer or automated settlement worker)
   */
  async completeOrder(orderId: string | number | bigint): Promise<{
    escrow: EscrowEntity;
    signature: string;
  }> {
    const idStr = orderId.toString();
    const existing = await this.escrowRepo.findByOrderId(idStr);
    if (!existing) {
      throw new NotFoundException(`Order ${idStr} not found`);
    }

    const txSig = await this.solanaService.completeEscrow(idStr);
    const completedAt = new Date();
    const updated = await this.escrowRepo.markCompleted(
      idStr,
      completedAt,
      txSig,
    );

    this.escrowGateway.broadcastOrderStatus(idStr, 'COMPLETED', {
      completedAt,
      signature: txSig,
    });

    return { escrow: updated!, signature: txSig };
  }

  /**
   * Sync single order from Solana blockchain to PostgreSQL
   */
  async syncOrderFromChain(orderId: string | number | bigint): Promise<any> {
    const idStr = orderId.toString();
    const account = await this.solanaService.fetchEscrowAccount(idStr);
    if (!account) {
      return null;
    }

    const { escrowPda, vaultPda } = this.solanaService.calculatePdas(idStr);
    const status = this.solanaService.parseStatus(
      account.status,
    ) as EscrowDbStatus;
    const buyer = account.buyer.toBase58();
    const seller = account.seller.toBase58();
    const arbiter = account.arbiter.toBase58();
    const amount = account.amount.toString();
    const timeoutDuration = account.timeoutDuration.toString();

    const deliveredAt =
      account.deliveredAt.toNumber() > 0
        ? new Date(account.deliveredAt.toNumber() * 1000)
        : null;

    let escrow = await this.escrowRepo.findByOrderId(idStr);

    if (!escrow) {
      escrow = await this.escrowRepo.create({
        orderId: idStr,
        buyerWallet: buyer,
        sellerWallet: seller,
        arbiterWallet: arbiter,
        amount,
        status,
        escrowPda,
        vaultPda,
        timeoutDuration,
      });
    } else {
      await this.escrowRepo.updateStatus(idStr, status);
      if (deliveredAt) {
        await this.escrowRepo.markDelivered(idStr, deliveredAt);
      }
      escrow = await this.escrowRepo.findByOrderId(idStr);
    }

    return {
      orderId: idStr,
      buyer,
      seller,
      arbiter,
      amount,
      status,
      deliveredAt,
      escrowPda,
      vaultPda,
    };
  }

  /**
   * Get audit events for order
   */
  async getEvents(orderId: string | number | bigint) {
    return this.escrowRepo.findEventsByOrderId(orderId.toString());
  }

  /**
   * List escrows with filters
   */
  async listOrders(query: QueryEscrowDto) {
    return this.escrowRepo.list(query);
  }
}
