import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { SolanaService } from '../solana/solana.service';
import { EscrowGateway } from '../escrow/escrow.gateway';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';

export interface PaymentIntent {
  id: string;
  order_id: string;
  amount_vnd: string;
  locked_sol_price: string;
  amount_lamports: string;
  max_slippage_bps: number;
  expires_at: Date;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'SLIPPAGE_EXCEEDED';
  payment_method: string;
  qr_payload: string;
  tx_signature?: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  // Default SOL/VND conversion rate: 1 SOL = 3,500,000 VND (~$140 USD)
  private readonly DEFAULT_SOL_VND_RATE = 3500000;

  constructor(
    private readonly db: DatabaseService,
    private readonly solanaService: SolanaService,
    private readonly escrowGateway: EscrowGateway,
  ) {}

  /**
   * Fetch current SOL/VND price (can be extended with CoinGecko or Pyth Oracle)
   */
  public async getCurrentSolVndRate(): Promise<number> {
    const envRate = process.env.SOL_VND_RATE
      ? parseFloat(process.env.SOL_VND_RATE)
      : this.DEFAULT_SOL_VND_RATE;
    return envRate;
  }

  /**
   * Create a 15-minute locked payment intent with VietQR / MoMo payload
   */
  public async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntent> {
    const orderRes = await this.db.query(
      'SELECT * FROM orders WHERE id = $1 LIMIT 1;',
      [dto.orderId],
    );
    const order = orderRes.rows[0];
    if (!order) {
      throw new NotFoundException(`Order #${dto.orderId} not found`);
    }

    const solPriceVnd = await this.getCurrentSolVndRate();
    const solAmount = dto.amountVnd / solPriceVnd;
    const amountLamports = Math.floor(solAmount * 1_000_000_000);

    const intentId = 'pi_' + crypto.randomBytes(12).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window
    const maxSlippageBps = dto.maxSlippageBps || 150; // default 1.5%

    // Build VietQR formatted payload string
    const bankBin = process.env.VIETQR_BANK_BIN || '970422'; // MBBank BIN
    const bankAccount = process.env.VIETQR_ACCOUNT_NO || '0888888888';
    const memo = `ORDER_${dto.orderId}_${intentId.slice(-6)}`;
    const qrPayload = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${dto.amountVnd}&addInfo=${encodeURIComponent(memo)}&accountName=P2P_ESCROW`;

    const query = `
      INSERT INTO payment_intents (
        id,
        order_id,
        amount_vnd,
        locked_sol_price,
        amount_lamports,
        max_slippage_bps,
        expires_at,
        status,
        payment_method,
        qr_payload,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      intentId,
      dto.orderId,
      dto.amountVnd,
      solPriceVnd,
      amountLamports,
      maxSlippageBps,
      expiresAt,
      dto.paymentMethod || 'VIETQR',
      qrPayload,
    ];

    const res = await this.db.query<PaymentIntent>(query, values);
    return res.rows[0];
  }

