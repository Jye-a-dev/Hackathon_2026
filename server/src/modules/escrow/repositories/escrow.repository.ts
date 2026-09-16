import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  EscrowEntity,
  EscrowDbStatus,
  EscrowEventEntity,
  DisputeEntity,
} from '../entities/escrow.entity';
import { QueryEscrowDto } from '../dto/query-escrow.dto';

@Injectable()
export class EscrowRepository {
  private readonly logger = new Logger(EscrowRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Upsert users and create/update order record
   */
  async create(data: {
    orderId: string;
    buyerWallet: string;
    sellerWallet: string;
    arbiterWallet: string;
    amount: string;
    status?: EscrowDbStatus;
    escrowPda: string;
    vaultPda: string;
    trackingCode?: string;
    timeoutDuration?: string;
    txSignature?: string;
  }): Promise<EscrowEntity> {
    // 1. Ensure buyer and seller exist in users table
    try {
      await this.db.query(
        `INSERT INTO users (wallet_address, role) VALUES ($1, 'BUYER') ON CONFLICT (wallet_address) DO NOTHING;`,
        [data.buyerWallet],
      );
      await this.db.query(
        `INSERT INTO users (wallet_address, role) VALUES ($1, 'SELLER') ON CONFLICT (wallet_address) DO NOTHING;`,
        [data.sellerWallet],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to auto-upsert users: ${msg}`);
    }

    // 2. Insert or update in orders table
    const query = `
      INSERT INTO orders (
        id,
        buyer_id,
        seller_id,
        buyer_wallet,
        seller_wallet,
        arbiter_wallet,
        amount_lamports,
        status,
        escrow_pda,
        vault_pda,
        tracking_code,
        timeout_duration,
        tx_signature,
        created_at,
        updated_at
      ) VALUES (
        $1,
        (SELECT id FROM users WHERE wallet_address = $2 LIMIT 1),
        (SELECT id FROM users WHERE wallet_address = $3 LIMIT 1),
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        buyer_wallet = EXCLUDED.buyer_wallet,
        seller_wallet = EXCLUDED.seller_wallet,
        arbiter_wallet = EXCLUDED.arbiter_wallet,
        amount_lamports = EXCLUDED.amount_lamports,
        status = EXCLUDED.status,
        escrow_pda = EXCLUDED.escrow_pda,
        vault_pda = EXCLUDED.vault_pda,
        tracking_code = COALESCE(EXCLUDED.tracking_code, orders.tracking_code),
        timeout_duration = EXCLUDED.timeout_duration,
        tx_signature = COALESCE(EXCLUDED.tx_signature, orders.tx_signature),
        updated_at = NOW()
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;

    const values = [
      data.orderId,
      data.buyerWallet,
      data.sellerWallet,
      data.arbiterWallet,
      data.amount,
      data.status || 'LOCKED',
      data.escrowPda,
      data.vaultPda,
      data.trackingCode || null,
      data.timeoutDuration || '172800',
      data.txSignature || null,
    ];

    const res = await this.db.query<EscrowEntity>(query, values);
    return res.rows[0];
  }

  async findByOrderId(orderId: string): Promise<EscrowEntity | null> {
    const res = await this.db.query<EscrowEntity>(
      'SELECT *, id AS order_id, amount_lamports AS amount FROM orders WHERE id = $1 LIMIT 1;',
      [orderId],
    );
    return res.rows[0] || null;
  }

  async findByTrackingCode(trackingCode: string): Promise<EscrowEntity | null> {
    const res = await this.db.query<EscrowEntity>(
      'SELECT *, id AS order_id, amount_lamports AS amount FROM orders WHERE tracking_code = $1 LIMIT 1;',
      [trackingCode],
    );
    return res.rows[0] || null;
  }

  async updateStatus(
    orderId: string,
    status: EscrowDbStatus,
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = $2,
          tx_signature = COALESCE($3, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      status,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async markDelivered(
    orderId: string,
    deliveredAt: Date = new Date(),
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = 'DELIVERED',
          delivered_at = $2,
          tx_signature = COALESCE($3, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      deliveredAt,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async markCompleted(
    orderId: string,
    completedAt: Date = new Date(),
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = 'COMPLETED',
          completed_at = $2,
          tx_signature = COALESCE($3, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      completedAt,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async markDisputed(
    orderId: string,
    disputedAt: Date = new Date(),
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = 'DISPUTED',
          disputed_at = $2,
          tx_signature = COALESCE($3, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      disputedAt,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async markResolved(
    orderId: string,
    status: EscrowDbStatus,
    recipient: string,
    resolvedAt: Date = new Date(),
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = $2,
          resolution_recipient = $3,
          resolved_at = $4,
          tx_signature = COALESCE($5, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      status,
      recipient,
      resolvedAt,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async findExpiredDeliveredOrders(): Promise<EscrowEntity[]> {
    const query = `
      SELECT *, id AS order_id, amount_lamports AS amount
      FROM orders
      WHERE status = 'DELIVERED'
        AND delivered_at IS NOT NULL
        AND NOW() >= (delivered_at + (timeout_duration || ' seconds')::interval)
      ORDER BY delivered_at ASC
      LIMIT 20;
    `;
    const res = await this.db.query<EscrowEntity>(query);
    return res.rows;
  }

  async createDispute(data: {
    orderId: string;
    buyerWallet?: string;
    reason?: string;
    evidenceUrl?: string;
    evidenceUrls?: string[];
    txSignature?: string;
  }): Promise<DisputeEntity> {
    let urls: string[] = [];
    if (data.evidenceUrls && data.evidenceUrls.length > 0) {
      urls = data.evidenceUrls;
    } else if (data.evidenceUrl) {
      urls = [data.evidenceUrl];
    }

    const query = `
      INSERT INTO disputes (
        order_id,
        buyer_wallet,
        reason,
        evidence_urls,
        resolution_status,
        tx_signature,
        created_at
      ) VALUES ($1, $2, $3, $4, 'PENDING', $5, NOW())
      RETURNING *;
    `;
    const res = await this.db.query<DisputeEntity>(query, [
      data.orderId,
      data.buyerWallet || null,
      data.reason || null,
      urls,
      data.txSignature || null,
    ]);
    return res.rows[0];
  }

  async markRefunded(
    orderId: string,
    refundedAt: Date = new Date(),
    txSignature?: string,
  ): Promise<EscrowEntity | null> {
    const query = `
      UPDATE orders
      SET status = 'REFUNDED',
          resolved_at = $2,
          tx_signature = COALESCE($3, tx_signature),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *, id AS order_id, amount_lamports AS amount;
    `;
    const res = await this.db.query<EscrowEntity>(query, [
      orderId,
      refundedAt,
      txSignature || null,
    ]);
    return res.rows[0] || null;
  }

  async attachEvidence(
    orderId: string,
    evidenceUrls: string[],
    reason?: string,
  ): Promise<DisputeEntity> {
    const checkRes = await this.db.query<DisputeEntity>(
      'SELECT * FROM disputes WHERE order_id = $1 LIMIT 1;',
      [orderId],
    );

    if (checkRes.rows[0]) {
      const query = `
        UPDATE disputes
        SET evidence_urls = array_cat(COALESCE(evidence_urls, ARRAY[]::TEXT[]), $2::TEXT[]),
            reason = COALESCE($3, reason)
        WHERE order_id = $1
        RETURNING *;
      `;
      const res = await this.db.query<DisputeEntity>(query, [
        orderId,
        evidenceUrls,
        reason || null,
      ]);
      return res.rows[0];
    } else {
      return this.createDispute({
        orderId,
        evidenceUrls,
        reason,
      });
    }
  }

  async listDisputes(status?: string): Promise<DisputeEntity[]> {
    let query = `
      SELECT d.*, o.amount_lamports, o.buyer_wallet, o.seller_wallet, o.status as order_status
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
    `;
    const params: any[] = [];
    if (status) {
      query += ` WHERE d.resolution_status = $1`;
      params.push(status);
    }
    query += ` ORDER BY d.created_at DESC;`;
    const res = await this.db.query<DisputeEntity>(query, params);
    return res.rows;
  }

  async resolveDisputeRecord(
    orderId: string,
    decision: string,
    resolvedBy: string,
    txSignature?: string,
  ): Promise<void> {
    const query = `
      UPDATE disputes
      SET decision = $2,
          resolution_status = 'RESOLVED',
          resolved_by = $3,
          tx_signature = COALESCE($4, tx_signature),
          resolved_at = NOW()
      WHERE order_id = $1;
    `;
    await this.db.query(query, [
      orderId,
      decision,
      resolvedBy,
      txSignature || null,
    ]);
  }

  async saveEvent(
    orderId: string,
    eventName: string,
    data: any,
    signature?: string,
    slot?: number,
  ): Promise<void> {
    const query = `
      INSERT INTO escrow_events (
        order_id,
        event_name,
        signature,
        slot,
        data,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW());
    `;
    await this.db.query(query, [
      orderId,
      eventName,
      signature || null,
      slot ? slot.toString() : null,
      JSON.stringify(data),
    ]);
  }

  async findEventsByOrderId(orderId: string): Promise<EscrowEventEntity[]> {
    const res = await this.db.query<EscrowEventEntity>(
      'SELECT * FROM escrow_events WHERE order_id = $1 ORDER BY created_at ASC;',
      [orderId],
    );
    return res.rows;
  }

  async list(
    filters: QueryEscrowDto,
  ): Promise<{ total: number; data: EscrowEntity[] }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.buyerWallet) {
      conditions.push(`buyer_wallet = $${idx++}`);
      params.push(filters.buyerWallet);
    }

    if (filters.sellerWallet) {
      conditions.push(`seller_wallet = $${idx++}`);
      params.push(filters.sellerWallet);
    }

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders ${whereClause};`,
      params,
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const limit = Math.min(filters.limit || 50, 100);
    const offset = filters.offset || 0;

    const dataQuery = `
      SELECT *, id AS order_id, amount_lamports AS amount
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;
    params.push(limit, offset);

    const dataRes = await this.db.query<EscrowEntity>(dataQuery, params);

    return { total, data: dataRes.rows };
  }
}