  /**
   * Ingest webhook from VietQR or MoMo with Idempotency and Slippage check
   */
  public async processPaymentWebhook(
    provider: 'VIETQR' | 'MOMO',
    payload: Record<string, any>,
  ): Promise<{ success: boolean; message: string; txSignature?: string }> {
    const rawTxId =
      payload.transactionId ||
      payload.transId ||
      payload.orderId ||
      payload.id ||
      payload.reference;

    if (!rawTxId) {
      throw new BadRequestException(
        'Webhook payload missing transaction identifier.',
      );
    }

    // 1. Idempotency Check: prevent duplicate webhook ingestion
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${provider}_${rawTxId}`)
      .digest('hex');

    const checkProcessed = await this.db.query(
      'SELECT id FROM processed_webhooks WHERE id = $1 LIMIT 1;',
      [idempotencyKey],
    );

    if (checkProcessed.rows.length > 0) {
      this.logger.log(
        `Webhook ${idempotencyKey} already processed. Returning 200 OK.`,
      );
      return {
        success: true,
        message: 'Webhook duplicate already processed (Idempotent OK).',
      };
    }

    // 2. Parse memo / order context
    const memo = (
      payload.description ||
      payload.content ||
      payload.orderInfo ||
      ''
    ).toString();
    const memoMatch = memo.match(/ORDER_(\d+)/i);
    const orderId = payload.orderId || (memoMatch ? memoMatch[1] : null);

    if (!orderId) {
      throw new BadRequestException(
        'Cannot correlate payment webhook with orderId.',
      );
    }

    // 3. Atomically lock and process inside a transaction
    return await this.db.withTransaction(async (client) => {
      // Find latest pending payment intent for this order
      const intentRes = await client.query(
        `SELECT * FROM payment_intents 
         WHERE order_id = $1 AND status = 'PENDING' 
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE;`,
        [orderId],
      );

      const intent: PaymentIntent = intentRes.rows[0];
      if (!intent) {
        throw new BadRequestException(
          `No active pending payment intent for order #${orderId}`,
        );
      }

      // Check Expiration: max 15 minutes
      if (new Date() > new Date(intent.expires_at)) {
        await client.query(
          `UPDATE payment_intents SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1;`,
          [intent.id],
        );
        throw new BadRequestException(
          'Payment intent has expired (15m window passed). Refund VND required.',
        );
      }

      // Check Slippage: verify current price hasn't deviated beyond allowed threshold
      const currentRate = await this.getCurrentSolVndRate();
      const lockedRate = parseFloat(intent.locked_sol_price);
      const deviationBps =
        Math.abs((currentRate - lockedRate) / lockedRate) * 10000;

      if (deviationBps > intent.max_slippage_bps) {
        await client.query(
          `UPDATE payment_intents SET status = 'SLIPPAGE_EXCEEDED', updated_at = NOW() WHERE id = $1;`,
          [intent.id],
        );
        throw new BadRequestException(
          `Slippage exceeded (${(deviationBps / 100).toFixed(2)}% > ${(intent.max_slippage_bps / 100).toFixed(2)}%). Escrow locked aborted.`,
        );
      }

      // 4. Fetch order details to execute Relayer on-chain initialization
      const orderRes = await client.query(
        'SELECT * FROM orders WHERE id = $1 LIMIT 1;',
        [orderId],
      );
      const order = orderRes.rows[0];

      // Execute on-chain initialization via Relayer
      const txSig = await this.solanaService.initializeEscrow(
        orderId,
        intent.amount_lamports,
        order.buyer_wallet,
        order.seller_wallet,
      );

      // Update payment intent to COMPLETED
      await client.query(
        `UPDATE payment_intents 
         SET status = 'COMPLETED', tx_signature = $2, updated_at = NOW() 
         WHERE id = $1;`,
        [intent.id, txSig],
      );

      // Update order status to LOCKED
      await client.query(
        `UPDATE orders 
         SET status = 'LOCKED', tx_signature = $2, updated_at = NOW() 
         WHERE id = $1;`,
        [orderId, txSig],
      );

      // Record in processed_webhooks for idempotency
      await client.query(
        `INSERT INTO processed_webhooks (id, provider, resource_id, payload, status, processed_at)
         VALUES ($1, $2, $3, $4, 'PROCESSED', NOW());`,
        [idempotencyKey, provider, intent.id, JSON.stringify(payload)],
      );

      // Broadcast WebSocket notification to buyer/seller
      this.escrowGateway.broadcastOrderStatus(orderId, 'LOCKED', {
        amountLamports: intent.amount_lamports,
        txSignature: txSig,
        fiatPayment: {
          provider,
          amountVnd: intent.amount_vnd,
        },
      });

      return {
        success: true,
        message:
          'Payment received. Relayer successfully locked escrow on-chain.',
        txSignature: txSig,
      };
    });
  }

  public async getPaymentIntent(
    intentId: string,
  ): Promise<PaymentIntent | null> {
    const res = await this.db.query<PaymentIntent>(
      'SELECT * FROM payment_intents WHERE id = $1 LIMIT 1;',
      [intentId],
    );
    return res.rows[0] || null;
  }
}
